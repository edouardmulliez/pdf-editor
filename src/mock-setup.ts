/**
 * Mock setup for Playwright tests
 * This file is imported when VITE_PLAYWRIGHT=true
 */

import { mockIPC } from '@tauri-apps/api/mocks';

// Expose mockIPC globally for tests to use
declare global {
  interface Window {
    __TAURI_MOCK_IPC__: typeof mockIPC;
  }
}

window.__TAURI_MOCK_IPC__ = mockIPC;

console.log('[Mock Setup] mockIPC is now available on window.__TAURI_MOCK_IPC__');
