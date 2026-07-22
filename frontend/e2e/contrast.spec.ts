import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginAs, setDarkMode, createBooking, SEED_USERS } from './utils/helpers';

// Seeded via backend/prisma/seed.ts — "Soirée Jazz au Sunset", owned by organizer@eventnow.fr
const EVENT_ID = '2a0a9ca6-4083-42c8-a67e-df54b97beec7';
const TICKET_CATEGORY_ID = '4891e016-af00-4e16-9fff-0a46d2e13b77';

interface PageSpec {
  name: string;
  path: string;
  auth?: keyof typeof SEED_USERS;
  needsBooking?: boolean;
}

const PAGES: PageSpec[] = [
  { name: 'Landing', path: '/' },
  { name: "Liste d'événements", path: '/events' },
  { name: "Détail d'événement", path: `/events/${EVENT_ID}` },
  { name: 'Dashboard organisateur', path: '/dashboard/organizer', auth: 'organizer' },
  { name: 'Checkout', path: '/checkout', auth: 'user', needsBooking: true },
  { name: 'Messagerie', path: '/messages', auth: 'user' },
];

test.describe('RGAA 3.2 — contraste des couleurs (mode sombre)', () => {
  for (const p of PAGES) {
    test(`contraste : ${p.name}`, async ({ page }) => {
      await setDarkMode(page);

      let targetPath = p.path;
      if (p.auth) {
        const auth = await loginAs(page, SEED_USERS[p.auth]);
        if (p.needsBooking) {
          const booking = await createBooking(page, auth.accessToken, TICKET_CATEGORY_ID, 1);
          targetPath = `/checkout?bookingId=${booking.id}`;
        }
      }

      await page.goto(targetPath);
      await page.waitForLoadState('load');
      // Pas de networkidle : Stripe Elements (checkout) et Socket.IO (messagerie) gardent des
      // connexions ouvertes en permanence, ce qui empêcherait jamais l'état "networkidle".
      await page.waitForTimeout(1000);

      // Confirms dark mode is actually active before auditing contrast.
      await expect(page.locator('html')).toHaveClass(/dark/);

      const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

      const violationNodeCount = results.violations.reduce((n, v) => n + v.nodes.length, 0);
      const passNodeCount = results.passes.reduce((n, v) => n + v.nodes.length, 0);
      const totalTested = violationNodeCount + passNodeCount;

      console.log(`\n=== CONTRASTE — ${p.name} (${targetPath}) ===`);
      console.log(`Éléments testés: ${totalTested} (conformes: ${passNodeCount}, violations: ${violationNodeCount})`);

      for (const violation of results.violations) {
        for (const node of violation.nodes) {
          const data = node.any[0]?.data as
            | { contrastRatio?: number; expectedContrastRatio?: string; fgColor?: string; bgColor?: string }
            | undefined;
          console.log(`  - sélecteur: ${node.target.join(' ')}`);
          console.log(
            `    ratio trouvé: ${data?.contrastRatio ?? 'N/A'} | ratio requis: ${data?.expectedContrastRatio ?? 'N/A'} | fg: ${data?.fgColor ?? '?'} | bg: ${data?.bgColor ?? '?'}`,
          );
        }
      }

      test.info().annotations.push(
        { type: 'contrast-tested', description: String(totalTested) },
        { type: 'contrast-violations', description: String(violationNodeCount) },
      );
    });
  }
});
