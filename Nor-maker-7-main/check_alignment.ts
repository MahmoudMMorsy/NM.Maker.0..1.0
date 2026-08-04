import * as fs from "fs";

function check(zipBytes: Uint8Array) {
    const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
    let inOffset = 0;
    while (inOffset < zipBytes.length) {
        const signature = view.getUint32(inOffset, true);
        if (signature === 0x04034b50) {
            const fileNameLen = view.getUint16(inOffset + 26, true);
            const extraFieldLen = view.getUint16(inOffset + 28, true);
            const compSize = view.getUint32(inOffset + 18, true);
            const compMethod = view.getUint16(inOffset + 8, true);

            let fileName = "";
            for (let i = 0; i < fileNameLen; i++) {
                fileName += String.fromCharCode(zipBytes[inOffset + 30 + i]);
            }

            const headerSize = 30 + fileNameLen + extraFieldLen;
            const payloadOffset = inOffset + headerSize;

            if (compMethod === 0) { // STORED
                console.log(`File: ${fileName}, Offset: ${payloadOffset}, Aligned: ${payloadOffset % 4 === 0}`);
            }
            inOffset += headerSize + compSize;
        } else {
            break;
        }
    }
}

console.log("Checking test_final.apk:");
check(fs.readFileSync("test_final.apk"));
