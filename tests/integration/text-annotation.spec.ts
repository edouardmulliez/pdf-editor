import { test, expect } from '@playwright/test';
import { loadTestPDF, collectConsoleErrors } from '../utils/tauri-mocks';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:1420');
  await loadTestPDF(page);
});

test('user adds text annotation', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  // Click Text tool
  await page.click('[data-testid="text-tool-button"]');

  // Verify tool is active
  await expect(page.locator('[data-testid="text-tool-button"]'))
    .toHaveClass(/bg-primary-100/);

  // Click on page to place annotation
  const pdfPage = page.locator('[data-page-number="1"]');
  await pdfPage.click({ position: { x: 100, y: 100 } });

  // Verify text input appears and is focused
  const textInput = page.locator('input[data-testid="annotation-text-input"]');
  await expect(textInput).toBeVisible();
  await expect(textInput).toBeFocused();

  // Type text and press Enter
  await textInput.fill('Test annotation');
  await page.keyboard.press('Enter');

  // Verify annotation is created and displayed
  const annotation = page.locator('[data-testid^="text-annotation-"]');
  await expect(annotation).toBeVisible();
  await expect(annotation).toHaveText('Test annotation');

  // Assert no console errors
  expect(errors).toHaveLength(0);
});

test('user can add multiple text annotations', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  // Click Text tool
  await page.click('[data-testid="text-tool-button"]');

  // Add first annotation
  const pdfPage = page.locator('[data-page-number="1"]');
  await pdfPage.click({ position: { x: 100, y: 100 } });
  await page.locator('input[data-testid="annotation-text-input"]').fill('First');
  await page.keyboard.press('Enter');

  // Add second annotation (tool should still be active)
  await pdfPage.click({ position: { x: 200, y: 200 } });
  await page.locator('input[data-testid="annotation-text-input"]').fill('Second');
  await page.keyboard.press('Enter');

  // Verify both annotations exist
  const annotations = page.locator('[data-testid^="text-annotation-"]');
  await expect(annotations).toHaveCount(2);

  // Assert no console errors
  expect(errors).toHaveLength(0);
});
