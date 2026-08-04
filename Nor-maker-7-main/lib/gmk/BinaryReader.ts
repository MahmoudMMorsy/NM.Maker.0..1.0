import pako from 'pako';

export class BinaryReader {
    private buffer: ArrayBuffer;
    private view: DataView;
    private offset: number;
    public byteLength: number;

    constructor(buffer: ArrayBufferLike, byteOffset: number = 0, byteLength?: number) {
        this.buffer = buffer as ArrayBuffer;
        this.byteLength = byteLength ?? buffer.byteLength;
        this.view = new DataView(this.buffer, byteOffset, this.byteLength);
        this.offset = 0;
    }

    public getOffset(): number {
        return this.offset;
    }

    public setOffset(offset: number): void {
        this.offset = offset;
    }

    public getLength(): number {
        return this.byteLength;
    }

    public eof(): boolean {
        return this.offset >= this.byteLength;
    }

    public readInt32(): number {
        if (this.offset + 4 > this.byteLength) {
            console.error(`EOF reached reading Int32: offset=${this.offset}, byteLength=${this.byteLength}`);
            throw new Error("EOF reached reading Int32");
        }
        const val = this.view.getInt32(this.offset, true); // Little endian
        this.offset += 4;
        return val;
    }

    public readUInt32(): number {
        if (this.offset + 4 > this.byteLength) {
            console.error(`EOF reached reading UInt32: offset=${this.offset}, byteLength=${this.byteLength}`);
            throw new Error("EOF reached reading UInt32");
        }
        const val = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return val;
    }

    public readDouble(): number {
        if (this.offset + 8 > this.byteLength) {
            console.error(`EOF reached reading Double: offset=${this.offset}, byteLength=${this.byteLength}`);
            throw new Error("EOF reached reading Double");
        }
        const val = this.view.getFloat64(this.offset, true);
        this.offset += 8;
        return val;
    }

    public readInt64(): bigint {
        if (this.offset + 8 > this.byteLength) {
            console.error(`EOF reached reading Int64: offset=${this.offset}, byteLength=${this.byteLength}`);
            throw new Error("EOF reached reading Int64");
        }
        const val = this.view.getBigInt64(this.offset, true);
        this.offset += 8;
        return val;
    }

    public readBool(): boolean {
        return this.readInt32() !== 0;
    }

    public readString(): string {
        const length = this.readInt32();
        if (length === 0) return "";
        // Safety check: don't try to read strings larger than 10MB
        if (length < 0 || length > 10 * 1024 * 1024 || this.offset + length > this.byteLength) {
            console.error(`Invalid string length: offset=${this.offset}, length=${length}, byteLength=${this.byteLength}`);
            throw new Error(`Invalid string length: ${length}`);
        }

        const bytes = new Uint8Array(this.buffer, this.view.byteOffset + this.offset, length);
        this.offset += length;

        // GM8 strings are typically ANSI/Windows-1252
        const decoder = new TextDecoder('windows-1252');
        return decoder.decode(bytes);
    }

    public readBytes(length: number): Uint8Array {
        if (length < 0 || length > 100 * 1024 * 1024) { // 100MB safety limit
            console.error(`Invalid length reading Bytes: length=${length}, offset=${this.offset}`);
            throw new Error(`Invalid length reading Bytes: ${length}`);
        }
        if (this.offset + length > this.byteLength) {
            console.error(`EOF reached reading Bytes: offset=${this.offset}, length=${length}, byteLength=${this.byteLength}`);
            throw new Error("EOF reached reading Bytes");
        }
        const bytes = new Uint8Array(this.buffer, this.view.byteOffset + this.offset, length);
        this.offset += length;
        return bytes;
    }

    public decrypt(data: Uint8Array, seed: number): Uint8Array {
        let key = seed;
        const result = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            // Standard GM8 XOR-style decryption
            result[i] = (data[i] ^ (key & 0xFF));
            key = (key * 0x08088405 + 1) >>> 0;
        }
        return result;
    }

    public readZlibChunk(decryptSeed?: number): Uint8Array {
        const compressedLength = this.readInt32();
        if (compressedLength === 0) return new Uint8Array(0);

        if (compressedLength < 0 || compressedLength > 50 * 1024 * 1024) {
            throw new Error(`Invalid zlib chunk length: ${compressedLength}`);
        }

        let data = this.readBytes(compressedLength);

        // Apply decryption if a seed is provided (GM8.0 style)
        if (decryptSeed !== undefined) {
            data = this.decrypt(data, decryptSeed);
        }

        try {
            // Check for Zlib magic (0x78)
            if (data.length > 2 && data[0] === 0x78) {
                return pako.inflate(data);
            }
            return data;
        } catch (e) {
            console.error(`readZlibChunk: pako.inflate failed:`, e);
            return data;
        }
    }
}
