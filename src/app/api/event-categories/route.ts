import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.eventCategory.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "חסר שם קטגוריה" }, { status: 400 });
  }

  const category = await prisma.eventCategory.upsert({
    where: { name },
    create: { name, color: body.color ?? "#6366f1" },
    update: { color: body.color ?? undefined },
  });

  return NextResponse.json(category, { status: 201 });
}
