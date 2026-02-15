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

test.describe('Text Annotation Editing', () => {
  test('user can move text annotation by dragging', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // Add a text annotation
    await page.click('[data-testid="text-tool-button"]');
    const pdfPage = page.locator('[data-page-number="1"]');
    await pdfPage.click({ position: { x: 100, y: 100 } });

    const textInput = page.locator('input[data-testid="annotation-text-input"]');
    await textInput.fill('Movable text');
    await page.keyboard.press('Enter');

    // Wait for annotation to be created
    const annotation = page.locator('[data-testid^="text-annotation-"]');
    await expect(annotation).toBeVisible();

    // Get initial position
    const initialBox = await annotation.boundingBox();
    expect(initialBox).not.toBeNull();

    // Perform drag operation manually with dispatchEvent
    // This approach gives us more control over the mouse events
    const startX = initialBox!.x + initialBox!.width / 2;
    const startY = initialBox!.y + initialBox!.height / 2;
    const deltaX = 50;
    const deltaY = 30;

    // Dispatch mousedown event
    await annotation.dispatchEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: startX,
      clientY: startY,
      button: 0
    });

    // Dispatch multiple mousemove events to simulate smooth dragging
    for (let i = 1; i <= 10; i++) {
      const progress = i / 10;
      await page.dispatchEvent('body', 'mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: startX + deltaX * progress,
        clientY: startY + deltaY * progress,
        button: 0
      });
      await page.waitForTimeout(10);
    }

    // Dispatch mouseup event
    await page.dispatchEvent('body', 'mouseup', {
      bubbles: true,
      cancelable: true,
      clientX: startX + deltaX,
      clientY: startY + deltaY,
      button: 0
    });

    // Wait for position update and re-render
    await page.waitForTimeout(200);

    // Get new position
    const newBox = await annotation.boundingBox();
    expect(newBox).not.toBeNull();

    // Verify the annotation has moved
    // Allow some tolerance for coordinate system conversions
    expect(Math.abs(newBox!.x - initialBox!.x - 50)).toBeLessThan(20);
    expect(Math.abs(newBox!.y - initialBox!.y - 30)).toBeLessThan(20);

    // Verify text content is still correct
    await expect(annotation).toHaveText('Movable text');

    // Assert no console errors
    expect(errors).toHaveLength(0);
  });

  test('user can resize text annotation using corner handles', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // Add a text annotation
    await page.click('[data-testid="text-tool-button"]');
    const pdfPage = page.locator('[data-page-number="1"]');
    await pdfPage.click({ position: { x: 150, y: 150 } });

    const textInput = page.locator('input[data-testid="annotation-text-input"]');
    await textInput.fill('Resizable');
    await page.keyboard.press('Enter');

    // Wait for annotation to be created
    const annotation = page.locator('[data-testid^="text-annotation-"]');
    await expect(annotation).toBeVisible();

    // Click to select the annotation
    await annotation.click();

    // Wait for resize handles to appear
    await page.waitForTimeout(200);

    // Get the selection overlay (visible box around text)
    const selectionBox = page.locator('.absolute.pointer-events-none.ring-2.ring-primary-500');
    await expect(selectionBox).toBeVisible();
    const initialBox = await selectionBox.boundingBox();
    expect(initialBox).not.toBeNull();

    // Find the bottom-right resize handle
    // ResizeHandles are now in a separate selection overlay, not inside the text element
    const resizeHandle = page.locator('.absolute.w-2.h-2.bg-primary-500').nth(3); // br handle
    await expect(resizeHandle).toBeVisible({ timeout: 2000 });

    // Get handle position
    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    // Perform resize: drag bottom-right handle
    const handleX = handleBox!.x + handleBox!.width / 2;
    const handleY = handleBox!.y + handleBox!.height / 2;
    const deltaX = 40;
    const deltaY = 20;

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(handleX + deltaX, handleY + deltaY, { steps: 10 });
    await page.mouse.up();

    // Wait for size update
    await page.waitForTimeout(200);

    // Re-select annotation to ensure selection box is visible
    await annotation.click();
    await page.waitForTimeout(100);

    // Get updated selection box
    const updatedSelectionBox = page.locator('.absolute.pointer-events-none.ring-2.ring-primary-500');
    await expect(updatedSelectionBox).toBeVisible();
    const newBox = await updatedSelectionBox.boundingBox();
    expect(newBox).not.toBeNull();

    // Verify the annotation has been resized
    expect(newBox!.width).toBeGreaterThan(initialBox!.width);
    expect(newBox!.height).toBeGreaterThan(initialBox!.height);

    // Verify text content is still correct
    await expect(annotation).toHaveText('Resizable');

    // Assert no console errors
    expect(errors).toHaveLength(0);
  });

  test('user can resize text annotation from top-left handle', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // Add a text annotation
    await page.click('[data-testid="text-tool-button"]');
    const pdfPage = page.locator('[data-page-number="1"]');
    await pdfPage.click({ position: { x: 200, y: 200 } });

    const textInput = page.locator('input[data-testid="annotation-text-input"]');
    await textInput.fill('TL Resize');
    await page.keyboard.press('Enter');

    // Wait for annotation to be created
    const annotation = page.locator('[data-testid^="text-annotation-"]');
    await expect(annotation).toBeVisible();

    // Click to select
    await annotation.click();
    await page.waitForTimeout(200);

    // Get the selection overlay (visible box around text)
    const selectionBox = page.locator('.absolute.pointer-events-none.ring-2.ring-primary-500');
    await expect(selectionBox).toBeVisible();
    const initialBox = await selectionBox.boundingBox();
    expect(initialBox).not.toBeNull();

    // Find the top-left resize handle
    // ResizeHandles are now in a separate selection overlay, not inside the text element
    const resizeHandle = page.locator('.absolute.w-2.h-2.bg-primary-500').first(); // tl handle
    await expect(resizeHandle).toBeVisible({ timeout: 2000 });

    // Get handle position
    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    // Perform resize: drag top-left handle (shrink)
    const handleX = handleBox!.x + handleBox!.width / 2;
    const handleY = handleBox!.y + handleBox!.height / 2;
    const deltaX = 20; // Move right (shrink width)
    const deltaY = 10; // Move down (shrink height)

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(handleX + deltaX, handleY + deltaY, { steps: 10 });
    await page.mouse.up();

    // Wait for size update
    await page.waitForTimeout(200);

    // Re-select annotation to ensure selection box is visible
    await annotation.click();
    await page.waitForTimeout(100);

    // Get updated selection box
    const updatedSelectionBox = page.locator('.absolute.pointer-events-none.ring-2.ring-primary-500');
    await expect(updatedSelectionBox).toBeVisible();
    const newBox = await updatedSelectionBox.boundingBox();
    expect(newBox).not.toBeNull();

    // When dragging top-left handle to the right/down, the annotation should shrink
    expect(newBox!.width).toBeLessThan(initialBox!.width);

    // Verify text content is still correct
    await expect(annotation).toHaveText('TL Resize');

    // Assert no console errors
    expect(errors).toHaveLength(0);
  });
});

