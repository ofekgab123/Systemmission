import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const body = await req.json();
  const tag = await prisma.tag.upsert({
    where: { name: body.name },
    create: { name: body.name, color: body.color ?? "#94a3b8" },
    update: {},
  });
  return NextResponse.json(tag, { status: 201 });
}
