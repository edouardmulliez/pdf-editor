import { test, expect } from '@playwright/test';
import { loadTestPDF, collectConsoleErrors } from '../utils/tauri-mocks';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.beforeEach(async ({ page }) => {
  // Listen to console for debugging
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:1420');
  await loadTestPDF(page);
});

test('user adds image annotation', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  // Click Image tool
  await page.click('[data-testid="image-tool-button"]');

  // Wait for tool to be active
  await page.waitForTimeout(500);

  // Verify tool is active
  await expect(page.locator('[data-testid="image-tool-button"]'))
    .toHaveClass(/bg-primary-100/);

  // Setup file chooser handler BEFORE clicking
  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });

  // Click on page to trigger image selection
  const pdfPage = page.locator('[data-testid="pdf-page-1"]');
  await pdfPage.click({ force: true });

  // Wait for and handle file chooser
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(join(__dirname, '../fixtures/test-image.jpg'));

  // Wait for image to load and annotation to be created
  await page.waitForTimeout(2000);

  // Verify image annotation appears
  const imageAnnotation = page.locator('[data-testid^="image-annotation-"]');
  await expect(imageAnnotation).toBeVisible({ timeout: 10000 });

  // Verify image element exists
  await expect(imageAnnotation.locator('img')).toBeVisible();

  // Assert no console errors (filter out known PDF.js warnings)
  const realErrors = errors.filter(e => !e.includes('cMapUrl') && !e.includes('font loading'));
  expect(realErrors).toHaveLength(0);
});
