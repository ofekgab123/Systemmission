import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const projectInclude = {
  area: true,
  tags: true,
  nextActionTask: true,
  tasks: true,
} satisfies Prisma.ProjectInclude;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const where: Prisma.ProjectWhereInput = {};

  if (params.get("archived") !== "true") where.archived = false;

  const areaId = params.get("areaId");
  if (areaId) where.areaId = areaId;

  const status = params.get("status");
  if (status) where.status = { in: status.split(",") as never };

  const projects = await prisma.project.findMany({
    where,
    include: projectInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      color: body.color ?? "#6366f1",
      icon: body.icon ?? "Folder",
      status: body.status ?? "PLANNING",
      priority: body.priority ?? "P2",
      startDate: body.startDate ?? null,
      targetDate: body.targetDate ?? null,
      progressMode: body.progressMode ?? "AUTOMATIC",
      areaId: body.areaId ?? null,
      activities: { create: { type: "CREATED", message: "הקטגוריה נוצרה" } },
    },
    include: projectInclude,
  });

  return NextResponse.json(project, { status: 201 });
}
