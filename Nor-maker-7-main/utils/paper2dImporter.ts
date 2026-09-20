/**
 * Paper 2D Sprite Sheet Importer
 * Implements UE5-style sprite extraction: Auto mode (alpha-based) and Grid mode
 */

export interface ExtractOptions {
  mode: 'auto' | 'grid';
  cellWidth?: number;
  cellHeight?: number;
  numCellsX?: number; // 0 = no limit
  numCellsY?: number;
  marginX?: number;
  marginY?: number;
  spacingX?: number;
  spacingY?: number;
  namingTemplate?: string; // e.g. "Sprite_{0}"
  namingStartIndex?: number;
  outlineColor?: string;
  bgColor?: string;
}

export interface ExtractedSprite {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataURL: string;
}

/**
 * Applies Paper 2D Texture Settings to a canvas:
 * - Removes smoothing (Nearest filter equivalent)
 * - Preserves pixel-perfect rendering
 */
export function applyPaper2DTextureSettings(
  src: string,
  callback: (result: string) => void
) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);
    callback(canvas.toDataURL('image/png'));
  };
  img.src = src;
}

/**
 * Auto-extract: Groups connected non-transparent pixel regions
 * Returns bounding boxes of each found sprite region
 */
function autoExtractBounds(
  imageData: ImageData,
  width: number,
  height: number
): Array<{ x: number; y: number; w: number; h: number }> {
  const data = imageData.data;
  const visited = new Uint8Array(width * height);
  const regions: Array<{ x: number; y: number; w: number; h: number }> = [];

  const isOpaque = (px: number, py: number) => {
    if (px < 0 || px >= width || py < 0 || py >= height) return false;
    return data[(py * width + px) * 4 + 3] > 10;
  };

  for (let sy = 0; sy < height; sy++) {
    for (let sx = 0; sx < width; sx++) {
      const idx = sy * width + sx;
      if (visited[idx] || !isOpaque(sx, sy)) continue;

      // BFS flood fill to find region
      const stack: [number, number][] = [[sx, sy]];
      let minX = sx, maxX = sx, minY = sy, maxY = sy;
      visited[idx] = 1;

      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors: [number, number][] = [
          [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const ni = ny * width + nx;
          if (!visited[ni] && isOpaque(nx, ny)) {
            visited[ni] = 1;
            stack.push([nx, ny]);
          }
        }
      }

      regions.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
    }
  }

  // Sort regions: top-to-bottom, left-to-right
  regions.sort((a, b) => {
    const rowA = Math.floor(a.y / 8);
    const rowB = Math.floor(b.y / 8);
    if (rowA !== rowB) return rowA - rowB;
    return a.x - b.x;
  });

  return regions;
}

/**
 * Grid-extract: Divides sheet into uniform cells
 */
function gridExtractBounds(
  width: number,
  height: number,
  opts: Required<ExtractOptions>
): Array<{ x: number; y: number; w: number; h: number }> {
  const {
    cellWidth, cellHeight,
    marginX, marginY,
    spacingX, spacingY,
    numCellsX, numCellsY
  } = opts;

  const regions: Array<{ x: number; y: number; w: number; h: number }> = [];

  let col = 0, row = 0;
  let y = marginY;

  while (y + cellHeight <= height) {
    let x = marginX;
    col = 0;

    while (x + cellWidth <= width) {
      if (numCellsX > 0 && col >= numCellsX) break;
      regions.push({ x, y, w: cellWidth, h: cellHeight });
      x += cellWidth + spacingX;
      col++;
    }

    y += cellHeight + spacingY;
    row++;
    if (numCellsY > 0 && row >= numCellsY) break;
  }

  return regions;
}

/**
 * Main extractor: returns array of extracted sprite dataURLs with names
 */
export async function extractSpritesFromSheet(
  sheetSrc: string,
  opts: ExtractOptions
): Promise<ExtractedSprite[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      const defaults: Required<ExtractOptions> = {
        mode: opts.mode,
        cellWidth: opts.cellWidth || 16,
        cellHeight: opts.cellHeight || 16,
        numCellsX: opts.numCellsX || 0,
        numCellsY: opts.numCellsY || 0,
        marginX: opts.marginX || 0,
        marginY: opts.marginY || 0,
        spacingX: opts.spacingX || 0,
        spacingY: opts.spacingY || 0,
        namingTemplate: opts.namingTemplate || 'Sprite_{0}',
        namingStartIndex: opts.namingStartIndex || 0,
        outlineColor: opts.outlineColor || '#00ff00',
        bgColor: opts.bgColor || '#808080',
      };

      let bounds: Array<{ x: number; y: number; w: number; h: number }>;

      if (opts.mode === 'auto') {
        bounds = autoExtractBounds(imageData, img.width, img.height);
      } else {
        bounds = gridExtractBounds(img.width, img.height, defaults);
      }

      const results: ExtractedSprite[] = [];
      const frameCanvas = document.createElement('canvas');
      const frameCtx = frameCanvas.getContext('2d')!;
      frameCtx.imageSmoothingEnabled = false;

      let idx = defaults.namingStartIndex;
      for (const b of bounds) {
        frameCanvas.width = b.w;
        frameCanvas.height = b.h;
        frameCtx.clearRect(0, 0, b.w, b.h);
        frameCtx.drawImage(img, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);

        const name = defaults.namingTemplate.replace('{0}', String(idx));
        results.push({
          name,
          x: b.x,
          y: b.y,
          width: b.w,
          height: b.h,
          dataURL: frameCanvas.toDataURL('image/png'),
        });
        idx++;
      }

      resolve(results);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = sheetSrc;
  });
}

/**
 * Draw sheet preview with outline boxes on a canvas
 */
export function drawSheetPreview(
  canvas: HTMLCanvasElement,
  sheetSrc: string,
  bounds: Array<{ x: number; y: number; w: number; h: number }>,
  outlineColor: string = '#00ff00',
  bgColor: string = '#808080',
  scale: number = 2
) {
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sheet image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Outlines
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    for (const b of bounds) {
      ctx.strokeRect(b.x * scale, b.y * scale, b.w * scale, b.h * scale);
    }
  };
  img.src = sheetSrc;
}
