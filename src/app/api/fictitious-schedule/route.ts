import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  FICTITIOUS_SEED_VERSION,
  sanitizeFictitiousSchedule,
  type FictitiousScheduleState,
} from "@/lib/fictitious-schedule";
import type { Prisma } from "@/generated/prisma/client";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function GET(req: NextRequest) {
  const areaId = req.nextUrl.searchParams.get("areaId")?.trim();
  if (!areaId) {
    return NextResponse.json({ error: "areaId required" }, { status: 400 });
  }

  const row = await prisma.fictitiousSchedule.findUnique({ where: { areaId } });
  if (!row) {
    const empty: FictitiousScheduleState = {
      blocks: [],
      placements: [],
      seedVersion: "",
    };
    return NextResponse.json(empty);
  }

  const state = sanitizeFictitiousSchedule({
    blocks: row.blocks,
    placements: row.placements,
    seedVersion: row.seedVersion,
  });

  return NextResponse.json(state);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const areaId = String(body.areaId ?? "").trim();
  if (!areaId) {
    return NextResponse.json({ error: "areaId required" }, { status: 400 });
  }

  const area = await prisma.area.findUnique({ where: { id: areaId }, select: { id: true } });
  if (!area) {
    return NextResponse.json({ error: "Area not found" }, { status: 404 });
  }

  const state = sanitizeFictitiousSchedule(body);
  const seedVersion =
    typeof body.seedVersion === "string" && body.seedVersion
      ? body.seedVersion
      : state.seedVersion || FICTITIOUS_SEED_VERSION;

  const row = await prisma.fictitiousSchedule.upsert({
    where: { areaId },
    create: {
      areaId,
      blocks: asJson(state.blocks),
      placements: asJson(state.placements),
      seedVersion,
    },
    update: {
      blocks: asJson(state.blocks),
      placements: asJson(state.placements),
      seedVersion,
    },
  });

  return NextResponse.json(
    sanitizeFictitiousSchedule({
      blocks: row.blocks,
      placements: row.placements,
      seedVersion: row.seedVersion,
    })
  );
}
