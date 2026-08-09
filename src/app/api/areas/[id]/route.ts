import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSystemAreaSlug } from "@/lib/areas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.area.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isSystemAreaSlug(existing.slug) && body.slug && body.slug !== existing.slug) {
    return NextResponse.json({ error: "Cannot change system area slug" }, { status: 400 });
  }

  const area = await prisma.area.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body.icon !== undefined ? { icon: body.icon } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.archived !== undefined ? { archived: body.archived } : {}),
    },
  });

  return NextResponse.json(area);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existing = await prisma.area.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isSystemAreaSlug(existing.slug)) {
    return NextResponse.json({ error: "Cannot delete system area" }, { status: 400 });
  }

  const base = await prisma.area.findUnique({ where: { slug: "base" } });
  if (!base) {
    return NextResponse.json({ error: "Base area missing" }, { status: 500 });
  }

  await prisma.$transaction([
    prisma.task.updateMany({ where: { areaId: id }, data: { areaId: base.id } }),
    prisma.project.updateMany({ where: { areaId: id }, data: { areaId: base.id } }),
    prisma.stickyNote.updateMany({ where: { areaId: id }, data: { areaId: base.id } }),
    prisma.area.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
