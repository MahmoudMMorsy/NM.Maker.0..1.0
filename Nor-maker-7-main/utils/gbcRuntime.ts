/**
 * Minimal Z80/SM83 bootloader for Game Boy.
 * This code initializes the hardware, copies tiles from ROM to VRAM,
 * and enters an infinite loop.
 */
export const GBC_BOOTSTRAP = new Uint8Array([
    // Entry Point at 0x0100: JMP 0x0150
    0x00, 0xC3, 0x50, 0x01,

    // Code at 0x0150
    0x31, 0xFE, 0xFF,       // ld sp, $fffe (Init stack)
    0xAF,                   // xor a
    0xE0, 0x40,             // ldh ($40), a (LCDC off)

    // Copy tiles from 0x4000 (ROM) to 0x8000 (VRAM)
    0x21, 0x00, 0x40,       // ld hl, $4000 (Source)
    0x11, 0x00, 0x80,       // ld de, $8000 (Dest)
    0x01, 0x00, 0x10,       // ld bc, $1000 (Size - copy 256 tiles)

    // CopyLoop:
    0x2A,                   // ld a, (hl+)
    0x12,                   // ld (de), a
    0x13,                   // inc de
    0x0B,                   // dec bc
    0x78,                   // ld a, b
    0xB1,                   // or c
    0x20, 0xF9,             // jr nz, CopyLoop

    // Initialize Map at 0x9800
    0x21, 0x00, 0x98,       // ld hl, $9800
    0x01, 0x00, 0x04,       // ld bc, $0400 (1024 bytes)
    0x3E, 0x00,             // ld a, 0 (Tile 0)
    // MapLoop:
    0x22,                   // ld (hl+), a
    0x3C,                   // inc a (Just to show something, increment tile index)
    0x0B,                   // dec bc
    0x79,                   // ld a, c
    0xB0,                   // or b
    0x20, 0xF9,             // jr nz, MapLoop

    // Palettes
    0x3E, 0x91,             // ld a, %10010001
    0xE0, 0x47,             // ldh ($47), a (BGP)

    // Turn on LCD
    0x3E, 0x91,             // ld a, %10010001 (LCDC on, BG on, etc)
    0xE0, 0x40,             // ldh ($40), a

    // Infinite loop
    0x76,                   // halt
    0x18, 0xFD              // jr -1
]);
