/**
 * NOR Maker AI — Electron Main Process
 * Wraps the Vite/React app in a native desktop window.
 */

const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const isDev = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:5000';

/* ── Window ── */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:        1440,
    height:       900,
    minWidth:     1100,
    minHeight:    700,
    title:        'NOR Maker AI',
    icon:         path.join(__dirname, '..', 'public', 'favicon.svg'),
    backgroundColor: '#c0c0c0',
    show: false,
    webPreferences: {
      preload:         path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity:     !isDev, // allow localhost in dev
    },
  });

  /* Load app */
  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  buildMenu();
}

/* ── Native Menu ── */
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open .nor…',
          accelerator: 'CmdOrCtrl+O',
          click: () => openNorFile(),
        },
        {
          label: 'Open .pnor Project…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => openPnorFile(),
        },
        { type: 'separator' },
        {
          label: 'Save / Export',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save'),
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Game',
      submenu: [
        {
          label: 'Run / Compile',
          accelerator: 'F5',
          click: () => mainWindow?.webContents.send('menu:run'),
        },
        {
          label: 'Restart Game',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.send('menu:restart'),
        },
        { type: 'separator' },
        {
          label: 'Export Sealed Game (.nor)…',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu:export-nor'),
        },
        {
          label: 'Export as HTML5…',
          click: () => mainWindow?.webContents.send('menu:export-html'),
        },
        {
          label: 'Export as NES ROM…',
          click: () => mainWindow?.webContents.send('menu:export-nes'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'NOR Maker Documentation',
          click: () => shell.openExternal('https://normaker.dev/docs'),
        },
        { type: 'separator' },
        {
          label: 'About NOR Maker AI',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type:    'info',
              title:   'About NOR Maker AI',
              message: 'NOR Maker AI',
              detail:  `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChromium: ${process.versions.chrome}\nNode: ${process.versions.node}\nPlatform: ${os.platform()} ${os.arch()}`,
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ── IPC: File System Helpers ── */

/** Open a .nor file and return its text content */
async function openNorFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title:   'Open .nor Game File',
    filters: [{ name: 'NOR Game', extensions: ['nor'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths.length) return;
  const text = fs.readFileSync(filePaths[0], 'utf-8');
  mainWindow?.webContents.send('file:opened', { path: filePaths[0], content: text });
}

async function openPnorFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title:   'Open NOR Maker Project',
    filters: [
      { name: 'NOR Project', extensions: ['pnor', 'nor'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (canceled || !filePaths.length) return;
  const text = fs.readFileSync(filePaths[0], 'utf-8');
  mainWindow?.webContents.send('file:opened', { path: filePaths[0], content: text });
}

/* IPC handlers for renderer → main calls */
ipcMain.handle('dialog:save', async (_event, opts) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title:       opts.title   || 'Save File',
    defaultPath: opts.defaultPath || 'game.nor',
    filters:     opts.filters || [{ name: 'All Files', extensions: ['*'] }],
  });
  if (canceled || !filePath) return null;
  return filePath;
});

ipcMain.handle('fs:writeFile', async (_event, filePath, data) => {
  fs.writeFileSync(filePath, data, 'utf-8');
  return true;
});

ipcMain.handle('fs:readFile', async (_event, filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:platform', () => process.platform);

ipcMain.handle('dialog:open', async (_event, opts) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title:      opts.title || 'Open File',
    filters:    opts.filters || [{ name: 'All Files', extensions: ['*'] }],
    properties: opts.properties || ['openFile'],
  });
  if (canceled || !filePaths.length) return null;
  const first = filePaths[0];
  const content = fs.readFileSync(first, 'utf-8');
  return { path: first, content };
});

/* ── App lifecycle ── */
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* Prevent navigation to external URLs inside the window */
app.on('web-contents-created', (_e, contents) => {
  contents.on('will-navigate', (e, url) => {
    const allowed = isDev ? DEV_URL : `file://${path.join(__dirname, '..')}`;
    if (!url.startsWith(allowed)) { e.preventDefault(); shell.openExternal(url); }
  });
});
