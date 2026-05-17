-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "ReportType" AS ENUM ('EVENT', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportReason" AS ENUM ('INAPPROPRIATE_CONTENT', 'SPAM', 'FAKE_EVENT', 'HARASSMENT', 'SCAM', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "target_user_id" TEXT,
    "target_event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_reporter_id_idx" ON "reports"("reporter_id");
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "reports_reporter_id_type_target_user_id_key" ON "reports"("reporter_id", "type", "target_user_id") WHERE "target_user_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "reports_reporter_id_type_target_event_id_key" ON "reports"("reporter_id", "type", "target_event_id") WHERE "target_event_id" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey"
    FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reports" ADD CONSTRAINT "reports_target_user_id_fkey"
    FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reports" ADD CONSTRAINT "reports_target_event_id_fkey"
    FOREIGN KEY ("target_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
