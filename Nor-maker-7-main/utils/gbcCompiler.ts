
import { SpriteAsset, RoomData, GameObject, GeneratedGame } from '../types';
import { GBC_BOOTSTRAP } from './gbcRuntime';

/**
 * GBC Compiler: Generates a binary structure compatible with Game Boy Color ROM format.
 */

export interface GBCCompileInput {
    sprites: SpriteAsset[];
    rooms: RoomData[];
    gameObjects: GameObject[];
    metadata: GeneratedGame['metadata'];
}

/**
 * Converts an image data URL to Game Boy 2bpp tile data (8x8 pixels).
 * Game Boy tiles are 16 bytes each. Each row of 8 pixels is 2 bytes.
 */
async function imageTo2bpp(dataUrl: string): Promise<Uint8Array> {
    return new Promise((resolve) => {
        if (!dataUrl || !dataUrl.startsWith('data:image')) {
            resolve(new Uint8Array(16).fill(0x55)); // Fallback pattern
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 8;
            canvas.height = 8;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(new Uint8Array(16).fill(0x00));
                return;
            }

            ctx.drawImage(img, 0, 0, 8, 8);
            const imageData = ctx.getImageData(0, 0, 8, 8).data;
            const tile = new Uint8Array(16);

            for (let y = 0; y < 8; y++) {
                let byte1 = 0;
                let byte2 = 0;
                for (let x = 0; x < 8; x++) {
                    const idx = (y * 8 + x) * 4;
                    const r = imageData[idx];
                    const g = imageData[idx + 1];
                    const b = imageData[idx + 2];

                    // Convert to grayscale then to 2-bit (4 levels)
                    const brightness = (r + g + b) / 3;
                    let color = 0; // Black
                    if (brightness > 200) color = 0;      // White (Mapped to GB 00)
                    else if (brightness > 128) color = 1; // Light gray (Mapped to GB 01)
                    else if (brightness > 64) color = 2;  // Dark gray (Mapped to GB 10)
                    else color = 3;                       // Black (Mapped to GB 11)

                    // GB format: Bit 0 goes to byte1, Bit 1 goes to byte2
                    if (color & 1) byte1 |= (1 << (7 - x));
                    if (color & 2) byte2 |= (1 << (7 - x));
                }
                tile[y * 2] = byte1;
                tile[y * 2 + 1] = byte2;
            }
            resolve(tile);
        };
        img.onerror = () => resolve(new Uint8Array(16).fill(0xAA));
        img.src = dataUrl;
    });
}

export async function compileToGBC(input: GBCCompileInput): Promise<{ rom: Uint8Array; warnings: string[] }> {
    const warnings: string[] = [];
    const ROM_SIZE = 32768;
    const rom = new Uint8Array(ROM_SIZE);

    // 0. Bootstrap Code (Executable)
    rom.set(GBC_BOOTSTRAP, 0x0100);

    // 1. Mandatory Nintendo Global Logo
    const nintendoLogo = new Uint8Array([
        0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D,
        0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E, 0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99,
        0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC, 0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E
    ]);
    rom.set(nintendoLogo, 0x0104);

    // 2. Title
    const title = input.metadata.title.toUpperCase().slice(0, 15);
    for (let i = 0; i < title.length; i++) {
        rom[0x0134 + i] = title.charCodeAt(i);
    }

    // 3. GBC Support Flag (0x80 = GBC Compatible)
    rom[0x0143] = 0x80;

    // 4. Cartridge Type (0x00 = ROM ONLY)
    rom[0x0147] = 0x00;

    // 5. Header Checksum
    let checksum = 0;
    for (let i = 0x0134; i <= 0x014C; i++) {
        checksum = (checksum - rom[i] - 1) & 0xFF;
    }
    rom[0x014D] = checksum;

    // 6. Asset Injection
    let offset = 0x4000;
    for (const sprite of input.sprites) {
        if (offset + 16 > ROM_SIZE) {
            warnings.push(`ROM Space exceeded. Skipping ${sprite.name}`);
            break;
        }
        const tileData = await imageTo2bpp(sprite.src);
        rom.set(tileData, offset);
        offset += 16;
    }

    // 7. Global Checksum
    let globalChecksum = 0;
    for (let i = 0; i < ROM_SIZE; i++) {
        if (i !== 0x014E && i !== 0x014F) {
            globalChecksum = (globalChecksum + rom[i]) & 0xFFFF;
        }
    }
    rom[0x014E] = (globalChecksum >> 8) & 0xFF;
    rom[0x014F] = globalChecksum & 0xFF;

    return { rom, warnings };
}
