
import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Gamepad2, Code, Download, Play, Rocket, Upload, PaintBucket, RefreshCw, FileCode, Disc, Map as MapIcon, Settings, Puzzle, Folder, File, Image as ImageIcon, ChevronRight, ChevronDown, ChevronUp, Monitor, X, Minus, Square, Info, Trash2, Globe, Mic, Copy, Eraser, RotateCcw, RotateCw, Check, Plus, Music, Type, Clock, Waypoints, FileText, Menu as MenuIcon, Terminal, Sidebar, HardDrive, Wand2, Package, AlertTriangle, Eye, Palette, Speaker, FileType, Layout, Smartphone, Target, Zap, MessageSquare, Shield, User, ArrowDown, Car, Glasses, TreePine, Edit2, FolderPlus } from 'lucide-react';
import { AppState, GeneratedGame, LevelData, GameObject, RoomSettings, BackgroundDef, ViewDef, Theme, SpriteAsset, BackgroundAsset, SoundAsset, FontAsset, RoomData, ScriptAsset, EventType, UIMenu, RoomViewMode, IsoCell, Scene3DObject, TransitionSettings, Model3DAsset } from './types';
import TransitionEffect, { TRANSITION_TYPES, TRANSITION_CATALOG } from './components/TransitionEffect';
import * as geminiService from './services/geminiService';
import { assembleNES, CustomTiles } from './utils/nesAssembler';
import { compileToNES, NESCompileInput } from './utils/nesCompiler';
import { importNESFile } from './utils/nesImporter';
import { imageUrlToNesTile } from './utils/imageToNes';
import { createNorPackage, createPnorPackage, createSealedNorPackage, parseNorPackage, inspectNorPackage } from './utils/norFormat';
import { exportToNor } from './lib/norExporter';
import { exportToESP32Sketch } from './utils/esp32Exporter';
import UnifiedViewport from './components/UnifiedViewport';
import { convertHtmlToNor, convertFolderToNor } from './utils/htmlToNorConverter';
import WindowFrame from "./components/WindowFrame";
import { MenuItem, MenuDropdown, MenuSeparator } from "./components/MenuSystem";
import WelcomeScreen from "./components/WelcomeScreen";
import IsometricEditorWrapper from "./components/IsometricEditorWrapper";
import { useWindowManager, OpenWindow } from "./hooks/useWindowManager";
import { useAssetsManager } from "./hooks/useAssetsManager";
import { compileToGBC, GBCCompileInput } from "./utils/gbcCompiler";
import { convertGmxFolderToNor } from './utils/gmxToNorConverter';
import { createJ2MEPackage } from './utils/j2mePackager';
import { createWindowsPackage } from './utils/winPackager';
import { GM82_EXTENSIONS } from './utils/gm82Extensions';
import { ACTION_LIBRARY, ActionDefinition, generateActionCode } from './utils/actionLibrary';
import { EXTERNAL_ACTIONS } from './utils/externalActions';
import { THEME_PRESETS, applyTheme } from './utils/themeManager';
import { getStandaloneAssets } from './utils/standalonePresets';
import { createShowcaseTemplate } from './utils/showcase';
import { saveTemplate, getTemplates, loadTemplate, deleteTemplate } from './utils/templatesDB';
import { useProjectHistory, ProjectSnapshot as HistorySnapshot, ApplySnapshot } from './utils/useProjectHistory';
import { scheduleSave, loadDraft, clearDraft, hasDraft } from './utils/autosave';
import { SoundEngine, GAME_AUDIO_SCRIPT } from './utils/soundEngine';
import { useGamepad, GAMEPAD_SCRIPT } from './utils/useGamepad';
import RetroButton from './components/RetroButton';
import ConsoleViewer from './components/ConsoleViewer';
import LevelEditor from './components/LevelEditor';
import SpriteEditor from './components/SpriteEditor';
import LibraryEditor from './components/LibraryEditor';
import ExtensionsEditor from './components/ExtensionsEditor';
import SoundEditor from './components/SoundEditor';
import FontEditor from './components/FontEditor';
import ScriptEditor from './components/ScriptEditor';
import UIEditor from './components/UIEditor';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProjectAnalyzerPanel from './components/ProjectAnalyzerPanel';
import TilesetEditor, { TileDefinition, DEFAULT_TILES } from './components/TilesetEditor';
import { ThreeDEditor } from './components/ThreeDEditor';
import { IsometricEditor } from './components/IsometricEditor';
import NoorLibrary from './components/NoorLibrary';
import GameInfoEditor from './components/GameInfoEditor';
import Model3DEditor from './components/Model3DEditor';
import AndroidExportSettingsWindow from './components/AndroidExportSettingsWindow';
import { ProjectSnapshot } from './utils/projectAnalyzer';

// --- STABLE COMPONENTS (MDI System) ---

const TreeItem = ({ label, icon, onClick, active, hasChildren, expanded, onToggle, depth = 0, isLast = false, parentLines = [], showCheckbox = false, checked = false, onCheck }: any) => {
    return (
        <div className="flex flex-col select-none">
            <div className={`flex items-center h-[20px] relative group hover:bg-blue-50 cursor-pointer`}>
                {Array.from({ length: depth }).map((_, i) => (
                   <div key={i} className="absolute top-0 bottom-0 w-[16px]" style={{ left: `${i * 16}px` }}>
                       {parentLines[i] && <div className="absolute left-[7px] top-0 bottom-0 border-l border-dotted border-gray-400"></div>}
                   </div>
                ))}
                <div className="absolute top-0 bottom-0 w-[16px]" style={{ left: `${depth * 16}px` }}>
                     <div className={`absolute left-[7px] top-0 w-px border-l border-dotted border-gray-400 ${isLast ? 'h-[10px]' : 'h-full'}`}></div>
                     <div className="absolute left-[7px] top-[10px] w-[9px] border-t border-dotted border-gray-400"></div>
                     {hasChildren && (
                        <div onClick={(e) => { e.stopPropagation(); onToggle(); }} className="absolute left-[3px] top-[6px] w-[9px] h-[9px] bg-white border border-gray-500 flex items-center justify-center z-10 cursor-pointer shadow-sm hover:border-black">
                            <span className="text-[7px] leading-none text-black font-sans -mt-0.5">{expanded ? '-' : '+'}</span>
                        </div>
                     )}
                </div>
                <div className={`flex items-center gap-1.5 pl-1 pr-1 ml-[2px] h-full border border-transparent w-full cursor-pointer ${active ? 'bg-win-select text-white' : 'text-win-text'}`} style={{ marginLeft: `${(depth + 1) * 16}px` }} onPointerDown={(e) => { e.stopPropagation(); if (onClick) onClick(); }}>
                    {showCheckbox && !hasChildren && (
                        <input type="checkbox" checked={checked} onChange={(e) => { e.stopPropagation(); if (onCheck) onCheck(); }} onClick={(e) => e.stopPropagation()} className="mr-1 w-2.5 h-2.5" />
                    )}
                    {icon}
                    <span className="truncate whitespace-nowrap text-xs md:text-[11px] font-ui">{label}</span>
                </div>
            </div>
        </div>
    );
};
// Wrapper for IsometricEditor that manages its own local state

// --- MAIN APP ---


