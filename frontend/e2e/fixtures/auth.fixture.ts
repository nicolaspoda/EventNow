import { test as base } from '@playwright/test';
import { testUsers, type TestUserRole } from './test-users';

type AuthFixtures = {
  loginAsOrganizer: () => Promise<void>;
  loginAsClient: () => Promise<void>;
  loginAsStaff: () => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  loginAsOrganizer: async ({ page }, fixture) => {
    await fixture(async () => {
      await loginWith(page, testUsers.organizer.email, testUsers.organizer.password);
    });
  },
  loginAsClient: async ({ page }, fixture) => {
    await fixture(async () => {
      await loginWith(page, testUsers.client.email, testUsers.client.password);
    });
  },
  loginAsStaff: async ({ page }, fixture) => {
    await fixture(async () => {
      await loginWith(page, testUsers.staff.email, testUsers.staff.password);
    });
  },
});

async function loginWith(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL(/\/(dashboard|staff)/);
}

export { testUsers };
export type { TestUserRole };
