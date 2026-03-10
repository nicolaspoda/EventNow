-- Add message column to participation_requests
ALTER TABLE "participation_requests" ADD COLUMN IF NOT EXISTS "message" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "participant_reviews" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "participant_reviews_event_id_idx" ON "participant_reviews"("event_id");
CREATE INDEX IF NOT EXISTS "participant_reviews_reviewer_id_idx" ON "participant_reviews"("reviewer_id");
CREATE INDEX IF NOT EXISTS "participant_reviews_participant_id_idx" ON "participant_reviews"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "participant_reviews_event_id_reviewer_id_participant_id_key" ON "participant_reviews"("event_id", "reviewer_id", "participant_id");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'participant_reviews_reviewer_id_fkey'
    ) THEN
        ALTER TABLE "participant_reviews" ADD CONSTRAINT "participant_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'participant_reviews_participant_id_fkey'
    ) THEN
        ALTER TABLE "participant_reviews" ADD CONSTRAINT "participant_reviews_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