const App: React.FC = () => {

  const { openWindows, setOpenWindows, activeWindow, setActiveWindow, openWindow, closeWindow, minimizeWindow, restoreWindow, bringToTop, getZIndex } = useWindowManager();
  const { sprites, setSprites, backgroundAssets, setBackgroundAssets, soundAssets, setSoundAssets, fontAssets, setFontAssets, scripts, setScripts, customTiles, setCustomTiles, customTileDefs, setCustomTileDefs, gameObjects, setGameObjects, rooms, setRooms, uiMenus, setUiMenus } = useAssetsManager();
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [gameData, setGameData] = useState<GeneratedGame | null>(null);
  const [uiZoom, setUiZoom] = useState<number>(1.0);

  // --- Transitions ---
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [currentTransition, setCurrentTransition] = useState<TransitionSettings | null>(null);

  // --- View Mode & 2.5D/3D States ---
  const [roomViewMode, setRoomViewMode] = useState<RoomViewMode>('2d');
  const [zDepth, setZDepth] = useState(0);
  const [drawOnSurface, setDrawOnSurface] = useState(true);
  const [isoMap, setIsoMap] = useState<IsoCell[]>([]);
  const [scene3D, setScene3D] = useState<Scene3DObject[]>([]);
  const [model3DAssets, setModel3DAssets] = useState<Model3DAsset[]>([]);





  const [isUpdating, setIsUpdating] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [templatesToDelete, setTemplatesToDelete] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedElements, setSelectedElements] = useState<{type: string, id: string}[]>([]);
  // Right-click context menu for resource-tree items (GameMaker-style management)
  const [resourceCtxMenu, setResourceCtxMenu] = useState<{ x: number; y: number; type: string; id: string; label: string } | null>(null);
  const [groupSubmenuOpen, setGroupSubmenuOpen] = useState(false);
  const [clockTime, setClockTime] = useState(() => new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  useEffect(() => {
    const t = setInterval(() => setClockTime(new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})), 10000);
    return () => clearInterval(t);
  }, []);
  const [currentTheme, setCurrentTheme] = useState('gm8');

  useEffect(() => {
    const theme = THEME_PRESETS.find(t => t.id === currentTheme);
    if (theme) applyTheme(theme);
  }, [currentTheme]);
  const [isListening, setIsListening] = useState(false);
  const [importedTree, setImportedTree] = useState<any>(null);
  const recognitionRef = useRef<any>(null);

  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadTemplatesList();
  }, []);

  const loadTemplatesList = async () => {
    try {
      console.log("Attempting to load templates...");
      const list = await getTemplates();
      console.log("Templates loaded:", list);
      setSavedTemplates(list);
    } catch (err) {
      console.error("Failed to load templates list", err);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!gameData) return;
    try {
      saveCurrentRoomState();

      const currentRooms = rooms.map(r => r.id === activeRoomId ? {
          ...r,
          map: levelMap, width: roomConfig.width, height: roomConfig.height,
          settings: roomSettings, backgrounds: backgrounds, views: views
      } : r);

      const projectData = {
          metadata: gameData.metadata,
          sprites,
          backgrounds: backgroundAssets,
          sounds: soundAssets,
          fonts: fontAssets,
          scripts,
          gameObjects,
          rooms: currentRooms,
          uiMenus,
          importedTree,
          enabledExtensions,
          model3DAssets,
          webPrototype: gameData.webPrototype
      };

      await saveTemplate(projectData);
      await loadTemplatesList();
      setSuccessMessage('Project saved as template successfully!');
    } catch (err: any) {
      window.alert('Failed to save template: ' + err.message);
    }
  };

  const handleLoadSavedTemplate = async (id: string) => {
    try {
      const data = await loadTemplate(id);
      setSprites(data.sprites || []);
      setGameObjects(data.gameObjects || []);
      setSoundAssets(data.sounds || []);
      setScripts(data.scripts || []);
      setBackgroundAssets(data.backgrounds || []);
      setFontAssets(data.fonts || []);
      setUiMenus(data.uiMenus || []);
      setImportedTree(data.importedTree || null);
      if (data.model3DAssets) setModel3DAssets(data.model3DAssets);

      const newMetadata = data.metadata || { title: 'Loaded Template', story: 'Loaded from template' };

      // Infer gmx_compat for old templates that didn't save enabledExtensions
      let loadedExtensions = data.enabledExtensions || [];
      if (loadedExtensions.length === 0 && newMetadata.story === 'Imported GMX') {
          loadedExtensions = ['gmx_compat'];
      }
      setEnabledExtensions(loadedExtensions);

      setUndoStack([]);
      setRedoStack([]);

      const loadedRooms = data.rooms || [];
      if (loadedRooms.length > 0) {
          setRooms(loadedRooms);
          setActiveRoomId(loadedRooms[0].id);
          setLevelMap(Array.isArray(loadedRooms[0].map) ? loadedRooms[0].map : new Array(240).fill(0));
          setRoomConfig({ width: loadedRooms[0].width, height: loadedRooms[0].height });
          setRoomSettings(loadedRooms[0].settings || { speed: 30, backgroundColor: '#000000', drawBackgroundColor: true, creationCode: '' });
          setBackgrounds(loadedRooms[0].backgrounds || []);
          setViews(loadedRooms[0].views || []);
          setRoomViewMode(loadedRooms[0].viewMode || '2d');
          setIsoMap(loadedRooms[0].isoMap || []);
          setScene3D(loadedRooms[0].scene3D || []);
      } else {
          setRooms([]);
          setActiveRoomId('');
          setLevelMap(new Array(240).fill(0));
      }

      setGameData({
          metadata: newMetadata,
          webPrototype: data.webPrototype || '',
          assemblyCode: '',
          boxArtUrl: null,
          uiMenus: data.uiMenus || [],
          defaultTransition: data.defaultTransition || { type: 'fade', duration: 500, color: '#000000', easing: 'easeInOut' }
      });
      setOpenWindows([
          ...(loadedRooms.length > 0 ? [{ id: `room_${loadedRooms[0].id}`, type: 'room' as const, targetId: loadedRooms[0].id, title: `Room: ${loadedRooms[0].id}`, minimized: false }] : []),
          { id: 'runner_game', type: 'runner' as const, targetId: 'game', title: 'Game Runner', minimized: false }
      ]);
      setState(AppState.COMPLETED);
    } catch (err: any) {
      window.alert('Failed to load template: ' + err.message);
    }
  };

  const handleDeleteSavedTemplate = (id: string) => {
    setTemplateToDelete(id);
  };

  const handleDeleteMultipleSavedTemplates = (ids: string[]) => {
    setTemplatesToDelete(ids);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      await deleteTemplate(templateToDelete);
      await loadTemplatesList();
      setTemplateToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete template: ' + err.message);
      setTemplateToDelete(null);
    }
  };

  const confirmDeleteMultipleTemplates = async () => {
    if (templatesToDelete.length === 0) return;
    try {
      for (const id of templatesToDelete) {
        await deleteTemplate(id);
      }
      await loadTemplatesList();
      setTemplatesToDelete([]);
    } catch (err: any) {
      console.error('Failed to delete templates: ' + err.message);
      setTemplatesToDelete([]);
    }
  };

  const handleImportNor = (file: File) => {
    console.log("حاولت استيراد الملف:", file.name);
    window.alert("بدأت في قراءة الملف: " + file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      console.log("تمت قراءة الملف بنجاح!");
      const content = e.target?.result as string;
      console.log("طول المحتوى:", content.length);

      const norData = parseNorPackage(content);
      console.log("نتيجة التحليل:", norData);

      if (norData && norData.project) {
        applyProjectData(norData.project);
      } else {
        window.alert("فشل في تحليل الملف كملف مشروع NOR. تأكد من صحة الملف.");
      }
    };
    reader.onerror = (err) => {
        console.error("خطأ أثناء قراءة الملف:", err);
        window.alert("خطأ أثناء قراءة الملف: " + err);
    };
    reader.readAsText(file);
  };

  const applyProjectData = (data: any) => {
    setSprites(data.sprites || []);
    setGameObjects(data.gameObjects || []);
    setStamps(data.stamps || []);
    setSoundAssets(data.sounds || []);
    setScripts(data.scripts || []);
    setBackgroundAssets(data.backgrounds || []);
    setFontAssets(data.fonts || []);
    setUiMenus(data.uiMenus || []);

    setGameData({
        metadata: data.metadata || { title: 'Imported Project', version: '1.0.0' },
        webPrototype: data.webPrototype || '',
        assemblyCode: '',
        boxArtUrl: null,
        uiMenus: data.uiMenus || [],
        defaultTransition: { type: 'fade', duration: 500, color: '#000000', easing: 'easeInOut' }
    });

    if (data.rooms && data.rooms.length > 0) {
        setRooms(data.rooms);
        const r = data.rooms[0];
        setActiveRoomId(r.id);
        setLevelMap(r.map);
        setRoomConfig({ width: r.width, height: r.height });
        setRoomSettings(r.settings);
        setBackgrounds(r.backgrounds);
        setViews(r.views);
        setRoomLayers(r.layers || []);
    }

    setOpenWindows([{ id: 'level_editor', title: 'Level Editor', type: 'room', minimized: false }]);
    setState(AppState.COMPLETED);
    window.alert('تم استيراد المشروع بنجاح!');
  };

  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
  const [selectedBgId, setSelectedBgId] = useState<string | null>(null);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string>('rm_1');

  // --- TREE EXPANSION ---
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({
      sprites: true, sounds: true, backgrounds: true, paths: true,
      scripts: true, fonts: true, timelines: true, objects: true, rooms: true, menus: true
  });
  const toggleTree = (key: string) => setTreeExpanded(prev => ({...prev, [key]: !prev[key]}));

  // --- ASSET STATE ---

  // --- GAME OBJECTS STATE ---
  // Replaces the old single 'gameObjectLogic'

  // --- ROOM MANAGEMENT ---
  const [levelMap, setLevelMap] = useState<LevelData>(new Array(240).fill(0));
  const [roomLayers, setRoomLayers] = useState<import('./types').LevelDataLayer[]>([]);
  const [stamps, setStamps] = useState<import('./types').Stamp[]>([]);
  const [roomConfig, setRoomConfig] = useState({ width: 16, height: 15 });
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({ name: 'room1', caption: 'Room 1', speed: 30, lives: 3, persistent: false, clearView: true, creationCode: '', tileAnimSpeed: 250, enableViews: false, snapX: 16, snapY: 16, bgColor: '#C0C0C0', drawBgColor: true });

  const [backgrounds, setBackgrounds] = useState<BackgroundDef[]>(Array(8).fill(null).map(() => ({ visible: false, foreground: false, source: null, tileH: true, tileV: true, stretch: false, x: 0, y: 0, hspeed: 0, vspeed: 0 })));
  const [views, setViews] = useState<ViewDef[]>(Array(8).fill(null).map(() => ({ visible: false, viewX: 0, viewY: 0, viewW: 256, viewH: 240, portX: 0, portY: 0, portW: 256, portH: 240, followObj: null, hBorder: 32, vBorder: 32, hSpeed: -1, vSpeed: -1 })));

  const [undoStack, setUndoStack] = useState<LevelData[]>([]);
  const [redoStack, setRedoStack] = useState<LevelData[]>([]);
  const [enabledExtensions, setEnabledExtensions] = useState<string[]>([]);

  // ─── Global History (Undo/Redo لكل assets وليس Level فقط) ───
  const history = useProjectHistory();
  const [autoSavedAt, setAutoSavedAt] = useState<number | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<any>(null);
  const gameIframeRef = useRef<HTMLIFrameElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const themeFileInputRef = useRef<HTMLInputElement>(null);
  const gmkInputRef = useRef<HTMLInputElement>(null);
  const gmxFolderInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const nesInputRef  = useRef<HTMLInputElement>(null);
  const model3dInputRef = useRef<HTMLInputElement>(null);

  // ─── Gamepad ─── يُفعَّل فقط عندما تكون نافذة اللعبة مفتوحة
  useGamepad({
    iframeRef: gameIframeRef,
    broadcastToWindow: false,
    enabled: activeWindow === 'runner_game',
  });

  // ─── Recovery Check عند أول تحميل ───
  useEffect(() => {
    hasDraft().then(({ exists, savedAt }) => {
      if (exists && savedAt) {
        const mins = Math.round((Date.now() - savedAt) / 60000);
        if (mins < 60 * 24) { // يظهر بس لو الـ draft أقل من 24 ساعة
          loadDraft().then(draft => {
            if (draft && draft.gameData) {
              setRecoveryDraft(draft);
              setShowRecovery(true);
            }
          });
        }
      }
    });
  }, []);

    const switchToRoom = (id: string, overrideRooms?: RoomData[]) => {
        if (id === activeRoomId && !overrideRooms) return;

        const nextRooms = overrideRooms || saveCurrentRoomState();
        const room = nextRooms.find(r => r.id === id);
        if (!room) return;

        const transition = room.settings.transition || gameData?.defaultTransition;

        if (transition && !overrideRooms) {
            setPendingRoomId(id);
            setCurrentTransition(transition);
            setIsTransitioning(true);
        } else {
            setActiveRoomId(id);
            setLevelMap(room.map);
            setRoomConfig({ width: room.width, height: room.height });
            setRoomSettings(room.settings);
            setRoomLayers(room.layers || []);
            setBackgrounds(room.backgrounds);
            setViews(room.views);
            setRoomViewMode(room.viewMode || '2d');
            setIsoMap(room.isoMap || []);
            setScene3D(room.scene3D || []);
            setUndoStack([]);
            setRedoStack([]);
            openWindow('room', id, `Room: ${room.settings.name}`);
        }
    };

  const handleTransitionComplete = () => {
      if (pendingRoomId) {
          setActiveRoomId(pendingRoomId);
          const r = rooms.find(rm => rm.id === pendingRoomId);
          if (r) {
              setLevelMap(r.map);
              setRoomConfig({ width: r.width, height: r.height });
              setRoomSettings(r.settings);
              setBackgrounds(r.backgrounds);
              setViews(r.views);
              setRoomViewMode(r.viewMode || '2d');
              setIsoMap(r.isoMap || []);
              setScene3D(r.scene3D || []);
              openWindow('room', pendingRoomId, `Room: ${r.settings.name}`);
          }
          setPendingRoomId(null);
          // Keep isTransitioning true for a bit to show the "exit" transition if implemented
          // But for now, just end it
          setTimeout(() => setIsTransitioning(false), 100);
      }
  };

  const handleOpenGmk = async (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("GMK Import triggered...");
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      try {
          const buffer = await file.arrayBuffer();
          // We dynamically import to avoid breaking the initial load if pako isn't ready
          const { GmkParser } = await import('./lib/gmk/GmkParser');
            const { GmkConverter } = await import('./lib/gmk/GmkConverter');
          const project = GmkParser.parse(buffer);
          console.log("Parsed GMK Project:", project);

          const converted = await GmkConverter.convert(project);
          console.log("Converted GMK Project:", converted);

          // Update State
          setSprites(prev => [...prev, ...converted.sprites]);
          setGameObjects(prev => [...prev, ...converted.gameObjects]);
          setRooms(prev => [...prev.filter(r => r.id !== 'rm_default'), ...converted.rooms]);
          setScripts(prev => [...prev, ...converted.scripts]);
          setSoundAssets(prev => [...prev, ...converted.sounds]);
          setBackgroundAssets(prev => [...prev, ...converted.backgrounds]);
          setImportedTree(converted.resourceTree);

          // Set metadata
          setGameData(prev => prev ? {
              ...prev,
              metadata: {
                  ...prev.metadata,
                  title: project.gameInformation?.caption || project.sprites[0]?.name || "Imported GMK",
                  story: `Imported from GMK (v${project.version})`
              }
          } : prev);

          // Switch to first imported room or first existing room
          if (converted.rooms.length > 0) {
              switchToRoom(converted.rooms[0].id);
          }

          if (project.version < 800) {
              window.alert(`Warning: This is an older GMK version (${project.version}). Some resources might not load correctly or may be partially corrupted. We've attempted to load as much as possible.\n\nSuccessfully imported GMK project! Items: ${converted.sprites.length} sprites, ${converted.gameObjects.length} objects, ${converted.rooms.length} rooms.`);
          } else {
              window.alert(`Successfully imported GMK project! Items: ${converted.sprites.length} sprites, ${converted.gameObjects.length} objects, ${converted.rooms.length} rooms.`);
          }
      } catch (err: any) {
          console.error("GMK Parsing Error:", err);
          window.alert("Failed to parse GMK file. The file might be corrupted or in an unsupported format.\n\nError: " + err.message);
      }
      e.target.value = '';
  };

  const handleOpenHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      try {
          const result = await convertFolderToNor(e.target.files);
          setSprites(prev => [...prev, ...result.sprites]);
          setGameObjects(prev => [...prev, ...result.gameObjects]);
          setSoundAssets(prev => [...prev, ...result.sounds]);
          setScripts(prev => [...prev, ...result.scripts]);
          setRooms(prev => [...prev, ...result.rooms]);
          setGameData(prev => prev ? {
              ...prev,
              metadata: { ...prev.metadata, ...result.metadata },
              webPrototype: result.rawHtml || prev.webPrototype
          } : {
              metadata: result.metadata,
              webPrototype: result.rawHtml,
              gameDocs: '',
              version: 0,
              assemblyCode: '',
              boxArtUrl: '',
              uiMenus: []
          });

          setState(AppState.COMPLETED);


          if (result.rooms.length > 0) {
              switchToRoom(result.rooms[0].id);
          }
          window.alert(`✅ تم استيراد مجلد لعبة HTML بنجاح!\n🎨 صور: ${result.sprites.length} | 🔊 أصوات: ${result.sounds.length} | 📜 سكربتات: ${result.scripts.length}\n📁 ملفات داتا: ${result.assetMap?.dataPaths.length ?? 0} | 🔤 خطوط: ${result.assetMap?.fontPaths.length ?? 0}\n\n📍 مسارات الأصول المكتشفة:\n${result.assetMap?.imagePaths.slice(0,5).map(p=>'🖼 '+p).join('\n') || 'لا توجد صور'}\n${result.assetMap?.audioPaths.slice(0,3).map(p=>'🎵 '+p).join('\n') || ''}`);

      } catch (err: any) {
          console.error('HTML Import Error:', err);
          window.alert('فشل استيراد مجلد HTML: ' + err.message);
      }
      e.target.value = '';
  };

  // ─── NES ROM Import ────────────────────────────────────────────────────────
  const handleOpenNES = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';

      setState(AppState.GENERATING_ASSETS);
      try {
          const arrayBuffer = await file.arrayBuffer();
          const nesBytes    = new Uint8Array(arrayBuffer);
          const result      = await importNESFile(nesBytes);

          // تطبيق الـ project المستورد
          history.pushSnapshot({ ...getHistorySnap(), label: 'Import NES ROM' });

          setSprites(result.sprites);
          setBackgroundAssets(result.backgroundAssets);
          setSoundAssets(result.soundAssets);
          setFontAssets(result.fontAssets);
          setScripts(result.scripts);
          setGameObjects(result.gameObjects);
          setRooms(result.rooms);
          setUiMenus(result.uiMenus);
          setEnabledExtensions([]);

          if (result.rooms.length > 0) {
              const r = result.rooms[0];
              setActiveRoomId(r.id);
              setLevelMap(Array.isArray(r.map) ? r.map : new Array(r.width * r.height).fill(0));
              setRoomConfig({ width: r.width, height: r.height });
              setRoomSettings(r.settings);
              setBackgrounds(r.backgrounds);
              setViews(r.views);
          }

          // بناء webPrototype من الـ project المستورد
          const eventCodeMap: Record<string, any> = {};
          result.gameObjects.forEach(obj => {
              const objEvents: Record<string, string> = {};
              if (obj.events) {
                  Object.entries(obj.events).forEach(([evt, actions]) => {
                      if (Array.isArray(actions) && actions.length > 0) {
                          objEvents[evt] = actions.map(a => generateActionCode(a, EXTERNAL_ACTIONS)).filter(Boolean).join('\n');
                      }
                  });
              }
              eventCodeMap[obj.id] = objEvents;
          });
          const engineHTML = geminiService.createEngineHTML({
              assets:      { sprites: result.sprites, backgrounds: [], sounds: [], fonts: [] },
              rooms:       result.rooms,
              scripts:     result.scripts,
              gameObjects: result.gameObjects,
              objectEvents: eventCodeMap,
              uiMenus:     [],
              extensions:  [],
          });

          setGameData({
              metadata:      result.metadata,
              assemblyCode:  '; Imported from NES ROM',
              boxArtUrl:     null,
              webPrototype:  engineHTML,
              uiMenus:       [],
          });

          setState(AppState.COMPLETED);
          openWindow('room', result.rooms[0]?.id || 'rm_imported', 'Room: Imported');

          const warnMsg = result.warnings.length > 0
              ? `\n\n⚠ تحذيرات (${result.warnings.length}):\n${result.warnings.slice(0,3).join('\n')}`
              : '';
          setSuccessMessage(`✅ تم استيراد ROM: ${result.metadata.title}\n🎨 Tiles: ${result.sprites.length} | 🧩 Objects: ${result.gameObjects.length}${warnMsg}`);

      } catch (err: any) {
          console.error('[NES Import]', err);
          window.alert(`فشل الاستيراد: ${err.message}`);
          setState(AppState.IDLE);
      }
  };

  const handleOpenGmx = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      try {
          const result = await convertGmxFolderToNor(e.target.files);

          // ── Full project replacement ──────────────────────────────────────
          // IMPORTANT: We REPLACE (not append) all assets so that object indices
          // in the imported room map match exactly the gameObjects array.
          // Appending would create an index offset and cause empty-looking rooms.
          setSprites(result.sprites);
          setGameObjects(result.gameObjects);
          setSoundAssets(result.sounds);
          setScripts(result.scripts);
          setBackgroundAssets(result.backgrounds);
          setUiMenus([]);          // GMX doesn't have UI menus; start fresh
          setEnabledExtensions(['gmx_compat']); // GMX projects need GMX compatibility extension
          setUndoStack([]);
          setRedoStack([]);

          const newMetadata = {
              title: result.metadata?.title || 'Imported GMX Project',
              story: 'Imported GMX',
              genre: 'Retro',
              controls: 'Arrows / Z / X',
              languages: ['en', 'ar'] as string[],
              defaultLanguage: 'en'
          };

          // Build a temporary game prototype (will be updated when user runs)
          setGameData({
              metadata: newMetadata,
              webPrototype: '',
              assemblyCode: '',
              boxArtUrl: null,
              uiMenus: []
          });

          // Set rooms THEN switch – so switchToRoom can find the correct room
          setRooms(result.rooms);

          setState(AppState.COMPLETED);

          if (result.rooms.length > 0) {
              // Use override so switchToRoom doesn't use stale `rooms` state
              switchToRoom(result.rooms[0].id, result.rooms);
          }

          window.alert(`✅ تم استيراد مجلد GMX بنجاح!\n🎨 صور: ${result.sprites.length} | 🔊 أصوات: ${result.sounds.length} | 📜 سكربتات: ${result.scripts.length}\n🧩 كائنات: ${result.gameObjects.length} | 🗺 غرف: ${result.rooms.length}`);
      } catch (err: any) {
          console.error('GMX Import Error:', err);
          window.alert('فشل استيراد مجلد GMX: ' + err.message);
      }
      e.target.value = '';
  };

  // --- ROOM SWITCHING ---
    const getUpdatedRooms = () => {
        return rooms.map(r => r.id === activeRoomId ? {
            ...r,
            map: levelMap, width: roomConfig.width, height: roomConfig.height,
            settings: roomSettings, layers: roomLayers, backgrounds: backgrounds, views: views,
            viewMode: roomViewMode, isoMap: isoMap, scene3D: scene3D
        } : r);
    };

    const saveCurrentRoomState = () => {
        const nextRooms = getUpdatedRooms();
        setRooms(nextRooms);
        return nextRooms;
    };


  const updateLevelMapWithHistory = (newData: LevelData) => {
    setUndoStack(prev => [...prev, [...levelMap]]);
    setRedoStack([]);
    setLevelMap(newData);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(prevRedo => [...prevRedo, [...levelMap]]);
    setUndoStack(prevUndo => prevUndo.slice(0, -1));
    setLevelMap(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prevUndo => [...prevUndo, [...levelMap]]);
    setRedoStack(prevRedo => prevRedo.slice(0, -1));
    setLevelMap(next);
  };

  // Keyboard Shortcuts for Undo/Redo — Global (كل assets) + Level
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // F5 = Run game
        if (e.key === 'F5') { e.preventDefault(); if (gameData) handleUpdateGame(); return; }

        if (!(e.ctrlKey || e.metaKey)) return;

        const getSnap = (): HistorySnapshot => ({
            sprites, backgroundAssets, soundAssets, fontAssets,
            scripts, gameObjects, rooms, uiMenus
        });
        const applyFns: ApplySnapshot = {
            setSprites, setBackgroundAssets, setSoundAssets,
            setFontAssets, setScripts, setGameObjects, setRooms, setUiMenus
        };

        if (e.key === 'z') {
            e.preventDefault();
            if (activeWindow.startsWith('room_') && undoStack.length > 0) {
                handleUndo();
            } else {
                history.undo(getSnap(), applyFns);
            }
        } else if (e.key === 'y') {
            e.preventDefault();
            if (activeWindow.startsWith('room_') && redoStack.length > 0) {
                handleRedo();
            } else {
                history.redo(getSnap(), applyFns);
            }
        } else if (e.key === 's') {
            e.preventDefault();
            if (gameData) handleExport('nor');
        } else if (e.key === 'n') {
            e.preventDefault();
            setShowConfirmNew(true);
        } else if (e.key === 'o') {
            e.preventDefault();
            fileInputRef.current?.click();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWindow, undoStack, redoStack, levelMap,
      sprites, backgroundAssets, soundAssets, fontAssets,
      scripts, gameObjects, rooms, uiMenus]);

  // ── Electron Desktop Integration ──
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return; // running in browser, nothing to do

    // Listen for native menu actions forwarded from main process
    const offMenu = api.onMenuEvent((event) => {
      switch (event) {
        case 'menu:save':         if (gameData) handleExport('nor');   break;
        case 'menu:run':          if (gameData) handleUpdateGame();    break;
        case 'menu:restart':      if (gameData) handleUpdateGame();    break;
        case 'menu:export-nor':   if (gameData) handleExport('nor');   break;
        case 'menu:export-html':  if (gameData) handleExport('html');  break;
        case 'menu:export-nes':   if (gameData) handleExport('nes');   break;
      }
    });

    // Listen for files opened via native dialog (File → Open .nor)
    const offFile = api.onFileOpened(({ content }) => {
      try {
        const pkg = parseNorPackage(content);
        if (pkg?.project) {
          setSprites(pkg.project.sprites || []);
          setBackgroundAssets(pkg.project.backgrounds || []);
          setSoundAssets(pkg.project.sounds || []);
          setFontAssets(pkg.project.fonts || []);
          setScripts(pkg.project.scripts || []);
          setRooms(pkg.project.rooms || []);
          setGameObjects(pkg.project.gameObjects || []);
          setUiMenus(pkg.project.uiMenus || []);
          if (pkg.project.rooms?.length) {
            const r = pkg.project.rooms[0];
            setActiveRoomId(r.id);
            setLevelMap(r.map);
            setRoomConfig({ width: r.width, height: r.height });
            setRoomSettings(r.settings);
            setBackgrounds(r.backgrounds);
            setViews(r.views);
          }
          const meta = pkg.project.metadata || { title: pkg.meta.title, story: '', genre: 'Retro', controls: 'Z/X', languages: ['en'], defaultLanguage: 'en' };
          setGameData({ metadata: meta, assemblyCode: ';', boxArtUrl: null, webPrototype: pkg.payload, uiMenus: pkg.project.uiMenus || [] });
          setState(AppState.COMPLETED);
          openWindow('runner', 'game', 'Game Runner');
        }
      } catch (err: any) { window.alert('Failed to load: ' + err.message); }
    });

    return () => { offMenu(); offFile(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameData]);

  // --- ASSET HANDLERS ---
  // ─── helper مشترك للـ snapshot ───
  const getHistorySnap = useCallback((): HistorySnapshot => ({
      sprites, backgroundAssets, soundAssets, fontAssets,
      scripts, gameObjects, rooms, uiMenus
  }), [sprites, backgroundAssets, soundAssets, fontAssets,
       scripts, gameObjects, rooms, uiMenus]);

  const handleAddSprite = () => {
      history.pushSnapshot({ ...getHistorySnap(), label: 'Add Sprite' });
      const newId = `spr_${Date.now()}`;
      setSprites(prev => [...prev, { id: newId, name: `spr_${sprites.length}`, src: '', role: 'decoration' }]);
      setSelectedSpriteId(newId); openWindow('sprites', newId, `Sprite: ${newId}`);
  };
  const handleBulkImportSprites = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const files = Array.from(e.target.files) as File[];
      let processed = 0;
      const newSprites: SpriteAsset[] = [];

      files.forEach((file, idx) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const src = ev.target?.result as string;
              const name = file.name.split('.')[0];
              newSprites.push({ id: `spr_${Date.now()}_${idx}`, name, src, role: 'decoration' });
              processed++;
              if (processed === files.length) {
                  setSprites(prev => [...prev, ...newSprites]);
                  window.alert(`Imported ${files.length} sprites!`);
              }
          };
          reader.readAsDataURL(file);
      });
      e.target.value = '';
  };
  const handleAddObject = () => {
      history.pushSnapshot({ ...getHistorySnap(), label: 'Add Object' });
      const newId = `obj_${Date.now()}`;
      setGameObjects(prev => [...prev, {
          id: newId,
          name: `obj_${gameObjects.length}`,
          spriteId: null,
          animations: {},
          events: { create: [], step: [], collision_enemy: [], collision_item: [] }
      }]);
      setSelectedObjectId(newId); openWindow('object_edit', newId, `Object: ${newId}`);
  };

  const handleAddBackground = () => {
      const newId = `bg_${Date.now()}`;
      setBackgroundAssets(prev => [...prev, { id: newId, name: `bg_${backgroundAssets.length}`, src: '' }]);
      setSelectedBgId(newId); openWindow('backgrounds_edit', newId, `Background: ${newId}`);
  };
  const handleAddSound = () => {
      const newId = `snd_${Date.now()}`;
      setSoundAssets(prev => [...prev, { id: newId, name: `snd_${soundAssets.length}`, src: '' }]);
      setSelectedSoundId(newId); openWindow('sounds_edit', newId, `Sound: ${newId}`);
  };
  const handleAddFont = () => {
      const newId = `fnt_${Date.now()}`;
      setFontAssets(prev => [...prev, { id: newId, name: `fnt_${fontAssets.length}`, family: 'Arial', size: 12, bold: false, italic: false }]);
      setSelectedFontId(newId); openWindow('fonts_edit', newId, `Font: ${newId}`);
  };
  const handleAddScript = () => {
      history.pushSnapshot({ ...getHistorySnap(), label: 'Add Script' });
      const newId = `scr_${Date.now()}`;
      setScripts(prev => [...prev, { id: newId, name: `scr_${scripts.length}`, code: '// JavaScript Code\n' }]);
      setSelectedScriptId(newId); openWindow('script_edit', newId, `Script: ${newId}`);
  };
  const handleAddMenu = () => {
      const newId = `ui_${Date.now()}`;
      setUiMenus(prev => [...prev, { id: newId, name: `menu_${uiMenus.length}`, elements: [], visible: true }]);
      setSelectedMenuId(newId); openWindow('ui_edit', newId, `Menu: ${newId}`);
  };
  const handleAddRoom = () => {
      history.pushSnapshot({ ...getHistorySnap(), label: 'Add Room' });
      saveCurrentRoomState();
      const newId = `rm_${Date.now()}`;
      const newRoom: RoomData = {
          id: newId, width: 16, height: 15, map: new Array(240).fill(0),
          settings: { name: `room${rooms.length}`, caption: 'New Room', speed: 30, lives: 3, persistent: false, clearView: true, creationCode: '', tileAnimSpeed: 250, enableViews: false, snapX: 16, snapY: 16, bgColor: '#C0C0C0', drawBgColor: true },

          backgrounds: Array(8).fill(null).map(() => ({ visible: false, foreground: false, source: null, tileH: true, tileV: true, stretch: false, x: 0, y: 0, hspeed: 0, vspeed: 0 })),
          views: Array(8).fill(null).map(() => ({ visible: false, viewX: 0, viewY: 0, viewW: 256, viewH: 240, portX: 0, portY: 0, portW: 256, portH: 240, followObj: null, hBorder: 32, vBorder: 32, hSpeed: -1, vSpeed: -1 }))
      };
      setRooms(prev => [...prev, newRoom]);
      setTimeout(() => {
          switchToRoom(newId);
          openWindow('room', newId, `Room: ${newRoom.settings.name}`);
      }, 0);
  };

  const handleSoundSave = (src: string) => {
      setSoundAssets(prev => prev.map(s => s.id === selectedSoundId ? {...s, src} : s));
  };
  const handleFontUpdate = (font: FontAsset) => {
      setFontAssets(prev => prev.map(f => f.id === font.id ? font : f));
  };
  const handleScriptUpdate = (code: string) => {
      history.pushSnapshot({ ...getHistorySnap(), label: 'Edit Script' });
      setScripts(prev => prev.map(s => s.id === selectedScriptId ? {...s, code} : s));
  };
  const handleObjectUpdate = (obj: GameObject) => {
      history.pushSnapshot({ ...getHistorySnap(), label: `Edit ${obj.name}` });
      setGameObjects(prev => prev.map(o => o.id === obj.id ? obj : o));
  };
  const handleMenuUpdate = (menu: UIMenu) => {
      setUiMenus(prev => prev.map(m => m.id === menu.id ? menu : m));
  };

  // Auto-update game when relevant state changes
  React.useEffect(() => {
      // Skip auto-update for legacy projects (Play Only mode)
      const isLegacy = gameData?.metadata.story === "Legacy (Play Only)";
      if (activeWindow === 'runner_game' && gameData && !isLegacy) {
          const timer = setTimeout(() => {
              handleUpdateGame();
          }, 1000);
          return () => clearTimeout(timer);
      }
  }, [sprites, gameObjects, rooms, backgroundAssets, soundAssets, fontAssets, scripts, enabledExtensions, activeWindow]);

  // Helper to generate initial data logic
  const getInitialData = (template: 'runner' | 'starter' | 'blank' | 'ai' | 'shooter' | 'maze' | 'megaman' | 'fighter' | 'platformer_pro' | 'rpg' | 'racing' | 'sonic' | 'adventure_island' | 'hollowknight' | 'first_person' | 'third_person' | 'top_down' | 'vehicle' | 'ar' | 'vr' | 'handheld_ar' | 'showcase' | 'strategy' | 'arcade', assets: any = {}) => {
      const fb = geminiService.FALLBACK_SPRITE;
      const w = 16; const h = 15;
      const initialMap = new Array(w * h).fill(0);
      const menuMap = new Array(w * h).fill(0);
      menuMap[0] = 9; // objMenuCtrl is index 7 in initObjects, so map ID is 7 + 2 = 9

      const roomMenu: RoomData = {
          id: 'rm_menu', width: w, height: h, map: menuMap,
          settings: { name: 'rm_menu', caption: 'Main Menu', speed: 30, lives: 3, persistent: false, clearView: true, creationCode: '', tileAnimSpeed: 250, enableViews: false, snapX: 16, snapY: 16, bgColor: '#000000', drawBgColor: true },
          backgrounds: Array(8).fill(null).map(() => ({ visible: false, foreground: false, source: null, tileH: true, tileV: true, stretch: false, x: 0, y: 0, hspeed: 0, vspeed: 0 })),
          views: Array(8).fill(null).map(() => ({ visible: false, viewX: 0, viewY: 0, viewW: 256, viewH: 240, portX: 0, portY: 0, portW: 256, portH: 240, followObj: '', hBorder: 32, vBorder: 32, hSpeed: -1, vSpeed: -1 }))
      };

      const room1: RoomData = {
          id: 'rm_1', width: w, height: h, map: initialMap,
          settings: { name: 'room1', caption: 'Level 1', speed: 30, lives: 3, persistent: false, clearView: true, creationCode: '', tileAnimSpeed: 250, enableViews: false, snapX: 16, snapY: 16, bgColor: '#1a1a2e', drawBgColor: true, cameraMode: template === 'first_person' || template === 'vr' ? 'first_person' : (template === 'third_person' ? 'third_person' : (template === 'top_down' ? 'top_down' : undefined)) },
          backgrounds: Array(8).fill(null).map(() => ({ visible: false, foreground: false, source: null, tileH: true, tileV: true, stretch: false, x: 0, y: 0, hspeed: 0, vspeed: 0 })),
          views: Array(8).fill(null).map(() => ({ visible: false, viewX: 0, viewY: 0, viewW: 256, viewH: 240, portX: 0, portY: 0, portW: 256, portH: 240, followObj: 'obj_player', hBorder: 32, vBorder: 32, hSpeed: -1, vSpeed: -1 })),
          viewMode: (template === 'first_person' || template === 'third_person' || template === 'vr') ? '3d' : '2d'
      };

      // Paper 2D helper: mark sprite with pixel-perfect settings (nearest filter, no smoothing)
      const p2d = (spr: SpriteAsset): SpriteAsset => ({ ...spr, paper2d: true } as any);

      const pSpr = p2d({ id: 'spr_player', name: 'spr_player', src: assets.player || fb, role: 'player' } as SpriteAsset);
      const gSpr = p2d({ id: 'spr_ground', name: 'spr_wall', src: assets.ground || fb, role: 'ground' } as SpriteAsset);
      const iSpr = p2d({ id: 'spr_item', name: 'spr_item', src: assets.item || fb, role: 'item' } as SpriteAsset);
      const eSpr = p2d({ id: 'spr_enemy', name: 'spr_enemy', src: assets.enemy || fb, role: 'enemy' } as SpriteAsset);
      const goalSpr = p2d({ id: 'spr_goal', name: 'spr_goal', src: assets.goal || fb, role: 'decoration' } as SpriteAsset);
      const bulletSpr = p2d({ id: 'spr_bullet', name: 'spr_bullet', src: assets.bullet || fb, role: 'decoration' } as SpriteAsset);
      const keySpr = p2d({ id: 'spr_key', name: 'spr_key', src: assets.key || fb, role: 'item' } as SpriteAsset);
      const doorSpr = p2d({ id: 'spr_door', name: 'spr_door', src: assets.door || fb, role: 'ground' } as SpriteAsset);

      const healthSpr = p2d({ id: 'spr_health', name: 'spr_health', src: assets.heart || fb, role: 'item' } as SpriteAsset);
      const lifeSpr = p2d({ id: 'spr_life', name: 'spr_life', src: assets.heart || fb, role: 'item' } as SpriteAsset);

      const runnerSpr = p2d({ id: 'spr_runner', name: 'spr_runner', src: assets.runner || fb, role: 'player' } as SpriteAsset);
      const cactusSpr = p2d({ id: 'spr_cactus', name: 'spr_cactus', src: assets.cactus || fb, role: 'enemy' } as SpriteAsset);
      const batSpr = p2d({ id: 'spr_bat', name: 'spr_bat', src: assets.bat || fb, role: 'enemy' } as SpriteAsset);
      const coinSpr = p2d({ id: 'spr_coin', name: 'spr_coin', src: assets.coin_gold || fb, role: 'item' } as SpriteAsset);
      const bossSpr = p2d({ id: 'spr_boss', name: 'spr_boss', src: assets.orc || fb, role: 'enemy' } as SpriteAsset);
      const skateSpr = p2d({ id: 'spr_skate', name: 'spr_skate', src: assets.soldier || fb, role: 'item' } as SpriteAsset);
      const bgRunner = { id: 'bg_runner', name: 'bg_runner', src: assets.sky || fb } as BackgroundAsset;

      const initSprites: SpriteAsset[] = [gSpr, iSpr, pSpr, eSpr, goalSpr, bulletSpr, keySpr, doorSpr, healthSpr, lifeSpr, runnerSpr, cactusSpr, batSpr, coinSpr, bossSpr, skateSpr];
      const initBackgrounds: BackgroundAsset[] = [bgRunner];

      // Tiny base64 WAVs for basic sounds
      const sndJump = { id: 'snd_jump', name: 'snd_jump', src: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' }; // Placeholder
      const sndCoin = { id: 'snd_coin', name: 'snd_coin', src: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' }; // Placeholder
      const sndHit = { id: 'snd_hit', name: 'snd_hit', src: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' }; // Placeholder
      const sndMusic = { id: 'snd_music', name: 'snd_music', src: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' }; // Placeholder
      const initSounds = [sndJump, sndCoin, sndHit, sndMusic];

      let objPlayer: GameObject = {
          id: 'obj_player', name: 'obj_player', spriteId: pSpr.id,
          health: 100, lives: 3,
          events: { create: [{ id: 'init_health', libId: 'health_set', params: { amt: 100, rel: false } }], step: [], collision_item: [], collision_enemy: [] }
      };
      let objEnemy: GameObject = {
          id: 'obj_enemy', name: 'obj_enemy', spriteId: eSpr.id,
          health: 50, lives: 1,
          events: { create: [], step: [], collision_enemy: [], collision_item: [] }
      };
      let objItem: GameObject = {
          id: 'obj_item', name: 'obj_item', spriteId: iSpr.id,
          health: 1, lives: 1,
          events: { create: [], step: [], collision_enemy: [], collision_item: [] }
      };
      let objGoal: GameObject = {
          id: 'obj_goal', name: 'obj_goal', spriteId: goalSpr.id,
          health: 1, lives: 1,
          events: { create: [], step: [], collision_enemy: [], collision_item: [] }
      };
      let objBullet: GameObject = {
          id: 'obj_bullet', name: 'obj_bullet', spriteId: bulletSpr.id,
          health: 1, lives: 1,
          events: { create: [], step: [], collision_enemy: [], collision_item: [] }
      };
      let objKey: GameObject = {
          id: 'obj_key', name: 'obj_key', spriteId: keySpr.id,
          health: 1, lives: 1,
          events: { create: [], step: [], collision_enemy: [], collision_item: [] }
      };
      let objDoor: GameObject = {
          id: 'obj_door', name: 'obj_door', spriteId: doorSpr.id,
          health: 1, lives: 1,
          events: { create: [], step: [], collision_enemy: [], collision_item: [] }
      };
      let objHealth: GameObject = {
          id: 'obj_health', name: 'obj_health', spriteId: healthSpr.id,
          health: 1, lives: 1,
          events: {
              collision_player: [
                  { id: 'add_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'play_snd', libId: 'main1_sound', params: { snd: 'snd_coin', loop: false } },
                  { id: 'die', libId: 'main1_destroy', params: { target: 'self' } }
              ]
          }
      };
      let objLife: GameObject = {
          id: 'obj_life', name: 'obj_life', spriteId: lifeSpr.id,
          health: 1, lives: 1,
          events: {
              collision_player: [
                  { id: 'add_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'play_snd', libId: 'main1_sound', params: { snd: 'snd_coin', loop: false } },
                  { id: 'die', libId: 'main1_destroy', params: { target: 'self' } }
              ]
          }
      };
      let objBoss: GameObject = {
          id: 'obj_boss', name: 'obj_boss', spriteId: bossSpr.id,
          health: 100, lives: 1,
          events: { create: [], step: [], collision_enemy: [], collision_item: [] }
      };
      let objSkateboard: GameObject = {
          id: 'obj_skate', name: 'obj_skate', spriteId: skateSpr.id,
          health: 1, lives: 1,
          events: { create: [], step: [], collision_enemy: [], collision_item: [] }
      };
      let objMenuCtrl: GameObject = {
          id: 'obj_menu_ctrl', name: 'obj_menu_ctrl', spriteId: '',
          events: {
              create: [], collision_enemy: [], collision_item: [],
              draw: [],
              step: []
          }
      };

      if (template === 'runner') {
          objPlayer.spriteId = 'spr_runner';
          objPlayer.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } },
                  { id: 'init_vars', libId: 'control_execute', params: { code: 'this.speed = 0; this.score = 0; this.isJumping = false; window.score = 0; window.lives = 3;' } }
              ],
              step: [
                  { id: 'jump', libId: 'control_execute', params: { code: 'if((Input.keys["Space"] || Input.keys["ArrowUp"] || Input.keys["KeyW"] || Input.keys["z"] || Input.keys["KeyZ"]) && !this.isJumping) { this.dy = -12; this.isJumping = true; if(window.play_sound) window.play_sound("snd_jump"); }' } },
                  { id: 'grav', libId: 'move_gravity', params: { amt: 0.7 } },
                  { id: 'land', libId: 'control_execute', params: { code: 'if(this.y >= 192) { this.y = 192; this.dy = 0; this.isJumping = false; }' } },
                  { id: 'score', libId: 'control_execute', params: { code: 'window.score += 0.1;' } },
                  { id: 'spawn', libId: 'control_execute', params: { code: 'if(Math.random() < 0.02) { var type = Math.random() < 0.7 ? "obj_enemy" : "obj_item"; var inst = window.room_create(type, 300, 192); if(inst && type === "obj_enemy") { inst.spriteId = Math.random() < 0.5 ? "spr_cactus" : "spr_bat"; if(inst.spriteId === "spr_bat") inst.y = 140 + Math.random() * 40; } }' } }
              ],
              collision_enemy: [
                  { id: 'dmg', libId: 'combat_damage_iframe', params: { amt: 20, frames: 60, target: 'self' } },
                  { id: 'snd_hit', libId: 'main1_sound', params: { snd: 'snd_hit', loop: false } }
              ],
              collision_item: [
                  { id: 'get_coin', libId: 'score_set', params: { amt: 100, rel: true } },
                  { id: 'snd_coin', libId: 'main1_sound', params: { snd: 'snd_coin', loop: false } },
                  { id: 'del_coin', libId: 'main1_destroy_other', params: {} }
              ],
              other_no_health: [
                  { id: 'game_over', libId: 'main2_game_over', params: {} }
              ],
              other_no_lives: [
                  { id: 'game_over', libId: 'main2_game_over', params: {} }
              ],
              draw: [{ id: 'draw_me', libId: 'draw_self', params: {} }]
          };
          objEnemy.events = {
              create: [{ id: 'e_move', libId: 'move_fixed', params: { dir: 'left', spd: 6 } }],
              step: [{ id: 'e_die', libId: 'control_execute', params: { code: 'if(this.x < -50) this.dead = true;' } }],
              draw: [{ id: 'draw_me', libId: 'draw_self', params: {} }]
          };
          objItem.spriteId = 'spr_coin';
          objItem.events = {
              create: [{ id: 'i_move', libId: 'move_fixed', params: { dir: 'left', spd: 6 } }],
              step: [{ id: 'i_die', libId: 'control_execute', params: { code: 'if(this.x < -50) this.dead = true;' } }],
              draw: [{ id: 'draw_me', libId: 'draw_self', params: {} }]
          };
          room1.backgrounds[0] = { visible: true, foreground: false, source: 'bg_runner', tileH: true, tileV: true, stretch: false, x: 0, y: 0, hspeed: -2, vspeed: 0 };
      } else if (template === 'starter' || template === 'ai') {
          objPlayer.events = {
              create: [
                  { id: 'init_health', libId: 'health_set', params: { amt: 100, rel: false } },
                  { id: 'play_music', libId: 'main1_music_play', params: { snd: 'snd_music' } }
              ],
              step: [
                  { id: 'init_move', libId: 'move_keyboard', params: { spd: 2, jmp: 8 } },
                  { id: 'init_grav', libId: 'move_gravity', params: { amt: 0.5 } },
                  { id: 'shoot_check', libId: 'control_if_key', params: { key: 'x', press: true } },
                  { id: 'play_shoot', libId: 'main1_sound', params: { snd: 'snd_jump', loop: false } },
                  { id: 'spawn_bullet', libId: 'main1_create', params: { obj: 'obj_bullet', x: 0, y: 0, rel: true } }
              ],
              collision_item: [
                  { id: 'get_item', libId: 'score_set', params: { amt: 10, rel: true } },
                  { id: 'play_coin', libId: 'main1_sound', params: { snd: 'snd_coin', loop: false } },
                  { id: 'del_item', libId: 'main1_destroy_other', params: {} }
              ],
              collision_enemy: [
                  { id: 'play_hit', libId: 'main1_sound', params: { snd: 'snd_hit', loop: false } },
                  { id: 'take_dmg', libId: 'combat_damage_iframe', params: { amt: 10, frames: 60, target: 'self' } }
              ],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'play_snd', libId: 'main1_sound', params: { snd: 'snd_coin', loop: false } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'play_snd', libId: 'main1_sound', params: { snd: 'snd_coin', loop: false } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} }
              ]
          };
          objBullet.events = {
              create: [{ id: 'b_move', libId: 'move_fixed', params: { dir: 'right', spd: 4 } }],
              step: [{ id: 'b_wrap', libId: 'move_wrap', params: { mar: 32 } }],
              collision_enemy: [
                  { id: 'kill_enemy', libId: 'main1_destroy_other', params: {} },
                  { id: 'kill_self', libId: 'main1_destroy', params: { target: 'self' } },
                  { id: 'add_score', libId: 'score_set', params: { amt: 50, rel: true } }
              ]
          };
          objGoal.events = {
              collision_player: [
                  { id: 'win_menu', libId: 'control_execute', params: { code: 'window.isPaused = true; if (GAME_DATA.uiMenus) { const winMenu = GAME_DATA.uiMenus.find(m => m.id === "menu_win"); if (winMenu) winMenu.visible = true; }' } }
              ]
          };
          objEnemy.events = {
              create: [{ id: 'e_move', libId: 'move_fixed', params: { dir: 'left', spd: 1 } }],
              step: [{ id: 'e_bounce', libId: 'move_bounce', params: { pre: false } }]
          };
      } else if (template === 'shooter') {
          objPlayer.events = {
              create: [
                  { id: 'init_health', libId: 'health_set', params: { amt: 100, rel: false } }
              ],
              step: [
                  { id: 'init_move', libId: 'move_8way', params: { spd: 3 } },
                  { id: 'shoot_check', libId: 'control_if_key', params: { key: 'x', press: true } },
                  { id: 'spawn_bullet', libId: 'main1_create', params: { obj: 'obj_bullet', x: 0, y: 0, rel: true } }
              ],
              collision_enemy: [
                  { id: 'reduce_health', libId: 'combat_damage_iframe', params: { amt: 10, frames: 60, target: 'self' } }
              ],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} }
              ]
          };
          objBullet.events = {
              create: [{ id: 'b_move', libId: 'move_fixed', params: { dir: 'right', spd: 6 } }],
              step: [{ id: 'b_wrap', libId: 'move_wrap', params: { mar: 32 } }],
              collision_enemy: [
                  { id: 'kill_enemy', libId: 'main1_destroy_other', params: {} },
                  { id: 'kill_self', libId: 'main1_destroy', params: { target: 'self' } },
                  { id: 'add_score', libId: 'score_set', params: { amt: 100, rel: true } },
                  { id: 'check_win', libId: 'control_execute', params: { code: 'if (window.score >= 500) { window.isPaused = true; if (GAME_DATA.uiMenus) { const winMenu = GAME_DATA.uiMenus.find(m => m.id === "menu_win"); if (winMenu) winMenu.visible = true; } }' } }
              ]
          };
          objEnemy.events = {
              create: [{ id: 'e_move', libId: 'move_towards', params: { tx: 0, ty: 0, spd: 0.5 } }], // Will be updated in step to track player
              step: [
                  { id: 'track_player', libId: 'control_execute', params: { code: 'var p = window.instances.find(i => i.def.name === "obj_player"); if(p) { var angle = Math.atan2(p.y - this.y, p.x - this.x); this.dx = Math.cos(angle) * 0.8; this.dy = Math.sin(angle) * 0.8; }' } }
              ]
          };
      } else if (template === 'megaman') {
          objPlayer.events = {
              create: [
                  { id: 'init_health', libId: 'health_set', params: { amt: 100, rel: false } }
              ],
              step: [
                  { id: 'move', libId: 'move_keyboard', params: { spd: 2, jmp: 7 } },
                  { id: 'grav', libId: 'move_gravity', params: { amt: 0.4 } },
                  { id: 'shoot', libId: 'control_if_key', params: { key: 'x', press: true } },
                  { id: 'spawn_b', libId: 'combat_shoot', params: { obj: 'obj_bullet', spd: 5, xoff: 0, yoff: 0 } }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} }
              ],
              collision_enemy: [
                  { id: 'dmg', libId: 'combat_damage_iframe', params: { amt: 10, frames: 60, target: 'self' } }
              ],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ]
          };
          objBullet.events = {
              create: [{ id: 'b_move', libId: 'move_fixed', params: { dir: 'right', spd: 5 } }],
              step: [{ id: 'b_wrap', libId: 'move_wrap', params: { mar: 32 } }],
              collision_enemy: [
                  { id: 'dmg_e', libId: 'combat_damage', params: { amt: 50, target: 'other' } },
                  { id: 'add_score', libId: 'score_set', params: { amt: 10, rel: true } },
                  { id: 'check_win', libId: 'control_execute', params: { code: 'if (window.score >= 100) { window.isPaused = true; if (GAME_DATA.uiMenus) { const winMenu = GAME_DATA.uiMenus.find(m => m.id === "menu_win"); if (winMenu) winMenu.visible = true; } }' } },
                  { id: 'kill_b', libId: 'main1_destroy', params: { target: 'self' } }
              ]
          };
          objEnemy.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } },
                  { id: 'e_move', libId: 'move_fixed', params: { dir: 'left', spd: 1 } }
              ],
              step: [
                  { id: 'e_bounce', libId: 'move_bounce', params: { pre: false } },
                  { id: 'check_e_d', libId: 'control_test_var', params: { name: 'health', op: '<=', val: 0 } },
                  { id: 'kill_e', libId: 'main1_destroy', params: { target: 'self' } }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} },
                  { id: 'e_hp', libId: 'draw_healthbar', params: { w: 12, h: 2, yoff: -4 } }
              ]
          };
      } else if (template === 'fighter') {
          objPlayer.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } }
              ],
              step: [
                  { id: 'move', libId: 'move_keyboard', params: { spd: 3, jmp: 8 } },
                  { id: 'grav', libId: 'move_gravity', params: { amt: 0.5 } },
                  { id: 'punch', libId: 'control_if_key', params: { key: 'x', press: true } },
                  { id: 'spawn_p', libId: 'control_execute', params: { code: 'var bx = (this.facing === -1 ? -12 : 12); var p = window.room_create("obj_bullet", this.x + bx, this.y); if(p) p.owner = "player";' } }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} },
                  { id: 'hp_bar', libId: 'draw_healthbar', params: { w: 40, h: 4, yoff: -10 } }
              ],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ]
          };
          objBullet.events = { // Punch Hitbox
              create: [{ id: 'h_life', libId: 'main1_alarm', params: { id: 0, steps: 5 } }],
              alarm0: [{ id: 'h_die', libId: 'main1_destroy', params: { target: 'self' } }],
              collision_enemy: [
                  { id: 'dmg_e', libId: 'control_execute', params: { code: 'if(this.owner === "player") { if(other.invincible > 0) return; other.health -= 10; other.invincible = 20; if(other.health <= 0) other.dead = true; this.dead = true; }' } }
              ],
              collision_player: [
                  { id: 'dmg_p', libId: 'control_execute', params: { code: 'if(this.owner === "enemy") { if(other.invincible > 0) return; other.health -= 10; other.invincible = 30; if(other.health <= 0) other.dead = true; this.dead = true; }' } }
              ]
          };
          objEnemy.events = { // Player 2 (AI Fighter)
              create: [{ id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } }],
              step: [
                  { id: 'grav', libId: 'move_gravity', params: { amt: 0.5 } },
                  { id: 'ai', libId: 'control_execute', params: { code: 'var p = window.instances.find(i => i.def.name === "obj_player"); if(p) { if(Math.abs(p.x - this.x) > 32) { this.dx = (p.x > this.x ? 1.5 : -1.5); this.facing = (p.x > this.x ? 1 : -1); } else { this.dx = 0; if(Math.random() < 0.05) { var punch = window.room_create("obj_bullet", this.x + (p.x > this.x ? 12 : -12), this.y); if(punch) punch.owner = "enemy"; } } }' } },
                  { id: 'check_d', libId: 'control_test_var', params: { name: 'health', op: '<=', val: 0 } },
                  { id: 'win_menu', libId: 'control_execute', params: { code: 'if(this.health <= 0) { window.isPaused = true; if (GAME_DATA.uiMenus) { const winMenu = GAME_DATA.uiMenus.find(m => m.id === "menu_win"); if (winMenu) winMenu.visible = true; } }' } },
                  { id: 'die', libId: 'main1_destroy', params: { target: 'self' } }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} },
                  { id: 'hp_bar', libId: 'draw_healthbar', params: { w: 40, h: 4, yoff: -10 } }
              ]
          };

      } else if (template === 'hollowknight') {
          objPlayer.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } }
              ],
              step: [
                  { id: 'move', libId: 'move_keyboard', params: { spd: 3, jmp: 8 } },
                  { id: 'grav', libId: 'move_gravity', params: { amt: 0.5 } },
                  { id: 'attack', libId: 'control_if_key', params: { key: 'x', press: true } },
                  { id: 'spawn_h', libId: 'control_execute', params: { code: 'var bx = (this.facing === -1 ? -16 : 16); var n = window.room_create("obj_bullet", this.x + bx, this.y); if(n) n.owner = "player";' } }
              ],
              collision_enemy: [
                  { id: 'hit_p', libId: 'combat_damage_iframe', params: { amt: 10, frames: 60, target: 'self' } }
              ],
              collision_goal: [ // Boss
                  { id: 'hit_p_boss', libId: 'combat_damage_iframe', params: { amt: 20, frames: 60, target: 'self' } }
              ],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} }
              ]
          };
          objBullet.events = { // Nail Hitbox / Slash
              create: [{ id: 'h_life', libId: 'main1_alarm', params: { id: 0, steps: 5 } }],
              alarm0: [{ id: 'h_die', libId: 'main1_destroy', params: { target: 'self' } }],
              collision_enemy: [
                  { id: 'dmg_e', libId: 'control_execute', params: { code: 'if(this.owner === "player") { other.health -= 20; if(other.health <= 0) other.dead = true; this.dead = true; }' } }
              ],
              collision_player: [
                  { id: 'dmg_p', libId: 'control_execute', params: { code: 'if(this.owner === "boss") { other.health -= 10; if(other.health <= 0) other.dead = true; this.dead = true; }' } }
              ],
              collision_goal: [ // Boss is obj_goal
                  { id: 'dmg_b', libId: 'control_execute', params: { code: 'if(this.owner === "player") { if(other.invincible > 0) return; other.health -= 10; other.invincible = 20; if(other.health <= 0) other.dead = true; this.dead = true; }' } }
              ],
              draw: [
                  { id: 'draw_slash', libId: 'draw_rect', params: { x1: -8, y1: -4, x2: 8, y2: 4, col: '#FFFFFF', out: false, rel: true } }
              ]
          };
          objEnemy.events = { // Basic Enemy (Crawlid)
              create: [{ id: 'init_hp', libId: 'health_set', params: { amt: 40, rel: false } }],
              step: [
                  { id: 'grav', libId: 'move_gravity', params: { amt: 0.5 } },
                  { id: 'move', libId: 'move_fixed', params: { dir: 'left', spd: 1 } },
                  { id: 'bounce', libId: 'move_bounce', params: { pre: false } }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} },
                  { id: 'hp_bar', libId: 'draw_healthbar', params: { w: 12, h: 2, yoff: -4 } }
              ]
          };
          objGoal.events = { // Boss (False Knight)
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 300, rel: false } },
                  { id: 'size', libId: 'control_execute', params: { code: 'this.w = 32; this.h = 32;' } }
              ],
              step: [
                  { id: 'grav', libId: 'move_gravity', params: { amt: 0.5 } },
                  { id: 'ai', libId: 'control_execute', params: { code: 'var p = window.instances.find(i => i.def.name === "obj_player"); if(p) { if(Math.abs(p.x - this.x) > 48) { this.dx = (p.x > this.x ? 1.5 : -1.5); this.facing = (p.x > this.x ? 1 : -1); } else { this.dx = 0; if(Math.random() < 0.05) { var slash = window.room_create("obj_bullet", this.x + (p.x > this.x ? 24 : -24), this.y + 8); if(slash) { slash.owner = "boss"; slash.w = 24; slash.h = 24; } } } }' } },
                  { id: 'check_win', libId: 'control_execute', params: { code: 'if(this.health <= 0) { window.isPaused = true; if (GAME_DATA.uiMenus) { const winMenu = GAME_DATA.uiMenus.find(m => m.id === "menu_win"); if (winMenu) winMenu.visible = true; } }' } }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} },
                  { id: 'hp_bar', libId: 'draw_healthbar', params: { w: 48, h: 4, yoff: -10 } }
              ]
          };

          objDoor.events = {
              collision_player: [
                  { id: 'next_rm', libId: 'control_execute', params: { code: 'if(currentRoom.id === "rm_1") window.room_goto("rm_2"); else if(currentRoom.id === "rm_2") window.room_goto("rm_3"); else if(currentRoom.id === "rm_3") window.room_goto("rm_boss");' } }
              ]
          }

      } else if (template === 'maze') {
          objPlayer.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } },
                  { id: 'init_keys', libId: 'control_execute', params: { code: 'this.keys = 0;' } }
              ],
              step: [{ id: 'init_move', libId: 'move_8way', params: { spd: 2 } }],
              collision_key: [
                  { id: 'get_key', libId: 'control_execute', params: { code: 'this.keys++; other.dead = true;' } }
              ],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} }
              ]
          };
          objDoor.events = {
              collision_player: [
                  { id: 'check_key', libId: 'control_execute', params: { code: 'if(other.keys > 0) { other.keys--; this.dead = true; }' } }
              ]
          };
          objGoal.events = {
              collision_player: [
                  { id: 'win_menu', libId: 'control_execute', params: { code: 'window.isPaused = true; if (GAME_DATA.uiMenus) { const winMenu = GAME_DATA.uiMenus.find(m => m.id === "menu_win"); if (winMenu) winMenu.visible = true; }' } }
              ]
          };
      } else if (template === 'platformer_pro') {
          objPlayer.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } },
                  { id: 'init_vars', libId: 'control_execute', params: { code: 'this.jumps = 0; this.maxJumps = 2; this.dashTime = 0;' } }
              ],
              step: [
                  { id: 'move', libId: 'move_keyboard', params: { spd: 3, jmp: 8 } },
                  { id: 'grav', libId: 'move_gravity', params: { amt: 0.4 } },
                  { id: 'double_jump', libId: 'control_execute', params: { code: 'if((Input.keys["z"] || Input.keys["KeyZ"] || Input.keys["Space"]) && this.dy !== 0 && this.jumps < this.maxJumps) { this.dy = -7; this.jumps++; } if(this.dy === 0) this.jumps = 0;' } },
                  { id: 'dash', libId: 'control_execute', params: { code: 'if((Input.keys["x"] || Input.keys["KeyX"]) && this.dashTime <= 0) { this.dx *= 5; this.dashTime = 20; } if(this.dashTime > 0) this.dashTime--;' } }
              ],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} }
              ]
          };
          objEnemy.events = {
              create: [{ id: 'e_move', libId: 'move_fixed', params: { dir: 'left', spd: 1.5 } }],
              step: [{ id: 'e_bounce', libId: 'move_bounce', params: { pre: false } }]
          };
      } else if (template === 'rpg') {
          objPlayer.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } }
              ],
              step: [
                  { id: 'move', libId: 'move_8way', params: { spd: 2 } },
                  { id: 'interact', libId: 'control_if_key', params: { key: 'z', press: true } },
                  { id: 'check_npc', libId: 'control_execute', params: { code: 'var npc = window.instances.find(i => i.def.name === "obj_enemy" && Math.hypot(i.x - this.x, i.y - this.y) < 32); if(npc) { window.isPaused = true; window.ui.dialog = { text: "Welcome to the village!", speaker: "Villager", active: true }; }' } }
              ],
              collision_enemy: [],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} }
              ]
          };
          objEnemy.events = { // NPC
              create: [],
              step: [],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} },
                  { id: 'draw_hint', libId: 'draw_text', params: { text: 'Press Z to talk', x: 0, y: -10, rel: true } }
              ]
          };
      } else if (template === 'racing') {
          objPlayer.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } },
                  { id: 'init_vars', libId: 'control_execute', params: { code: 'this.angle = 0; this.speed = 0;' } }
              ],
              step: [
                  { id: 'drive', libId: 'control_execute', params: { code: 'if(Input.keys["ArrowUp"] || Input.keys["KeyW"] || Input.keys["w"] || Input.keys["Space"] || Input.keys["KeyZ"] || Input.keys["z"]) this.speed += 0.1; if(Input.keys["ArrowDown"] || Input.keys["KeyS"] || Input.keys["s"]) this.speed -= 0.05; this.speed *= 0.98; if(Input.keys["ArrowLeft"] || Input.keys["KeyA"] || Input.keys["a"]) this.angle -= 3; if(Input.keys["ArrowRight"] || Input.keys["KeyD"] || Input.keys["d"]) this.angle += 3; this.dx = Math.cos(this.angle * Math.PI / 180) * this.speed; this.dy = Math.sin(this.angle * Math.PI / 180) * this.speed;' } }
              ],
              collision_enemy: [
                  { id: 'dmg', libId: 'combat_damage_iframe', params: { amt: 20, frames: 60, target: 'self' } }
              ],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_sprite_ext', params: { spr: 'spr_player', x: 0, y: 0, sx: 1, sy: 1, rot: '=this.angle', alp: 1, rel: true } }
              ]
          };
      } else if (template === 'strategy') {
          objPlayer.events = {
              create: [
                  { id: 'init_vars', libId: 'control_execute', params: { code: 'this.gold = 100; this.timer = 0; this.health = 100; window.score = 100; window.lives = 3;' } }
              ],
              step: [
                  { id: 'step_castle', libId: 'control_execute', params: { code: 'this.timer++; if (this.timer % 30 === 0) { this.gold += 5; window.score = this.gold; } if (Input.keys["KeyZ"] || Input.keys["Space"]) { if (this.gold >= 30) { this.gold -= 30; window.score = this.gold; window.audio_play_sound("snd_coin"); let sol = engine.instanceCreate(this.x + 24, this.y + 8, "obj_bullet"); if(sol) { sol.dx = 2; sol.isFriendly = true; sol.hp = 30; sol.spriteId = "spr_skate"; } } Input.keys["KeyZ"] = false; Input.keys["Space"] = false; } if (window.coopEnabled && (Input.keys["KeyF"] || Input.keys["KeyG"])) { if (this.gold >= 30) { this.gold -= 30; window.score = this.gold; window.audio_play_sound("snd_coin"); let sol = engine.instanceCreate(this.x + 24, this.y + 16, "obj_bullet"); if(sol) { sol.dx = 2.5; sol.isFriendly = true; sol.hp = 40; sol.spriteId = "spr_player"; sol.image_blend = 0x55FF55; } } Input.keys["KeyF"] = false; Input.keys["KeyG"] = false; }' } }
              ],
              draw: [
                  { id: 'draw_castle', libId: 'control_execute', params: { code: 'let spr = window.GAME_DATA.sprites.find(s => s.id === "spr_goal"); if(spr && spr.src) { let img = new Image(); img.src = spr.src; engine.ctx.drawImage(img, this.x, this.y, 32, 32); } else { engine.ctx.fillStyle = "blue"; engine.ctx.fillRect(this.x, this.y, 32, 32); } engine.ctx.fillStyle = "#FFD700"; engine.ctx.font = "bold 8px monospace"; engine.ctx.fillText("GOLD: " + this.gold, this.x - 5, this.y - 12); engine.ctx.fillStyle = "#FF5555"; engine.ctx.fillText("HP: " + this.health, this.x - 5, this.y - 4); engine.ctx.fillStyle = "#FFFFFF"; engine.ctx.fillText(window.language === "ar" ? "Z: تدريب جندي (30G)" : "Z: Train Soldier (30G)", this.x - 20, this.y + 40); if (window.coopEnabled) { engine.ctx.fillStyle = "#55FF55"; engine.ctx.fillText(window.language === "ar" ? "F: تدريب جندي الأخضر" : "F: Train Green (30G)", this.x - 20, this.y + 48); }' } }
              ]
          };
          objEnemy.events = {
              create: [
                  { id: 'init_enemy', libId: 'control_execute', params: { code: 'this.timer = 0; this.health = 100;' } }
              ],
              step: [
                  { id: 'step_enemy_spawn', libId: 'control_execute', params: { code: 'this.timer++; if (this.timer % 90 === 0) { let orc = engine.instanceCreate(this.x - 24, this.y + 8, "obj_boss"); if(orc) { orc.dx = -1.5; orc.isFriendly = false; orc.hp = 20; } }' } }
              ],
              draw: [
                  { id: 'draw_enemy', libId: 'control_execute', params: { code: 'let spr = window.GAME_DATA.sprites.find(s => s.id === "spr_door"); if(spr && spr.src) { let img = new Image(); img.src = spr.src; engine.ctx.drawImage(img, this.x, this.y, 32, 32); } else { engine.ctx.fillStyle = "red"; engine.ctx.fillRect(this.x, this.y, 32, 32); } engine.ctx.fillStyle = "#FF5555"; engine.ctx.font = "bold 8px monospace"; engine.ctx.fillText("ENEMY HP: " + this.health, this.x - 10, this.y - 5);' } }
              ]
          };
          objBullet.events = {
              create: [
                  { id: 'init_soldier', libId: 'control_execute', params: { code: 'this.isFriendly = true; this.hp = 30; this.dx = 2;' } }
              ],
              step: [
                  { id: 'step_soldier', libId: 'control_execute', params: { code: 'let enemy = window.instances.find(i => i !== this && i.def.name === "obj_boss" && Math.abs(i.x - this.x) < 16); if (enemy) { this.dx = 0; enemy.hp -= 1; if(enemy.hp <= 0) enemy.dead = true; this.hp -= 0.5; if(this.hp <= 0) this.dead = true; } else { this.dx = 2; }' } }
              ],
              collision_enemy: [
                  { id: 'attack_castle', libId: 'control_execute', params: { code: 'other.health -= 10; this.dead = true; window.audio_play_sound("snd_hit"); if(other.health <= 0) { other.dead = true; window.isPaused = true; window.audio_play_sound("snd_jump"); window.ui.dialog = { text: window.language === "ar" ? "نصر مبين! لقد دمرت قلعة الأعداء بنجاح!" : "Victory! You have successfully destroyed the enemy castle!", speaker: window.language === "ar" ? "الفارس" : "Narrator", active: true }; setTimeout(() => { window.isPaused = false; window.room_goto("rm_menu"); }, 3000); }' } }
              ],
              draw: [
                  { id: 'draw_soldier', libId: 'control_execute', params: { code: 'let sprId = this.spriteId || "spr_skate"; let spr = window.GAME_DATA.sprites.find(s => s.id === sprId); if(spr && spr.src) { let img = new Image(); img.src = spr.src; engine.ctx.drawImage(img, this.x - 8, this.y - 8, 16, 16); } else { engine.ctx.fillStyle = "cyan"; engine.ctx.beginPath(); engine.ctx.arc(this.x, this.y, 6, 0, Math.PI*2); engine.ctx.fill(); } engine.ctx.fillStyle = "red"; engine.ctx.fillRect(this.x - 8, this.y - 12, 16, 2); engine.ctx.fillStyle = "green"; engine.ctx.fillRect(this.x - 8, this.y - 12, (this.hp / 30) * 16, 2);' } }
              ]
          };
          objBoss.events = {
              create: [
                  { id: 'init_orcs', libId: 'control_execute', params: { code: 'this.isFriendly = false; this.hp = 20; this.dx = -1.5;' } }
              ],
              step: [
                  { id: 'step_orcs', libId: 'control_execute', params: { code: 'let friendly = window.instances.find(i => i !== this && i.def.name === "obj_bullet" && Math.abs(i.x - this.x) < 16); if (friendly) { this.dx = 0; friendly.hp -= 1; if(friendly.hp <= 0) friendly.dead = true; this.hp -= 0.5; if(this.hp <= 0) this.dead = true; } else { this.dx = -1.5; }' } }
              ],
              collision_player: [
                  { id: 'attack_player_castle', libId: 'control_execute', params: { code: 'other.health -= 10; this.dead = true; window.audio_play_sound("snd_hit"); if(other.health <= 0) { other.dead = true; window.isPaused = true; window.audio_play_sound("snd_death"); window.ui.dialog = { text: window.language === "ar" ? "خسارة! لقد تم تدمير قلعتك بالكامل!" : "Defeat! Your castle has been completely destroyed!", speaker: window.language === "ar" ? "الحارس" : "Narrator", active: true }; setTimeout(() => { window.isPaused = false; window.room_goto("rm_menu"); }, 3000); }' } }
              ],
              draw: [
                  { id: 'draw_orc', libId: 'control_execute', params: { code: 'let spr = window.GAME_DATA.sprites.find(s => s.id === "spr_boss"); if(spr && spr.src) { let img = new Image(); img.src = spr.src; engine.ctx.drawImage(img, this.x - 8, this.y - 8, 16, 16); } else { engine.ctx.fillStyle = "orange"; engine.ctx.beginPath(); engine.ctx.arc(this.x, this.y, 6, 0, Math.PI*2); engine.ctx.fill(); } engine.ctx.fillStyle = "red"; engine.ctx.fillRect(this.x - 8, this.y - 12, 16, 2); engine.ctx.fillStyle = "orange"; engine.ctx.fillRect(this.x - 8, this.y - 12, (this.hp / 20) * 16, 2);' } }
              ]
          };
          objItem.events = {
              collision_player: [
                  { id: 'mine_gold', libId: 'control_execute', params: { code: 'other.gold += 100; this.dead = true; window.audio_play_sound("snd_coin");' } }
              ],
              draw: [
                  { id: 'draw_gold', libId: 'control_execute', params: { code: 'let spr = window.GAME_DATA.sprites.find(s => s.id === "spr_item"); if(spr && spr.src) { let img = new Image(); img.src = spr.src; engine.ctx.drawImage(img, this.x, this.y, 16, 16); } else { engine.ctx.fillStyle = "gold"; engine.ctx.fillRect(this.x, this.y, 16, 16); } engine.ctx.fillStyle = "#FFD700"; engine.ctx.font = "8px monospace"; engine.ctx.fillText(window.language === "ar" ? "منجم ذهب" : "GOLD MINE", this.x - 10, this.y - 4);' } }
              ]
          };
      } else if (template === 'arcade') {
          objPlayer.events = {
              create: [
                  { id: 'init_paddle', libId: 'control_execute', params: { code: 'this.x = 128; this.y = 220; window.score = 0; window.lives = 3; if (window.coopEnabled && !this.isP2) { this.playerIndex = 0; let p2 = engine.instanceCreate(this.x + 48, this.y, "obj_player"); if(p2) { p2.isP2 = true; p2.playerIndex = 1; } }' } }
              ],
              step: [
                  { id: 'step_paddle', libId: 'control_execute', params: { code: 'if (this.playerIndex === 1 || this.isP2) { if (Input.keys["KeyA"] || Input.keys["a"]) this.x = Math.max(24, this.x - 5); if (Input.keys["KeyD"] || Input.keys["d"]) this.x = Math.min(232, this.x + 5); } else { if (Input.keys["ArrowLeft"]) this.x = Math.max(24, this.x - 5); if (Input.keys["ArrowRight"]) this.x = Math.min(232, this.x + 5); }' } }
              ],
              draw: [
                  { id: 'draw_paddle', libId: 'control_execute', params: { code: 'let isP2 = this.playerIndex === 1 || this.isP2; engine.ctx.fillStyle = isP2 ? "#55FF55" : "#00FFFF"; engine.ctx.fillRect(this.x - 24, this.y - 4, 48, 8); engine.ctx.strokeStyle = "#FFFFFF"; engine.ctx.strokeRect(this.x - 24, this.y - 4, 48, 8);' } }
              ]
          };
          objBullet.events = {
              create: [
                  { id: 'init_ball', libId: 'control_execute', params: { code: 'this.x = 128; this.y = 150; this.dx = 2; this.dy = -3;' } }
              ],
              step: [
                  { id: 'step_ball', libId: 'control_execute', params: { code: 'this.x += this.dx; this.y += this.dy; if(this.x < 8 || this.x > 248) { this.dx *= -1; window.audio_play_sound("snd_hit"); } if(this.y < 8) { this.dy *= -1; window.audio_play_sound("snd_hit"); } if(this.y > 240) { window.lives--; window.audio_play_sound("snd_death"); if(window.lives <= 0) { window.room_goto("rm_menu"); } else { this.x = 128; this.y = 150; this.dy = -3; this.dx = (Math.random() > 0.5 ? 2 : -2); } }' } }
              ],
              collision_player: [
                  { id: 'bounce_paddle', libId: 'control_execute', params: { code: 'this.dy = -Math.abs(this.dy); this.dx = (this.x - other.x) * 0.25; window.audio_play_sound("snd_jump");' } }
              ],
              collision_enemy: [
                  { id: 'hit_brick', libId: 'control_execute', params: { code: 'this.dy *= -1; other.dead = true; window.score += 10; window.audio_play_sound("snd_coin"); let bricksLeft = window.instances.filter(i => i.def.name === "obj_enemy" && !i.dead && i !== other).length; if(bricksLeft <= 0) { window.isPaused = true; window.audio_play_sound("snd_jump"); window.ui.dialog = { text: window.language === "ar" ? "رائع! لقد تغلبت على جميع العقبات وفزت باللعبة!" : "Superb! You cleared all bricks and won the game!", speaker: "System", active: true }; setTimeout(() => { window.isPaused = false; window.room_goto("rm_menu"); }, 3000); }' } }
              ],
              draw: [
                  { id: 'draw_ball', libId: 'control_execute', params: { code: 'engine.ctx.fillStyle = "#FFFFFF"; engine.ctx.beginPath(); engine.ctx.arc(this.x, this.y, 4, 0, Math.PI*2); engine.ctx.fill(); engine.ctx.strokeStyle = "rgba(255,255,255,0.5)"; engine.ctx.beginPath(); engine.ctx.arc(this.x, this.y, 6, 0, Math.PI*2); engine.ctx.stroke();' } }
              ]
          };
          objEnemy.events = {
              create: [],
              step: [],
              draw: [
                  { id: 'draw_brick', libId: 'control_execute', params: { code: 'let spr = window.GAME_DATA.sprites.find(s => s.id === "spr_enemy"); if(spr && spr.src) { let img = new Image(); img.src = spr.src; engine.ctx.drawImage(img, this.x - 12, this.y - 6, 24, 12); } else { engine.ctx.fillStyle = "red"; engine.ctx.fillRect(this.x - 12, this.y - 6, 24, 12); }' } }
              ]
          };
      } else if (template === 'sonic') {
          objPlayer.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } },
                  { id: 'init_vars', libId: 'control_execute', params: { code: 'this.speed = 0; this.maxSpeed = 12; this.accel = 0.2; this.rings = 0;' } }
              ],
              step: [
                  { id: 'move', libId: 'control_execute', params: { code: 'if(Input.keys["ArrowRight"] || Input.keys["KeyD"] || Input.keys["d"]) this.speed += this.accel; else if(Input.keys["ArrowLeft"] || Input.keys["KeyA"] || Input.keys["a"]) this.speed -= this.accel; else this.speed *= 0.95; this.speed = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.speed)); this.dx = this.speed; if((Input.keys["z"] || Input.keys["KeyZ"] || Input.keys["Space"]) && this.dy === 0) this.dy = -10;' } },
                  { id: 'grav', libId: 'move_gravity', params: { amt: 0.5 } }
              ],
              collision_item: [
                  { id: 'get_ring', libId: 'control_execute', params: { code: 'this.rings++; other.dead = true;' } }
              ],
              collision_enemy: [
                  { id: 'dmg', libId: 'combat_damage_iframe', params: { amt: 10, frames: 60, target: 'self' } }
              ],
              collision_health: [
                  { id: 'get_hp', libId: 'health_set', params: { amt: 25, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              collision_life: [
                  { id: 'get_life', libId: 'lives_set', params: { amt: 1, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} }
              ]
          };
      } else if (template === 'adventure_island') {
          objPlayer.events = {
              create: [
                  { id: 'init_hp', libId: 'health_set', params: { amt: 100, rel: false } },
                  { id: 'init_vars', libId: 'control_execute', params: { code: 'this.speed = 0; this.maxSpeed = 4; this.accel = 0.5; this.jumpForce = -10; this.gravity = 0.5; this.vspeed = 0; this.grounded = false; this.facing = 1; this.axeCooldown = 0; this.fruitTimer = 1000; this.hasSkateboard = false;' } }
              ],
              step: [
                  { id: 'step_logic', libId: 'control_execute', params: { code: 'if(this.axeCooldown > 0) this.axeCooldown--; this.fruitTimer--; if(this.fruitTimer <= 0) { this.dead = true; window.room_goto("rm_menu"); }\n\nif (Input.keys["ArrowRight"] || Input.keys["KeyD"]) { this.speed += this.accel; this.facing = 1; } else if (Input.keys["ArrowLeft"] || Input.keys["KeyA"]) { this.speed -= this.accel; this.facing = -1; } else { this.speed *= 0.8; }\nif (this.hasSkateboard && Math.abs(this.speed) < 2) this.speed = 2 * this.facing;\nif (this.speed > this.maxSpeed) this.speed = this.maxSpeed;\nif (this.speed < -this.maxSpeed) this.speed = -this.maxSpeed;\n\nthis.vspeed += this.gravity;\nthis.dx = this.speed;\nthis.dy = this.vspeed;\n\nif ((Input.keys["ArrowUp"] || Input.keys["KeyW"]) && this.grounded) {\n  this.dy = this.jumpForce;\n  this.grounded = false;\n}\n\nif ((Input.keys["Space"] || Input.keys["KeyZ"]) && this.axeCooldown <= 0) {\n  let axe = engine.instanceCreate(this.x + this.facing * 16, this.y, "obj_bullet");\n  if (axe) {\n    axe.dx = this.facing * 6;\n    axe.dy = -4;\n    axe.gravity = 0.4;\n  }\n  this.axeCooldown = 20;\n}' } },
                  { id: 'col_check', libId: 'control_execute', params: { code: 'this.grounded = engine.placeMeeting(this.x, this.y + 1, "obj_wall");' } }
              ],
              collision_enemy: [
                  { id: 'dmg', libId: 'control_execute', params: { code: 'if (this.hasSkateboard) { this.hasSkateboard = false; this.maxSpeed = 4; this.accel = 0.5; this.dy = -5; this.dx = -this.facing * 5; other.dead = true; } else { this.dead = true; window.room_goto("rm_menu"); }' } }
              ],
              collision_item: [
                  { id: 'col_fruit', libId: 'control_execute', params: { code: 'this.fruitTimer = Math.min(1000, this.fruitTimer + 200); other.dead = true;' } }
              ],
              draw: [
                  { id: 'draw_me', libId: 'draw_self', params: {} },
                  { id: 'draw_timer', libId: 'control_execute', params: { code: 'engine.ctx.fillStyle = "white"; engine.ctx.font = "10px Arial"; engine.ctx.fillText("Fruit: " + Math.floor(this.fruitTimer/10), this.x - 10, this.y - 15);' } }
              ]
          };

          objBullet.events = {
              create: [
                  { id: 'init_axe', libId: 'control_execute', params: { code: 'this.gravity = 0.4; this.dx = 0; this.dy = 0;' } }
              ],
              step: [
                  { id: 'step_axe', libId: 'control_execute', params: { code: 'this.dy += this.gravity; if (this.y > 600) this.dead = true;' } }
              ],
              collision_enemy: [
                  { id: 'axe_hit', libId: 'control_execute', params: { code: 'other.dead = true; this.dead = true;' } }
              ]
          };

          objEnemy.events = {
              create: [
                  { id: 'init_enemy', libId: 'control_execute', params: { code: 'this.dx = -1.5;' } }
              ],
              step: [
                  { id: 'step_enemy', libId: 'control_execute', params: { code: 'if (engine.placeMeeting(this.x + Math.sign(this.dx), this.y, "obj_wall")) { this.dx *= -1; }' } }
              ]
          };

          objBoss.events = {
              create: [
                  { id: 'init_boss', libId: 'control_execute', params: { code: 'this.hp = 10; this.dx = -2; this.timer = 0;' } }
              ],
              step: [
                  { id: 'step_boss', libId: 'control_execute', params: { code: 'this.timer++; if (this.timer % 60 === 0) { this.dx *= -1; } if (this.timer % 90 === 0) { let proj = engine.instanceCreate(this.x, this.y, "obj_enemy"); if (proj) proj.dx = -3; }' } }
              ],
              collision_bullet: [
                  { id: 'boss_hit', libId: 'control_execute', params: { code: 'this.hp--; other.dead = true; if (this.hp <= 0) { this.dead = true; window.isPaused = true; window.alert("You Win!"); window.loadRoom("rm_menu"); }' } }
              ]
          };

          objSkateboard.events = {
              collision_player: [
                  { id: 'get_skate', libId: 'control_execute', params: { code: 'other.hasSkateboard = true; other.maxSpeed = 6; other.accel = 0.8; this.dead = true;' } }
              ]
          };

          objDoor.events = {
              collision_player: [
                  { id: 'next_rm', libId: 'control_execute', params: { code: 'if(currentRoom.id === "rm_1") window.room_goto("rm_2"); else if(currentRoom.id === "rm_2") window.room_goto("rm_3"); else if(currentRoom.id === "rm_3") window.room_goto("rm_boss");' } }
              ]
          };

          objItem.events = {
              step: [
                  { id: 'fruit_anim', libId: 'control_execute', params: { code: 'this.y += Math.sin(engine.frameCount * 0.1) * 0.5;' } }
              ]
          };
      } else if (template === 'first_person' || template === 'third_person' || template === 'vr') {
          objPlayer.events = {
              create: [
                  { id: 'init_health', libId: 'health_set', params: { amt: 100, rel: false } }
              ],
              step: [
                  { id: 'move', libId: 'move_8way', params: { spd: 4 } }
              ],
              collision_enemy: [
                  { id: 'reduce_health', libId: 'combat_damage_iframe', params: { amt: 10, frames: 60, target: 'self' } }
              ],
              collision_item: [
                  { id: 'get_score', libId: 'score_set', params: { amt: 100, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ]
          };
      } else if (template === 'top_down' || template === 'ar' || template === 'handheld_ar') {
          objPlayer.events = {
              create: [
                  { id: 'init_health', libId: 'health_set', params: { amt: 100, rel: false } }
              ],
              step: [
                  { id: 'move', libId: 'move_8way', params: { spd: 3 } }
              ],
              collision_enemy: [
                  { id: 'reduce_health', libId: 'combat_damage_iframe', params: { amt: 10, frames: 60, target: 'self' } }
              ],
              collision_item: [
                  { id: 'get_score', libId: 'score_set', params: { amt: 100, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ]
          };
      } else if (template === 'vehicle') {
          objPlayer.events = {
              create: [
                  { id: 'init_health', libId: 'health_set', params: { amt: 100, rel: false } },
                  { id: 'init_vars', libId: 'control_execute', params: { code: 'this.speed = 0; this.maxSpeed = 8; this.accel = 0.1; this.angle = 0;' } }
              ],
              step: [
                  { id: 'move', libId: 'control_execute', params: { code: 'if(Input.keys["ArrowUp"] || Input.keys["KeyW"] || Input.keys["w"] || Input.keys["Space"] || Input.keys["KeyZ"] || Input.keys["z"]) this.speed += this.accel; else if(Input.keys["ArrowDown"] || Input.keys["KeyS"] || Input.keys["s"]) this.speed -= this.accel; else this.speed *= 0.95; this.speed = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.speed)); if(Math.abs(this.speed) > 0.1) { if(Input.keys["ArrowLeft"] || Input.keys["KeyA"] || Input.keys["a"]) this.angle -= 3; if(Input.keys["ArrowRight"] || Input.keys["KeyD"] || Input.keys["d"]) this.angle += 3; } this.dx = Math.cos(this.angle * Math.PI / 180) * this.speed; this.dy = Math.sin(this.angle * Math.PI / 180) * this.speed;' } }
              ],
              collision_enemy: [
                  { id: 'reduce_health', libId: 'combat_damage_iframe', params: { amt: 10, frames: 60, target: 'self' } }
              ],
              collision_item: [
                  { id: 'get_score', libId: 'score_set', params: { amt: 100, rel: true } },
                  { id: 'del_other', libId: 'main1_destroy_other', params: {} }
              ]
          };
      }

      const initObjects = [objPlayer, objEnemy, objItem, objGoal, objBullet, objKey, objDoor, objHealth, objLife, objMenuCtrl, objBoss, objSkateboard];

      if (template === 'runner') {
          // Floor
          for(let x=0; x<w; x++) initialMap[(h-1)*w + x] = 1;
          for(let x=0; x<w; x++) initialMap[(h-2)*w + x] = 1;

          initialMap[(h-3)*w + 2] = 2; // Player
      } else if (template === 'starter' || template === 'ai') {
          // Floor
          for(let x=0; x<w; x++) initialMap[(h-1)*w + x] = 1;
          // Platforms
          for(let x=4; x<8; x++) initialMap[(h-4)*w + x] = 1;
          for(let x=10; x<14; x++) initialMap[(h-7)*w + x] = 1;
          for(let x=2; x<6; x++) initialMap[(h-10)*w + x] = 1;

          initialMap[(h-2)*w + 1] = 2; // Player
          initialMap[(h-5)*w + 6] = 4; // Item
          initialMap[(h-8)*w + 12] = 4; // Item
          initialMap[(h-11)*w + 3] = 5; // Goal
          initialMap[(h-2)*w + 10] = 3; // Enemy

          if (template === 'ai' && assets.map) {
              for(let i=0; i<Math.min(initialMap.length, assets.map.length); i++) initialMap[i] = assets.map[i];
          }
      } else if (template === 'shooter') {
          initialMap[7*w + 2] = 2; // Player
          initialMap[2*w + 13] = 3; // Enemy
          initialMap[12*w + 13] = 3; // Enemy
          initialMap[7*w + 14] = 3; // Enemy
      } else if (template === 'maze') {
          // Complex maze
          for(let x=0; x<w; x++) { initialMap[0*w+x]=1; initialMap[(h-1)*w+x]=1; }
          for(let y=0; y<h; y++) { initialMap[y*w+0]=1; initialMap[y*w+(w-1)]=1; }

          // Internal walls
          for(let y=2; y<6; y++) initialMap[y*w+4]=1;
          for(let x=4; x<10; x++) initialMap[6*w+x]=1;
          for(let y=6; y<12; y++) initialMap[y*w+10]=1;
          for(let x=2; x<8; x++) initialMap[10*w+x]=1;

          initialMap[1*w+1] = 2; // Player
          initialMap[13*w+1] = 5; // Goal
          initialMap[5*w+13] = 7; // Key (objKey is index 5 in initObjects, so map ID is 5 + 2 = 7)
          initialMap[12*w+1] = 8; // Door (objDoor is index 6 in initObjects, so map ID is 6 + 2 = 8)
          initialMap[5*w+13] = 7; // Key
      } else if (template === 'megaman') {
          for(let x=0; x<w; x++) initialMap[(h-1)*w + x] = 1; // Floor
          for(let y=0; y<h; y++) { initialMap[y*w+0]=1; initialMap[y*w+(w-1)]=1; } // Walls
          initialMap[(h-2)*w + 2] = 2; // Player
          initialMap[(h-2)*w + 10] = 3; // Enemy
          initialMap[(h-6)*w + 5] = 1; // Platform
          initialMap[(h-6)*w + 6] = 1;
          initialMap[(h-6)*w + 7] = 1;
          initialMap[(h-7)*w + 6] = 3; // Enemy on platform
      } else if (template === 'fighter') {
          for(let x=0; x<w; x++) initialMap[(h-1)*w + x] = 1; // Floor
          for(let y=0; y<h; y++) { initialMap[y*w+0]=1; initialMap[y*w+(w-1)]=1; } // Walls
          initialMap[(h-2)*w + 4] = 2; // Player
          initialMap[(h-2)*w + 11] = 3; // AI Enemy
      } else if (template === 'hollowknight') {
          // Room 1: Entrance
          for(let x=0; x<w; x++) initialMap[(h-1)*w + x] = 1;
          for(let y=0; y<h; y++) { initialMap[y*w+0]=1; initialMap[y*w+(w-1)]=1; }
          initialMap[(h-2)*w + 2] = 2; // Player
          initialMap[(h-2)*w + 13] = 8; // Door to Room 2
          for(let x=4; x<8; x++) initialMap[(h-4)*w + x] = 1;
      } else if (template === 'platformer_pro') {
          for(let x=0; x<w; x++) initialMap[(h-1)*w + x] = 1;
          initialMap[(h-2)*w + 2] = 2;
          initialMap[(h-5)*w + 8] = 1;
          initialMap[(h-8)*w + 4] = 1;
      } else if (template === 'rpg') {
          initialMap[7*w + 7] = 2; // Player
          initialMap[5*w + 5] = 3; // NPC
          initialMap[10*w + 10] = 4; // Item
      } else if (template === 'racing') {
          initialMap[7*w + 2] = 2; // Player
      } else if (template === 'sonic') {
          for(let x=0; x<w; x++) initialMap[(h-1)*w + x] = 1;
          initialMap[(h-2)*w + 2] = 2;
      } else if (template === 'adventure_island') {
          for(let x=0; x<w; x++) initialMap[(h-1)*w + x] = 1;
          initialMap[(h-2)*w + 2] = 2; // Player
          initialMap[(h-2)*w + 14] = 8; // Door to Room 2
          initialMap[(h-2)*w + 10] = 3; // Enemy
          initialMap[(h-3)*w + 5] = 4; // Fruit
          initialMap[(h-3)*w + 6] = 4; // Fruit
          initialMap[(h-4)*w + 8] = 4; // Fruit
      } else if (template === 'first_person' || template === 'third_person' || template === 'vr') {
          for(let x=0; x<w; x++) { initialMap[x] = 1; initialMap[(h-1)*w + x] = 1; }
          for(let y=0; y<h; y++) { initialMap[y*w] = 1; initialMap[y*w + w-1] = 1; }
          initialMap[7*w + 7] = 2; // Player
          initialMap[5*w + 5] = 3; // Enemy
          initialMap[10*w + 10] = 4; // Item
      } else if (template === 'top_down' || template === 'ar' || template === 'handheld_ar' || template === 'vehicle') {
          initialMap[7*w + 7] = 2; // Player
          initialMap[5*w + 5] = 3; // Enemy
          initialMap[10*w + 10] = 4; // Item
      } else if (template === 'strategy') {
          for(let x=0; x<w; x++) initialMap[(h-1)*w + x] = 1; // Base floor
          initialMap[(h-3)*w + 1] = 2; // Player Castle
          initialMap[(h-3)*w + 14] = 3; // Enemy Castle
          initialMap[(h-2)*w + 7] = 4; // Gold Mine Item
          initialMap[(h-2)*w + 8] = 4; // Gold Mine Item
      } else if (template === 'arcade') {
          // Borders (solid wall is index 1)
          for(let x=0; x<w; x++) initialMap[0*w + x] = 1;
          for(let y=0; y<h; y++) {
              initialMap[y*w + 0] = 1;
              initialMap[y*w + (w-1)] = 1;
          }
          // Bricks (obj_enemy is map ID 3)
          for(let x=2; x<w-2; x++) {
              initialMap[3*w + x] = 3;
              initialMap[4*w + x] = 3;
              initialMap[5*w + x] = 3;
          }
          initialMap[13*w + 8] = 2; // Paddle (objPlayer)
          initialMap[10*w + 8] = 6; // Ball (objBullet is index 4, so map ID is 4+2=6)
      }

      let room2Map = [...initialMap];
      if (template === 'hollowknight') {
          room2Map = new Array(w*h).fill(0);
          for(let x=0; x<w; x++) room2Map[(h-1)*w + x] = 1;
          for(let y=0; y<h; y++) { room2Map[y*w+0]=1; room2Map[y*w+(w-1)]=1; }
          room2Map[(h-2)*w + 2] = 2; // Player
          room2Map[(h-2)*w + 13] = 8; // Door to Room 3
          room2Map[10*w+5]=1; room2Map[10*w+6]=1; room2Map[10*w+7]=1;
          room2Map[9*w+6]=3; // Enemy
      } else if (template === 'adventure_island') {
          room2Map = new Array(w*h).fill(0);
          for(let x=0; x<w; x++) room2Map[(h-1)*w + x] = 1;
          room2Map[(h-2)*w + 2] = 2; // Player
          room2Map[(h-2)*w + 14] = 8; // Door to Room 3
          room2Map[(h-2)*w + 8] = 13; // Skateboard
          room2Map[(h-2)*w + 10] = 3; // Enemy
          room2Map[(h-3)*w + 5] = 4; // Fruit
      }
      const room2: RoomData = { ...room1, id: 'rm_2', map: room2Map, settings: { ...room1.settings, name: 'room2', caption: template === 'adventure_island' ? 'Stage 2' : 'Greenpath' } };

      let room3Map = [...initialMap];
      if (template === 'hollowknight') {
          room3Map = new Array(w*h).fill(0);
          for(let x=0; x<w; x++) room3Map[(h-1)*w + x] = 1;
          for(let y=0; y<h; y++) { room3Map[y*w+0]=1; room3Map[y*w+(w-1)]=1; }
          room3Map[(h-2)*w + 2] = 2; // Player
          room3Map[(h-2)*w + 13] = 8; // Door to Boss
          room3Map[12*w+8]=3; room3Map[12*w+10]=3;
      } else if (template === 'adventure_island') {
          room3Map = new Array(w*h).fill(0);
          for(let x=0; x<w; x++) room3Map[(h-1)*w + x] = 1;
          room3Map[(h-2)*w + 2] = 2; // Player
          room3Map[(h-2)*w + 14] = 8; // Door to Boss
          room3Map[(h-2)*w + 7] = 3; // Enemy
          room3Map[(h-2)*w + 11] = 3; // Enemy
          room3Map[(h-3)*w + 4] = 4; // Fruit
          room3Map[(h-4)*w + 9] = 4; // Fruit
      }
      const room3: RoomData = { ...room1, id: 'rm_3', map: room3Map, settings: { ...room1.settings, name: 'room3', caption: template === 'adventure_island' ? 'Stage 3' : 'Fungal Wastes' } };

      let roomBossMap = [...initialMap];
      if (template === 'hollowknight') {
          roomBossMap = new Array(w*h).fill(0);
          for(let x=0; x<w; x++) roomBossMap[(h-1)*w + x] = 1;
          for(let y=0; y<h; y++) { roomBossMap[y*w+0]=1; roomBossMap[y*w+(w-1)]=1; }
          roomBossMap[(h-2)*w + 2] = 2; // Player
          roomBossMap[(h-2)*w + 12] = 5; // Boss (objGoal)
      } else if (template === 'adventure_island') {
          roomBossMap = new Array(w*h).fill(0);
          for(let x=0; x<w; x++) roomBossMap[(h-1)*w + x] = 1;
          roomBossMap[(h-2)*w + 2] = 2; // Player
          roomBossMap[(h-2)*w + 13] = 12; // Boss
      }
      const roomBoss: RoomData = { ...room1, id: 'rm_boss', map: roomBossMap, settings: { ...room1.settings, name: 'rm_boss', caption: template === 'adventure_island' ? 'Boss Stage' : 'False Knight' } };


      const initUIMenus: UIMenu[] = [
          {
              id: 'menu_main',
              name: 'Main Menu',
              visible: true,
              elements: [
                  { id: 'm_title', name: 'Title', type: 'text', x: 60, y: 40, w: 200, h: 20, visible: true, text: '=(window.language === "ar" ? "لعبتي الكلاسيكية" : "MY RETRO GAME")' },
                  { id: 'm_play', name: 'Play Btn', type: 'button', x: 70, y: 100, w: 120, h: 30, visible: true, text: '=(window.language === "ar" ? "العب" : "PLAY")', action: 'window.loadRoom("rm_1"); GAME_DATA.uiMenus.find(m=>m.id==="menu_main").visible=false;' },
                  { id: 'm_settings', name: 'Settings Btn', type: 'button', x: 70, y: 140, w: 120, h: 30, visible: true, text: '=(window.language === "ar" ? "الاعدادات" : "SETTINGS")', action: 'GAME_DATA.uiMenus.find(m=>m.id==="menu_main").visible=false; GAME_DATA.uiMenus.find(m=>m.id==="menu_settings").visible=true;' },
                  { id: 'm_controls', name: 'Controls Btn', type: 'button', x: 70, y: 180, w: 120, h: 30, visible: true, text: '=(window.language === "ar" ? "التحكم" : "CONTROLS")', action: 'GAME_DATA.uiMenus.find(m=>m.id==="menu_main").visible=false; GAME_DATA.uiMenus.find(m=>m.id==="menu_controls").visible=true;' },
                  { id: 'm_credits', name: 'Credits Btn', type: 'button', x: 70, y: 220, w: 120, h: 30, visible: true, text: '=(window.language === "ar" ? "الفريق" : "CREDITS")', action: 'GAME_DATA.uiMenus.find(m=>m.id==="menu_main").visible=false; GAME_DATA.uiMenus.find(m=>m.id==="menu_credits").visible=true;' }
              ]
          },
          {
              id: 'menu_settings',
              name: 'Settings',
              visible: false,
              elements: [
                  { id: 's_title', name: 'Title', type: 'text', x: 80, y: 30, w: 160, h: 20, visible: true, text: '=(window.language === "ar" ? "الاعدادات" : "SETTINGS")' },
                  { id: 's_sound', name: 'Sound Toggle', type: 'button', x: 50, y: 65, w: 160, h: 25, visible: true, text: '=(window.language === "ar" ? "الصوت: " + (window.soundEnabled ? "مفعل" : "معطل") : "SOUND: " + (window.soundEnabled ? "ON" : "OFF"))', action: 'window.soundEnabled = !window.soundEnabled; if (!window.soundEnabled) window.stopMusic();' },
                  { id: 's_coop', name: 'Coop Toggle', type: 'button', x: 50, y: 100, w: 160, h: 25, visible: true, text: '=(window.language === "ar" ? "اللعب المشترك: " + (window.coopEnabled ? "مفعل" : "معطل") : "CO-OP (2P): " + (window.coopEnabled ? "ON" : "OFF"))', action: 'window.coopEnabled = !window.coopEnabled;' },
                  { id: 's_lang', name: 'Lang Toggle', type: 'button', x: 50, y: 135, w: 160, h: 25, visible: true, text: '=(window.language === "ar" ? "اللغة: العربية" : "LANG: ENGLISH")', action: 'window.language = window.language === "ar" ? "en" : "ar";' },
                  { id: 's_back', name: 'Back Btn', type: 'button', x: 50, y: 175, w: 160, h: 25, visible: true, text: '=(window.language === "ar" ? "رجوع" : "BACK")', action: 'GAME_DATA.uiMenus.find(m=>m.id==="menu_settings").visible=false; GAME_DATA.uiMenus.find(m=>m.id==="menu_main").visible=true;' }
              ]
          },
          {
              id: 'menu_credits',
              name: 'Credits',
              visible: false,
              elements: [
                  { id: 'c_title', name: 'Title', type: 'text', x: 80, y: 40, w: 160, h: 20, visible: true, text: '=(window.language === "ar" ? "الفريق" : "CREDITS")' },
                  { id: 'c_text', name: 'Credits', type: 'text', x: 50, y: 80, w: 200, h: 100, visible: true, text: '=(window.language === "ar" ? "صنع بواسطة nor game maker game maker" : "MADE BY nor game maker game maker")' },
                  { id: 'c_back', name: 'Back Btn', type: 'button', x: 50, y: 180, w: 160, h: 30, visible: true, text: '=(window.language === "ar" ? "رجوع" : "BACK")', action: 'GAME_DATA.uiMenus.find(m=>m.id==="menu_credits").visible=false; GAME_DATA.uiMenus.find(m=>m.id==="menu_main").visible=true;' }
              ]
          },
          {
              id: 'menu_controls',
              name: 'Controls',
              visible: false,
              elements: [
                  { id: 'ct_title', name: 'Title', type: 'text', x: 80, y: 30, w: 160, h: 20, visible: true, text: '=(window.language === "ar" ? "التحكم" : "CONTROLS")' },
                  { id: 'ct_text', name: 'Controls', type: 'text', x: 20, y: 65, w: 220, h: 100, visible: true, text: '=(window.language === "ar" ? "اللاعب 1 (P1): الأسهم\\n- Z/Space: قفز / إطلاق\\nاللاعب 2 (P2): WASD\\n- F: قفز, G: إطلاق\\nP: إيقاف مؤقت" : "P1: Arrow Keys to Move\\n- Z / Space: Jump / Action\\nP2: WASD Keys to Move\\n- F: Jump, G: Shoot\\nP: Pause")' },
                  { id: 'ct_back', name: 'Back Btn', type: 'button', x: 50, y: 175, w: 160, h: 25, visible: true, text: '=(window.language === "ar" ? "رجوع" : "BACK")', action: 'GAME_DATA.uiMenus.find(m=>m.id==="menu_controls").visible=false; GAME_DATA.uiMenus.find(m=>m.id==="menu_main").visible=true;' }
              ]
          },
          {
              id: 'menu_pause',
              name: 'Pause Menu',
              visible: false,
              elements: [
                  { id: 'p_title', name: 'Title', type: 'text', x: 80, y: 80, w: 120, h: 20, visible: true, text: '=(window.language === "ar" ? "توقف مؤقت" : "PAUSED")' },
                  { id: 'p_resume', name: 'Resume Btn', type: 'button', x: 70, y: 120, w: 120, h: 30, visible: true, text: '=(window.language === "ar" ? "استئناف" : "RESUME")', action: 'window.isPaused = false; GAME_DATA.uiMenus.find(m=>m.id==="menu_pause").visible=false;' }
              ]
          },
          {
              id: 'menu_win',
              name: 'Level Complete',
              visible: false,
              elements: [
                  { id: 'w_title', name: 'Title', type: 'text', x: 40, y: 80, w: 160, h: 20, visible: true, text: '=(window.language === "ar" ? "اكتملت المرحلة!" : "LEVEL COMPLETE!")' },
                  { id: 'w_score', name: 'Score', type: 'text', x: 60, y: 120, w: 120, h: 20, visible: true, text: '=(window.language === "ar" ? "النتيجة: " + window.score : "SCORE: " + window.score)' },
                  { id: 'w_next', name: 'Next Btn', type: 'button', x: 70, y: 160, w: 120, h: 30, visible: true, text: '=(window.language === "ar" ? "التالي" : "NEXT")', action: 'window.loadRoom("rm_menu"); GAME_DATA.uiMenus.find(m=>m.id==="menu_win").visible=false; GAME_DATA.uiMenus.find(m=>m.id==="menu_main").visible=true;' }
              ]
          },
          {
              id: 'menu_hud',
              name: 'HUD',
              visible: true,
              elements: [
                  { id: 'h_score', name: 'Score Text', type: 'text', x: 8, y: 8, w: 100, h: 10, visible: true, text: '=(window.language === "ar" ? "النتيجة: " + window.score.toString().padStart(6, "0") : "SCORE: " + window.score.toString().padStart(6, "0"))' },
                  { id: 'h_lives', name: 'Lives Text', type: 'text', x: 8, y: 20, w: 100, h: 10, visible: true, text: '=(window.language === "ar" ? "المحاولات: " + window.lives : "LIVES: " + window.lives)' },
                  { id: 'h_health_label', name: 'Health Label', type: 'text', x: 8, y: 32, w: 50, h: 10, visible: true, text: '=(window.language === "ar" ? "الصحة: " : "HEALTH: ")' },
                  { id: 'h_health_bar', name: 'Health Bar', type: 'bar', x: 60, y: 32, w: 50, h: 4, visible: true, barColor: 'green', barValue: 'window.instances.find(i => i.def.name.toLowerCase().includes("player"))?.health || 0' }
              ]
          },
          {
              id: 'menu_lose',
              name: 'Game Over',
              visible: false,
              elements: [
                  { id: 'l_title', name: 'Title', type: 'text', x: 60, y: 80, w: 120, h: 20, visible: true, text: '=(window.language === "ar" ? "نهاية اللعبة" : "GAME OVER")' },
                  { id: 'l_restart', name: 'Restart Btn', type: 'button', x: 70, y: 140, w: 120, h: 30, visible: true, text: '=(window.language === "ar" ? "إعادة المحاولة" : "RETRY")', action: 'if(window.restartRoom) window.restartRoom(); else window.resetGame(); GAME_DATA.uiMenus.find(m=>m.id==="menu_lose").visible=false;' }
              ]
          }
      ];

      // Showcase template uses createShowcaseTemplate for objects
      const showcaseObjects = template === 'showcase' ? createShowcaseTemplate() : initObjects;

      return {
          sprites: initSprites,
          sounds: initSounds,
          objects: template === 'showcase' ? showcaseObjects : initObjects,
          rooms: (template === 'hollowknight' || template === 'adventure_island') ? [roomMenu, room1, room2, room3, roomBoss] : [roomMenu, room1],
          map: menuMap,
          width: w, height: h,
          roomSettings: roomMenu.settings,
          backgrounds: roomMenu.backgrounds,
          views: roomMenu.views,
          uiMenus: initUIMenus,
          backgroundAssets: initBackgrounds
      };
  };

  const handleGenerate = async (forceLocal: boolean = false) => {
    if (!prompt.trim() && !selectedImage) return;
    try {
      setState(AppState.GENERATING_CONCEPTS);
      const project = await geminiService.generateGameProjectData(prompt, ACTION_LIBRARY, selectedImage || undefined, forceLocal);

      if (!project || typeof project !== 'object') {
          throw new Error("AI returned invalid project data structure");
      }

      const { metadata } = project;
      if (!metadata) {
          throw new Error("Game metadata is missing from AI response");
      }

      setState(AppState.GENERATING_ART);
      const boxArtUrl = await geminiService.generateBoxArt(metadata.title || "Untitled Game", metadata.story || "");

      setState(AppState.GENERATING_ASSETS);
      // Generate sprites based on AI prompts
      const spritesToGenerate = Array.isArray(project.sprites) ? project.sprites : [];
      const spritePromises = spritesToGenerate.map(async (s: any) => {
          try {
              const src = await geminiService.generatePixelAsset(s.prompt || "pixel art", s.role || "object");
              return { ...s, src };
          } catch (e) {
              console.warn("Failed to generate sprite:", s.id, e);
              return { ...s, src: null };
          }
      });
      const generatedSprites = await Promise.all(spritePromises);

      setState(AppState.GENERATING_CODE);

      // Map AI rooms to RoomData
      const roomsToMap = Array.isArray(project.rooms) ? project.rooms : [];
      const mappedRooms: RoomData[] = roomsToMap.map((r: any) => ({
          ...r,
          id: r.id || `rm_${Math.random().toString(36).substr(2, 9)}`,
          width: r.width || 16,
          height: r.height || 15,
          map: Array.isArray(r.map) ? r.map : Array(240).fill(0),
          backgrounds: Array(8).fill(null).map(() => ({ visible: false, foreground: false, source: null, tileH: true, tileV: true, stretch: false, x: 0, y: 0, hspeed: 0, vspeed: 0 })),
          views: Array(8).fill(null).map(() => ({ visible: false, viewX: 0, viewY: 0, viewW: 256, viewH: 240, portX: 0, portY: 0, portW: 256, portH: 240, followObj: 'obj_player', hBorder: 32, vBorder: 32, hSpeed: -1, vSpeed: -1 })),
          settings: {
              name: r.settings?.name || 'room',
              caption: r.settings?.caption || 'Level',
              speed: 30, persistent: false, clearView: true, creationCode: '', tileAnimSpeed: 250, enableViews: false,
              bgColor: r.settings?.bgColor || '#C0C0C0', drawBgColor: true
          }
      }));

      if (mappedRooms.length === 0) {
          throw new Error("No rooms were generated for the game");
      }

      // Initialize State
      setSprites(generatedSprites);

      const rawObjects = Array.isArray(project.objects) ? project.objects : [];

      // Normalize Game Objects: solid mapping and collision event key normalization
      const objectsToSet = rawObjects.map((obj: any) => {
          // 1. Auto-detect solid objects
          const associatedSprite = generatedSprites.find((s: any) => s.id === obj.spriteId);
          const isSolidByName = /ground|floor|wall|brick|block|plat/i.test(obj.name || '') || /ground|floor|wall|brick|block|plat/i.test(obj.id || '');
          const isSolidBySpriteRole = associatedSprite && (associatedSprite.role === 'ground' || associatedSprite.role === 'wall');
          const isSolid = obj.solid === true || isSolidByName || isSolidBySpriteRole;

          // 2. Normalize event keys (e.g., collision_enemy -> collision_obj_enemy)
          const normalizedEvents: any = {};
          if (obj.events) {
              Object.keys(obj.events).forEach(key => {
                  let normalizedKey = key;
                  if (key.startsWith('collision_')) {
                      const targetName = key.replace('collision_', '');
                      // Search for an object ID match or name match to align event keys to real object IDs
                      const otherObj = rawObjects.find((o: any) =>
                          o.id === targetName ||
                          o.id === 'obj_' + targetName ||
                          o.name === targetName ||
                          o.name === 'obj_' + targetName ||
                          (o.spriteId && (o.spriteId === targetName || o.spriteId === 'spr_' + targetName))
                      );
                      if (otherObj) {
                          normalizedKey = 'collision_' + otherObj.id;
                      }
                  }
                  normalizedEvents[normalizedKey] = obj.events[key];
              });
          }

          return {
              ...obj,
              solid: !!isSolid,
              events: normalizedEvents
          };
      });

      setGameObjects(objectsToSet);
      setRooms(mappedRooms);
      setActiveRoomId(mappedRooms[0].id);
      setLevelMap(mappedRooms[0].map);
      setRoomConfig({ width: mappedRooms[0].width, height: mappedRooms[0].height });
      setRoomSettings(mappedRooms[0].settings);
      setBackgrounds(mappedRooms[0].backgrounds);
      setViews(mappedRooms[0].views);
      setRoomViewMode(mappedRooms[0].viewMode || '2d');
      setIsoMap(mappedRooms[0].isoMap || []);
      setScene3D(mappedRooms[0].scene3D || []);

      const generatedUIMenus = Array.isArray(project.uiMenus) && project.uiMenus.length > 0 ? project.uiMenus : getInitialData('blank').uiMenus;
      setUiMenus(generatedUIMenus);

      setBackgroundAssets([]); setSoundAssets([]); setFontAssets([]); setScripts([]); setUndoStack([]); setRedoStack([]);

      // Compile Events to Code Strings
      const eventCodeMap: any = {};
      objectsToSet.forEach((obj: any) => {
          const objEvents: any = {};
          if (obj.events) {
              Object.keys(obj.events).forEach(key => {
                  const evt = key as EventType;
                  const actions = obj.events[evt];
                  if (Array.isArray(actions) && actions.length > 0) {
                      objEvents[evt] = actions.map((a: any) => {
                          if (!a) return "";
                          return generateActionCode(a, EXTERNAL_ACTIONS);
                      }).filter(Boolean).join('\n');
                  }
              });
          }
          eventCodeMap[obj.id] = objEvents;
      });

      // Create Engine HTML
      const engineHTML = geminiService.createEngineHTML({
          assets: { sprites: generatedSprites, backgrounds: [], sounds: [], fonts: [] },
          rooms: mappedRooms,
          scripts: [],
          gameObjects: objectsToSet,
          objectEvents: eventCodeMap,
          uiMenus: generatedUIMenus,
          extensions: []
      });

      setGameData({ metadata, assemblyCode: "; AI Generated", boxArtUrl, webPrototype: engineHTML, uiMenus: generatedUIMenus });

      setState(AppState.COMPLETED);
      openWindow('runner', 'game', 'Game Runner');
    } catch (err: any) {
      console.error("Generation failed:", err);
      setState(AppState.ERROR);
      const errorMessage = err?.message || String(err);
      window.alert("Generation failed: " + errorMessage);
    }
  };

  const handleCreateOffline = (template: 'runner' | 'starter' | 'blank' | 'shooter' | 'maze' | 'megaman' | 'fighter' | 'platformer_pro' | 'rpg' | 'racing' | 'sonic' | 'adventure_island' | 'hollowknight' | 'first_person' | 'third_person' | 'top_down' | 'vehicle' | 'ar' | 'vr' | 'handheld_ar' | 'showcase' | 'strategy' | 'arcade') => {
      const assets = getStandaloneAssets();
      const initData = getInitialData(template, assets);

      // Update State
      setSprites(initData.sprites);
      setGameObjects(initData.objects);
      setRooms(initData.rooms);
      setActiveRoomId(initData.rooms[0].id);
      setLevelMap(initData.map);
      setRoomConfig({ width: initData.width, height: initData.height });
      setRoomSettings(initData.roomSettings);
      setBackgrounds(initData.backgrounds);
      setViews(initData.views);
      setRoomViewMode('2d');
      setIsoMap([]);
      setScene3D([]);
      setModel3DAssets([]);
      setUiMenus(initData.uiMenus);
      setBackgroundAssets(initData.backgroundAssets || []); setSoundAssets(initData.sounds); setFontAssets([]); setScripts([]); setUndoStack([]); setRedoStack([]);

      // Compile Events to Code Strings from GameObjects
      const eventCodeMap: any = {};
      initData.objects.forEach(obj => {
          const objEvents: any = {};
          Object.keys(obj.events).forEach(key => {
              const evt = key as EventType;
              const actions = obj.events[evt];
              if (actions && actions.length > 0) {
                  objEvents[evt] = actions.map(a => generateActionCode(a, EXTERNAL_ACTIONS)).join('\n');
              }
          });
          eventCodeMap[obj.id] = objEvents;
      });

      // Create Engine HTML using the local data immediately (React state update is async)
      const engineHTML = geminiService.createEngineHTML({
          assets: { sprites: initData.sprites, backgrounds: [], sounds: initData.sounds, fonts: [] },
          rooms: initData.rooms,
          scripts: [],
          gameObjects: initData.objects,
          objectEvents: eventCodeMap,
          uiMenus: initData.uiMenus,
          extensions: []
      });
      setGameData({ metadata: { title: "New Project", story: "Manual", genre: "Platformer", controls: "Arrows, Z, X", languages: ['en'], defaultLanguage: 'en' }, assemblyCode: "; Manual", boxArtUrl: null, webPrototype: engineHTML, uiMenus: initData.uiMenus });
      setOpenWindows([
          ...(initData.rooms.length > 0 ? [{ id: `room_${initData.rooms[0].id}`, type: 'room' as const, targetId: initData.rooms[0].id, title: `Room: ${initData.rooms[0].id}`, minimized: false }] : []),
          { id: 'runner_game', type: 'runner' as const, targetId: 'game', title: 'Game Runner', minimized: false }
      ]);
      setState(AppState.COMPLETED);
  };

  const handleUpdateGame = () => {
      if (!gameData) return;
      // Do not update/recompile legacy projects as they lack project source data
      if (gameData.metadata.story === "Legacy (Play Only)") return;

      setIsUpdating(true);
      try {
          const nextRooms = saveCurrentRoomState();

          setTimeout(() => {
              try {
                  // Compile Events to Code Strings from GameObjects
                  const eventCodeMap: any = {};

                  gameObjects.forEach(obj => {
                      const objEvents: any = {};
                      if (obj.events) {
                          Object.keys(obj.events).forEach(key => {
                              const evt = key as EventType;
                              const actions = obj.events[evt];
                              if (Array.isArray(actions) && actions.length > 0) {
                                  objEvents[evt] = actions.map(a => {
                                      if (!a) return "";
                                      return generateActionCode(a, EXTERNAL_ACTIONS);
                                  }).filter(Boolean).join('\n');
                              }
                          });
                      }
                      eventCodeMap[obj.id] = objEvents;
                  });

                  // Re-generate full HTML
                  const fullHTML = geminiService.createEngineHTML({
                      assets: { sprites, backgrounds: backgroundAssets, sounds: soundAssets, fonts: fontAssets },
                      rooms: nextRooms,
                      scripts,
                      gameObjects,
                      objectEvents: eventCodeMap,
                      uiMenus: uiMenus,
                      extensions: enabledExtensions
                  });

                  setGameData({ ...gameData, webPrototype: fullHTML });
                  setIsUpdating(false);
                  openWindow('runner', 'game', 'Game Runner');
              } catch (innerErr: any) {
                  console.error("Compilation error:", innerErr);
                  window.alert("Failed to update game: " + innerErr.message);
                  setIsUpdating(false);
              }
          }, 400);
      } catch (err: any) {
          console.error("Update error:", err);
          window.alert("Error updating game: " + err.message);
          setIsUpdating(false);
      }
  };
  const handleApplyAnalyzerFix = (fixed: ProjectSnapshot) => {
      setSprites(fixed.sprites);
      setBackgroundAssets(fixed.backgroundAssets);
      setSoundAssets(fixed.soundAssets);
      setFontAssets(fixed.fontAssets);
      setScripts(fixed.scripts);
      setGameObjects(fixed.gameObjects);
      if (fixed.rooms.length > 0) {
          setRooms(fixed.rooms);
          const firstRoom = fixed.rooms.find(r => r.id === activeRoomId) || fixed.rooms[0];
          setActiveRoomId(firstRoom.id);
          setLevelMap(Array.isArray(firstRoom.map) ? firstRoom.map : new Array(firstRoom.width * firstRoom.height).fill(0));
          setRoomConfig({ width: firstRoom.width, height: firstRoom.height });
          setRoomSettings(firstRoom.settings);
          setBackgrounds(firstRoom.backgrounds);
          setViews(firstRoom.views);
      }
      setUiMenus(fixed.uiMenus);
      setEnabledExtensions(fixed.enabledExtensions);
  };

  const handleSpriteSave = (img: string, id: string, fw?: number, fh?: number) => { setSprites(prev => prev.map(s => s.id===id ? {...s, src: img, frameWidth: fw, frameHeight: fh} : s)); };
  const handleSpriteModel3DChange = (id: string, model: { name: string; format: 'glb' | 'gltf' | 'obj'; data: string; activeAnimation?: string; animationNames?: string[] } | null) => {
    setSprites(prev => prev.map(s => s.id === id ? { ...s, model3d: model || undefined } : s));
  };
  const handleSpriteRoleChange = (role: string, id: string) => { setSprites(prev => prev.map(s => s.id===id ? {...s, role: role as SpriteAsset['role']} : s)); };
  const handleImportFramesFromSheet = (frames: Array<{ name: string; src: string }>) => {
    const newSprites: SpriteAsset[] = frames.map((f, i) => ({
      id: `spr_sheet_${Date.now()}_${i}`,
      name: f.name,
      src: f.src,
      role: 'decoration' as SpriteAsset['role'],
    }));
    setSprites(prev => [...prev, ...newSprites]);
    // Select first imported sprite
    if (newSprites.length > 0) {
      setSelectedSpriteId(newSprites[0].id);
    }
    window.alert(`✅ تم استيراد ${newSprites.length} sprite(s) من الـ Sprite Sheet!`);
  };
  const handleBgSave = (img: string, id: string) => { setBackgroundAssets(prev => prev.map(b => b.id===id ? {...b, src: img} : b)); };
  const handleThemeChange = (themeId: string) => { const theme = THEME_PRESETS.find(t => t.id === themeId); if (theme) { setCurrentTheme(themeId); applyTheme(theme); } };

  // Close menu on scroll or click outside to prevent "floating" fixed menus
  useEffect(() => {
    const handleClose = () => setOpenMenu(null);
    const menuBar = document.getElementById('main-menu-bar');
    const toolBar = document.getElementById('main-tool-bar');

    window.addEventListener('click', handleClose);
    menuBar?.addEventListener('scroll', handleClose);
    toolBar?.addEventListener('scroll', handleClose);

    return () => {
      window.removeEventListener('click', handleClose);
      menuBar?.removeEventListener('scroll', handleClose);
      toolBar?.removeEventListener('scroll', handleClose);
    };
  }, [openMenu]);

  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { try { const theme = JSON.parse(ev.target?.result as string) as Theme; if (theme.colors && theme.name) { applyTheme(theme); window.alert(`Theme "${theme.name}" loaded!`); } } catch(err) { window.alert("Invalid theme JSON"); } }; reader.readAsText(file); e.target.value = ''; };
  const handleVoiceInput = () => { if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { window.alert("Speech API not supported"); return; } if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; } const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; const recognition = new SpeechRecognition(); recognitionRef.current = recognition; recognition.lang = 'ar-SA'; recognition.onstart = () => setIsListening(true); recognition.onend = () => setIsListening(false); recognition.onresult = (e: any) => setPrompt(prev => prev + ' ' + e.results[0][0].transcript); recognition.start(); };
    // --- PERSISTENCE ---
    useEffect(() => {
        const saved = localStorage.getItem('nor_maker_project');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setSprites(data.sprites || []);
                setGameObjects(data.gameObjects || []);
                setRooms(data.rooms || []);
                setUiMenus(data.uiMenus || []);
                setGameData(data.gameData || null);
                if (data.rooms && data.rooms.length > 0) {
                    const firstRoom = data.rooms[0];
                    setActiveRoomId(firstRoom.id);
                    setLevelMap(Array.isArray(firstRoom.map) ? firstRoom.map : new Array(firstRoom.width * firstRoom.height).fill(0));
                    setRoomConfig({ width: firstRoom.width, height: firstRoom.height });
                    setRoomSettings(firstRoom.settings);
                    setBackgrounds(firstRoom.backgrounds);
                    setViews(firstRoom.views);
                    setState(AppState.COMPLETED);
                }
            } catch (e) { console.error("Failed to load saved project", e); }
        }
    }, []);

    useEffect(() => {
        if (state !== AppState.COMPLETED || !gameData) return;
        scheduleSave(
            {
                sprites,
                backgroundAssets,
                soundAssets,
                fontAssets,
                scripts,
                gameObjects,
                rooms: getUpdatedRooms(),
                uiMenus,
                enabledExtensions,
                gameData,
                savedAt: Date.now()
            },
            (ts) => setAutoSavedAt(ts)
        );
    }, [sprites, backgroundAssets, soundAssets, fontAssets, scripts, gameObjects,
        rooms, gameData, levelMap, roomSettings, backgrounds, views, uiMenus, enabledExtensions]);

    const handleResetProject = () => {
        localStorage.removeItem('nor_maker_project');
        clearDraft();
        history.clearHistory();
        setAutoSavedAt(null);
        setGameData(null); setState(AppState.IDLE); setOpenWindows([]); setPrompt(''); setShowConfirmNew(false); setSidebarOpen(false); setSprites([]); setRooms([]); setBackgroundAssets([]); setSoundAssets([]); setScripts([]); setGameObjects([]); setUiMenus([]); setModel3DAssets([]);
    };

  const handleExport = async (format: 'nes' | 'nor' | 'pnor' | 'html' | 'j2me' | 'gbc' | 'apk' | 'win' | 'esp32') => {
      if (!gameData) return;
      saveCurrentRoomState();
      const currentRooms = rooms.map(r => r.id === activeRoomId ? {
          ...r,
          map: levelMap, width: roomConfig.width, height: roomConfig.height,
          settings: roomSettings, layers: roomLayers, backgrounds: backgrounds, views: views,
          viewMode: roomViewMode, isoMap: isoMap, scene3D: scene3D
      } : r);
      const projectData = {
          metadata: gameData.metadata,
          sprites, backgrounds: backgroundAssets, sounds: soundAssets, fonts: fontAssets,
          scripts, rooms: currentRooms, gameObjects, stamps, uiMenus,
          extensions: enabledExtensions, model3DAssets
      };
      const name = gameData.metadata.title.replace(/\s+/g, '_');
      let blob;
      try {
        if (format === 'pnor') blob = new Blob([createPnorPackage(gameData.metadata.title, gameData.webPrototype, projectData)], {type: 'text/plain'});
        else if (format === 'nor') {
            const norJson = exportToNor(gameData.metadata, sprites, soundAssets, currentRooms, gameObjects);
            blob = new Blob([norJson], { type: 'application/json' });
        }
        else if (format === 'nes') {
            setState(AppState.GENERATING_CODE);
            try {
                const { rom, warnings } = await compileToNES({ sprites, rooms: currentRooms, gameObjects, metadata: gameData.metadata });
                blob = new Blob([rom as any], { type: 'application/octet-stream' });
            } finally { setState(AppState.COMPLETED); }
        }
        else if (format === 'gbc') {
            setState(AppState.GENERATING_CODE);
            try {
                const { rom, warnings } = await compileToGBC({ sprites, rooms: currentRooms, gameObjects, metadata: gameData.metadata });
                blob = new Blob([rom as any], { type: 'application/octet-stream' });
            } finally { setState(AppState.COMPLETED); }
        }
        else if (format === 'html') {
            const eventCodeMapExport: Record<string, any> = {};
            gameObjects.forEach(obj => {
                const objEvents: Record<string, string> = {};
                if (obj.events) {
                    Object.entries(obj.events).forEach(([evt, actions]) => {
                        if (Array.isArray(actions) && actions.length > 0) {
                            objEvents[evt] = actions.map(a => a ? generateActionCode(a, EXTERNAL_ACTIONS) : '').filter(Boolean).join('\n');
                        }
                    });
                }
                eventCodeMapExport[obj.id] = objEvents;
            });
            const freshHTML = geminiService.createEngineHTML({
                assets: { sprites, backgrounds: backgroundAssets, sounds: soundAssets, fonts: fontAssets },
                rooms: currentRooms, scripts, gameObjects, objectEvents: eventCodeMapExport, uiMenus, extensions: enabledExtensions
            });
            blob = new Blob([freshHTML], {type: 'text/html'});
        }
        else if (format === 'j2me') {
            setState(AppState.GENERATING_CODE);
            const javaCode = await geminiService.generateJavaCode(gameData.metadata.title, levelMap, roomConfig.width);
            const { jar } = await createJ2MEPackage(gameData.metadata.title, "NorMaker", javaCode, { icon: sprites[0]?.src });
            blob = jar;
            setState(AppState.COMPLETED);
        }
        else if (format === 'esp32') {
            setState(AppState.GENERATING_CODE);
            try {
                blob = await exportToESP32Sketch(gameData.metadata, sprites, currentRooms, gameObjects);
            } finally {
                setState(AppState.COMPLETED);
            }
        }
        else if (format === 'apk') {
            if (gameData) {
                openWindow('android_export', 'main', 'Android Export Settings');
            }
            return; // Intercept and show modal
        }
        else if (format === 'win') {
            setState(AppState.GENERATING_CODE);
            const eventCodeMapExport: Record<string, any> = {};
            gameObjects.forEach(obj => {
                const objEvents: Record<string, string> = {};
                if (obj.events) {
                    Object.entries(obj.events).forEach(([evt, actions]) => {
                        if (Array.isArray(actions) && actions.length > 0) {
                            objEvents[evt] = actions.map(a => a ? generateActionCode(a, EXTERNAL_ACTIONS) : '').filter(Boolean).join('\n');
                        }
                    });
                }
                eventCodeMapExport[obj.id] = objEvents;
            });
            const freshHTML = geminiService.createEngineHTML({
                assets: { sprites, backgrounds: backgroundAssets, sounds: soundAssets, fonts: fontAssets },
                rooms: currentRooms, scripts, gameObjects, objectEvents: eventCodeMapExport, uiMenus, extensions: enabledExtensions
            });
            blob = await createWindowsPackage(gameData.metadata.title, freshHTML, gameData.metadata.iconUrl);
            setState(AppState.COMPLETED);
        }
        if (blob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            let ext = format === 'j2me' ? 'jar' : (format === 'gbc' ? 'gbc' : (format as string) === 'apk' ? 'apk' : format === 'esp32' ? 'zip' : format);
            if (format === 'win') {
                ext = blob.type === 'application/zip' ? 'zip' : 'exe';
            }
            a.download = `${name}.${ext}`;
            a.click();
        }
      } catch (e) { window.alert("Export failed: " + e); setState(AppState.COMPLETED); }
  };

  const doAndroidExport = async (settings: import('./types').AndroidExportSettings) => {
      if (!gameData) return;

      // Save settings to gameData metadata
      setGameData({
          ...gameData,
          metadata: { ...gameData.metadata, androidExportSettings: settings }
      });

      setState(AppState.GENERATING_CODE);
      try {
          const currentRooms = rooms.map(r => r.id === activeRoomId ? {
              ...r,
              map: levelMap, width: roomConfig.width, height: roomConfig.height,
              settings: roomSettings, backgrounds: backgrounds, views: views,
              viewMode: roomViewMode, isoMap: isoMap, scene3D: scene3D
          } : r);

          const eventCodeMapExport: Record<string, any> = {};
          gameObjects.forEach(obj => {
              const objEvents: Record<string, string> = {};
              if (obj.events) {
                  Object.entries(obj.events).forEach(([evt, actions]) => {
                      if (Array.isArray(actions) && actions.length > 0) {
                          objEvents[evt] = actions.map(a => a ? generateActionCode(a, EXTERNAL_ACTIONS) : '').filter(Boolean).join('\n');
                      }
                  });
              }
              eventCodeMapExport[obj.id] = objEvents;
          });
          const freshHTML = geminiService.createEngineHTML({
              assets: { sprites, backgrounds: backgroundAssets, sounds: soundAssets, fonts: fontAssets },
              rooms: currentRooms, scripts, gameObjects, objectEvents: eventCodeMapExport, uiMenus, extensions: enabledExtensions
          });
          const { createAPK } = await import('./utils/apkPackager');
          const blob = await createAPK(gameData.metadata.title, freshHTML, gameData.metadata.iconUrl, settings);

          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${gameData.metadata.title || 'NORGame'}.apk`;
          a.click();
      } catch (e) {
          window.alert("Android Export failed: " + e);
      } finally {
          setState(AppState.COMPLETED);
          closeWindow('android_export');
      }
  };

  /** Download the standalone NOR Player HTML so users can play .nor files offline */
  const handleDownloadNorPlayer = async () => {
    try {
        const res  = await fetch('/nor-player.html');
        const text = await res.text();
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(new Blob([text], { type: 'text/html' }));
        a.download = 'nor-player.html';
        a.click();
    } catch(e) {
        window.alert('Could not download NOR Player: ' + e);
    }
  };

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    const otherFiles = files.filter(f => !f.type.startsWith('image/') && !f.type.startsWith('audio/'));

    // Handle Images
    if (imageFiles.length > 0) {
      const newSprites: SpriteAsset[] = [];
      let processed = 0;
      imageFiles.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          const name = file.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_');
          newSprites.push({ id: `spr_${Date.now()}_${idx}`, name, src, role: 'decoration' });
          processed++;
          if (processed === imageFiles.length) {
            setSprites(prev => [...prev, ...newSprites]);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Handle Audio
    if (audioFiles.length > 0) {
      const newSounds: SoundAsset[] = [];
      let processed = 0;
      audioFiles.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          const name = file.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_');
          newSounds.push({ id: `snd_${Date.now()}_${idx}`, name, src });
          processed++;
          if (processed === audioFiles.length) {
            setSoundAssets(prev => [...prev, ...newSounds]);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    for (const file of otherFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'nor' || ext === 'pnor') {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const content = ev.target?.result as string;
            if (!content) return;
            const pkg = parseNorPackage(content);
            if (pkg) {
              if (pkg.project) {
                setSprites(pkg.project.sprites || []);
                setBackgroundAssets(pkg.project.backgrounds || []);
                setSoundAssets(pkg.project.sounds || []);
                setFontAssets(pkg.project.fonts || []);
                setScripts(pkg.project.scripts || []);
                setRooms(pkg.project.rooms || []);
                setGameObjects(pkg.project.gameObjects || []);
                setUiMenus(pkg.project.uiMenus || []);
                setEnabledExtensions(pkg.project.extensions || []);

                const meta = pkg.project.metadata || { title: pkg.meta.title, story: "Loaded", genre: "Retro", controls: "Z/X" };

                if (pkg.project.rooms && pkg.project.rooms.length > 0) {
                  const r = pkg.project.rooms[0];
                  setActiveRoomId(r.id);
                  setLevelMap(r.map);
                  setRoomConfig({ width: r.width, height: r.height });
                  setRoomSettings(r.settings);
                  setBackgrounds(r.backgrounds);
                  setViews(r.views);
                  setRoomViewMode(r.viewMode || '2d');
                  setIsoMap(r.isoMap || []);
                  setScene3D(r.scene3D || []);
                }

                setGameData({ metadata: { ...{ languages: ['en'], defaultLanguage: 'en' }, ...meta }, assemblyCode: ";", boxArtUrl: null, webPrototype: pkg.payload, uiMenus: pkg.project.uiMenus || [] });
              } else {
                setGameData({ metadata: { title: pkg.meta.title, story: "Legacy (Play Only)", genre: "Retro", controls: "Z/X", languages: ['en'], defaultLanguage: 'en' }, assemblyCode: ";", boxArtUrl: null, webPrototype: pkg.payload, uiMenus: [] });
              }
              setState(AppState.COMPLETED);
              openWindow('runner', 'game', 'Game Runner');
            }
          } catch (err: any) {
            console.error("Load project error:", err);
            window.alert("Failed to load project: " + err.message);
          }
        };
        reader.readAsText(file);
      } else if (ext === 'gmk') {
        // Create a synthetic event to pass to handleOpenGmk
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        const synthEvent = { target: { files: dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleOpenGmk(synthEvent);
      }
    }
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const content = ev.target?.result as string;
              if (!content) return;
              const pkg = parseNorPackage(content);
              if (pkg) {
                  // Restore Project State if available
                  if (pkg.project) {
                      setSprites(pkg.project.sprites || []);
                      setBackgroundAssets(pkg.project.backgrounds || []);
                      setSoundAssets(pkg.project.sounds || []);
                      setFontAssets(pkg.project.fonts || []);
                      setScripts(pkg.project.scripts || []);
                      setRooms(pkg.project.rooms || []);
                      setGameObjects(pkg.project.gameObjects || []);
                      setUiMenus(pkg.project.uiMenus || []);
                      setEnabledExtensions(pkg.project.extensions || []);

                      // Restore Metadata
                      const meta = pkg.project.metadata || { title: pkg.meta.title, story: "Loaded", genre: "Retro", controls: "Z/X" };

                      // Set Active Room if exists
                      if (pkg.project.rooms && pkg.project.rooms.length > 0) {
                          const r = pkg.project.rooms[0];
                          setActiveRoomId(r.id);
                          setLevelMap(r.map);
                          setRoomConfig({ width: r.width, height: r.height });
                          setRoomSettings(r.settings);
                          setBackgrounds(r.backgrounds);
                          setViews(r.views);
                          setRoomViewMode(r.viewMode || '2d');
                          setIsoMap(r.isoMap || []);
                          setScene3D(r.scene3D || []);
                      }

                      setGameData({ metadata: { ...{ languages: ['en'], defaultLanguage: 'en' }, ...meta }, assemblyCode: ";", boxArtUrl: null, webPrototype: pkg.payload, uiMenus: pkg.project.uiMenus || [] });
                  } else {
                      // Fallback for legacy files (No project source)
                      setGameData({ metadata: { title: pkg.meta.title, story: "Legacy (Play Only)", genre: "Retro", controls: "Z/X", languages: ['en'], defaultLanguage: 'en' }, assemblyCode: ";", boxArtUrl: null, webPrototype: pkg.payload, uiMenus: [] });
                      // Intentionally removed alert() to prevent browser blocking/crashing when loading legacy projects standalone
                  }

                  setState(AppState.COMPLETED);
                  openWindow('runner', 'game', 'Game Runner');
              }
          } catch (err: any) {
              console.error("Load project error:", err);
              window.alert("Failed to load project: " + err.message);
          }
      };
      reader.onerror = () => {
          window.alert("Failed to read file.");
      };
      reader.readAsText(file);
      e.target.value = '';
  };
  const sidebarAction = (type: OpenWindow['type'], targetId?: string, title?: string) => {
      openWindow(type, targetId, title);
      if (window.innerWidth < 768) setSidebarOpen(false);
  };
  const getSelectedSpriteSrc = () => sprites.find(s => s.id === selectedSpriteId)?.src;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = (err) => {
        console.error("FileReader error:", err);
        window.alert("Failed to read image file.");
    };
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result !== 'string') return;

      const img = new Image();
      img.onerror = () => {
          console.error("Image load error");
          window.alert("Failed to load image for processing.");
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          try {
              const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              setSelectedImage(resizedDataUrl);
          } catch (err) {
              console.error("Canvas toDataURL error:", err);
              setSelectedImage(result); // Fallback to original if compression fails
          }
        } else {
          setSelectedImage(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

    const resourceTable: Record<string, { list: any[]; setter: (updater: (p: any[]) => any[]) => void; prefix: string }> = {
        sprite:     { list: sprites,          setter: setSprites as any,          prefix: 'spr' },
        background: { list: backgroundAssets, setter: setBackgroundAssets as any, prefix: 'bg' },
        sound:      { list: soundAssets,      setter: setSoundAssets as any,      prefix: 'snd' },
        font:       { list: fontAssets,       setter: setFontAssets as any,       prefix: 'fnt' },
        script:     { list: scripts,          setter: setScripts as any,          prefix: 'scr' },
        menu:       { list: uiMenus,          setter: setUiMenus as any,          prefix: 'ui'  },
        object:     { list: gameObjects,      setter: setGameObjects as any,      prefix: 'obj' },
        room:       { list: rooms,            setter: setRooms as any,            prefix: 'rm'  },
    };

    const resourceLabel = (type: string, item: any): string =>
        type === 'room' ? (item?.settings?.name || item?.id) : (item?.name || item?.id);

    const renameResource = (type: string, id: string) => {
        const entry = resourceTable[type]; if (!entry) return;
        const item = entry.list.find(x => x.id === id); if (!item) return;
        const oldName = type === 'room' ? (item?.settings?.name || item?.id) : (item?.name || item?.id);
        const newName = window.prompt(`إعادة تسمية "${oldName}" إلى:`, oldName);
        if (!newName || newName.trim() === oldName) return;

        const trimmedName = newName.trim();
        entry.setter(prev => prev.map(x => {
            if (x.id !== id) return x;
            if (type === 'room') {
                return { ...x, settings: { ...x.settings, name: trimmedName } };
            }
            return { ...x, name: trimmedName };
        }));

        // Update window title if open
        const winKey = type + '_' + id;
        const pWinKey = type + 's_edit_' + id; // Alternative key used in some cases
        setOpenWindows(prev => prev.map(w => {
            if (w.id === winKey || w.id === pWinKey || (w.type === type && w.targetId === id)) {
                return { ...w, title: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${trimmedName}` };
            }
            return w;
        }));
    };

    const deleteResource = (type: string, id: string) => {
        const entry = resourceTable[type]; if (!entry) return;
        const item = entry.list.find(x => x.id === id); if (!item) return;
        if (!window.confirm(`هل أنت متأكد من حذف "${resourceLabel(type, item)} "؟`)) return;

        entry.setter(prev => prev.filter(x => x.id !== id));
        setSelectedElements(prev => prev.filter(e => !(e.type === type && e.id === id)));

        // Close associated window
        const winKey = type + '_' + id;
        const pWinKey = type + 's_edit_' + id;
        setOpenWindows(prev => prev.filter(w => !(w.id === winKey || w.id === pWinKey || (w.type === type && w.targetId === id))));
        if (activeWindow && (activeWindow.includes(id))) {
            setActiveWindow('home');
        }
    };

    const duplicateResource = (type: string, id: string) => {
        const entry = resourceTable[type]; if (!entry) return;
        const idx = entry.list.findIndex(x => x.id === id); if (idx < 0) return;
        const orig = entry.list[idx];
        const newId = `${entry.prefix}_${Date.now()}`;
        const cloned = JSON.parse(JSON.stringify(orig));
        cloned.id = newId;
        if (type === 'room') {
            cloned.settings = { ...cloned.settings, name: (cloned.settings.name || 'room') + '_copy' };
        } else {
            cloned.name = (cloned.name || type) + '_copy';
        }
        entry.setter(prev => {
            const next = [...prev];
            next.splice(idx + 1, 0, cloned);
            return next;
        });
    };

    const moveResource = (type: string, id: string, dir: -1 | 1) => {
        const entry = resourceTable[type]; if (!entry) return;
        entry.setter(prev => {
            const idx = prev.findIndex(x => x.id === id);
            if (idx < 0) return prev;
            const target = idx + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[target]] = [next[target], next[idx]];
            return next;
        });
    };

    const setResourceGroup = (type: string, id: string, groupName: string | null) => {
        const entry = resourceTable[type]; if (!entry) return;
        entry.setter(prev => prev.map(x => x.id === id ? { ...x, group: groupName || undefined } : x));
    };

    const renameGroup = (resType: string, oldName: string) => {
        const entry = resourceTable[resType]; if (!entry) return;
        const newName = window.prompt(`إعادة تسمية المجموعة "${oldName}" إلى:`, oldName);
        if (!newName || newName.trim() === oldName) return;
        entry.setter(prev => prev.map(x => (x as any).group === oldName ? { ...x, group: newName.trim() } : x));
    };

    const deleteGroup = (resType: string, groupName: string) => {
        const entry = resourceTable[resType]; if (!entry) return;
        if (window.confirm(`هل تريد حذف المجموعة "${groupName}" بجميع محتوياتها؟\n\nموافق (OK): حذف كل شيء\nإلغاء (Cancel): فك المجموعة فقط وإبقاء العناصر`)) {
            entry.setter(prev => prev.filter(x => (x as any).group !== groupName));
        } else if (window.confirm(`هل تريد فك المجموعة "${groupName}"؟`)) {
            entry.setter(prev => prev.map(x => (x as any).group === groupName ? { ...x, group: undefined } : x));
        }
    };

    const promptNewGroup = (type: string, id: string) => {
        const name = window.prompt('اسم المجموعة الجديدة / New group name:');
        if (!name) return;
        setResourceGroup(type, id, name.trim());
    };

    // Existing group names per type (for the "Move to existing group" submenu).
    const existingGroupsForType = (type: string): string[] => {
        const entry = resourceTable[type]; if (!entry) return [];
        const set = new Set<string>();
        entry.list.forEach(x => { if ((x as any).group) set.add((x as any).group); });
        return Array.from(set).sort();
    };

  const renderSidebar = () => {
    const toggleElementSelection = (type: string, id: string) => {
        setSelectedElements(prev => {
            const exists = prev.find(e => e.type === type && e.id === id);
            if (exists) return prev.filter(e => !(e.type === type && e.id === id));
            return [...prev, { type, id }];
        });
    };

    const isElementSelected = (type: string, id: string) => {
        return selectedElements.some(e => e.type === type && e.id === id);
    };

    const handleDeleteSelectedElements = () => {
        if (selectedElements.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedElements.length} elements?`)) return;

        setSprites(prev => prev.filter(s => !selectedElements.some(e => e.type === 'sprite' && e.id === s.id)));
        setBackgroundAssets(prev => prev.filter(b => !selectedElements.some(e => e.type === 'background' && e.id === b.id)));
        setSoundAssets(prev => prev.filter(s => !selectedElements.some(e => e.type === 'sound' && e.id === s.id)));
        setFontAssets(prev => prev.filter(f => !selectedElements.some(e => e.type === 'font' && e.id === f.id)));
        setScripts(prev => prev.filter(s => !selectedElements.some(e => e.type === 'script' && e.id === s.id)));
        setUiMenus(prev => prev.filter(m => !selectedElements.some(e => e.type === 'menu' && e.id === m.id)));
        setGameObjects(prev => prev.filter(o => !selectedElements.some(e => e.type === 'object' && e.id === o.id)));
        setRooms(prev => prev.filter(r => !selectedElements.some(e => e.type === 'room' && e.id === r.id)));

        setSelectedElements([]);
        setMultiSelectMode(false);
    };

    // Open right-click context menu for a tree leaf (real resource — not a "Create…" action)
    const openCtxMenu = (e: React.MouseEvent, type: string, id: string, label: string) => {
        e.preventDefault();
        e.stopPropagation();
        setGroupSubmenuOpen(false);
        setResourceCtxMenu({ x: e.clientX, y: e.clientY, type, id, label });
    };

    const sprNodes: any[] = sprites.map(s => ({ key: s.id, type: 'sprite', id: s.id, label: s.name, group: (s as any).group, icon: <ImageIcon size={12} className={s.src?'text-green-600':'text-red-600'}/>, action: () => { setSelectedSpriteId(s.id); sidebarAction('sprites', s.id, `Sprite: ${s.name}`); }, selected: activeWindow === 'sprites_' + s.id }));
    sprNodes.push({ key: 'add_spr', type: 'action', id: 'add', label: 'Create Sprite', icon: <Plus size={12} className="text-blue-500"/>, action: handleAddSprite, selected: false });
    sprNodes.push({ key: 'bulk_spr', type: 'action', id: 'bulk', label: 'Bulk Import', icon: <Upload size={12} className="text-green-500"/>, action: () => document.getElementById('bulk-sprite-input')?.click(), selected: false });
    const bgNodes: any[] = backgroundAssets.map(b => ({ key: b.id, type: 'background', id: b.id, label: b.name, group: (b as any).group, icon: <ImageIcon size={12} className={b.src?'text-green-600':'text-orange-600'}/>, action: () => { setSelectedBgId(b.id); sidebarAction('backgrounds_edit', b.id, `Background: ${b.name}`); }, selected: activeWindow === 'backgrounds_edit_' + b.id }));
    bgNodes.push({ key: 'add_bg', type: 'action', id: 'add', label: 'Create Background', icon: <Plus size={12} className="text-blue-500"/>, action: handleAddBackground, selected: false });
    const sndNodes: any[] = soundAssets.map(s => ({ key: s.id, type: 'sound', id: s.id, label: s.name, group: (s as any).group, icon: <Speaker size={12} className="text-purple-600"/>, action: () => { setSelectedSoundId(s.id); sidebarAction('sounds_edit', s.id, `Sound: ${s.name}`); }, selected: activeWindow === 'sounds_edit_' + s.id }));
    sndNodes.push({ key: 'add_snd', type: 'action', id: 'add', label: 'Create Sound', icon: <Plus size={12} className="text-blue-500"/>, action: handleAddSound, selected: false });
    const fntNodes: any[] = fontAssets.map(f => ({ key: f.id, type: 'font', id: f.id, label: f.name, group: (f as any).group, icon: <FileType size={12} className="text-gray-600"/>, action: () => { setSelectedFontId(f.id); sidebarAction('fonts_edit', f.id, `Font: ${f.name}`); }, selected: activeWindow === 'fonts_edit_' + f.id }));
    fntNodes.push({ key: 'add_fnt', type: 'action', id: 'add', label: 'Create Font', icon: <Plus size={12} className="text-blue-500"/>, action: handleAddFont, selected: false });
    const scrNodes: any[] = scripts.map(s => ({ key: s.id, type: 'script', id: s.id, label: s.name, group: (s as any).group, icon: <FileCode size={12} className="text-yellow-600"/>, action: () => { setSelectedScriptId(s.id); sidebarAction('script_edit', s.id, `Script: ${s.name}`); }, selected: activeWindow === 'script_edit_' + s.id }));
    scrNodes.push({ key: 'add_scr', type: 'action', id: 'add', label: 'Create Script', icon: <Plus size={12} className="text-blue-500"/>, action: handleAddScript, selected: false });

    const uiNodes: any[] = uiMenus.map(m => ({ key: m.id, type: 'menu', id: m.id, label: m.name, group: (m as any).group, icon: <Layout size={12} className="text-pink-600"/>, action: () => { setSelectedMenuId(m.id); sidebarAction('ui_edit', m.id, `Menu: ${m.name}`); }, selected: activeWindow === 'ui_edit_' + m.id }));
    uiNodes.push({ key: 'add_ui', type: 'action', id: 'add', label: 'Create Menu', icon: <Plus size={12} className="text-blue-500"/>, action: handleAddMenu, selected: false });

    // Objects Nodes
    const objNodes: any[] = gameObjects.map(o => ({ key: o.id, type: 'object', id: o.id, label: o.name, group: (o as any).group, icon: <Puzzle size={12} className="text-blue-600"/>, action: () => { setSelectedObjectId(o.id); sidebarAction('object_edit', o.id, `Object: ${o.name}`); }, selected: activeWindow === 'object_edit_' + o.id }));
    objNodes.push({ key: 'add_obj', type: 'action', id: 'add', label: 'Create Object', icon: <Plus size={12} className="text-blue-500"/>, action: handleAddObject, selected: false });

    const rmNodes: any[] = rooms.map(r => ({ key: r.id, type: 'room', id: r.id, label: r.settings.name || r.id, group: (r as any).group, icon: <MapIcon size={12} className="text-gray-500"/>, action: () => { saveCurrentRoomState(); setActiveRoomId(r.id); sidebarAction('room', r.id, `Room: ${r.settings.name}`); }, selected: activeWindow === 'room_' + r.id }));
    rmNodes.push({ key: 'add_rm', type: 'action', id: 'add', label: 'Create Room', icon: <Plus size={12} className="text-blue-500"/>, action: handleAddRoom, selected: false });

    // Render a single leaf inside a tree (with right-click context menu wired in).
    const renderLeaf = (child: any, depth: number, isLast: boolean, parentLines: boolean[]) => (
        <div
            key={child.key}
            onContextMenu={(e) => child.type !== 'action' ? openCtxMenu(e, child.type, child.id, child.label) : undefined}
            onDoubleClick={() => {
                if (child.type !== 'action') {
                    renameResource(child.type, child.id);
                }
            }}
        >
            <TreeItem
                label={child.label}
                icon={child.icon}
                depth={depth}
                isLast={isLast}
                parentLines={parentLines}
                onClick={child.action}
                active={child.selected}
                showCheckbox={multiSelectMode && child.type !== 'action'}
                checked={isElementSelected(child.type, child.id)}
                onCheck={() => toggleElementSelection(child.type, child.id)}
            />
        </div>
    );

    // Render a tree section: groups items by their `group` field (GameMaker-style folders),
    // then renders ungrouped items, then "Create…" actions at the bottom.
    const renderNode = (key: string, label: string, icon: any, children: any[], depth: number, parentLines: boolean[], isLast: boolean, expanded: boolean, toggle: any) => {
        // Split children: grouped resources, ungrouped resources, and action items (Create/Bulk).
        const grouped: Record<string, any[]> = {};
        const ungrouped: any[] = [];
        const actions: any[] = [];
        children.forEach(c => {
            if (c.type === 'action') actions.push(c);
            else if (c.group) (grouped[c.group] = grouped[c.group] || []).push(c);
            else ungrouped.push(c);
        });
        const groupNames = Object.keys(grouped).sort();
        // Build a flat ordered list of "things to render" so we can compute isLast correctly.
        const ordered: Array<{ kind: 'group'; name: string; items: any[] } | { kind: 'leaf'; child: any }> = [
            ...groupNames.map(name => ({ kind: 'group' as const, name, items: grouped[name] })),
            ...ungrouped.map(child => ({ kind: 'leaf' as const, child })),
            ...actions.map(child => ({ kind: 'leaf' as const, child })),
        ];
        return (
            <React.Fragment key={key}>
                <TreeItem label={label} icon={icon} hasChildren={children.length > 0} expanded={expanded} onToggle={toggle} onClick={toggle} depth={depth} isLast={isLast} parentLines={parentLines} />
                {expanded && ordered.map((entry, idx) => {
                    const childIsLast = idx === ordered.length - 1;
                    const childParentLines = [...parentLines, !isLast];
                    if (entry.kind === 'group') {
                        const gKey = `${key}_grp_${entry.name}`;
                        const gExpanded = treeExpanded[gKey] ?? true;
                        return (
                            <React.Fragment key={gKey}>
                                <div
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setResourceCtxMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            type: 'group',
                                            id: entry.name,
                                            label: `Group: ${entry.name}`,
                                            resType: key.slice(0, -1) // Convert 'sprites' to 'sprite'
                                        } as any);
                                    }}
                                >
                                    <TreeItem
                                        label={entry.name}
                                        icon={<Folder size={12} className="text-yellow-500 fill-yellow-500" />}
                                        hasChildren={entry.items.length > 0}
                                        expanded={gExpanded}
                                        onToggle={() => toggleTree(gKey)}
                                        onClick={() => toggleTree(gKey)}
                                        depth={depth + 1}
                                        isLast={childIsLast}
                                        parentLines={childParentLines}
                                    />
                                </div>
                                {gExpanded && entry.items.map((c, i) =>
                                    renderLeaf(c, depth + 2, i === entry.items.length - 1, [...childParentLines, !childIsLast])
                                )}
                            </React.Fragment>
                        );
                    }
                    return renderLeaf(entry.child, depth + 1, childIsLast, childParentLines);
                })}
            </React.Fragment>
        );
    };

    const renderGmkTree = (node: any, depth: number, parentLines: boolean[], isLast: boolean) => {
        const key = `gmk_${node.kind}_${node.id}_${node.name}`;
        const expanded = treeExpanded[key] ?? (depth < 1); // Expand top folders by default

        let icon = <Folder size={12} className="text-yellow-500 fill-yellow-500" />;
        let action = () => toggleTree(key);
        let selected = false;
        let resType = '';
        let resId = '';

        if (node.kind !== 0) {
            const name = node.name;
            switch(node.kind) {
                case 1: // Sprite
                    resType = 'sprite';
                    { const s = sprites.find(x => x.name === name); if (s) resId = s.id; }
                    icon = <ImageIcon size={12} className="text-blue-600"/>;
                    action = () => {
                        const s = sprites.find(x => x.name === name);
                        if (s) { setSelectedSpriteId(s.id); sidebarAction('sprites', s.id, `Sprite: ${s.name}`); }
                    };
                    selected = activeWindow === 'sprites_' + (sprites.find(x => x.name === name)?.id || '');
                    break;
                case 2: // Sound
                    resType = 'sound';
                    { const s = soundAssets.find(x => x.name === name); if (s) resId = s.id; }
                    icon = <Speaker size={12} className="text-purple-600"/>;
                    action = () => {
                        const s = soundAssets.find(x => x.name === name);
                        if (s) { setSelectedSoundId(s.id); sidebarAction('sounds_edit', s.id, `Sound: ${s.name}`); }
                    };
                    selected = activeWindow === 'sounds_edit_' + (soundAssets.find(x => x.name === name)?.id || '');
                    break;
                case 3: // Background
                    resType = 'background';
                    { const s = backgroundAssets.find(x => x.name === name); if (s) resId = s.id; }
                    icon = <ImageIcon size={12} className="text-orange-600"/>;
                    action = () => {
                        const b = backgroundAssets.find(x => x.name === name);
                        if (b) { setSelectedBgId(b.id); sidebarAction('backgrounds_edit', b.id, `Background: ${b.name}`); }
                    };
                    selected = activeWindow === 'backgrounds_edit_' + (backgroundAssets.find(x => x.name === name)?.id || '');
                    break;
                case 5: // Script
                    resType = 'script';
                    { const s = scripts.find(x => x.name === name); if (s) resId = s.id; }
                    icon = <FileCode size={12} className="text-yellow-600"/>;
                    action = () => {
                        const s = scripts.find(x => x.name === name);
                        if (s) { setSelectedScriptId(s.id); sidebarAction('script_edit', s.id, `Script: ${s.name}`); }
                    };
                    selected = activeWindow === 'script_edit_' + (scripts.find(x => x.name === name)?.id || '');
                    break;
                case 6: // Font
                    resType = 'font';
                    { const s = fontAssets.find(x => x.name === name); if (s) resId = s.id; }
                    icon = <FileType size={12} className="text-gray-600"/>;
                    action = () => {
                        const f = fontAssets.find(x => x.name === name);
                        if (f) { setSelectedFontId(f.id); sidebarAction('fonts_edit', f.id, `Font: ${f.name}`); }
                    };
                    selected = activeWindow === 'fonts_edit_' + (fontAssets.find(x => x.name === name)?.id || '');
                    break;
                case 8: // Object
                    resType = 'object';
                    { const o = gameObjects.find(x => x.name === name); if (o) resId = o.id; }
                    icon = <Puzzle size={12} className="text-blue-600"/>;
                    action = () => {
                        const o = gameObjects.find(x => x.name === name);
                        if (o) { setSelectedObjectId(o.id); sidebarAction('object_edit', o.id, `Object: ${o.name}`); }
                    };
                    selected = activeWindow === 'object_edit_' + (gameObjects.find(x => x.name === name)?.id || '');
                    break;
                case 9: // Room
                    resType = 'room';
                    { const r = rooms.find(x => (x.settings.name === name || x.id === name)); if (r) resId = r.id; }
                    icon = <MapIcon size={12} className="text-gray-500"/>;
                    action = () => {
                        const r = rooms.find(x => (x.settings.name === name || x.id === name));
                        if (r) { setActiveRoomId(r.id); sidebarAction('room', r.id, `Room: ${r.settings.name}`); }
                    };
                    selected = activeWindow === 'room_' + (rooms.find(x => (x.settings.name === name || x.id === name))?.id || '');
                    break;
            }
        }

        return (
            <React.Fragment key={key}>
                <div
                    onContextMenu={(e) => {
                        if (resType && resId) {
                            e.preventDefault();
                            openCtxMenu(e, resType, resId, node.name);
                        }
                    }}
                    onDoubleClick={() => { if (resType && resId) renameResource(resType, resId); }}
                >
                    <TreeItem
                        label={node.name}
                        icon={icon}
                        hasChildren={node.children.length > 0}
                        expanded={expanded}
                        onToggle={() => toggleTree(key)}
                        onClick={node.kind === 0 ? () => toggleTree(key) : action}
                        depth={depth}
                        isLast={isLast}
                        parentLines={parentLines}
                        active={selected}
                    />
                </div>
                {expanded && node.children.map((child: any, idx: number) => (
                    renderGmkTree(child, depth + 1, [...parentLines, !isLast], idx === node.children.length - 1)
                ))}
            </React.Fragment>
        );
    };

    return (
      <div className="flex flex-col h-full bg-win-face select-none overflow-hidden">
          <div className="bg-win-face px-2 py-1 font-ui text-[11px] text-win-text border-b border-gray-400 truncate flex justify-between items-center shadow-sm">
             <div className="flex items-center gap-1 font-bold cursor-pointer hover:bg-gray-200 px-1 rounded"
                  onClick={() => {
                      const newTitle = window.prompt("اسم المشروع الجديد:", gameData?.metadata.title);
                      if (newTitle && gameData) {
                          setGameData(prev => prev ? ({ ...prev, metadata: { ...prev.metadata, title: newTitle.trim() } }) : null);
                      }
                  }}
             >
                 <Folder size={14} className="text-win-text fill-transparent stroke-1"/>
                 <span>{gameData?.metadata.title || 'Project1'}{(history as any).canUndo ? '*' : ''}</span>
             </div>
             <div className="flex items-center gap-1">
                 <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedElements([]); }} className={`p-1 rounded ${multiSelectMode ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-200 text-gray-600'}`} title="Multi-Select Mode">
                     <Check size={12} />
                 </button>
                 {multiSelectMode && selectedElements.length > 0 && (
                     <div className="flex items-center gap-1">
                         <button onClick={() => { const name = window.prompt("اسم المجموعة الجديدة:"); if (name) { selectedElements.forEach(e => setResourceGroup(e.type, e.id, name.trim())); setSelectedElements([]); setMultiSelectMode(false); } }} className="p-1 rounded bg-win-face border border-win-shadow shadow-win-out text-win-blue" title="ضم العناصر المختارة لمجموعة">
                             <FolderPlus size={12} />
                         </button>
                         <button onClick={handleDeleteSelectedElements} className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600" title={`Delete ${selectedElements.length} selected`}>
                             <Trash2 size={12} />
                         </button>
                     </div>
                 )}
             </div>
          </div>
          <div className="flex-1 overflow-auto p-1 bg-win-face relative">
              {importedTree ? (
                  renderGmkTree(importedTree, 0, [], true)
              ) : (
                  <>
                    {renderNode('sprites', 'Sprites', <Folder size={12} className="text-yellow-500 fill-yellow-500" />, sprNodes, 0, [], false, treeExpanded.sprites, () => toggleTree('sprites'))}
                    {renderNode('sounds', 'Sounds', <Folder size={12} className="text-yellow-500 fill-yellow-500" />, sndNodes, 0, [], false, treeExpanded.sounds, () => toggleTree('sounds'))}
                    {renderNode('backgrounds', 'Backgrounds', <Folder size={12} className="text-yellow-500 fill-yellow-500" />, bgNodes, 0, [], false, treeExpanded.backgrounds, () => toggleTree('backgrounds'))}
                    {renderNode('paths', 'Paths', <Folder size={12} className="text-yellow-500 fill-yellow-500" />, [], 0, [], false, treeExpanded.paths, () => toggleTree('paths'))}
                    {renderNode('scripts', 'Scripts', <Folder size={12} className="text-yellow-500 fill-yellow-500" />, scrNodes, 0, [], false, treeExpanded.scripts, () => toggleTree('scripts'))}
                    {renderNode('menus', 'Menus', <Folder size={12} className="text-yellow-500 fill-yellow-500" />, uiNodes, 0, [], false, treeExpanded.menus, () => toggleTree('menus'))}
                    {renderNode('objects', 'Objects', <Folder size={12} className="text-yellow-500 fill-yellow-500" />, objNodes, 0, [], false, treeExpanded.objects, () => toggleTree('objects'))}
                    {renderNode('rooms', 'Rooms', <Folder size={12} className="text-yellow-500 fill-yellow-500" />, rmNodes, 0, [], false, treeExpanded.rooms, () => toggleTree('rooms'))}
                    {renderNode('fonts', 'Fonts', <Folder size={12} className="text-yellow-500 fill-yellow-500" />, fntNodes, 0, [], false, treeExpanded.fonts, () => toggleTree('fonts'))}
                  </>
              )}
              <div className="mt-2 border-t border-gray-300 pt-2">
                <TreeItem label="Game Information" icon={<Info size={12} className="text-blue-500" />} onClick={() => sidebarAction('info', 'main', 'Game Info')} active={activeWindow === 'info_main'} depth={0} isLast={false} parentLines={[]} />
                <TreeItem label="Extensions" icon={<Puzzle size={12} className="text-purple-500" />} onClick={() => sidebarAction('extensions', 'main', 'Extensions')} active={activeWindow === 'extensions_main'} depth={0} isLast={false} parentLines={[]} />
                <TreeItem label="Tilesets" icon={<Layout size={12} className="text-orange-500" />} onClick={() => { openWindow('tileset_edit', 'main', 'Tileset Editor'); }} active={activeWindow === 'tileset_edit_main'} depth={0} isLast={false} parentLines={[]} />
                <TreeItem label="3D Scene Editor" icon={<Monitor size={12} className="text-blue-500" />} onClick={() => { openWindow('three_d', 'main', '3D Scene Editor'); }} active={activeWindow === 'three_d_main'} depth={0} isLast={false} parentLines={[]} />
                <TreeItem label={`3D Models Library (${model3DAssets.length})`} icon={<Package size={12} className="text-blue-400" />} onClick={() => { openWindow('model3d_editor', 'main', '3D Models Library'); }} active={activeWindow === 'model3d_editor_main'} depth={0} isLast={false} parentLines={[]} />
                <TreeItem label="Isometric Editor" icon={<MapIcon size={12} className="text-teal-500" />} onClick={() => { openWindow('isometric', 'main', 'Isometric Editor'); }} active={activeWindow === 'isometric_main'} depth={0} isLast={false} parentLines={[]} />
                <TreeItem label="NOOR Libraries" icon={<Zap size={12} className="text-yellow-500" />} onClick={() => { openWindow('noor_library', 'main', 'NOOR Libraries'); }} active={activeWindow === 'noor_library_main'} depth={0} isLast={false} parentLines={[]} />
                <TreeItem label="Global Settings" icon={<Settings size={12} className="text-gray-600" />} onClick={() => sidebarAction('settings', 'main', 'Global Settings')} active={activeWindow === 'settings_main'} depth={0} isLast={true} parentLines={[]} />
              </div>
          </div>
      </div>
    );
  };

  const TaskbarItem = ({ winId, icon, label, onClick }: any) => (
      <button
        onPointerDown={(e) => { e.stopPropagation(); if(onClick) onClick(); else setActiveWindow(winId); }}
        className={`flex items-center gap-1.5 px-2 py-0.5 border-r border-gray-400 min-w-[120px] max-w-[150px] truncate ${activeWindow === winId ? 'bg-win-face border-t-2 border-l-2 border-white shadow-none font-bold' : 'bg-win-face border-t-2 border-l-2 border-white shadow-win-out hover:bg-gray-100'}`}
      >
          {icon} <span className="truncate text-xs">{label}</span>
      </button>
  );

  return (
    <ErrorBoundary>
      <div
        className="h-[100dvh] w-screen flex flex-col bg-win-workspace overflow-hidden font-ui relative"
        style={{
          transform: uiZoom !== 1.0 ? `scale(${uiZoom})` : undefined,
          transformOrigin: 'top left',
          width: uiZoom !== 1.0 ? `${100 / uiZoom}%` : '100vw',
          height: uiZoom !== 1.0 ? `${100 / uiZoom}%` : '100vh',
        }}
        onClick={() => setOpenMenu(null)}
        onDragOver={handleGlobalDragOver}
        onDragLeave={handleGlobalDragLeave}
        onDrop={handleGlobalDrop}
      >
      {isDraggingOver && (
        <div className="absolute inset-0 z-[99999] bg-blue-500/20 border-4 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-4 rounded shadow-xl text-blue-600 font-bold text-xl flex items-center gap-2">
            <Upload size={32} />
            Drop files to import (.pnor, .nor, .gmk, images, audio)
          </div>
        </div>
      )}
      <input id="bulk-sprite-input" type="file" multiple accept="image/*" className="hidden" onChange={handleBulkImportSprites} />
      {(state === AppState.GENERATING_CODE || state === AppState.GENERATING_ASSETS || state === AppState.GENERATING_ART || state === AppState.GENERATING_CONCEPTS) && (
          <div className="fixed inset-0 z-[9999] bg-black/50 flex flex-col items-center justify-center">
              <div className="bg-win-face p-4 border-2 border-white shadow-xl flex flex-col items-center gap-4">
                  <div className="text-win-blue font-bold animate-pulse">
                      {state === AppState.GENERATING_CODE ? "Compiling & Packaging..." : "Generating..."}
                  </div>
                  <div className="w-48 h-4 bg-white border border-gray-400 p-0.5">
                      <div className="h-full bg-win-blue animate-[width_2s_ease-in-out_infinite] w-full origin-left"></div>
                  </div>
              </div>
          </div>
      )}
      <div id="main-menu-bar" className="h-[22px] bg-win-face flex items-center px-1 border-b border-win-shadow shadow-win-out select-none relative z-[50] overflow-x-auto no-scrollbar whitespace-nowrap text-win-text">
          {window.electronAPI?.isElectron && <span className="px-1.5 mr-1 text-[9px] font-bold bg-blue-600 text-white rounded-sm tracking-wider">DESKTOP</span>}
 <div className="relative"><div className={`px-2 cursor-pointer ${openMenu === 'file' ? 'bg-win-select text-white shadow-none' : 'hover:bg-win-select hover:text-white'}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'file' ? null : 'file'); }}>File</div>{openMenu === 'file' && <MenuDropdown><MenuItem setOpenMenu={setOpenMenu} label="New Project" icon={<File/>} onClick={() => setShowConfirmNew(true)}/><MenuItem setOpenMenu={setOpenMenu} label="Open .Nor..." icon={<Folder/>} onClick={() => fileInputRef.current?.click()}/><MenuItem setOpenMenu={setOpenMenu} label="Open .gmk..." icon={<Folder/>} onClick={() => gmkInputRef.current?.click()}/><MenuItem setOpenMenu={setOpenMenu} label="Import NES ROM (.nes)..." icon={<Gamepad2 className="text-red-500"/>} onClick={() => nesInputRef.current?.click()}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="Save Project (.pnor)" icon={<Disc/>} onClick={() => handleExport('pnor')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Export Sealed Game (.nor)" icon={<Disc/>} onClick={() => handleExport('nor')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Save as Template" icon={<Disc/>} onClick={handleSaveAsTemplate} disabled={!gameData}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="Run & Compile" icon={<Play/>} onClick={handleUpdateGame} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Restart Game" icon={<RefreshCw/>} onClick={handleUpdateGame} disabled={!gameData}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="🔍 Analyze & Repair Project" icon={<Shield/>} onClick={() => { setShowAnalyzer(true); openWindow('analyzer', 'main', 'Project Analyzer'); }} disabled={!gameData}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="Export as HTML5" icon={<Globe/>} onClick={() => handleExport('html')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Export as NES ROM (.nes)" icon={<Gamepad2/>} onClick={() => handleExport('nes')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Export as GBC ROM (.gbc)" icon={<Gamepad2 className="text-green-500"/>} onClick={() => handleExport('gbc')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Export to Mobile (J2ME .jar)" icon={<Smartphone/>} onClick={() => handleExport('j2me')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Export as Android App (.apk)" icon={<Smartphone className="text-green-500"/>} onClick={() => handleExport('apk')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Export as Windows App (.exe)" icon={<HardDrive className="text-blue-500"/>} onClick={() => handleExport('win')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Export as ESP32 Arduino Sketch (.zip)" icon={<Zap className="text-yellow-500"/>} onClick={() => handleExport('esp32')} disabled={!gameData}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="تحميل المحرك للكمبيوتر (Windows .exe)" icon={<HardDrive className="text-blue-600"/>} onClick={() => { const a = document.createElement('a'); a.href = '/nor-game-maker-standalone.exe'; a.download = 'NOR-Maker-AI.exe'; a.click(); }} /><MenuItem setOpenMenu={setOpenMenu} label="تحميل المحرك للموبايل (Android .apk)" icon={<Smartphone className="text-green-600"/>} onClick={() => { const a = document.createElement('a'); a.href = '/nor-game-maker-standalone.apk'; a.download = 'NOR-Maker-AI.apk'; a.click(); }} /><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="Download NOR Player" icon={<Download className="text-cyan-400"/>} onClick={() => handleDownloadNorPlayer()}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="Exit" onClick={() => window.location.reload()}/></MenuDropdown>}</div>
          <div className="relative"><div className={`px-2 cursor-pointer ${openMenu === 'res' ? 'bg-win-select text-white shadow-none' : 'hover:bg-win-select hover:text-white'}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'res' ? null : 'res'); }}>Resources</div>{openMenu === 'res' && <MenuDropdown><MenuItem setOpenMenu={setOpenMenu} label="Create Sprite" icon={<ImageIcon/>} onClick={handleAddSprite} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Create Background" icon={<ImageIcon/>} onClick={handleAddBackground} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Create Sound" icon={<Speaker/>} onClick={handleAddSound} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Create Font" icon={<FileType/>} onClick={handleAddFont} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Create Script" icon={<FileCode/>} onClick={handleAddScript} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Create Object" icon={<Puzzle/>} onClick={handleAddObject} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="Create Room" icon={<MapIcon/>} onClick={handleAddRoom} disabled={!gameData}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="3D Scene Editor" icon={<Monitor className="text-blue-500"/>} onClick={() => openWindow('three_d','main','3D Scene Editor')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label={`3D Models Library (${model3DAssets.length})`} icon={<Package className="text-blue-400"/>} onClick={() => openWindow('model3d_editor','main','3D Models Library')}/><MenuItem setOpenMenu={setOpenMenu} label="Isometric Editor" icon={<MapIcon className="text-teal-500"/>} onClick={() => openWindow('isometric','main','Isometric Editor')} disabled={!gameData}/><MenuItem setOpenMenu={setOpenMenu} label="NOOR Libraries" icon={<Zap className="text-yellow-500"/>} onClick={() => openWindow('noor_library','main','NOOR Libraries')}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="Import 3D Model (.gltf/.glb/.obj/.fbx/.stl)" icon={<Package className="text-blue-400"/>} onClick={() => { const inp = document.createElement("input"); inp.type="file"; inp.accept=".gltf,.glb,.obj,.fbx,.stl"; inp.onchange=(e:any)=>{const f=e.target.files?.[0]; if(f&&f.name){window.dispatchEvent(new CustomEvent("nor_import_3d",{detail:{file:f}}));}}; inp.click(); }} disabled={!gameData}/></MenuDropdown>}</div>
          <div className="relative"><div className={`px-2 cursor-pointer ${openMenu === 'view' ? 'bg-win-select text-white shadow-none' : 'hover:bg-win-select hover:text-white'}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'view' ? null : 'view'); }}>View</div>{openMenu === 'view' && <MenuDropdown><MenuItem setOpenMenu={setOpenMenu} label="Themes" icon={<Palette/>} onClick={() => {}} disabled/><MenuSeparator/>{THEME_PRESETS.map(t => (<MenuItem setOpenMenu={setOpenMenu} key={t.id} label={t.name} icon={currentTheme === t.id ? <Check size={12}/> : null} onClick={() => handleThemeChange(t.id)}/>))}<MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="Import Theme..." icon={<Upload/>} onClick={() => themeFileInputRef.current?.click()}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="Toggle Sidebar" icon={<Sidebar/>} onClick={() => setSidebarOpen(!sidebarOpen)}/></MenuDropdown>}</div>
          <div className="relative ml-auto"><div className={`px-2 cursor-pointer ${openMenu === 'help' ? 'bg-win-select text-white shadow-none' : 'hover:bg-win-select hover:text-white'}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'help' ? null : 'help'); }}>Help</div>{openMenu === 'help' && <MenuDropdown align="right"><MenuItem setOpenMenu={setOpenMenu} label="About nor game maker game maker..." icon={<Info/>} onClick={() => setShowAbout(true)}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="اختصارات لوحة المفاتيح" icon={<FileText/>} onClick={() => { setSuccessMessage('Ctrl+Z: Undo | Ctrl+Y: Redo | Ctrl+S: Save | F5: Run | Ctrl+N: New Project | Ctrl+O: Open'); }}/><MenuItem setOpenMenu={setOpenMenu} label="زيارة مجتمع NOR" icon={<Globe/>} onClick={() => window.open('https://nor-game-maker.community','_blank')}/><MenuSeparator/><MenuItem setOpenMenu={setOpenMenu} label="Build Desktop App (.exe / .dmg / .AppImage)" icon={<HardDrive className="text-blue-500"/>} onClick={() => { setSuccessMessage('To build: run  pnpm electron:build  in the project terminal. Output goes to merged_project/release/'); }}/></MenuDropdown>}</div>
      </div>

      <div id="main-tool-bar" className="h-[28px] md:h-[28px] bg-win-face border-b border-win-darkshadow flex items-center px-1 gap-1 select-none z-40 relative shadow-win-flat overflow-x-auto no-scrollbar">
          <div className="md:hidden"><RetroButton variant="toolbar" onClick={() => setSidebarOpen(!sidebarOpen)} icon={<MenuIcon className="text-gray-700" size={16}/>} /><div className="inline-block w-[1px] h-[18px] bg-gray-400 mx-1 border-r border-white align-middle"/></div>
          <RetroButton variant="toolbar" onClick={() => setShowConfirmNew(true)} icon={<File className="text-gray-500" size={16}/>} title="New"/><RetroButton variant="toolbar" onClick={() => fileInputRef.current?.click()} icon={<Folder className="text-yellow-600" size={16}/>} title="Open .Nor"/><RetroButton variant="toolbar" onClick={() => gmkInputRef.current?.click()} icon={<Upload className="text-blue-600" size={16}/>} title="استيراد GMK"/><RetroButton variant="toolbar" onClick={() => gmxFolderInputRef.current?.click()} icon={<Package className="text-purple-600" size={16}/>} title="استيراد مجلد GMX"/><RetroButton variant="toolbar" onClick={() => htmlInputRef.current?.click()} icon={<Globe className="text-green-600" size={16}/>} title="استيراد مجلد HTML"/><RetroButton variant="toolbar" onClick={() => nesInputRef.current?.click()} icon={<Gamepad2 className="text-red-500" size={16}/>} title="استيراد NES ROM"/><RetroButton variant="toolbar" onClick={() => handleExport('nor')} icon={<Disc className="text-blue-600" size={16}/>} title="Save"/>
          <div className="h-[18px] w-px bg-gray-400 mx-0.5"/>
          <RetroButton variant="toolbar" onClick={() => { const applyFns: ApplySnapshot = { setSprites, setBackgroundAssets, setSoundAssets, setFontAssets, setScripts, setGameObjects, setRooms, setUiMenus }; history.undo(getHistorySnap(), applyFns); }} icon={<RotateCcw className={history.canUndo ? 'text-blue-600' : 'text-gray-400'} size={14}/>} title={`Undo: ${history.undoLabel} (Ctrl+Z)`} disabled={!history.canUndo}/>
          <RetroButton variant="toolbar" onClick={() => { const applyFns: ApplySnapshot = { setSprites, setBackgroundAssets, setSoundAssets, setFontAssets, setScripts, setGameObjects, setRooms, setUiMenus }; history.redo(getHistorySnap(), applyFns); }} icon={<RotateCw className={history.canRedo ? 'text-blue-600' : 'text-gray-400'} size={14}/>} title={`Redo: ${history.redoLabel} (Ctrl+Y)`} disabled={!history.canRedo}/>
          <div className="h-[18px] w-px bg-gray-400 mx-0.5"/>
          <div className="min-w-[1px] h-[18px] bg-gray-400 mx-1 border-r border-white"/>
          <RetroButton variant="toolbar" onClick={handleUpdateGame} icon={<Play className={gameData ? "text-white fill-white" : "text-green-600"} size={16}/>} title="Run & Compile" disabled={!gameData} className={gameData ? "!bg-green-600 !border-green-400 hover:!bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "opacity-50 grayscale"}/>
          <RetroButton variant="toolbar" onClick={handleUpdateGame} icon={<RefreshCw className="text-blue-600" size={16}/>} title="Restart Game" disabled={!gameData} />
          <div className="min-w-[1px] h-[18px] bg-gray-400 mx-1 border-r border-white"/>
          <RetroButton variant="toolbar" onClick={() => { setShowAnalyzer(true); openWindow('analyzer', 'main', 'Project Analyzer'); }} icon={<Shield className="text-purple-600" size={16}/>} title="تحليل وإصلاح المشروع" disabled={!gameData} className={gameData ? '!bg-purple-50 !border-purple-300 hover:!bg-purple-100' : 'opacity-50 grayscale'}/>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-0 flex-col md:flex-row">
          <div className={`bg-win-face border-r border-win-shadow shadow-win-flat z-30 transition-transform duration-200 md:w-[220px] md:relative md:translate-x-0 md:flex md:flex-col absolute inset-y-0 left-0 w-[260px] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
             <div className="md:hidden flex justify-end p-1 bg-win-blue"><button onClick={() => setSidebarOpen(false)} className="text-white"><X size={16}/></button></div>
             <WindowFrame title="Resource Explorer" onClose={() => setSidebarOpen(false)} isActive={true}>{renderSidebar()}</WindowFrame>
          </div>
          {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

          <div className="flex-1 bg-win-workspace relative overflow-hidden flex flex-col items-center justify-center md:p-4">
               <input type="file" ref={htmlInputRef} className="hidden" {...{webkitdirectory: "", directory: ""} as any} multiple onChange={handleOpenHtml} />
               <input type="file" ref={gmxFolderInputRef} className="hidden" {...{webkitdirectory: "", directory: ""} as any} multiple onChange={handleOpenGmx} />
               <input type="file" ref={fileInputRef} className="hidden" accept=".pnor,.nor,application/octet-stream" onChange={handleLoadProject} />
               <input type="file" ref={gmkInputRef} className="hidden" accept=".gmk,application/octet-stream" onChange={handleOpenGmk} />
               <input type="file" ref={nesInputRef} className="hidden" accept=".nes,application/octet-stream" onChange={handleOpenNES} />
               <input type="file" ref={themeFileInputRef} className="hidden" accept=".json,application/json" onChange={handleImportTheme} />

               <div className="w-full h-full relative flex-1" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                   {state !== AppState.COMPLETED && openWindows.length === 0 && <div className="absolute inset-0 flex items-center justify-center overflow-auto"><WelcomeScreen prompt={prompt} setPrompt={setPrompt} isListening={isListening} handleVoiceInput={handleVoiceInput} handleGenerate={handleGenerate} handleCreateOffline={handleCreateOffline} selectedImage={selectedImage} setSelectedImage={setSelectedImage} onImageSelect={() => imageInputRef.current?.click()} imageInputRef={imageInputRef} gmkInputRef={gmkInputRef} handleOpenGmk={handleOpenGmk} gmxFolderInputRef={gmxFolderInputRef} handleOpenGmx={handleOpenGmx} htmlInputRef={htmlInputRef} handleOpenHtml={handleOpenHtml} nesInputRef={nesInputRef} savedTemplates={savedTemplates} handleLoadSavedTemplate={handleLoadSavedTemplate} handleDeleteSavedTemplate={handleDeleteSavedTemplate} handleDeleteMultipleSavedTemplates={handleDeleteMultipleSavedTemplates} handleImportNor={handleImportNor} setOpenWindows={setOpenWindows} /></div>}
                   <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

                   {state === AppState.COMPLETED && openWindows.length > 0 && (
                       <div className="absolute inset-0 flex z-10 pointer-events-none">
                           {openWindows.map(win => {
                               if (win.minimized) return null;
                               const isActive = activeWindow === win.id;
                               const zIndex = getZIndex(win.id);

                               if (win.type === 'runner') {
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame title={`Playing: ${gameData?.metadata.title}`} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)}>
                                       <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
                                           {gameData?.metadata.story === "Legacy (Play Only)" && (
                                               <div className="absolute top-4 bg-yellow-600 text-white text-xs px-3 py-1.5 rounded shadow-lg z-50 animate-pulse font-ui border border-yellow-400">
                                                   ⚠️ Legacy Project: Play-only mode. Editors are disabled.
                                               </div>
                                           )}
                                           <ConsoleViewer mode="game" content={gameData?.webPrototype || ''} title={gameData?.metadata.title || ''} />
                                       </div>
                                   </WindowFrame></div>;
                               }

                               if (win.type === 'sprites') {
                                   const spriteId = win.targetId;
                                   const sprite = sprites.find(s=>s.id===spriteId);
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={500} initialH={400} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<ImageIcon size={14}/>}>{spriteId ? <SpriteEditor spriteId={spriteId} role={sprite?.role} initialFrameWidth={sprite?.frameWidth} initialFrameHeight={sprite?.frameHeight} initialImage={sprite?.src} onSave={(img, fw, fh) => handleSpriteSave(img, spriteId, fw, fh)} onRoleChange={(role) => handleSpriteRoleChange(role, spriteId)} onImportFrames={handleImportFramesFromSheet} initialModel3D={sprite?.model3d || null} onModel3DChange={(m) => handleSpriteModel3DChange(spriteId, m)}/> : <div className="p-8 text-center text-gray-500">Select a sprite</div>}</WindowFrame></div>;
                               }

                               if (win.type === 'backgrounds_edit') {
                                   const bgId = win.targetId;
                                   const bg = backgroundAssets.find(b=>b.id===bgId);
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={500} initialH={400} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<ImageIcon size={14}/>}>
                                       {bgId ? (
                                           <SpriteEditor
                                                spriteId={bgId}
                                                initialImage={bg?.src}
                                                onSave={(img) => handleBgSave(img, bgId)}
                                                isBackground={true}
                                           />
                                       ) : <div className="p-8 text-center text-gray-500">Select background</div>}
                                   </WindowFrame></div>;
                               }

                               if (win.type === 'sounds_edit') {
                                   const soundId = win.targetId;
                                   const sound = soundAssets.find(s=>s.id===soundId);
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={400} initialH={300} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Speaker size={14}/>}>
                                       {soundId ? (
                                           <SoundEditor
                                              soundId={soundId}
                                              name={sound?.name || 'Sound'}
                                              initialSrc={sound?.src || ''}
                                              onSave={(src) => handleSoundSave(src)}
                                           />
                                       ) : <div className="p-8">Select a sound</div>}
                                   </WindowFrame></div>;
                               }

                               if (win.type === 'fonts_edit') {
                                   const fontId = win.targetId;
                                   const font = fontAssets.find(f=>f.id===fontId);
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={400} initialH={300} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<FileType size={14}/>}>
                                       {fontId && font ? (
                                           <FontEditor
                                              font={font}
                                              onUpdate={handleFontUpdate}
                                           />
                                       ) : <div className="p-8">Select a font</div>}
                                   </WindowFrame></div>;
                               }

                               if (win.type === 'script_edit') {
                                   const scriptId = win.targetId;
                                   const script = scripts.find(s=>s.id===scriptId);
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={600} initialH={400} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<FileCode size={14}/>}>
                                       {scriptId ? (
                                           <ScriptEditor
                                              code={script?.code || ''}
                                              onUpdate={handleScriptUpdate}
                                           />
                                       ) : <div className="p-8">Select a script</div>}
                                   </WindowFrame></div>;
                               }

                               if (win.type === 'ui_edit') {
                                   const menuId = win.targetId;
                                   const menu = uiMenus.find(m=>m.id===menuId);
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={600} initialH={400} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Layout size={14}/>}>
                                       {menuId && menu ? (
                                           <UIEditor
                                               menu={menu}
                                               onUpdate={handleMenuUpdate}
                                               sprites={sprites}
                                           />
                                       ) : <div className="p-8">Select a menu</div>}
                                   </WindowFrame></div>;
                               }

                               if (win.type === 'room') {
                                   const roomId = win.targetId;
                                   const room = rooms.find(r=>r.id===roomId);
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialX={10} initialY={10} initialW={800} initialH={600} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<MapIcon size={14}/>}>
                                       {roomId && room ? (
                                           <LevelEditor
                                                levelData={levelMap}
                                                layers={roomLayers}
                                                onUpdateLayers={setRoomLayers}
                                                stamps={stamps}
                                                onSaveStamp={(s) => {
                                                    setStamps(prev => {
                                                        const existing = prev.find(p => p.id === s.id);
                                                        if (existing) {
                                                            return prev.map(p => p.id === s.id ? s : p);
                                                        }
                                                        return [...prev, s];
                                                    });
                                                }}
                                                onDeleteStamp={(id) => setStamps(prev => prev.filter(s => s.id !== id))}
                                                width={roomConfig.width} height={roomConfig.height}
                                                sprites={sprites}
                                                backgroundAssets={backgroundAssets}
                                                gameObjects={gameObjects}
                                                uiMenus={uiMenus}
                                                onUpdate={updateLevelMapWithHistory} onResize={(w, h) => setRoomConfig({width: w, height: h})}
                                                roomSettings={roomSettings} onUpdateRoomSettings={setRoomSettings}
                                                backgrounds={backgrounds} onUpdateBackgrounds={setBackgrounds}
                                                views={views} onUpdateViews={setViews}
                                                onUndo={handleUndo} onRedo={handleRedo}
                                                canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
                                                viewMode={roomViewMode} onUpdateViewMode={setRoomViewMode}
                                                zDepth={zDepth} onUpdateZDepth={setZDepth}
                                                drawOnSurface={drawOnSurface} onUpdateDrawOnSurface={setDrawOnSurface}
                                                isoMap={isoMap} onUpdateIsoMap={setIsoMap}
                                                scene3D={scene3D} onUpdateScene3D={setScene3D}
                                                tileDefs={customTileDefs as any}
                                                model3DAssets={model3DAssets}
                                                onAddModel3DAsset={(asset) => setModel3DAssets(prev => [...prev, asset])}
                                           />
                                       ) : <div className="p-8">Select a room</div>}
                                   </WindowFrame></div>;
                               }

                               if (win.type === 'object_edit') {
                                   const objectId = win.targetId;
                                   const objectData = gameObjects.find(o=>o.id===objectId);
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={700} initialH={500} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Puzzle size={14}/>}>
                                       {objectId && objectData ? (
                                           <LibraryEditor
                                               objectData={objectData}
                                               onUpdate={handleObjectUpdate}
                                               sprites={sprites}
                                               fonts={fontAssets}
                                               gameObjects={gameObjects}
                                            />
                                       ) : <div className="p-8">Select an object</div>}
                                   </WindowFrame></div>;
                               }

                               if (win.type === 'extensions') {
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={600} initialH={400} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Puzzle size={14}/>}><ExtensionsEditor enabledExtensions={enabledExtensions} onToggle={(id) => setEnabledExtensions(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} /></WindowFrame></div>;
                               }

                               if (win.type === 'tileset_edit') {
                                   return (
                                       <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}>
                                           <WindowFrame isMDI={true} initialW={680} initialH={480} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Layout size={14} className="text-orange-500"/>}>
                                               <TilesetEditor
                                                   tiles={customTileDefs}
                                                   onUpdateTiles={(tiles) => {
                                                       history.pushSnapshot({ ...getHistorySnap(), label: 'Edit Tileset' });
                                                       setCustomTileDefs(tiles);
                                                   }}
                                               />
                                           </WindowFrame>
                                       </div>
                                   );
                               }

                               if (win.type === 'settings') {
                                   return (
                                       <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={500} initialH={400} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)}>
                                           <div className="p-4 bg-win-face h-full text-win-text overflow-y-auto">
                                               <h3 className="font-bold border-b border-gray-400 mb-2">Project Metadata</h3>
                                               <div className="grid grid-cols-2 gap-4 mb-4">
                                                   <div>
                                                       <label className="text-xs font-bold block mb-1">Game Title</label>
                                                       <input
                                                           className="w-full border border-win-shadow shadow-win-in p-1 text-xs bg-white"
                                                           value={gameData?.metadata.title}
                                                           onChange={e => setGameData({...gameData!, metadata: {...gameData!.metadata, title: e.target.value}})}
                                                       />
                                                   </div>
                                                   <div>
                                                       <label className="text-xs font-bold block mb-1">Genre</label>
                                                       <input
                                                           className="w-full border border-win-shadow shadow-win-in p-1 text-xs bg-white"
                                                           value={gameData?.metadata.genre}
                                                           onChange={e => setGameData({...gameData!, metadata: {...gameData!.metadata, genre: e.target.value}})}
                                                       />
                                                   </div>
                                               </div>

                                               <h3 className="font-bold border-b border-gray-400 mb-2 mt-4">Default Transition</h3>
                                               <div className="flex flex-col gap-2 bg-white/50 p-2 border border-win-shadow">
                                                   <div className="flex items-center justify-between">
                                                       <label className="text-xs">Type:</label>
                                                       <select
                                                           value={gameData?.defaultTransition?.type || 'fade'}
                                                           onChange={e => setGameData({
                                                               ...gameData!,
                                                               defaultTransition: {
                                                                   ...(gameData?.defaultTransition || { duration: 500, color: '#000000', easing: 'easeInOut' }),
                                                                   type: e.target.value as any
                                                               }
                                                           })}
                                                           className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs bg-white w-40"
                                                       >
                                                           {[
                                                               'fade', 'pixelate', 'circle_wipe', 'diamond_wipe', 'star_wipe',
                                                               'grid_wipe', 'scanline', 'noise', 'wave', 'mosaic',
                                                               'curtain', 'shutter', 'slide_left', 'slide_right', 'slide_up',
                                                               'slide_down', 'zoom_in', 'zoom_out', 'rotate', 'swirl',
                                                               'glitch', 'tv_off', 'heart_wipe', 'diagonal_wipe', 'checkerboard',
                                                               'gm8_create_center', 'gm8_create_left', 'gm8_create_right', 'gm8_create_top', 'gm8_create_bottom',
                                                               'gm8_interlace_h', 'gm8_interlace_v', 'gm8_push_left', 'gm8_push_right', 'gm8_push_top', 'gm8_push_bottom',
                                                               'gm8_rotate_left', 'gm8_rotate_right', 'mario_iris', 'pokemon_battle', 'zelda_fade', 'ff_swirl', 'megaman_slide'
                                                           ].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>)}
                                                       </select>
                                                   </div>
                                                   <div className="flex items-center justify-between">
                                                       <label className="text-xs">Duration (ms):</label>
                                                       <input
                                                           type="number"
                                                           value={gameData?.defaultTransition?.duration || 500}
                                                           onChange={e => setGameData({
                                                               ...gameData!,
                                                               defaultTransition: {
                                                                   ...(gameData?.defaultTransition || { type: 'fade', color: '#000000', easing: 'easeInOut' }),
                                                                   duration: parseInt(e.target.value) || 0
                                                               }
                                                           })}
                                                           className="border border-win-shadow shadow-win-in px-1 py-0.5 text-xs bg-white w-20"
                                                       />
                                                   </div>
                                                   <div className="flex items-center justify-between">
                                                       <label className="text-xs">Color:</label>
                                                       <input
                                                           type="color"
                                                           value={gameData?.defaultTransition?.color || '#000000'}
                                                           onChange={e => setGameData({
                                                               ...gameData!,
                                                               defaultTransition: {
                                                                   ...(gameData?.defaultTransition || { type: 'fade', duration: 500, easing: 'easeInOut' }),
                                                                   color: e.target.value
                                                               }
                                                           })}
                                                           className="w-20 h-6 border border-win-shadow"
                                                       />
                                                   </div>
                                               </div>
                                           </div>
                                       </WindowFrame></div>
                                   );
                               }

                               if (win.type === 'info') {
                                   const meta = gameData?.metadata || { title: '', story: '', genre: '', controls: '', languages: ['ar','en'], defaultLanguage: 'ar' };
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={620} initialH={520} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Info size={14} className="text-blue-400"/>}><GameInfoEditor metadata={meta} localization={{}} onUpdateMetadata={(m) => setGameData(d => d ? {...d, metadata: m} : d)} onUpdateLocalization={() => {}} /></WindowFrame></div>;
                               }

                               if (win.type === 'three_d') {
                                   const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];
                                   return (
                                       <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}>
                                           <WindowFrame isMDI={true} initialW={840} initialH={560} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Monitor size={14} className="text-blue-500"/>}>
                                               <UnifiedViewport
                                                   activeRoom={activeRoom as any}
                                                   levelData={levelMap} width={roomConfig.width} height={roomConfig.height}
                                                   sprites={sprites}
                                                   backgroundAssets={backgroundAssets}
                                                   gameObjects={gameObjects}
                                                   uiMenus={uiMenus}
                                                   onUpdate={updateLevelMapWithHistory} onResize={(w, h) => setRoomConfig({width: w, height: h})}
                                                   roomSettings={roomSettings} onUpdateRoomSettings={setRoomSettings}
                                                   backgrounds={backgrounds} onUpdateBackgrounds={setBackgrounds}
                                                   views={views} onUpdateViews={setViews}
                                                   onUndo={handleUndo} onRedo={handleRedo}
                                                   canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
                                                   viewMode={roomViewMode} onUpdateViewMode={setRoomViewMode}
                                                   zDepth={zDepth} onUpdateZDepth={setZDepth}
                                                   drawOnSurface={drawOnSurface} onUpdateDrawOnSurface={setDrawOnSurface}
                                                   isoMap={isoMap} onUpdateIsoMap={setIsoMap}
                                                   scene3D={scene3D} onUpdateScene3D={setScene3D}
                                                   tileDefs={customTileDefs as any}
                                                   model3DAssets={model3DAssets}
                                                   onAddModel3DAsset={(asset) => setModel3DAssets(prev => [...prev, asset])}
                                                   onPlayGame={handleUpdateGame}
                                               />
                                           </WindowFrame>
                                       </div>
                                   );
                               }

                               if (win.type === 'model3d_editor') {
                                   return (
                                       <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}>
                                           <WindowFrame isMDI={true} initialW={820} initialH={560} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Package size={14} className="text-blue-400"/>}>
                                               <Model3DEditor
                                                   assets={model3DAssets}
                                                   onAssetsChange={setModel3DAssets}
                                                   onClose={() => closeWindow(win.id)}
                                               />
                                           </WindowFrame>
                                       </div>
                                   );
                               }

                               if (win.type === 'isometric') {
                                   const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];
                                   return (
                                       <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}>
                                           <WindowFrame isMDI={true} initialW={720} initialH={520} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<MapIcon size={14} className="text-teal-500"/>}>
                                               <UnifiedViewport
                                                   activeRoom={activeRoom as any}
                                                   levelData={levelMap} width={roomConfig.width} height={roomConfig.height}
                                                   sprites={sprites}
                                                   backgroundAssets={backgroundAssets}
                                                   gameObjects={gameObjects}
                                                   uiMenus={uiMenus}
                                                   onUpdate={updateLevelMapWithHistory} onResize={(w, h) => setRoomConfig({width: w, height: h})}
                                                   roomSettings={roomSettings} onUpdateRoomSettings={setRoomSettings}
                                                   backgrounds={backgrounds} onUpdateBackgrounds={setBackgrounds}
                                                   views={views} onUpdateViews={setViews}
                                                   onUndo={handleUndo} onRedo={handleRedo}
                                                   canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
                                                   viewMode={roomViewMode} onUpdateViewMode={setRoomViewMode}
                                                   zDepth={zDepth} onUpdateZDepth={setZDepth}
                                                   drawOnSurface={drawOnSurface} onUpdateDrawOnSurface={setDrawOnSurface}
                                                   isoMap={isoMap} onUpdateIsoMap={(map) => { history.pushSnapshot({ ...getHistorySnap(), label: 'Edit Isometric Map' }); setIsoMap(map); }}
                                                   scene3D={scene3D} onUpdateScene3D={setScene3D}
                                                   tileDefs={customTileDefs as any}
                                                   model3DAssets={model3DAssets}
                                                   onAddModel3DAsset={(asset) => setModel3DAssets(prev => [...prev, asset])}
                                                   onPlayGame={handleUpdateGame}
                                               />
                                           </WindowFrame>
                                       </div>
                                   );
                               }

                               if (win.type === 'noor_library') {
                                   return <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={300} initialH={400} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Zap size={14} className="text-yellow-500"/>}><NoorLibrary /></WindowFrame></div>;
                               }


                               if (win.type === 'analyzer') {
                                   return (
                                     <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}><WindowFrame isMDI={true} initialW={700} initialH={500} title={win.title} onClose={() => { setShowAnalyzer(false); closeWindow(win.id); }} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Shield size={14} className="text-purple-400"/>}>
                                       <ProjectAnalyzerPanel
                                         sprites={sprites}
                                         backgroundAssets={backgroundAssets}
                                         soundAssets={soundAssets}
                                         fontAssets={fontAssets}
                                         scripts={scripts}
                                         gameObjects={gameObjects}
                                         rooms={rooms}
                                         uiMenus={uiMenus}
                                         enabledExtensions={enabledExtensions}
                                         metadata={gameData?.metadata}
                                         onApplyFix={handleApplyAnalyzerFix}
                                       />
                                     </WindowFrame></div>
                                   );
                               }

                               if (win.type === 'android_export') {
                                   return (
                                       <div key={win.id} className="pointer-events-auto w-full h-full" style={{zIndex}}>
                                           <WindowFrame isMDI={true} initialW={500} initialH={550} title={win.title} onClose={() => closeWindow(win.id)} isActive={isActive} onActivate={() => bringToTop(win.id)} icon={<Smartphone size={14} className="text-green-500"/>}>
                                               {gameData && (
                                                   <AndroidExportSettingsWindow
                                                       metadata={gameData.metadata}
                                                       onSave={(s) => setGameData({...gameData, metadata: {...gameData.metadata, androidExportSettings: s}})}
                                                       onUpdateMetadata={(m) => setGameData({...gameData, metadata: m})}
                                                       onExport={() => doAndroidExport(gameData.metadata.androidExportSettings!)}
                                                   />
                                               )}
                                           </WindowFrame>
                                       </div>
                                   );
                               }

                               return null;
                           })}
                        </div>
                    )}
                </div>

               <div className="h-[28px] bg-win-face border-t border-win-highlight shadow-win-out flex items-center px-1 gap-1 shrink-0 w-full overflow-x-auto no-scrollbar z-50">
                   <div onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'startmenu' ? null : 'startmenu'); }} className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-700 to-green-500 text-white font-bold italic shadow-win-out mr-2 cursor-pointer select-none border border-win-highlight rounded-tl-lg rounded-br-lg hover:from-green-600 hover:to-green-400 relative">
                       <Gamepad2 size={12}/> Start
                       {openMenu === 'startmenu' && (
                           <div className="absolute bottom-full left-0 mb-1 bg-win-face border border-gray-500 shadow-[2px_2px_8px_rgba(0,0,0,0.5)] w-52 z-[9999]" onClick={e => e.stopPropagation()}>
                               <div className="bg-gradient-to-b from-win-blue to-win-blueGrad text-white px-3 py-4 flex flex-col items-start gap-1 mb-1">
                                   <Gamepad2 size={24} className="mb-1"/>
                                   <span className="font-pixel text-[8px] font-bold">nor game maker game maker</span>
                                   <span className="text-[7px] opacity-75">صانع الألعاب</span>
                               </div>
                               <div className="flex">
                                   <div className="flex-1 border-r border-gray-300">
                                       {[
                                         { label: 'مشروع جديد', icon: <File size={14}/>, onClick: () => setShowConfirmNew(true) },
                                         { label: 'فتح مشروع...', icon: <Folder size={14}/>, onClick: () => fileInputRef.current?.click() },
                                         { label: 'حفظ', icon: <Disc size={14}/>, onClick: () => handleExport('nor') },
                                         { label: 'تشغيل', icon: <Play size={14}/>, onClick: handleUpdateGame },
                                       ].map(item => (
                                           <div key={item.label} onClick={() => { item.onClick(); setOpenMenu(null); }} className="flex items-center gap-3 px-3 py-2 hover:bg-win-select hover:text-white cursor-pointer text-[9px] text-win-text">
                                               {item.icon}<span>{item.label}</span>
                                           </div>
                                       ))}
                                       <div className="h-px bg-gray-300 my-1"/>
                                       <div onClick={() => { window.location.reload(); }} className="flex items-center gap-3 px-3 py-2 hover:bg-win-select hover:text-white cursor-pointer text-[9px] text-win-text">
                                           <X size={14}/><span>إغلاق</span>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       )}
                   </div>
                   <div className="h-[20px] w-px bg-gray-400 mx-1 border-r border-white"></div>
                   {openWindows.map(win => {
                       let icon = <File size={12}/>;
                       if (win.type === 'runner') icon = <Play size={12}/>;
                       if (win.type === 'sprites' || win.type === 'backgrounds_edit') icon = <ImageIcon size={12}/>;
                       if (win.type === 'room') icon = <MapIcon size={12}/>;
                       if (win.type === 'object_edit' || win.type === 'extensions') icon = <Puzzle size={12}/>;
                       if (win.type === 'sounds_edit') icon = <Speaker size={12}/>;
                       if (win.type === 'fonts_edit') icon = <FileType size={12}/>;
                       if (win.type === 'script_edit') icon = <FileCode size={12}/>;
                       if (win.type === 'ui_edit') icon = <Layout size={12}/>;
                       if (win.type === 'settings') icon = <Settings size={12}/>;
                       if (win.type === 'info') icon = <Info size={12}/>;
                       if (win.type === 'analyzer') icon = <Shield size={12}/>;
                       if (win.type === 'android_export') icon = <Smartphone size={12} className="text-green-500"/>;

                       return (
                           <TaskbarItem
                               key={win.id}
                               winId={win.id}
                               icon={icon}
                               label={win.title}
                               onClick={() => {
                                   if (activeWindow === win.id) {
                                       minimizeWindow(win.id);
                                   } else {
                                       restoreWindow(win.id);
                                   }
                               }}
                           />
                       );
                   })}
                   <div className="ml-auto flex items-center gap-2 px-2 border-l border-gray-400 shadow-win-in bg-win-face text-xs text-win-text">
                       {autoSavedAt && (
                           <span className="text-[9px] text-gray-500 hidden md:flex items-center gap-1" title={`آخر حفظ: ${new Date(autoSavedAt).toLocaleTimeString()}`}>
                               <Disc size={9} className="text-green-500"/>
                               {new Date(autoSavedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                           </span>
                       )}
                       {autoSavedAt && <div className="h-[14px] w-px bg-gray-400 mx-1"/>}
                       {/* Zoom Selector */}
                       <div className="flex items-center gap-1 border-r border-gray-400 pr-2 mr-1">
                           <span className="text-[10px]" title="تكبير/تصغير واجهة المحرك">🔍</span>
                           <select
                               value={uiZoom}
                               onChange={(e) => setUiZoom(parseFloat(e.target.value))}
                               className="bg-white border border-gray-400 text-[9px] font-bold px-1 py-0.5 rounded-sm focus:outline-none"
                           >
                               <option value="0.5">50%</option>
                               <option value="0.75">75%</option>
                               <option value="0.9">90%</option>
                               <option value="1.0">100%</option>
                               <option value="1.1">110%</option>
                               <option value="1.25">125%</option>
                               <option value="1.5">150%</option>
                               <option value="2.0">200%</option>
                           </select>
                       </div>
                       <Clock size={12}/><span>{clockTime}</span>
                   </div>
               </div>
          </div>
      </div>
      {showRecovery && recoveryDraft && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
              <div className="bg-win-face border-2 border-white shadow-win-out p-1 w-96 shadow-xl">
                  <div className="bg-gradient-to-r from-win-blue to-win-blueGrad px-2 py-1 text-white text-xs font-bold flex justify-between items-center mb-4">
                      <span>🔄 استرجاع مشروع</span>
                      <X size={12} className="cursor-pointer" onClick={() => setShowRecovery(false)}/>
                  </div>
                  <div className="px-4 pb-4 flex flex-col gap-4 text-win-text">
                      <div className="flex items-center gap-3">
                          <Disc size={28} className="text-blue-500 shrink-0"/>
                          <div className="text-xs">
                              <div className="font-bold mb-1">تم العثور على مشروع محفوظ تلقائياً</div>
                              <div className="text-gray-500">
                                  {recoveryDraft.gameData?.metadata?.title || 'مشروع بدون اسم'} —{' '}
                                  {new Date(recoveryDraft.savedAt || 0).toLocaleString('ar-EG')}
                              </div>
                          </div>
                      </div>
                      <div className="flex justify-center gap-3 pt-2">
                          <RetroButton onClick={() => {
                              setSprites(recoveryDraft.sprites || []);
                              setBackgroundAssets(recoveryDraft.backgroundAssets || []);
                              setSoundAssets(recoveryDraft.soundAssets || []);
                              setFontAssets(recoveryDraft.fontAssets || []);
                              setScripts(recoveryDraft.scripts || []);
                              setGameObjects(recoveryDraft.gameObjects || []);
                              setUiMenus(recoveryDraft.uiMenus || []);
                              setEnabledExtensions(recoveryDraft.enabledExtensions || []);
                              setGameData(recoveryDraft.gameData);
                              if (recoveryDraft.rooms?.length > 0) {
                                  setRooms(recoveryDraft.rooms);
                                  const r = recoveryDraft.rooms[0];
                                  setActiveRoomId(r.id);
                                  setLevelMap(Array.isArray(r.map) ? r.map : new Array(r.width * r.height).fill(0));
                                  setRoomConfig({ width: r.width, height: r.height });
                                  setRoomSettings(r.settings);
                                  setBackgrounds(r.backgrounds);
                                  setViews(r.views);
                              }
                              setState(AppState.COMPLETED);
                              setShowRecovery(false);
                              setRecoveryDraft(null);
                          }} className="flex-1 justify-center">استرجاع ✓</RetroButton>
                          <RetroButton onClick={() => { clearDraft(); setShowRecovery(false); setRecoveryDraft(null); }} className="flex-1 justify-center">تجاهل ✗</RetroButton>
                      </div>
                  </div>
              </div>
          </div>
      )}
      {/* GameMaker-style right-click context menu for resource-tree items */}
      {resourceCtxMenu && (
          <>
              <div className="fixed inset-0 z-[9998]" onClick={() => { setResourceCtxMenu(null); setGroupSubmenuOpen(false); }} onContextMenu={(e) => { e.preventDefault(); setResourceCtxMenu(null); setGroupSubmenuOpen(false); }} />
              <div
                  className="fixed z-[9999] bg-win-face border border-win-shadow shadow-win-out text-xs min-w-[180px] py-0.5"
                  style={{ left: Math.min(resourceCtxMenu.x, window.innerWidth - 200), top: Math.min(resourceCtxMenu.y, window.innerHeight - 220) }}
                  onContextMenu={(e) => e.preventDefault()}
              >
                  <div className="px-2 py-1 bg-win-blue text-white font-bold truncate">{resourceCtxMenu.label}</div>

                  {resourceCtxMenu.type === 'group' ? (
                      <>
                          <button className="w-full text-left px-3 py-1 hover:bg-win-select hover:text-white flex items-center gap-2"
                              onClick={() => { renameGroup((resourceCtxMenu as any).resType, resourceCtxMenu.id); setResourceCtxMenu(null); }}>
                              <Edit2 size={12}/> إعادة تسمية المجموعة / Rename Group
                          </button>
                          <button className="w-full text-left px-3 py-1 hover:bg-red-600 hover:text-white flex items-center gap-2 text-red-600"
                              onClick={() => { deleteGroup((resourceCtxMenu as any).resType, resourceCtxMenu.id); setResourceCtxMenu(null); }}>
                              <Trash2 size={12}/> حذف المجموعة / Delete Group
                          </button>
                      </>
                  ) : (
                      <>
                          <button className="w-full text-left px-3 py-1 hover:bg-win-select hover:text-white flex items-center gap-2"
                              onClick={() => { renameResource(resourceCtxMenu.type, resourceCtxMenu.id); setResourceCtxMenu(null); }}>
                              <Edit2 size={12}/> إعادة تسمية / Rename
                          </button>
                          <button className="w-full text-left px-3 py-1 hover:bg-win-select hover:text-white flex items-center gap-2"
                              onClick={() => { duplicateResource(resourceCtxMenu.type, resourceCtxMenu.id); setResourceCtxMenu(null); }}>
                              <Copy size={12}/> تكرار / Duplicate
                          </button>
                          <button className="w-full text-left px-3 py-1 hover:bg-win-select hover:text-white flex items-center gap-2"
                              onClick={() => { moveResource(resourceCtxMenu.type, resourceCtxMenu.id, -1); setResourceCtxMenu(null); }}>
                              <ChevronUp size={12}/> نقل لأعلى / Move Up
                          </button>
                          <button className="w-full text-left px-3 py-1 hover:bg-win-select hover:text-white flex items-center gap-2"
                              onClick={() => { moveResource(resourceCtxMenu.type, resourceCtxMenu.id, 1); setResourceCtxMenu(null); }}>
                              <ChevronDown size={12}/> نقل لأسفل / Move Down
                          </button>
                          <div className="border-t border-win-shadow my-0.5"/>
                          <div className="relative"
                              onMouseEnter={() => setGroupSubmenuOpen(true)}
                              onMouseLeave={() => setGroupSubmenuOpen(false)}
                          >
                              <button className="w-full text-left px-3 py-1 hover:bg-win-select hover:text-white flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-2"><Folder size={12} className="text-yellow-500 fill-yellow-500"/> ضم لمجموعة / Group</span>
                                  <ChevronRight size={10}/>
                              </button>
                              {groupSubmenuOpen && (
                                  <div className="absolute left-full top-0 bg-win-face border border-win-shadow shadow-win-out min-w-[160px] py-0.5 -mt-0.5">
                                      <button className="w-full text-left px-3 py-1 hover:bg-win-select hover:text-white flex items-center gap-2"
                                          onClick={() => { promptNewGroup(resourceCtxMenu.type, resourceCtxMenu.id); setResourceCtxMenu(null); }}>
                                          <Plus size={12}/> مجموعة جديدة... / New group...
                                      </button>
                                      {existingGroupsForType(resourceCtxMenu.type).length > 0 && <div className="border-t border-win-shadow my-0.5"/>}
                                      {existingGroupsForType(resourceCtxMenu.type).map(g => (
                                          <button key={g} className="w-full text-left px-3 py-1 hover:bg-win-select hover:text-white flex items-center gap-2"
                                              onClick={() => { setResourceGroup(resourceCtxMenu.type, resourceCtxMenu.id, g); setResourceCtxMenu(null); }}>
                                              <Folder size={12} className="text-yellow-500 fill-yellow-500"/> {g}
                                          </button>
                                      ))}
                                      <div className="border-t border-win-shadow my-0.5"/>
                                      <button className="w-full text-left px-3 py-1 hover:bg-win-select hover:text-white flex items-center gap-2 text-red-600"
                                          onClick={() => { setResourceGroup(resourceCtxMenu.type, resourceCtxMenu.id, null); setResourceCtxMenu(null); }}>
                                          إزالة من المجموعة / Remove from group
                                      </button>
                                  </div>
                              )}
                          </div>
                          <div className="border-t border-win-shadow my-0.5"/>
                          <button className="w-full text-left px-3 py-1 hover:bg-red-600 hover:text-white flex items-center gap-2 text-red-600"
                              onClick={() => { deleteResource(resourceCtxMenu.type, resourceCtxMenu.id); setResourceCtxMenu(null); }}>
                              <Trash2 size={12}/> حذف / Delete
                          </button>
                      </>
                  )}
              </div>
          </>
      )}
      {showConfirmNew && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"><div className="bg-win-face border-2 border-white shadow-win-out p-1 w-80 shadow-xl"><div className="bg-gradient-to-r from-win-blue to-win-blueGrad px-2 py-1 text-white text-xs font-bold flex justify-between items-center mb-4"><span>Confirmation</span><X size={12} className="cursor-pointer" onClick={() => setShowConfirmNew(false)}/></div><div className="px-4 pb-4 flex flex-col gap-4 text-win-text"><div className="flex items-center gap-4"><AlertTriangle size={32} className="text-yellow-500"/><div className="text-xs">Discard project?</div></div><div className="flex justify-center gap-4 pt-2"><RetroButton onClick={handleResetProject} className="w-20 justify-center">Yes</RetroButton><RetroButton onClick={() => setShowConfirmNew(false)} className="w-20 justify-center">No</RetroButton></div></div></div></div>}
      {showAbout && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setShowAbout(false)}>
          <div className="bg-win-face border-2 border-win-highlight shadow-[4px_4px_0_#000] p-1 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-win-blue to-win-blueGrad px-2 py-1 text-white text-[9px] font-bold flex justify-between items-center">
              <span className="flex items-center gap-2"><Gamepad2 size={12}/> About nor game maker game maker</span>
              <X size={12} className="cursor-pointer" onClick={() => setShowAbout(false)}/>
            </div>
            <div className="p-4 flex flex-col items-center gap-3 bg-win-face">
              <div className="flex items-center gap-4 w-full border border-win-shadow p-3 bg-white shadow-win-in">
                <svg viewBox="0 0 24 16" width="48" height="32" style={{imageRendering:'pixelated'}}>
                  <rect x="1" y="1" width="22" height="14" rx="4" fill="#E60012"/>
                  <rect x="4" y="5" width="2" height="5" fill="white" opacity="0.95"/>
                  <rect x="2.5" y="6.5" width="5" height="2" fill="white" opacity="0.95"/>
                  <circle cx="16" cy="5" r="1.5" fill="white" opacity="0.95"/>
                  <circle cx="19" cy="7.5" r="1.5" fill="white" opacity="0.95"/>
                  <circle cx="16" cy="10" r="1.5" fill="white" opacity="0.95"/>
                  <circle cx="13" cy="7.5" r="1.5" fill="white" opacity="0.95"/>
                  <rect x="10" y="6" width="1.5" height="4" rx="0.5" fill="white" opacity="0.6"/>
                  <rect x="9" y="7.5" width="3.5" height="1.5" rx="0.5" fill="white" opacity="0.6"/>
                </svg>
                <div>
                  <div className="font-pixel text-[14px] font-black text-win-text">nor game maker game maker</div>
                  <div className="text-[9px] text-gray-500">صانع الألعاب</div>
                  <div className="text-[9px] font-bold text-win-blue mt-1">الإصدار 8.2 — Ultimate Edition v9</div>
                </div>
              </div>
              <div className="w-full text-[9px] text-win-text space-y-1.5 border border-win-shadow p-3 bg-white shadow-win-in">
                <div className="font-bold text-win-blue mb-2">✨ الميزات المدمجة:</div>
                {[
                  '🎮 محرر ألعاب بيكسل آرت متكامل',
                  '🤖 Cloud Wizard (AI) — توليد ألعاب بالذكاء الاصطناعي',
                  '🎵 محرك صوت متكامل + Gamepad Support',
                  '💾 Autosave + Project History (Undo/Redo)',
                  '🕹️ تصدير NES ROM حقيقي + J2ME Mobile',
                  '🌐 تصدير HTML5 + استيراد GMK/GMX',
                  '🎨 16 ثيم بصري + 150 تأثير انتقالي',
                  '📊 محلل المشاريع + إصلاح تلقائي',
                  '🗺️ محرر مستويات + Isometric + 3D',
                  '🖼️ Paper2D Sprite Sheet Importer + 3D tab',
                  '📦 Model3D Library — استيراد وعرض نماذج GLB/GLTF/OBJ',
                  '☁️ Cloud Projects + قوالب محفوظة',
                ].map(f => <div key={f} className="flex items-center gap-2">{f}</div>)}
              </div>
              <div className="flex gap-2 w-full justify-center pt-1">
                <RetroButton onClick={() => setShowAbout(false)} className="px-8 justify-center">موافق</RetroButton>
              </div>
            </div>
          </div>
        </div>
      )}
      {templateToDelete && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"><div className="bg-win-face border-2 border-white shadow-win-out p-1 w-80 shadow-xl"><div className="bg-gradient-to-r from-win-blue to-win-blueGrad px-2 py-1 text-white text-xs font-bold flex justify-between items-center mb-4"><span>Delete Template</span><X size={12} className="cursor-pointer" onClick={() => setTemplateToDelete(null)}/></div><div className="px-4 pb-4 flex flex-col gap-4 text-win-text"><div className="flex items-center gap-4"><AlertTriangle size={32} className="text-yellow-500"/><div className="text-xs">Are you sure you want to delete this template?</div></div><div className="flex justify-center gap-4 pt-2"><RetroButton onClick={confirmDeleteTemplate} className="w-20 justify-center">Yes</RetroButton><RetroButton onClick={() => setTemplateToDelete(null)} className="w-20 justify-center">No</RetroButton></div></div></div></div>}
      {templatesToDelete.length > 0 && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"><div className="bg-win-face border-2 border-white shadow-win-out p-1 w-80 shadow-xl"><div className="bg-gradient-to-r from-win-blue to-win-blueGrad px-2 py-1 text-white text-xs font-bold flex justify-between items-center mb-4"><span>Delete Templates</span><X size={12} className="cursor-pointer" onClick={() => setTemplatesToDelete([])}/></div><div className="px-4 pb-4 flex flex-col gap-4 text-win-text"><div className="flex items-center gap-4"><AlertTriangle size={32} className="text-yellow-500"/><div className="text-xs">Are you sure you want to delete {templatesToDelete.length} templates?</div></div><div className="flex justify-center gap-4 pt-2"><RetroButton onClick={confirmDeleteMultipleTemplates} className="w-20 justify-center">Yes</RetroButton><RetroButton onClick={() => setTemplatesToDelete([])} className="w-20 justify-center">No</RetroButton></div></div></div></div>}
      {successMessage && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"><div className="bg-win-face border-2 border-white shadow-win-out p-1 w-80 shadow-xl"><div className="bg-gradient-to-r from-win-blue to-win-blueGrad px-2 py-1 text-white text-xs font-bold flex justify-between items-center mb-4"><span>Success</span><X size={12} className="cursor-pointer" onClick={() => setSuccessMessage(null)}/></div><div className="px-4 pb-4 flex flex-col gap-4 text-win-text"><div className="flex items-center gap-4"><Check size={32} className="text-green-500"/><div className="text-xs">{successMessage}</div></div><div className="flex justify-center gap-4 pt-2"><RetroButton onClick={() => setSuccessMessage(null)} className="w-20 justify-center">OK</RetroButton></div></div></div></div>}
      {currentTransition && (
          <TransitionEffect
              settings={currentTransition}
              isActive={isTransitioning}
              onComplete={handleTransitionComplete}
          />
      )}
    </div>
    </ErrorBoundary>
  );
};

export default App;
