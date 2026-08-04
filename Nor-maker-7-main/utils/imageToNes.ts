

// Utility to convert standard images to NES 2-bit planar format
// NES tiles are 8x8 pixels. Each pixel is 2 bits (4 colors).

export const processImageToNes = async (src: string): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 8;
            canvas.height = 8;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            // Detect if this is a sprite strip (wider than tall)
            let sWidth = img.width;
            let sHeight = img.height;
            let sx = 0;

            // If it's a strip (e.g. 64x16), crop the first 16x16 frame
            if (sWidth > sHeight && sHeight >= 16) {
                sWidth = sHeight; // Take a square chunk from the left
            }

            // Draw and resize image to 8x8
            // Smoothing disabled to keep pixel art look if downscaling
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, sx, 0, sWidth, sHeight, 0, 0, 8, 8);

            const imageData = ctx.getImageData(0, 0, 8, 8);
            const pixels = imageData.data;

            const plane0 = new Uint8Array(8); // Lower bits
            const plane1 = new Uint8Array(8); // Upper bits

            for (let y = 0; y < 8; y++) {
                let byte0 = 0;
                let byte1 = 0;

                for (let x = 0; x < 8; x++) {
                    const idx = (y * 8 + x) * 4;
                    const r = pixels[idx];
                    const g = pixels[idx + 1];
                    const b = pixels[idx + 2];
                    const alpha = pixels[idx + 3];

                    // Brightness calculation
                    const brightness = (r + g + b) / 3;

                    // Simple quantization to 4 NES colors (0-3)
                    // 0 = Transparent/BG (Black or Alpha 0)
                    // 1 = Color 1 (Dark)
                    // 2 = Color 2 (Light)
                    // 3 = Color 3 (White/Accent)

                    let colorCode = 0;

                    if (alpha < 128) {
                        colorCode = 0; // Transparent
                    } else {
                        // FIX: Treat white and bright colors as opaque (Color 3)
                        // This prevents white sprites from disappearing or being treated as transparent
                        if (brightness < 80) colorCode = 1;
                        else if (brightness < 160) colorCode = 2;
                        else colorCode = 3;
                    }

                    // Set bits
                    if (colorCode & 1) {
                        byte0 |= (1 << (7 - x));
                    }
                    if (colorCode & 2) {
                        byte1 |= (1 << (7 - x));
                    }
                }
                plane0[y] = byte0;
                plane1[y] = byte1;
            }

            // Combine planes (16 bytes per tile)
            const tileData = new Uint8Array(16);
            tileData.set(plane0, 0);
            tileData.set(plane1, 8);
            resolve(tileData);
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
};

export const imageToNesTile = async (file: File): Promise<Uint8Array | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = await processImageToNes(e.target?.result as string);
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
};

export const imageUrlToNesTile = async (url: string): Promise<Uint8Array | null> => {
    return processImageToNes(url);
};
