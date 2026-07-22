import type { Page, Locator } from '@playwright/test';

const API_URL = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';

export interface SeedCreds {
  email: string;
  password: string;
}

export const SEED_USERS: Record<string, SeedCreds> = {
  organizer: { email: 'organizer@eventnow.fr', password: 'Organizer1234!' },
  user: { email: 'user@eventnow.fr', password: 'User1234!' },
  admin: { email: 'admin@eventnow.fr', password: 'Admin1234!' },
};

/** Logs a seed user in via the API and injects the session into the browser (sessionStorage, matching AuthContext). */
export async function loginAs(page: Page, creds: SeedCreds) {
  const res = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: creds.email, password: creds.password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${creds.email}: HTTP ${res.status()}`);
  }
  const body = await res.json();
  await page.goto('/');
  await page.evaluate((auth) => {
    sessionStorage.setItem('accessToken', auth.accessToken);
    sessionStorage.setItem('refreshToken', auth.refreshToken);
    sessionStorage.setItem('user', JSON.stringify(auth.user));
  }, body);
  return body as { accessToken: string; refreshToken: string; user: { id: string } };
}

/** Forces dark theme before the app mounts, matching the app's ThemeContext (localStorage 'theme'). */
export async function setDarkMode(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'dark');
  });
}

/** Creates a PENDING booking via the API so /checkout?bookingId=... has real content to render. */
export async function createBooking(
  page: Page,
  accessToken: string,
  ticketCategoryId: string,
  quantity = 1,
) {
  const res = await page.request.post(`${API_URL}/bookings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { ticketCategoryId, quantity },
  });
  if (!res.ok()) {
    throw new Error(`Booking creation failed: HTTP ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string }>;
}

export interface FocusedElementInfo {
  tag: string;
  id: string | null;
  ariaLabel: string | null;
  role: string | null;
  text: string;
  href: string | null;
}

/** Describes document.activeElement in a readable, stable way for reporting. */
export async function describeActiveElement(page: Page): Promise<FocusedElementInfo> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) {
      return { tag: 'body', id: null, ariaLabel: null, role: null, text: '', href: null };
    }
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      ariaLabel: el.getAttribute('aria-label'),
      role: el.getAttribute('role'),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50),
      href: el.getAttribute('href'),
    };
  });
}

export function formatFocusedElement(info: FocusedElementInfo): string {
  const parts = [`<${info.tag}>`];
  if (info.id) parts.push(`#${info.id}`);
  if (info.ariaLabel) parts.push(`[aria-label="${info.ariaLabel}"]`);
  if (info.role) parts.push(`[role="${info.role}"]`);
  if (info.href) parts.push(`[href="${info.href}"]`);
  if (info.text) parts.push(`"${info.text}"`);
  return parts.join(' ');
}

/** Whether document.activeElement is the given locator's element or a descendant of it. */
export async function isFocusInside(container: Locator): Promise<boolean> {
  return container.evaluate((el) => !!document.activeElement && el.contains(document.activeElement));
}
