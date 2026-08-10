import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const category = await prisma.eventCategory.update({
    where: { id },
    data: {
      ...(body.name?.trim() ? { name: body.name.trim() } : {}),
      ...(body.color ? { color: body.color } : {}),
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.eventCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
