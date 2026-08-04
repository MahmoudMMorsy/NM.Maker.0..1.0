import * as fs from "fs";
import jszip from "jszip";
import { BASE_APK_B64 } from "./utils/apkBase64";

async function run() {
    const zip = new jszip();
    const base = await zip.loadAsync(Buffer.from(BASE_APK_B64, "base64"));
    const manifest = await base.file("AndroidManifest.xml")!.async("uint8array");

    const view = new DataView(manifest.buffer, manifest.byteOffset, manifest.byteLength);
    const stringPoolOffset = 8;
    const stringCount = view.getInt32(stringPoolOffset + 8, true);
    const stringsStart = view.getInt32(stringPoolOffset + 20, true);

    const strings: string[] = [];
    for (let i = 0; i < stringCount; i++) {
        const offset = view.getInt32(stringPoolOffset + 28 + i * 4, true);
        const strOffset = stringPoolOffset + stringsStart + offset;
        const len = view.getInt16(strOffset, true);
        let str = '';
        for (let j = 0; j < len; j++) {
            str += String.fromCharCode(view.getInt16(strOffset + 2 + j * 2, true));
        }
        strings.push(str);
    }

    const restOffset = 8 + view.getInt32(stringPoolOffset + 4, true);
    const restBytes = new Uint8Array(manifest.subarray(restOffset));
    const restView = new DataView(restBytes.buffer, restBytes.byteOffset, restBytes.byteLength);

    // Read resource map
    let resourceMapSize = 0;
    if (restView.getUint16(0, true) === 0x0180) {
        resourceMapSize = restView.getUint32(4, true);
    }

    let ptr = resourceMapSize;
    while (ptr < restBytes.length) {
        const chunkType = restView.getUint16(ptr, true);
        const chunkSize = restView.getUint32(ptr + 4, true);
        if (chunkSize <= 0) break;

        if (chunkType === 0x0102) { // START_TAG
            const nameIdx = restView.getInt32(ptr + 20, true);
            const tagName = strings[nameIdx];
            if (tagName === 'application') {
                console.log("Found <application> tag:");
                const attrStart = restView.getUint16(ptr + 24, true);
                const attrSize = restView.getUint16(ptr + 26, true);
                const attrCount = restView.getUint16(ptr + 28, true);

                let attrPtr = ptr + attrStart;
                for (let i = 0; i < attrCount; i++) {
                    const nsIdx = restView.getInt32(attrPtr, true);
                    const nameIdx2 = restView.getInt32(attrPtr + 4, true);
                    const valIdx = restView.getInt32(attrPtr + 8, true);
                    const dataType = restBytes[attrPtr + 15];
                    const data = restView.getInt32(attrPtr + 16, true);

                    const name = strings[nameIdx2];
                    const ns = nsIdx === -1 ? "" : strings[nsIdx];
                    const val = valIdx === -1 ? "" : strings[valIdx];

                    console.log(`  Attr ${i}: name='${name}' (idx ${nameIdx2}), namespace='${ns}', value='${val}', dataType=${dataType}, data=0x${data.toString(16)}`);
                    attrPtr += attrSize;
                }
            }
        }
        ptr += chunkSize;
    }
}
run();
