import JSZip from 'jszip';
import { BASE_APK_B64 } from './apkBase64';
import { signAPK } from './apkSigner';

/**
 * Android APK Packager (Local APK Generator)
 * Uses a pre-compiled base APK as a template, injects game assets,
 * compiles a custom resource table (resources.arsc), patches AndroidManifest.xml,
 * and cryptographically signs the final package.
 */

// Converts a base64 Data URI to a Uint8Array of raw binary bytes
const dataUriToBytes = (dataUri: string): Uint8Array => {
    const commaIndex = dataUri.indexOf(',');
    if (commaIndex === -1) {
        throw new Error('Invalid data URI');
    }
    const base64Str = dataUri.substring(commaIndex + 1);
    const binaryStr = atob(base64Str);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
};

// Flat binary buffer writer used to generate resources.arsc
class BufferWriter {
    public buffer: Uint8Array;
    public offset: number;

    constructor(size: number) {
        this.buffer = new Uint8Array(size);
        this.offset = 0;
    }

    writeUint8(v: number) {
        this.buffer[this.offset] = v;
        this.offset += 1;
    }

    writeUint16(v: number) {
        const view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
        view.setUint16(this.offset, v, true);
        this.offset += 2;
    }

    writeUint32(v: number) {
        const view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
        view.setUint32(this.offset, v, true);
        this.offset += 4;
    }

    writeBytes(bytes: Uint8Array) {
        this.buffer.set(bytes, this.offset);
        this.offset += bytes.length;
    }

    writeStringPool(strings: string[]): number {
        const startOffset = this.offset;
        const poolHeaderSize = 28;

        this.writeUint16(0x0001); // type (RES_STRING_POOL_TYPE)
        this.writeUint16(poolHeaderSize); // header_size
        const sizeOffset = this.offset;
        this.writeUint32(0); // chunk_size (placeholder)
        this.writeUint32(strings.length); // string_count
        this.writeUint32(0); // style_count
        this.writeUint32(1 << 8); // flags (UTF-8)
        const stringsStartOffsetOffset = this.offset;
        this.writeUint32(0); // strings_start (placeholder)
        this.writeUint32(0); // styles_start

        const offsets: number[] = [];
        let currentOffset = 0;
        const stringDataBufs: Uint8Array[] = [];

        for (const str of strings) {
            offsets.push(currentOffset);
            const utf8Bytes = new TextEncoder().encode(str);
            const len = utf8Bytes.length;

            const encoded = new Uint8Array(2 + len + 1);
            encoded[0] = str.length;
            encoded[1] = len;
            encoded.set(utf8Bytes, 2);
            encoded[2 + len] = 0;

            stringDataBufs.push(encoded);
            currentOffset += encoded.length;
        }

        for (const offset of offsets) {
            this.writeUint32(offset);
        }

        const stringsStartOffset = this.offset - startOffset;
        for (const buf of stringDataBufs) {
            this.writeBytes(buf);
        }

        // Pad to 4-byte boundary
        if (this.offset % 4 !== 0) {
            const padding = 4 - (this.offset % 4);
            this.writeBytes(new Uint8Array(padding));
        }

        const chunkSize = this.offset - startOffset;
        const view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
        view.setUint32(sizeOffset, chunkSize, true);
        view.setUint32(stringsStartOffsetOffset, stringsStartOffset, true);

        return chunkSize;
    }
}

