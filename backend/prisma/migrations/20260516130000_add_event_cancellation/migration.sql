-- AlterTable
ALTER TABLE "events" ADD COLUMN "cancelled_at" TIMESTAMP(3),
ADD COLUMN "cancel_reason" TEXT;
