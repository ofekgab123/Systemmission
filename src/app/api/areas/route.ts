import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const archived = req.nextUrl.searchParams.get("archived") === "true";
  const areas = await prisma.area.findMany({
    where: { archived },
    include: { projects: true, tasks: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(areas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const area = await prisma.area.create({
    data: {
      name: body.name,
      icon: body.icon ?? "Layers",
      color: body.color ?? "#6366f1",
      description: body.description ?? null,
    },
    include: { projects: true, tasks: true },
  });
  return NextResponse.json(area, { status: 201 });
}
