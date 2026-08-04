import fs from 'fs';

const pngBytes = fs.readFileSync('./node_modules/app-builder-lib/templates/icons/proton-native/linux/256x256.png');
console.log('Original PNG size:', pngBytes.length);

const targetPngSize = 120000;
if (pngBytes.length > targetPngSize) {
    throw new Error('Original PNG is larger than target size!');
}

const paddedPng = new Uint8Array(targetPngSize);
paddedPng.set(pngBytes, 0);

// Write padded PNG
fs.writeFileSync('./utils/stub-builder/icon_padded.png', paddedPng);
console.log('Padded PNG written to ./utils/stub-builder/icon_padded.png. Size:', paddedPng.length);

// Wrap padded PNG into ICO format (6 bytes header + 16 bytes directory entry = 22 bytes header)
const icoBytes = new Uint8Array(22 + targetPngSize);
const view = new DataView(icoBytes.buffer);

// 1. ICO Header (6 bytes)
view.setUint16(0, 0, true);     // Reserved
view.setUint16(2, 1, true);     // Image type (1 = ICO)
view.setUint16(4, 1, true);     // Number of images (1)

// 2. Directory Entry (16 bytes)
view.setUint8(6, 0);            // Width (0 = 256)
view.setUint8(7, 0);            // Height (0 = 256)
view.setUint8(8, 0);            // Colors
view.setUint8(9, 0);            // Reserved
view.setUint16(10, 1, true);    // Color planes
view.setUint16(12, 32, true);   // Bits per pixel
view.setUint32(14, targetPngSize, true); // Size of image data (exactly 120,000)
view.setUint32(18, 22, true);   // Offset of image data (22)

// 3. Image Data
icoBytes.set(paddedPng, 22);

fs.writeFileSync('./utils/stub-builder/icon_padded.ico', icoBytes);
console.log('Padded ICO written to ./utils/stub-builder/icon_padded.ico. Size:', icoBytes.length);
