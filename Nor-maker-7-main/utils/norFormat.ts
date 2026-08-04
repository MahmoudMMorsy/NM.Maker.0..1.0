
import { SpriteAsset, BackgroundAsset, SoundAsset, FontAsset, ScriptAsset, RoomData, GameObject, GameMetadata, UIMenu } from '../types';

// LZW Compression Algorithm for .Nor Format (High Density V2)
// Uses binary packing for LZW codes to maximize compression ratio.

export interface NorFile {
    // "PNOR_V1"        → editable project (.pnor)
    // "NOR_SEALED_V1"  → sealed/compiled simulator-only game (.nor)
    // "NOR_HD_V2/V3"   → legacy. Treat as .pnor (auto-import as editable).
    magic: string;
    meta: {
        title: string;
        timestamp: number;
        version: string;
    };
    payload: string; // The full HTML/JS prototype code
    project?: {      // The source state for the editor
        metadata: GameMetadata;
        sprites: SpriteAsset[];
        backgrounds: BackgroundAsset[];
        sounds: SoundAsset[];
        fonts: FontAsset[];
        scripts: ScriptAsset[];
        rooms: RoomData[];
        gameObjects: GameObject[];
        uiMenus: UIMenu[];
        customTiles?: any;
        extensions?: string[];
    };
}

// Describes what kind of file the user just opened.
export type NorPackageKind = 'pnor' | 'sealed' | 'legacy-editable';

export interface InspectedNorPackage {
    pkg: NorFile;
    kind: NorPackageKind;
    /** True for .pnor and legacy editable .nor — false for sealed .nor. */
    editable: boolean;
}

// Helper: Minify Source Code (Strip Comments & Whitespace)
// This significantly reduces the size of the HTML/JS before LZW compression takes over.
const optimizeSource = (source: string): string => {
    if (!source) return "";

    // 1. Remove single line comments (Careful not to break URLs or strings)
    // We use a safe approach: Remove purely whitespace lines and trim
    let clean = source.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');

    // 2. Remove block comments /* ... */
    clean = clean.replace(/\/\*[\s\S]*?\*\//g, '');

    // 3. Remove lines starting with // (Comment lines)
    clean = clean.replace(/^\s*\/\/.*$/gm, '');

    return clean;
};

// Core LZW Compression
// Input: Raw String (HTML/JS)
// Output: Array of 12-16 bit codes
export const compressLZW = (uncompressed: string): number[] => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(uncompressed);

    let dictSize = 256;
    const dictionary: Map<string, number> = new Map();

    for (let i = 0; i < 256; i++) {
        dictionary.set(String.fromCharCode(i), i);
    }

    let w = "";
    const result: number[] = [];

    for (let i = 0; i < bytes.length; i++) {
        const c = String.fromCharCode(bytes[i]);
        const wc = w + c;

        if (dictionary.has(wc)) {
            w = wc;
        } else {
            if (w !== "") {
                result.push(dictionary.get(w)!);
            }
            if (dictSize < 65535) {
                dictionary.set(wc, dictSize++);
            }
            w = c;
        }
    }

    if (w !== "") {
        result.push(dictionary.get(w)!);
    }

    return result;
};

