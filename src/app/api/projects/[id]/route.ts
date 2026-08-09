import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const projectInclude = {
  area: true,
  tags: true,
  nextActionTask: true,
  tasks: { include: { tags: true } },
} satisfies Prisma.ProjectInclude;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      ...projectInclude,
      activities: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Prisma.ProjectUpdateInput = {};
  const scalarFields = [
    "name",
    "description",
    "color",
    "icon",
    "status",
    "priority",
    "startDate",
    "targetDate",
    "progress",
    "progressMode",
    "areaId",
    "archived",
    "nextActionTaskId",
  ] as const;

  for (const field of scalarFields) {
    if (field in body) {
      // @ts-expect-error dynamic assignment across a known-safe field union
      data[field] = body[field];
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

  const project = await prisma.project.update({
    where: { id },
    data,
    include: projectInclude,
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
