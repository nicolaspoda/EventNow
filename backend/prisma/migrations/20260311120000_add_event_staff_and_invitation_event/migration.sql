-- Add event_id to staff_invitations (nullable first for backfill)
ALTER TABLE "staff_invitations" ADD COLUMN "event_id" TEXT;

-- Backfill: set event_id to first event of the organizer (by event_date)
UPDATE "staff_invitations" si
SET "event_id" = (
  SELECT e."id" FROM "events" e
  WHERE e."organizer_id" = si."invited_by_id"
  ORDER BY e."event_date" ASC
  LIMIT 1
);

-- Remove any invitation whose organizer has no events (cannot set event_id)
DELETE FROM "staff_invitations" WHERE "event_id" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "staff_invitations" ALTER COLUMN "event_id" SET NOT NULL;

-- CreateTable event_staff
CREATE TABLE "event_staff" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_staff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_staff_event_id_user_id_key" ON "event_staff"("event_id", "user_id");
CREATE INDEX "event_staff_event_id_idx" ON "event_staff"("event_id");
CREATE INDEX "event_staff_user_id_idx" ON "event_staff"("user_id");

ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "staff_invitations_event_id_idx" ON "staff_invitations"("event_id");
