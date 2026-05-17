-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "status" "PollStatus" NOT NULL DEFAULT 'OPEN',
    "multiple_choice" BOOLEAN NOT NULL DEFAULT false,
    "closes_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "polls_event_id_idx" ON "polls"("event_id");

-- CreateIndex
CREATE INDEX "polls_created_by_id_idx" ON "polls"("created_by_id");

-- CreateIndex
CREATE INDEX "poll_options_poll_id_idx" ON "poll_options"("poll_id");

-- CreateIndex
CREATE INDEX "poll_votes_poll_id_idx" ON "poll_votes"("poll_id");

-- CreateIndex
CREATE INDEX "poll_votes_user_id_idx" ON "poll_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_poll_id_option_id_user_id_key" ON "poll_votes"("poll_id", "option_id", "user_id");

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
