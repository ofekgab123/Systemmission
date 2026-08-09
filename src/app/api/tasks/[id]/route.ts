import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { TASK_STATUS_META } from "@/lib/task-meta";

const taskInclude = {
  project: { include: { area: true } },
  area: true,
  tags: true,
  subtasks: true,
  isNextActionFor: true,
} satisfies Prisma.TaskInclude;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      ...taskInclude,
      activities: { orderBy: { createdAt: "desc" }, take: 30 },
    },
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
    "projectId",
    "areaId",
    "parentTaskId",
  ] as const;

  for (const field of scalarFields) {
    if (field in body) {
      // @ts-expect-error dynamic assignment across a known-safe field union
      data[field] = body[field];
    }
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
      const label = TASK_STATUS_META[body.status as keyof typeof TASK_STATUS_META]?.label ?? body.status;
      activities.push({
        type: "STATUS_CHANGED",
        message: `הסטטוס שונה ל-${label}`,
      });
    }
    // Clear stale waiting/blocked context when leaving those states.
    if (existing.status === "WAITING" && body.status !== "WAITING") {
      data.waitingFor = null;
      data.followUpDate = null;
    }
    if (existing.status === "BLOCKED" && body.status !== "BLOCKED") {
      data.blockedReason = null;
    }
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

  const task = await prisma.task.update({
    where: { id },
    data,
    include: taskInclude,
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
