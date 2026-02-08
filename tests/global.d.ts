declare global {
  interface Window {
    __TAURI_MOCK_IPC__?: (handler: (cmd: string, args?: any) => any) => void;
  }
}

export {};
