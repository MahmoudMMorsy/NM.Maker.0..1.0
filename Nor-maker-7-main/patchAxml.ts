import * as fs from "fs";
import jszip from "jszip";
import { BASE_APK_B64 } from "./utils/apkBase64";

// Copy from apkPackager.ts to test
const patchAxml = (axmlBytes: Uint8Array, customLabel: string, hasCustomIcon: boolean): Uint8Array => {
    const view = new DataView(axmlBytes.buffer, axmlBytes.byteOffset, axmlBytes.byteLength);
    const magic = view.getInt32(0, true);
    if (magic !== 0x00080003) {
        throw new Error('Invalid AXML magic');
    }

    const stringPoolOffset = 8;
    const oldChunkSize = view.getInt32(stringPoolOffset + 4, true);
    const stringCount = view.getInt32(stringPoolOffset + 8, true);
    const styleCount = view.getInt32(stringPoolOffset + 12, true);
    const flags = view.getInt32(stringPoolOffset + 16, true);
    const stringsStart = view.getInt32(stringPoolOffset + 20, true);

    // Parse string pool
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

    // Modify strings
    const modifiedStrings = strings.map((s) => {
        if (hasCustomIcon && s === 'extractNativeLibs') return 'icon';
        if (s === 'NOR Game') return customLabel;
        return s;
    });

    // Re-encode string pool
    const stringDataBuffers: Uint8Array[] = [];
    const stringOffsets: number[] = [];
    let currentOffset = 0;

    for (const s of modifiedStrings) {
        stringOffsets.push(currentOffset);
        const len = s.length;
        const buf = new Uint8Array(2 + len * 2 + 2);
        const dv = new DataView(buf.buffer);
        dv.setInt16(0, len, true);
        for (let j = 0; j < len; j++) {
            dv.setInt16(2 + j * 2, s.charCodeAt(j), true);
        }
        dv.setInt16(2 + len * 2, 0, true); // null terminator
        stringDataBuffers.push(buf);
        currentOffset += buf.length;
    }

    // Alignment
    const padding = (4 - (currentOffset % 4)) % 4;
    const paddingBuf = new Uint8Array(padding);
    currentOffset += padding;

    // Build new string pool chunk
    const newStringsStart = 28 + stringCount * 4;
    const newChunkSize = newStringsStart + currentOffset;

    const newStringPool = new Uint8Array(newChunkSize);
    const newPoolView = new DataView(newStringPool.buffer);

    newPoolView.setInt16(0, 0x0001, true); // chunk type
    newPoolView.setInt16(2, 28, true); // header size
    newPoolView.setInt32(4, newChunkSize, true); // chunk size
    newPoolView.setInt32(8, stringCount, true);
    newPoolView.setInt32(12, styleCount, true);
    newPoolView.setInt32(16, flags, true);
    newPoolView.setInt32(20, newStringsStart, true);
    newPoolView.setInt32(24, 0, true);

    for (let i = 0; i < stringCount; i++) {
        newPoolView.setInt32(28 + i * 4, stringOffsets[i], true);
    }

    let ptr = newStringsStart;
    for (const buf of stringDataBuffers) {
        newStringPool.set(buf, ptr);
        ptr += buf.length;
    }
    newStringPool.set(paddingBuf, ptr);

    // Build final AXML
    const restOffset = stringPoolOffset + oldChunkSize;
    const restBytes = new Uint8Array(axmlBytes.buffer, axmlBytes.byteOffset + restOffset, axmlBytes.byteLength - restOffset);

    // We also need to patch Resource Map!
    // Resource map is the first chunk in restBytes.
    const restView = new DataView(restBytes.buffer, restBytes.byteOffset, restBytes.byteLength);
    if (hasCustomIcon && restBytes.length >= 8) {
        const chunkType = restView.getUint16(0, true);
        if (chunkType === 0x0180) { // RES_XML_RESOURCE_MAP_TYPE
            const chunkSize = restView.getUint32(4, true);
            const count = (chunkSize - 8) / 4;
            // Find index 9 (extractNativeLibs) and change it to 0x01010002 (icon)
            // Wait, we know index 9 is extractNativeLibs from our dump, but let's just search for it or hardcode index 9.
            // 0x010104ea -> 0x01010002
            for (let i = 0; i < count; i++) {
                const resId = restView.getUint32(8 + i * 4, true);
                if (resId === 0x010104ea) { // extractNativeLibs
                    restView.setUint32(8 + i * 4, 0x01010002, true); // icon
                }
            }
        }
    }

    // Patch the rest (specifically modifying application tag's attribute)
    let restPtr = 0;
    while (restPtr < restBytes.length) {
        const chunkType = restView.getInt16(restPtr, true);
        const chunkSize = restView.getInt32(restPtr + 4, true);
        if (chunkType === 0x0102) { // START_TAG
            const nameIdx = restView.getInt32(restPtr + 20, true);
            const tagName = strings[nameIdx];
            if (tagName === 'application' && hasCustomIcon) {
                const attrCount = restView.getUint16(restPtr + 28, true);
                let attrPtr = restPtr + 36;
                for (let i = 0; i < attrCount; i++) {
                    const attrNameIndex = restView.getInt32(attrPtr + 4, true);
                    if (attrNameIndex === 9) { // This was 'extractNativeLibs', now 'icon'
                        // Change rawValue to -1
                        restView.setInt32(attrPtr + 8, -1, true);
                        // Change dataType to TYPE_REFERENCE (1)
                        restBytes[attrPtr + 15] = 1;
                        // Change data to 0x7f010000
                        restView.setInt32(attrPtr + 16, 0x7f010000, true);
                    }
                    attrPtr += 20;
                }
            }
        }
        restPtr += chunkSize;
    }

    const finalSize = 8 + newChunkSize + restBytes.length;
    const finalBytes = new Uint8Array(finalSize);
    const finalView = new DataView(finalBytes.buffer);

    finalView.setInt32(0, magic, true);
    finalView.setInt32(4, finalSize, true);

    finalBytes.set(newStringPool, 8);
    finalBytes.set(restBytes, 8 + newChunkSize);

    return finalBytes;
};

async function test() {
    const zip = new jszip();
    const base = await zip.loadAsync(Buffer.from(BASE_APK_B64, "base64"));
    const manifest = await base.file("AndroidManifest.xml")!.async("uint8array");
    const patched = patchAxml(manifest, "Hello", true);
    fs.writeFileSync("patched.xml", patched);
}
test();
