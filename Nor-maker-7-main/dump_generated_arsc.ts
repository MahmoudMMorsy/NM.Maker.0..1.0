import * as fs from "fs";
import jszip from "jszip";

async function run() {
    const data = fs.readFileSync("test_generated.apk");
    const zip = new jszip();
    const base = await zip.loadAsync(data);
    const arsc = await base.file("resources.arsc")!.async("uint8array");

    console.log(`Generated resources.arsc size: ${arsc.length}`);
    const view = new DataView(arsc.buffer, arsc.byteOffset, arsc.byteLength);

    // Parse resources.arsc
    const type = view.getUint16(0, true);
    const headerSize = view.getUint16(2, true);
    const chunkSize = view.getUint32(4, true);
    const packageCount = view.getUint32(8, true);
    console.log(`Table Header: type=0x${type.toString(16)}, headerSize=${headerSize}, chunkSize=${chunkSize}, packageCount=${packageCount}`);

    // Find Package chunk (should be at offset 12 + global string pool chunk size)
    let offset = headerSize;
    while (offset < arsc.length) {
        const cType = view.getUint16(offset, true);
        const cHeaderSize = view.getUint16(offset + 2, true);
        const cSize = view.getUint32(offset + 4, true);
        console.log(`Chunk at offset ${offset}: type=0x${cType.toString(16)}, headerSize=${cHeaderSize}, size=${cSize}`);
        if (cSize <= 0) break;

        if (cType === 0x0001) { // RES_STRING_POOL_TYPE
            // Read strings in global string pool
            const stringCount = view.getUint32(offset + 8, true);
            const stringsStart = view.getUint32(offset + 20, true);
            console.log(`  Global String Pool: count=${stringCount}`);
            for (let i = 0; i < stringCount; i++) {
                const off = view.getUint32(offset + 28 + i * 4, true);
                const strOffset = offset + stringsStart + off;

                // Read UTF-8 string
                const charLen = arsc[strOffset];
                const byteLen = arsc[strOffset + 1];
                let str = "";
                for (let j = 0; j < byteLen; j++) {
                    str += String.fromCharCode(arsc[strOffset + 2 + j]);
                }
                console.log(`    String [${i}]: '${str}' (charLen=${charLen}, byteLen=${byteLen})`);
            }
        }

        if (cType === 0x0200) { // RES_TABLE_PACKAGE_TYPE
            const pkgId = view.getUint32(offset + 8, true);
            let name = "";
            for (let i = 0; i < 128; i++) {
                const char = view.getUint16(offset + 12 + i * 2, true);
                if (char === 0) break;
                name += String.fromCharCode(char);
            }
            console.log(`  Package: id=${pkgId}, name='${name}'`);

            const typeStringsOffset = view.getUint32(offset + 268, true);
            const keyStringsOffset = view.getUint32(offset + 276, true);
            console.log(`    typeStringsOffset=${typeStringsOffset}, keyStringsOffset=${keyStringsOffset}`);

            // Let's parse subchunks of Package
            let subOffset = offset + cHeaderSize;
            while (subOffset < offset + cSize) {
                const sType = view.getUint16(subOffset, true);
                const sHeaderSize = view.getUint16(subOffset + 2, true);
                const sSize = view.getUint32(subOffset + 4, true);
                console.log(`    Subchunk at ${subOffset}: type=0x${sType.toString(16)}, size=${sSize}`);

                if (sType === 0x0001) { // String pool inside package
                    const stringCount = view.getUint32(subOffset + 8, true);
                    const stringsStart = view.getUint32(subOffset + 20, true);
                    console.log(`      String Pool inside package: count=${stringCount}`);
                    for (let i = 0; i < stringCount; i++) {
                        const off = view.getUint32(subOffset + 28 + i * 4, true);
                        const strOffset = subOffset + stringsStart + off;
                        const charLen = arsc[strOffset];
                        const byteLen = arsc[strOffset + 1];
                        let str = "";
                        for (let j = 0; j < byteLen; j++) {
                            str += String.fromCharCode(arsc[strOffset + 2 + j]);
                        }
                        console.log(`        String [${i}]: '${str}'`);
                    }
                }

                if (sType === 0x0202) { // RES_TABLE_TYPE_SPEC_TYPE
                    const typeId = arsc[subOffset + 8];
                    const entryCount = view.getUint32(subOffset + 12, true);
                    console.log(`      TypeSpec: id=${typeId}, entryCount=${entryCount}`);
                }

                if (sType === 0x0201) { // RES_TABLE_TYPE_TYPE
                    const typeId = arsc[subOffset + 8];
                    const entryCount = view.getUint32(subOffset + 12, true);
                    const entriesStart = view.getUint32(subOffset + 16, true);
                    console.log(`      TypeChunk: id=${typeId}, entryCount=${entryCount}, entriesStart=${entriesStart}`);

                    // Let's read entries
                    const entryOffset = view.getUint32(subOffset + sHeaderSize, true);
                    const absoluteEntryPtr = subOffset + entriesStart + entryOffset;
                    const size = view.getUint16(absoluteEntryPtr, true);
                    const flags = view.getUint16(absoluteEntryPtr + 2, true);
                    const keyIdx = view.getUint32(absoluteEntryPtr + 4, true);
                    console.log(`        Entry [0]: size=${size}, flags=${flags}, keyIdx=${keyIdx}`);

                    // Res_value
                    const valPtr = absoluteEntryPtr + size;
                    const valSize = view.getUint16(valPtr, true);
                    const valRes0 = arsc[valPtr + 2];
                    const valDataType = arsc[valPtr + 3];
                    const valData = view.getUint32(valPtr + 4, true);
                    console.log(`          Value: size=${valSize}, res0=${valRes0}, dataType=${valDataType}, data=0x${valData.toString(16)}`);
                }

                subOffset += sSize;
            }
        }
        offset += cSize;
    }
}
run();
