import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const area = await prisma.area.findUnique({
    where: { id },
    include: {
      projects: { include: { tasks: true, tags: true } },
      tasks: { where: { projectId: null }, include: { tags: true } },
    },
  });
  if (!area) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(area);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Prisma.AreaUpdateInput = {};
  const scalarFields = ["name", "icon", "color", "description", "archived"] as const;
  for (const field of scalarFields) {
    if (field in body) {
      (data as Record<string, unknown>)[field] = body[field];
    }
  }

  const area = await prisma.area.update({
    where: { id },
    data,
    include: { projects: true, tasks: true },
  });
  return NextResponse.json(area);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.area.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
