
import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import {
    Eraser,
    Pencil,
    RotateCcw,
    PaintBucket,
    Pipette,
    Plus,
    Trash2,
    Play,
    Pause,
    Upload,
    Download,
    Wand2,
    Check,
    Grid,
    Move,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    FlipHorizontal,
    FlipVertical,
    Ghost,
    SplitSquareHorizontal,
    Redo2,
    Undo2,
    Layers,
    Scissors,
    Maximize,
    Target,
    Box,
    RotateCw,
    ZoomIn,
    ZoomOut,
    Eye,
    EyeOff,
    Sun,
    Image as ImageIcon
} from 'lucide-react';
// @ts-ignore
import * as omggif from 'omggif';
import { extractSpritesFromSheet, applyPaper2DTextureSettings, drawSheetPreview, ExtractedSprite, ExtractOptions } from '../utils/paper2dImporter';

export interface AttachedModel3D {
  name: string;
  format: 'glb' | 'gltf' | 'obj';
  /** data URI (base64) so it round-trips through .pnor JSON */
  data: string;
  activeAnimation?: string;
  animationNames?: string[];
}

interface SpriteEditorProps {
  initialImage?: string;
  spriteId: string;
  role?: string;
  initialFrameWidth?: number;
  initialFrameHeight?: number;
  onSave: (newImage: string, frameW: number, frameH: number) => void;
  onRoleChange?: (newRole: string) => void;
  isBackground?: boolean;
  onImportFrames?: (frames: Array<{ name: string; src: string }>) => void;
  /** Existing 3D model attached to this sprite (loaded from project). */
  initialModel3D?: AttachedModel3D | null;
  /** Called when the attached 3D model changes so it can be persisted. */
  onModel3DChange?: (model: AttachedModel3D | null) => void;
}

const RES_PRESETS = {
    SPRITE_8: { w: 8, h: 8, label: 'Tiny (8x8)' },
    SPRITE_16: { w: 16, h: 16, label: 'Standard (16x16)' },
    SPRITE_32: { w: 32, h: 32, label: 'Large (32x32)' },
    SPRITE_64: { w: 64, h: 64, label: 'Meta (64x64)' },
    NES: { w: 256, h: 240, label: 'Screen (256x240)' },
    SNES: { w: 512, h: 448, label: 'SNES (512x448)' },
    AUTO: { w: 0, h: 0, label: 'Custom' }
};

const NES_PALETTE = [
  '#000000', '#545454', '#001E74', '#081090', '#300088', '#440064', '#5C0030', '#600013', '#580800', '#481D00', '#302D00', '#0C3500', '#003A0C', '#003848', '#000000', '#000000',
  '#ECECEC', '#989698', '#003D88', '#242DAC', '#5D14AA', '#840A8A', '#A81155', '#B0192A', '#A33303', '#835300', '#5D6900', '#257400', '#007C14', '#00787C', '#000000', '#000000',
  '#FFFFFF', '#EFEDEF', '#497AF8', '#686FFB', '#A95BFD', '#D94FF9', '#FF4EAA', '#FF5B75', '#FF7445', '#FFA112', '#D7C224', '#91D230', '#3FE04D', '#2DE5E6', '#4E4E4E', '#000000',
  '#FFFFFF', '#E3E3E3', '#A6C2FE', '#B8BBFE', '#D9AFFE', '#F0A8FE', '#FFA7D8', '#FFA8BF', '#FFC0A6', '#FFD882', '#F8F192', '#D3F79E', '#ADFBBC', '#A5FCFC', '#A8A8A8', '#000000'
];

const ToolButton = ({ active, onClick, title, children, disabled }: { active?: boolean, onClick: () => void, title: string, children?: React.ReactNode, disabled?: boolean }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`
            w-7 h-7 flex items-center justify-center rounded-[2px] border transition-colors relative
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-200' : ''}
            ${active
                ? 'bg-win-select text-white border-win-darkshadow shadow-win-in'
                : 'bg-win-face text-win-text border-transparent hover:border-win-highlight hover:shadow-win-out active:border-win-darkshadow active:shadow-win-in'}
        `}
    >
        {children}
    </button>
);

