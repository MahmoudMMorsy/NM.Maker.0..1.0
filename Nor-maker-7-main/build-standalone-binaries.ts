import * as fs from 'fs';
import * as path from 'path';

// ----------------------------------------------------
//  MOCK BROWSER ENVIRONMENT FOR NODE.JS COMPATIBILITY
// ----------------------------------------------------
const iconPngBuffer = fs.readFileSync(path.join('utils', 'stub-builder', 'icon_padded.png'));
const iconPngBase64 = "data:image/png;base64," + iconPngBuffer.toString('base64');

// Load clean, unpadded 256x256 PNG for Android APK compatibility (prevents trailing-padding parse errors on Android launcher)
const cleanIconPngBuffer = fs.readFileSync(path.join('utils', 'stub-builder', 'clean_icon.png'));
const cleanIconPngBase64 = "data:image/png;base64," + cleanIconPngBuffer.toString('base64');

globalThis.document = {
    createElement: (tag: string) => {
        if (tag === 'canvas') {
            return {
                width: 256,
                height: 256,
                getContext: () => ({
                    fillStyle: '',
                    fillRect: () => {},
                    strokeStyle: '',
                    lineWidth: 0,
                    strokeRect: () => {},
                    beginPath: () => {},
                    arc: () => {},
                    fill: () => {},
                    font: '',
                    textAlign: '',
                    textBaseline: '',
                    fillText: () => {},
                    drawImage: () => {}
                }),
                toDataURL: () => iconPngBase64
            };
        }
        return {};
    }
} as any;

globalThis.Image = class {
    onload: () => void = () => {};
    onerror: () => void = () => {};
    _src: string = '';
    set src(val: string) {
        this._src = val;
        setTimeout(() => this.onload(), 10);
    }
    get src() {
        return this._src;
    }
} as any;

globalThis.fetch = async (url: string) => {
    if (url === '/stubs/webview_stub.exe') {
        const fileBuffer = fs.readFileSync(path.join('public', 'stubs', 'webview_stub.exe'));
        const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
        return {
            ok: true,
            statusText: 'OK',
            arrayBuffer: async () => arrayBuffer
        } as any;
    }
    throw new Error(`Fetch not mocked for URL: ${url}`);
};

// ----------------------------------------------------
//  IMPORT PACKAGERS
// ----------------------------------------------------
import { createWindowsPackage } from './utils/winPackager';
import { createAPK } from './utils/apkPackager';

async function main() {
    console.log("====================================================");
    console.log("   NOR Maker AI - Standalone Binaries Compiler");
    console.log("====================================================");

    const distHtmlPath = path.join('dist', 'index.html');
    if (!fs.existsSync(distHtmlPath)) {
        console.error("Error: dist/index.html not found! Run npm run build first.");
        process.exit(1);
    }

    const htmlContent = fs.readFileSync(distHtmlPath, 'utf-8');

    // ----------------------------------------------------
    //  1. COMPILE NATIVE WINDOWS STANDALONE ENGINE (.EXE)
    // ----------------------------------------------------
    console.log("\n[1/2] Compiling standalone Windows Engine (.exe)...");
    const exeBlob = await createWindowsPackage("NOR Maker AI", htmlContent, iconPngBase64);
    const exeBuffer = Buffer.from(await exeBlob.arrayBuffer());

    const exeDestPublic = path.join('public', 'nor-maker-standalone.exe');
    const exeDestDist = path.join('dist', 'nor-maker-standalone.exe');
    fs.writeFileSync(exeDestPublic, exeBuffer);
    fs.writeFileSync(exeDestDist, exeBuffer);

    console.log(`✓ Standalone Windows Engine compiled successfully:`);
    console.log(`  - Destination 1: ${exeDestPublic} (${(exeBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  - Destination 2: ${exeDestDist} (${(exeBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // ----------------------------------------------------
    //  2. COMPILE MOBILE ANDROID STANDALONE ENGINE (.APK)
    // ----------------------------------------------------
    console.log("\n[2/2] Compiling standalone Android Engine (.apk)...");

    // We do NOT customize the packageName here (leaving it default 'com.normaker.wrapper')
    // to guarantee 100% DEX class mapping compatibility with MainActivity.
    // We use the clean, unpadded PNG base64 to ensure 100% Android launcher compatibility.
    const apkBlob = await createAPK("NOR Maker AI", htmlContent, cleanIconPngBase64);
    const apkBuffer = Buffer.from(await apkBlob.arrayBuffer());

    const apkDestPublic = path.join('public', 'nor-maker-standalone.apk');
    const apkDestDist = path.join('dist', 'nor-maker-standalone.apk');
    fs.writeFileSync(apkDestPublic, apkBuffer);
    fs.writeFileSync(apkDestDist, apkBuffer);

    console.log(`✓ Standalone Android Engine compiled successfully:`);
    console.log(`  - Destination 1: ${apkDestPublic} (${(apkBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  - Destination 2: ${apkDestDist} (${(apkBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log("\n====================================================");
    console.log("   COMPILATION COMPLETED SUCCESSFULLY!");
    console.log("====================================================");
}

main().catch(err => {
    console.error("Compilation failed with error:", err);
    process.exit(1);
});
