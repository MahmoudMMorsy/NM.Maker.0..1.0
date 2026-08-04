/**
 * HTML Game Folder to NOR Converter — Folder Edition
 *
 * Accepts a full game folder (via webkitdirectory input), reads ALL files,
 * converts images/sounds to base64 inline data URLs, and builds a complete NOR project.
 *
 * Supported game engines: Phaser, PIXI.js, Construct 3, GDevelop, RPG Maker MV/MZ, melonJS, etc.
 */

import { SpriteAsset, SoundAsset, ScriptAsset, GameObject, RoomData, GameMetadata, GameAction } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HtmlConversionResult {
    metadata: GameMetadata;
    sprites: SpriteAsset[];
    sounds: SoundAsset[];
    scripts: ScriptAsset[];
    gameObjects: GameObject[];
    rooms: RoomData[];
    rawHtml: string;
    assetMap: AssetMap;
}

export interface AssetMap {
    imagePaths: string[];
    audioPaths: string[];
    fontPaths:  string[];
    dataPaths:  string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const IMAGE_EXTS = /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i;
const AUDIO_EXTS = /\.(mp3|ogg|wav|m4a|aac|opus|flac)$/i;
const FONT_EXTS  = /\.(ttf|woff|woff2|otf|eot)$/i;
const JS_EXTS    = /\.(js|mjs|ts)$/i;
const CSS_EXTS   = /\.css$/i;

/** Convert a File object to a base64 data URL */
const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to read: ${file.name}`));
        reader.readAsDataURL(file);
    });

/** Convert a File object to a UTF-8 string */
const fileToText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to read text: ${file.name}`));
        reader.readAsText(file, 'utf-8');
    });

const extractTitle = (html: string, fallback: string): string => {
    const m = /<title>([^<]+)<\/title>/i.exec(html);
    return m ? m[1].trim() : fallback;
};

// ─── Main Converter ─────────────────────────────────────────────────────────--

/**
 * Converts a game folder (FileList from webkitdirectory input) to a NOR project.
 *
 * @param files - FileList from <input webkitdirectory>
 */
