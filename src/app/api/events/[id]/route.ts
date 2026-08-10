import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const eventInclude = {
  category: true,
  area: true,
} satisfies Prisma.CalendarEventInclude;

const PATCHABLE_FIELDS = [
  "title",
  "description",
  "location",
  "allDay",
  "showAs",
  "reminderMinutes",
  "categoryId",
  "areaId",
] as const;

function scalarUpdates(body: Record<string, unknown>): Prisma.CalendarEventUncheckedUpdateInput {
  const data: Prisma.CalendarEventUncheckedUpdateInput = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) {
      // @ts-expect-error dynamic assignment across a known-safe field union
      data[field] = body[field];
    }
  }
  if ("start" in body && body.start) data.start = new Date(body.start as string);
  if ("end" in body && body.end) data.end = new Date(body.end as string);
  return data;
}

function recurrenceUpdates(body: Record<string, unknown>): Prisma.CalendarEventUncheckedUpdateInput {
  const data: Prisma.CalendarEventUncheckedUpdateInput = {};
  if ("recurrencePattern" in body) {
    data.recurrencePattern = (body.recurrencePattern as never) ?? null;
    data.recurrenceInterval = (body.recurrenceInterval as number) ?? 1;
    data.recurrenceWeekdays = (body.recurrenceWeekdays as number[]) ?? [];
    data.recurrenceUntil = body.recurrenceUntil ? new Date(body.recurrenceUntil as string) : null;
    data.recurrenceCount = (body.recurrenceCount as number) ?? null;
    // Changing the recurrence rule resets per-occurrence deletions
    data.recurrenceExceptions = [];
  }
  return data;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.calendarEvent.findUnique({
    where: { id },
    include: eventInclude,
  });
  if (!event) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const scope = body.scope as "occurrence" | "series" | undefined;

  // Editing a single occurrence of a recurring series: hide the original
  // occurrence on the master and materialize a standalone exception event.
  if (scope === "occurrence" && existing.recurrencePattern && body.occurrenceStart) {
    const occurrenceStart = new Date(body.occurrenceStart);
    const durationMs = existing.end.getTime() - existing.start.getTime();

    const [, exception] = await prisma.$transaction([
      prisma.calendarEvent.update({
        where: { id },
        data: { recurrenceExceptions: { push: occurrenceStart } },
      }),
      prisma.calendarEvent.create({
        data: {
          title: (body.title ?? existing.title) as string,
          description: (body.description !== undefined ? body.description : existing.description) as string | null,
          location: (body.location !== undefined ? body.location : existing.location) as string | null,
          start: body.start ? new Date(body.start) : occurrenceStart,
          end: body.end
            ? new Date(body.end)
            : new Date(occurrenceStart.getTime() + durationMs),
          allDay: (body.allDay ?? existing.allDay) as boolean,
          showAs: (body.showAs ?? existing.showAs) as never,
          reminderMinutes: (body.reminderMinutes !== undefined
            ? body.reminderMinutes
            : existing.reminderMinutes) as number | null,
          categoryId: (body.categoryId !== undefined ? body.categoryId : existing.categoryId) as
            | string
            | null,
          areaId: existing.areaId,
          seriesId: existing.id,
          originalStart: occurrenceStart,
        },
        include: eventInclude,
      }),
    ]);

    return NextResponse.json(exception);
  }

  const data = { ...scalarUpdates(body), ...recurrenceUpdates(body) };

  const event = await prisma.calendarEvent.update({
    where: { id },
    data,
    include: eventInclude,
  });

  return NextResponse.json(event);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const scope = searchParams.get("scope");
  const occurrenceStart = searchParams.get("occurrenceStart");

  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  if (scope === "occurrence" && existing.recurrencePattern && occurrenceStart) {
    await prisma.calendarEvent.update({
      where: { id },
      data: { recurrenceExceptions: { push: new Date(occurrenceStart) } },
    });
    return NextResponse.json({ ok: true });
  }

  // Deleting a series master cascades to its materialized exceptions.
  await prisma.calendarEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
