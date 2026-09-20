import React, { useRef, useEffect, useState, useMemo } from 'react';
import { RoomData, SpriteAsset, IsoCell } from '../types';

interface IsometricEditorProps {
    room: RoomData;
    sprites: SpriteAsset[];
    selectedTileId: number;
    zDepth: number;
    drawOnSurface: boolean;
    tool: 'select' | 'tile' | 'ramp' | 'sprite' | 'eraser';
    onUpdateIsoMap: (newMap: IsoCell[]) => void;
    onUpdateZDepth: (z: number) => void;
    onUpdateDrawOnSurface: (val: boolean) => void;
}

const TILE_W = 32;
const TILE_H = 16; // Isometric 2:1 ratio

export const IsometricEditor: React.FC<IsometricEditorProps> = ({
    room,
    sprites,
    selectedTileId,
    zDepth,
    drawOnSurface,
    tool,
    onUpdateIsoMap,
    onUpdateZDepth,
    onUpdateDrawOnSurface
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [offset, setOffset] = useState({ x: 400, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [isPainting, setIsPainting] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
    const [lastPainted, setLastPainted] = useState<{x: number, y: number, z: number} | null>(null);

    const [localMap, setLocalMap] = useState<IsoCell[]>([]);

    useEffect(() => {
        setLocalMap(room.isoMap || []);
    }, [room.isoMap]);

    // Bolt Optimization: Memoize the sorted iso cells list by depth (Z, Y, X).
    // This avoids re-sorting localMap and allocating new arrays on high-frequency render triggers (e.g. canvas panning via offset state updates).
    const sortedMap = useMemo(() => {
        return [...localMap].sort((a, b) => {
            if (a.z !== b.z) return a.z - b.z;
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });
    }, [localMap]);

    // --- Coord Conversion ---
    const worldToScreen = (wx: number, wy: number, wz: number) => {
        // wx, wy are grid indices (0 to width/height)
        // wz is depth (0 to max z)
        const sx = offset.x + (wx - wy) * (TILE_W / 2);
        const sy = offset.y + (wx + wy) * (TILE_H / 2) - (wz * TILE_H);
        return { x: sx, y: sy };
    };

    const screenToWorld = (sx: number, sy: number) => {
        const dx = sx - offset.x;
        const dy = sy - offset.y;

        // Inverse of the above matrix
        // dy = (wx+wy)*TILE_H/2
        // dx = (wx-wy)*TILE_W/2
        const wx = (dy / TILE_H + dx / TILE_W);
        const wy = (dy / TILE_H - dx / TILE_W);

        return { x: Math.floor(wx), y: Math.floor(wy) };
    };

    // --- Rendering ---
    const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Tiles (Floor Grid)
        for (let x = 0; x < room.width; x++) {
            for (let y = 0; y < room.height; y++) {
                const p = worldToScreen(x, y, 0);

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + TILE_W/2, p.y + TILE_H/2);
                ctx.lineTo(p.x, p.y + TILE_H);
                ctx.lineTo(p.x - TILE_W/2, p.y + TILE_H/2);
                ctx.closePath();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.stroke();
            }
        }

        // Draw ISO Cells (Sorted by Z, then Y, then X for proper depth)
        sortedMap.forEach(cell => {
            drawVoxel(ctx, cell.x, cell.y, cell.z, cell.tileId);
        });
    };

    const drawVoxel = (ctx: CanvasRenderingContext2D, wx: number, wy: number, wz: number, tileId: number) => {
        const p = worldToScreen(wx, wy, wz);

        // Wareware Pastel Colors
        const baseColor = '#b3c2e6';
        const leftColor = '#8c9cbf';
        const rightColor = '#6a799c';

        // Draw 3 faces for an isometric cube
        // Top Face
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + TILE_W/2, p.y + TILE_H/2);
        ctx.lineTo(p.x, p.y + TILE_H);
        ctx.lineTo(p.x - TILE_W/2, p.y + TILE_H/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Left Face
        ctx.fillStyle = leftColor;
        ctx.beginPath();
        ctx.moveTo(p.x - TILE_W/2, p.y + TILE_H/2);
        ctx.lineTo(p.x, p.y + TILE_H);
        ctx.lineTo(p.x, p.y + TILE_H + TILE_H);
        ctx.lineTo(p.x - TILE_W/2, p.y + TILE_H + TILE_H/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right Face
        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.moveTo(p.x + TILE_W/2, p.y + TILE_H/2);
        ctx.lineTo(p.x, p.y + TILE_H);
        ctx.lineTo(p.x, p.y + TILE_H + TILE_H);
        ctx.lineTo(p.x + TILE_W/2, p.y + TILE_H + TILE_H/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // If it's a specific tile, we could draw an image here
    };

    useEffect(() => {
        render();
    }, [room.width, room.height, offset, sortedMap]);

    // --- Paint Logic ---
    const paintAt = (clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        const world = screenToWorld(mouseX, mouseY);

        if (world.x < 0 || world.x >= room.width || world.y < 0 || world.y >= room.height) return;

        if (lastPainted && lastPainted.x === world.x && lastPainted.y === world.y && lastPainted.z === zDepth) return;
        setLastPainted({ x: world.x, y: world.y, z: zDepth });

        if (tool === 'tile') {
            setLocalMap(prev => {
                const filtered = prev.filter(c => !(c.x === world.x && c.y === world.y && c.z === zDepth));
                return [...filtered, { x: world.x, y: world.y, z: zDepth, tileId: selectedTileId }];
            });
        } else if (tool === 'eraser') {
            setLocalMap(prev => prev.filter(c => !(c.x === world.x && c.y === world.y && c.z === zDepth)));
        }
    };

    // --- Mouse Handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1) { // Middle click for pan
            setIsDragging(true);
            setLastMouse({ x: e.clientX, y: e.clientY });
        } else if (e.button === 0) { // Left click for drawing
            setIsPainting(true);
            setLastPainted(null);
            paintAt(e.clientX, e.clientY);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const dx = e.clientX - lastMouse.x;
            const dy = e.clientY - lastMouse.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMouse({ x: e.clientX, y: e.clientY });
        } else if (isPainting) {
            paintAt(e.clientX, e.clientY);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (isPainting) {
            setIsPainting(false);
            onUpdateIsoMap(localMap); // Sync on finish drawing
        }
        setLastPainted(null);
    };

    return (
        <div className="relative w-full h-full bg-[#1e1e24] overflow-hidden" style={{ cursor: isDragging ? 'grabbing' : 'default' }}>
            <canvas
                ref={canvasRef}
                width={2000}
                height={2000}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onContextMenu={(e) => e.preventDefault()}
                className="absolute top-0 left-0"
            />

            {/* Glassmorphism UI Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex items-center gap-6 text-white font-ui">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold">Z-Depth: {zDepth}</span>
                    <input
                        type="range"
                        min="0" max="8"
                        value={zDepth}
                        onChange={(e) => onUpdateZDepth(parseInt(e.target.value))}
                        className="w-32"
                    />
                </div>
                <label className="flex items-center gap-2 text-[10px] cursor-pointer">
                    <input type="checkbox" checked={drawOnSurface} onChange={(e) => onUpdateDrawOnSurface(e.target.checked)} />
                    Draw on Surface
                </label>
            </div>
        </div>
    );
};
