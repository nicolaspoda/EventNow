-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('UNCLAIMED', 'CLAIMED');

-- CreateTable
CREATE TABLE "event_item_lists" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_item_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_items" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "note" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "claimed_by_id" TEXT,
    "added_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_item_lists_event_id_key" ON "event_item_lists"("event_id");

-- CreateIndex
CREATE INDEX "event_items_list_id_idx" ON "event_items"("list_id");

-- AddForeignKey
ALTER TABLE "event_item_lists" ADD CONSTRAINT "event_item_lists_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_items" ADD CONSTRAINT "event_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "event_item_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_items" ADD CONSTRAINT "event_items_claimed_by_id_fkey" FOREIGN KEY ("claimed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_items" ADD CONSTRAINT "event_items_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
