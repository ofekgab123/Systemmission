import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { startOfToday, endOfToday, nextNDays } from "@/lib/date-utils";

const taskInclude = {
  project: { include: { area: true } },
  area: true,
  tags: true,
  subtasks: true,
  isNextActionFor: true,
} satisfies Prisma.TaskInclude;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const where: Prisma.TaskWhereInput = {};

  const status = params.get("status");
  if (status) where.status = { in: status.split(",") as never };

  const excludeStatus = params.get("excludeStatus");
  if (excludeStatus) {
    where.status = { notIn: excludeStatus.split(",") as never };
  }

  const projectId = params.get("projectId");
  if (projectId) where.projectId = projectId;

  const areaId = params.get("areaId");
  if (areaId) where.areaId = areaId;

  const parentTaskId = params.get("parentTaskId");
  if (parentTaskId) where.parentTaskId = parentTaskId;

  if (params.get("topLevel") === "true") where.parentTaskId = null;

  const view = params.get("view");
  if (view === "today") {
    where.OR = [
      { dueDate: { gte: startOfToday(), lte: endOfToday() } },
      { scheduledAt: { gte: startOfToday(), lte: endOfToday() } },
    ];
    where.status = { notIn: ["DONE", "CANCELLED"] };
  } else if (view === "overdue") {
    where.dueDate = { lt: startOfToday() };
    where.status = { notIn: ["DONE", "CANCELLED"] };
  } else if (view === "upcoming") {
    where.dueDate = { gte: startOfToday(), lte: nextNDays(7) };
    where.status = { notIn: ["DONE", "CANCELLED"] };
  } else if (view === "waiting") {
    where.status = "WAITING";
  } else if (view === "blocked") {
    where.status = "BLOCKED";
  } else if (view === "inbox") {
    where.status = "INBOX";
  } else if (view === "no-deadline") {
    where.dueDate = null;
    where.status = { notIn: ["DONE", "CANCELLED", "SOMEDAY"] };
  } else if (view === "completed") {
    where.status = "DONE";
  } else if (view === "calendar") {
    const from = params.get("from");
    const to = params.get("to");
    if (from && to) {
      where.OR = [
        { dueDate: { gte: new Date(from), lte: new Date(to) } },
        { scheduledAt: { gte: new Date(from), lte: new Date(to) } },
      ];
    }
    where.status = { notIn: ["CANCELLED"] };
  }

  const q = params.get("q");
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const tag = params.get("tag");
  if (tag) where.tags = { some: { name: tag } };

  const limit = params.get("limit");

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: limit ? parseInt(limit, 10) : undefined,
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const tagNames: string[] = body.tagNames ?? [];
  const tags = tagNames.length
    ? await Promise.all(
        tagNames.map((name) =>
          prisma.tag.upsert({
            where: { name },
            create: { name },
            update: {},
          })
        )
      )
    : [];

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "READY",
      priority: body.priority ?? "P3",
      impact: body.impact ?? null,
      urgency: body.urgency ?? null,
      energy: body.energy ?? null,
      category: body.category ?? null,
      estimatedMinutes: body.estimatedMinutes ?? null,
      startDate: body.startDate ?? null,
      dueDate: body.dueDate ?? null,
      scheduledAt: body.scheduledAt ?? null,
      waitingFor: body.waitingFor ?? null,
      followUpDate: body.followUpDate ?? null,
      blockedReason: body.blockedReason ?? null,
      projectId: body.projectId ?? null,
      areaId: body.areaId ?? null,
      parentTaskId: body.parentTaskId ?? null,
      ...(body.createdAt ? { createdAt: new Date(body.createdAt) } : {}),
      tags: tags.length ? { connect: tags.map((t) => ({ id: t.id })) } : undefined,
      activities: {
        create: { type: "CREATED", message: "המשימה נוצרה" },
      },
    },
    include: taskInclude,
  });

  return NextResponse.json(task, { status: 201 });
}
