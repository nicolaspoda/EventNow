-- AlterTable
ALTER TABLE "events" ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "postal_code" TEXT,
ADD COLUMN "country" TEXT DEFAULT 'France',
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "events_city_idx" ON "events"("city");

-- CreateIndex
CREATE INDEX "events_latitude_longitude_idx" ON "events"("latitude", "longitude");
