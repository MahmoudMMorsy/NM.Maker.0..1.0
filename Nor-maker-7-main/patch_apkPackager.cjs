const fs = require('fs');

let content = fs.readFileSync('utils/apkPackager.ts', 'utf8');

const zipalignFunc = `
function zipalign(zipBytes: Uint8Array): Uint8Array {
    const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
    const outChunks: Uint8Array[] = [];

    let inOffset = 0;
    let outOffset = 0;

    const cdOffsetUpdates: { [key: number]: number } = {};

    // Pass 1: Local files
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
            let payloadOffset = outOffset + headerSize;

            let paddingToAdd = 0;
            if (compMethod === 0) { // STORED
                const alignment = fileName.endsWith(".so") ? 4096 : 4;
                const remainder = payloadOffset % alignment;
                if (remainder !== 0) {
                    let paddingNeeded = alignment - remainder;
                    if (paddingNeeded < 4) paddingNeeded += alignment;
                    paddingToAdd = paddingNeeded;
                }
            }

            const newHeaderSize = headerSize + paddingToAdd;
            const newHeader = new Uint8Array(newHeaderSize);
            newHeader.set(zipBytes.subarray(inOffset, inOffset + headerSize), 0);

            if (paddingToAdd > 0) {
                const newExtraFieldLen = extraFieldLen + paddingToAdd;
                const dv = new DataView(newHeader.buffer);
                dv.setUint16(28, newExtraFieldLen, true);

                const extraOffset = headerSize;
                dv.setUint16(extraOffset, 0xD935, true);
                dv.setUint16(extraOffset + 2, paddingToAdd - 4, true);
            }

            outChunks.push(newHeader);
            cdOffsetUpdates[inOffset] = outOffset;
            outOffset += newHeaderSize;

            const payload = zipBytes.subarray(inOffset + headerSize, inOffset + headerSize + compSize);
            outChunks.push(payload);
            outOffset += compSize;

            inOffset += headerSize + compSize;
        } else {
            break;
        }
    }

    const centralDirectoryStart = outOffset;
    let cdSize = 0;

    // Pass 2: Central Directory
    while (inOffset < zipBytes.length) {
        const signature = view.getUint32(inOffset, true);
        if (signature === 0x02014b50) {
            const fileNameLen = view.getUint16(inOffset + 28, true);
            const extraFieldLen = view.getUint16(inOffset + 30, true);
            const commentLen = view.getUint16(inOffset + 32, true);
            const oldLocalOffset = view.getUint32(inOffset + 42, true);

            const cdRecordSize = 46 + fileNameLen + extraFieldLen + commentLen;
            const cdRecord = new Uint8Array(zipBytes.subarray(inOffset, inOffset + cdRecordSize));

            const newLocalOffset = cdOffsetUpdates[oldLocalOffset];
            if (newLocalOffset !== undefined) {
                new DataView(cdRecord.buffer).setUint32(42, newLocalOffset, true);
            }

            outChunks.push(cdRecord);
            outOffset += cdRecordSize;
            cdSize += cdRecordSize;
            inOffset += cdRecordSize;
        } else if (signature === 0x06054b50) {
            const eocd = new Uint8Array(zipBytes.subarray(inOffset, inOffset + 22));
            const dv = new DataView(eocd.buffer);
            dv.setUint32(12, cdSize, true);
            dv.setUint32(16, centralDirectoryStart, true);

            outChunks.push(eocd);
            outOffset += 22;
            inOffset += 22;
            break;
        } else {
            break;
        }
    }

    const finalZip = new Uint8Array(outOffset);
    let ptr = 0;
    for (const chunk of outChunks) {
        finalZip.set(chunk, ptr);
        ptr += chunk.length;
    }
    return finalZip;
}
`;

content = content.replace("export const createAPK =", zipalignFunc + "\nexport const createAPK =");

const oldCompressionLoop = `
    // 6. Ensure proper compression per file before generating:
    // We compress everything (DEFLATE) because JSZip cannot zipalign.
    // If resources.arsc is STORED but not aligned, Android's PackageParser will reject it.
    for (const filename of Object.keys(baseApk.files)) {
        const file = baseApk.files[filename];
        if (file.dir) continue;
        file.options.compression = "DEFLATE";
    }

    // 7. Generate the final APK and wrap it in a Blob
    const zipBlob = await baseApk.generateAsync({ type: "blob", compression: "DEFLATE" });
    return new Blob([zipBlob], { type: "application/octet-stream" });
`;

const newCompressionLoop = `
    // 6. Ensure proper compression per file before generating:
    for (const filename of Object.keys(baseApk.files)) {
        const file = baseApk.files[filename];
        if (file.dir) continue;
        if (filename === "resources.arsc" || filename.endsWith(".png")) {
            file.options.compression = "STORE";
        } else {
            file.options.compression = "DEFLATE";
        }
    }

    // 7. Generate the final APK, zipalign it, and wrap it in a Blob
    const zipBlob = await baseApk.generateAsync({ type: "uint8array" });
    const alignedApk = zipalign(zipBlob);

    return new Blob([alignedApk], { type: "application/vnd.android.package-archive" });
`;

content = content.replace(oldCompressionLoop.trim(), newCompressionLoop.trim());

fs.writeFileSync('utils/apkPackager.ts', content);
