-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('CONCERT', 'CONFERENCE', 'FESTIVAL', 'SPORT', 'THEATER', 'EXHIBITION', 'OTHER');

-- DropIndex
DROP INDEX "events_type_idx";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "category" "EventCategory" NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "events_type_category_event_date_idx" ON "events"("type", "category", "event_date");

-- CreateIndex
CREATE INDEX "events_location_idx" ON "events"("location");
