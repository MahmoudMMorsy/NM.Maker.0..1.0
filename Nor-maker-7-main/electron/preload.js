/**
 * NOR Maker AI — Electron Preload Script
 * Exposes a safe, limited API to the renderer process via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /* ── File System ── */
  openFile:  (opts) => ipcRenderer.invoke('dialog:open', opts),
  saveFile:  (opts) => ipcRenderer.invoke('dialog:save', opts),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  readFile:  (filePath) => ipcRenderer.invoke('fs:readFile', filePath),

  /* ── App Info ── */
  getVersion: () => ipcRenderer.invoke('app:version'),
  platform:   () => ipcRenderer.invoke('app:platform'),
  launchGameMaker: () => ipcRenderer.invoke('app:launchGameMaker'),

  /* ── Menu Events (main → renderer) ── */
  onMenuEvent: (handler) => {
    const events = ['menu:save','menu:run','menu:restart','menu:export-nor','menu:export-html','menu:export-nes'];
    const listeners = events.map(ch => {
      const fn = (_e, data) => handler(ch, data);
      ipcRenderer.on(ch, fn);
      return () => ipcRenderer.removeListener(ch, fn);
    });
    return () => listeners.forEach(rm => rm());
  },

  /* ── File Open Events ── */
  onFileOpened: (handler) => {
    const fn = (_e, data) => handler(data);
    ipcRenderer.on('file:opened', fn);
    return () => ipcRenderer.removeListener('file:opened', fn);
  },

  /* ── Detect Electron ── */
  isElectron: true,
});
