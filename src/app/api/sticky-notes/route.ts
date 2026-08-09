import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultNextAlertAt, pickStickyColor } from "@/lib/sticky-note-utils";

export async function GET(req: NextRequest) {
  const activeOnly = req.nextUrl.searchParams.get("active") !== "false";
  const dueOnly = req.nextUrl.searchParams.get("due") === "true";

  const notes = await prisma.stickyNote.findMany({
    where: {
      ...(activeOnly ? { dismissed: false } : {}),
      ...(dueOnly ? { dismissed: false, nextAlertAt: { lte: new Date() } } : {}),
    },
    orderBy: [{ dismissed: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const content = String(body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const count = await prisma.stickyNote.count({ where: { dismissed: false } });
  const now = new Date();

  const note = await prisma.stickyNote.create({
    data: {
      content,
      color: body.color ?? pickStickyColor(count),
      nextAlertAt: defaultNextAlertAt(now),
    },
  });

  return NextResponse.json(note, { status: 201 });
}
