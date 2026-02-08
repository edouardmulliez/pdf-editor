import { Page } from '@playwright/test';

/**
 * Collect console errors during test execution
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return errors;
}

/**
 * Take a debug screenshot for failed tests
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `./test-results/${name}-${Date.now()}.png`,
    fullPage: true
  });
}