// Core LZW Decompression
export const decompressLZW = (compressed: number[], useUriEncoding: boolean = false): string => {
    if (!compressed || compressed.length === 0) return "";

    let dictSize = 256;
    const dictionary: string[] = [];

    for (let i = 0; i < 256; i++) {
        dictionary[i] = String.fromCharCode(i);
    }

    let w = String.fromCharCode(compressed[0]);
    let resultStr = w;
    let entry = "";

    for (let i = 1; i < compressed.length; i++) {
        const k = compressed[i];

        if (k < dictSize) {
            entry = dictionary[k];
        } else if (k === dictSize) {
            entry = w + w.charAt(0);
        } else {
            console.error(`LZW Decompression Error: Code ${k} out of bounds (dictSize: ${dictSize})`);
            throw new Error(`Corrupted LZW stream: Code ${k} is invalid.`);
        }

        if (entry === undefined) {
             throw new Error(`LZW Dictionary Error: Entry for code ${k} is undefined.`);
        }

        resultStr += entry;

        // Add w + entry[0] to the dictionary ONLY IF within 16-bit limit
        if (dictSize < 65535) {
            dictionary[dictSize++] = w + entry.charAt(0);
        }

        w = entry;
    }

    if (useUriEncoding) {
        try {
            return decodeURIComponent(resultStr);
        } catch (e) {
            console.warn("LZW Decode URI Error, attempting fallback to raw string.", e);
            return resultStr; // Fallback
        }
    } else {
        try {
            const u8 = new Uint8Array(resultStr.length);
            for (let i = 0; i < resultStr.length; i++) {
                u8[i] = resultStr.charCodeAt(i);
            }
            const decoder = new TextDecoder();
            return decoder.decode(u8);
        } catch (e) {
            console.error("LZW Decode Error: Data might be corrupted.", e);
            throw new Error("LZW Decompression resulted in invalid encoding.");
        }
    }
};

// --- BINARY PACKING FOR HIGH COMPRESSION ---

const packCodesToBase64 = (codes: number[]): string => {
    // Convert 16-bit codes to 8-bit byte array (Little Endian)
    // This is crucial because 'btoa' only accepts "binary strings" (chars 0-255).
    // Directly converting codes > 255 to string throws "InvalidCharacterError".
    const u8 = new Uint8Array(codes.length * 2);
    for (let i = 0; i < codes.length; i++) {
        const val = codes[i];
        u8[i * 2] = val & 0xFF;
        u8[i * 2 + 1] = (val >> 8) & 0xFF;
    }

    // Convert Uint8Array to Binary String
    // Process in chunks to avoid stack overflow on large files
    let binary = '';
    const len = u8.length;
    const CHUNK = 4096;
    for (let i = 0; i < len; i += CHUNK) {
        binary += String.fromCharCode(...u8.subarray(i, i + CHUNK));
    }

    return btoa(binary);
};

const unpackBase64ToCodes = (base64: string): number[] => {
    try {
        // Fix: Sanitize input to remove any non-base64 characters (including Unicode whitespaces)
        // This prevents 'atob' from throwing "characters outside of Latin1 range"
        const cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, "");

        const binary = atob(cleanBase64);
        const len = binary.length;
        const codes: number[] = [];

        // Reconstruct 16-bit codes from binary string (Little Endian)
        for (let i = 0; i < len; i += 2) {
            const low = binary.charCodeAt(i);
            const high = binary.charCodeAt(i + 1) || 0; // Handle odd length safety
            codes.push(low | (high << 8));
        }
        return codes;
    } catch (e) {
        console.error("Base64 Unpack Error", e);
        return [];
    }
};

// --- PUBLIC API ---

const buildPackage = (
    magic: string,
    title: string,
    htmlContent: string,
    projectData?: NorFile['project']
): string => {
    const optimizedContent = optimizeSource(htmlContent);
    const lzwCodes = compressLZW(optimizedContent);
    const packedPayload = packCodesToBase64(lzwCodes);

    const pkg: NorFile = {
        magic,
        meta: { title, timestamp: Date.now(), version: "9.0" },
        payload: packedPayload,
        project: projectData,
    };
    return "NOR:" + JSON.stringify(pkg);
};

/**
 * Create a `.pnor` (editable project) package.
 * Contains both the playable HTML/JS payload AND the full editor source state.
 */
export const createPnorPackage = (
    title: string,
    htmlContent: string,
    projectData: NonNullable<NorFile['project']>
): string => buildPackage('PNOR_V1', title, htmlContent, projectData);

/**
 * Create a sealed `.nor` (simulator-only) package.
 * Contains only the playable HTML/JS payload — no editor source — so the game
 * can be distributed without exposing the project.
 */
export const createSealedNorPackage = (
    title: string,
    htmlContent: string
): string => buildPackage('NOR_SEALED_V1', title, htmlContent, undefined);

/**
 * Backward-compatible factory.
 * If `projectData` is provided, produces a `.pnor`; otherwise a sealed `.nor`.
 * Kept so older callsites (and other tools) keep working.
 */
