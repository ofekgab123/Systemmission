import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const taskInclude = {
  project: { include: { area: true } },
  area: true,
  tags: true,
  subtasks: true,
  isNextActionFor: true,
  activities: {
    where: { type: "NOTE_ADDED" },
    select: { id: true },
  },
} satisfies Prisma.TaskInclude;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ tasks: [], projects: [] });

  const areaId = params.get("areaId");
  const areaFilter = areaId ? { areaId } : {};

  const textFilter = { contains: q, mode: "insensitive" as const };

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...areaFilter,
        status: { notIn: ["CANCELLED"] },
        OR: [
          { title: textFilter },
          { description: textFilter },
          { waitingFor: textFilter },
          { blockedReason: textFilter },
          { subtasks: { some: { title: textFilter } } },
          {
            activities: {
              some: {
                type: "NOTE_ADDED",
                message: textFilter,
              },
            },
          },
        ],
      },
      include: taskInclude,
      take: 30,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({
      where: {
        ...areaFilter,
        OR: [{ name: textFilter }, { description: textFilter }],
      },
      include: { tasks: true },
      take: 10,
    }),
  ]);

  return NextResponse.json({ tasks, projects });
}
