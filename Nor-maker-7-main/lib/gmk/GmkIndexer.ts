import { BinaryReader } from './BinaryReader';

export interface ChunkIndex {
    offset: number;
    length: number;
    type: string;
}

export class GmkIndexer {
    public static index(buffer: ArrayBuffer): ChunkIndex[] {
        const reader = new BinaryReader(buffer);
        const indices: ChunkIndex[] = [];

        // Skip header
        reader.readInt32(); // Magic
        reader.readInt32(); // Version
        reader.readInt32(); // AppId
        for (let i = 0; i < 4; i++) reader.readInt32(); // Unknown

        // This is a simplified indexer. It needs to know the structure of the file to correctly identify chunks.
        // The current parser is linear, so the indexer must follow the same path.

        // This is tricky because the structure is not just a list of chunks, but a complex tree.
        // Maybe "Tidal Parsing" should be:
        // 1. Parse the structure linearly, but instead of parsing the content, just store the offset/length of the chunk.

        return indices;
    }
}