export const createNorPackage = (
    title: string,
    htmlContent: string,
    projectData?: NorFile['project']
): string =>
    projectData
        ? createPnorPackage(title, htmlContent, projectData)
        : createSealedNorPackage(title, htmlContent);

export const parseNorPackage = (fileContent: string): NorFile | null => {
    if (!fileContent) return null;

    const magicIndex = fileContent.indexOf("NOR:");
    if (magicIndex === -1) {
        window.alert("Invalid file format. Missing NOR header.");
        return null;
    }

    try {
        const rawPayload = fileContent.substring(magicIndex + 4).trim();
        let pkg: NorFile;

        // Check if the rawPayload is a JSON string (New Format where only payload is compressed)
        if (rawPayload.startsWith('{')) {
            pkg = JSON.parse(rawPayload);
            // Decompress the payload field
            if (pkg.payload) {
                const isLegacyEncoding = pkg.magic !== "NOR_HD_V3";
                const lzwCodes = unpackBase64ToCodes(pkg.payload);
                pkg.payload = decompressLZW(lzwCodes, isLegacyEncoding);
            }
        } else {
            // Legacy format: the entire JSON was compressed
            let lzwCodes: number[] = [];

            // Legacy Support: Check if payload is a JSON array of numbers (Old Format)
            if (rawPayload.startsWith('[')) {
                try {
                    lzwCodes = JSON.parse(rawPayload);
                    console.log("Detected Legacy NOR Format (JSON Array)");
                } catch (e) {
                    // If parsing as JSON fails, fall back to Base64 unpack
                    console.warn("Failed to parse as legacy JSON, attempting Base64...");
                    lzwCodes = unpackBase64ToCodes(rawPayload);
                }
            } else {
                // Standard HD Format (Base64 Binary)
                lzwCodes = unpackBase64ToCodes(rawPayload);
            }

            if (!lzwCodes || lzwCodes.length === 0) throw new Error("Empty or invalid payload");

            // 2. Decompress (Legacy formats always used URI encoding)
            const jsonString = decompressLZW(lzwCodes, true);

            if (!jsonString) throw new Error("Decompression failed or resulted in empty string");

            // 3. Parse JSON
            pkg = JSON.parse(jsonString) as NorFile;
        }

        // 4. Validate (Safety check for object shape)
        if (!pkg || typeof pkg !== 'object') {
             throw new Error("Parsed data is not a valid object");
        }

        // Graceful handling of missing magic if structure is otherwise sound (Backward comp)
        if (!pkg.magic && !pkg.payload) {
             throw new Error("Invalid NOR Package structure");
        }

        return pkg;
    } catch (e) {
        console.error("Failed to parse .Nor file", e);
        const msg = e instanceof Error ? e.message : "Unknown Error";
        window.alert("خطأ في قراءة ملف المشروع. الملف قد يكون تالفاً أو بتنسيق غير مدعوم.\nError: " + msg);
        return null;
    }
};

/**
 * Inspect a parsed package and classify it as `.pnor`, sealed `.nor`,
 * or a legacy `.nor` (which we treat as editable for backward compat).
 *
 * Old `.nor` files (NOR_HD_V2/V3) shipped BOTH the playable HTML and the
 * full editor `project` state. They open as editable projects so users do
 * not lose access to the 80+ existing sample games when we move to the
 * `.pnor` / `.nor` split.
 */
export const inspectNorPackage = (fileContent: string): InspectedNorPackage | null => {
    const pkg = parseNorPackage(fileContent);
    if (!pkg) return null;

    if (pkg.magic === 'PNOR_V1') {
        return { pkg, kind: 'pnor', editable: true };
    }
    if (pkg.magic === 'NOR_SEALED_V1') {
        return { pkg, kind: 'sealed', editable: false };
    }
    // Legacy NOR_HD_V2 / NOR_HD_V3 (or anything else with a project blob):
    // treat as editable so old games still load into the editor.
    return { pkg, kind: 'legacy-editable', editable: !!pkg.project };
};
