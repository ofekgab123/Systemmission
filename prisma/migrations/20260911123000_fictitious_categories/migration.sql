ALTER TABLE "FictitiousSchedule"
  ADD COLUMN IF NOT EXISTS "categories" JSONB NOT NULL DEFAULT '[]'::jsonb;
