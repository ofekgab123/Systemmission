import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { expandEventOccurrences } from "@/lib/recurrence";
import type { CalendarEventWithRelations, EventOccurrence } from "@/types";

const eventInclude = {
  category: true,
  area: true,
} satisfies Prisma.CalendarEventInclude;

function toOccurrences(
  event: CalendarEventWithRelations,
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  const recurring = event.recurrencePattern !== null;
  return expandEventOccurrences(event, rangeStart, rangeEnd).map(({ start, end }) => ({
    ...event,
    start,
    end,
    occurrenceId: recurring ? `${event.id}:${start.toISOString()}` : event.id,
    occurrenceStart: start.toISOString(),
    isRecurring: recurring,
    seriesStart: event.start,
    seriesEnd: event.end,
  }));
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "חסר טווח תאריכים" }, { status: 400 });
  }

  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);

  const where: Prisma.CalendarEventWhereInput = {
    OR: [
      // One-off events (including edited occurrences of a series) in range
      { recurrencePattern: null, start: { lte: rangeEnd }, end: { gte: rangeStart } },
      // Recurring masters that may produce occurrences in range
      { recurrencePattern: { not: null }, start: { lte: rangeEnd } },
    ],
  };

  const areaId = params.get("areaId");
  if (areaId) where.areaId = areaId;

  const events = await prisma.calendarEvent.findMany({
    where,
    include: eventInclude,
  });

  const occurrences = events
    .flatMap((event) => toOccurrences(event, rangeStart, rangeEnd))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return NextResponse.json(occurrences);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.title?.trim() || !body.start || !body.end) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }

  const start = new Date(body.start);
  const end = new Date(body.end);
  if (end < start) {
    return NextResponse.json({ error: "שעת הסיום לפני שעת ההתחלה" }, { status: 400 });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title: body.title.trim(),
      description: body.description ?? null,
      location: body.location ?? null,
      start,
      end,
      allDay: body.allDay ?? false,
      showAs: body.showAs ?? "BUSY",
      reminderMinutes: body.reminderMinutes ?? null,
      recurrencePattern: body.recurrencePattern ?? null,
      recurrenceInterval: body.recurrenceInterval ?? 1,
      recurrenceWeekdays: body.recurrenceWeekdays ?? [],
      recurrenceUntil: body.recurrenceUntil ? new Date(body.recurrenceUntil) : null,
      recurrenceCount: body.recurrenceCount ?? null,
      categoryId: body.categoryId ?? null,
      areaId: body.areaId ?? null,
    },
    include: eventInclude,
  });

  return NextResponse.json(event, { status: 201 });
}
