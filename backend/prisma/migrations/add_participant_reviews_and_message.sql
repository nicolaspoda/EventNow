-- Migration: Ajouter le champ message aux demandes de participation et créer la table des avis sur les participants

-- 1. Ajouter le champ message à la table participation_requests
ALTER TABLE "participation_requests" ADD COLUMN "message" TEXT;

-- 2. Créer la table participant_reviews
CREATE TABLE "participant_reviews" (
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

-- 3. Créer les index pour la table participant_reviews
CREATE INDEX "participant_reviews_event_id_idx" ON "participant_reviews"("event_id");
CREATE INDEX "participant_reviews_reviewer_id_idx" ON "participant_reviews"("reviewer_id");
CREATE INDEX "participant_reviews_participant_id_idx" ON "participant_reviews"("participant_id");

-- 4. Créer la contrainte unique pour éviter les doublons
CREATE UNIQUE INDEX "participant_reviews_event_id_reviewer_id_participant_id_key" ON "participant_reviews"("event_id", "reviewer_id", "participant_id");

-- 5. Ajouter les contraintes de clés étrangères
ALTER TABLE "participant_reviews" ADD CONSTRAINT "participant_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participant_reviews" ADD CONSTRAINT "participant_reviews_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: Pour appliquer cette migration manuellement, exécutez ce fichier SQL dans votre base de données PostgreSQL
-- Ou utilisez: npx prisma migrate dev --name add_participant_reviews_and_message
