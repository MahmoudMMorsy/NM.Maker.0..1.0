import fs from 'fs';

const exeBytes = fs.readFileSync('./utils/stub-builder/webview_stub.exe');
const pngBytes = fs.readFileSync('./utils/stub-builder/icon_padded.png');

console.log('EXE size:', exeBytes.length);
console.log('PNG size:', pngBytes.length);

// Search for pngBytes sequence
let foundIndex = -1;
for (let i = 0; i <= exeBytes.length - pngBytes.length; i++) {
    let match = true;
    // Just match the first 1000 bytes for speed, then confirm
    for (let j = 0; j < 1000; j++) {
        if (exeBytes[i + j] !== pngBytes[j]) {
            match = false;
            break;
        }
    }
    if (match) {
        // Confirm full match
        let fullMatch = true;
        for (let j = 0; j < pngBytes.length; j++) {
            if (exeBytes[i + j] !== pngBytes[j]) {
                fullMatch = false;
                break;
            }
        }
        if (fullMatch) {
            foundIndex = i;
            break;
        }
    }
}

if (foundIndex !== -1) {
    console.log('FOUND! Padded PNG starts at offset:', foundIndex);
} else {
    console.log('NOT FOUND! Padded PNG bytes are not stored contiguously.');
}
// Try to search for the start of standard PNG header inside the EXE
const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const matches = [];
for (let i = 0; i <= exeBytes.length - pngHeader.length; i++) {
    let match = true;
    for (let j = 0; j < pngHeader.length; j++) {
        if (exeBytes[i + j] !== pngHeader[j]) {
            match = false;
            break;
        }
    }
    if (match) {
        matches.push(i);
    }
}
console.log('All PNG headers found at offsets:', matches);
