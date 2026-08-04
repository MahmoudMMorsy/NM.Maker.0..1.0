import * as fs from "fs";
import { BASE_APK_B64 } from "./utils/apkBase64";
import jszip from "jszip";

async function run() {
    const zip = new jszip();
    const base = await zip.loadAsync(Buffer.from(BASE_APK_B64, "base64"));
    const manifest = await base.file("AndroidManifest.xml")!.async("uint8array");

    // Quick parse
    const view = new DataView(manifest.buffer, manifest.byteOffset, manifest.byteLength);
    const stringPoolOffset = 8;
    const stringCount = view.getInt32(stringPoolOffset + 8, true);
    const stringsStart = view.getInt32(stringPoolOffset + 20, true);
    for (let i = 0; i < stringCount; i++) {
        const offset = view.getInt32(stringPoolOffset + 28 + i * 4, true);
        const strOffset = stringPoolOffset + stringsStart + offset;
        const len = view.getInt16(strOffset, true);
        let str = '';
        for (let j = 0; j < len; j++) {
            str += String.fromCharCode(view.getInt16(strOffset + 2 + j * 2, true));
        }
        if (str === 'debuggable') {
            console.log(`Found debuggable at index ${i}`);
        }
    }
}
run();
