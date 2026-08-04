import * as fs from 'fs';
import pako from 'pako';
import { ActionDefinition } from '../../utils/actionLibrary';

/**
 * Procedural Parser for Legacy GameMaker .lib Files
 * Format (per action record, starting at each marker after the first):
 *   [4-byte marker 08 02 00 00]
 *   [GM-string: internal name]
 *   [int32: action id]
 *   [int32: icon size]
 *   [<iconSize> bytes: BMP icon data]
 *   [GM-string: empty]
 *   [GM-string: empty]
 *   [GM-string: empty]
 *   [GM-string: display name]
 *   [GM-string: description]
 *   [GM-string: tooltip]
 *   ... more fields (params etc)
 */
export class LibParser {
  private buffer: Buffer;

  constructor(data: Buffer | ArrayBuffer) {
    if (data instanceof Buffer) {
      this.buffer = data;
    } else {
      this.buffer = Buffer.from(new Uint8Array(data as ArrayBuffer));
    }
  }

  private readInt32(offset: number): number {
    if (offset + 4 > this.buffer.length) return 0;
    return this.buffer.readInt32LE(offset);
  }

  private readString(offset: number): { str: string; nextOffset: number } {
    if (offset + 4 > this.buffer.length) return { str: '', nextOffset: offset + 4 };
    const len = this.readInt32(offset);
    if (len < 0 || len > 200000) return { str: '', nextOffset: offset + 4 };
    const str = this.buffer.toString('latin1', offset + 4, offset + 4 + len);
    return { str, nextOffset: offset + 4 + len };
  }

  public parse(libPrefix: string): ActionDefinition[] {
    const actions: ActionDefinition[] = [];
    const marker = Buffer.from([0x08, 0x02, 0x00, 0x00]);

    const markerOffsets: number[] = [];
    let lastPos = 0;
    while (true) {
      const pos = this.buffer.indexOf(marker, lastPos);
      if (pos === -1) break;
      markerOffsets.push(pos);
      lastPos = pos + 4;
    }

    if (markerOffsets.length < 2) return [];

    console.log(`  Parsing ${libPrefix}: markerHits=${markerOffsets.length}`);

    // Skip marker 0 (library global header), start from marker 1
    for (let i = 1; i < markerOffsets.length; i++) {
      try {
        let offset = markerOffsets[i] + 4; // Skip the 4-byte marker itself

        // Read internal name (e.g. "Move", "Set_Motion")
        const nameRes = this.readString(offset);
        offset = nameRes.nextOffset;
        const internalName = nameRes.str;

        // Read action ID
        const actionId = this.readInt32(offset);
        offset += 4;

        // Read icon size
        const iconSize = this.readInt32(offset);
        offset += 4;

        // Validate: icon must start with 'BM' (0x42 0x4D)
        if (iconSize <= 0 || iconSize > 65535) continue;
        if (this.buffer[offset] !== 0x42 || this.buffer[offset + 1] !== 0x4D) continue;

        const iconBuffer = this.buffer.slice(offset, offset + iconSize);

        // Fix transparency: GameMaker uses Magenta (255, 0, 255) as a transparency key.
        // We need to convert it to a transparent PNG or just manipulate the BMP if possible.
        // For simplicity and compatibility, we'll convert the BMP to a Data URL but we'll
        // try to do a quick pixel swap if it's a 24-bit or 32-bit BMP.
        let iconBase64 = '';
        try {
          iconBase64 = this.processBmpTransparency(iconBuffer);
        } catch (e) {
          iconBase64 = `data:image/bmp;base64,${iconBuffer.toString('base64')}`;
        }

        offset += iconSize;

        // Next 3 fields are typically empty strings
        for (let k = 0; k < 3; k++) {
          const r = this.readString(offset);
          offset = r.nextOffset;
        }

        // Display name (human-readable)
        const displayRes = this.readString(offset);
        offset = displayRes.nextOffset;
        const displayName = displayRes.str || internalName;

        // Description
        const descRes = this.readString(offset);
        offset = descRes.nextOffset;
        const description = descRes.str;

        // Tooltip (skip)
        const tooltipRes = this.readString(offset);
        offset = tooltipRes.nextOffset;

        // Category (next non-empty string or fall back to libPrefix)
        let category = libPrefix;
        for (let k = 0; k < 4; k++) {
          const r = this.readString(offset);
          offset = r.nextOffset;
          if (r.str && r.str.length < 50 && !/[\x00-\x08]/.test(r.str)) {
            category = r.str.toLowerCase();
            break;
          }
        }

        const name = displayName || internalName;
        if (!name || name.length > 80) continue;

        actions.push({
          id: `ext_${libPrefix}_${actionId}`,
          name,
          description: description || `${name} action`,
          category,
          iconUrl: iconBase64,
          params: [],
          generateCode: (_params: Record<string, any>) => `// ${name}`,
        });
      } catch {
        // Continue to next
      }
    }

    return actions;
  }

