-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "EventShowAs" AS ENUM ('FREE', 'TENTATIVE', 'BUSY', 'OUT_OF_OFFICE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EventRecurrencePattern" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "EventCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventCategory_name_key" ON "EventCategory"("name");

-- CreateTable
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "showAs" "EventShowAs" NOT NULL DEFAULT 'BUSY',
    "reminderMinutes" INTEGER,
    "recurrencePattern" "EventRecurrencePattern",
    "recurrenceInterval" INTEGER NOT NULL DEFAULT 1,
    "recurrenceWeekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "recurrenceUntil" TIMESTAMP(3),
    "recurrenceCount" INTEGER,
    "recurrenceExceptions" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "seriesId" TEXT,
    "originalStart" TIMESTAMP(3),
    "categoryId" TEXT,
    "areaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CalendarEvent_start_idx" ON "CalendarEvent"("start");
CREATE INDEX IF NOT EXISTS "CalendarEvent_end_idx" ON "CalendarEvent"("end");
CREATE INDEX IF NOT EXISTS "CalendarEvent_seriesId_idx" ON "CalendarEvent"("seriesId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_areaId_idx" ON "CalendarEvent"("areaId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
