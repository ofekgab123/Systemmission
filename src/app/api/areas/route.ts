import { NextRequest, NextResponse } from "next/server";
import { listAreas } from "@/lib/areas-server";
import { prisma } from "@/lib/prisma";
import { isSystemAreaSlug } from "@/lib/areas";

export async function GET() {
  const areas = await listAreas();
  return NextResponse.json(areas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  if (body.slug && isSystemAreaSlug(body.slug)) {
    return NextResponse.json({ error: "Reserved slug" }, { status: 400 });
  }

  const area = await prisma.area.create({
    data: {
      name,
      icon: body.icon ?? "Layers",
      color: body.color ?? "#6366f1",
      description: body.description ?? null,
    },
  });

  return NextResponse.json(area, { status: 201 });
}
