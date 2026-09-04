
import * as React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Eraser, Grid, Check, ZoomIn, ZoomOut, CheckSquare, Square as SquareIcon, Box as BoxIcon, Clock, Undo2, Redo2, Layout, Layers, Box, Camera, X, Sun, Move } from 'lucide-react';
import { LevelData, RoomSettings, BackgroundDef, ViewDef, SpriteAsset, BackgroundAsset, GameObject, UIMenu, Scene3DObject } from '../types';
import { TRANSITION_CATALOG, TRANSITION_MAP } from './TransitionEffect';
import RoomLightingPhysicsPanel from './RoomLightingPhysicsPanel';
import { Room3DOrbitViewer } from './Room3DOrbitViewer';

interface LevelEditorProps {
  levelData: number[]; // Main data (legacy/base)
  layers?: import('../types').LevelDataLayer[];
  onUpdateLayers?: (layers: import('../types').LevelDataLayer[]) => void;
  width: number;
  height: number;
  sprites: SpriteAsset[];
  backgroundAssets: BackgroundAsset[];
  gameObjects: GameObject[];
  uiMenus?: UIMenu[];
  onUpdate: (newData: number[]) => void;
  onResize: (w: number, h: number) => void;
  roomSettings: RoomSettings;
  onUpdateRoomSettings: (s: RoomSettings) => void;
  backgrounds: BackgroundDef[];
  onUpdateBackgrounds: (b: BackgroundDef[]) => void;
  views: ViewDef[];
  onUpdateViews: (v: ViewDef[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  viewMode: '2d' | '2.5d' | '3d';
  onUpdateViewMode: (mode: '2d' | '2.5d' | '3d') => void;
  zDepth: number;
  onUpdateZDepth: (z: number) => void;
  drawOnSurface: boolean;
  onUpdateDrawOnSurface: (draw: boolean) => void;
  isoMap: any[];
  onUpdateIsoMap: (map: any[]) => void;
  scene3D: Scene3DObject[];
  onUpdateScene3D: (scene: Scene3DObject[]) => void;
  tileDefs?: { id: number; name: string; color: string; src: string | null; solid: boolean }[];
  model3DAssets?: import('../types').Model3DAsset[];
  onAddModel3DAsset?: (asset: import('../types').Model3DAsset) => void;
  stamps?: import('../types').Stamp[];
  onSaveStamp?: (stamp: import('../types').Stamp) => void;
  onDeleteStamp?: (id: string) => void;
}

import { IsometricEditor } from './IsometricEditor';
import { ThreeDEditor } from './ThreeDEditor';


type ToolType = 'pencil' | 'eraser' | 'bucket' | 'box' | 'place3d' | 'move' | 'select' | 'stamp';


const GroupBox = ({ label, children }: { label: string, children?: React.ReactNode }) => ( <fieldset className="border border-gray-300 p-2 pt-1 mb-2 rounded-[2px] w-full"> <legend className="px-1 text-[11px] text-win-blue">{label}</legend> {children} </fieldset> );
const NumberInput = ({ label, value, onChange, className = "w-12" }: any) => ( <div className="flex items-center gap-1"> <label className="text-[10px] w-4 text-right">{label}:</label> <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value) || 0)} className={`border border-win-shadow px-1 py-0.5 text-[10px] ${className}`} /> </div> );

/* ── Panel Visibility Dropdown menu ── */
interface PanelEntry { label: string; icon: string; val: boolean; set: (v: boolean) => void; }
const PanelMenu: React.FC<{ entries: PanelEntry[]; onClose: () => void }> = ({ entries }) => (
    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-400 shadow-xl rounded z-[999] p-1.5 min-w-[170px] text-[11px]" style={{ direction: 'ltr' }}>
        <div className="text-[10px] font-bold text-gray-500 border-b border-gray-200 pb-1 mb-1 px-1 tracking-wide uppercase">Panels</div>
        {entries.map(({ label, icon, val, set }) => (
            <button
                key={label}
                onClick={() => set(!val)}
                className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100 rounded text-left select-none"
            >
                <span className={`w-4 h-4 border flex items-center justify-center shrink-0 rounded-sm text-[9px] ${val ? 'bg-win-blue text-white border-blue-700' : 'border-gray-400 text-gray-400'}`}>
                    {val ? <Check size={9}/> : ''}
                </span>
                <span className="text-gray-400 w-4 text-center">{icon}</span>
                <span className={val ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}>{label}</span>
            </button>
        ))}
    </div>
);

