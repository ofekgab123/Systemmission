import { prisma } from "@/lib/prisma";
import { SYSTEM_AREA_SLUGS } from "@/lib/areas";

export async function ensureDefaultAreas() {
  let base = await prisma.area.findUnique({ where: { slug: SYSTEM_AREA_SLUGS.base } });
  if (!base) {
    base = await prisma.area.create({
      data: {
        name: "בסיס",
        slug: SYSTEM_AREA_SLUGS.base,
        icon: "Home",
        color: "#6366f1",
      },
    });
  }

  let personal = await prisma.area.findUnique({ where: { slug: SYSTEM_AREA_SLUGS.personal } });
  if (!personal) {
    personal = await prisma.area.create({
      data: {
        name: "אני לעצמי",
        slug: SYSTEM_AREA_SLUGS.personal,
        icon: "User",
        color: "#ec4899",
      },
    });
  }

  await prisma.task.updateMany({ where: { areaId: null }, data: { areaId: base.id } });
  await prisma.project.updateMany({ where: { areaId: null }, data: { areaId: base.id } });
  await prisma.stickyNote.updateMany({ where: { areaId: null }, data: { areaId: base.id } });

  return { base, personal };
}

export async function listAreas() {
  await ensureDefaultAreas();
  return prisma.area.findMany({
    where: { archived: false },
    orderBy: [{ createdAt: "asc" }],
  });
}