export const convertFolderToNor = async (files: FileList): Promise<HtmlConversionResult> => {
    const fileArray = Array.from(files);

    // ── Categorize all files ──────────────────────────────────────────────────
    const imageFiles: File[] = [];
    const audioFiles: File[] = [];
    const fontFiles:  File[] = [];
    const jsFiles:    File[] = [];
    const cssFiles:   File[] = [];
    const dataFiles:  File[] = [];
    let   htmlFile:   File | null = null;

    for (const f of fileArray) {
        const name = f.name.toLowerCase();
        const path = (f as any).webkitRelativePath || f.name;
        const lpath = path.toLowerCase();

        // Skip hidden files, node_modules, .git
        if (path.includes('node_modules') || path.includes('.git') || path.startsWith('.')) continue;

        if (IMAGE_EXTS.test(name))     imageFiles.push(f);
        else if (AUDIO_EXTS.test(name)) audioFiles.push(f);
        else if (FONT_EXTS.test(name))  fontFiles.push(f);
        else if (JS_EXTS.test(name))    jsFiles.push(f);
        else if (CSS_EXTS.test(name))   cssFiles.push(f);
        else if (name.endsWith('.json') || name.endsWith('.tmj') || name.endsWith('.tmx')) dataFiles.push(f);
        // Choose the best HTML entry point
        else if (name.endsWith('.html') || name.endsWith('.htm')) {
            if (!htmlFile || lpath.includes('index')) htmlFile = f;
        }
    }

    // ── Read the HTML file ───────────────────────────────────────────────────
    const htmlContent = htmlFile ? await fileToText(htmlFile) : '';
    const gameName = htmlFile ? htmlFile.webkitRelativePath.split('/')[0] : 'imported_game';
    const title = extractTitle(htmlContent, gameName);

    // ── Convert images to base64 sprites ─────────────────────────────────────
    const sprites: SpriteAsset[] = await Promise.all(
        imageFiles.map(async (f, i) => {
            const src = await fileToDataUrl(f);
            const path = (f as any).webkitRelativePath || f.name;
            const name = 'spr_' + path.replace(/[^a-zA-Z0-9_]/g, '_').replace(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i, '');
            return { id: `spr_${uid()}`, name, src, role: 'decoration' as const };
        })
    );

    // ── Convert audio to sound assets ─────────────────────────────────────────
    const sounds: SoundAsset[] = await Promise.all(
        audioFiles.map(async (f) => {
            const src = await fileToDataUrl(f);
            const path = (f as any).webkitRelativePath || f.name;
            const name = 'snd_' + path.replace(/[^a-zA-Z0-9_]/g, '_').replace(/\.(mp3|ogg|wav|m4a|aac|opus)$/i, '');
            return { id: `snd_${uid()}`, name, src };
        })
    );

    // ── Read JS files as scripts ──────────────────────────────────────────────
    const scripts: ScriptAsset[] = [];

    // First: inline <script> blocks from HTML
    if (htmlContent) {
        const inlineRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
        let m: RegExpExecArray | null;
        let idx = 0;
        while ((m = inlineRegex.exec(htmlContent)) !== null) {
            const code = m[1].trim();
            if (code.length < 10) continue;
            scripts.push({ id: `scr_${uid()}`, name: `scr_html_inline_${idx}`, code });
            idx++;
        }
    }

    // Then: external JS files from the folder
    for (const f of jsFiles) {
        const code = await fileToText(f);
        const path = (f as any).webkitRelativePath || f.name;
        const name = 'scr_' + path.replace(/[^a-zA-Z0-9_]/g, '_').replace(/\.js$/i, '');
        scripts.push({ id: `scr_${uid()}`, name, code });
    }

    // ── Build the inlined game HTML (patch asset paths → base64) ─────────────
    // Replace relative paths in HTML/JS with base64 inline data so the game
    // runs inside NOR Maker's iframe without needing a web server.
    let patchedHtml = htmlContent;

    // Build path→dataUrl lookup
    const pathToDataUrl: Record<string, string> = {};
    for (let i = 0; i < imageFiles.length; i++) {
        const relativePath = (imageFiles[i] as any).webkitRelativePath || imageFiles[i].name;
        // e.g. "game/assets/player.png" → "assets/player.png"
        const key = relativePath.split('/').slice(1).join('/');
        pathToDataUrl[key] = sprites[i].src;
        pathToDataUrl[imageFiles[i].name] = sprites[i].src; // also match by filename only
    }
    for (let i = 0; i < audioFiles.length; i++) {
        const relativePath = (audioFiles[i] as any).webkitRelativePath || audioFiles[i].name;
        const key = relativePath.split('/').slice(1).join('/');
        pathToDataUrl[key] = sounds[i].src;
        pathToDataUrl[audioFiles[i].name] = sounds[i].src;
    }

    // Patch the HTML: replace references like "assets/player.png" with base64
    for (const [relPath, dataUrl] of Object.entries(pathToDataUrl)) {
        const escaped = relPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        patchedHtml = patchedHtml.replace(new RegExp(`(["'\`])${escaped}(["'\`])`, 'g'),
            (_m, q1, q2) => `${q1}${dataUrl}${q2}`);
    }

    // ── Embed external JS files into the HTML ─────────────────────────────────
    // Replace <script src="js/game.js"> with inline <script>actual code</script>
    for (const f of jsFiles) {
        const code = await fileToText(f);
        const relativePath = (f as any).webkitRelativePath || f.name;
        const key = relativePath.split('/').slice(1).join('/');
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        patchedHtml = patchedHtml.replace(
            new RegExp(`<script[^>]+src=["'\`]${escaped}["'\`][^>]*><\\/script>`, 'gi'),
            `<script>\n${code}\n</script>`
        );
        // Also try filename only
        const fname = f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        patchedHtml = patchedHtml.replace(
            new RegExp(`<script[^>]+src=["'\`][^"'\`]*${fname}["'\`][^>]*><\\/script>`, 'gi'),
            `<script>\n${code}\n</script>`
        );
    }

    // ── Build Wrapper Object ──────────────────────────────────────────────────
    const wrapperObjId = `obj_html_${uid()}`;
    const roomId       = `rm_html_${uid()}`;

    const wrapperCode = [
        `// ─── HTML5 Game: ${title} ───`,
        `// Auto-imported by NOR Maker from folder: ${gameName}`,
        `// Assets: ${sprites.length} images | ${sounds.length} sounds | ${scripts.length} scripts`,
        '',
        '// The full game runs via its patched HTML below.',
        '// All asset paths have been replaced with inline base64 data.',
    ].join('\n');

    const wrapperAction: GameAction = {
        id: `act_${uid()}`,
        libId: 'control_execute',
        params: { code: wrapperCode },
    };

    const wrapperObject: GameObject = {
        id: wrapperObjId,
        name: `obj_${title.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20)}`,
        spriteId: sprites[0]?.id ?? null,
        events: { create: [wrapperAction] },
    };

    const defaultRoom: RoomData = {
        id: roomId,
        width: 16,
        height: 15,
        map: new Array(240).fill(0),
        settings: {
            name: roomId,
            caption: title,
            speed: 60,
            lives: 0,
            persistent: false,
            clearView: true,
            creationCode: '',
            tileAnimSpeed: 250,
            enableViews: false,
            bgColor: '#000000',
            drawBgColor: true,
            snapX: 16,
            snapY: 16,
        },
        backgrounds: [],
        views: [],
    };

    const metadata: GameMetadata = {
        title,
        story: `Imported from folder: ${gameName} | ${sprites.length} sprites, ${sounds.length} sounds, ${scripts.length} scripts`,
        genre: 'imported',
        controls: 'See Game Script',
        languages: ['ar', 'en'],
        defaultLanguage: 'ar',
    };

    const assetMap: AssetMap = {
        imagePaths: imageFiles.map(f => (f as any).webkitRelativePath || f.name),
        audioPaths: audioFiles.map(f => (f as any).webkitRelativePath || f.name),
        fontPaths:  fontFiles.map(f  => (f as any).webkitRelativePath || f.name),
        dataPaths:  dataFiles.map(f  => (f as any).webkitRelativePath || f.name),
    };

    return {
        metadata, sprites, sounds, scripts,
        gameObjects: [wrapperObject],
        rooms: [defaultRoom],
        rawHtml: patchedHtml, // This is the self-contained patched HTML
        assetMap,
    };
};

