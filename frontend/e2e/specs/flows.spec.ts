/**
 * 3 flux en parallèle : une fenêtre Client, une Organisateur, une Staff.
 * Tous les scénarios sont couverts dans ces 3 tests.
 * Lancer avec : npm run test:e2e:flows
 * (3 fenêtres ouvertes en même temps, pas d’ouverture/fermeture en rafale)
 */
import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/test-users';

test.describe('Flux Client (1 fenêtre)', () => {
  test('Tous les scénarios client : landing → auth → catalogue → réservations → checkout → déconnexion', async ({
    page,
  }) => {
    // —— Landing
    await page.goto('/');
    await expect(page).toHaveTitle(/EventNow|frontend/i);
    await expect(page.getByRole('heading', { name: /vivez des moments|inoubliables/i })).toBeVisible();
    await page.getByRole('link', { name: /explorer les événements|voir les événements/i }).first().click();
    await expect(page).toHaveURL(/\/events/);
    await page.getByRole('link', { name: /^connexion$/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // —— Auth client
    await page.getByLabel(/email/i).fill(testUsers.client.email);
    await page.getByLabel(/mot de passe/i).fill(testUsers.client.password);
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await expect(page).toHaveURL(/\/(dashboard|events)/, { timeout: 15000 });
    await expect(page.getByRole('link', { name: /mes événements|réservations/i }).first()).toBeVisible();

    // —— Catalogue & détail
    await page.getByRole('link', { name: /EventNow|accueil|événements/i }).first().click();
    await expect(page).toHaveURL(/\/events/);
    await expect(page.getByRole('heading', { name: /découvrez des événements|inoubliables/i })).toBeVisible();
    const eventLink = page.getByRole('link', { name: /Concert Jazz|Festival Rock|Conférence|Soirée Electro/i }).first();
    await eventLink.click();
    await expect(page).toHaveURL(/\/events\/[a-f0-9-]+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Événements$/i })).toBeVisible();

    // —— Mes réservations (filtres + retour catalogue)
    await page.getByRole('link', { name: /réservations/i }).click();
    await expect(page).toHaveURL(/\/bookings/);
    await expect(page.getByRole('heading', { name: /mes réservations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Toutes\s*\(/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /en attente\s*\(/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /confirmées\s*\(/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /annulées\s*\(/i })).toBeVisible();
    await page.getByRole('button', { name: /retour au catalogue/i }).click();
    await expect(page).toHaveURL(/\/events/);

    // —— Mes billets & Mes commandes
    await page.getByRole('link', { name: /mes billets/i }).click();
    await expect(page).toHaveURL(/\/my-tickets/);
    await expect(page.getByRole('heading', { name: /mes billets|billets/i })).toBeVisible();
    await page.getByRole('link', { name: /mes commandes/i }).click();
    await expect(page).toHaveURL(/\/my-orders/);
    await expect(page.getByRole('heading', { name: /commandes|orders/i })).toBeVisible();

    // —— Dashboard client (Mes événements)
    await page.getByRole('link', { name: /mes événements/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/client/);
    await expect(page.getByRole('heading', { name: /mes événements|communautaires/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /créer un événement|créer mon premier/i }).first()).toBeVisible();

    // —— Création événement communautaire + participants
    await page.goto('/events/create');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const dateStr = futureDate.toISOString().slice(0, 16);
    await page.getByLabel(/titre/i).fill('Soirée E2E ' + Date.now());
    await page.getByLabel(/lieu/i).fill('Chez moi');
    await page.getByLabel(/date et heure/i).fill(dateStr);
    await page.getByLabel(/type d'événement/i).selectOption('COMMUNITY');
    await page.getByLabel(/nom/i).first().fill('Invité');
    await page.getByLabel(/nombre de places/i).first().fill('5');
    await page.getByRole('button', { name: /créer l'événement/i }).click();
    await expect(page).toHaveURL(/\/(events\/[a-f0-9-]+|dashboard\/client)/, { timeout: 10000 });
    await page.goto('/dashboard/client');
    const participantsBtn = page.getByRole('button', { name: /voir les participants/i });
    if (await participantsBtn.first().isVisible()) {
      await participantsBtn.first().click();
      await expect(page).toHaveURL(/\/dashboard\/events\/[a-f0-9-]+\/participants/);
      await expect(page.getByRole('heading', { name: /participants/i }).first()).toBeVisible();
    }

    // —— Réservation → Checkout → Paiement → Succès
    await page.goto('/events');
    const evLink = page.getByRole('link', { name: /Concert Jazz|Festival Rock|Conférence Tech|Soirée Electro/i }).first();
    await evLink.click();
    await expect(page).toHaveURL(/\/events\/[a-f0-9-]+/);
    await page.getByRole('button', { name: /^Réserver$/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/nombre de billets/i)).toBeVisible();
    await page.getByRole('button', { name: /^Réserver$/i }).last().click();
    await expect(page).toHaveURL(/\/checkout\?bookingId=/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /paiement sécurisé/i })).toBeVisible();
    await page.getByRole('button', { name: /confirmer le paiement/i }).click();
    await expect(page.getByText(/traitement du paiement/i)).toBeVisible({ timeout: 2000 });
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+\/success/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /voir mes billets/i })).toBeVisible();
    await page.getByRole('button', { name: /voir mes billets/i }).click();
    await expect(page).toHaveURL(/\/my-tickets/);
    await page.goto('/my-orders');
    await expect(page.getByRole('heading', { name: /mes commandes/i })).toBeVisible();

    // —— Checkout sans bookingId
    await page.goto('/checkout');
    await expect(page.getByText(/paramètres|manquants|erreur/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /retour aux événements/i })).toBeVisible();

    // —— Modal réservation : fermer sans réserver
    await page.goto('/events');
    const evLink2 = page.getByRole('link', { name: /Concert Jazz|Festival Rock|Soirée Electro/i }).first();
    await evLink2.click();
    await page.getByRole('button', { name: /^Réserver$/i }).first().click();
    await expect(page.getByRole('heading', { name: /réserver des billets/i })).toBeVisible();
    await page.getByRole('button', { name: /^Annuler$/i }).first().click();
    await expect(page.getByRole('heading', { name: /réserver des billets/i })).not.toBeVisible();

    // —— Déconnexion
    await page.getByRole('button', { name: /déconnexion/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('link', { name: /connexion|login/i })).toBeVisible();
  });
});

test.describe('Flux Organisateur (1 fenêtre)', () => {
  test('Tous les scénarios organisateur : auth → dashboard → événements → stats → création/édition → remboursements → déconnexion', async ({
    page,
  }) => {
    // —— Auth
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testUsers.organizer.email);
    await page.getByLabel(/mot de passe/i).fill(testUsers.organizer.password);
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await expect(page).toHaveURL(/\/(dashboard|events)/, { timeout: 15000 });
    await expect(page.getByRole('button', { name: /déconnexion/i })).toBeVisible();

    // —— Dashboard Pro
    await page.getByRole('link', { name: /dashboard pro/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/organizer/);
    await expect(page.getByRole('heading', { name: /dashboard|organisateur|événements créés/i })).toBeVisible();
    await expect(page.getByText(/événements créés|à venir/i)).toBeVisible();

    // —— Remboursements
    await page.getByRole('link', { name: /remboursements/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/organizer\/refund-requests/);
    await expect(page.getByRole('heading', { name: /demandes de remboursement/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /retour au tableau de bord/i })).toBeVisible();
    await expect(page.getByText(/aucune demande de remboursement/i)).toBeVisible();
    await page.getByRole('button', { name: /retour au tableau de bord/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/organizer/);

    // —— Créer un événement (nav)
    await page.getByRole('link', { name: /créer/i }).first().click();
    await expect(page).toHaveURL(/\/events\/create/);
    await expect(page.getByRole('heading', { name: /créer|nouvel événement/i })).toBeVisible();

    // —— Catalogue : voir détail (pas de lien modifier sur la page publique)
    await page.goto('/events');
    const eventLink = page.getByRole('link', { name: /Concert Jazz|Festival Rock/i }).first();
    await eventLink.click();
    await expect(page).toHaveURL(/\/events\/[a-f0-9-]+/);
    await expect(page.getByRole('link', { name: /^Événements$/i })).toBeVisible();

    // —— Dashboard : clic ligne événement
    await page.goto('/dashboard/organizer');
    const row = page.getByRole('row').filter({ hasText: /Concert Jazz|Festival Rock|Conférence|Soirée Electro/i }).first();
    await row.click();
    await expect(page).toHaveURL(/\/events\/[a-f0-9-]+/);

    // —— Stats
    await page.goto('/dashboard/organizer');
    await page.getByRole('button', { name: /voir les statistiques|statistiques/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/events\/[a-f0-9-]+\/stats/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /tableau de bord/i })).toBeVisible();

    // —— Édition
    await page.goto('/dashboard/organizer');
    await page.getByRole('button', { name: /modifier l'événement/i }).first().click();
    await expect(page).toHaveURL(/\/events\/[a-f0-9-]+\/edit/);
    await expect(page.getByLabel(/titre/i)).toBeVisible();
    await page.getByLabel(/titre/i).fill('Titre modifié E2E');
    await page.getByRole('button', { name: /enregistrer les modifications/i }).click();
    await expect(page).toHaveURL(/\/events\/[a-f0-9-]+$/);
    await expect(page.getByRole('heading', { name: /titre modifié e2e/i })).toBeVisible();

    // —— Création événement
    await page.goto('/events/create');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().slice(0, 16);
    await page.getByLabel(/titre/i).fill('E2E Event ' + Date.now());
    await page.getByLabel(/lieu/i).fill('Salle de test');
    await page.getByLabel(/date et heure/i).fill(dateStr);
    await page.getByLabel(/nom/i).first().fill('Standard');
    await page.getByLabel(/nombre de places/i).first().fill('10');
    await page.getByRole('button', { name: /créer l'événement/i }).click();
    await expect(page).toHaveURL(/\/(events\/[a-f0-9-]+|dashboard\/organizer)/, { timeout: 10000 });

    // —— Déconnexion
    await page.getByRole('button', { name: /déconnexion/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Flux Staff (1 fenêtre)', () => {
  test('Tous les scénarios staff : auth → validation billets → historique → déconnexion', async ({ page }) => {
    // —— Auth
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testUsers.staff.email);
    await page.getByLabel(/mot de passe/i).fill(testUsers.staff.password);
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await expect(page).toHaveURL(/\/(dashboard|staff)/, { timeout: 15000 });
    await expect(page.getByRole('link', { name: /validation billets/i })).toBeVisible();

    // —— Validation billets
    await page.getByRole('link', { name: /validation billets/i }).click();
    await expect(page).toHaveURL(/\/staff\/scan/);
    await expect(page.getByRole('heading', { name: /validation billets/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /scanner un billet/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /activer la caméra/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /saisie manuelle/i })).toBeVisible();

    // —— Historique
    await page.getByRole('link', { name: /historique/i }).click();
    await expect(page).toHaveURL(/\/staff\/validations/);
    await expect(page.getByRole('heading', { name: /historique des validations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /retour au scan/i })).toBeVisible();
    await page.getByRole('button', { name: /retour au scan/i }).click();
    await expect(page).toHaveURL(/\/staff\/scan/);

    // —— Déconnexion
    await page.getByRole('button', { name: /déconnexion/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
