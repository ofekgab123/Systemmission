import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { attachmentCreates, parseImageUploads } from "@/lib/task-attachments";

const taskDetailInclude = {
  project: { include: { area: true } },
  area: true,
  tags: true,
  subtasks: {
    include: {
      attachments: { orderBy: { createdAt: "desc" as const } },
    },
  },
  isNextActionFor: true,
  attachments: { orderBy: { createdAt: "desc" as const } },
  activities: { orderBy: { createdAt: "desc" as const }, take: 30 },
} satisfies Prisma.TaskInclude;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity || activity.type !== "NOTE_ADDED" || !activity.taskId) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  const message =
    typeof body.message === "string" ? body.message.trim() : activity.message;
  const images = parseImageUploads(body.images);

  if (!message && images.length === 0) {
    return NextResponse.json({ error: "Empty note" }, { status: 400 });
  }

  await prisma.activity.update({
    where: { id },
    data: { message: message || activity.message },
  });

  if (images.length) {
    await prisma.taskAttachment.createMany({
      data: attachmentCreates(activity.taskId, images, id),
    });
  }

  const task = await prisma.task.findUnique({
    where: { id: activity.taskId },
    include: taskDetailInclude,
  });

  return NextResponse.json(task);
}
