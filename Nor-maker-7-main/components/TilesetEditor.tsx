// components/TilesetEditor.tsx
// محرر التايلز — يسمح بتخصيص مظهر الـ solid tiles (ID=1) في الـ Level
// بسيط ومتكامل: color picker + pixel painter 16x16 + preview

import * as React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Download, Upload } from 'lucide-react';

export interface TileDefinition {
  id: number;
  name: string;
  color: string;      // fallback solid color
  src: string | null; // base64 custom pixel art (16x16)
  solid: boolean;
}

interface TilesetEditorProps {
  tiles: TileDefinition[];
  onUpdateTiles: (tiles: TileDefinition[]) => void;
}

const CANVAS_SIZE = 16;
const DISPLAY_SCALE = 16; // 16x16 px per pixel → 256x256 canvas display

const DEFAULT_TILES: TileDefinition[] = [
  { id: 1, name: 'Solid Wall', color: '#8b4513', src: null, solid: true },
  { id: 2, name: 'Platform',   color: '#228b22', src: null, solid: true },
  { id: 3, name: 'Water',      color: '#1e90ff', src: null, solid: false },
  { id: 4, name: 'Lava',       color: '#ff4500', src: null, solid: false },
  { id: 5, name: 'Ice',        color: '#b0e0e6', src: null, solid: true },
  { id: 6, name: 'Sand',       color: '#f4a460', src: null, solid: true },
  { id: 7, name: 'Brick',      color: '#b22222', src: null, solid: true },
  { id: 8, name: 'Metal',      color: '#708090', src: null, solid: true },
];

