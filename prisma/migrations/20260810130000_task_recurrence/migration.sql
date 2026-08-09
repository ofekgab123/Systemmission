-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY', 'WEEKDAY');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurrencePattern" "RecurrencePattern";
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurrenceWeekday" INTEGER;