const SpriteEditor: React.FC<SpriteEditorProps> = ({ initialImage, spriteId, role, initialFrameWidth, initialFrameHeight, onSave, onRoleChange, isBackground, onImportFrames, initialModel3D, onModel3DChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- EDITOR TAB STATE ---
  const [activeTab, setActiveTab] = useState<'draw' | 'sheet' | '3d'>('draw');

  // --- 3D MODEL STATE ---
  const model3dInputRef = useRef<HTMLInputElement>(null);
  const texInputRef = useRef<HTMLInputElement>(null);
  const viewport3dRef = useRef<HTMLDivElement>(null);
  const [model3dStatus, setModel3dStatus] = useState<string>('');
  const [model3dName, setModel3dName] = useState<string>('');
  const [model3dUrl, setModel3dUrl] = useState<string | null>(null);
  const [model3dType, setModel3dType] = useState<'glb' | 'gltf' | 'obj' | null>(null);
  const [model3dDragging, setModel3dDragging] = useState(false);
  const threeSceneRef = useRef<any>(null);
  const threeRendererRef = useRef<any>(null);
  const threeCameraRef = useRef<any>(null);
  const threeControlsRef = useRef<any>(null);
  const threeModelRef = useRef<any>(null);
  const threeFrameRef = useRef<number>(0);
  const [show3dWireframe, setShow3dWireframe] = useState(false);
  const [show3dGrid, setShow3dGrid] = useState(true);
  const [model3dAnimations, setModel3dAnimations] = useState<string[]>([]);
  const [activeAnimation, setActiveAnimation] = useState<string>('');
  const mixerRef = useRef<any>(null);
  const clockRef = useRef<any>(null);

  // --- PAPER 2D SHEET IMPORT STATE ---
  const [sheetSrc, setSheetSrc] = useState<string | null>(null);
  const [sheetInfo, setSheetInfo] = useState<{ w: number; h: number } | null>(null);
  const [extractMode, setExtractMode] = useState<'auto' | 'grid'>('auto');
  const [cellW, setCellW] = useState(16);
  const [cellH, setCellH] = useState(16);
  const [numCellsX, setNumCellsX] = useState(0);
  const [numCellsY, setNumCellsY] = useState(0);
  const [marginX, setMarginX] = useState(0);
  const [marginY, setMarginY] = useState(0);
  const [spacingX, setSpacingX] = useState(0);
  const [spacingY, setSpacingY] = useState(0);
  const [namingTemplate, setNamingTemplate] = useState('Sprite_{0}');
  const [namingStartIndex, setNamingStartIndex] = useState(0);
  const [outlineColor, setOutlineColor] = useState('#00ff00');
  const [bgColor, setBgColor] = useState('#808080');
  const [paper2dSettings, setPaper2dSettings] = useState(true);
  const [extractedSprites, setExtractedSprites] = useState<ExtractedSprite[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedExtracted, setSelectedExtracted] = useState<Set<number>>(new Set());
  const [sheetScale, setSheetScale] = useState(2);

  const [frames, setFrames] = useState<string[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(150); // ms per frame — قابل للتعديل
  const [previewFrame, setPreviewFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Background specific state
  const [canvasSize, setCanvasSize] = useState({ w: 16, h: 16 });
  const [resMode, setResMode] = useState<keyof typeof RES_PRESETS | 'AUTO'>('SPRITE_16');

  const [color, setColor] = useState('#FFFFFF');
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'fill' | 'picker'>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[][]>([]);
  const [redoStack, setRedoStack] = useState<string[][]>([]);

  // --- NEW FEATURES STATE ---
  const [onionSkin, setOnionSkin] = useState(false);
  const [symmetryX, setSymmetryX] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropBorder, setCropBorder] = useState(0);
  const [showStretchDialog, setShowStretchDialog] = useState(false);
  const [stretchWidth, setStretchWidth] = useState(32);
  const [stretchHeight, setStretchHeight] = useState(32);
  const [stretchWidthPct, setStretchWidthPct] = useState(100);
  const [stretchHeightPct, setStretchHeightPct] = useState(100);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [stretchQuality, setStretchQuality] = useState<'Poor' | 'Normal' | 'Good' | 'Very Good' | 'Excellent'>('Excellent');
  const lastLoadedId = useRef<string | null>(null);

  // --- INITIALIZATION (Load & Slice) ---
  useEffect(() => {
    if (lastLoadedId.current === spriteId) return;

    if (initialImage) {
        const img = new Image();
        img.src = initialImage;
        img.onload = () => {
            const w = img.width;
            const h = img.height;

            let frameW = h;
            let frameH = h;

            if (isBackground) {
                frameW = w;
                frameH = h;
                setResMode(w === 256 && h === 240 ? 'NES' : 'AUTO');
            } else {
                if (initialFrameWidth && initialFrameHeight) {
                    frameW = initialFrameWidth;
                    frameH = initialFrameHeight;
                    setResMode('AUTO');
                } else {
                    if (h === 8) setResMode('SPRITE_8');
                    else if (h === 16) setResMode('SPRITE_16');
                    else if (h === 32) setResMode('SPRITE_32');
                    else if (h === 64) setResMode('SPRITE_64');
                    else setResMode('AUTO');

                    if (w > h && w % h === 0) {
                        frameW = h;
                        frameH = h;
                    } else {
                        frameW = w;
                        frameH = h;
                    }
                }
            }

            setCanvasSize({ w: frameW, h: frameH });

            const numFrames = Math.floor(w / frameW);
            const newFrames: string[] = [];

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = frameW;
            tempCanvas.height = frameH;
            const tCtx = tempCanvas.getContext('2d');

            if (tCtx) {
                tCtx.imageSmoothingEnabled = false;
                for (let i = 0; i < numFrames; i++) {
                    tCtx.clearRect(0, 0, frameW, frameH);
                    tCtx.drawImage(img, i * frameW, 0, frameW, frameH, 0, 0, frameW, frameH);
                    newFrames.push(tempCanvas.toDataURL());
                }
            }

            setFrames(newFrames);
            setCurrentFrameIdx(0);
            lastLoadedId.current = spriteId;
        };
        img.onerror = () => {
            createBlankFrame();
            lastLoadedId.current = spriteId;
        };
    } else {
        createBlankFrame();
        lastLoadedId.current = spriteId;
    }
  }, [initialImage, spriteId, isBackground]);

  // --- RESOLUTION CHANGE HANDLER ---
  const handleResolutionChange = (mode: keyof typeof RES_PRESETS | 'AUTO') => {
    setResMode(mode);
    if (mode === 'AUTO') return;

    const newW = RES_PRESETS[mode].w;
    const newH = RES_PRESETS[mode].h;
    setCanvasSize({ w: newW, h: newH });
    saveToHistory();

    // Resize all existing frames to the new size
    if (frames.length > 0) {
        setIsLoading(true);
        const resizedFrames: string[] = new Array(frames.length).fill('');
        let processedCount = 0;

        frames.forEach((src, idx) => {
            const img = new Image();
            img.onload = () => {
                const temp = document.createElement('canvas');
                temp.width = newW;
                temp.height = newH;
                const ctx = temp.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, 0, 0, newW, newH);
                    resizedFrames[idx] = temp.toDataURL();
                }
                processedCount++;
                if (processedCount === frames.length) {
                    setFrames(resizedFrames);
                    setIsLoading(false);
                }
            };
            img.src = src;
        });
    }
  };

  // --- AUTOSAVE LOGIC (Merge & Save) ---
  useEffect(() => {
    if (frames.length === 0) return;

    setIsSaved(false);

    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = canvasSize.w * frames.length;
    stripCanvas.height = canvasSize.h;
    const ctx = stripCanvas.getContext('2d');

    if (ctx) {
        ctx.imageSmoothingEnabled = false;
        let loaded = 0;
        frames.forEach((src, i) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, i * canvasSize.w, 0);
                loaded++;
                if (loaded === frames.length) {
                    const finalData = stripCanvas.toDataURL('image/png');
                    onSave(finalData, canvasSize.w, canvasSize.h);
                    setIsSaved(true);
                }
            };
            img.src = src;
        });
    }
  }, [frames, canvasSize]);

  const createBlankFrame = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasSize.w;
        tempCanvas.height = canvasSize.h;
        setFrames([tempCanvas.toDataURL()]);
  };

  const forceSave = () => {
    if (frames.length === 0) return;
    setIsSaved(false);
    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = canvasSize.w * frames.length;
    stripCanvas.height = canvasSize.h;
    const ctx = stripCanvas.getContext('2d');
    if (ctx) {
        ctx.imageSmoothingEnabled = false;
        let loaded = 0;
        frames.forEach((src, i) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, i * canvasSize.w, 0);
                loaded++;
                if (loaded === frames.length) {
                    const finalData = stripCanvas.toDataURL('image/png');
                    onSave(finalData, canvasSize.w, canvasSize.h);
                    setIsSaved(true);
                }
            };
            img.src = src;
        });
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if (e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, redoStack, frames]);

  useEffect(() => {
      if (frames.length > 0 && canvasRef.current && frames[currentFrameIdx]) {
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;

          const loadAndDraw = async () => {
              ctx.clearRect(0,0, canvasSize.w, canvasSize.h);
              ctx.imageSmoothingEnabled = false;

              if (onionSkin && currentFrameIdx > 0 && frames[currentFrameIdx - 1]) {
                  const prevImg = new Image();
                  prevImg.src = frames[currentFrameIdx - 1];
                  await new Promise(r => prevImg.onload = r);
                  ctx.globalAlpha = 0.3;
                  ctx.drawImage(prevImg, 0, 0, canvasSize.w, canvasSize.h);
                  ctx.globalAlpha = 1.0;
              }

              const img = new Image();
              img.src = frames[currentFrameIdx];
              await new Promise(r => img.onload = r);
              ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h);
          };

          loadAndDraw();
      }
  }, [currentFrameIdx, frames, canvasSize, onionSkin]);

  useEffect(() => {
      let interval: any;
      if (isPlaying && frames.length > 1) {
          interval = setInterval(() => {
              setPreviewFrame(p => (p + 1) % frames.length);
          }, animSpeed);
      } else {
          setPreviewFrame(currentFrameIdx);
      }
      return () => clearInterval(interval);
  }, [isPlaying, frames.length, currentFrameIdx, animSpeed]);

  const updateCurrentFrame = () => {
      if (canvasRef.current) {
          const newData = canvasRef.current.toDataURL();
          const newFrames = [...frames];
          newFrames[currentFrameIdx] = newData;
          setFrames(newFrames);
          setPreviewFrame(currentFrameIdx);
      }
  };

  const performCrop = async () => {
    if (frames.length === 0) return;
    setIsLoading(true);
    saveToHistory();

    try {
        let minX = canvasSize.w, minY = canvasSize.h, maxX = 0, maxY = 0;
        let hasPixels = false;

        const frameImages: HTMLImageElement[] = [];
        for (const frameSrc of frames) {
            const img = new Image();
            img.src = frameSrc;
            await new Promise(r => img.onload = r);
            frameImages.push(img);

            const temp = document.createElement('canvas');
            temp.width = canvasSize.w;
            temp.height = canvasSize.h;
            const tCtx = temp.getContext('2d');
            if (!tCtx) continue;
            tCtx.drawImage(img, 0, 0);

            const data = tCtx.getImageData(0, 0, canvasSize.w, canvasSize.h).data;
            for (let y = 0; y < canvasSize.h; y++) {
                for (let x = 0; x < canvasSize.w; x++) {
                    const alpha = data[(y * canvasSize.w + x) * 4 + 3];
                    if (alpha > 0) {
                        hasPixels = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
        }

        if (!hasPixels) {
            setIsLoading(false);
            setShowCropDialog(false);
            return;
        }

        const padding = Math.max(0, cropBorder);
        const newW = (maxX - minX + 1) + (padding * 2);
        const newH = (maxY - minY + 1) + (padding * 2);
        const offsetX = padding - minX;
        const offsetY = padding - minY;

        const newFrames: string[] = [];
        for (const img of frameImages) {
            const temp = document.createElement('canvas');
            temp.width = newW;
            temp.height = newH;
            const tCtx = temp.getContext('2d');
            if (tCtx) {
                tCtx.imageSmoothingEnabled = false;
                tCtx.drawImage(img, offsetX, offsetY);
                newFrames.push(temp.toDataURL());
            }
        }

        setCanvasSize({ w: newW, h: newH });
        setFrames(newFrames);
        setCurrentFrameIdx(0);
        setResMode('AUTO');
    } catch (err) {
        console.error("Crop error", err);
    }

    setIsLoading(false);
    setShowCropDialog(false);
  };

  const updateStretchSize = (val: number, isWidth: boolean, isPct: boolean) => {
    const ratio = canvasSize.w / canvasSize.h;

    if (isWidth) {
      const newW = isPct ? Math.round((val / 100) * canvasSize.w) : val;
      const newWPct = isPct ? val : Math.round((val / canvasSize.w) * 100);
      setStretchWidth(newW);
      setStretchWidthPct(newWPct);

      if (keepAspectRatio) {
        const newH = Math.round(newW / ratio);
        const newHPct = Math.round((newH / canvasSize.h) * 100);
        setStretchHeight(newH);
        setStretchHeightPct(newHPct);
      }
    } else {
      const newH = isPct ? Math.round((val / 100) * canvasSize.h) : val;
      const newHPct = isPct ? val : Math.round((val / canvasSize.h) * 100);
      setStretchHeight(newH);
      setStretchHeightPct(newHPct);

      if (keepAspectRatio) {
        const newW = Math.round(newH * ratio);
        const newWPct = Math.round((newW / canvasSize.w) * 100);
        setStretchWidth(newW);
        setStretchWidthPct(newWPct);
      }
    }
  };

  const performStretch = async () => {
    if (frames.length === 0) return;
    setIsLoading(true);
    saveToHistory();

    try {
        const newW = stretchWidth;
        const newH = stretchHeight;

        const newFrames: string[] = [];
        for (const frameSrc of frames) {
            const img = new Image();
            img.src = frameSrc;
            await new Promise(r => img.onload = r);

            const temp = document.createElement('canvas');
            temp.width = newW;
            temp.height = newH;
            const tCtx = temp.getContext('2d');
            if (tCtx) {
                if (stretchQuality === 'Poor') {
                    tCtx.imageSmoothingEnabled = false;
                } else {
                    tCtx.imageSmoothingEnabled = true;
                    if (stretchQuality === 'Excellent') tCtx.imageSmoothingQuality = 'high';
                    else if (stretchQuality === 'Very Good') tCtx.imageSmoothingQuality = 'medium';
                    else tCtx.imageSmoothingQuality = 'low';
                }
                tCtx.drawImage(img, 0, 0, newW, newH);
                newFrames.push(temp.toDataURL());
            }
        }

        setCanvasSize({ w: newW, h: newH });
        setFrames(newFrames);
        setCurrentFrameIdx(0);
        setResMode('AUTO');
    } catch (err) {
        console.error("Stretch error", err);
    }

    setIsLoading(false);
    setShowStretchDialog(false);
  };

  const saveToHistory = () => {
      setHistory(prev => [...prev.slice(-19), [...frames]]);
      setRedoStack([]);
  };

  const handleUndo = () => {
      if (history.length === 0) return;
      const prevFrames = history[history.length - 1];
      setRedoStack(prev => [...prev, [...frames]]);
      setHistory(prev => prev.slice(0, -1));
      setFrames(prevFrames);
      if (currentFrameIdx >= prevFrames.length) setCurrentFrameIdx(0);
  };

  const handleRedo = () => {
      if (redoStack.length === 0) return;
      const nextFrames = redoStack[redoStack.length - 1];
      setHistory(prev => [...prev, [...frames]]);
      setRedoStack(prev => prev.slice(0, -1));
      setFrames(nextFrames);
      if (currentFrameIdx >= nextFrames.length) setCurrentFrameIdx(0);
  };

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvasSize.w;
    const scaleY = rect.height / canvasSize.h;
    return { x: Math.floor((e.clientX - rect.left) / scaleX), y: Math.floor((e.clientY - rect.top) / scaleY) };
  };

  const plotPixel = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      if (tool === 'eraser') ctx.clearRect(x, y, 1, 1);
      else if (tool === 'pencil') { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
  };

  const drawPixel = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (tool === 'picker') {
        const p = ctx.getImageData(x, y, 1, 1).data;
        if (p[3] === 0) return;
        const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6).toUpperCase();
        setColor(hex);
        setTool('pencil');
        return;
    }
    if (x >= 0 && x < canvasSize.w && y >= 0 && y < canvasSize.h) {
        if (tool === 'fill') { floodFill(x, y, color); updateCurrentFrame(); return; }

        plotPixel(ctx, x, y);

        if (symmetryX) {
            const symX = canvasSize.w - 1 - x;
            if (symX !== x) plotPixel(ctx, symX, y);
        }
    }
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const imageData = ctx.getImageData(0,0, canvasSize.w, canvasSize.h);
      const data = imageData.data;
      const startPos = (startY * canvasSize.w + startX) * 4;
      const r = data[startPos], g = data[startPos+1], b = data[startPos+2], a = data[startPos+3];

      const dummy = document.createElement('div'); dummy.style.color = fillColor; document.body.appendChild(dummy);
      const computed = window.getComputedStyle(dummy).color; document.body.removeChild(dummy);
      const [fr, fg, fb] = computed.match(/\d+/g)!.map(Number);

      if (r === fr && g === fg && b === fb && a === 255) return;
      const stack = [[startX, startY]];
      while(stack.length) {
          const [x, y] = stack.pop()!;
          const pos = (y * canvasSize.w + x) * 4;
          if (x < 0 || x >= canvasSize.w || y < 0 || y >= canvasSize.h) continue;

          const isTransparent = data[pos+3] === 0;
          const startIsTransparent = a === 0;

          let match = false;
          if (startIsTransparent) match = isTransparent;
          else match = !isTransparent && data[pos] === r && data[pos+1] === g && data[pos+2] === b;

          if (match) {
              data[pos] = fr; data[pos+1] = fg; data[pos+2] = fb; data[pos+3] = 255;
              stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
          }
      }
      ctx.putImageData(imageData, 0, 0);
  };

  const applyMagicWand = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    saveToHistory();
    const imageData = ctx.getImageData(0, 0, canvasSize.w, canvasSize.h);
    const data = imageData.data;
    const bgR = data[0], bgG = data[1], bgB = data[2], bgA = data[3];
    if (bgA === 0) return;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.abs(data[i] - bgR) < 20 && Math.abs(data[i+1] - bgG) < 20 && Math.abs(data[i+2] - bgB) < 20) data[i + 3] = 0;
    }
    ctx.putImageData(imageData, 0, 0);
    updateCurrentFrame();
  };

  const shiftFrame = (dx: number, dy: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      saveToHistory();

      const imgData = ctx.getImageData(0, 0, canvasSize.w, canvasSize.h);
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
      const tempC = document.createElement('canvas');
      tempC.width = canvasSize.w; tempC.height = canvasSize.h;
      tempC.getContext('2d')?.putImageData(imgData, 0, 0);

      ctx.drawImage(tempC, dx, dy);
      updateCurrentFrame();
  };

  const flipFrame = (axis: 'H' | 'V') => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      saveToHistory();

      const imgData = ctx.getImageData(0, 0, canvasSize.w, canvasSize.h);
      const tempC = document.createElement('canvas');
      tempC.width = canvasSize.w; tempC.height = canvasSize.h;
      tempC.getContext('2d')?.putImageData(imgData, 0, 0);

      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
      ctx.save();
      if (axis === 'H') {
          ctx.translate(canvasSize.w, 0);
          ctx.scale(-1, 1);
      } else {
          ctx.translate(0, canvasSize.h);
          ctx.scale(1, -1);
      }
      ctx.drawImage(tempC, 0, 0);
      ctx.restore();

      updateCurrentFrame();
  };

  const addFrame = () => {
      saveToHistory();
      const newFrame = frames[currentFrameIdx] || frames[0];
      const newFrames = [...frames];
      newFrames.splice(currentFrameIdx + 1, 0, newFrame);
      setFrames(newFrames);
      setCurrentFrameIdx(currentFrameIdx + 1);
  };

  const deleteFrame = (idx: number = currentFrameIdx) => {
      if (frames.length <= 1) return;
      saveToHistory();
      const newFrames = frames.filter((_, i) => i !== idx);
      setFrames(newFrames);

      if (idx === currentFrameIdx) {
          setCurrentFrameIdx(Math.max(0, currentFrameIdx - 1));
      } else if (idx < currentFrameIdx) {
          setCurrentFrameIdx(currentFrameIdx - 1);
      }
  };

  const clearAllFrames = () => {
      saveToHistory();
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasSize.w;
      tempCanvas.height = canvasSize.h;
      setFrames([tempCanvas.toDataURL()]);
      setCurrentFrameIdx(0);
  };

  const loadImageFromFile = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
              const w = img.width; const h = img.height;
              let frameW = h;
              let frameH = h;

              setResMode('AUTO');

              if (w > h && w % h === 0) {
                  frameW = h;
                  frameH = h;
              } else {
                  frameW = w;
                  frameH = h;
              }

              setCanvasSize({ w: frameW, h: frameH });

              const tempC = document.createElement('canvas');
              tempC.width = frameW;
              tempC.height = frameH;
              const tCtx = tempC.getContext('2d');

              const newFrames = [];
              const num = Math.floor(w / frameW);

              if (tCtx) {
                  tCtx.imageSmoothingEnabled = false;
                  for(let i=0; i<num; i++) {
                       tCtx.clearRect(0,0,frameW, frameH);
                       tCtx.drawImage(img, i*frameW, 0, frameW, frameH, 0, 0, frameW, frameH);
                       newFrames.push(tempC.toDataURL());
                  }
              }

              saveToHistory();
              setFrames(newFrames);
              setIsLoading(false);
          };
          img.onerror = () => {
              console.error("Failed to load image");
              setIsLoading(false);
          };
          img.src = e.target?.result as string;
      };
      reader.onerror = () => {
          console.error("Failed to read file");
          setIsLoading(false);
      };
      reader.readAsDataURL(file);
  };

  const parseGifToFrames = async (arrayBuffer: ArrayBuffer, file?: File) => {
        try {
            const buffer = new Uint8Array(arrayBuffer);
            const module = omggif as any;
            const GifReader = module.GifReader || module.default?.GifReader || module.default || module;
            if (!GifReader || typeof GifReader !== 'function') throw new Error("GIF Lib Error");
            // @ts-ignore
            const reader = new GifReader(buffer);
            const numFrames = reader.numFrames();

            setCanvasSize({ w: reader.width, h: reader.height });
            setResMode('AUTO');

            const extractedFrames: string[] = [];
            const canvas = document.createElement('canvas');
            canvas.width = reader.width;
            canvas.height = reader.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas Context Error");

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = reader.width;
            tempCanvas.height = reader.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) throw new Error("Temp Canvas Error");

            const frameBuffer = new Uint8ClampedArray(reader.width * reader.height * 4);
            const frameImageData = new ImageData(frameBuffer, reader.width, reader.height);

            let prevInfo = null;
            let savedState: ImageData | null = null;

            for (let i = 0; i < numFrames; i++) {
                const info = reader.frameInfo(i);

                if (prevInfo) {
                    if (prevInfo.disposal === 2) {
                        ctx.clearRect(prevInfo.x, prevInfo.y, prevInfo.width, prevInfo.height);
                    } else if (prevInfo.disposal === 3 && savedState) {
                        ctx.putImageData(savedState, 0, 0);
                    }
                }

                if (info.disposal === 3) {
                    savedState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                }

                frameBuffer.fill(0);
                reader.decodeAndBlitFrameRGBA(i, frameBuffer);

                tempCtx.putImageData(frameImageData, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0);

                extractedFrames.push(canvas.toDataURL('image/png'));
                prevInfo = info;
            }

            if (extractedFrames.length > 0) {
                saveToHistory(); setFrames(extractedFrames); setCurrentFrameIdx(0); setIsPlaying(true);
            }
            setIsLoading(false);
        } catch (e) {
            console.error("GIF Parsing failed", e);
            if (file) {
                loadImageFromFile(file);
            } else {
                window.alert("GIF Parse Error. Loading as static.");
                setIsLoading(false);
            }
        }
  };

  const processImport = (files: FileList | File[]) => {
      setIsLoading(true);
      const fileList = Array.from(files);

      if (fileList.length === 1) {
          const file = fileList[0];
          if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
              const reader = new FileReader();
              reader.onload = (e) => {
                  if (e.target?.result instanceof ArrayBuffer) {
                      parseGifToFrames(e.target.result, file);
                  }
              };
              reader.onerror = () => setIsLoading(false);
              reader.readAsArrayBuffer(file);
              return;
          }
          loadImageFromFile(file);
      } else {
          let processed = 0;
          const newFrames = (frames.length === 1) ? [] : [...frames];

          fileList.forEach(file => {
              const reader = new FileReader();
              reader.onload = (e) => {
                  const img = new Image();
                  img.onload = () => {
                      const tempC = document.createElement('canvas');
                      tempC.width = canvasSize.w;
                      tempC.height = canvasSize.h;
                      const tCtx = tempC.getContext('2d');
                      if (tCtx) {
                          tCtx.imageSmoothingEnabled = false;
                          tCtx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h);
                          newFrames.push(tempC.toDataURL());
                      }
                      processed++;
                      if (processed === fileList.length) {
                          setFrames(newFrames);
                          setIsLoading(false);
                      }
                  };
                  img.src = e.target?.result as string;
              };
              reader.readAsDataURL(file);
          });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processImport(e.dataTransfer.files);
      }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    updateCurrentFrame();
  };

  const handlePointerLeave = () => {
    if (isDrawing) {
        setIsDrawing(false);
        updateCurrentFrame();
    }
  };

  // ── PAPER 2D SHEET FUNCTIONS ──────────────────────────────────────────────

  const handleSheetLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setSheetInfo({ w: img.width, h: img.height });
        // Auto-guess cell size from sheet
        if (extractMode === 'grid') {
          const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
          const g = gcd(img.width, img.height);
          const guessSize = Math.min(g, 64);
          setCellW(guessSize);
          setCellH(guessSize);
        }
        if (paper2dSettings) {
          applyPaper2DTextureSettings(src, (result) => setSheetSrc(result));
        } else {
          setSheetSrc(src);
        }
        setExtractedSprites([]);
        setSelectedExtracted(new Set());
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleRunExtract = async () => {
    if (!sheetSrc) return;
    setIsExtracting(true);
    setExtractedSprites([]);
    try {
      const opts: ExtractOptions = {
        mode: extractMode,
        cellWidth: cellW,
        cellHeight: cellH,
        numCellsX,
        numCellsY,
        marginX,
        marginY,
        spacingX,
        spacingY,
        namingTemplate,
        namingStartIndex,
        outlineColor,
        bgColor,
      };
      const results = await extractSpritesFromSheet(sheetSrc, opts);
      setExtractedSprites(results);
      // Select all by default
      setSelectedExtracted(new Set(results.map((_, i) => i)));
    } catch (err) {
      console.error('Extract error', err);
    }
    setIsExtracting(false);
  };

  // Update preview canvas whenever sheet/bounds change
  useEffect(() => {
    if (!sheetSrc || !previewCanvasRef.current || extractedSprites.length === 0) return;
    const bounds = extractedSprites.map(s => ({ x: s.x, y: s.y, w: s.width, h: s.height }));
    drawSheetPreview(previewCanvasRef.current, sheetSrc, bounds, outlineColor, bgColor, Math.max(1, Math.min(sheetScale, 8)));
  }, [extractedSprites, sheetSrc, outlineColor, bgColor, sheetScale]);

  const handleImportSelected = () => {
    const toImport = extractedSprites
      .filter((_, i) => selectedExtracted.has(i))
      .map(s => ({ name: s.name, src: s.dataURL }));
    if (toImport.length === 0) return;

    if (onImportFrames) {
      // Multi-sprite mode: create new sprites in the project
      onImportFrames(toImport);
    } else {
      // Single-sprite mode: load selected as frames in this editor
      saveToHistory();
      const newFrames = toImport.map(s => s.src);
      if (newFrames.length > 0) {
        const img = new Image();
        img.onload = () => {
          setCanvasSize({ w: img.width, h: img.height });
          setFrames(newFrames);
          setCurrentFrameIdx(0);
          setActiveTab('draw');
        };
        img.src = newFrames[0];
      }
    }
  };

  const handleImportAsStrip = () => {
    const toImport = extractedSprites.filter((_, i) => selectedExtracted.has(i));
    if (toImport.length === 0) return;
    saveToHistory();
    const newFrames = toImport.map(s => s.dataURL);
    const img = new Image();
    img.onload = () => {
      setCanvasSize({ w: img.width, h: img.height });
      setFrames(newFrames);
      setCurrentFrameIdx(0);
      setActiveTab('draw');
    };
    img.src = newFrames[0];
  };

  const toggleSelectAll = () => {
    if (selectedExtracted.size === extractedSprites.length) {
      setSelectedExtracted(new Set());
    } else {
      setSelectedExtracted(new Set(extractedSprites.map((_, i) => i)));
    }
  };

  // ── 3D VIEWPORT INIT ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== '3d') return;
    let animId = 0;
    const init3D = async () => {
      if (!viewport3dRef.current) return;
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      const container = viewport3dRef.current;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 300;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      threeSceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(60, w / h, 0.01, 2000);
      camera.position.set(2, 2, 3);
      threeCameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      threeRendererRef.current = renderer;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      threeControlsRef.current = controls;

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xffffff, 1.2);
      sun.position.set(5, 10, 5);
      sun.castShadow = true;
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
      fill.position.set(-5, -2, -5);
      scene.add(fill);

      // Grid
      const grid = new THREE.GridHelper(10, 20, 0x444466, 0x333355);
      grid.name = 'grid_helper';
      scene.add(grid);

      // Clock for animations
      const { Clock } = THREE;
      clockRef.current = new Clock();

      // If model already loaded, re-add it
      if (threeModelRef.current) {
        scene.add(threeModelRef.current);
      }

      // Animate
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const delta = clockRef.current?.getDelta() || 0;
        mixerRef.current?.update(delta);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
      threeFrameRef.current = animId;

      // Resize
      const onResize = () => {
        if (!container || !renderer || !camera) return;
        const nw = container.clientWidth || 400;
        const nh = container.clientHeight || 300;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animId);
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      };
    };

    const cleanup = init3D();
    return () => { cleanup.then(fn => fn && fn()); };
  }, [activeTab]);

  // Toggle wireframe
  useEffect(() => {
    if (!threeModelRef.current) return;
    threeModelRef.current.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m: any) => { m.wireframe = show3dWireframe; });
      }
    });
  }, [show3dWireframe]);

  // Toggle grid
  useEffect(() => {
    if (!threeSceneRef.current) return;
    threeSceneRef.current.traverse((obj: any) => {
      if (obj.name === 'grid_helper') obj.visible = show3dGrid;
    });
  }, [show3dGrid]);

  // Play animation
  useEffect(() => {
    if (!mixerRef.current || !threeModelRef.current) return;
    const gltfAnims = threeModelRef.current.userData?.animations || [];
    if (!gltfAnims.length) return;
    mixerRef.current.stopAllAction();
    const clip = gltfAnims.find((a: any) => a.name === activeAnimation);
    if (clip) {
      const THREE_module = threeModelRef.current.userData?._THREE;
      if (THREE_module) {
        const { AnimationMixer } = THREE_module;
        mixerRef.current = new AnimationMixer(threeModelRef.current);
      }
      mixerRef.current.clipAction(clip).play();
    }
  }, [activeAnimation]);

  const fileToDataURI = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });

  const load3DModelFromUrl = async (url: string, name: string, ext: 'glb' | 'gltf' | 'obj', persistedDataUri?: string) => {
    setModel3dStatus('جاري التحميل...');
    setModel3dName(name);
    setModel3dType(ext);
    if (model3dUrl && model3dUrl !== url) URL.revokeObjectURL(model3dUrl);
    setModel3dUrl(url);

    const scene = threeSceneRef.current;
    if (!scene) { setModel3dStatus('⚠ افتح تبويب 3D أولاً'); return; }

    try {
      const THREE = await import('three');

      // Remove old model
      if (threeModelRef.current) {
        scene.remove(threeModelRef.current);
        threeModelRef.current = null;
      }

      let root: any;
      let animations: any[] = [];

      if (ext === 'glb' || ext === 'gltf') {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
        const loader = new GLTFLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        loader.setDRACOLoader(draco);
        const gltf = await new Promise<any>((res, rej) => loader.load(url, res, undefined, rej));
        root = gltf.scene;
        animations = gltf.animations || [];
      } else if (ext === 'obj') {
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
        const loader = new OBJLoader();
        root = await new Promise<any>((res, rej) => loader.load(url, res, undefined, rej));
      } else {
        setModel3dStatus('❌ صيغة غير مدعومة');
        return;
      }

      // Auto-center & scale
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 2 / maxDim : 1;
      root.position.sub(center.multiplyScalar(scale));
      root.scale.setScalar(scale);

      root.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Store animations ref
      root.userData.animations = animations;

      scene.add(root);
      threeModelRef.current = root;

      // Animations
      if (animations.length > 0) {
        const { AnimationMixer } = THREE;
        mixerRef.current = new AnimationMixer(root);
        const names = animations.map((a: any) => a.name);
        setModel3dAnimations(names);
        setActiveAnimation(names[0]);
        mixerRef.current.clipAction(animations[0]).play();
      } else {
        setModel3dAnimations([]);
        setActiveAnimation('');
        mixerRef.current = null;
      }

      setModel3dStatus(`✅ ${name} (${ext.toUpperCase()})`);

      // Persist on the sprite asset so it survives save/reload.
      if (onModel3DChange && persistedDataUri) {
        onModel3DChange({
          name,
          format: ext,
          data: persistedDataUri,
          activeAnimation: animations[0]?.name,
          animationNames: animations.map((a: any) => a.name),
        });
      }
    } catch (err: any) {
      setModel3dStatus(`❌ ${err.message || 'فشل التحميل'}`);
    }
  };

  const load3DModel = async (file: File) => {
    const ext = (file.name.split('.').pop()?.toLowerCase() || '') as 'glb' | 'gltf' | 'obj';
    if (!['glb','gltf','obj'].includes(ext)) {
      setModel3dStatus('❌ صيغة غير مدعومة');
      return;
    }
    // Build a data URI so we can persist the model bytes on the sprite.
    const dataUri = await fileToDataURI(file);
    await load3DModelFromUrl(dataUri, file.name, ext, dataUri);
  };

  // Restore previously-attached 3D model (e.g. when reopening a sprite from a
  // .pnor project). Waits for the 3D scene to be ready.
  useEffect(() => {
    if (!initialModel3D) return;
    if (activeTab !== '3d') return;
    if (!threeSceneRef.current) return;
    if (model3dName === initialModel3D.name && threeModelRef.current) return;
    load3DModelFromUrl(
      initialModel3D.data,
      initialModel3D.name,
      initialModel3D.format,
      initialModel3D.data,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, initialModel3D?.name, initialModel3D?.data]);

  const export3DModel = async (format: 'glb' | 'gltf' | 'obj' | 'stl') => {
    const scene = threeSceneRef.current;
    const model = threeModelRef.current;
    if (!scene) return;

    try {
      if (format === 'glb' || format === 'gltf') {
        const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
        const exp = new GLTFExporter();
        const binary = format === 'glb';
        exp.parse(
          model || scene,
          (result: any) => {
            const blob = result instanceof ArrayBuffer
              ? new Blob([result], { type: 'model/gltf-binary' })
              : new Blob([JSON.stringify(result, null, 2)], { type: 'model/gltf+json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${model3dName.replace(/\.[^.]+$/, '') || 'model'}.${format}`;
            a.click();
          },
          (err: any) => console.error(err),
          { binary }
        );
      } else if (format === 'stl') {
        const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
        const exp = new STLExporter();
        const str = exp.parse(model || scene, { binary: false });
        const blob = new Blob([str], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${model3dName.replace(/\.[^.]+$/, '') || 'model'}.stl`;
        a.click();
      } else if (format === 'obj') {
        const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js');
        const exp = new OBJExporter();
        const str = exp.parse(model || scene);
        const blob = new Blob([str], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${model3dName.replace(/\.[^.]+$/, '') || 'model'}.obj`;
        a.click();
      }
    } catch (err: any) {
      window.alert('Export error: ' + err.message);
    }
  };

  const exportModelAsSprite = async () => {
    const renderer = threeRendererRef.current;
    const scene = threeSceneRef.current;
    const camera = threeCameraRef.current;
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    onSave(dataUrl, renderer.domElement.width, renderer.domElement.height);
    setIsSaved(true);
    setModel3dStatus('✅ تم التصدير كسبرايت!');
  };

  const renderModel3DTab = () => (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      onDragOver={e => { e.preventDefault(); setModel3dDragging(true); }}
      onDragLeave={() => setModel3dDragging(false)}
      onDrop={e => {
        e.preventDefault(); e.stopPropagation();
        setModel3dDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) load3DModel(file);
      }}
    >
      {/* Top toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center border-b border-win-shadow pb-2 px-2 pt-2 bg-win-face shrink-0">
        {/* Import */}
        <button
          onClick={() => model3dInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1 bg-win-face border border-win-highlight shadow-win-out text-[10px] font-pixel hover:bg-win-highlight active:shadow-win-in"
          title="استيراد نموذج 3D"
        >
          <Upload size={12} className="text-blue-500"/> Import 3D
        </button>
        <input
          ref={model3dInputRef}
          type="file"
          className="hidden"
          accept=".glb,.gltf,.obj,.fbx"
          onChange={e => { if (e.target.files?.[0]) load3DModel(e.target.files[0]); e.target.value = ''; }}
        />

        {/* Export group */}
        {threeModelRef.current && <>
          <div className="w-px h-4 bg-win-shadow/40 mx-0.5"/>
          <span className="text-[9px] font-pixel text-gray-500">Export:</span>
          {(['glb', 'gltf', 'obj', 'stl'] as const).map(fmt => (
            <button key={fmt}
              onClick={() => export3DModel(fmt)}
              className="flex items-center gap-0.5 px-2 py-1 bg-win-face border border-win-highlight shadow-win-out text-[10px] font-pixel hover:bg-win-highlight active:shadow-win-in uppercase"
            >
              <Download size={10} className="text-green-600"/> {fmt}
            </button>
          ))}
          <div className="w-px h-4 bg-win-shadow/40 mx-0.5"/>
          <button
            onClick={exportModelAsSprite}
            className="flex items-center gap-1 px-2 py-1 bg-win-blue text-white border border-win-blue shadow-win-out text-[10px] font-pixel hover:opacity-90 active:shadow-win-in"
            title="تصدير كسبرايت PNG"
          >
            <ImageIcon size={10}/> → Sprite
          </button>
        </>}

        {/* View toggles */}
        <div className="w-px h-4 bg-win-shadow/40 mx-0.5"/>
        <button onClick={() => setShow3dWireframe(v => !v)}
          className={`flex items-center gap-1 px-2 py-1 border text-[10px] font-pixel ${show3dWireframe ? 'bg-win-select text-white border-win-darkshadow shadow-win-in' : 'bg-win-face border-win-highlight shadow-win-out hover:bg-win-highlight'}`}
          title="Wireframe"
        ><Eye size={10}/> Wire</button>
        <button onClick={() => setShow3dGrid(v => !v)}
          className={`flex items-center gap-1 px-2 py-1 border text-[10px] font-pixel ${show3dGrid ? 'bg-win-select text-white border-win-darkshadow shadow-win-in' : 'bg-win-face border-win-highlight shadow-win-out hover:bg-win-highlight'}`}
          title="Grid"
        ><Grid size={10}/> Grid</button>

        {/* Animations */}
        {model3dAnimations.length > 0 && <>
          <div className="w-px h-4 bg-win-shadow/40 mx-0.5"/>
          <span className="text-[9px] font-pixel text-gray-500">Anim:</span>
          <select
            value={activeAnimation}
            onChange={e => setActiveAnimation(e.target.value)}
            className="text-[10px] bg-white border border-win-darkshadow px-1 py-0.5 outline-none font-pixel"
          >
            {model3dAnimations.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </>}

        {/* Status */}
        {model3dStatus && (
          <span className="ml-auto text-[9px] font-mono text-gray-500 truncate max-w-[200px]">{model3dStatus}</span>
        )}
      </div>

      {/* Viewport */}
      <div className="flex-1 relative overflow-hidden">
        {/* Drop overlay */}
        {model3dDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-win-blue/20 border-4 border-dashed border-win-blue pointer-events-none">
            <Box size={48} className="text-win-blue opacity-60 mb-2"/>
            <span className="text-win-blue text-[12px] font-pixel font-bold">أفلت النموذج هنا</span>
            <span className="text-[10px] font-pixel text-win-blue/70 mt-1">GLB · GLTF · OBJ · FBX</span>
          </div>
        )}

        {/* Empty state */}
        {!model3dUrl && !model3dDragging && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer"
            onClick={() => model3dInputRef.current?.click()}
          >
            <Box size={56} className="opacity-20 text-win-blue"/>
            <span className="text-[11px] font-pixel text-gray-400">اسحب نموذج 3D أو اضغط للاستيراد</span>
            <span className="text-[9px] font-pixel text-gray-300">GLB · GLTF · OBJ · FBX</span>
            <div className="mt-2 flex gap-2 text-[9px] font-pixel text-gray-400">
              <span className="px-2 py-0.5 border border-gray-300 rounded">GLB ✓</span>
              <span className="px-2 py-0.5 border border-gray-300 rounded">GLTF ✓</span>
              <span className="px-2 py-0.5 border border-gray-300 rounded">OBJ ✓</span>
            </div>
          </div>
        )}

        {/* Three.js canvas mounts here */}
        <div ref={viewport3dRef} className="w-full h-full"/>
      </div>

      {/* Bottom info bar */}
      {model3dName && (
        <div className="shrink-0 flex items-center gap-3 px-2 py-1 bg-win-workspace border-t border-win-shadow text-[9px] font-mono text-gray-400">
          <Box size={10} className="text-blue-400"/>
          <span className="truncate">{model3dName}</span>
          {model3dType && <span className="px-1.5 py-0.5 bg-blue-900/20 text-blue-400 rounded uppercase">{model3dType}</span>}
          {model3dAnimations.length > 0 && <span className="text-purple-400">{model3dAnimations.length} animations</span>}
          <span className="ml-auto opacity-60">Orbit: drag · Zoom: scroll · Pan: right-drag</span>
        </div>
      )}
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────

  const renderSheetTab = () => (
    <div className="flex flex-col h-full w-full overflow-y-auto p-2 gap-3 bg-win-face text-win-text">
      <input type="file" ref={sheetInputRef} className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleSheetLoad(e.target.files[0]); e.target.value = ''; }} />

      {/* ── TOP BAR ── */}
      <div className="flex flex-wrap gap-2 items-center border-b border-win-shadow pb-2">
        <button
          onClick={() => sheetInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1 bg-win-face border border-win-highlight shadow-win-out text-[10px] font-pixel hover:bg-win-highlight active:shadow-win-in"
        >
          <Upload size={12}/> Load Sheet
        </button>
        <label className="flex items-center gap-1 text-[10px] font-pixel cursor-pointer select-none">
          <input type="checkbox" checked={paper2dSettings} onChange={e => setPaper2dSettings(e.target.checked)} className="w-3 h-3"/>
          Apply Paper 2D Texture Settings
        </label>
        {sheetInfo && (
          <span className="text-[9px] text-gray-500 ml-auto font-mono">{sheetInfo.w}×{sheetInfo.h}px</span>
        )}
      </div>

      {!sheetSrc ? (
        <div
          className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-win-shadow rounded text-gray-400 text-[10px] font-pixel gap-2 min-h-[200px] cursor-pointer hover:border-win-select hover:text-win-select transition-colors"
          onClick={() => sheetInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleSheetLoad(e.dataTransfer.files[0]); }}
        >
          <Layers size={32} className="opacity-40"/>
          <span>Drop Sprite Sheet here or click to load</span>
          <span className="text-[9px] opacity-60">PNG / GIF / JPG</span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-3 flex-1">

          {/* ── LEFT: SETTINGS PANEL ── */}
          <div className="flex flex-col gap-2 w-full lg:w-[200px] shrink-0">
            {/* Extract Mode */}
            <div className="bg-win-face border border-win-highlight shadow-win-out p-2">
              <div className="text-[9px] font-bold text-win-blue mb-1 font-pixel uppercase tracking-wide">Sprite Extract Mode</div>
              <div className="flex gap-1">
                {(['auto', 'grid'] as const).map(m => (
                  <button key={m} onClick={() => setExtractMode(m)}
                    className={`flex-1 py-1 text-[9px] font-pixel border ${extractMode === m ? 'bg-win-select text-white border-win-darkshadow shadow-win-in' : 'bg-win-face border-win-highlight shadow-win-out hover:bg-win-highlight'}`}>
                    {m === 'auto' ? '🔍 Auto' : '⊞ Grid'}
                  </button>
                ))}
              </div>
              <div className="text-[8px] text-gray-500 mt-1">
                {extractMode === 'auto' ? 'Detects sprites via transparent background (alpha)' : 'Divides sheet into uniform cells'}
              </div>
            </div>

            {/* Grid Settings */}
            {extractMode === 'grid' && (
              <div className="bg-win-face border border-win-highlight shadow-win-out p-2 flex flex-col gap-1">
                <div className="text-[9px] font-bold text-win-blue mb-1 font-pixel uppercase tracking-wide">Grid Settings</div>
                {[
                  { label: 'Cell Width (px)', val: cellW, set: setCellW },
                  { label: 'Cell Height (px)', val: cellH, set: setCellH },
                  { label: 'Margin X', val: marginX, set: setMarginX },
                  { label: 'Margin Y', val: marginY, set: setMarginY },
                  { label: 'Spacing X', val: spacingX, set: setSpacingX },
                  { label: 'Spacing Y', val: spacingY, set: setSpacingY },
                  { label: 'Num Cells X (0=∞)', val: numCellsX, set: setNumCellsX },
                  { label: 'Num Cells Y (0=∞)', val: numCellsY, set: setNumCellsY },
                ].map(({ label, val, set }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="text-[8px] text-gray-600 flex-1 truncate">{label}</span>
                    <input type="number" min={0} value={val} onChange={e => set(Number(e.target.value))}
                      className="w-14 text-[9px] border border-win-darkshadow shadow-win-in bg-white text-black px-1 py-0.5 text-right"/>
                  </div>
                ))}
              </div>
            )}

            {/* Naming */}
            <div className="bg-win-face border border-win-highlight shadow-win-out p-2 flex flex-col gap-1">
              <div className="text-[9px] font-bold text-win-blue mb-1 font-pixel uppercase tracking-wide">Naming Template</div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-gray-600">Template</span>
                <input value={namingTemplate} onChange={e => setNamingTemplate(e.target.value)}
                  className="flex-1 text-[9px] border border-win-darkshadow shadow-win-in bg-white text-black px-1 py-0.5"/>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-gray-600">Start Index</span>
                <input type="number" min={0} value={namingStartIndex} onChange={e => setNamingStartIndex(Number(e.target.value))}
                  className="w-14 text-[9px] border border-win-darkshadow shadow-win-in bg-white text-black px-1 py-0.5 text-right ml-auto"/>
              </div>
              <div className="text-[8px] text-gray-500 bg-gray-50 border p-1 mt-1">
                Preview: {namingTemplate.replace('{0}', String(namingStartIndex))}
              </div>
            </div>

            {/* Visual */}
            <div className="bg-win-face border border-win-highlight shadow-win-out p-2 flex flex-col gap-1">
              <div className="text-[9px] font-bold text-win-blue mb-1 font-pixel uppercase tracking-wide">Preview</div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-gray-600">Outline</span>
                <input type="color" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} className="w-8 h-5 border border-win-darkshadow cursor-pointer ml-auto"/>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-gray-600">Background</span>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-5 border border-win-darkshadow cursor-pointer ml-auto"/>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-gray-600">Scale</span>
                <select value={sheetScale} onChange={e => setSheetScale(Number(e.target.value))} className="flex-1 text-[9px] border border-win-darkshadow bg-white text-black px-1 py-0.5 ml-auto">
                  {[1,2,3,4,6,8].map(s => <option key={s} value={s}>{s}×</option>)}
                </select>
              </div>
            </div>

            {/* Extract Button */}
            <button
              onClick={handleRunExtract}
              disabled={isExtracting}
              className="w-full py-2 bg-win-blue text-white text-[10px] font-pixel font-bold border border-win-darkshadow shadow-win-out hover:opacity-90 active:shadow-win-in disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isExtracting ? <><RotateCcw size={12} className="animate-spin"/> Extracting...</> : <><Scissors size={12}/> Extract Sprites</>}
            </button>
          </div>

          {/* ── RIGHT: PREVIEW + RESULTS ── */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">

            {/* Sheet Preview Canvas */}
            {sheetSrc && (
              <div className="bg-win-workspace border border-win-darkshadow shadow-win-in p-1 overflow-auto" style={{ maxHeight: '300px' }}>
                {extractedSprites.length > 0 ? (
                  <canvas ref={previewCanvasRef} className="image-render-pixel" style={{ display: 'block' }}/>
                ) : (
                  <img src={sheetSrc || undefined} className="image-render-pixel max-w-full" style={{ imageRendering: 'pixelated' }} alt="sheet"/>
                )}
              </div>
            )}

            {/* Results */}
            {extractedSprites.length > 0 && (
              <div className="flex flex-col gap-2">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 items-center text-[9px] font-pixel">
                  <span className="font-bold text-win-blue">{extractedSprites.length} sprites found</span>
                  <button onClick={toggleSelectAll} className="px-2 py-0.5 bg-win-face border border-win-highlight shadow-win-out hover:bg-win-highlight text-[9px]">
                    {selectedExtracted.size === extractedSprites.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-gray-500 ml-1">{selectedExtracted.size} selected</span>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={handleImportAsStrip}
                      disabled={selectedExtracted.size === 0}
                      className="px-2 py-1 bg-win-face border border-win-highlight shadow-win-out hover:bg-win-highlight text-[9px] disabled:opacity-40 flex items-center gap-1"
                      title="Import selected as animation frames in this sprite"
                    >
                      <Layers size={10}/> As Frames
                    </button>
                    {onImportFrames && (
                      <button
                        onClick={handleImportSelected}
                        disabled={selectedExtracted.size === 0}
                        className="px-2 py-1 bg-win-select text-white border border-win-darkshadow shadow-win-out hover:opacity-90 text-[9px] disabled:opacity-40 flex items-center gap-1"
                        title="Import selected as separate sprite assets"
                      >
                        <Plus size={10}/> Import as Sprites ({selectedExtracted.size})
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid of extracted sprites */}
                <div className="grid gap-1 bg-win-workspace border border-win-darkshadow shadow-win-in p-1 overflow-y-auto" style={{ maxHeight: '260px', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))' }}>
                  {extractedSprites.map((spr, i) => {
                    const sel = selectedExtracted.has(i);
                    return (
                      <div key={i}
                        onClick={() => setSelectedExtracted(prev => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i); else next.add(i);
                          return next;
                        })}
                        className={`flex flex-col items-center gap-0.5 p-1 cursor-pointer border-2 rounded-sm transition-colors ${sel ? 'border-win-select bg-blue-900/20' : 'border-transparent hover:border-win-highlight'}`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVQYlWP4////fwAAAABJRU5ErkJggg==')] bg-repeat border border-win-shadow">
                          <img src={spr.dataURL || undefined} className="max-w-full max-h-full image-render-pixel" style={{ imageRendering: 'pixelated' }} alt={spr.name}/>
                        </div>
                        <span className="text-[7px] text-center truncate w-full text-win-text font-pixel leading-tight">{spr.name}</span>
                        <span className="text-[7px] text-gray-500">{spr.width}×{spr.height}</span>
                        {sel && <Check size={8} className="text-win-select"/>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full bg-win-face text-win-text select-none overflow-hidden" onDragOver={e=>e.preventDefault()} onDrop={handleDrop}>
        {/* --- TABS NAVIGATION --- */}
        <div className="flex bg-win-face border-b border-win-shadow px-2 pt-1 gap-1 shrink-0">
            <button
                onClick={() => setActiveTab('draw')}
                className={`px-4 py-1.5 text-[10px] font-pixel border-t border-l border-r rounded-t-sm transition-colors ${activeTab === 'draw' ? 'bg-win-face border-win-highlight border-b-win-face -mb-px z-10 shadow-[0_-1px_0_white]' : 'bg-win-shadow/20 border-transparent hover:bg-win-shadow/40 opacity-70'}`}
            >
                🎨 Draw / Edit
            </button>
            <button
                onClick={() => setActiveTab('sheet')}
                className={`px-4 py-1.5 text-[10px] font-pixel border-t border-l border-r rounded-t-sm transition-colors ${activeTab === 'sheet' ? 'bg-win-face border-win-highlight border-b-win-face -mb-px z-10 shadow-[0_-1px_0_white]' : 'bg-win-shadow/20 border-transparent hover:bg-win-shadow/40 opacity-70'}`}
            >
                ⊞ Sheet Import
            </button>
            <button
                onClick={() => setActiveTab('3d')}
                className={`px-4 py-1.5 text-[10px] font-pixel border-t border-l border-r rounded-t-sm transition-colors flex items-center gap-1 ${activeTab === '3d' ? 'bg-win-face border-win-highlight border-b-win-face -mb-px z-10 shadow-[0_-1px_0_white]' : 'bg-win-shadow/20 border-transparent hover:bg-win-shadow/40 opacity-70'}`}
            >
                <Box size={11}/> 3D Asset
            </button>

            {/* Save Status (Right Aligned) */}
            <div className="ml-auto flex items-center gap-3 pr-2">
                <div className="flex items-center gap-1 h-6 text-[9px] font-mono">
                    {isSaved ? <span className="flex items-center gap-1 text-green-600"><Check size={10}/> Saved</span> : <span className="text-orange-500 animate-pulse">Unsaved...</span>}
                </div>
                <button
                  onClick={forceSave}
                  className="px-2 py-0.5 bg-win-face border border-win-highlight shadow-win-out text-[9px] hover:bg-win-highlight active:shadow-win-in font-pixel uppercase"
                >
                  Save Sprite
                </button>
            </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden relative">
            {activeTab === 'sheet' ? (
                renderSheetTab()
            ) : activeTab === '3d' ? (
                renderModel3DTab()
            ) : (
                <div className="flex flex-col lg:flex-row w-full h-full p-2 gap-4 overflow-y-auto items-center lg:items-start justify-center">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={(e) => e.target.files && processImport(e.target.files)} />

                    {/* LEFT COLUMN: TOOLS */}
                    <div className="flex flex-col gap-2 shrink-0">
                        {/* Painting Tools */}
                        <div className="grid grid-cols-2 gap-1 bg-win-face p-1 rounded border border-win-highlight shadow-win-out">
                            <ToolButton active={tool === 'pencil'} onClick={() => setTool('pencil')} title="Pencil (B)"><Pencil size={16}/></ToolButton>
                            <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Eraser (E)"><Eraser size={16}/></ToolButton>
                            <ToolButton active={tool === 'fill'} onClick={() => setTool('fill')} title="Fill Bucket (F)"><PaintBucket size={16}/></ToolButton>
                            <ToolButton active={tool === 'picker'} onClick={() => setTool('picker')} title="Color Picker (I)"><Pipette size={16}/></ToolButton>

                            <div className="col-span-2 w-full h-px bg-win-shadow/30 my-0.5"></div>

                            <ToolButton active={symmetryX} onClick={() => setSymmetryX(!symmetryX)} title="Symmetry X (Mirror)"><SplitSquareHorizontal size={16}/></ToolButton>
                            <ToolButton onClick={applyMagicWand} title="Remove Background (Alpha)"><Wand2 size={16} className="text-purple-600"/></ToolButton>

                            <div className="col-span-2 w-full h-px bg-win-shadow/30 my-0.5"></div>

                            <ToolButton onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={history.length === 0}><Undo2 size={16}/></ToolButton>
                            <ToolButton onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={redoStack.length === 0}><Redo2 size={16}/></ToolButton>
                        </div>

                        {/* Transform Tools */}
                        <div className="flex flex-col gap-1 bg-win-face p-1 rounded border border-win-highlight shadow-win-out">
                            <div className="flex gap-1 justify-center">
                               <ToolButton onClick={() => shiftFrame(0, -1)} title="Shift Up"><ArrowUp size={14}/></ToolButton>
                            </div>
                            <div className="flex gap-1 justify-center">
                               <ToolButton onClick={() => shiftFrame(-1, 0)} title="Shift Left"><ArrowLeft size={14}/></ToolButton>
                               <div className="w-7 h-7 flex items-center justify-center"><Move size={14} className="opacity-30"/></div>
                               <ToolButton onClick={() => shiftFrame(1, 0)} title="Shift Right"><ArrowRight size={14}/></ToolButton>
                            </div>
                            <div className="flex gap-1 justify-center">
                               <ToolButton onClick={() => shiftFrame(0, 1)} title="Shift Down"><ArrowDown size={14}/></ToolButton>
                            </div>
                            <div className="w-full h-px bg-win-shadow/30 my-1"></div>

                            <div className="flex flex-col gap-1 px-1">
                                <span className="text-[8px] font-pixel text-win-blue uppercase opacity-70 mb-1">Transform</span>
                                <div className="flex gap-1 justify-center mb-1">
                                    <ToolButton onClick={() => flipFrame('H')} title="Flip Horizontal"><FlipHorizontal size={14}/></ToolButton>
                                    <ToolButton onClick={() => flipFrame('V')} title="Flip Vertical"><FlipVertical size={14}/></ToolButton>
                                </div>

                                <div className="w-full h-px bg-win-shadow/30 my-1"></div>
                                <span className="text-[8px] font-pixel text-win-blue uppercase opacity-70 mb-1">Resize Tools</span>

                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => setShowCropDialog(true)}
                                        className="flex items-center gap-2 px-2 py-1.5 bg-win-face border border-win-highlight shadow-win-out text-[9px] font-pixel hover:bg-win-highlight active:shadow-win-in text-win-text"
                                        title="Crop Empty Borders"
                                    >
                                        <Scissors size={12} className="shrink-0"/> CROP & TRIM
                                    </button>

                                    <button
                                        onClick={() => {
                                            setStretchWidth(canvasSize.w);
                                            setStretchHeight(canvasSize.h);
                                            setStretchWidthPct(100);
                                            setStretchHeightPct(100);
                                            setShowStretchDialog(true);
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 bg-win-face border border-win-highlight shadow-win-out text-[9px] font-pixel hover:bg-win-highlight active:shadow-win-in text-win-text"
                                        title="Stretch Images"
                                    >
                                        <Maximize size={12} className="shrink-0"/> STRETCH SIZ
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Role Select (if provided) */}
                        {!isBackground && onRoleChange && (
                            <div className="bg-win-face p-1.5 border border-win-highlight shadow-win-out rounded flex flex-col gap-1">
                                <span className="text-[9px] text-win-blue font-pixel uppercase tracking-tighter">Object Role</span>
                                <select
                                    value={role || 'decoration'}
                                    onChange={(e) => onRoleChange(e.target.value)}
                                    className="w-full text-[10px] bg-white border border-win-darkshadow p-0.5 outline-none font-pixel"
                                    title="Object Role"
                                >
                                    <option value="player">Player</option>
                                    <option value="ground">Ground</option>
                                    <option value="enemy">Enemy</option>
                                    <option value="item">Item</option>
                                    <option value="decoration">Decor</option>
                                    <option value="bullet">Bullet</option>
                                </select>
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-win-face p-2 border border-win-highlight shadow-win-out rounded hover:bg-win-highlight flex items-center justify-center gap-2 text-[10px] font-pixel"
                        >
                            <Upload size={14}/> Import Image
                        </button>
                    </div>

                    {/* MIDDLE COLUMN: CANVAS */}
                    <div className="flex flex-col gap-3 items-center min-w-0">
                        <div className="relative border-4 border-win-shadow shadow-win-in bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVQYlWP4////fwAAAABJRU5ErkJggg==')] bg-repeat shrink-0 overflow-auto max-w-full max-h-[70vh]">
                            <canvas
                                ref={canvasRef}
                                width={canvasSize.w}
                                height={canvasSize.h}
                                className="image-render-pixel cursor-crosshair touch-none relative z-10"
                                style={{ width: canvasSize.w * (isBackground ? 1 : (canvasSize.w > 32 ? 4 : 16)), height: canvasSize.h * (isBackground ? 1 : (canvasSize.h > 32 ? 4 : 16)), touchAction: 'none' }}
                                onPointerDown={(e) => { e.preventDefault(); setIsDrawing(true); saveToHistory(); const p = getPos(e); drawPixel(p.x, p.y); }}
                                onPointerMove={(e) => { e.preventDefault(); if(isDrawing && tool !== 'fill') { const p = getPos(e); drawPixel(p.x, p.y); } }}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerLeave}
                            />
                            {isLoading && <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center text-white text-[10px] font-pixel animate-pulse">Processing...</div>}
                            {symmetryX && <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-400/50 pointer-events-none z-20 shadow-[0_0_2px_cyan]"></div>}
                        </div>

                        {/* Frame Timeline */}
                        <div className="flex flex-col gap-2 w-full max-w-[400px]">
                            <div className="flex items-center gap-1 bg-win-workspace p-1 rounded border border-win-darkshadow shadow-win-in overflow-x-auto min-h-[50px]">
                                {frames.map((f, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setCurrentFrameIdx(i)}
                                        className={`w-10 h-10 border-2 shrink-0 cursor-pointer bg-white image-render-pixel relative flex items-center justify-center transition-all ${currentFrameIdx === i ? 'border-win-select ring-1 ring-win-select scale-105 z-10' : 'border-win-shadow hover:border-win-highlight opacity-80'}`}
                                    >
                                        <img src={f || undefined} className="max-w-full max-h-full" alt={`f${i}`}/>
                                        <span className={`absolute bottom-0 right-0 text-[7px] px-1 leading-none ${currentFrameIdx === i ? 'bg-win-select text-white' : 'bg-black/50 text-white'}`}>{i+1}</span>
                                        {frames.length > 1 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteFrame(i); }}
                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-700 shadow-sm z-20 font-bold border border-white"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addFrame} className="w-10 h-10 flex flex-col items-center justify-center bg-win-face hover:bg-win-highlight border-2 border-dashed border-win-shadow text-win-text shrink-0 text-[10px] font-pixel"><Plus size={14}/><span className="text-[7px]">Add</span></button>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-pixel text-win-text px-1">
                                <span className="text-win-blue">Frame: {currentFrameIdx + 1}/{frames.length}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setOnionSkin(!onionSkin)}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${onionSkin ? 'bg-purple-600 text-white border-purple-800 shadow-win-in' : 'bg-win-face border-win-highlight shadow-win-out text-gray-500 hover:text-win-text'}`}
                                        title="Show ghost of previous frame"
                                    >
                                        <Ghost size={12}/> Onion: {onionSkin ? 'ON' : 'OFF'}
                                    </button>
                                    <button onClick={() => deleteFrame()} className="px-2 py-0.5 text-red-600 hover:bg-red-50 rounded border border-transparent flex items-center gap-1"><Trash2 size={12}/> Del</button>
                                    <button onClick={clearAllFrames} className="px-2 py-0.5 text-red-800 hover:bg-red-100 rounded border border-transparent flex items-center gap-1"><Eraser size={12}/> Reset</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SETTINGS & PREVIEW */}
                    <div className="flex flex-col gap-4 w-full lg:w-[220px] shrink-0">
                         {/* Size & Grid */}
                         <div className="bg-win-face p-2 rounded border border-win-highlight shadow-win-window">
                             <div className="text-[10px] font-pixel font-bold mb-1 text-win-blue uppercase tracking-wide">Canvas Settings</div>
                             <select
                                className="w-full text-[10px] font-pixel border border-win-darkshadow p-1 mb-2 bg-white"
                                value={resMode}
                                onChange={(e) => handleResolutionChange(e.target.value as any)}
                                title="Resolution Mode"
                             >
                                 <option value="AUTO">Custom ({canvasSize.w}x{canvasSize.h})</option>
                                 {Object.entries(RES_PRESETS).map(([key, val]) => (
                                     <option key={key} value={key}>{val.label}</option>
                                 ))}
                             </select>
                             <div className="flex items-center gap-2 justify-center py-1 border-t border-win-shadow/20 mt-1">
                                <Grid size={12} className="opacity-40"/>
                                <span className="text-[9px] text-gray-500 font-mono">Current Grid: {canvasSize.w}×{canvasSize.h}</span>
                             </div>
                         </div>

                         {/* Color Palette */}
                         <div className="bg-win-face p-2 rounded border border-win-highlight shadow-win-window">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-[10px] font-pixel font-bold text-win-blue uppercase tracking-wide">Palette</div>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded border border-win-darkshadow shadow-win-in" style={{ backgroundColor: color }}></div>
                                    <span className="text-[9px] font-mono text-win-text opacity-70">{color}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-8 gap-0.5 bg-win-darkshadow/10 p-0.5">
                                {NES_PALETTE.map((c, i) => (
                                    <button
                                        key={i}
                                        className={`w-full aspect-square border-2 transition-transform hover:scale-125 z-0 hover:z-10 ${color === c ? 'border-white ring-1 ring-win-select z-10' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setColor(c)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Animation Preview */}
                        {!isBackground && (
                            <div className="bg-win-face p-3 rounded border border-win-highlight shadow-win-window flex flex-col items-center gap-2">
                                <div className="flex justify-between w-full items-center">
                                    <h3 className="text-[10px] text-win-blue font-pixel font-bold uppercase tracking-wide">Animation Loop</h3>
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className={`p-1 rounded-full transition-colors ${isPlaying ? 'bg-win-select text-white shadow-win-in' : 'bg-win-face border border-win-highlight shadow-win-out text-win-text hover:bg-win-highlight'}`}
                                    >
                                        {isPlaying ? <Pause size={12}/> : <Play size={12}/>}
                                    </button>
                                </div>
                                <div className="flex gap-4 items-center justify-center w-full">
                                    <div className="bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVQYlWP4////fwAAAABJRU5ErkJggg==')] border-2 border-win-shadow p-1 bg-repeat shadow-win-in">
                                        <img src={frames[previewFrame] || undefined} className="w-32 h-32 image-render-pixel" alt="anim" style={{imageRendering:'pixelated'}}/>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 text-[9px] font-pixel opacity-70">
                                        <span className="text-win-blue">{previewFrame + 1}/{frames.length}</span>
                                        <span>frames</span>
                                        <span className="mt-1 text-[8px]">{Math.round(1000/animSpeed)} fps</span>
                                    </div>
                                </div>
                                {/* Speed Slider */}
                                <div className="w-full flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-pixel opacity-60 w-6">Fast</span>
                                    <input
                                        type="range" min="50" max="500" step="25"
                                        value={animSpeed}
                                        onChange={e => setAnimSpeed(Number(e.target.value))}
                                        className="flex-1 h-1 accent-win-blue"
                                        title={`Speed: ${animSpeed}ms/frame`}
                                    />
                                    <span className="text-[8px] font-pixel opacity-60 w-6">Slow</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* --- CROP DIALOG MODAL --- */}
        {showCropDialog && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                <div className="bg-win-face border-2 border-win-highlight shadow-win-window p-1 w-64">
                    <div className="flex items-center justify-between bg-win-blue px-2 py-0.5 mb-2">
                        <span className="text-[10px] text-white font-pixel uppercase tracking-tight">Cropping the Images</span>
                        <button onClick={() => setShowCropDialog(false)} className="text-white hover:bg-red-500 px-1 text-[12px]">×</button>
                    </div>

                    <div className="p-3 bg-win-face border border-win-shadow/30 mb-3">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-pixel text-win-text">Border size:</span>
                            <input
                                type="number"
                                value={cropBorder}
                                onChange={e => setCropBorder(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 bg-white border border-win-darkshadow shadow-win-in px-1 text-[10px] font-pixel focus:outline-none focus:border-win-select"
                                autoFocus
                                title="Border size in pixels"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 px-1 pb-1">
                        <button
                            onClick={performCrop}
                            className="px-4 py-1.5 bg-win-face border border-win-highlight shadow-win-out text-[10px] font-pixel hover:bg-win-highlight active:shadow-win-in flex items-center gap-2"
                        >
                            <Check size={12} className="text-green-600"/> OK
                        </button>
                        <button
                            onClick={() => setShowCropDialog(false)}
                            className="px-4 py-1.5 bg-win-face border border-win-highlight shadow-win-out text-[10px] font-pixel hover:bg-win-highlight active:shadow-win-in flex items-center gap-2"
                        >
                            <span className="text-red-600 font-bold">×</span> Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- STRETCH DIALOG MODAL --- */}
        {showStretchDialog && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                <div className="bg-win-face border-2 border-win-highlight shadow-win-window p-1 w-80">
                    <div className="flex items-center justify-between bg-win-blue px-2 py-0.5 mb-2">
                        <span className="text-[10px] text-white font-pixel uppercase tracking-tight">Stretch Images</span>
                        <button onClick={() => setShowStretchDialog(false)} className="text-white hover:bg-red-500 px-1 text-[12px]">×</button>
                    </div>

                    <div className="p-3 bg-win-face flex flex-col gap-4">
                        {/* New Size Section */}
                        <div className="border border-win-shadow/30 p-2 relative pt-3">
                            <span className="absolute -top-2 left-2 bg-win-face px-1 text-[9px] font-pixel text-win-blue">New Size</span>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-pixel w-12 text-win-text">Width:</span>
                                    <input
                                        type="number"
                                        value={stretchWidthPct}
                                        onChange={e => updateStretchSize(parseInt(e.target.value) || 0, true, true)}
                                        className="w-12 bg-white border border-win-darkshadow shadow-win-in px-1 text-[10px] font-pixel"
                                        title="Width Percentage"
                                    />
                                    <span className="text-[10px] font-pixel">%</span>
                                    <input
                                        type="number"
                                        value={stretchWidth}
                                        onChange={e => updateStretchSize(parseInt(e.target.value) || 0, true, false)}
                                        className="w-16 bg-white border border-win-darkshadow shadow-win-in px-1 text-[10px] font-pixel ml-2"
                                        title="Width Pixels"
                                    />
                                    <span className="text-[10px] font-pixel">pixels</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-pixel w-12 text-win-text">Height:</span>
                                    <input
                                        type="number"
                                        value={stretchHeightPct}
                                        onChange={e => updateStretchSize(parseInt(e.target.value) || 0, false, true)}
                                        className="w-12 bg-white border border-win-darkshadow shadow-win-in px-1 text-[10px] font-pixel"
                                        title="Height Percentage"
                                    />
                                    <span className="text-[10px] font-pixel">%</span>
                                    <input
                                        type="number"
                                        value={stretchHeight}
                                        onChange={e => updateStretchSize(parseInt(e.target.value) || 0, false, false)}
                                        className="w-16 bg-white border border-win-darkshadow shadow-win-in px-1 text-[10px] font-pixel ml-2"
                                        title="Height Pixels"
                                    />
                                    <span className="text-[10px] font-pixel">pixels</span>
                                </div>
                                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={keepAspectRatio}
                                        onChange={e => setKeepAspectRatio(e.target.checked)}
                                        className="w-3 h-3"
                                    />
                                    <span className="text-[10px] font-pixel text-win-text">Keep aspect ratio</span>
                                </label>
                            </div>
                        </div>

                        {/* Quality Section */}
                        <div className="border border-win-shadow/30 p-2 relative pt-3">
                            <span className="absolute -top-2 left-2 bg-win-face px-1 text-[9px] font-pixel text-win-blue">Quality</span>
                            <div className="flex flex-col gap-1">
                                {['Poor', 'Normal', 'Good', 'Very Good', 'Excellent'].map(q => (
                                    <label key={q} className="flex items-center gap-2 cursor-pointer hover:bg-win-highlight/20 px-1">
                                        <input
                                            type="radio"
                                            name="quality"
                                            checked={stretchQuality === q}
                                            onChange={() => setStretchQuality(q as any)}
                                            className="w-3 h-3"
                                        />
                                        <span className="text-[10px] font-pixel text-win-text">{q}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 px-1 pb-1 mt-2">
                        <button
                            onClick={performStretch}
                            className="px-4 py-1.5 bg-win-face border border-win-highlight shadow-win-out text-[10px] font-pixel hover:bg-win-highlight active:shadow-win-in flex items-center gap-2"
                        >
                            <Check size={12} className="text-green-600"/> OK
                        </button>
                        <button
                            onClick={() => setShowStretchDialog(false)}
                            className="px-4 py-1.5 bg-win-face border border-win-highlight shadow-win-out text-[10px] font-pixel hover:bg-win-highlight active:shadow-win-in flex items-center gap-2"
                        >
                            <span className="text-red-600 font-bold">×</span> Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SpriteEditor;
