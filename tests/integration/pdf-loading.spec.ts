import { test, expect } from '@playwright/test';
import { loadTestPDF, collectConsoleErrors } from '../utils/tauri-mocks';

test.beforeEach(async ({ page }) => {
  // Listen to all console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:1420');
});

test('user opens PDF and sees pages', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  // Load PDF via mocked dialog
  await loadTestPDF(page);

  // Verify PDF viewer appears
  await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible();

  // Verify first page renders
  await expect(page.locator('[data-page-number="1"]')).toBeVisible();

  // Verify status bar shows filename
  await expect(page.locator('[data-testid="status-filename"]'))
    .toContainText('test.pdf');

  // Verify page number indicator
  await expect(page.locator('[data-testid="status-page-number"]'))
    .toContainText('Page 1 of');

  // Assert no console errors
  expect(errors).toHaveLength(0);
});
