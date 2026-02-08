import { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Set up Tauri IPC mocking for tests
 * Must be called BEFORE any Tauri commands are invoked
 */
export async function setupTauriMocking(page: Page) {
  // Wait for mockIPC to be available
  await page.waitForFunction(() => typeof window.__TAURI_MOCK_IPC__ !== 'undefined', {}, { timeout: 5000 });

  console.log('Mock IPC is available');
}

/**
 * Mock the PDF file dialog with a test PDF
 * Call this before clicking the "Open PDF" button
 */
export async function mockPDFDialog(page: Page, pdfFileName: string) {
  const pdfPath = join(__dirname, '../fixtures', pdfFileName);
  const pdfBytes = readFileSync(pdfPath);

  // Set up the mock handler
  await page.evaluate((data) => {
    console.log('[TEST] Setting up mockIPC handler for open_pdf_dialog');
    console.log('[TEST] PDF data:', data.fileName, data.bytes.length, 'bytes');

    // Call Tauri's mockIPC function
    window.__TAURI_MOCK_IPC__((cmd: string, args: any) => {
      console.log('[MOCK] Intercepted command:', cmd, 'with args:', args);

      if (cmd === 'open_pdf_dialog') {
        console.log('[MOCK] Returning PDF data for:', data.fileName);
        return {
          file_name: data.fileName,
          file_path: data.filePath,
          data: data.bytes
        };
      }

      console.warn('[MOCK] Unhandled command:', cmd);
    });
  }, {
    fileName: pdfFileName,
    filePath: `/test/${pdfFileName}`,
    bytes: Array.from(pdfBytes)
  });

  console.log('Mock PDF dialog set up for:', pdfFileName);
}

/**
 * Helper to load a test PDF in Playwright tests
 */
export async function loadTestPDF(page: Page) {
  await setupTauriMocking(page);
  await mockPDFDialog(page, 'test.pdf');
  await page.click('[data-testid="open-pdf-button"]');
  await page.waitForSelector('[data-page-number="1"]', { timeout: 15000 });
}

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
