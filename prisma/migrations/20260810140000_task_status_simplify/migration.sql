-- Add someday reason field
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "somedayReason" TEXT;

-- Migrate deprecated statuses
UPDATE "Task" SET "status" = 'READY' WHERE "status" IN ('INBOX', 'PLANNED', 'SCHEDULED');
UPDATE "Task" SET "status" = 'DONE' WHERE "status" = 'REVIEW';

-- Default new tasks to READY
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'READY';
