import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ tasks: [], projects: [], areas: [] });

  const [tasks, projects, areas] = await Promise.all([
    prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { waitingFor: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { project: true, area: true, tags: true },
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { area: true, tasks: true },
      take: 10,
    }),
    prisma.area.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 10,
      include: { projects: true, tasks: true },
    }),
  ]);

  return NextResponse.json({ tasks, projects, areas });
}