// Generates a fully valid, minimal resources.arsc containing only the mipmap:ic_launcher mapping
const generateArsc = (packageName: string, ext: string): Uint8Array => {
    const writer = new BufferWriter(4096);

    // Table Header
    writer.writeUint16(0x0002); // RES_TABLE_TYPE
    writer.writeUint16(12); // header size
    const tableSizeOffset = writer.offset;
    writer.writeUint32(0); // table total size (placeholder)
    writer.writeUint32(1); // package count

    // 1. Global String Pool (contains resource paths)
    writer.writeStringPool([
        '',
        `res/mipmap/ic_launcher.${ext}`
    ]);

    // 2. Package Chunk (RES_TABLE_PACKAGE_TYPE)
    const packageStart = writer.offset;
    writer.writeUint16(0x0200); // chunk type
    writer.writeUint16(288); // header size
    const packageSizeOffset = writer.offset;
    writer.writeUint32(0); // package size placeholder
    writer.writeUint32(127); // package ID (0x7f)

    // Package name UTF-16 (128 chars = 256 bytes)
    const nameBuf = new Uint8Array(256);
    const nameView = new DataView(nameBuf.buffer);
    for (let i = 0; i < packageName.length && i < 128; i++) {
        nameView.setUint16(i * 2, packageName.charCodeAt(i), true);
    }
    writer.writeBytes(nameBuf);

    const typeStringsOffsetOffset = writer.offset;
    writer.writeUint32(0); // typeStrings
    writer.writeUint32(1); // lastPublicType
    const keyStringsOffsetOffset = writer.offset;
    writer.writeUint32(0); // keyStrings
    writer.writeUint32(1); // lastPublicKey
    writer.writeUint32(0); // typeIdOffset

    // Write Type Strings Pool
    const typeStringsStart = writer.offset - packageStart;
    writer.writeStringPool(['mipmap']);

    // Write Key Strings Pool
    const keyStringsStart = writer.offset - packageStart;
    writer.writeStringPool(['ic_launcher']);

    // Fill package header offsets
    const view = new DataView(writer.buffer.buffer, writer.buffer.byteOffset, writer.buffer.byteLength);
    view.setUint32(typeStringsOffsetOffset, typeStringsStart, true);
    view.setUint32(keyStringsOffsetOffset, keyStringsStart, true);

    // 3. Type Spec Chunk (RES_TABLE_TYPE_SPEC_TYPE)
    writer.writeUint16(0x0202); // type
    writer.writeUint16(16); // header_size
    writer.writeUint32(20); // chunk_size
    writer.writeUint8(1); // type_id (mipmap index is 1)
    writer.writeUint8(0); // res0
    writer.writeUint16(0); // res1
    writer.writeUint32(1); // entry_count
    writer.writeUint32(0); // spec_flags

    // 4. Type Chunk (RES_TABLE_TYPE_TYPE)
    writer.writeUint16(0x0201); // type
    writer.writeUint16(68); // header_size
    writer.writeUint32(68 + 20); // chunk_size (header_size + 4 bytes offset table + 16 bytes entry)
    writer.writeUint8(1); // type_id
    writer.writeUint8(0); // res0 (flags)
    writer.writeUint16(0); // res1 (reserved)
    writer.writeUint32(1); // entry_count
    writer.writeUint32(72); // entries_start

    // Config structure (48 bytes for default configuration)
    const configBytes = new Uint8Array(48);
    const configView = new DataView(configBytes.buffer);
    configView.setUint32(0, 48, true); // config.size
    writer.writeBytes(configBytes);

    // Entry offset table (first and only entry at offset 0)
    writer.writeUint32(0);

    // ResTable_entry (8 bytes)
    writer.writeUint16(8); // size
    writer.writeUint16(0x0000); // flags (simple value)
    writer.writeUint32(0); // key index (0 = 'ic_launcher')

    // Res_value (8 bytes)
    writer.writeUint16(8); // size
    writer.writeUint8(0); // res0
    writer.writeUint8(0x03); // data_type (TYPE_STRING points to global string pool)
    writer.writeUint32(1); // string pool index (1 = 'res/mipmap-mdpi-v4/ic_launcher.png')

    // Finalize package size and table size
    const packageSize = writer.offset - packageStart;
    view.setUint32(packageSizeOffset, packageSize, true);

    const totalSize = writer.offset;
    view.setUint32(tableSizeOffset, totalSize, true);

    return writer.buffer.subarray(0, totalSize);
};

