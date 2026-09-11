-- CreateTable
CREATE TABLE IF NOT EXISTS "FictitiousSchedule" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "placements" JSONB NOT NULL,
    "seedVersion" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FictitiousSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FictitiousSchedule_areaId_key" ON "FictitiousSchedule"("areaId");

DO $$ BEGIN
  ALTER TABLE "FictitiousSchedule"
    ADD CONSTRAINT "FictitiousSchedule_areaId_fkey"
    FOREIGN KEY ("areaId") REFERENCES "Area"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
