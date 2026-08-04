/**
 * TypeScript declarations for the Electron preload API
 * exposed via contextBridge in electron/preload.js
 */

interface ElectronFileResult {
  path: string;
  content: string;
}

interface ElectronSaveOpts {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

interface ElectronOpenOpts {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  properties?: string[];
}

interface ElectronAPI {
  isElectron: true;
  openFile:    (opts: ElectronOpenOpts)          => Promise<ElectronFileResult | null>;
  saveFile:    (opts: ElectronSaveOpts)           => Promise<string | null>;
  writeFile:   (filePath: string, data: string)   => Promise<boolean>;
  readFile:    (filePath: string)                 => Promise<string>;
  getVersion:  ()                                 => Promise<string>;
  platform:    ()                                 => Promise<string>;
  onMenuEvent: (handler: (event: string, data?: any) => void) => () => void;
  onFileOpened:(handler: (data: ElectronFileResult) => void)  => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    instances?: any[];
    score?: any;
    player?: any;
    health?: any;
    lives?: any;
    soundEnabled?: boolean;
    coopEnabled?: boolean;
    language?: 'ar' | 'en';
    stopMusic?: () => void;
    restartRoom?: () => void;
    resetGame?: () => void;
    loadRoom?: (id: string) => void;
    audio_play_sound?: (snd: any, pri?: number, loop?: boolean) => void;
  }
}

export {};
