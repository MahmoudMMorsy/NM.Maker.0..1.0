// build-standalone.mjs
// Runs after vite build to embed local font as base64 in the output HTML
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distHtml = join(__dirname, 'dist', 'index.html');
const fontPath = join(__dirname, 'public', 'fonts', 'press-start-2p.woff2');

let html = readFileSync(distHtml, 'utf-8');
const fontB64 = readFileSync(fontPath).toString('base64');
const fontDataUri = `data:font/woff2;base64,${fontB64}`;

// Replace the local font reference in the CSS link tag and any @font-face src
// The font CSS in public/fonts is copied to dist but with a file path reference:
html = html.replace(
  /url\(['"]?\/fonts\/press-start-2p\.woff2['"]?\)/g,
  `url('${fontDataUri}')`
);
html = html.replace(
  /url\(['"]?fonts\/press-start-2p\.woff2['"]?\)/g,
  `url('${fontDataUri}')`
);

// Also remove any external stylesheet link for the font (we inline it)
html = html.replace(
  /<link[^>]*press-start-2p\.css[^>]*>/g,
  `<style>@font-face{font-family:'Press Start 2P';font-style:normal;font-weight:400;src:url('${fontDataUri}') format('woff2');}</style>`
);

// Also remove tailwind CDN script tag and replace with a comment since
// vite bundles tailwind via the plugin - so no CDN needed in output
// (tailwindcss vite plugin handles this at build time)
html = html.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/gi, '<!-- Tailwind CDN Removed for Standalone Build -->');

writeFileSync(distHtml, html, 'utf-8');
console.log('✅ Font embedded as base64. Standalone HTML ready at dist/index.html');
