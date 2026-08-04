import * as fs from "fs";
import jszip from "jszip";

async function run() {
    const data = fs.readFileSync("test_generated.apk");
    const zip = new jszip();
    const base = await zip.loadAsync(data);
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
            str += String.fromCharCode(view.getUint16(strOffset + 2 + j * 2, true));
        }
        strings.push(str);
    }

    console.log("All strings in generated AndroidManifest.xml:");
    strings.forEach((str, idx) => console.log(`  ${idx}: ${str}`));

    const restOffset = 8 + view.getInt32(stringPoolOffset + 4, true);

    // Resource ID Map
    const mapSize = view.getUint32(restOffset + 4, true);
    console.log(`Resource ID Map size: ${mapSize}`);
    const mapCount = (mapSize - 8) / 4;
    for (let i = 0; i < mapCount; i++) {
        console.log(`  Map [${i}] (${strings[i]}): 0x${view.getUint32(restOffset + 8 + i * 4, true).toString(16)}`);
    }

    let ptr = restOffset + mapSize;
    while (ptr < manifest.length) {
        const chunkType = view.getUint32(ptr, true);
        const chunkSize = view.getUint32(ptr + 4, true);
        if (chunkSize <= 0) break;

        if (chunkType === 0x00100102) { // START_TAG
            const nameIdx = view.getInt32(ptr + 20, true);
            const tagName = strings[nameIdx];
            console.log(`Found <${tagName}> tag at offset ${ptr}:`);
            const attrCount = view.getUint16(ptr + 28, true);

            let attrPtr = ptr + 36;
            for (let i = 0; i < attrCount; i++) {
                const nsIdx = view.getInt32(attrPtr, true);
                const nameIdx2 = view.getInt32(attrPtr + 4, true);
                const valIdx = view.getInt32(attrPtr + 8, true);
                const dataType = manifest[attrPtr + 15];
                const data = view.getInt32(attrPtr + 16, true);

                const name = nameIdx2 === -1 ? "" : strings[nameIdx2];
                const ns = nsIdx === -1 ? "" : strings[nsIdx];
                const val = valIdx === -1 ? "" : strings[valIdx];

                console.log(`    Attr ${i}: ns='${ns}' (${nsIdx}), name='${name}' (${nameIdx2}), val='${val}' (${valIdx}), dataType=${dataType}, data=0x${data.toString(16)}`);
                attrPtr += 20;
            }
        }
        ptr += chunkSize;
    }
}
run();