// ─── Keep single-file import for backwards compatibility ──────────────────────
export const convertHtmlToNor = (htmlContent: string, fileName: string): HtmlConversionResult => {
    const title = extractTitle(htmlContent, fileName.replace(/\.[^.]+$/, ''));
    const scripts: ScriptAsset[] = [];

    const inlineRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    let idx = 0;
    while ((m = inlineRegex.exec(htmlContent)) !== null) {
        const code = m[1].trim();
        if (code.length < 10) continue;
        scripts.push({ id: `scr_${uid()}`, name: `scr_inline_${idx}`, code });
        idx++;
    }

    const wrapperObjId = `obj_html_${uid()}`;
    const roomId = `rm_html_${uid()}`;

    const wrapperAction: GameAction = {
        id: `act_${uid()}`, libId: 'control_execute',
        params: { code: scripts.map(s => s.code).join('\n\n') || '// No script found' },
    };
    const wrapperObject: GameObject = {
        id: wrapperObjId,
        name: `obj_${title.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20)}`,
        spriteId: null,
        events: { create: [wrapperAction] },
    };
    const defaultRoom: RoomData = {
        id: roomId, width: 16, height: 15, map: new Array(240).fill(0),
        settings: { name: roomId, caption: title, speed: 60, lives: 0, persistent: false, clearView: true, creationCode: '', tileAnimSpeed: 250, enableViews: false, bgColor: '#000000', drawBgColor: true, snapX: 16, snapY: 16 },
        backgrounds: [], views: [],
    };
    const metadata: GameMetadata = {
        title, story: `Imported from: ${fileName}`, genre: 'imported',
        controls: 'See script', languages: ['ar', 'en'], defaultLanguage: 'ar',
    };
    return {
        metadata, sprites: [], sounds: [], scripts,
        gameObjects: [wrapperObject], rooms: [defaultRoom],
        rawHtml: htmlContent,
        assetMap: { imagePaths: [], audioPaths: [], fontPaths: [], dataPaths: [] },
    };
};