// Patches AndroidManifest.xml to set custom label/title, and link the launcher icon
const patchAxml = (axmlBytes: Uint8Array, customLabel: string, hasCustomIcon: boolean, settings?: import('../types').AndroidExportSettings): Uint8Array => {
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

    // Modify strings (substitute extractNativeLibs for icon, and update title)
    const modifiedStrings = strings.map((s, idx) => {
        if (hasCustomIcon && idx === 9) return 'icon';
        if (hasCustomIcon && idx === 3) return 'roundIcon';
        if (s === 'NOR Game') return customLabel;
        if (settings?.packageName && s === 'com.normaker.wrapper') return settings.packageName;
        if (settings?.versionName && s === '1.0' && idx > 10) return settings.versionName; // Ensure it's likely the version name
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
        dv.setInt16(2 + len * 2, 0, true);
        stringDataBuffers.push(buf);
        currentOffset += buf.length;
    }

    let stringDataSize = currentOffset;
    if (stringDataSize % 4 !== 0) {
        stringDataSize += 4 - (stringDataSize % 4);
    }

    const newStringsStart = 36 + stringCount * 4 + styleCount * 4;
    const newStringPoolSize = newStringsStart + stringDataSize;
    const newStringPoolBytes = new Uint8Array(newStringPoolSize);
    const newStringPoolView = new DataView(newStringPoolBytes.buffer);

    newStringPoolView.setInt32(0, 0x001c0001, true); // magic
    newStringPoolView.setInt32(4, newStringPoolSize, true); // size
    newStringPoolView.setInt32(8, stringCount, true);
    newStringPoolView.setInt32(12, styleCount, true);
    newStringPoolView.setInt32(16, flags, true);
    newStringPoolView.setInt32(20, newStringsStart, true);
    newStringPoolView.setInt32(24, 0, true);

    for (let i = 0; i < stringCount; i++) {
        newStringPoolView.setInt32(28 + i * 4, stringOffsets[i], true);
    }
    let ptr = newStringsStart;
    for (const buf of stringDataBuffers) {
        newStringPoolBytes.set(buf, ptr);
        ptr += buf.length;
    }

    // Assemble remaining file chunks
    const originalRestOffset = stringPoolOffset + oldChunkSize;
    const restBytes = new Uint8Array(axmlBytes.subarray(originalRestOffset));
    const restView = new DataView(restBytes.buffer, restBytes.byteOffset, restBytes.byteLength);

    if (hasCustomIcon) {
        // Patch Resource ID Map to change extractNativeLibs's resource ID (index 9) to android:icon (0x01010002)
        const resourceIdMagic = restView.getInt32(0, true);
        if (resourceIdMagic === 0x00080180) {
            restView.setInt32(8 + 9 * 4, 0x01010002, true);
            restView.setInt32(8 + 3 * 4, 0x0101052c, true);
        }
    }

    // Patch attributes in <manifest>, <application> and <uses-sdk>
    let restPtr = 0;
    while (restPtr < restBytes.length) {
        const chunkType = restView.getInt32(restPtr, true);
        const chunkSize = restView.getInt32(restPtr + 4, true);
        if (chunkSize <= 0) break;

        if (chunkType === 0x00100102) { // Start Element
            const nameIndex = restView.getInt32(restPtr + 20, true);
            const tagName = strings[nameIndex];

            if (tagName === 'manifest' && settings) {
                const attrCount = restView.getUint16(restPtr + 28, true);
                let attrPtr = restPtr + 36;
                for (let i = 0; i < attrCount; i++) {
                    const attrNameIndex = restView.getInt32(attrPtr + 4, true);
                    const attrName = strings[attrNameIndex];
                    if (attrName === 'versionCode' && settings.versionCode) {
                        restView.setInt32(attrPtr + 16, settings.versionCode, true);
                    }
                    attrPtr += 20;
                }
            }

            if (tagName === 'application' && hasCustomIcon) {
                const attrCount = restView.getUint16(restPtr + 28, true);
                let attrPtr = restPtr + 36;
                const attrs: Uint8Array[] = [];
                for (let i = 0; i < attrCount; i++) {
                    const attrNameIndex = restView.getInt32(attrPtr + 4, true);
                    if (attrNameIndex === 9) {
                        restView.setInt32(attrPtr + 8, -1, true);
                        restBytes[attrPtr + 15] = 1;
                        restView.setInt32(attrPtr + 16, 0x7f010000, true);
                    } else if (attrNameIndex === 3 && hasCustomIcon) {
                        restView.setInt32(attrPtr + 8, -1, true);
                        restBytes[attrPtr + 15] = 1;
                        restView.setInt32(attrPtr + 16, 0x7f010000, true);
                    }
                    attrs.push(new Uint8Array(restBytes.subarray(attrPtr, attrPtr + 20)));
                    attrPtr += 20;
                }

                const mapMagic = restView.getUint32(0, true);
                let mapCount = 0;
                if (mapMagic === 0x00080180) {
                    const mapSize = restView.getUint32(4, true);
                    mapCount = (mapSize - 8) / 4;
                }

                const getResourceId = (attrBytes: Uint8Array): number => {
                    const attrDV = new DataView(attrBytes.buffer, attrBytes.byteOffset, attrBytes.byteLength);
                    const nameIndex = attrDV.getInt32(4, true);
                    if (nameIndex >= 0 && nameIndex < mapCount) {
                        return restView.getUint32(8 + nameIndex * 4, true);
                    }
                    return 0xffffffff;
                };

                attrs.sort((a, b) => getResourceId(a) - getResourceId(b));

                let writePtr = restPtr + 36;
                for (const attr of attrs) {
                    restBytes.set(attr, writePtr);
                    writePtr += 20;
                }
            }

            if (tagName === 'uses-sdk') {
                const attrCount = restView.getUint16(restPtr + 28, true);
                let attrPtr = restPtr + 36;
                for (let i = 0; i < attrCount; i++) {
                    const attrNameIndex = restView.getInt32(attrPtr + 4, true);
                    const attrName = strings[attrNameIndex];
                    if (attrName === 'targetSdkVersion') {
                        restView.setInt32(attrPtr + 16, settings?.targetSdkVersion || 29, true);
                    }
                    if (attrName === 'minSdkVersion' && settings?.minSdkVersion) {
                        restView.setInt32(attrPtr + 16, settings.minSdkVersion, true);
                    }
                    attrPtr += 20;
                }
            }
        }
        restPtr += chunkSize;
    }

    const finalFile = new Uint8Array(8 + newStringPoolSize + restBytes.length);
    const finalView = new DataView(finalFile.buffer);
    finalView.setInt32(0, 0x00080003, true);
    finalView.setInt32(4, finalFile.length, true);
    finalFile.set(newStringPoolBytes, 8);
    finalFile.set(restBytes, 8 + newStringPoolSize);

    return finalFile;
};


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
                const cdView = new DataView(cdRecord.buffer, cdRecord.byteOffset, cdRecord.byteLength);
                cdView.setUint32(42, newLocalOffset, true);
            }

            outChunks.push(cdRecord);
            outOffset += cdRecordSize;
            cdSize += cdRecordSize;
            inOffset += cdRecordSize;
        } else if (signature === 0x06054b50) {
            const eocd = new Uint8Array(zipBytes.subarray(inOffset, inOffset + 22));
            const dv = new DataView(eocd.buffer, eocd.byteOffset, eocd.byteLength);
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

export const createAPK = async (
    title: string,
    htmlContent: string,
    iconUrl?: string | null,
    settings?: import('../types').AndroidExportSettings
): Promise<Blob> => {
    // 1. Load the Base APK from template Base64
    const zip = new JSZip();
    const apkData = atob(BASE_APK_B64);
    const apkBytes = new Uint8Array(apkData.length);
    for (let i = 0; i < apkData.length; i++) {
        apkBytes[i] = apkData.charCodeAt(i);
    }

    const baseApk = await zip.loadAsync(apkBytes);

    // 2. Inject Game HTML Content into assets/www/index.html
    baseApk.file("assets/www/index.html", htmlContent);

    // 3. Process Launcher Icon (either custom or beautifully-generated default canvas icon)
    let iconBytes: Uint8Array | null = null;
    if (iconUrl) {
        try {
            iconBytes = dataUriToBytes(iconUrl);
        } catch (e) {
            console.error("Failed to parse custom launcher icon:", e);
        }
    }

    if (!iconBytes) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 192;
            canvas.height = 192;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Background (Slate-800)
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, 0, 192, 192);

                // Outer Border (Blue-500)
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 10;
                ctx.strokeRect(5, 5, 182, 182);

                // D-pad/Action Button representation (Red-500)
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(135, 115, 18, 0, Math.PI * 2);
                ctx.fill();

                // Select/Start button representation (Yellow-500)
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(95, 135, 14, 0, Math.PI * 2);
                ctx.fill();

                // Bold Retro N logo
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 90px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('N', 60, 80);
            }
            const dataUrl = canvas.toDataURL('image/png');
            iconBytes = dataUriToBytes(dataUrl);
        } catch (e) {
            console.error("Failed to generate default canvas icon for APK:", e);
        }
    }

    const hasIcon = !!iconBytes;
    if (hasIcon && iconBytes) {
        try {
            const mimeType = iconUrl ? iconUrl.split(",")[0].split(":")[1].split(";")[0] : "image/png";
            const ext = mimeType === "image/jpeg" ? "jpg" : "png";

            // Write launcher icon to standard and all density paths for maximum compatibility across devices
            baseApk.file(`res/mipmap/ic_launcher.${ext}`, iconBytes);
            baseApk.file(`res/mipmap-mdpi/ic_launcher.${ext}`, iconBytes);
            baseApk.file(`res/mipmap-hdpi/ic_launcher.${ext}`, iconBytes);
            baseApk.file(`res/mipmap-xhdpi/ic_launcher.${ext}`, iconBytes);
            baseApk.file(`res/mipmap-xxhdpi/ic_launcher.${ext}`, iconBytes);
            baseApk.file(`res/mipmap-xxxhdpi/ic_launcher.${ext}`, iconBytes);

            // Overwrite empty resources.arsc with our custom resource table mapping
            const customArsc = generateArsc(settings?.packageName || "com.normaker.wrapper", ext);
            baseApk.file("resources.arsc", customArsc);
        } catch (e) {
            console.error("Failed to inject app launcher icon files:", e);
        }
    }

    // 4. Overwrite AndroidManifest.xml with patched customized version (name + icon linkage)
    try {
        const originalManifest = await baseApk.file("AndroidManifest.xml")!.async("uint8array");
        const patchedManifest = patchAxml(originalManifest, title, hasIcon, settings);
        baseApk.file("AndroidManifest.xml", patchedManifest);
    } catch (e) {
        console.error("Failed to patch AndroidManifest.xml:", e);
    }

    // 5. Cryptographically sign the APK with self-signed keys (V1 Signature)
    // Overwrites META-INF/MANIFEST.MF, META-INF/CERT.SF, and META-INF/CERT.RSA
    await signAPK(baseApk, settings?.keystore?.privateKeyPem, settings?.keystore?.certificatePem);

    // Reorder zip entries so META-INF files are written FIRST (crucial for sequentially reading via JarInputStream / Android Package Installer)
    const reorderedZip = new JSZip();
    const metaInfFiles = ["META-INF/MANIFEST.MF", "META-INF/CERT.SF", "META-INF/CERT.RSA"];

    // Add META-INF files first
    for (const filename of metaInfFiles) {
        const file = baseApk.file(filename);
        if (file) {
            const data = await file.async("uint8array");
            reorderedZip.file(filename, data, { compression: "DEFLATE" });
        }
    }

    // Add all other files
    for (const filename of Object.keys(baseApk.files)) {
        if (filename.startsWith("META-INF/")) continue;
        const file = baseApk.files[filename];
        if (file.dir) continue;
        const data = await file.async("uint8array");

        const isStore = filename === "resources.arsc" || filename.endsWith(".png") || filename.endsWith(".jpg");
        reorderedZip.file(filename, data, {
            compression: isStore ? "STORE" : "DEFLATE"
        });
    }

    // 7. Generate the final APK, zipalign it, and wrap it in a Blob
    const zipBlob = await reorderedZip.generateAsync({ type: "uint8array" });
    const alignedApk = zipalign(zipBlob);

    return new Blob([alignedApk as any], { type: "application/vnd.android.package-archive" });
};
