import * as fs from "fs";
import jszip from "jszip";
import { BASE_APK_B64 } from "./utils/apkBase64";

async function run() {
    const zip = new jszip();
    const base = await zip.loadAsync(Buffer.from(BASE_APK_B64, "base64"));
    const arsc = await base.file("resources.arsc")!.async("uint8array");

    console.log(`Original resources.arsc size: ${arsc.length}`);
    const view = new DataView(arsc.buffer, arsc.byteOffset, arsc.byteLength);

    // Simple parse of resources.arsc to find strings and package
    const type = view.getUint16(0, true);
    const headerSize = view.getUint16(2, true);
    const chunkSize = view.getUint32(4, true);
    const packageCount = view.getUint32(8, true);
    console.log(`Type: 0x${type.toString(16)}, headerSize: ${headerSize}, chunkSize: ${chunkSize}, packageCount: ${packageCount}`);

    // Find Package chunks and Type chunks
    let offset = headerSize;
    while (offset < arsc.length) {
        const cType = view.getUint16(offset, true);
        const cHeaderSize = view.getUint16(offset + 2, true);
        const cSize = view.getUint32(offset + 4, true);
        console.log(`Chunk at offset ${offset}: type=0x${cType.toString(16)}, size=${cSize}`);
        if (cSize <= 0) break;

        if (cType === 0x0200) { // RES_TABLE_PACKAGE_TYPE
            const pkgId = view.getUint32(offset + 8, true);
            // Read name
            let name = "";
            for (let i = 0; i < 128; i++) {
                const char = view.getUint16(offset + 12 + i * 2, true);
                if (char === 0) break;
                name += String.fromCharCode(char);
            }
            console.log(`  Package ID: ${pkgId}, Name: ${name}`);
        }
        offset += cSize;
    }
}
run();
