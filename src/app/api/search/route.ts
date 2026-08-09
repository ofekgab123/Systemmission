import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ tasks: [], projects: [] });

  const areaId = params.get("areaId");
  const areaFilter = areaId ? { areaId } : {};

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...areaFilter,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { waitingFor: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { project: true, tags: true },
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({
      where: {
        ...areaFilter,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { tasks: true },
      take: 10,
    }),
  ]);

  return NextResponse.json({ tasks, projects });
}
