import * as fs from "fs";
import jszip from "jszip";
import { BASE_APK_B64 } from "./utils/apkBase64";

function dumpResMap(axmlBytes: Uint8Array) {
    const view = new DataView(axmlBytes.buffer, axmlBytes.byteOffset, axmlBytes.byteLength);
    const stringPoolOffset = 8;
    const stringPoolSize = view.getInt32(stringPoolOffset + 4, true);
    let offset = stringPoolOffset + stringPoolSize;

    const chunkType = view.getInt16(offset, true);
    if (chunkType === 0x0180) { // RES_XML_RESOURCE_MAP_TYPE
        const chunkSize = view.getInt32(offset + 4, true);
        const count = (chunkSize - 8) / 4;
        console.log(`Resource map count: ${count}`);
        for (let i = 0; i < count; i++) {
            const resId = view.getUint32(offset + 8 + i * 4, true);
            console.log(`String index ${i}: 0x${resId.toString(16)}`);
        }
    } else {
        console.log(`Next chunk is not resource map: 0x${chunkType.toString(16)}`);
    }
}

async function run() {
    const zip = new jszip();
    const base = await zip.loadAsync(Buffer.from(BASE_APK_B64, "base64"));
    const manifest = await base.file("AndroidManifest.xml")!.async("uint8array");
    dumpResMap(manifest);
}
run();