const TilesetEditor: React.FC<TilesetEditorProps> = ({ tiles, onUpdateTiles }) => {
  const effectiveTiles = useMemo(() => tiles.length > 0 ? tiles : DEFAULT_TILES, [tiles]);
  const [selectedId, setSelectedId]   = useState<number>(1);
  const [drawColor, setDrawColor]     = useState('#8b4513');
  const [isErasing, setIsErasing]     = useState(false);
  const [isPainting, setIsPainting]   = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pre-build O(1) Map index to eliminate linear array searches (.find) during high-frequency component renders
  const tileMap = useMemo(() => new Map<number, TileDefinition>(effectiveTiles.map(t => [t.id, t])), [effectiveTiles]);
  const selectedTile = useMemo(() => tileMap.get(selectedId) || effectiveTiles[0], [tileMap, selectedId, effectiveTiles]);

  // رسم الـ canvas عند تغيير الـ tile المحدد
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    if (selectedTile.src) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, CANVAS_SIZE * DISPLAY_SCALE, CANVAS_SIZE * DISPLAY_SCALE);
      img.src = selectedTile.src;
    } else {
      ctx.fillStyle = selectedTile.color;
      ctx.fillRect(0, 0, CANVAS_SIZE * DISPLAY_SCALE, CANVAS_SIZE * DISPLAY_SCALE);
      // نقش بسيط
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = DISPLAY_SCALE;
      for (let x = 0; x < CANVAS_SIZE; x++) {
        for (let y = 0; y < CANVAS_SIZE; y++) {
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(x * DISPLAY_SCALE, y * DISPLAY_SCALE, DISPLAY_SCALE, DISPLAY_SCALE);
          }
        }
      }
    }
  }, [selectedTile]);

  const paint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isPainting) return;
    const rect  = canvas.getBoundingClientRect();
    const px    = Math.floor((e.clientX - rect.left) / rect.width  * CANVAS_SIZE);
    const py    = Math.floor((e.clientY - rect.top)  / rect.height * CANVAS_SIZE);
    if (px < 0 || py < 0 || px >= CANVAS_SIZE || py >= CANVAS_SIZE) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = isErasing ? selectedTile.color : drawColor;
    ctx.fillRect(px * DISPLAY_SCALE, py * DISPLAY_SCALE, DISPLAY_SCALE, DISPLAY_SCALE);
  }, [isPainting, isErasing, drawColor, selectedTile.color]);

  const saveCanvasToTile = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const src = canvas.toDataURL('image/png');
    const updated = effectiveTiles.map(t =>
      t.id === selectedId ? { ...t, src } : t
    );
    onUpdateTiles(updated);
  }, [canvasRef, selectedId, effectiveTiles, onUpdateTiles]);

  const resetTile = () => {
    const updated = effectiveTiles.map(t =>
      t.id === selectedId ? { ...t, src: null } : t
    );
    onUpdateTiles(updated);
    // إعادة رسم الـ canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = selectedTile.color;
    ctx.fillRect(0, 0, CANVAS_SIZE * DISPLAY_SCALE, CANVAS_SIZE * DISPLAY_SCALE);
  };

  const handleColorChange = (color: string) => {
    const updated = effectiveTiles.map(t =>
      t.id === selectedId ? { ...t, color } : t
    );
    onUpdateTiles(updated);
  };

  return (
    <div className="flex h-full gap-2 p-2 bg-win-workspace overflow-hidden">

      {/* Tile List */}
      <div className="flex flex-col gap-1 w-28 shrink-0 overflow-y-auto">
        <div className="text-[9px] font-pixel text-win-blue uppercase mb-1 px-1">Tiles</div>
        {effectiveTiles.map(tile => (
          <div
            key={tile.id}
            onClick={() => { setSelectedId(tile.id); setDrawColor(tile.color); }}
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer rounded-sm border text-[10px] font-ui
              ${selectedId === tile.id
                ? 'bg-win-select text-white border-win-blue'
                : 'bg-win-face text-win-text border-win-highlight hover:bg-blue-50'}`}
          >
            <div
              className="w-4 h-4 rounded-sm shrink-0 border border-win-shadow"
              style={{ background: tile.src ? `url(${tile.src}) center/cover` : tile.color }}
            />
            <span className="truncate">{tile.id}: {tile.name}</span>
          </div>
        ))}
      </div>

      {/* Canvas Editor */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="text-[9px] font-pixel text-win-blue uppercase px-1">
          Editing: Tile {selectedTile.id} — {selectedTile.name}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="color" value={drawColor}
            onChange={e => setDrawColor(e.target.value)}
            className="w-7 h-7 rounded border border-win-shadow cursor-pointer p-0.5"
            title="Draw Color"
          />
          <button
            onClick={() => setIsErasing(false)}
            className={`px-2 py-0.5 text-[10px] font-ui border rounded-sm shadow-win-out
              ${!isErasing ? 'bg-win-select text-white shadow-win-in' : 'bg-win-face text-win-text hover:bg-blue-50'}`}
          >✏️ Draw</button>
          <button
            onClick={() => setIsErasing(true)}
            className={`px-2 py-0.5 text-[10px] font-ui border rounded-sm shadow-win-out
              ${isErasing ? 'bg-win-select text-white shadow-win-in' : 'bg-win-face text-win-text hover:bg-blue-50'}`}
          >🧹 Erase</button>
          <div className="flex items-center gap-1 ml-auto">
            <label className="text-[9px] font-ui text-gray-500">Base color:</label>
            <input
              type="color" value={selectedTile.color}
              onChange={e => handleColorChange(e.target.value)}
              className="w-5 h-5 rounded border border-win-shadow cursor-pointer p-0"
              title="Tile Base Color (used in fallback)"
            />
          </div>
          <button
            onClick={resetTile}
            className="px-2 py-0.5 text-[10px] font-ui border rounded-sm bg-win-face shadow-win-out hover:bg-red-50 flex items-center gap-1"
            title="Reset to solid color"
          >
            <RefreshCw size={10}/> Reset
          </button>
          <button
            onClick={saveCanvasToTile}
            className="px-2 py-0.5 text-[10px] font-ui border rounded-sm bg-green-100 shadow-win-out hover:bg-green-200 flex items-center gap-1 font-bold"
          >
            <Download size={10}/> Apply
          </button>
        </div>

        {/* Canvas */}
        <div className="shadow-win-in border border-win-shadow overflow-hidden" style={{ width: 256, height: 256 }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE * DISPLAY_SCALE}
            height={CANVAS_SIZE * DISPLAY_SCALE}
            style={{ width: 256, height: 256, imageRendering: 'pixelated', cursor: isPainting ? 'crosshair' : 'crosshair' }}
            onMouseDown={(e) => { setIsPainting(true); paint(e); }}
            onMouseMove={paint}
            onMouseUp={() => { setIsPainting(false); saveCanvasToTile(); }}
            onMouseLeave={() => { if (isPainting) { setIsPainting(false); saveCanvasToTile(); } }}
          />
        </div>

        <div className="text-[9px] font-ui text-gray-400">
          16×16 pixel art — {selectedTile.solid ? '🔲 Solid' : '🌊 Passable'} — Click Apply to save
        </div>
      </div>

      {/* Preview 4x */}
      <div className="flex flex-col gap-2 w-24 shrink-0">
        <div className="text-[9px] font-pixel text-win-blue uppercase">Preview</div>
        <div className="grid grid-cols-2 gap-1">
          {effectiveTiles.slice(0, 8).map(tile => (
            <div
              key={tile.id}
              className="w-10 h-10 border border-win-shadow rounded-sm overflow-hidden"
              style={{
                background: tile.src ? `url(${tile.src}) center/cover` : tile.color,
                imageRendering: 'pixelated',
                outline: tile.id === selectedId ? '2px solid #0078d7' : 'none'
              }}
              title={`Tile ${tile.id}: ${tile.name}`}
              onClick={() => { setSelectedId(tile.id); setDrawColor(tile.color); }}
            />
          ))}
        </div>
        <div className="text-[8px] font-ui text-gray-400 text-center">
          Tile palette<br/>(click to select)
        </div>
      </div>

    </div>
  );
};

export default TilesetEditor;
export { DEFAULT_TILES };
