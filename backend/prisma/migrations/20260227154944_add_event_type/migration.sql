-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PROFESSIONAL', 'COMMUNITY');

-- AlterTable
ALTER TABLE "events" ADD COLUMN "type" "EventType" NOT NULL DEFAULT 'PROFESSIONAL';

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");