const LevelEditor: React.FC<LevelEditorProps> = ({
  levelData, layers = [], onUpdateLayers, width, height, sprites, backgroundAssets, gameObjects, uiMenus,
  onUpdate, onResize, roomSettings, onUpdateRoomSettings, backgrounds, onUpdateBackgrounds,
  views, onUpdateViews, onUndo, onRedo, canUndo, canRedo,
  viewMode, onUpdateViewMode, zDepth, onUpdateZDepth, drawOnSurface, onUpdateDrawOnSurface, isoMap, onUpdateIsoMap, scene3D, onUpdateScene3D,
  tileDefs, model3DAssets, onAddModel3DAsset, stamps = [], onSaveStamp, onDeleteStamp
}) => {
  const [activeTab, setActiveTab] = useState<'objects' | 'settings' | 'backgrounds' | 'views' | 'ui' | 'instances' | 'transitions' | 'layers' | 'stamps'>('objects');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);

  // Index lookup maps for O(1) asset access during render operations
  const spriteMap = useMemo(() => new Map<string, SpriteAsset>(sprites.map(s => [s.id, s])), [sprites]);
  const bgAssetMap = useMemo(() => new Map<string, BackgroundAsset>(backgroundAssets.map(b => [b.id, b])), [backgroundAssets]);
  const stampMap = useMemo(() => new Map(stamps.map(s => [s.id, s])), [stamps]);
  const model3DMap = useMemo(() => new Map((model3DAssets || []).map(a => [a.id, a])), [model3DAssets]);
 main

  // selectedTool corresponds to the MAP ID.
  // 0=Eraser, 1=Solid Wall, 2+=Objects (gameObjects index + 2)
  const [selectedTool, setSelectedTool] = useState<number>(1);
  const [currentToolType, setCurrentToolType] = useState<ToolType>('pencil');
  const [zoom, setZoom] = useState(1.5);
  const [snapX, setSnapX] = useState(roomSettings.snapX || 16);
  const [snapY, setSnapY] = useState(roomSettings.snapY || 16);

  const [showGrid, setShowGrid] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [localW, setLocalW] = useState(width);
  const [localH, setLocalH] = useState(height);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);

  // Selection Logic
  const [selection, setSelection] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [selectedCells, setSelectedCells] = useState<{ [key: string]: number }>({});
  const [dragSelectionOffset, setDragSelectionOffset] = useState({ x: 0, y: 0 });

  const [selected3DModelId, setSelected3DModelId] = useState<string | null>(null);
  const [selected3DObjectId, setSelected3DObjectId] = useState<string | null>(null);
  const [activeStampId, setActiveStampId] = useState<string | null>(null);
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [preview3DAngle, setPreview3DAngle] = useState<'perspective' | 'top' | 'front' | 'side' | 'isometric'>('perspective');
  const [show3DOrbit, setShow3DOrbit] = useState(false);
  const [hoverCell, setHoverCell] = useState<{x: number; y: number} | null>(null);

  /* ── Panel visibility ── */
  const [showToolbar,   setShowToolbar]   = useState(true);
  const [showSidebar,   setShowSidebar]   = useState(true);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showPanelMenu, setShowPanelMenu] = useState(false);
  const panelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (panelMenuRef.current && !panelMenuRef.current.contains(e.target as Node)) {
        setShowPanelMenu(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteImagesRef = useRef<{[key: string]: HTMLImageElement}>({});
  const bgImagesRef = useRef<{[key: string]: HTMLImageElement}>({});
  const tileImagesRef = useRef<{[key: number]: HTMLImageElement}>({});

  useEffect(() => {
    setSnapX(roomSettings.snapX || 16);
    setSnapY(roomSettings.snapY || 16);
  }, [roomSettings.snapX, roomSettings.snapY]);


  useEffect(() => { setLocalW(width); setLocalH(height); }, [width, height]);

  useEffect(() => {
    sprites.forEach((s) => {
        if (s.src) {
            const img = new Image();
            img.src = s.src;
            img.onload = () => { spriteImagesRef.current[s.id] = img; drawCanvas(); };
        }
    });
  }, [sprites]);

  useEffect(() => {
    backgroundAssets.forEach((b) => {
        if (b.src) {
            const img = new Image();
            img.src = b.src;
            img.onload = () => { bgImagesRef.current[b.id] = img; drawCanvas(); };
        }
    });
  }, [backgroundAssets]);

  useEffect(() => {
    if (tileDefs) {
      tileDefs.forEach((t) => {
        if (t.src) {
          const img = new Image();
          img.src = t.src;
          img.onload = () => { tileImagesRef.current[t.id] = img; drawCanvas(); };
        }
      });
    }
  }, [tileDefs]);

  useEffect(() => { drawCanvas(); }, [levelData, layers, currentLayerIndex, selection, isDraggingSelection, zoom, hoverPos, dragStart, showGrid, showUI, roomSettings.bgColor, roomSettings.drawBgColor, gameObjects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selection) {
                const x1 = Math.min(selection.x1, selection.x2);
                const x2 = Math.max(selection.x1, selection.x2);
                const y1 = Math.min(selection.y1, selection.y2);
                const y2 = Math.max(selection.y1, selection.y2);

                if (layers.length > 0 && layers[currentLayerIndex]) {
                    const nl = [...layers];
                    const newData = [...nl[currentLayerIndex].data];
                    for(let ry=y1; ry<=y2; ry++) {
                        for(let rx=x1; rx<=x2; rx++) {
                            newData[ry * width + rx] = 0;
                        }
                    }
                    nl[currentLayerIndex] = { ...nl[currentLayerIndex], data: newData };
                    onUpdateLayers!(nl);
                } else {
                    const newData = [...levelData];
                    for(let ry=y1; ry<=y2; ry++) {
                        for(let rx=x1; rx<=x2; rx++) {
                            newData[ry * width + rx] = 0;
                        }
                    }
                    onUpdate(newData);
                }
                setSelection(null);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, layers, currentLayerIndex, levelData, width, height, onUpdate, onUpdateLayers]);

  // ⚡ Bolt: Pre-resolve wall tile definition (ID=1) before looping through grid tiles to avoid linear array search `tileDefs?.find()` inside high-frequency canvas render loops.
  const wallTileDef = useMemo(() => tileDefs?.find(t => t.id === 1), [tileDefs]);

  const drawTileAt = (ctx: CanvasRenderingContext2D, tileId: number, x: number, y: number) => {
    if (tileId === 1) {
 main
        } else {
            const wallColor = wallTileDef?.color || '#8b4513';
            ctx.fillStyle = wallColor;
            ctx.fillRect(x, y, snapX, snapY);
            ctx.strokeStyle = wallColor.replace(/^#/, '') ? `${wallColor}99` : '#5c2e0e';
            ctx.strokeRect(x, y, snapX, snapY);
        }
    } else {
        const objIndex = tileId - 2;
        const obj = gameObjects[objIndex];
        if (obj && obj.spriteId && spriteImagesRef.current[obj.spriteId]) {
            const img = spriteImagesRef.current[obj.spriteId];
            let frameW = img.width;
            const frameH = img.height;
            if (img.width > img.height) frameW = img.height;
            ctx.drawImage(img, 0, 0, frameW, frameH, x, y, frameW, frameH);
        } else if (obj) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(x, y, snapX, snapY);
            ctx.fillStyle = 'white';
            ctx.font = '8px Arial';
            ctx.fillText(obj.name.substr(0,2), x+2, y+10);
        } else {
            ctx.fillStyle = 'red';
            ctx.font = '10px Arial';
            ctx.fillText("?", x+4, y+12);
        }
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = roomSettings.drawBgColor ? roomSettings.bgColor : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!roomSettings.drawBgColor) {
        ctx.fillStyle = '#eee';
        for(let y=0; y<height; y++) for(let x=0; x<width; x++) if((x+y)%2===0) ctx.fillRect(x*snapX*zoom, y*snapY*zoom, snapX*zoom, snapY*zoom);
    }


    ctx.save();
    ctx.scale(zoom, zoom);

    // --- BACKGROUNDS ---
    backgrounds.forEach(bg => {
        if (bg.visible && bg.source && bgImagesRef.current[bg.source]) {
            const img = bgImagesRef.current[bg.source];
            if (!img) return;
            const roomPixelW = width * snapX;
            const roomPixelH = height * snapY;


            if (bg.stretch) {
                ctx.drawImage(img, 0, 0, roomPixelW, roomPixelH);
            } else {
                let startX = (bg.x || 0);
                let startY = (bg.y || 0);
                const offX = bg.tileH ? (startX % img.width) - img.width : startX;
                const offY = bg.tileV ? (startY % img.height) - img.height : startY;
                const cols = bg.tileH ? Math.ceil(roomPixelW / img.width) + 2 : 1;
                const rows = bg.tileV ? Math.ceil(roomPixelH / img.height) + 2 : 1;
                for (let c = 0; c < cols; c++) {
                    for (let r = 0; r < rows; r++) {
                        const dx = offX + (c * img.width);
                        const dy = offY + (r * img.height);
                        if (dx > roomPixelW || dy > roomPixelH || dx + img.width < 0 || dy + img.height < 0) continue;
                        ctx.drawImage(img, Math.floor(dx), Math.floor(dy));
                    }
                }
            }
        }
    });

    // --- TILES & OBJECTS (Layers) ---
    const layersToDraw = layers && layers.length > 0 ? layers : [{ id: 'base', name: 'Base', data: levelData, visible: true, locked: false }];

    layersToDraw.forEach((layer, lIdx) => {
        if (!layer.visible) return;
        const data = layer.data;

        for (let i = 0; i < data.length; i++) {
          const col = i % width;
          const row = Math.floor(i / width);
          if (col >= width || row >= height) continue;

          // If we are dragging a selection, don't draw the cells that are in the selection from their original position
          if (isDraggingSelection && selection) {
             const x1 = Math.min(selection.x1, selection.x2);
             const x2 = Math.max(selection.x1, selection.x2);
             const y1 = Math.min(selection.y1, selection.y2);
             const y2 = Math.max(selection.y1, selection.y2);
             if (col >= x1 && col <= x2 && row >= y1 && row <= y2 && lIdx === currentLayerIndex) continue;
          }

          const x = col * snapX;
          const y = row * snapY;
          const tileId = data[i];

          if (tileId === 0) continue;
          drawTileAt(ctx, tileId, x, y);
        }
    });

    // --- DRAGGING SELECTION PREVIEW ---
    if (isDraggingSelection && selection && hoverPos) {
        const dx = hoverPos.x - dragSelectionOffset.x;
        const dy = hoverPos.y - dragSelectionOffset.y;
        Object.entries(selectedCells).forEach(([key, tileId]) => {
            const [cx, cy] = key.split(',').map(Number);
            const x = (cx + dx) * snapX;
            const y = (cy + dy) * snapY;
            ctx.globalAlpha = 0.7;
            drawTileAt(ctx, tileId, x, y);
            ctx.globalAlpha = 1.0;
        });
    }

    // --- CURSOR ---
    if (hoverPos) {
        const x = hoverPos.x * snapX;
        const y = hoverPos.y * snapY;
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2;

        if (currentToolType === 'select' && isDrawing && dragStart) {
            const startX = Math.min(dragStart.x, hoverPos.x) * snapX;
            const startY = Math.min(dragStart.y, hoverPos.y) * snapY;
            const w = (Math.abs(hoverPos.x - dragStart.x) + 1) * snapX;
            const h = (Math.abs(hoverPos.y - dragStart.y) + 1) * snapY;
            ctx.setLineDash([4, 2]);
            ctx.strokeStyle = '#00ffff';
            ctx.strokeRect(startX, startY, w, h);
            ctx.setLineDash([]);
        } else if (currentToolType === 'box' && isDrawing && dragStart) {
            const startX = Math.min(dragStart.x, hoverPos.x) * snapX;
            const startY = Math.min(dragStart.y, hoverPos.y) * snapY;
            const w = (Math.abs(hoverPos.x - dragStart.x) + 1) * snapX;
            const h = (Math.abs(hoverPos.y - dragStart.y) + 1) * snapY;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.fillRect(startX, startY, w, h); ctx.strokeRect(startX, startY, w, h);
        } else if (currentToolType === 'eraser') {
            ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2;
            ctx.strokeRect(x, y, snapX, snapY);
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+snapX, y+snapY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x+snapX, y); ctx.lineTo(x, y+snapY); ctx.stroke();
        } else {
            ctx.strokeRect(x, y, snapX, snapY);
            // Draw preview
            if (currentToolType === 'pencil') {
                if (selectedTool === 1) {
                     ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
                     ctx.fillRect(x,y,snapX,snapY);
                } else if (selectedTool > 1) {

                    const obj = gameObjects[selectedTool - 2];
                    if (obj && obj.spriteId && spriteImagesRef.current[obj.spriteId]) {
                        const img = spriteImagesRef.current[obj.spriteId];
                        let frameW = img.width;
                        const frameH = img.height;
                        if (img.width > img.height) frameW = img.height;

                        ctx.globalAlpha = 0.5;
                        ctx.drawImage(img, 0, 0, frameW, frameH, x, y, frameW, frameH);
                        ctx.globalAlpha = 1.0;
                    }
                }
            }
        }
    }

    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; ctx.lineWidth = 1/zoom; ctx.beginPath();
      const gridX = snapX > 0 ? snapX : 16;
      const gridY = snapY > 0 ? snapY : 16;
      for (let x = 0; x <= width * snapX; x += gridX) { ctx.moveTo(x, 0); ctx.lineTo(x, height * snapY); }
      for (let y = 0; y <= height * snapY; y += gridY) { ctx.moveTo(0, y); ctx.lineTo(width * snapX, y); }
      ctx.stroke();
    }


    if (roomSettings.enableViews && activeTab === 'views') {
        const view = views[currentViewIndex];
        if (view.visible) {
            ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 2/zoom;
            ctx.strokeRect(view.viewX, view.viewY, view.viewW, view.viewH);
            ctx.fillStyle = '#00FF00'; ctx.font = `${10/zoom}px Tahoma`;
            ctx.fillText(`View ${currentViewIndex}`, view.viewX + 2, view.viewY + (12/zoom));
        }
    }

    if (showUI && uiMenus) {
        uiMenus.forEach(menu => {
            if (!menu.visible) return;
            menu.elements.forEach(el => {
                if (!el.visible) return;
                if (el.type === 'text') {
                    ctx.fillStyle = el.textColor || 'white';
                    ctx.font = `${el.fontSize || 8}px ${el.fontFamily || '"Press Start 2P"'}`;
                    ctx.textAlign = (el.textAlign as any) || 'left';
                    ctx.textBaseline = 'top';
                    let displayText = el.text || '';
                    if (displayText.startsWith('=')) displayText = displayText.substring(1);
                    ctx.fillText(displayText, el.x, el.y);
                } else if (el.type === 'bar') {
                    ctx.fillStyle = 'red';
                    ctx.fillRect(el.x, el.y, el.w, el.h);
                    ctx.fillStyle = el.barColor || 'green';
                    ctx.fillRect(el.x, el.y, el.w, el.h);
                } else if (el.type === 'image') {
                    const sprite = el.spriteId ? spriteMap.get(el.spriteId) : undefined;
                    if (sprite && sprite.src && spriteImagesRef.current[sprite.id]) {
                        ctx.drawImage(spriteImagesRef.current[sprite.id], el.x, el.y, el.w, el.h);
                    }
                } else if (el.type === 'button') {
                    ctx.fillStyle = el.bgColor || 'gray';
                    ctx.fillRect(el.x, el.y, el.w, el.h);
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(el.x, el.y, el.w, el.h);
                    ctx.fillStyle = el.textColor || 'white';
                    ctx.font = `${el.fontSize || 8}px ${el.fontFamily || '"Press Start 2P"'}`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    let displayText = el.text || 'Button';
                    if (displayText.startsWith('=')) displayText = displayText.substring(1);
                    ctx.fillText(displayText, el.x + el.w/2, el.y + el.h/2);
                }
            });
        });
    }

    ctx.restore();
  };

  const handlePointer = (e: React.PointerEvent, type: 'down'|'move'|'up') => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / zoom / snapX);
      const y = Math.floor((e.clientY - rect.top) / zoom / snapY);


      if (type === 'down') {
          setIsDrawing(true);
          setDragStart({x, y});

          if (currentToolType === 'move' && selection) {
             const x1 = Math.min(selection.x1, selection.x2);
             const x2 = Math.max(selection.x1, selection.x2);
             const y1 = Math.min(selection.y1, selection.y2);
             const y2 = Math.max(selection.y1, selection.y2);
             if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
                 setIsDraggingSelection(true);
                 setDragSelectionOffset({ x: x - x1, y: y - y1 });

                 // Extract selected cells
                 const cells: { [key: string]: number } = {};
                 const data = layers.length > 0 ? layers[currentLayerIndex].data : levelData;
                 for (let ry = y1; ry <= y2; ry++) {
                     for (let rx = x1; rx <= x2; rx++) {
                         const val = data[ry * width + rx];
                         if (val !== 0) cells[`${rx},${ry}`] = val;
                     }
                 }
                 setSelectedCells(cells);
                 return;
             } else {
                 setSelection(null);
             }
          }

          if (x >= 0 && x < width && y >= 0 && y < height) {
              if (currentToolType === 'pencil' || currentToolType === 'eraser') paintTile(x, y);
              if (currentToolType === 'bucket') floodFill(x, y);
              if (currentToolType === 'place3d') place3DObjectAt(x, y);
              if (currentToolType === 'stamp' && activeStampId) applyStamp(x, y);
          }
      }
      else if (type === 'move') {
          setHoverPos({x, y});
          if (isDrawing && x >= 0 && x < width && y >= 0 && y < height) {
              if (!isDraggingSelection) {
                  if (currentToolType === 'pencil' || currentToolType === 'eraser') paintTile(x, y);
              }
          }
      }
      else if (type === 'up') {
          if (isDrawing) {
              if (currentToolType === 'box' && dragStart) drawBox(dragStart.x, dragStart.y, x, y);
              if (currentToolType === 'select' && dragStart) setSelection({ x1: dragStart.x, y1: dragStart.y, x2: x, y2: y });
              if (isDraggingSelection && selection && dragStart) {
                  moveSelection(x, y);
              }
          }
          setIsDrawing(false);
          setIsDraggingSelection(false);
          setDragStart(null);
      }
  };

  const applyStamp = (x: number, y: number) => {
 main
    if (!stamp) return;
    const newData = layers.length > 0 ? [...layers[currentLayerIndex].data] : [...levelData];
    for(let sy=0; sy<stamp.height; sy++) {
        for(let sx=0; sx<stamp.width; sx++) {
            const tx = x + sx;
            const ty = y + sy;
            if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                const val = stamp.data[sy * stamp.width + sx];
                if (val !== 0) newData[ty * width + tx] = val;
            }
        }
    }
    if (layers.length > 0) {
        const newLayers = [...layers];
        newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], data: newData };
        onUpdateLayers!(newLayers);
    } else {
        onUpdate(newData);
    }
  };

  const moveSelection = (endX: number, endY: number) => {
      if (!selection) return;
      const dx = endX - dragSelectionOffset.x - Math.min(selection.x1, selection.x2);
      const dy = endY - dragSelectionOffset.y - Math.min(selection.y1, selection.y2);
      if (dx === 0 && dy === 0) return;

      const newData = layers.length > 0 ? [...layers[currentLayerIndex].data] : [...levelData];

      // Clear old area
      const x1 = Math.min(selection.x1, selection.x2);
      const x2 = Math.max(selection.x1, selection.x2);
      const y1 = Math.min(selection.y1, selection.y2);
      const y2 = Math.max(selection.y1, selection.y2);
      for(let ry=y1; ry<=y2; ry++) {
          for(let rx=x1; rx<=x2; rx++) {
              newData[ry * width + rx] = 0;
          }
      }

      // Paste in new area
      Object.entries(selectedCells).forEach(([key, val]) => {
          const [cx, cy] = key.split(',').map(Number);
          const tx = cx + dx;
          const ty = cy + dy;
          if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
              newData[ty * width + tx] = val;
          }
      });

      if (layers.length > 0) {
          const newLayers = [...layers];
          newLayers[currentLayerIndex] = { ...newLayers[currentLayerIndex], data: newData };
          onUpdateLayers!(newLayers);
      } else {
          onUpdate(newData);
      }
      setSelection({ x1: x1 + dx, y1: y1 + dy, x2: x2 + dx, y2: y2 + dy });
  };

  const paintTile = (x: number, y: number) => {
      const idx = y * width + x;
      const targetVal = currentToolType === 'eraser' ? 0 : selectedTool;
      if (levelData[idx] !== targetVal) {
          const newData = [...levelData];
          // If placing Player (usually we want singleton, but user asked for multiple players)
          // Removing singleton constraint to allow multiple players/objects as requested.
          newData[idx] = targetVal;
          onUpdate(newData);
      }
  };

  const floodFill = (x: number, y: number) => {
      const target = levelData[y*width+x];
      const fillVal = currentToolType === 'eraser' ? 0 : selectedTool;
      if(target === fillVal) return;
      const newData = [...levelData];
      const stack = [[x,y]];
      while(stack.length) {
          const [cx, cy] = stack.pop()!;
          const idx = cy*width+cx;
          if(cx<0||cx>=width||cy<0||cy>=height) continue;
          if(newData[idx] === target) {
              newData[idx] = fillVal;
              stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
          }
      }
      onUpdate(newData);
  };

  const place3DObjectAt = (gx: number, gy: number) => {
      if (!selected3DModelId) { window.alert('اختر نموذج 3D من القائمة العائمة أولاً\nSelect a 3D model from the floating panel first'); return; }
main
      const asset = model3DMap.get(selected3DModelId);
      if (!asset) return;
      const G = 16;
      const px = (gx - width/2) * G + G/2;
      const pz = (gy - height/2) * G + G/2;
      const newObj: Scene3DObject = {
          id: `s3d_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
          type: 'model',
          name: asset.name,
          modelUrl: asset.src,
          position: [px, 0, pz],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          castShadow: true,
      };
      onUpdateScene3D([...(scene3D || []), newObj]);
      setSelected3DObjectId(newObj.id);
  };

  const remove3DObject = (id: string) => {
      onUpdateScene3D((scene3D || []).filter(o => o.id !== id));
      if (selected3DObjectId === id) setSelected3DObjectId(null);
  };

  const drawBox = (x1: number, y1: number, x2: number, y2: number) => {
      const newData = [...levelData];
      const fillVal = currentToolType === 'eraser' ? 0 : selectedTool;
      const sx = Math.min(x1, x2), ex = Math.max(x1, x2);
      const sy = Math.min(y1, y2), ey = Math.max(y1, y2);
      const startX = Math.max(0, sx); const endX = Math.min(width-1, ex);
      const startY = Math.max(0, sy); const endY = Math.min(height-1, ey);
      for(let y=startY; y<=endY; y++) {
          for(let x=startX; x<=endX; x++) {
              newData[y*width+x] = fillVal;
          }
      }
      onUpdate(newData);
  };

  const applyResize = () => {
      if (localW === width && localH === height) return;
      const newMap = new Array(localW * localH).fill(0);
      for (let y = 0; y < Math.min(height, localH); y++) {
          for (let x = 0; x < Math.min(width, localW); x++) {
              newMap[y * localW + x] = levelData[y * width + x] || 0;
          }
      }
      onResize(localW, localH);
      onUpdate(newMap);
  };

  const updateBackground = (field: keyof BackgroundDef, val: any) => {
      const newBgs = [...backgrounds];
      newBgs[currentBgIndex] = { ...newBgs[currentBgIndex], [field]: val };
      onUpdateBackgrounds(newBgs);
  };

  const updateView = (field: keyof ViewDef, val: any) => {
      const newViews = [...views];
      newViews[currentViewIndex] = { ...newViews[currentViewIndex], [field]: val };
      onUpdateViews(newViews);
  };

  const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
      <button onClick={() => setActiveTab(id)} className={`flex-1 md:flex-none px-3 py-1 text-xs border-r border-gray-400 relative top-[1px] ${activeTab === id ? 'bg-win-face font-bold border-b-2 border-win-face z-10' : 'bg-gray-100 border-b border-gray-400 text-gray-600'}`}> {label} </button>
  );

  return (
    <div className="flex flex-col h-full bg-win-face select-none font-ui text-xs relative">

        {/* ── Floating restore toolbar button (shown when toolbar is hidden) ── */}
        {!showToolbar && (
            <div className="absolute top-1 right-1 z-50 flex items-center gap-1">
                <div className="relative" ref={panelMenuRef}>
                    <button
                        onClick={() => setShowPanelMenu(v => !v)}
                        className="px-2 py-1 bg-[#1a1a2e]/90 hover:bg-[#1a1a2e] text-white text-[10px] rounded shadow-lg flex items-center gap-1 border border-[#444]"
                        title="Panels visibility"
                    >
                        <Layers size={12}/> Panels
                    </button>
                    {showPanelMenu && <PanelMenu
                        entries={[
                            { label: 'Toolbar',      icon: '⊟', val: showToolbar,   set: setShowToolbar },
                            { label: 'Left Sidebar', icon: '◧', val: showSidebar,   set: setShowSidebar },
                            { label: 'Status Bar',   icon: '▬', val: showStatusBar, set: setShowStatusBar },
                            { label: 'Grid',         icon: '⊞', val: showGrid,      set: setShowGrid },
                            { label: 'UI Preview',   icon: '⬜', val: showUI,        set: setShowUI },
                        ]}
                        onClose={() => setShowPanelMenu(false)}
                    />}
                </div>
            </div>
        )}

        {showToolbar && <div className="flex flex-wrap items-center p-1 border-b border-white shadow-win-flat bg-win-face gap-2">
            <div className="flex items-center gap-1">
                <button onClick={() => { if(window.confirm("Clear room?")) onUpdate(new Array(width*height).fill(0)); }} title="Clear Room" className="p-1 hover:bg-win-select hover:text-white rounded"><Eraser size={16}/></button>
            </div>
            <div className="w-px h-4 bg-gray-400 hidden md:block"/>
            <div className="flex items-center gap-1">
                <button
                  onClick={() => { setCurrentToolType('select'); setSelection(null); }}
                  title="Select Area (S)"
                  className={`p-1 rounded ${currentToolType === 'select' ? 'bg-win-select text-white shadow-win-in' : 'hover:bg-win-select hover:text-white'}`}
                >
                    <CheckSquare size={16}/>
                </button>
                <button
                  onClick={() => setCurrentToolType('move')}
                  title="Move Selection (M)"
                  className={`p-1 rounded ${currentToolType === 'move' ? 'bg-win-select text-white shadow-win-in' : 'hover:bg-win-select hover:text-white'}`}
                  disabled={!selection}
                >
                    <Move size={16}/>
                </button>
                <button
                  onClick={() => {
                      if(!selection) return;
                      if (!window.confirm("حذف المنطقة المختارة؟")) return;
                      const x1 = Math.min(selection.x1, selection.x2);
                      const x2 = Math.max(selection.x1, selection.x2);
                      const y1 = Math.min(selection.y1, selection.y2);
                      const y2 = Math.max(selection.y1, selection.y2);

                      if (layers.length > 0 && layers[currentLayerIndex]) {
                          const nl = [...layers];
                          const newData = [...nl[currentLayerIndex].data];
                          for(let ry=y1; ry<=y2; ry++) {
                              for(let rx=x1; rx<=x2; rx++) {
                                  newData[ry * width + rx] = 0;
                              }
                          }
                          nl[currentLayerIndex] = { ...nl[currentLayerIndex], data: newData };
                          onUpdateLayers!(nl);
                      } else {
                          const newData = [...levelData];
                          for(let ry=y1; ry<=y2; ry++) {
                              for(let rx=x1; rx<=x2; rx++) {
                                  newData[ry * width + rx] = 0;
                              }
                          }
                          onUpdate(newData);
                      }
                      setSelection(null);
                  }}
                  title="Delete Selection (Del)"
                  className={`p-1 rounded hover:bg-win-select hover:text-white ${!selection ? 'opacity-30' : ''}`}
                  disabled={!selection}
                >
                    <X size={16} className="text-red-500"/>
                </button>
                {selection && (
                    <button
                      onClick={() => {
                          const name = window.prompt("Enter Group Name:");
                          if (name) {
                              const x1 = Math.min(selection.x1, selection.x2);
                              const x2 = Math.max(selection.x1, selection.x2);
                              const y1 = Math.min(selection.y1, selection.y2);
                              const y2 = Math.max(selection.y1, selection.y2);
                              const w = x2 - x1 + 1;
                              const h = y2 - y1 + 1;
                              const data = layers.length > 0 ? layers[currentLayerIndex].data : levelData;
                              const stampData: number[] = new Array(w * h).fill(0);
                              for(let ry=y1; ry<=y2; ry++) {
                                  for(let rx=x1; rx<=x2; rx++) {
                                      stampData[(ry-y1) * w + (rx-x1)] = data[ry * width + rx];
                                  }
                              }
                              onSaveStamp?.({ id: `stamp_${Date.now()}`, name, width: w, height: h, data: stampData });
                          }
                      }}
                      title="Group Selection (Stamp)"
                      className="p-1 rounded hover:bg-win-select hover:text-white flex items-center gap-1 px-2 border border-gray-300"
                    >
                        <BoxIcon size={14}/> <span className="text-[9px]">Group</span>
                    </button>
                )}
            </div>
            <div className="w-px h-4 bg-gray-400 hidden md:block"/>
            <div className="flex items-center gap-1">
                <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" className={`p-1 rounded ${!canUndo ? 'opacity-30 cursor-not-allowed' : 'hover:bg-win-select hover:text-white'}`}><Undo2 size={16}/></button>
                <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" className={`p-1 rounded ${!canRedo ? 'opacity-30 cursor-not-allowed' : 'hover:bg-win-select hover:text-white'}`}><Redo2 size={16}/></button>
            </div>
            <div className="w-px h-4 bg-gray-400 hidden md:block"/>
            <div className="flex items-center gap-1"><span className="text-gray-600 hidden sm:inline">Snap X:</span><input type="number" value={snapX} onChange={e=>setSnapX(parseInt(e.target.value))} className="w-10 border border-gray-400 px-1"/><span className="text-gray-600 hidden sm:inline">Snap Y:</span><input type="number" value={snapY} onChange={e=>setSnapY(parseInt(e.target.value))} className="w-10 border border-gray-400 px-1"/><button onClick={() => setShowGrid(!showGrid)} title="Toggle Grid (G)" className={`p-1 rounded ${showGrid ? 'bg-win-select text-white shadow-win-in ring-1 ring-blue-300' : 'hover:bg-win-select hover:text-white'}`}><Grid size={16}/></button><button onClick={() => setShowUI(!showUI)} title="Toggle UI Preview" className={`p-1 rounded ${showUI ? 'bg-win-select text-white shadow-win-in ring-1 ring-blue-300' : 'hover:bg-win-select hover:text-white'}`}><Layout size={16}/></button></div>
            <div className="w-px h-4 bg-gray-400 hidden md:block"/>
            <div className="flex items-center gap-1"><button onClick={() => setZoom(Math.max(0.5, zoom-0.5))} className="p-1 hover:bg-win-select hover:text-white"><ZoomOut size={16}/></button><button onClick={() => setZoom(Math.min(4, zoom+0.5))} className="p-1 hover:bg-win-select hover:text-white"><ZoomIn size={16}/></button></div>
            <div className="flex items-center gap-1">
                <button onClick={() => setShow3DPreview(v => !v)} title="3D Camera Preview · معاينة الكاميرا 3D" className={`p-1 rounded flex items-center gap-1 ${show3DPreview ? 'bg-blue-700 text-white shadow-win-in ring-1 ring-blue-300' : 'hover:bg-win-select hover:text-white'}`}><Camera size={16}/><span className="text-[10px]">3D</span></button>
                <button onClick={() => setShow3DOrbit(true)} title="فتح معاينة الغرفة بكاميرا Orbit ثلاثية الأبعاد — بيانات الروم لا تتغير" className="p-1 rounded flex items-center gap-1 bg-indigo-700 hover:bg-indigo-600 text-white shadow" style={{fontSize: 10}}>
                    <Box size={14}/><span className="text-[10px] font-bold">3D Orbit</span>
                </button>
            </div>
            <div className="w-px h-4 bg-gray-400 hidden md:block"/>
            <div className="flex items-center bg-gray-200 border border-gray-400 p-0.5 rounded gap-0.5 ml-auto mr-2 shadow-win-in">
                <span className="text-[10px] font-bold text-gray-600 px-1">View:</span>
                <button
                  onClick={() => onUpdateViewMode('2d')}
                  className={`px-3 py-0.5 text-[10px] font-bold rounded-[2px] transition-colors border ${viewMode === '2d' ? 'bg-win-blue text-white border-blue-800 shadow-win-in' : 'bg-win-face text-black border-gray-300 hover:bg-gray-100 shadow-win-out'}`}
                >
                  2D
                </button>
                <button
                  onClick={() => onUpdateViewMode('2.5d')}
                  className={`px-3 py-0.5 text-[10px] font-bold rounded-[2px] transition-colors border ${viewMode === '2.5d' ? 'bg-win-blue text-white border-blue-800 shadow-win-in' : 'bg-win-face text-black border-gray-300 hover:bg-gray-100 shadow-win-out'}`}
                >
                  2.5D (Wareware)
                </button>
                <button
                  onClick={() => onUpdateViewMode('3d')}
                  className={`px-3 py-0.5 text-[10px] font-bold rounded-[2px] transition-colors border ${viewMode === '3d' ? 'bg-win-blue text-white border-blue-800 shadow-win-in' : 'bg-win-face text-black border-gray-300 hover:bg-gray-100 shadow-win-out'}`}
                >
                  3D (Unreal)
                </button>
                {viewMode === '3d' && (
                    <div className="flex items-center ml-1">
                        <span className="text-[10px] font-bold text-gray-600 px-1">Game Camera:</span>
                        <select
                            value={roomSettings.cameraMode || 'first_person'}
                            onChange={e => onUpdateRoomSettings({...roomSettings, cameraMode: e.target.value as any})}
                            className="border border-win-shadow shadow-win-in px-1 py-0.5 text-[10px] bg-white outline-none"
                        >
                            <option value="first_person">First Person</option>
                            <option value="third_person">Third Person</option>
                            <option value="top_down">Top Down</option>
                            <option value="isometric">Isometric</option>
                        </select>
                    </div>
                )}
            </div>

            {/* ── Panels visibility dropdown ── */}
            <div className="relative ml-1" ref={panelMenuRef}>
                <button
                    onClick={() => setShowPanelMenu(v => !v)}
                    title="Show/Hide Panels"
                    className={`p-1 rounded flex items-center gap-1 px-2 text-[10px] border border-gray-400 ${showPanelMenu ? 'bg-win-select text-white' : 'hover:bg-win-select hover:text-white'}`}
                >
                    <Layers size={13}/> Panels
                </button>
                {showPanelMenu && (
                    <PanelMenu
                        entries={[
                            { label: 'Toolbar',      icon: '⊟', val: showToolbar,   set: setShowToolbar },
                            { label: 'Left Sidebar', icon: '◧', val: showSidebar,   set: setShowSidebar },
                            { label: 'Status Bar',   icon: '▬', val: showStatusBar, set: setShowStatusBar },
                            { label: 'Grid',         icon: '⊞', val: showGrid,      set: setShowGrid },
                            { label: 'UI Preview',   icon: '⬜', val: showUI,        set: setShowUI },
                        ]}
                        onClose={() => setShowPanelMenu(false)}
                    />
                )}
            </div>
        </div>}{/* ← end showToolbar conditional */}

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* ── Left sidebar (collapsible) ── */}
            <div className={`${showSidebar ? 'w-full md:w-[300px] h-56 md:h-auto' : 'w-0 h-0 md:h-auto overflow-hidden'} flex flex-col border-b md:border-b-0 md:border-r border-gray-400 bg-win-face shrink-0 overflow-hidden transition-all duration-150`}>
                <div className="flex border-b border-gray-400 bg-gray-200 px-1 pt-1 overflow-x-auto no-scrollbar shrink-0"><TabButton id="objects" label="Objs" /><TabButton id="instances" label="Insts" /><TabButton id="layers" label="Layers" /><TabButton id="stamps" label="Groups" /><TabButton id="settings" label="Room" /><TabButton id="transitions" label="Trans" /><TabButton id="backgrounds" label="BGs" /><TabButton id="views" label="Views" /><TabButton id="ui" label="UI" /></div>
                <div className="flex-1 p-2 overflow-y-auto">
                    {activeTab === 'objects' && (
                        <div className="flex flex-col gap-2 h-full">
                            <div className="bg-white border-2 border-win-shadow shadow-win-in p-2 flex-1 min-h-[100px]">
                                <div className="text-gray-500 mb-2 font-bold">Object Palette</div>
                                <div className="grid grid-cols-6 md:grid-cols-4 gap-1">
                                    <button onClick={() => { setSelectedTool(0); setCurrentToolType('eraser'); }} className={`w-10 h-10 border flex items-center justify-center ${currentToolType === 'eraser' ? 'border-red-600 bg-red-100 ring-1 ring-red-400' : 'border-gray-300 hover:bg-gray-100'}`} title="Eraser"><Eraser size={16}/></button>

                                    {/* Wall / Solid - Hardcoded ID 1 */}
                                    <button
                                        onClick={() => { setSelectedTool(1); setCurrentToolType('pencil'); }}
                                        className={`w-10 h-10 border flex items-center justify-center relative group ${selectedTool === 1 && currentToolType !== 'eraser' ? 'border-blue-600 bg-blue-100 ring-1 ring-blue-400' : 'border-gray-300 hover:bg-gray-100'}`}
                                        title="Solid Wall"
                                    >
                                        <div className="w-8 h-8 bg-[#8b4513] border border-[#5c2e0e]"></div>
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-md">Wall</span>
                                    </button>

                                    {/* Dynamic Objects - ID 2+ */}
                                    {gameObjects.map((obj, idx) => {
                                        const toolId = idx + 2;
                                        const sprite = obj.spriteId ? spriteMap.get(obj.spriteId) : undefined;
                                        return (
                                            <button
                                                key={`${obj.id}_${idx}`}
                                                onClick={() => { setSelectedTool(toolId); setCurrentToolType('pencil'); }}
                                                className={`w-10 h-10 border flex items-center justify-center relative group ${selectedTool === toolId && currentToolType !== 'eraser' ? 'border-blue-600 bg-blue-100 ring-1 ring-blue-400' : 'border-gray-300 hover:bg-gray-100'}`}
                                                title={obj.name}
                                            >
                                                {sprite && sprite.src ? (
                                                    // Here we also need to slice for the button icon
                                                    <div className="w-8 h-8 overflow-hidden flex items-center justify-center">
                                                        <img
                                                            src={sprite.src || undefined}
                                                            className="h-full image-render-pixel object-cover object-left"
                                                            style={{
                                                                width: 'auto',
                                                                maxWidth: 'none',
                                                                // Simple logic for the icon: if we assume strips are horizontal,
                                                                // object-left and h-full usually shows the first frame if it's square.
                                                                // For a more robust solution we'd need a canvas or complex CSS,
                                                                // but object-left + h-full works for standard strips.
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-300 text-[9px] flex items-center justify-center font-bold text-gray-600">{obj.name.substr(0,2)}</div>
                                                )}
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-md">{obj.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'instances' && (
                        <div className="flex flex-col gap-2 h-full overflow-hidden">
                            <div className="text-gray-600 font-bold mb-1 px-1">Room Instances</div>
                            <div className="flex-1 overflow-y-auto border border-win-shadow shadow-win-in bg-white p-1">
                                {(() => {
                                    const counts: { [key: number]: { name: string, indices: number[] } } = {};
                                    levelData.forEach((id, idx) => {
                                        if (id !== 0) {
                                            if (!counts[id]) {
                                                let name = "Unknown";
                                                if (id === 1) name = "Solid Wall";
                                                else {
                                                    const obj = gameObjects[id - 2];
                                                    if (obj) name = obj.name;
                                                }
                                                counts[id] = { name, indices: [] };
                                            }
                                            counts[id].indices.push(idx);
                                        }
                                    });

                                    const sortedIds = Object.keys(counts).map(Number).sort((a, b) => a - b);

                                    if (sortedIds.length === 0) {
                                        return <div className="text-gray-400 text-center py-4 italic">No instances in room</div>;
                                    }

                                    return sortedIds.map(id => (
                                        <div key={id} className="mb-3 border-b border-gray-100 pb-2">
                                            <div className="flex items-center justify-between bg-gray-50 p-1 mb-1">
                                                <span className="font-bold text-win-blue truncate max-w-[150px]">{counts[id].name} ({counts[id].indices.length})</span>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`Delete all ${counts[id].indices.length} instances of ${counts[id].name}?`)) {
                                                            const newData = levelData.map(v => v === id ? 0 : v);
                                                            onUpdate(newData);
                                                        }
                                                    }}
                                                    className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1 hover:bg-red-600 hover:text-white rounded"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-0.5 pl-2">
                                                {counts[id].indices.map(idx => {
                                                    const x = idx % width;
                                                    const y = Math.floor(idx / width);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between text-[10px] hover:bg-blue-50 group px-1 cursor-default"
                                                            onMouseEnter={() => setHoverPos({x, y})}
                                                            onMouseLeave={() => setHoverPos(null)}
                                                        >
                                                            <span>Pos: ({x}, {y})</span>
                                                            <button
                                                                onClick={() => {
                                                                    const newData = [...levelData];
                                                                    newData[idx] = 0;
                                                                    onUpdate(newData);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:font-bold"
                                                                title="Delete this instance"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}
                    {activeTab === 'layers' && (
                        <div className="flex flex-col gap-2 h-full overflow-hidden">
                            <div className="flex items-center justify-between px-1 mb-1">
                                <span className="text-gray-600 font-bold">Layers (ترتيب)</span>
                                <button
                                  onClick={() => {
                                      const newLayer = {
                                          id: `layer_${Date.now()}`,
                                          name: `Layer ${layers.length + 1}`,
                                          visible: true,
                                          locked: false,
                                          data: new Array(width * height).fill(0)
                                      };
                                      onUpdateLayers!([...layers, newLayer]);
                                  }}
                                  className="bg-win-face border border-win-shadow shadow-win-out text-[10px] px-2 py-0.5"
                                >
                                    + Add Layer
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto border border-win-shadow shadow-win-in bg-white p-1">
                                {[...layers].reverse().map((layer, idx) => {
                                    const actualIdx = layers.length - 1 - idx;
                                    return (
                                        <div
                                            key={layer.id}
                                            onClick={() => setCurrentLayerIndex(actualIdx)}
                                            className={`flex items-center justify-between p-1 border-b border-gray-100 cursor-pointer ${currentLayerIndex === actualIdx ? 'bg-win-select text-white' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <button onClick={(e) => { e.stopPropagation(); const nl = [...layers]; nl[actualIdx].visible = !nl[actualIdx].visible; onUpdateLayers!(nl); }} className="text-[10px]">
                                                    {layer.visible ? '👁️' : '🚫'}
                                                </button>
                                                <span
                                                    className="text-xs truncate"
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        const newName = window.prompt("Enter new layer name:", layer.name);
                                                        if (newName) {
                                                            const nl = [...layers];
                                                            nl[actualIdx] = { ...nl[actualIdx], name: newName };
                                                            onUpdateLayers!(nl);
                                                        }
                                                    }}
                                                >
                                                    {layer.name}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 shrink-0 bg-gray-200/20 rounded px-1">
                                                {actualIdx < layers.length - 1 && (
                                                    <button onClick={(e) => { e.stopPropagation(); const nl = [...layers]; const tmp = nl[actualIdx]; nl[actualIdx] = nl[actualIdx+1]; nl[actualIdx+1]=tmp; onUpdateLayers!(nl); setCurrentLayerIndex(actualIdx+1); }} className="text-[10px] hover:text-black">↑</button>
                                                )}
                                                {actualIdx > 0 && (
                                                    <button onClick={(e) => { e.stopPropagation(); const nl = [...layers]; const tmp = nl[actualIdx]; nl[actualIdx] = nl[actualIdx-1]; nl[actualIdx-1]=tmp; onUpdateLayers!(nl); setCurrentLayerIndex(actualIdx-1); }} className="text-[10px] hover:text-black">↓</button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if(layers.length <= 1) return window.alert("Cannot delete the only layer.");
                                                        if(window.confirm(`Delete layer "${layer.name}"?`)) {
                                                            const nl = layers.filter((_, i) => i !== actualIdx);
                                                            onUpdateLayers!(nl);
                                                            setCurrentLayerIndex(Math.max(0, actualIdx - 1));
                                                        }
                                                    }}
                                                    className="text-[10px] text-red-500 hover:text-red-700 ml-1"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {activeTab === 'stamps' && (
                        <div className="flex flex-col gap-2 h-full overflow-hidden">
                            <span className="text-gray-600 font-bold px-1">Groups (Stamps)</span>
                            <div className="grid grid-cols-2 gap-2 p-1 overflow-y-auto">
                                {stamps.map(s => (
                                    <div
                                        key={s.id}
                                        className={`group relative p-2 border bg-white flex flex-col items-center gap-1 ${activeStampId === s.id && currentToolType === 'stamp' ? 'border-blue-600 shadow-win-in ring-1 ring-blue-300' : 'border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        <button
                                            className="w-full h-full flex flex-col items-center"
                                            onClick={() => { setActiveStampId(s.id); setCurrentToolType('stamp'); }}
                                        >
                                            <Box size={24} className="text-gray-400"/>
                                            <span className="text-[10px] truncate w-full text-center">{s.name}</span>
                                        </button>

                                        <div className="absolute top-0 right-0 flex gap-1 p-1 bg-white/80 rounded-bl-sm opacity-60 group-hover:opacity-100">
                                            <button
                                                title="Rename"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newName = window.prompt("Rename group:", s.name);
                                                    if(newName && onSaveStamp) {
                                                        onSaveStamp({ ...s, name: newName });
                                                    }
                                                }}
                                                className="text-[10px] hover:text-blue-600"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                title="Delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm(`Delete group "${s.name}"?`)) {
                                                        onDeleteStamp?.(s.id);
                                                    }
                                                }}
                                                className="text-[10px] hover:text-red-600"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {stamps.length === 0 && <div className="col-span-2 text-center text-gray-500 italic py-4">No groups created yet. Select area and click "Group".</div>}
                            </div>
                        </div>
                    )}
                    {activeTab === 'settings' && (
                        <div className="flex flex-col gap-2">
                            <GroupBox label="Room Properties">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex flex-col gap-0.5">
                                        <label htmlFor="rs_name" className="text-[10px] font-bold">Name:</label>
                                        <input id="rs_name" type="text" title="Room Name" placeholder="room1" value={roomSettings.name} onChange={e => onUpdateRoomSettings({...roomSettings, name: e.target.value})} className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs"/>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <label htmlFor="rs_caption" className="text-[10px] font-bold">Caption for the room:</label>
                                        <input id="rs_caption" type="text" title="Room Caption" placeholder="My Room" value={roomSettings.caption} onChange={e => onUpdateRoomSettings({...roomSettings, caption: e.target.value})} className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs"/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-0.5">
                                            <label htmlFor="rs_speed" className="text-[10px] font-bold">Room Speed:</label>
                                            <input id="rs_speed" type="number" title="Room Speed (steps per second)" value={roomSettings.speed ?? 30} onChange={e => onUpdateRoomSettings({...roomSettings, speed: parseInt(e.target.value) || 30})} className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs"/>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <label htmlFor="rs_lives" className="text-[10px] font-bold">Initial Lives:</label>
                                            <input id="rs_lives" type="number" title="Initial Lives" value={roomSettings.lives ?? 3} onChange={e => onUpdateRoomSettings({...roomSettings, lives: parseInt(e.target.value) || 0})} className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs"/>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" title="Persistent Room" checked={roomSettings.persistent ?? false} onChange={e => onUpdateRoomSettings({...roomSettings, persistent: e.target.checked})}/>
                                            <span className="text-[10px]">Persistent</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" title="Clear background with window color" checked={roomSettings.clearView ?? true} onChange={e => onUpdateRoomSettings({...roomSettings, clearView: e.target.checked})}/>
                                            <span className="text-[10px]">Clear background with window color</span>
                                        </label>
                                    </div>
                                </div>
                            </GroupBox>

                            <GroupBox label="Room Size">
                                <div className="flex gap-2">
                                    <div className="flex-1 flex flex-col gap-0.5">
                                        <label htmlFor="rs_w" className="text-[10px] font-bold">Cols (tiles):</label>
                                        <input id="rs_w" type="number" title="Room Width in Tiles" value={localW} onChange={e => setLocalW(parseInt(e.target.value) || 1)} className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs w-full"/>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-0.5">
                                        <label htmlFor="rs_h" className="text-[10px] font-bold">Rows (tiles):</label>
                                        <input id="rs_h" type="number" title="Room Height in Tiles" value={localH} onChange={e => setLocalH(parseInt(e.target.value) || 1)} className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs w-full"/>
                                    </div>
                                </div>
                                <button onClick={applyResize} className="mt-1.5 w-full bg-win-face border border-win-shadow shadow-win-out active:shadow-win-in px-2 py-0.5 flex items-center justify-center gap-1 text-xs hover:bg-gray-100">
                                    <Check size={11}/> Apply Resize
                                </button>
                            </GroupBox>

                            <GroupBox label="Grid / Snap">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-0.5">
                                        <label htmlFor="rs_snapx" className="text-[10px] font-bold">Snap X (px):</label>
                                        <input id="rs_snapx" type="number" title="Snap X in pixels" value={roomSettings.snapX ?? 16} onChange={e => { const v = Math.max(1, parseInt(e.target.value) || 16); setSnapX(v); onUpdateRoomSettings({...roomSettings, snapX: v}); }} className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs"/>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <label htmlFor="rs_snapy" className="text-[10px] font-bold">Snap Y (px):</label>
                                        <input id="rs_snapy" type="number" title="Snap Y in pixels" value={roomSettings.snapY ?? 16} onChange={e => { const v = Math.max(1, parseInt(e.target.value) || 16); setSnapY(v); onUpdateRoomSettings({...roomSettings, snapY: v}); }} className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs"/>
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-500 mt-1">Pixel size of each grid cell. Affects canvas rendering and object placement.</p>
                            </GroupBox>

                            <GroupBox label="Creation Code">
                                <textarea
                                    title="Room Creation Code"
                                    placeholder="// GML/JS code to run when room starts"
                                    value={roomSettings.creationCode || ''}
                                    onChange={e => onUpdateRoomSettings({...roomSettings, creationCode: e.target.value})}
                                    className="w-full border border-win-shadow shadow-win-in px-1 py-0.5 text-xs font-mono resize-y min-h-[80px]"
                                    spellCheck={false}
                                />
                            </GroupBox>

                            <div className="flex items-center gap-2 border border-gray-300 p-1.5 bg-white">
                                <Clock size={11} className="text-blue-500"/>
                                <label htmlFor="rs_anim" className="text-[10px] font-bold whitespace-nowrap">Tile Anim (ms):</label>
                                <input id="rs_anim" type="number" title="Tile Animation Speed in ms" value={roomSettings.tileAnimSpeed || 250} onChange={e => onUpdateRoomSettings({...roomSettings, tileAnimSpeed: parseInt(e.target.value) || 250})} className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs w-16"/>
                            </div>

                            {/* UE5-style Lighting / Physics / Post-Process for the room */}
                            <div className="border border-blue-300 bg-blue-50 p-1 mt-2">
                                <div className="flex items-center gap-1 px-1 pb-1 text-[10px] font-bold text-blue-900">
                                    <Sun size={11} className="text-yellow-600"/>
                                    World Settings (3D Lighting · Physics · Post-FX)
                                </div>
                                <RoomLightingPhysicsPanel
                                    roomSettings={roomSettings}
                                    onUpdate={onUpdateRoomSettings}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'transitions' && (() => {
                        // Group effects by category
                        const cats: Record<string, typeof TRANSITION_CATALOG> = {};
                        TRANSITION_CATALOG.forEach(t => {
                          if (!cats[t.category]) cats[t.category] = [];
                          cats[t.category].push(t);
                        });
                        const current = roomSettings.transition?.type || 'fade';
                        return (
                          <div className="flex flex-col gap-0 h-full min-h-0">
                            {/* Top controls */}
                            <div className="flex items-center gap-2 p-2 border-b border-gray-300 shrink-0 flex-wrap">
                              <div className="flex items-center gap-1">
                                <label className="text-[10px] text-gray-500">Current:</label>
                                <span className="text-[10px] font-bold text-win-blue px-1 py-0.5 bg-blue-50 border border-blue-200 rounded">
                                  {TRANSITION_MAP.get(current)?.label || current}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 ml-auto">
                                <label className="text-[10px]">ms:</label>
                                <input type="number" min="100" max="3000" step="50"
                                  value={roomSettings.transition?.duration || 500}
                                  onChange={e => onUpdateRoomSettings({...roomSettings, transition:{
                                    ...(roomSettings.transition||{type:'fade',color:'#000000',easing:'easeInOut'}),
                                    duration: parseInt(e.target.value)||500
                                  }})}
                                  className="border border-win-shadow shadow-win-in px-1 py-0.5 text-[10px] bg-white outline-none w-14"/>
                              </div>
                              <div className="flex items-center gap-1">
                                <label className="text-[10px]">Color:</label>
                                <input type="color"
                                  value={roomSettings.transition?.color || '#000000'}
                                  onChange={e => onUpdateRoomSettings({...roomSettings, transition:{
                                    ...(roomSettings.transition||{type:'fade',duration:500,easing:'easeInOut'}),
                                    color: e.target.value
                                  }})}
                                  className="w-8 h-5 border border-win-shadow cursor-pointer p-0"/>
                              </div>
                              <div className="flex items-center gap-1">
                                <label className="text-[10px]">Ease:</label>
                                <select
                                  value={roomSettings.transition?.easing || 'easeInOut'}
                                  onChange={e => onUpdateRoomSettings({...roomSettings, transition:{
                                    ...(roomSettings.transition||{type:'fade',duration:500,color:'#000000'}),
                                    easing: e.target.value
                                  }})}
                                  className="border border-win-shadow shadow-win-in px-0.5 py-0.5 text-[9px] bg-white outline-none">
                                  <option value="linear">Linear</option>
                                  <option value="easeIn">In</option>
                                  <option value="easeOut">Out</option>
                                  <option value="easeInOut">In-Out</option>
                                </select>
                              </div>
                            </div>

                            {/* Visual effect browser */}
                            <div className="flex-1 overflow-y-auto min-h-0 p-1">
                              {Object.entries(cats).map(([cat, effects]) => (
                                <div key={cat} className="mb-3">
                                  <div className="text-[9px] font-bold text-win-blue uppercase px-1 py-1 sticky top-0 bg-win-workspace z-10 border-b border-blue-100">
                                    {cat} <span className="font-normal text-gray-400">({effects.length})</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {effects.map(eff => {
                                      const isSelected = current === eff.id;
                                      return (
                                        <div
                                          key={eff.id}
                                          onClick={() => onUpdateRoomSettings({...roomSettings, transition:{
                                            ...(roomSettings.transition||{duration:500,color:'#000000',easing:'easeInOut'}),
                                            type: eff.id
                                          }})}
                                          title={eff.label}
                                          className={`cursor-pointer rounded border transition-all select-none
                                            ${isSelected
                                              ? 'border-win-blue ring-1 ring-win-blue shadow-sm'
                                              : 'border-gray-300 hover:border-blue-400 hover:shadow'}`}
                                          style={{width:56, padding:'2px'}}
                                        >
                                          {/* Color swatch */}
                                          <div
                                            className="rounded-sm w-full mb-0.5 flex items-center justify-center"
                                            style={{
                                              height:32,
                                              background:`linear-gradient(135deg, ${eff.preview} 0%, ${eff.preview}aa 50%, ${eff.preview}44 100%)`,
                                              border: isSelected ? '2px solid #0078d7' : '1px solid rgba(0,0,0,0.15)',
                                            }}
                                          >
                                            <span className="text-[7px] font-mono text-white drop-shadow" style={{mixBlendMode:'difference'}}>
                                              {eff.engine==='canvas'?'▶':'▷'}
                                            </span>
                                          </div>
                                          <div className={`text-[8px] leading-tight text-center truncate px-0.5 ${isSelected?'text-win-blue font-bold':'text-gray-600'}`}>
                                            {eff.label}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Footer tip */}
                            <div className="shrink-0 px-2 py-1 bg-blue-50 border-t border-blue-100 text-[9px] text-blue-700">
                              ▶ = Canvas engine &nbsp;|&nbsp; ▷ = CSS engine &nbsp;|&nbsp; 150 effects total
                            </div>
                          </div>
                        );
                      })()
                    }
                    {activeTab === 'backgrounds' && (
                        <div className="flex flex-col gap-2 h-full">
                             <div className="flex items-center gap-2 mb-2"><input type="checkbox" checked={roomSettings.drawBgColor} onChange={e=>onUpdateRoomSettings({...roomSettings, drawBgColor: e.target.checked})}/><label>Draw background color</label></div>
                             <div className="flex items-center gap-2 mb-2 px-4"><label>Color:</label><input type="color" value={roomSettings.bgColor} onChange={e=>onUpdateRoomSettings({...roomSettings, bgColor: e.target.value})} className="w-full h-6 p-0 border border-gray-400"/></div>

                             <div className="flex flex-col gap-2 border-t border-gray-300 pt-2 flex-1 min-h-0">
                                 <div className="flex gap-2 flex-1 min-h-0">
                                     <div className="w-28 border border-win-shadow shadow-win-in bg-white overflow-y-auto shrink-0">
                                         {backgrounds.map((bg, i) => {
                                             const asset = bg.source ? bgAssetMap.get(bg.source) : undefined;
                                             return (
                                                 <div key={i} onClick={() => setCurrentBgIndex(i)} className={`px-2 py-1 cursor-pointer flex flex-col border-b border-gray-100 ${currentBgIndex === i ? 'bg-win-select text-white' : 'hover:bg-gray-100'}`}>
                                                     <div className="flex items-center gap-1">
                                                         {bg.visible ? <CheckSquare size={10}/> : <SquareIcon size={10}/>}
                                                         <span className="font-bold text-[10px]">BG {i}</span>
                                                     </div>
                                                     {asset && <span className="text-[9px] truncate opacity-80">{asset.name}</span>}
                                                 </div>
                                             );
                                         })}
                                     </div>
                                     <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                                         <div className="flex items-center gap-2"><input type="checkbox" checked={backgrounds[currentBgIndex].visible} onChange={e=>updateBackground('visible', e.target.checked)} id="bgVis"/><label htmlFor="bgVis">Visible</label></div>
                                         <div className="flex items-center gap-2"><input type="checkbox" checked={backgrounds[currentBgIndex].foreground} onChange={e=>updateBackground('foreground', e.target.checked)} id="bgFore"/><label htmlFor="bgFore">Foreground</label></div>
                                         <GroupBox label="Image">
                                             <select className="w-full border border-gray-400 text-[10px] p-0.5" value={backgrounds[currentBgIndex].source || ''} onChange={e=>updateBackground('source', e.target.value || null)}>
                                                 <option value="">(None)</option>
                                                 {backgroundAssets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                             </select>
                                         </GroupBox>
                                         <GroupBox label="Position">
                                             <div className="grid grid-cols-2 gap-1">
                                                <NumberInput label="X" value={backgrounds[currentBgIndex].x} onChange={(v:number)=>updateBackground('x',v)} className="w-10"/>
                                                <NumberInput label="Y" value={backgrounds[currentBgIndex].y} onChange={(v:number)=>updateBackground('y',v)} className="w-10"/>
                                             </div>
                                         </GroupBox>
                                         <GroupBox label="Scrolling">
                                               <div className="grid grid-cols-2 gap-1">
                                                 <NumberInput label="H" value={backgrounds[currentBgIndex].hspeed} onChange={(v:number)=>updateBackground('hspeed',v)} className="w-10"/>
                                                 <NumberInput label="V" value={backgrounds[currentBgIndex].vspeed} onChange={(v:number)=>updateBackground('vspeed',v)} className="w-10"/>
                                               </div>
                                         </GroupBox>
                                         <GroupBox label="Tiling">
                                             <div className="flex gap-2">
                                                 <label className="flex items-center gap-1"><input type="checkbox" checked={backgrounds[currentBgIndex].tileH} onChange={e=>updateBackground('tileH', e.target.checked)}/>Horz</label>
                                                 <label className="flex items-center gap-1"><input type="checkbox" checked={backgrounds[currentBgIndex].tileV} onChange={e=>updateBackground('tileV', e.target.checked)}/>Vert</label>
                                                 <label className="flex items-center gap-1"><input type="checkbox" checked={backgrounds[currentBgIndex].stretch} onChange={e=>updateBackground('stretch', e.target.checked)}/>Str</label>
                                             </div>
                                         </GroupBox>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                    {activeTab === 'views' && (
                        <div className="flex flex-col gap-1 h-full overflow-y-auto">
                            <div className="flex items-center gap-2 mb-1"><input type="checkbox" checked={roomSettings.enableViews} onChange={e=>onUpdateRoomSettings({...roomSettings, enableViews: e.target.checked})} id="enableViews"/><label htmlFor="enableViews" className="font-bold">Enable the use of Views</label></div>
                            <div className="flex gap-2 flex-1 min-h-0">
                                <div className="w-20 border border-win-shadow shadow-win-in bg-white overflow-y-auto shrink-0">{views.map((v, i) => (<div key={i} onClick={() => setCurrentViewIndex(i)} className={`px-1 py-0.5 cursor-pointer text-[10px] truncate ${currentViewIndex === i ? 'bg-win-select text-white' : 'hover:bg-gray-100'}`}>View {i} {v.visible && '*'}</div>))}</div>
                                <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                                    <div className="flex items-center gap-2"><input type="checkbox" checked={views[currentViewIndex].visible} onChange={e => updateView('visible', e.target.checked)} id="viewVis" disabled={!roomSettings.enableViews}/><label htmlFor="viewVis">Visible when room starts</label></div>
                                    <GroupBox label="View in room"><div className="grid grid-cols-2 gap-y-1 gap-x-2"><NumberInput label="X" value={views[currentViewIndex].viewX} onChange={(v:number) => updateView('viewX', v)} /><NumberInput label="Y" value={views[currentViewIndex].viewY} onChange={(v:number) => updateView('viewY', v)} /><NumberInput label="W" value={views[currentViewIndex].viewW} onChange={(v:number) => updateView('viewW', v)} /><NumberInput label="H" value={views[currentViewIndex].viewH} onChange={(v:number) => updateView('viewH', v)} /></div></GroupBox>
                                    <GroupBox label="Port on screen"><div className="grid grid-cols-2 gap-y-1 gap-x-2"><NumberInput label="X" value={views[currentViewIndex].portX} onChange={(v:number) => updateView('portX', v)} /><NumberInput label="Y" value={views[currentViewIndex].portY} onChange={(v:number) => updateView('portY', v)} /><NumberInput label="W" value={views[currentViewIndex].portW} onChange={(v:number) => updateView('portW', v)} /><NumberInput label="H" value={views[currentViewIndex].portH} onChange={(v:number) => updateView('portH', v)} /></div></GroupBox>
                                    <GroupBox label="Object following">
                                        <div className="flex flex-col gap-2">
                                            <select className="w-full border border-gray-400 text-[10px] p-0.5" value={views[currentViewIndex].followObj || ''} onChange={(e) => updateView('followObj', e.target.value || null)}>
                                                <option value="">(None)</option>
                                                {gameObjects.map((obj, oIdx) => <option key={`${obj.id}_${oIdx}`} value={obj.name}>{obj.name}</option>)}
                                            </select>
                                            <div className="grid grid-cols-2 gap-y-1 gap-x-2"><NumberInput label="Hbor" value={views[currentViewIndex].hBorder} onChange={(v:number) => updateView('hBorder', v)} className="w-10"/><NumberInput label="Vbor" value={views[currentViewIndex].vBorder} onChange={(v:number) => updateView('vBorder', v)} className="w-10"/><NumberInput label="Hsp" value={views[currentViewIndex].hSpeed} onChange={(v:number) => updateView('hSpeed', v)} className="w-10"/><NumberInput label="Vsp" value={views[currentViewIndex].vSpeed} onChange={(v:number) => updateView('vSpeed', v)} className="w-10"/></div>
                                        </div>
                                    </GroupBox>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'ui' && (
                        <div className="flex flex-col gap-2 h-full p-2">
                            <div className="text-gray-600 font-bold mb-2">UI Menus Preview</div>
                            <p className="text-gray-500 text-xs mb-4">
                                UI Menus are edited globally in the UI Editor.
                                Use the 'Toggle UI Preview' button in the toolbar above to see them overlaid on this room.
                            </p>
                            <div className="bg-white border border-win-shadow shadow-win-in p-2 flex-1 overflow-y-auto">
                                {uiMenus && uiMenus.map(menu => (
                                    <div key={menu.id} className="flex items-center justify-between mb-1 border-b border-gray-100 pb-1">
                                        <span>{menu.name}</span>
                                        <span className={`text-[10px] ${menu.visible ? 'text-green-600' : 'text-gray-400'}`}>
                                            {menu.visible ? 'Visible' : 'Hidden'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* ── Sidebar collapsed — slim toggle strip ── */}
            {!showSidebar && (
                <button
                    onClick={() => setShowSidebar(true)}
                    className="w-6 shrink-0 bg-win-face border-r border-gray-400 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    title="Show Sidebar"
                >
                    <span className="text-[9px] text-gray-600 rotate-90 whitespace-nowrap select-none">▶ Panel</span>
                </button>
            )}
            <div className="flex-1 bg-gray-500 overflow-auto flex items-center justify-center shadow-inner touch-none relative">
                <div
                    style={{
                        position: 'relative',
                        width: width * snapX * zoom,
                        height: height * snapY * zoom,
                        display: viewMode === '2d' ? 'block' : 'none',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={width * snapX * zoom}
                        height={height * snapY * zoom}
                        className={`image-render-pixel shadow-2xl bg-white ${currentToolType === 'place3d' ? 'cursor-cell' : 'cursor-crosshair'}`}
                        style={{ touchAction: 'none', display: 'block' }}
                        onPointerDown={(e) => handlePointer(e, 'down')}
                        onPointerMove={(e) => handlePointer(e, 'move')}
                        onPointerUp={(e) => handlePointer(e, 'up')}
                        onPointerLeave={(e) => handlePointer(e, 'up')}
                    />
                    {/* Scene3D markers overlay (UE5-style mixed 2D + 3D) */}
                    <div className="absolute inset-0 pointer-events-none">
                        {(scene3D || []).map(obj => {
                            const G = 16;
                            const col = obj.position[0] / G + width / 2;
                            const row = obj.position[2] / G + height / 2;
                            const left = col * snapX * zoom;
                            const top = row * snapY * zoom;
                            const isSel = selected3DObjectId === obj.id;
                            return (
                                <div
                                    key={obj.id}
                                    onClick={(e) => { e.stopPropagation(); setSelected3DObjectId(obj.id); }}
                                    onDoubleClick={(e) => { e.stopPropagation(); if (window.confirm(`Remove 3D object "${obj.name}"?`)) remove3DObject(obj.id); }}
                                    className={`pointer-events-auto absolute text-[9px] px-1 py-0.5 rounded border shadow-lg flex items-center gap-1 select-none cursor-pointer whitespace-nowrap ${isSel ? 'bg-yellow-400 text-black border-yellow-700 ring-2 ring-yellow-200' : 'bg-purple-600/85 text-white border-purple-900 hover:bg-purple-500'}`}
                                    style={{ left, top, transform: 'translate(-50%, -50%)' }}
                                    title={`3D: ${obj.name}\nClick: select • Double-click: delete`}
                                >
                                    <Box size={10} />
                                    <span>{obj.name}</span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Floating 3D Tools panel */}
                    {viewMode === '2d' && (
                        <div className="absolute top-2 right-2 bg-white/95 border border-purple-700 rounded shadow-lg p-2 text-[10px] w-44 pointer-events-auto z-10">
                            <div className="flex items-center gap-1 mb-1 text-purple-900 font-bold border-b border-purple-200 pb-1">
                                <Box size={12} /> Mixed 2D+3D
                            </div>
                            <button
                                onClick={() => setCurrentToolType(currentToolType === 'place3d' ? 'pencil' : 'place3d')}
                                className={`w-full py-1 mb-1 rounded border ${currentToolType === 'place3d' ? 'bg-purple-600 text-white border-purple-800' : 'bg-gray-100 hover:bg-purple-100 border-gray-300'}`}
                            >
                                {currentToolType === 'place3d' ? '✓ Placing 3D…' : 'Place 3D Object'}
                            </button>
                            <select
                                value={selected3DModelId || ''}
                                onChange={(e) => setSelected3DModelId(e.target.value || null)}
                                className="w-full border border-gray-400 px-1 py-0.5 mb-1"
                            >
                                <option value="">— Select 3D model —</option>
                                {(model3DAssets || []).map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            {(!model3DAssets || model3DAssets.length === 0) && (
                                <div className="text-gray-500 italic text-[9px]">Import 3D models in Perspective view first.</div>
                            )}
                            <div className="text-gray-600 mt-1">
                                Scene: {(scene3D || []).length} 3D object(s)
                            </div>
                        </div>
                    )}
                    {/* Floating 3D Camera Preview window — shows the room in true 3D
                         with switchable camera angles, without leaving the GMS 1.4 editor. */}
                    {show3DPreview && (
                        <div
                            className="absolute bottom-2 right-2 w-[420px] h-[300px] bg-black border-2 border-blue-700 shadow-2xl rounded flex flex-col z-20 pointer-events-auto"
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center bg-blue-900 text-white px-2 py-1 text-[10px] gap-1 shrink-0">
                                <Camera size={12}/>
                                <span className="font-bold">3D Camera Preview</span>
                                <select
                                    value={preview3DAngle}
                                    onChange={(e) => setPreview3DAngle(e.target.value as any)}
                                    className="ml-2 bg-blue-800 border border-blue-600 text-white text-[10px] px-1 py-0.5 rounded"
                                >
                                    <option value="perspective">Perspective</option>
                                    <option value="top">Top</option>
                                    <option value="front">Front</option>
                                    <option value="side">Side</option>
                                    <option value="isometric">Isometric</option>
                                </select>
                                <span className="ml-auto text-blue-200 text-[9px]">
                                    {(scene3D || []).length} obj
                                </span>
                                <button
                                    onClick={() => setShow3DPreview(false)}
                                    className="ml-1 hover:bg-red-600 rounded p-0.5"
                                    title="Close"
                                ><X size={12}/></button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <ThreeDEditor
                                    room={{
                                        id: roomSettings.name,
                                        width, height, map: levelData,
                                        settings: roomSettings,
                                        backgrounds, views, viewMode, isoMap,
                                        scene3D,
                                    } as any}
                                    sprites={sprites}
                                    gameObjects={gameObjects}
                                    model3DAssets={model3DAssets || []}
                                    onAddModel3DAsset={onAddModel3DAsset}
                                    onUpdateScene={onUpdateScene3D}
                                    onUpdateMap={onUpdate}
                                    viewType={preview3DAngle as any}
                                    onViewTypeChange={(v) => setPreview3DAngle(v as any)}
                                    hideTopToolbar={true}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div style={{ display: viewMode === '2.5d' ? 'block' : 'none', width: '100%', height: '100%' }}>
                    <IsometricEditor
                        room={{ id: roomSettings.name, width, height, map: levelData, settings: roomSettings, backgrounds, views, viewMode, isoMap }}
                        sprites={sprites}
                        selectedTileId={selectedTool}
                        zDepth={zDepth}
                        drawOnSurface={drawOnSurface}
                        tool={currentToolType === 'eraser' ? 'eraser' : (selectedTool > 1 ? 'sprite' : 'tile')}
                        onUpdateIsoMap={onUpdateIsoMap}
                        onUpdateZDepth={onUpdateZDepth}
                        onUpdateDrawOnSurface={onUpdateDrawOnSurface}
                    />
                </div>
                <div style={{ display: viewMode === '3d' ? 'block' : 'none', width: '100%', height: '100%' }}>
                    <ThreeDEditor
                        room={{ id: roomSettings.name, width, height, map: levelData, settings: roomSettings, backgrounds, views, viewMode, isoMap, scene3D }}
                        sprites={sprites}
                        gameObjects={gameObjects}
                        selectedTileId={selectedTool}
                        onUpdateMap={onUpdate}
                        onUpdateScene={onUpdateScene3D}
                        model3DAssets={model3DAssets || []}
                        onAddModel3DAsset={onAddModel3DAsset}
                    />
                </div>

            </div>

        </div>{/* ← end of flex flex-col md:flex-row flex-1 overflow-hidden */}

        {/* GM8-style status bar — conditionally shown */}
        {showStatusBar && (
        <div className="flex items-center gap-3 px-2 py-0.5 bg-[#d4d0c8] border-t border-[#808080] text-[10px] text-gray-700 shrink-0 select-none font-ui">
            <span className="font-bold text-win-blue">{roomSettings.name || 'room0'}</span>
            <span className="text-gray-400">|</span>
            <span>{width} × {height} tiles · {width * snapX} × {height * snapY} px</span>
            <span className="text-gray-400">|</span>
            {hoverPos
                ? <span>X: {hoverPos.x} · Y: {hoverPos.y}</span>
                : <span className="text-gray-400 italic">move mouse over room</span>
            }
            <span className="text-gray-400">|</span>
            <span>Tiles: {levelData.filter(t => t !== 0).length} / {levelData.length}</span>
            <span className="ml-auto text-gray-500 italic">
                {currentToolType === 'eraser' ? 'Eraser'
                    : currentToolType === 'select' ? 'Select Area'
                    : currentToolType === 'move' ? 'Move'
                    : currentToolType === 'box' ? 'Box Fill'
                    : currentToolType === 'place3d' ? 'Place 3D Object'
                    : selectedTool === 1 ? 'Solid Wall'
                    : selectedTool > 1 ? `${gameObjects[selectedTool - 2]?.name || 'Object'}`
                    : 'Pencil'}
            </span>
        </div>
        )}

        {/* 3D Orbit Camera — full overlay on the entire LevelEditor */}
        <Room3DOrbitViewer
            open={show3DOrbit}
            onClose={() => setShow3DOrbit(false)}
            levelData={levelData}
            width={width}
            height={height}
            snapX={snapX}
            snapY={snapY}
            roomSettings={roomSettings}
            sprites={sprites}
            gameObjects={gameObjects}
        />
    </div>
  );
};

export default LevelEditor;
