-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "promo_codes_event_id_idx" ON "promo_codes"("event_id");
CREATE INDEX IF NOT EXISTS "promo_codes_created_by_id_idx" ON "promo_codes"("created_by_id");
CREATE INDEX IF NOT EXISTS "promo_codes_code_idx" ON "promo_codes"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_event_id_key" ON "promo_codes"("code", "event_id");

-- AddForeignKey (idempotent)
DO $$ BEGIN
    ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_event_id_fkey"
        FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_created_by_id_fkey"
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
