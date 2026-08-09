import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getTaskStatusMeta } from "@/lib/task-meta";
import { attachmentCreates, parseImageUploads } from "@/lib/task-attachments";

const taskInclude = {
  project: { include: { area: true } },
  area: true,
  tags: true,
  subtasks: true,
  isNextActionFor: true,
} satisfies Prisma.TaskInclude;

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: taskDetailInclude,
  });
  if (!task) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const data: Prisma.TaskUpdateInput = {};
  const activities: Prisma.ActivityCreateWithoutTaskInput[] = [];
  const images = parseImageUploads(body.images);
  let noteActivityId: string | null = null;

  const scalarFields = [
    "title",
    "description",
    "priority",
    "impact",
    "urgency",
    "energy",
    "category",
    "estimatedMinutes",
    "actualMinutes",
    "startDate",
    "dueDate",
    "scheduledAt",
    "waitingFor",
    "followUpDate",
    "blockedReason",
    "somedayReason",
    "projectId",
    "areaId",
    "parentTaskId",
    "recurrencePattern",
    "recurrenceWeekday",
  ] as const;

  for (const field of scalarFields) {
    if (field in body) {
      // @ts-expect-error dynamic assignment across a known-safe field union
      data[field] = body[field];
    }
  }

  if ("recurrencePattern" in body && body.recurrencePattern !== "WEEKDAY") {
    data.recurrenceWeekday = null;
  }

  if ("status" in body && body.status !== existing.status) {
    data.status = body.status;
    if (body.status === "DONE") {
      data.completedAt = new Date();
      activities.push({ type: "COMPLETED", message: "סומן כהושלם" });
    } else if (existing.status === "DONE") {
      data.completedAt = null;
      activities.push({ type: "REOPENED", message: "נפתח מחדש" });
    } else {
      const label = getTaskStatusMeta(body.status).label;
      activities.push({
        type: "STATUS_CHANGED",
        message: `הסטטוס שונה ל-${label}`,
      });
    }
    if (existing.status === "WAITING" && body.status !== "WAITING") {
      data.waitingFor = null;
      data.followUpDate = null;
    }
    if (existing.status === "BLOCKED" && body.status !== "BLOCKED") {
      data.blockedReason = null;
    }
    if (existing.status === "SOMEDAY" && body.status !== "SOMEDAY") {
      data.somedayReason = null;
    }
    if (body.status === "SOMEDAY" && "somedayReason" in body) {
      data.somedayReason = body.somedayReason ?? null;
    }
  }

  if ("note" in body && typeof body.note === "string" && body.note.trim()) {
    const noteActivity = await prisma.activity.create({
      data: {
        taskId: id,
        type: "NOTE_ADDED",
        message: body.note.trim(),
      },
    });
    noteActivityId = noteActivity.id;
  }

  if ("tagNames" in body) {
    const tagNames: string[] = body.tagNames ?? [];
    const tags = tagNames.length
      ? await Promise.all(
          tagNames.map((name: string) =>
            prisma.tag.upsert({ where: { name }, create: { name }, update: {} })
          )
        )
      : [];
    data.tags = { set: tags.map((t) => ({ id: t.id })) };
  }

  if (activities.length) {
    data.activities = { create: activities };
  }

  await prisma.task.update({
    where: { id },
    data,
  });

  if (images.length) {
    await prisma.taskAttachment.createMany({
      data: attachmentCreates(id, images, noteActivityId),
    });
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: taskDetailInclude,
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.task.findUnique({
    where: { id },
    include: { subtasks: { select: { id: true } } },
  });
  if (!existing) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  if (existing.status === "CANCELLED") return NextResponse.json({ ok: true });

  const idsToCancel = [id, ...existing.subtasks.map((subtask) => subtask.id)];

  await prisma.project.updateMany({
    where: { nextActionTaskId: { in: idsToCancel } },
    data: { nextActionTaskId: null },
  });

  await prisma.task.updateMany({
    where: { id: { in: idsToCancel }, status: { not: "CANCELLED" } },
    data: { status: "CANCELLED" },
  });

  await prisma.activity.createMany({
    data: idsToCancel.map((taskId) => ({
      taskId,
      type: "STATUS_CHANGED" as const,
      message:
        taskId === id
          ? "המשימה בוטלה"
          : "תת-משימה בוטלה עקב ביטול המשימה הראשית",
    })),
  });

  return NextResponse.json({ ok: true });
}
