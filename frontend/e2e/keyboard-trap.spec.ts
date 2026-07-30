import { test, expect, type Page, type Locator } from '@playwright/test';
import {
  loginAs,
  describeActiveElement,
  formatFocusedElement,
  isFocusInside,
  SEED_USERS,
} from './utils/helpers';

// Seeded via backend/prisma/seed.ts — "Soirée Jazz au Sunset", owned by organizer@eventnow.fr
const EVENT_ID = '2a0a9ca6-4083-42c8-a67e-df54b97beec7';
const TAB_PRESSES = 15;

interface ModalCase {
  name: string;
  setup: (page: Page) => Promise<void>;
  openTrigger: (page: Page) => Locator;
  modalContainer: (page: Page) => Locator;
}

const MODALS: ModalCase[] = [
  {
    name: "Signalement d'événement (ReportModal)",
    setup: async (page) => {
      await loginAs(page, SEED_USERS.user); // non-organisateur : le bouton "Signaler" n'est visible que pour un tiers
      await page.goto(`/events/${EVENT_ID}`);
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);
    },
    openTrigger: (page) => page.getByRole('button', { name: 'Signaler' }),
    modalContainer: (page) => page.locator('[role="dialog"][aria-labelledby="report-modal-title"]'),
  },
  {
    name: "Annulation d'événement (organisateur)",
    setup: async (page) => {
      await loginAs(page, SEED_USERS.organizer); // doit être l'organisateur de l'événement pour voir ce bouton
      await page.goto(`/events/${EVENT_ID}`);
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);
    },
    openTrigger: (page) => page.getByRole('button', { name: "Annuler l'événement" }),
    modalContainer: (page) => page.locator('[role="dialog"][aria-labelledby="cancel-modal-title"]'),
  },
  {
    name: 'Nouvelle conversation (messagerie)',
    setup: async (page) => {
      await loginAs(page, SEED_USERS.user);
      await page.goto('/messages');
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);
    },
    openTrigger: (page) => page.getByRole('button', { name: 'Nouvelle conversation' }),
    modalContainer: (page) =>
      page.locator('div.fixed.inset-0').filter({ hasText: 'Nouvelle conversation' }),
  },
];

test.describe('RGAA 12.9 — pas de piège au clavier dans les modales', () => {
  for (const modal of MODALS) {
    test(`piège clavier : ${modal.name}`, async ({ page }) => {
      await modal.setup(page);

      const trigger = modal.openTrigger(page);
      await expect(trigger).toBeVisible();
      await trigger.click();

      const container = modal.modalContainer(page);
      await expect(container).toBeVisible();

      console.log(`\n=== PIÈGE CLAVIER — ${modal.name} ===`);

      let leaks = 0;
      const path: string[] = [];
      for (let i = 1; i <= TAB_PRESSES; i++) {
        await page.keyboard.press('Tab');
        const info = await describeActiveElement(page);
        const inside = await isFocusInside(container);
        if (!inside) leaks++;
        path.push(`  Tab ${i}: ${formatFocusedElement(info)}${inside ? '' : '  <-- HORS MODALE'}`);
      }
      console.log(path.join('\n'));
      console.log(`Tabs pressés: ${TAB_PRESSES} | fuites hors modale: ${leaks}`);

      test.info().annotations.push(
        { type: 'keyboard-trap-leaks', description: String(leaks) },
      );

      // Le focus doit rester dans la modale sur les 15 tabs (soft : on veut aussi le résultat Échap ci-dessous).
      expect.soft(leaks, `${modal.name}: le focus est sorti de la modale ${leaks} fois sur ${TAB_PRESSES} tabs`).toBe(0);

      await page.keyboard.press('Escape');
      const closedByEscape = await container
        .waitFor({ state: 'hidden', timeout: 1500 })
        .then(() => true)
        .catch(() => false);
      console.log(`Fermeture par Échap: ${closedByEscape ? 'OUI' : 'NON — la modale ne réagit pas à Échap'}`);
      expect.soft(closedByEscape, `${modal.name}: Échap ne ferme pas la modale`).toBe(true);

      let focusReturned = false;
      if (closedByEscape) {
        focusReturned = await trigger
          .evaluate((el) => el === document.activeElement)
          .catch(() => false);
      }
      console.log(`Focus revenu sur le déclencheur après fermeture: ${focusReturned ? 'OUI' : 'NON'}`);
      expect.soft(focusReturned, `${modal.name}: le focus ne revient pas sur le déclencheur`).toBe(true);

      test.info().annotations.push(
        { type: 'keyboard-trap-escape-closes', description: String(closedByEscape) },
        { type: 'keyboard-trap-focus-restored', description: String(focusReturned) },
      );
    });
  }
});
