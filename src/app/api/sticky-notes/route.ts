import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultNextAlertAt, pickStickyColor } from "@/lib/sticky-note-utils";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const dueOnly = params.get("due") === "true";
  const areaId = params.get("areaId");

  const notes = await prisma.stickyNote.findMany({
    where: {
      ...(dueOnly ? { nextAlertAt: { lte: new Date() } } : {}),
      ...(areaId ? { areaId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const content = String(body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const count = await prisma.stickyNote.count();
  const now = new Date();

  const note = await prisma.stickyNote.create({
    data: {
      content,
      color: body.color ?? pickStickyColor(count),
      nextAlertAt: defaultNextAlertAt(now),
      areaId: body.areaId ?? null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
