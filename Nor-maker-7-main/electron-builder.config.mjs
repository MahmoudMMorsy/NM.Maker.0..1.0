/**
 * electron-builder configuration for NOR Maker AI
 * Run: pnpm electron:build
 */

export default {
  appId:       'com.normaker.ai',
  productName: 'NOR Maker AI',
  copyright:   'Copyright © 2025 NOR Maker AI',

  /* Source files */
  directories: {
    output: 'release',
    buildResources: 'assets-electron',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'public/nor-player.html',
    'package.json',
  ],
  extraResources: [
    { from: 'public/nor-player.html', to: 'nor-player.html' },
  ],

  /* App icon (electron-builder auto-converts SVG on each platform) */
  icon: 'public/pwa-512x512.svg',

  /* ── Windows ── */
  win: {
    target: [
      { target: 'nsis',     arch: ['x64'] },
      { target: 'portable', arch: ['x64'] },
    ],
    icon: 'public/pwa-512x512.svg',
  },
  nsis: {
    oneClick:               false,
    allowToChangeInstallationDirectory: true,
    installerIcon:          'public/pwa-512x512.svg',
    uninstallerIcon:        'public/pwa-512x512.svg',
    createDesktopShortcut:  true,
    createStartMenuShortcut: true,
    shortcutName:           'NOR Maker AI',
  },

  /* ── macOS ── */
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    category: 'public.app-category.games',
    icon: 'public/pwa-512x512.svg',
  },
  dmg: {
    title: 'NOR Maker AI ${version}',
  },

  /* ── Linux ── */
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb',      arch: ['x64'] },
    ],
    category: 'Game',
    icon: 'public/pwa-512x512.svg',
  },

  /* ── Publishing ── */
  publish: null, // set to GitHub/S3 for auto-update
};
