-- AlterTable
ALTER TABLE "Area" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Area_slug_key" ON "Area"("slug");

-- CreateTable
CREATE TABLE IF NOT EXISTS "StickyNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#fef08a',
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "nextAlertAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "areaId" TEXT,

    CONSTRAINT "StickyNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StickyNote_dismissed_idx" ON "StickyNote"("dismissed");
CREATE INDEX IF NOT EXISTS "StickyNote_nextAlertAt_idx" ON "StickyNote"("nextAlertAt");
CREATE INDEX IF NOT EXISTS "StickyNote_areaId_idx" ON "StickyNote"("areaId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "StickyNote" ADD CONSTRAINT "StickyNote_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add areaId column if StickyNote existed without it
ALTER TABLE "StickyNote" ADD COLUMN IF NOT EXISTS "areaId" TEXT;