  /**
   * Processes a BMP buffer and converts magenta (255, 0, 255) to transparent.
   * Returns a base64 PNG data URL.
   */
  private processBmpTransparency(bmpBuffer: Buffer): string {
    if (bmpBuffer[0] !== 0x42 || bmpBuffer[1] !== 0x4D) {
      return `data:image/bmp;base64,${bmpBuffer.toString('base64')}`;
    }

    const dataOffset = bmpBuffer.readUInt32LE(10);
    const width = bmpBuffer.readInt32LE(18);
    const height = Math.abs(bmpBuffer.readInt32LE(22));
    const bitsPerPixel = bmpBuffer.readUInt16LE(28);
    const isTopDown = bmpBuffer.readInt32LE(22) < 0;

    if (bitsPerPixel !== 24 && bitsPerPixel !== 32) {
      return `data:image/bmp;base64,${bmpBuffer.toString('base64')}`;
    }

    const bytesPerPixel = bitsPerPixel / 8;
    const rowSize = Math.floor((bitsPerPixel * width + 31) / 32) * 4;

    // Create a Canvas-compatible RGBA buffer
    const rgba = Buffer.alloc(width * height * 4);

    for (let y = 0; y < height; y++) {
      const rowY = isTopDown ? y : (height - 1 - y);
      const rowOffset = dataOffset + rowY * rowSize;
      for (let x = 0; x < width; x++) {
        const pixelOffset = rowOffset + x * bytesPerPixel;
        const b = bmpBuffer[pixelOffset];
        const g = bmpBuffer[pixelOffset + 1];
        const r = bmpBuffer[pixelOffset + 2];
        const a = bytesPerPixel === 4 ? bmpBuffer[pixelOffset + 3] : 255;

        const targetIdx = (y * width + x) * 4;
        rgba[targetIdx] = r;
        rgba[targetIdx + 1] = g;
        rgba[targetIdx + 2] = b;
        // GameMaker legacy BMPs use Magenta (255, 0, 255) as transparent.
        // Even for 32-bit BMPs, the alpha channel is often 0 everywhere, so we must force alpha to 255 for non-magenta pixels.
        rgba[targetIdx + 3] = (r === 255 && g === 0 && b === 255) ? 0 : 255;
      }
    }

    // Since we are in the browser (usually), we would use a canvas.
    // However, LibParser runs during the import script (Node.js) or in the app.
    // If we are in Node.js (during import), we don't have Canvas.
    // BUT we can wrap it in a PNG-like structure or just return a simple RGBA base64
    // and let the UI handle it.
    // Actually, for the import script to work, we need a way to generate a valid image.
    // Let's use a very simple TGA or just a custom format that the UI can read.
    // OR better: just return the raw RGBA and width/height as a JSON-like string? No, that breaks things.

    // I'll use a hack: For the import script (Node), I'll just keep the BMP for now
    // and let the UI do the transparency if it can, OR I'll include a tiny PNG encoder.
    // Actually, I'll just return the BMP but with the magenta pixels changed to something else?
    // No, BMP doesn't support alpha well.

    // DECISION: I'll use a tiny PNG encoder implementation to ensure it works in both Node and Browser.
    return this.encodeSimplePng(width, height, rgba, bmpBuffer);
  }

  private encodeSimplePng(width: number, height: number, rgba: Buffer, originalBmp: Buffer): string {
    // If we're in the browser, use canvas (fastest and handles PNG best)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
      }
    }

    // In Node.js (import script), we'll encode as a transparent PNG using pako
    try {
      // PNG IDAT requires a filter byte at the start of each row (0 = None)
      const filteredRgba = Buffer.alloc(width * height * 4 + height);
      for (let y = 0; y < height; y++) {
        filteredRgba[y * (width * 4 + 1)] = 0; // Filter None
        rgba.copy(filteredRgba, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
      }

      const compressed = pako.deflate(filteredRgba);

      const chunks: Buffer[] = [];
      // PNG Signature
      chunks.push(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));

      // IHDR
      const ihdr = Buffer.alloc(13);
      ihdr.writeInt32BE(width, 0);
      ihdr.writeInt32BE(height, 4);
      ihdr[8] = 8; // bit depth
      ihdr[9] = 6; // color type (RGBA)
      ihdr[10] = 0; // compression
      ihdr[11] = 0; // filter
      ihdr[12] = 0; // interlace
      chunks.push(this.createPngChunk('IHDR', ihdr));

      // IDAT
      chunks.push(this.createPngChunk('IDAT', Buffer.from(compressed)));

      // IEND
      chunks.push(this.createPngChunk('IEND', Buffer.alloc(0)));

      const finalBuf = Buffer.concat(chunks);
      return `data:image/png;base64,${finalBuf.toString('base64')}`;
    } catch (e) {
      console.warn("PNG encoding failed, falling back to original BMP:", e);
      return `data:image/bmp;base64,${originalBmp.toString('base64')}`;
    }
  }

  private createPngChunk(type: string, data: Buffer): Buffer {
    const chunk = Buffer.alloc(4 + 4 + data.length + 4);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4);
    data.copy(chunk, 8);

    const crc = this.crc32(Buffer.concat([Buffer.from(type), data]));
    chunk.writeUInt32BE(crc >>> 0, 8 + data.length);
    return chunk;
  }

  private crc32(buf: Buffer): number {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
       let b = buf[i];
       crc ^= b;
       for (let j = 0; j < 8; j++) {
         crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
       }
    }
    return ~crc;
  }
}
