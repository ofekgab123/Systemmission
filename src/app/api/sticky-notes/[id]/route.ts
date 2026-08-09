import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultNextAlertAt, snoozeUntil } from "@/lib/sticky-note-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.content === "string") {
    const content = body.content.trim();
    if (!content) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }
    data.content = content;
  }

  if (typeof body.dismissed === "boolean") {
    data.dismissed = body.dismissed;
  }

  if (body.action === "dismiss") {
    data.dismissed = true;
  }

  if (body.action === "snooze") {
    const minutes = Number(body.minutes);
    if (!Number.isFinite(minutes)) {
      return NextResponse.json({ error: "Invalid snooze duration" }, { status: 400 });
    }
    data.nextAlertAt = snoozeUntil(minutes);
    data.dismissed = false;
  }

  if (body.action === "reset-alert") {
    data.nextAlertAt = defaultNextAlertAt();
    data.dismissed = false;
  }

  if (body.nextAlertAt) {
    data.nextAlertAt = new Date(body.nextAlertAt);
  }

  const note = await prisma.stickyNote.update({
    where: { id },
    data,
  });

  return NextResponse.json(note);
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await prisma.stickyNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
