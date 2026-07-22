import { test, expect } from '@playwright/test';
import { describeActiveElement, formatFocusedElement } from './utils/helpers';

const MAX_TABS = 40;

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[tabindex]',
].join(', ');

test.describe('RGAA 7.3 — navigation clavier globale (page d\'accueil)', () => {
  test('parcours au clavier de la page d\'accueil', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);

    // Marque chaque élément atteint au clavier pour pouvoir les comparer aux éléments cliquables du DOM.
    await page.evaluate(() => {
      (window as unknown as { __e2eFocused: Set<Element> }).__e2eFocused = new Set();
    });

    const path: string[] = [];
    for (let i = 1; i <= MAX_TABS; i++) {
      await page.keyboard.press('Tab');
      const info = await describeActiveElement(page);
      await page.evaluate(() => {
        const el = document.activeElement;
        if (el) (window as unknown as { __e2eFocused: Set<Element> }).__e2eFocused.add(el);
      });
      path.push(`  Tab ${i}: ${formatFocusedElement(info)}`);
    }

    console.log('\n=== NAVIGATION CLAVIER — Landing page ===');
    console.log(path.join('\n'));

    const { total, missing } = await page.evaluate(
      ({ selector }) => {
        const focused = (window as unknown as { __e2eFocused: Set<Element> }).__e2eFocused;
        const candidates = Array.from(document.querySelectorAll(selector));
        const isVisible = (el: Element) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            rect.width > 0 &&
            rect.height > 0 &&
            (el as HTMLElement).offsetParent !== null
          );
        };
        const isDisabled = (el: Element) =>
          el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
        const isNegativeTabIndex = (el: Element) => el.getAttribute('tabindex') === '-1';

        const visibleCandidates = candidates.filter(
          (el) => isVisible(el) && !isDisabled(el) && !isNegativeTabIndex(el),
        );

        const missingEls = visibleCandidates
          .filter((el) => !focused.has(el))
          .map((el) => {
            const e = el as HTMLElement;
            return {
              tag: e.tagName.toLowerCase(),
              id: e.id || null,
              ariaLabel: e.getAttribute('aria-label'),
              text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
              href: e.getAttribute('href'),
            };
          });

        return { total: visibleCandidates.length, missing: missingEls };
      },
      { selector: INTERACTIVE_SELECTOR },
    );

    console.log(`\nÉléments interactifs visibles sur la page: ${total}`);
    console.log(`Tabs pressés: ${MAX_TABS}`);
    console.log(`Éléments cliquables NON atteints au clavier en ${MAX_TABS} tabs: ${missing.length}`);
    for (const m of missing) {
      console.log(
        `  - <${m.tag}>${m.id ? ` #${m.id}` : ''}${m.ariaLabel ? ` [aria-label="${m.ariaLabel}"]` : ''}${m.href ? ` [href="${m.href}"]` : ''} "${m.text}"`,
      );
    }

    test.info().annotations.push(
      { type: 'keyboard-nav-tabs-pressed', description: String(MAX_TABS) },
      { type: 'keyboard-nav-total-interactive', description: String(total) },
      { type: 'keyboard-nav-unreachable-count', description: String(missing.length) },
    );

    expect
      .soft(missing.length, `${missing.length} élément(s) cliquable(s) inatteignable(s) au clavier`)
      .toBe(0);
  });
});