test.describe('Image Annotation Editing', () => {
  test('user can move image annotation by dragging', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // Add an image annotation
    await page.click('[data-testid="image-tool-button"]');
    await page.waitForTimeout(500);

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    const pdfPage = page.locator('[data-testid="pdf-page-1"]');
    await pdfPage.click({ force: true });

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(join(__dirname, '../fixtures/test-image.jpg'));
    await page.waitForTimeout(2000);

    // Verify image annotation exists
    const annotation = page.locator('[data-testid^="image-annotation-"]');
    await expect(annotation).toBeVisible({ timeout: 10000 });

    // Get initial position
    const initialBox = await annotation.boundingBox();
    expect(initialBox).not.toBeNull();

    // Click to select
    await annotation.click();
    await page.waitForTimeout(100);

    // Perform drag
    const startX = initialBox!.x + initialBox!.width / 2;
    const startY = initialBox!.y + initialBox!.height / 2;
    const deltaX = 70;
    const deltaY = 50;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Get new position
    const newBox = await annotation.boundingBox();
    expect(newBox).not.toBeNull();

    // Verify the annotation has moved
    expect(Math.abs(newBox!.x - initialBox!.x - deltaX)).toBeLessThan(10);
    expect(Math.abs(newBox!.y - initialBox!.y - deltaY)).toBeLessThan(10);

    // Verify image is still visible
    await expect(annotation.locator('img')).toBeVisible();

    // Assert no console errors (filter out known warnings)
    const realErrors = errors.filter(e => !e.includes('cMapUrl') && !e.includes('font loading'));
    expect(realErrors).toHaveLength(0);
  });

  test('user can resize image annotation maintaining aspect ratio', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // Add an image annotation
    await page.click('[data-testid="image-tool-button"]');
    await page.waitForTimeout(500);

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    const pdfPage = page.locator('[data-testid="pdf-page-1"]');
    await pdfPage.click({ force: true });

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(join(__dirname, '../fixtures/test-image.jpg'));
    await page.waitForTimeout(2000);

    const annotation = page.locator('[data-testid^="image-annotation-"]');
    await expect(annotation).toBeVisible({ timeout: 10000 });

    // Click to select
    await annotation.click();
    await page.waitForTimeout(200);

    // Get initial size and aspect ratio
    const initialBox = await annotation.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialAspectRatio = initialBox!.width / initialBox!.height;

    // Find the bottom-right resize handle
    const resizeHandle = annotation.locator('.absolute.w-2.h-2.bg-primary-500').nth(3);
    await expect(resizeHandle).toBeVisible({ timeout: 2000 });

    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    // Perform resize
    const handleX = handleBox!.x + handleBox!.width / 2;
    const handleY = handleBox!.y + handleBox!.height / 2;
    const deltaX = 60;
    const deltaY = 60;

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(handleX + deltaX, handleY + deltaY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Get new size
    const newBox = await annotation.boundingBox();
    expect(newBox).not.toBeNull();

    // Verify the annotation has been resized
    expect(newBox!.width).toBeGreaterThan(initialBox!.width);
    expect(newBox!.height).toBeGreaterThan(initialBox!.height);

    // Verify aspect ratio is maintained (within tolerance)
    const newAspectRatio = newBox!.width / newBox!.height;
    expect(Math.abs(newAspectRatio - initialAspectRatio)).toBeLessThan(0.1);

    // Verify image is still visible
    await expect(annotation.locator('img')).toBeVisible();

    // Assert no console errors
    const realErrors = errors.filter(e => !e.includes('cMapUrl') && !e.includes('font loading'));
    expect(realErrors).toHaveLength(0);
  });
});
