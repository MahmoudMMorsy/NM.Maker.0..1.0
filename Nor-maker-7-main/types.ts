export interface AndroidExportSettings {
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: number;
  targetSdkVersion: number;
  keystore?: {
    privateKeyPem: string;
    certificatePem: string;
  };
}

export interface GameMetadata {
  title: string;
  story: string;
  genre: string;
  controls: string;
  languages: string[];
  defaultLanguage: string;
  iconUrl?: string | null; // Base64 data URI of the custom app icon
  androidExportSettings?: AndroidExportSettings;
}

export interface Localization {
  [key: string]: {
    [lang: string]: string;
  };
}

export interface GeneratedGame {
  metadata: GameMetadata;
  assemblyCode: string; // 6502 Assembly
  boxArtUrl: string | null;
  webPrototype: string; // HTML/JS string for the iframe (NOR Engine)
  uiMenus: UIMenu[];
  defaultTransition?: TransitionSettings;
}

export type LevelData = number[]; // Flat array of integers

export interface LevelDataLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  data: number[]; // Grid data for this layer
}

export interface Stamp {
  id: string;
  name: string;
  width: number;
  height: number;
  data: number[]; // Grid data for the stamp
}

export interface RoomData {
    id: string;
    width: number;
    height: number;
    map: LevelData;
    layers?: LevelDataLayer[]; // Optional multi-layer support
    settings: RoomSettings;
    backgrounds: BackgroundDef[];
    views: ViewDef[];
    viewMode?: RoomViewMode;
    isoMap?: IsoCell[];
    scene3D?: Scene3DObject[];
}
export enum AppState {
  IDLE = 'IDLE',
  GENERATING_CONCEPTS = 'GENERATING_CONCEPTS',
  GENERATING_ART = 'GENERATING_ART',
  GENERATING_ASSETS = 'GENERATING_ASSETS',
  GENERATING_CODE = 'GENERATING_CODE',
  COMPLETED = 'COMPLETED',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// --- Visual Scripting Types ---

export type EventType = string;

export interface ActionParam {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  options?: string[]; // For select type
  value: any;
}

export interface GameAction {
  id: string; // Unique instance ID
  libId: string; // ID of the library definition (e.g., 'move_fixed')
  params: Record<string, any>;
}

export interface GameObject {
  id: string;
  name: string;
  spriteId: string | null;
  visible?: boolean;
  solid?: boolean;
  depth?: number;
  persistent?: boolean;
  parent?: string | null;
  mask?: string | null;
  animations?: {
    idle?: string;
    walk?: string;
    run?: string;
    jump?: string;
    fall?: string;
    attack1?: string;
    attack2?: string;
    defend?: string;
    hurt?: string;
    death?: string;
    crouch?: string;
    climb?: string;
    dash?: string;
    [key: string]: string | undefined;
  };
  health?: number; // Initial health
  lives?: number;  // Initial lives (usually global, but can be per-object if needed)
  role?: 'player' | 'ground' | 'item' | 'enemy' | 'decoration' | 'bullet' | 'boss' | 'npc';
  paper2d?: boolean;
  pixelPerfect?: boolean;
  events: {
    [key in EventType]?: GameAction[];
  };
  /** PaperZD-style Animation State Machine. Optional; when present it
   *  drives which sprite/animation is shown at runtime based on
   *  transition conditions. */
  stateMachine?: AnimationStateMachine;
  /** UE5-style visual blueprint. Optional. */
  blueprint?: VisualBlueprint;
  /** UE5-style physics body settings. Optional. */
  physicsBody?: PhysicsBody;
}

/* ---------- PaperZD-style Animation System ---------- */

export type AnimNotifyKind =
  | 'PlaySound' | 'SpawnFX' | 'DealDamage' | 'EnableHitbox'
  | 'DisableHitbox' | 'Footstep' | 'Custom';

export interface AnimNotify {
  id: string;
  /** Frame index (0-based) at which this notify fires. */
  frame: number;
  kind: AnimNotifyKind;
  /** Free-form payload string (sound name, fx name, damage amount, etc). */
  payload?: string;
}

export interface AnimSequence {
  id: string;
  name: string;
  /** SpriteAsset.id whose frames[] act as the animation source. */
  spriteId: string;
  fps: number;
  loop: boolean;
  pingPong?: boolean;
  notifies: AnimNotify[];
}

export interface AnimTransition {
  id: string;
  /** Source AnimState.id */
  from: string;
  /** Destination AnimState.id */
  to: string;
  /** Boolean expression evaluated against runtime variables, e.g. "vx > 0"
   *  or "isGrounded && input.jump". Empty string means always-true. */
  condition: string;
  /** Higher priority transitions are checked first. */
  priority?: number;
}

export interface AnimState {
  id: string;
  name: string;
  /** AnimSequence.id played while this state is active. */
  sequenceId: string | null;
  /** Layout position inside the FSM graph editor (px). */
  x: number;
  y: number;
}

export interface AnimationStateMachine {
  id: string;
  /** AnimState.id of the entry state. */
  initialStateId: string;
  states: AnimState[];
  transitions: AnimTransition[];
  sequences: AnimSequence[];
  /** Initial values of variables exposed to transition conditions. */
  variables: { name: string; value: number | string | boolean }[];
}

/* ---------- UE5-style Visual Blueprint (lite) ---------- */

export interface BPNode {
  id: string;
  /** Node kind (Event:BeginPlay, Event:Tick, Branch, SetVar, PlayAnim, Move,
   *  Spawn, PlaySound, Compare, Math, Print …). */
  kind: string;
  x: number;
  y: number;
  /** Free-form params keyed by name. */
  params: { [k: string]: string | number | boolean };
}

export interface BPLink {
  id: string;
  fromNodeId: string;
  fromPin: string; // 'exec' or named output
  toNodeId: string;
  toPin: string;
}

export interface VisualBlueprint {
  id: string;
  nodes: BPNode[];
  links: BPLink[];
}

/* ---------- UE5-style Physics (lite) ---------- */

export interface PhysicsBody {
  enabled: boolean;
  /** Body type: static (immovable), kinematic (script-driven), dynamic (gravity + forces). */
  bodyType: 'static' | 'kinematic' | 'dynamic';
  mass: number;
  gravityScale: number;
  friction: number;
  restitution: number; // bounciness 0..1
  /** Collision shape; box uses bbox, circle uses radius from sprite size. */
  shape: 'box' | 'circle' | 'capsule';
  fixedRotation?: boolean;
}

/* ---------- UE5-style Lighting (lite, applied to 3D preview & runtime 3D) ---------- */

export interface LightSource {
  id: string;
  kind: 'point' | 'directional' | 'spot' | 'ambient';
  position: [number, number, number];
  direction?: [number, number, number];
  color: string;        // hex
  intensity: number;
  range?: number;
  castShadow?: boolean;
}

export interface LightingSettings {
  ambientColor: string;
  ambientIntensity: number;
  shadowsEnabled: boolean;
  fogEnabled?: boolean;
  fogColor?: string;
  fogDensity?: number;
  lights: LightSource[];
}

// --- Room & Editor Types ---

export interface TransitionSettings {
    type: string; // 'fade', 'pixelate', 'circle_wipe', 'diamond_wipe', 'star_wipe', 'grid_wipe', 'scanline', 'noise', 'wave', 'mosaic', 'curtain', 'shutter', 'slide_left', 'slide_right', 'slide_up', 'slide_down', 'zoom_in', 'zoom_out', 'rotate', 'swirl', 'glitch', 'tv_off', 'heart_wipe', 'diagonal_wipe', 'checkerboard', 'gm8_create_center', 'gm8_create_left', 'gm8_create_right', 'gm8_create_top', 'gm8_create_bottom', 'gm8_interlace_h', 'gm8_interlace_v', 'gm8_push_left', 'gm8_push_right', 'gm8_push_top', 'gm8_push_bottom', 'gm8_rotate_left', 'gm8_rotate_right', 'mario_iris', 'pokemon_battle', 'zelda_fade', 'ff_swirl', 'megaman_slide'
    duration: number; // in ms
    color: string;
    easing: string; // 'linear', 'ease-in', 'ease-out', 'ease-in-out'
    params?: Record<string, any>; // For specific transition params
}

export interface RoomSettings {
    name: string;
    caption: string;
    speed: number;
    lives: number; // Global lives for the room/game
    persistent: boolean;
    clearView: boolean;
    creationCode: string;
    tileAnimSpeed: number;
    enableViews: boolean;
    snapX: number;
    snapY: number;
    bgColor: string;
    drawBgColor: boolean;
    cameraMode?: 'first_person' | 'third_person' | 'top_down' | 'isometric';
    transition?: TransitionSettings;
    /** UE5-style lighting for the 3D preview & exported runtime. */
    lighting?: RoomLighting;
    /** UE5-style world physics for the room. */
    physics?: RoomPhysics;
    /** UE5-style post-processing for the 3D preview. */
    postProcess?: RoomPostProcess;
}

export interface RoomLight {
    id: string;
    kind: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere';
    color: string;          // hex
    intensity: number;
    position?: [number, number, number];
    direction?: [number, number, number];
    range?: number;         // for point/spot
    angle?: number;         // for spot (radians)
    penumbra?: number;      // for spot 0..1
    groundColor?: string;   // for hemisphere
    castShadow?: boolean;
    enabled?: boolean;
}

export interface RoomLighting {
    enabled: boolean;
    skyColor: string;
    ambientColor: string;
    ambientIntensity: number;
    shadowsEnabled: boolean;
    fogEnabled: boolean;
    fogColor: string;
    fogNear: number;
    fogFar: number;
    /** Time of day 0..24 — auto-positions a sun directional light. */
    timeOfDay?: number;
    /** Auto-create a sun (directional) light driven by timeOfDay. */
    sunEnabled?: boolean;
    sunColor?: string;
    sunIntensity?: number;
    lights: RoomLight[];
}

export interface RoomPhysics {
    enabled: boolean;
    /** Gravity in units/sec^2; positive Y goes down for 2D. */
    gravityX: number;
    gravityY: number;
    gravityZ: number;
    /** Pixels-per-meter scale for the physics world. */
    pixelsPerMeter: number;
    /** Substeps per frame for stability (1..8). */
    substeps: number;
    /** Global drag for dynamic bodies (0 = none). */
    linearDamping: number;
    angularDamping: number;
    /** Allow sleeping bodies for performance. */
    allowSleep: boolean;
    /** World bounds — bodies outside are auto-destroyed. */
    worldBoundsEnabled?: boolean;
    worldBoundsMargin?: number;
}

export interface RoomPostProcess {
    enabled: boolean;
    bloom: boolean;
    bloomStrength: number;
    vignette: boolean;
    chromaticAberration: boolean;
    pixelize: boolean;
    pixelSize: number;
    toneMapping: 'none' | 'reinhard' | 'aces' | 'cineon';
    exposure: number;
}

/** Default lighting preset (mid-day sun + soft ambient). */
export const DEFAULT_ROOM_LIGHTING: RoomLighting = {
    enabled: true,
    skyColor: '#87ceeb',
    ambientColor: '#404040',
    ambientIntensity: 0.6,
    shadowsEnabled: true,
    fogEnabled: false,
    fogColor: '#cccccc',
    fogNear: 100,
    fogFar: 1000,
    timeOfDay: 12,
    sunEnabled: true,
    sunColor: '#fff4e0',
    sunIntensity: 1.0,
    lights: [],
};

export const DEFAULT_ROOM_PHYSICS: RoomPhysics = {
    enabled: false,
    gravityX: 0,
    gravityY: 980,
    gravityZ: 0,
    pixelsPerMeter: 32,
    substeps: 2,
    linearDamping: 0.01,
    angularDamping: 0.01,
    allowSleep: true,
    worldBoundsEnabled: true,
    worldBoundsMargin: 200,
};

export const DEFAULT_ROOM_POSTPROCESS: RoomPostProcess = {
    enabled: false,
    bloom: false,
    bloomStrength: 0.6,
    vignette: false,
    chromaticAberration: false,
    pixelize: false,
    pixelSize: 1,
    toneMapping: 'aces',
    exposure: 1.0,
};


export interface BackgroundDef {
    visible: boolean;
    foreground: boolean;
    source: string | null;
    tileH: boolean;
    tileV: boolean;
    stretch: boolean;
    x: number; y: number;
    hspeed: number; vspeed: number;
}

export interface ViewDef {
    visible: boolean;
    viewX: number; viewY: number; viewW: number; viewH: number;
    portX: number; portY: number; portW: number; portH: number;
    followObj: string | null;
    hBorder: number; vBorder: number;
    hSpeed: number; vSpeed: number;
}

// --- Asset Types ---

export interface SpriteAsset {
    id: string;
    name: string;
    src: string;
    role: 'player' | 'ground' | 'item' | 'enemy' | 'decoration' | 'bullet';
    frameWidth?: number;
    frameHeight?: number;
    paper2d?: boolean;
    pixelPerfect?: boolean;
    bboxLeft?: number;
    bboxRight?: number;
    bboxTop?: number;
    bboxBottom?: number;
    frames?: string[];
    // 3D model attached to this sprite. Persisted with the sprite so it
    // survives save/reload (fixes loss of 3D-models-inside-sprites bug).
    model3d?: {
        name: string;
        format: 'glb' | 'gltf' | 'obj';
        // data URI (base64) so it round-trips through .pnor JSON
        data: string;
        // selected animation, if any
        activeAnimation?: string;
        animationNames?: string[];
        scale?: number;
        offset?: [number, number, number];
        rotation?: [number, number, number];
    };
}

export interface ProjectElement {
    type: string;
    id: string;
}

export interface ProjectSnapshot {
    sprites: SpriteAsset[];
    backgroundAssets: BackgroundAsset[];
    soundAssets: SoundAsset[];
    fontAssets: FontAsset[];
    scripts: ScriptAsset[];
    gameObjects: GameObject[];
    rooms: RoomData[];
    uiMenus: UIMenu[];
    enabledExtensions: string[];
    stamps?: Stamp[];
}

export interface BackgroundAsset {
    id: string;
    name: string;
    src: string;
}

export interface SoundAsset {
    id: string;
    name: string;
    src: string;
}

export interface FontAsset {
    id: string;
    name: string;
    family: string;
    size: number;
    bold: boolean;
    italic: boolean;
}

export interface ScriptAsset {
    id: string;
    name: string;
    code: string;
}

export type RoomViewMode = '2d' | '2.5d' | '3d';

export interface IsoCell {
    x: number;
    y: number;
    z: number;
    tileId: number;
    isRamp?: boolean;
    rampDir?: 'N' | 'S' | 'E' | 'W';
}

export interface Scene3DObject {
    id: string;
    type: 'model' | 'light' | 'camera' | 'primitive';
    name: string;
    modelUrl?: string; // Blob URL for GLB/GLTF
    primitiveType?: 'box' | 'sphere' | 'cylinder' | 'plane';
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color?: string;
    castShadow: boolean;
    animations?: string[];
    activeAnimation?: string;
}

export interface Model3DAsset {
    id: string;
    name: string;
    src: string;         // Blob URL or data URI
    format: 'glb' | 'gltf' | 'obj' | 'fbx' | 'stl';
    thumbnail?: string;  // Base64 PNG preview
    polyCount?: number;
    textureCount?: number;
    animationNames?: string[];
    fileSize?: number;
}

export interface RoomData {
    id: string;
    width: number;
    height: number;
    map: LevelData;
    settings: RoomSettings;
    backgrounds: BackgroundDef[];
    views: ViewDef[];
    viewMode?: RoomViewMode;
    isoMap?: IsoCell[];
    scene3D?: Scene3DObject[];
}

// --- Theme Types ---
export interface Theme {
    id: string;
    name: string;
    colors: {
        face: string;       // Main window background
        highlight: string;  // 3D light edge
        shadow: string;     // 3D dark edge
        darkshadow: string; // 3D darkest edge
        text: string;       // Main text color
        blue: string;       // Title bar active start
        blueGrad: string;   // Title bar active end
        inactive: string;   // Title bar inactive start
        inactiveGrad: string; // Title bar inactive end
        select: string;     // Selection background
        workspace: string;  // The MDI background area
    }
}

export interface UIElement {
    id: string;
    name: string;
    type: 'text' | 'image' | 'bar' | 'button';
    x: number;
    y: number;
    w: number;
    h: number;
    text?: string;
    spriteId?: string;
    barColor?: string;
    barValue?: string; // Expression to evaluate (e.g., 'window.health')
    action?: string; // JS code to execute on click
    textColor?: string;
    bgColor?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    visible: boolean;
    groupId?: string;
}

export interface UIMenu {
    id: string;
    name: string;
    elements: UIElement[];
    visible: boolean;
}

export interface WindowData {
    id: string;
    type: 'sprite' | 'object' | 'room' | 'script' | 'background' | 'sound' | 'font' | 'library' | 'console' | 'android_export' | 'settings' | 'info' | 'analyzer' | 'runner' | 'sprites' | 'backgrounds_edit' | 'sounds_edit' | 'fonts_edit' | 'script_edit' | 'ui_edit' | 'object_edit' | 'extensions' | 'tileset_edit' | 'three_d' | 'model3d_editor' | 'isometric' | 'noor_library';
    targetId?: string; // ID of the specific asset being edited
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    isMinimized: boolean;
    isMaximized: boolean;
}

// --- GMX Types ---

export interface GMXProject {
  name: string;
  sprites: Map<string, GMXSprite>;
  objects: Map<string, GMXObject>;
  rooms: Map<string, GMXRoom>;
  backgrounds: Map<string, GMXRoomBackground>;
}

export interface GMXSprite {
  name: string;
  width: number;
  height: number;
  xorig: number;
  yorig: number;
  bbox_left?: number;
  bbox_right?: number;
  bbox_top?: number;
  bbox_bottom?: number;
  frames: string[]; // Blob URLs
}

export interface GMXObject {
  name: string;
  spriteName: string | null;
  solid: boolean;
  visible: boolean;
  depth: number;
  persistent: boolean;
  parentName: string | null;
  events: GMXEvent[];
}

export interface GMXEvent {
  type: number;
  enumb: number;
  actions: GMXAction[];
  eventKey: string;   // e.g. 'step', 'keyboard_ArrowLeft', 'collision_obj_wall'
}

export interface GMXAction {
  libid: number;
  id: number;
  kind: number;
  userelative: boolean;
  isquestion: boolean;
  useapplyto: boolean;
  exetype: number;
  functionname: string;
  codestring: string;  // compiled JS-compatible code string
}

export interface GMXRoom {
  name: string;
  width: number;
  height: number;
  speed: number;
  instances: GMXInstance[];
  backgrounds: GMXRoomBackground[];
  creationCode?: string;
}

export interface GMXInstance {
  objName: string;
  x: number;
  y: number;
  name: string;
  creationCode?: string;
}

export interface GMXRoomBackground {
  visible: boolean;
  foreground: boolean;
  name: string;
  x: number;
  y: number;
  htiled: boolean;
  vtiled: boolean;
  hspeed: number;
  vspeed: number;
  stretch: boolean;
  src?: string;        // Blob URL for loaded background image
}
