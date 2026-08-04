import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import {
    Waypoints, RotateCw, Square, Rocket, Box, Target, Layout, Palette, Info,
    Grid, Upload, Download, Trash2, Copy, Sun, Lightbulb, Camera, Video,
    Play, Pause, Plus, Eye, EyeOff, Layers, Move, RefreshCw, Maximize2,
    ChevronRight, ChevronDown, Globe, Zap, Film, RotateCcw, Lock, Unlock,
    Image as ImageIcon, Package, Settings, AlignCenter
} from 'lucide-react';
import { RoomData, SpriteAsset, GameObject } from '../types';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Light3D {
    id: string; name: string;
    type: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere';
    color: string; intensity: number;
    position: [number, number, number];
    castShadow: boolean; visible: boolean;
    // spot/point
    distance?: number; angle?: number; penumbra?: number;
    // hemisphere
    groundColor?: string;
}

interface Camera3D {
    id: string; name: string;
    type: 'perspective' | 'orthographic';
    position: [number, number, number];
    target: [number, number, number];
    fov?: number; near: number; far: number;
    isActive: boolean;
}

interface WorldSettings {
    fogEnabled: boolean; fogColor: string; fogNear: number; fogFar: number;
    skyColor: string; groundColor: string;
    ambientIntensity: number;
    shadowsEnabled: boolean;
    postProcessing: boolean;
    pixelSize: number;
}

interface ThreeDEditorProps {
    room: RoomData;
    sprites: SpriteAsset[];
    gameObjects: GameObject[];
    selectedTileId?: number;
    onUpdateMap?: (newMap: number[]) => void;
    onUpdateScene?: (sceneData: any) => void;
    model3DAssets?: import('../types').Model3DAsset[];
    onAddModel3DAsset?: (asset: import('../types').Model3DAsset) => void;
    /** Optional controlled camera angle. When provided, parent owns the view. */
    viewType?: 'perspective' | 'top' | 'front' | 'side' | 'bottom' | 'back' | 'left' | 'isometric';
    onViewTypeChange?: (v: 'perspective' | 'top' | 'front' | 'side' | 'bottom' | 'back' | 'left' | 'isometric') => void;
    /** Hide the built-in top toolbar (when an external one is provided). */
    hideTopToolbar?: boolean;
}

/* ─── Panel header ────────────────────────────────────────────────────────── */
const PanelHeader = ({ title, icon, count }: { title: string; icon: React.ReactNode; count?: number }) => (
    <div className="px-2 py-1.5 bg-[#252525] border-b border-[#333] flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            {icon} {title}
        </span>
        {count !== undefined && <span className="text-[9px] bg-[#333] text-gray-400 px-1.5 rounded-full">{count}</span>}
    </div>
);

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-1">
        <span className="w-16 text-[10px] text-gray-500 shrink-0">{label}</span>
        <div className="flex-1">{children}</div>
    </div>
);

const Vec3Row = ({ label, value, onChange, step = 0.5 }: { label: string; value: [number,number,number]; onChange: (v:[number,number,number]) => void; step?: number }) => (
    <FieldRow label={label}>
        <div className="grid grid-cols-3 gap-1">
            {(['X','Y','Z'] as const).map((axis,i) => (
                <div key={axis} className="flex items-center bg-[#2d2d2d] border border-[#3a3a3a] rounded">
                    <span className={`text-[9px] font-bold px-1 ${axis==='X'?'text-red-400':axis==='Y'?'text-green-400':'text-blue-400'}`}>{axis}</span>
                    <input type="number" value={value[i].toFixed(2)} step={step}
                        onChange={e => { const n=[...value] as [number,number,number]; n[i]=parseFloat(e.target.value)||0; onChange(n); }}
                        className="w-full bg-transparent text-white text-[10px] outline-none pr-1 py-0.5" />
                </div>
            ))}
        </div>
    </FieldRow>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const ThreeDEditor: React.FC<ThreeDEditorProps> = ({
    room, sprites, gameObjects, selectedTileId = 0, onUpdateMap, onUpdateScene,
    model3DAssets = [], onAddModel3DAsset,
    viewType: viewTypeProp, onViewTypeChange, hideTopToolbar = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
    const perspectiveCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const transformControlRef = useRef<TransformControls | null>(null);
    const gridRef = useRef<THREE.GridHelper | null>(null);
    const lightObjectsRef = useRef<Map<string, THREE.Light>>(new Map());
    const extraCamerasRef = useRef<Map<string, THREE.PerspectiveCamera | THREE.OrthographicCamera>>(new Map());
    const cameraHelpersRef = useRef<Map<string, THREE.CameraHelper>>(new Map());
    const mixersRef = useRef<THREE.AnimationMixer[]>([]);
    const clockRef = useRef(new THREE.Clock());
    const model3dInputRef = useRef<HTMLInputElement>(null);
    const texInputRef = useRef<HTMLInputElement>(null);
    const skyboxInputRef = useRef<HTMLInputElement>(null);

    const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
    const [sceneObjects, setSceneObjects] = useState<THREE.Object3D[]>([]);
    const [showGrid, setShowGrid] = useState(true);
    const [importStatus, setImportStatus] = useState<string>('');
    const [viewTypeInternal, setViewTypeInternal] = useState<'perspective' | 'top' | 'front' | 'side' | 'bottom' | 'back' | 'left' | 'isometric'>('perspective');
    const viewType = viewTypeProp ?? viewTypeInternal;
    const setViewType = (v: 'perspective' | 'top' | 'front' | 'side' | 'bottom' | 'back' | 'left' | 'isometric') => {
        if (onViewTypeChange) onViewTypeChange(v);
        if (viewTypeProp === undefined) setViewTypeInternal(v);
    };
    const [isFlyMode, setIsFlyModeState] = useState(false);
    const isFlyModeRef = useRef(false);
    const keysPressed = useRef<Record<string, boolean>>({});
    const flySpeed = useRef(2.5);
    const mouseSensitivity = 0.002;

    // Panels
    const [activeRightPanel, setActiveRightPanel] = useState<'outliner' | 'lights' | 'cameras' | 'world' | 'details' | 'assets'>('outliner');
    const [outlinerExpanded, setOutlinerExpanded] = useState<Set<string>>(new Set());

    // Lights
    const [lights, setLights] = useState<Light3D[]>([
        { id: 'l_ambient', name: 'Ambient Light', type: 'ambient', color: '#ffffff', intensity: 0.5, position: [0,0,0], castShadow: false, visible: true },
        { id: 'l_sun', name: 'Sun', type: 'directional', color: '#fff5e0', intensity: 1.2, position: [100,200,100], castShadow: true, visible: true },
    ]);
    const [selectedLightId, setSelectedLightId] = useState<string | null>(null);

    // Cameras
    const [cameras, setCameras] = useState<Camera3D[]>([
        { id: 'cam_main', name: 'Main Camera', type: 'perspective', position: [150,150,150], target: [0,0,0], fov: 75, near: 0.1, far: 5000, isActive: true },
    ]);
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

    // World
    const [world, setWorld] = useState<WorldSettings>({
        fogEnabled: false, fogColor: '#cccccc', fogNear: 200, fogFar: 1000,
        skyColor: '#1a1a2e', groundColor: '#0a0a0a',
        ambientIntensity: 0.5,
        shadowsEnabled: true,
        postProcessing: false,
        pixelSize: 1,
    });

    const [trackingTarget, setTrackingTarget] = useState<string>('');
    const [trackingMode, setTrackingMode] = useState<'follow' | 'look_at' | 'orbit'>('follow');
    const [showTrackingPanel, setShowTrackingPanel] = useState(false);
    const [isPlayMode, setIsPlayMode] = useState(false);

    /* ─── Scene Init ─────────────────────────────────────────────────────── */
    const setIsFlyMode = (val: boolean) => { setIsFlyModeState(val); isFlyModeRef.current = val; };

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(world.skyColor);
        sceneRef.current = scene;

        const container = containerRef.current;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;
        const aspect = width / height;

        // Perspective Camera
        const pCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 5000);
        pCamera.position.set(150, 150, 150);
        pCamera.lookAt(0, 0, 0);
        perspectiveCameraRef.current = pCamera;

        // Ortho Camera
        const frustumSize = 400;
        const oCamera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2,
            frustumSize / 2, frustumSize / -2, 0.1, 5000
        );
        oCamera.position.set(0, 200, 0); oCamera.lookAt(0, 0, 0);
        orthoCameraRef.current = oCamera;
        cameraRef.current = pCamera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = world.shadowsEnabled;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(pCamera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.05;
        controls.screenSpacePanning = true;
        controlsRef.current = controls;

        // Grid & Axes
        const grid = new THREE.GridHelper(2000, 100, 0x444444, 0x222222);
        grid.position.y = -0.1; grid.visible = showGrid;
        scene.add(grid); gridRef.current = grid;

        const axes = new THREE.AxesHelper(50);
        scene.add(axes);

        // Floor for raycasting
        const floorMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2000, 2000),
            new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
        );
        floorMesh.rotation.x = -Math.PI / 2; floorMesh.name = 'floor';
        scene.add(floorMesh);

        // Transform Controls
        const tControls = new TransformControls(pCamera, renderer.domElement);
        tControls.setSize(0.8);
        tControls.addEventListener('dragging-changed', e => { controls.enabled = !e.value; });
        scene.add(tControls.getHelper());
        transformControlRef.current = tControls;

        // Input handlers
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed.current[e.key.toLowerCase()] = true;
            if (e.key === 'w' && !isFlyModeRef.current) setTransformMode('translate');
            if (e.key === 'e' && !isFlyModeRef.current) setTransformMode('rotate');
            if (e.key === 'r' && !isFlyModeRef.current) setTransformMode('scale');
            if (e.key === 'g') setShowGrid(p => !p);
            if (e.key === 'Delete') { /* handled below */ }
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };

        const onPointerDown = (event: PointerEvent) => {
            if (event.button === 2) {
                setIsFlyMode(true);
                renderer.domElement.requestPointerLock();
                return;
            }
            if (event.button !== 0) return;
            const rect = container.getBoundingClientRect();
            if ((event.target as HTMLElement).closest('.ui-overlay')) return;
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, cameraRef.current!);
            const hits = raycaster.intersectObjects(scene.children, true);
            const isGizmo = hits.some(h => { let o: THREE.Object3D | null = h.object; while(o){ if((o as any).isTransformControlsGizmo) return true; o=o.parent;} return false; });
            if (isGizmo) return;
            const hit = hits.find(h => h.object.name === 'dynamic_obj');
            if (hit) { setSelectedObject(hit.object); tControls.attach(hit.object); }
            else if (!tControls.dragging) {
                const floorHit = hits.find(h => h.object.name === 'floor');
                if (floorHit && onUpdateMap && selectedTileId > 0) {
                    const {x, z} = floorHit.point;
                    const G = 16, col = Math.floor(x/G + room.width/2), row = Math.floor(z/G + room.height/2);
                    if (col >= 0 && col < room.width && row >= 0 && row < room.height) {
                        const newMap = [...room.map]; newMap[row * room.width + col] = selectedTileId; onUpdateMap(newMap);
                    }
                } else { setSelectedObject(null); tControls.detach(); }
            }
        };
        const onPointerUp = (e: PointerEvent) => { if (e.button === 2) { setIsFlyMode(false); document.exitPointerLock(); } };
        const onMouseMove = (e: MouseEvent) => {
            if (isFlyModeRef.current && document.pointerLockElement === renderer.domElement) {
                const cam = perspectiveCameraRef.current; if (!cam) return;
                const euler = new THREE.Euler(0,0,0,'YXZ');
                euler.setFromQuaternion(cam.quaternion);
                euler.y -= e.movementX * mouseSensitivity;
                euler.x -= e.movementY * mouseSensitivity;
                euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x));
                cam.quaternion.setFromEuler(euler);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('mousemove', onMouseMove);

        // Animation loop
        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const delta = clockRef.current.getDelta();
            mixersRef.current.forEach(m => m.update(delta));

            if (isFlyModeRef.current && perspectiveCameraRef.current) {
                const cam = perspectiveCameraRef.current;
                const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
                const right = new THREE.Vector3(); right.crossVectors(dir, new THREE.Vector3(0,1,0)).normalize();
                const spd = flySpeed.current;
                if (keysPressed.current['w']) cam.position.addScaledVector(dir, spd);
                if (keysPressed.current['s']) cam.position.addScaledVector(dir, -spd);
                if (keysPressed.current['a']) cam.position.addScaledVector(right, -spd);
                if (keysPressed.current['d']) cam.position.addScaledVector(right, spd);
                if (keysPressed.current['q']) cam.position.y -= spd;
                if (keysPressed.current['e']) cam.position.y += spd;
                controls.target.copy(cam.position).add(dir);
            }
            controls.update();
            if (cameraRef.current) renderer.render(scene, cameraRef.current);
        };
        animate();

        const handleResize = () => {
            const w = container.clientWidth || 800, h = container.clientHeight || 600;
            const asp = w / h;
            if (perspectiveCameraRef.current) { perspectiveCameraRef.current.aspect = asp; perspectiveCameraRef.current.updateProjectionMatrix(); }
            if (orthoCameraRef.current) { const f=400; orthoCameraRef.current.left=f*asp/-2; orthoCameraRef.current.right=f*asp/2; orthoCameraRef.current.top=f/2; orthoCameraRef.current.bottom=f/-2; orthoCameraRef.current.updateProjectionMatrix(); }
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);
        populateScene();

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            renderer.domElement.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('mousemove', onMouseMove);
            tControls.detach(); tControls.dispose();
            renderer.dispose();
            if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
    }, []);

    /* ─── Sync lights ────────────────────────────────────────────────────── */
    useEffect(() => {
        const scene = sceneRef.current; if (!scene) return;
        // Remove old lights
        lightObjectsRef.current.forEach(l => scene.remove(l));
        lightObjectsRef.current.clear();

        lights.forEach(ld => {
            let light: THREE.Light;
            switch(ld.type) {
                case 'ambient': light = new THREE.AmbientLight(ld.color, ld.intensity); break;
                case 'directional': {
                    const d = new THREE.DirectionalLight(ld.color, ld.intensity);
                    d.castShadow = ld.castShadow;
                    d.shadow.mapSize.set(2048,2048);
                    d.shadow.camera.near = 0.5; d.shadow.camera.far = 1500;
                    d.shadow.camera.left = d.shadow.camera.bottom = -500;
                    d.shadow.camera.right = d.shadow.camera.top = 500;
                    light = d; break;
                }
                case 'point': {
                    const p = new THREE.PointLight(ld.color, ld.intensity, ld.distance||500);
                    p.castShadow = ld.castShadow; light = p; break;
                }
                case 'spot': {
                    const s = new THREE.SpotLight(ld.color, ld.intensity, ld.distance||500, ld.angle||Math.PI/4, ld.penumbra||0.1);
                    s.castShadow = ld.castShadow; light = s; break;
                }
                case 'hemisphere': {
                    light = new THREE.HemisphereLight(ld.color, ld.groundColor||'#444400', ld.intensity); break;
                }
                default: light = new THREE.AmbientLight(ld.color, ld.intensity);
            }
            light.position.set(...ld.position);
            light.visible = ld.visible;
            light.name = `light_${ld.id}`;
            scene.add(light);
            lightObjectsRef.current.set(ld.id, light);

            // Visual helper for non-ambient
            if (ld.type !== 'ambient' && ld.type !== 'hemisphere') {
                let helper: THREE.Object3D | null = null;
                if (ld.type === 'directional') helper = new THREE.DirectionalLightHelper(light as THREE.DirectionalLight, 20);
                else if (ld.type === 'point') helper = new THREE.PointLightHelper(light as THREE.PointLight, 8);
                else if (ld.type === 'spot') helper = new THREE.SpotLightHelper(light as THREE.SpotLight);
                if (helper) { helper.name = `helper_${ld.id}`; scene.add(helper); }
            }
        });
    }, [lights]);

    /* ─── Sync world fog/sky ─────────────────────────────────────────────── */
    useEffect(() => {
        const scene = sceneRef.current; if (!scene) return;
        scene.background = new THREE.Color(world.skyColor);
        if (world.fogEnabled) scene.fog = new THREE.Fog(world.fogColor, world.fogNear, world.fogFar);
        else scene.fog = null;
        if (rendererRef.current) rendererRef.current.shadowMap.enabled = world.shadowsEnabled;
    }, [world]);

    /* ─── Sync from RoomSettings.lighting (UE5-style "World Settings") ───── */
    /* When the user edits the LevelEditor → Room → World Settings panel, mirror
       those values into the internal world & lights state so the 3D preview
       updates instantly. Custom lights from the room are merged with whatever
       the user added directly in the 3D editor (custom lights from room win). */
    useEffect(() => {
        const lighting = (room as any)?.settings?.lighting;
        if (!lighting || !lighting.enabled) return;

        // Mirror sky/fog/shadows
        setWorld(prev => ({
            ...prev,
            skyColor: lighting.skyColor ?? prev.skyColor,
            ambientIntensity: lighting.ambientIntensity ?? prev.ambientIntensity,
            shadowsEnabled: lighting.shadowsEnabled ?? prev.shadowsEnabled,
            fogEnabled: !!lighting.fogEnabled,
            fogColor: lighting.fogColor ?? prev.fogColor,
            fogNear: lighting.fogNear ?? prev.fogNear,
            fogFar: lighting.fogFar ?? prev.fogFar,
        }));

        // Build a synthesized lights array: ambient + sun(timeOfDay) + custom
        const synth: Light3D[] = [];
        synth.push({
            id: 'room_ambient', name: 'Room Ambient', type: 'ambient',
            color: lighting.ambientColor || '#404040',
            intensity: lighting.ambientIntensity ?? 0.6,
            position: [0, 0, 0], castShadow: false, visible: true,
        });
        if (lighting.sunEnabled !== false) {
            const t = (lighting.timeOfDay ?? 12) / 24;        // 0..1
            const angle = t * Math.PI * 2 - Math.PI / 2;      // sunrise at 6h on +X
            const r = 600;
            const sunY = Math.sin(angle) * r;
            const sunX = Math.cos(angle) * r;
            const sunZ = 200;
            // Dim when below horizon
            const dim = Math.max(0, Math.min(1, (sunY + 100) / 300));
            synth.push({
                id: 'room_sun', name: 'Sun', type: 'directional',
                color: lighting.sunColor || '#fff4e0',
                intensity: (lighting.sunIntensity ?? 1) * dim,
                position: [sunX, Math.max(50, sunY), sunZ],
                castShadow: !!lighting.shadowsEnabled, visible: true,
            });
        }
        (lighting.lights || []).forEach((rl: any) => {
            if (rl.enabled === false) return;
            synth.push({
                id: `room_${rl.id}`,
                name: rl.kind,
                type: rl.kind,
                color: rl.color,
                intensity: rl.intensity,
                position: rl.position || [0, 100, 0],
                castShadow: !!rl.castShadow,
                visible: true,
                distance: rl.range,
                angle: rl.angle,
                penumbra: rl.penumbra,
                groundColor: rl.groundColor,
            });
        });
        // Replace any prior room-driven lights, keep user-added ones
        setLights(prev => [
            ...prev.filter(l => !l.id.startsWith('room_')),
            ...synth,
        ]);
    }, [(room as any)?.settings?.lighting]);

    /* ─── Sync from RoomSettings.postProcess (tone mapping / exposure) ───── */
    useEffect(() => {
        const pp = (room as any)?.settings?.postProcess;
        const renderer = rendererRef.current;
        if (!renderer || !pp || !pp.enabled) {
            if (renderer) {
                renderer.toneMapping = THREE.NoToneMapping;
                renderer.toneMappingExposure = 1;
            }
            return;
        }
        const map: Record<string, THREE.ToneMapping> = {
            none: THREE.NoToneMapping,
            reinhard: THREE.ReinhardToneMapping,
            aces: THREE.ACESFilmicToneMapping,
            cineon: THREE.CineonToneMapping,
        };
        renderer.toneMapping = map[pp.toneMapping] ?? THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = pp.exposure ?? 1;
    }, [(room as any)?.settings?.postProcess]);

    /* ─── Camera extra helpers ───────────────────────────────────────────── */
    useEffect(() => {
        const scene = sceneRef.current; if (!scene) return;
        cameraHelpersRef.current.forEach(h => scene.remove(h));
        cameraHelpersRef.current.clear();
        extraCamerasRef.current.forEach(c => scene.remove(c));
        extraCamerasRef.current.clear();

        cameras.filter(c => !c.isActive).forEach(cd => {
            const cam = new THREE.PerspectiveCamera(cd.fov||60, 16/9, cd.near, cd.far);
            cam.position.set(...cd.position);
            cam.lookAt(new THREE.Vector3(...cd.target));
            cam.name = `user_cam_${cd.id}`;
            const helper = new THREE.CameraHelper(cam);
            helper.name = `cam_helper_${cd.id}`;
            scene.add(cam); scene.add(helper);
            extraCamerasRef.current.set(cd.id, cam);
            cameraHelpersRef.current.set(cd.id, helper);
        });
    }, [cameras]);

    /* ─── Grid visibility ────────────────────────────────────────────────── */
    useEffect(() => { if (gridRef.current) gridRef.current.visible = showGrid; }, [showGrid]);

    /* ─── View type ──────────────────────────────────────────────────────── */
    useEffect(() => {
        const pCam = perspectiveCameraRef.current, oCam = orthoCameraRef.current;
        const controls = controlsRef.current, tCtrls = transformControlRef.current;
        if (!pCam || !oCam || !controls || !tCtrls) return;
        if (viewType === 'perspective') {
            cameraRef.current = pCam; controls.object = pCam; tCtrls.camera = pCam; controls.enableRotate = true;
        } else {
            cameraRef.current = oCam; controls.object = oCam; tCtrls.camera = oCam; controls.enableRotate = false;
            const dist = 500, fSize = 400;
            const w = containerRef.current?.clientWidth||800, h = containerRef.current?.clientHeight||600;
            const asp = w/h;
            oCam.left = fSize*asp/-2; oCam.right = fSize*asp/2; oCam.top = fSize/2; oCam.bottom = fSize/-2;
            const pos: Record<string,[number,number,number]> = {
                top:[0,dist,0], bottom:[0,-dist,0], front:[0,0,dist], back:[0,0,-dist],
                left:[-dist,0,0], side:[dist,0,0], isometric:[dist,dist,dist]
            };
            if (pos[viewType]) oCam.position.set(...pos[viewType]);
            oCam.lookAt(0,0,0); oCam.updateProjectionMatrix();
            controls.target.set(0,0,0);
        }
    }, [viewType]);

    useEffect(() => {
        if (transformControlRef.current && cameraRef.current) {
            transformControlRef.current.camera = cameraRef.current;
            if (selectedObject) transformControlRef.current.attach(selectedObject);
        }
    }, [selectedObject]);
    useEffect(() => { transformControlRef.current?.setMode(transformMode); }, [transformMode]);

    /* ─── Populate scene from room ───────────────────────────────────────── */
    const populateScene = () => {
        const scene = sceneRef.current; if (!scene) return;
        // Remove existing dynamic objects
        const toRemove: THREE.Object3D[] = [];
        scene.traverse(c => { if (c.name === 'dynamic_obj') toRemove.push(c); });
        toRemove.forEach(o => scene.remove(o));

        const {map, width, height} = room;
        const G = 16;

        for (let i = 0; i < map.length; i++) {
            const val = map[i]; if (val === 0) continue;
            const col = i % width, row = Math.floor(i / width);
            const x = (col - width/2) * G, z = (row - height/2) * G;

            if (val === 1) {
                const geo = new THREE.BoxGeometry(G, G, G);
                const mat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
                const box = new THREE.Mesh(geo, mat);
                box.position.set(x, G/2, z); box.name = 'dynamic_obj';
                box.castShadow = true; box.receiveShadow = true;
                box.userData = { isWall: true, tileId: val };
                scene.add(box);
            } else {
                const obj = gameObjects[val - 2];
                if (obj?.spriteId) {
                    const sp = sprites.find(s => s.id === obj.spriteId);
                    if (sp?.src) {
                        const tex = new THREE.TextureLoader().load(sp.src);
                        tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
                        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
                        sprite.scale.set(G, G, 1); sprite.position.set(x, G/2, z);
                        sprite.name = 'dynamic_obj'; sprite.userData = { objName: obj.name, spriteId: obj.spriteId };
                        scene.add(sprite);
                    }
                }
            }
        }

        // Instantiate persisted Scene3D objects (UE5-style mixed 2D + 3D)
        const persisted = (room as any).scene3D as Array<any> | undefined;
        if (persisted && persisted.length > 0) {
            persisted.forEach(obj => {
                let mesh: THREE.Object3D | null = null;
                if (obj.type === 'primitive') {
                    let geo: THREE.BufferGeometry;
                    switch (obj.primitiveType) {
                        case 'sphere':   geo = new THREE.SphereGeometry(8, 24, 16); break;
                        case 'cylinder': geo = new THREE.CylinderGeometry(8, 8, 16, 24); break;
                        case 'plane':    geo = new THREE.PlaneGeometry(16, 16); break;
                        default:         geo = new THREE.BoxGeometry(16, 16, 16);
                    }
                    const mat = new THREE.MeshStandardMaterial({ color: obj.color || 0xcccccc, roughness: 0.6 });
                    mesh = new THREE.Mesh(geo, mat);
                } else if (obj.type === 'model' && obj.modelUrl) {
                    // Placeholder marker until async loader resolves
                    const placeholder = new THREE.Mesh(
                        new THREE.BoxGeometry(12, 12, 12),
                        new THREE.MeshStandardMaterial({ color: 0x9b59b6, transparent: true, opacity: 0.55 })
                    );
                    placeholder.name = 'dynamic_obj';
                    placeholder.position.set(obj.position[0], obj.position[1] + 6, obj.position[2]);
                    placeholder.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
                    placeholder.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
                    placeholder.castShadow = !!obj.castShadow;
                    placeholder.userData = { objName: obj.name, scene3DId: obj.id, isPlaceholder: true };
                    scene.add(placeholder);

                    const url = obj.modelUrl as string;
                    const ext = url.startsWith('data:') ? 'glb' : (url.split('.').pop()?.toLowerCase() || 'glb');
                    (async () => {
                        try {
                            let root: THREE.Object3D | null = null;
                            if (ext === 'glb' || ext === 'gltf') {
                                const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
                                const gltf = await new Promise<any>((res, rej) => new GLTFLoader().load(url, res, undefined, rej));
                                root = gltf.scene;
                            } else if (ext === 'obj') {
                                const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
                                root = await new Promise<any>((res, rej) => new OBJLoader().load(url, res, undefined, rej));
                            } else if (ext === 'fbx') {
                                const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
                                root = await new Promise<any>((res, rej) => new FBXLoader().load(url, res, undefined, rej));
                            }
                            if (!root || !sceneRef.current) return;
                            const box = new THREE.Box3().setFromObject(root);
                            const center = box.getCenter(new THREE.Vector3());
                            root.position.sub(center);
                            root.position.add(new THREE.Vector3(obj.position[0], obj.position[1] + 6, obj.position[2]));
                            root.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
                            root.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
                            root.name = 'dynamic_obj';
                            root.traverse((c: any) => { if (c.isMesh) { c.name = 'dynamic_obj'; c.castShadow = !!obj.castShadow; c.receiveShadow = true; } });
                            root.userData = { objName: obj.name, scene3DId: obj.id };
                            sceneRef.current.remove(placeholder);
                            sceneRef.current.add(root);
                            const dyn: THREE.Object3D[] = [];
                            sceneRef.current.traverse(c => { if (c.name === 'dynamic_obj') dyn.push(c); });
                            setSceneObjects(dyn);
                        } catch (err) {
                            console.warn('[Scene3D] failed to load model', obj.name, err);
                        }
                    })();
                }
                if (mesh) {
                    mesh.name = 'dynamic_obj';
                    mesh.position.set(obj.position[0], obj.position[1] + 8, obj.position[2]);
                    mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
                    mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
                    mesh.castShadow = !!obj.castShadow;
                    mesh.receiveShadow = true;
                    mesh.userData = { objName: obj.name, scene3DId: obj.id };
                    scene.add(mesh);
                }
            });
        }

        // Collect dynamic objects for outliner
        const dynObjs: THREE.Object3D[] = [];
        scene.traverse(c => { if (c.name === 'dynamic_obj') dynObjs.push(c); });
        setSceneObjects(dynObjs);
    };
    useEffect(() => { populateScene(); }, [room.map, gameObjects, (room as any).scene3D]);

    /* ─── 3D Model Import ────────────────────────────────────────────────── */
    const handle3DModelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file || !sceneRef.current) return;
        e.target.value = '';
        setImportStatus('جاري التحميل...');
        try {
            const url = URL.createObjectURL(file);
            const ext = file.name.split('.').pop()?.toLowerCase();
            const scene = sceneRef.current;
            let root: THREE.Object3D;
            let animations: THREE.AnimationClip[] = [];

            if (ext === 'glb' || ext === 'gltf') {
                const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
                const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
                const loader = new GLTFLoader();
                const draco = new DRACOLoader();
                draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
                loader.setDRACOLoader(draco);
                const gltf = await new Promise<any>((res,rej) => loader.load(url, res, undefined, rej));
                root = gltf.scene; animations = gltf.animations||[];
            } else if (ext === 'obj') {
                const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
                root = await new Promise<any>((res,rej) => new OBJLoader().load(url, res, undefined, rej));
            } else if (ext === 'fbx') {
                const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
                const fbx = await new Promise<any>((res,rej) => new FBXLoader().load(url, res, undefined, rej));
                root = fbx; animations = fbx.animations||[];
            } else { setImportStatus('❌ صيغة غير مدعومة (gltf/glb/obj/fbx)'); return; }

            // Auto-center
            const box3 = new THREE.Box3().setFromObject(root);
            const center = box3.getCenter(new THREE.Vector3());
            root.position.sub(center);
            root.name = 'dynamic_obj';
            root.traverse((c:any) => {
                if (c.isMesh) { c.name='dynamic_obj'; c.castShadow=true; c.receiveShadow=true; c.userData={objName: file.name.replace(/\.[^.]+$/,''), isImported:true}; }
            });
            root.userData = { objName: file.name.replace(/\.[^.]+$/,''), isImported: true };
            scene.add(root);

            // Animations
            if (animations.length > 0) {
                const mixer = new THREE.AnimationMixer(root);
                mixersRef.current.push(mixer);
                mixer.clipAction(animations[0]).play();
            }

            setSceneObjects(prev => [...prev, root]);
            URL.revokeObjectURL(url);
            setImportStatus(`✅ ${file.name}`);
            setTimeout(() => setImportStatus(''), 3000);
        } catch (err: any) {
            setImportStatus(`❌ ${err.message || 'خطأ في التحميل'}`);
            setTimeout(() => setImportStatus(''), 4000);
        }
    };

    /* ─── Scene Export ───────────────────────────────────────────────────── */
    const handleExport = async (format: 'glb' | 'gltf' | 'obj' | 'screenshot') => {
        const scene = sceneRef.current; if (!scene) return;
        try {
            if (format === 'screenshot') {
                const renderer = rendererRef.current, cam = cameraRef.current;
                if (!renderer || !cam) return;
                renderer.render(scene, cam);
                const a = document.createElement('a');
                a.href = renderer.domElement.toDataURL('image/png');
                a.download = `screenshot_${Date.now()}.png`; a.click();
                return;
            }
            if (format === 'glb' || format === 'gltf') {
                const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
                const binary = format === 'glb';
                new GLTFExporter().parse(
                    scene,
                    (result: any) => {
                        const blob = result instanceof ArrayBuffer
                            ? new Blob([result], { type: 'model/gltf-binary' })
                            : new Blob([JSON.stringify(result)], { type: 'model/gltf+json' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `scene_${Date.now()}.${format}`; a.click();
                    },
                    (err: any) => console.error(err),
                    { binary }
                );
            } else if (format === 'obj') {
                const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js');
                const str = new OBJExporter().parse(scene);
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([str], {type:'text/plain'}));
                a.download = `scene_${Date.now()}.obj`; a.click();
            }
        } catch(err:any) { window.alert('Export error: '+err.message); }
    };

    /* ─── Object operations ──────────────────────────────────────────────── */
    const addPrimitive = (type: 'box'|'sphere'|'cylinder'|'plane'|'cone'|'torus') => {
        const scene = sceneRef.current; if (!scene) return;
        const geos: Record<string, THREE.BufferGeometry> = {
            box: new THREE.BoxGeometry(16,16,16),
            sphere: new THREE.SphereGeometry(8,16,16),
            cylinder: new THREE.CylinderGeometry(6,6,16,12),
            plane: new THREE.PlaneGeometry(32,32),
            cone: new THREE.ConeGeometry(8,16,12),
            torus: new THREE.TorusGeometry(8,2.5,12,36),
        };
        const mesh = new THREE.Mesh(
            geos[type],
            new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.5, metalness: 0.1 })
        );
        mesh.name = 'dynamic_obj';
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.userData = { objName: `${type}_${Date.now()}`, isPrimitive: true, primitiveType: type };
        scene.add(mesh);
        setSceneObjects(prev => [...prev, mesh]);
        setSelectedObject(mesh);
        transformControlRef.current?.attach(mesh);
    };

    const deleteSelected = () => {
        const scene = sceneRef.current; if (!selectedObject || !scene) return;
        transformControlRef.current?.detach();
        scene.remove(selectedObject);
        setSceneObjects(prev => prev.filter(o => o.uuid !== selectedObject.uuid));
        setSelectedObject(null);
    };

    const duplicateSelected = () => {
        const scene = sceneRef.current; if (!selectedObject || !scene) return;
        const clone = selectedObject.clone();
        clone.position.x += 20; clone.name = 'dynamic_obj';
        clone.userData = { ...selectedObject.userData, objName: selectedObject.userData.objName + '_copy' };
        scene.add(clone);
        setSceneObjects(prev => [...prev, clone]);
        setSelectedObject(clone);
        transformControlRef.current?.attach(clone);
    };

    const focusSelected = () => {
        if (!selectedObject || !controlsRef.current) return;
        controlsRef.current.target.copy(selectedObject.position);
        perspectiveCameraRef.current?.position.copy(selectedObject.position).add(new THREE.Vector3(50,50,50));
        controlsRef.current.update();
    };

    const toggleObjectVisibility = (obj: THREE.Object3D) => {
        obj.visible = !obj.visible;
        setSceneObjects(prev => [...prev]);
    };

    /* ─── Add light ──────────────────────────────────────────────────────── */
    const addLight = (type: Light3D['type']) => {
        const id = `l_${Date.now()}`;
        const newLight: Light3D = {
            id, name: `${type} Light`, type, color: '#ffffff',
            intensity: type==='ambient'?0.3:1.0, position:[0,100,0],
            castShadow: type==='directional'||type==='spot', visible:true,
            distance: 500, angle: Math.PI/4, penumbra: 0.15, groundColor: '#333300'
        };
        setLights(prev => [...prev, newLight]);
        setSelectedLightId(id);
    };

    const removeLight = (id: string) => {
        setLights(prev => prev.filter(l => l.id !== id));
        const scene = sceneRef.current; if (!scene) return;
        const light = lightObjectsRef.current.get(id);
        if (light) scene.remove(light);
        // Remove helper
        const helper = scene.getObjectByName(`helper_${id}`);
        if (helper) scene.remove(helper);
    };

    /* ─── Add camera ─────────────────────────────────────────────────────── */
    const addCamera = () => {
        const id = `cam_${Date.now()}`;
        setCameras(prev => [...prev, {
            id, name: `Camera ${prev.length+1}`, type:'perspective',
            position:[100,100,100], target:[0,0,0], fov:60, near:0.1, far:5000, isActive:false
        }]);
        setSelectedCameraId(id);
    };

    const activateCamera = (id: string) => {
        setCameras(prev => prev.map(c => ({...c, isActive: c.id===id})));
        const cam = extraCamerasRef.current.get(id);
        if (cam) { cameraRef.current = cam; }
        else { cameraRef.current = perspectiveCameraRef.current; }
    };

    /* ─── Right Panel ────────────────────────────────────────────────────── */
    const renderRightPanel = () => {
        const light = lights.find(l => l.id === selectedLightId);
        const cam = cameras.find(c => c.id === selectedCameraId);

        return (
            <div className="w-64 h-full bg-[#1e1e1e] border-l border-[#333] flex flex-col z-10 shadow-2xl shrink-0">
                {/* Panel Tabs */}
                <div className="flex border-b border-[#333] shrink-0 overflow-x-auto">
                    {([
                        { id:'outliner', icon:<Layers size={10}/>,  label:'Scene' },
                        { id:'lights',   icon:<Sun size={10}/>,     label:'Lights' },
                        { id:'cameras',  icon:<Camera size={10}/>,  label:'Cameras' },
                        { id:'world',    icon:<Globe size={10}/>,   label:'World' },
                        { id:'details',  icon:<Info size={10}/>,    label:'Details' },
                        { id:'assets',   icon:<Package size={10}/>, label:'Assets' },
                    ] as const).map(tab => (
                        <button key={tab.id}
                            onClick={() => setActiveRightPanel(tab.id as any)}
                            className={`flex-1 py-1.5 text-[9px] flex flex-col items-center gap-0.5 border-b-2 transition-colors shrink-0 ${activeRightPanel===tab.id?'border-win-blue text-win-blue bg-[#1a2033]':'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >{tab.icon}<span>{tab.label}</span></button>
                    ))}
                </div>

                {/* Outliner */}
                {activeRightPanel==='outliner' && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <PanelHeader title="Scene Objects" icon={<Layers size={10}/>} count={sceneObjects.length}/>
                        <div className="flex-1 overflow-y-auto p-1">
                            {sceneObjects.length === 0 && (
                                <div className="text-center text-gray-600 text-[10px] py-4 italic">No objects in scene</div>
                            )}
                            {sceneObjects.map((obj, i) => (
                                <div key={obj.uuid}
                                    onClick={() => { setSelectedObject(obj); transformControlRef.current?.attach(obj); }}
                                    className={`px-2 py-1 text-[11px] cursor-pointer rounded flex items-center gap-2 mb-0.5 transition-colors group ${selectedObject?.uuid===obj.uuid?'bg-win-blue text-white':'text-gray-300 hover:bg-[#2d2d2d]'}`}
                                >
                                    <span className="opacity-40">
                                        {obj.userData.isWall ? <Box size={11}/> : obj.userData.isPrimitive ? <Square size={11}/> : obj.userData.isImported ? <Package size={11}/> : <Target size={11}/>}
                                    </span>
                                    <span className="truncate flex-1">{obj.userData.objName || `Object_${i}`}</span>
                                    <button onClick={e=>{e.stopPropagation();toggleObjectVisibility(obj);}}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        {obj.visible ? <Eye size={10}/> : <EyeOff size={10} className="text-gray-500"/>}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {/* Add Primitives */}
                        <div className="border-t border-[#333] p-2 shrink-0">
                            <div className="text-[9px] text-gray-500 mb-1 uppercase tracking-wide">Add Primitive</div>
                            <div className="grid grid-cols-3 gap-1">
                                {(['box','sphere','cylinder','plane','cone','torus'] as const).map(p => (
                                    <button key={p} onClick={() => addPrimitive(p)}
                                        className="py-1 text-[9px] bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 rounded capitalize border border-[#3a3a3a] transition-colors"
                                    >{p}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Lights Panel */}
                {activeRightPanel==='lights' && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <PanelHeader title="Lights" icon={<Sun size={10}/>} count={lights.length}/>
                        <div className="flex-1 overflow-y-auto p-1">
                            {lights.map(l => (
                                <div key={l.id}
                                    onClick={() => setSelectedLightId(l.id)}
                                    className={`px-2 py-1.5 rounded mb-0.5 cursor-pointer group flex items-center gap-2 text-[11px] transition-colors ${selectedLightId===l.id?'bg-[#1a3050] border border-[#2a5080]':'hover:bg-[#2d2d2d]'}`}
                                >
                                    <span className="text-yellow-400"><Sun size={11}/></span>
                                    <span className="flex-1 truncate text-gray-300">{l.name}</span>
                                    <span className="text-[9px] text-gray-500 capitalize">{l.type}</span>
                                    <button onClick={e=>{e.stopPropagation();setLights(p=>p.map(x=>x.id===l.id?{...x,visible:!x.visible}:x));}}
                                        className="opacity-0 group-hover:opacity-100">{l.visible?<Eye size={10}/>:<EyeOff size={10} className="text-gray-500"/>}</button>
                                    <button onClick={e=>{e.stopPropagation();removeLight(l.id);}}
                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400"><Trash2 size={10}/></button>
                                </div>
                            ))}
                        </div>
                        {/* Light props */}
                        {light && (
                            <div className="border-t border-[#333] p-2 shrink-0 max-h-60 overflow-y-auto">
                                <div className="text-[9px] text-gray-400 mb-2 font-bold uppercase">{light.name}</div>
                                <FieldRow label="Color">
                                    <input type="color" value={light.color}
                                        onChange={e=>setLights(p=>p.map(l=>l.id===selectedLightId?{...l,color:e.target.value}:l))}
                                        className="w-full h-6 rounded border border-[#3a3a3a] cursor-pointer bg-transparent"/>
                                </FieldRow>
                                <FieldRow label="Intensity">
                                    <input type="range" min="0" max="5" step="0.05" value={light.intensity}
                                        onChange={e=>setLights(p=>p.map(l=>l.id===selectedLightId?{...l,intensity:parseFloat(e.target.value)}:l))}
                                        className="w-full accent-yellow-400"/>
                                </FieldRow>
                                {light.type!=='ambient' && light.type!=='hemisphere' && (
                                    <Vec3Row label="Position" value={light.position}
                                        onChange={v=>setLights(p=>p.map(l=>l.id===selectedLightId?{...l,position:v}:l))} step={10}/>
                                )}
                                {(light.type==='point'||light.type==='spot') && (
                                    <FieldRow label="Distance">
                                        <input type="number" value={light.distance||500} step="50"
                                            onChange={e=>setLights(p=>p.map(l=>l.id===selectedLightId?{...l,distance:parseFloat(e.target.value)}:l))}
                                            className="w-full bg-[#2d2d2d] text-white text-[10px] border border-[#3a3a3a] px-1 py-0.5 rounded"/>
                                    </FieldRow>
                                )}
                                <FieldRow label="Shadows">
                                    <input type="checkbox" checked={light.castShadow}
                                        onChange={e=>setLights(p=>p.map(l=>l.id===selectedLightId?{...l,castShadow:e.target.checked}:l))}
                                        className="accent-yellow-400"/>
                                </FieldRow>
                            </div>
                        )}
                        {/* Add light buttons */}
                        <div className="border-t border-[#333] p-2 shrink-0">
                            <div className="text-[9px] text-gray-500 mb-1.5 uppercase tracking-wide">Add Light</div>
                            <div className="grid grid-cols-2 gap-1">
                                {(['ambient','directional','point','spot','hemisphere'] as const).map(t => (
                                    <button key={t} onClick={()=>addLight(t)}
                                        className="py-1 px-2 text-[9px] bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 rounded capitalize border border-[#3a3a3a] flex items-center gap-1 justify-center transition-colors"
                                    ><Sun size={9}/>{t}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Cameras Panel */}
                {activeRightPanel==='cameras' && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <PanelHeader title="Cameras" icon={<Camera size={10}/>} count={cameras.length}/>
                        <div className="flex-1 overflow-y-auto p-1">
                            {cameras.map(c => (
                                <div key={c.id}
                                    onClick={()=>setSelectedCameraId(c.id)}
                                    className={`px-2 py-1.5 rounded mb-0.5 cursor-pointer group flex items-center gap-2 text-[11px] transition-colors ${selectedCameraId===c.id?'bg-[#1a3050] border border-[#2a5080]':'hover:bg-[#2d2d2d]'}`}
                                >
                                    <Camera size={11} className="text-blue-400 shrink-0"/>
                                    <span className="flex-1 truncate text-gray-300">{c.name}</span>
                                    {c.isActive && <span className="text-[8px] bg-green-800 text-green-300 px-1 rounded">ACTIVE</span>}
                                    {!c.isActive && (
                                        <button onClick={e=>{e.stopPropagation();activateCamera(c.id);}}
                                            className="opacity-0 group-hover:opacity-100 text-[8px] bg-blue-800 text-blue-300 px-1 rounded">Set</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Camera props */}
                        {cam && (
                            <div className="border-t border-[#333] p-2 shrink-0 max-h-64 overflow-y-auto">
                                <div className="text-[9px] text-gray-400 mb-2 font-bold uppercase">{cam.name}</div>
                                <Vec3Row label="Position" value={cam.position}
                                    onChange={v=>setCameras(p=>p.map(c=>c.id===selectedCameraId?{...c,position:v}:c))} step={10}/>
                                <Vec3Row label="Target" value={cam.target}
                                    onChange={v=>setCameras(p=>p.map(c=>c.id===selectedCameraId?{...c,target:v}:c))} step={10}/>
                                {cam.type==='perspective' && (
                                    <FieldRow label="FOV">
                                        <input type="range" min="20" max="120" value={cam.fov||60}
                                            onChange={e=>setCameras(p=>p.map(c=>c.id===selectedCameraId?{...c,fov:parseInt(e.target.value)}:c))}
                                            className="w-full accent-blue-400"/>
                                    </FieldRow>
                                )}
                                <FieldRow label="Near/Far">
                                    <div className="flex gap-1">
                                        <input type="number" value={cam.near} step="0.1"
                                            onChange={e=>setCameras(p=>p.map(c=>c.id===selectedCameraId?{...c,near:parseFloat(e.target.value)}:c))}
                                            className="w-full bg-[#2d2d2d] text-white text-[10px] border border-[#3a3a3a] px-1 py-0.5 rounded"/>
                                        <input type="number" value={cam.far} step="100"
                                            onChange={e=>setCameras(p=>p.map(c=>c.id===selectedCameraId?{...c,far:parseFloat(e.target.value)}:c))}
                                            className="w-full bg-[#2d2d2d] text-white text-[10px] border border-[#3a3a3a] px-1 py-0.5 rounded"/>
                                    </div>
                                </FieldRow>
                                <FieldRow label="Active">
                                    <button onClick={()=>activateCamera(cam.id)}
                                        className={`px-2 py-0.5 text-[9px] rounded border ${cam.isActive?'bg-green-800 border-green-600 text-green-300':'bg-[#2d2d2d] border-[#3a3a3a] text-gray-300 hover:bg-[#3d3d3d]'}`}
                                    >{cam.isActive?'✓ Active':'Activate'}</button>
                                </FieldRow>
                            </div>
                        )}
                        <div className="border-t border-[#333] p-2 shrink-0">
                            <button onClick={addCamera}
                                className="w-full py-1.5 text-[10px] bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 rounded border border-[#3a3a3a] flex items-center justify-center gap-2 transition-colors"
                            ><Plus size={11}/> Add Camera</button>
                        </div>
                    </div>
                )}

                {/* World Panel */}
                {activeRightPanel==='world' && (
                    <div className="flex-1 overflow-y-auto p-2">
                        <PanelHeader title="World Settings" icon={<Globe size={10}/>}/>
                        <div className="mt-2 space-y-3">
                            {/* Sky */}
                            <div className="bg-[#252525] rounded p-2">
                                <div className="text-[9px] text-gray-500 mb-2 uppercase font-bold">Sky & Atmosphere</div>
                                <FieldRow label="Sky Color">
                                    <input type="color" value={world.skyColor}
                                        onChange={e=>setWorld(w=>({...w,skyColor:e.target.value}))}
                                        className="w-full h-6 rounded border border-[#3a3a3a] cursor-pointer bg-transparent"/>
                                </FieldRow>
                            </div>
                            {/* Fog */}
                            <div className="bg-[#252525] rounded p-2">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[9px] text-gray-500 uppercase font-bold">Fog</div>
                                    <input type="checkbox" checked={world.fogEnabled}
                                        onChange={e=>setWorld(w=>({...w,fogEnabled:e.target.checked}))}
                                        className="accent-blue-400"/>
                                </div>
                                {world.fogEnabled && <>
                                    <FieldRow label="Color">
                                        <input type="color" value={world.fogColor}
                                            onChange={e=>setWorld(w=>({...w,fogColor:e.target.value}))}
                                            className="w-full h-6 rounded border border-[#3a3a3a] cursor-pointer bg-transparent"/>
                                    </FieldRow>
                                    <FieldRow label="Near">
                                        <input type="range" min="10" max="500" value={world.fogNear}
                                            onChange={e=>setWorld(w=>({...w,fogNear:parseInt(e.target.value)}))}
                                            className="w-full accent-blue-400"/>
                                    </FieldRow>
                                    <FieldRow label="Far">
                                        <input type="range" min="200" max="5000" value={world.fogFar}
                                            onChange={e=>setWorld(w=>({...w,fogFar:parseInt(e.target.value)}))}
                                            className="w-full accent-blue-400"/>
                                    </FieldRow>
                                </>}
                            </div>
                            {/* Rendering */}
                            <div className="bg-[#252525] rounded p-2">
                                <div className="text-[9px] text-gray-500 mb-2 uppercase font-bold">Rendering</div>
                                <FieldRow label="Shadows">
                                    <input type="checkbox" checked={world.shadowsEnabled}
                                        onChange={e=>setWorld(w=>({...w,shadowsEnabled:e.target.checked}))}
                                        className="accent-orange-400"/>
                                </FieldRow>
                                <FieldRow label="Pixel Size">
                                    <input type="range" min="1" max="8" step="1" value={world.pixelSize}
                                        onChange={e=>{
                                            const s = parseInt(e.target.value);
                                            setWorld(w=>({...w,pixelSize:s}));
                                            if (rendererRef.current) rendererRef.current.setPixelRatio(Math.max(0.5, window.devicePixelRatio/s));
                                        }}
                                        className="w-full accent-purple-400"/>
                                </FieldRow>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Panel */}
                {activeRightPanel==='details' && (
                    <div className="flex-1 overflow-y-auto">
                        <PanelHeader title="Object Details" icon={<Info size={10}/>}/>
                        {selectedObject ? (
                            <div className="p-2 space-y-3 text-[11px]">
                                <div>
                                    <div className="text-white font-bold text-xs truncate">{selectedObject.userData.objName||'Object'}</div>
                                    <div className="text-gray-500 text-[9px] font-mono truncate">{selectedObject.uuid}</div>
                                </div>
                                {/* Transform */}
                                <div className="bg-[#252525] rounded p-2">
                                    <div className="text-[9px] text-gray-500 mb-2 uppercase font-bold flex items-center gap-1"><Move size={9}/> Transform</div>
                                    <Vec3Row label="Location" value={[selectedObject.position.x, selectedObject.position.y, selectedObject.position.z] as [number,number,number]}
                                        onChange={v=>{ selectedObject.position.set(...v); setSceneObjects(p=>[...p]); }} step={1}/>
                                    <Vec3Row label="Rotation" value={[(selectedObject.rotation.x*180/Math.PI), (selectedObject.rotation.y*180/Math.PI), (selectedObject.rotation.z*180/Math.PI)] as [number,number,number]}
                                        onChange={v=>{ selectedObject.rotation.set(v[0]*Math.PI/180, v[1]*Math.PI/180, v[2]*Math.PI/180); setSceneObjects(p=>[...p]); }} step={1}/>
                                    <Vec3Row label="Scale" value={[selectedObject.scale.x, selectedObject.scale.y, selectedObject.scale.z] as [number,number,number]}
                                        onChange={v=>{ selectedObject.scale.set(...v); setSceneObjects(p=>[...p]); }} step={0.1}/>
                                </div>
                                {/* Rendering */}
                                <div className="bg-[#252525] rounded p-2">
                                    <div className="text-[9px] text-gray-500 mb-2 uppercase font-bold flex items-center gap-1"><Eye size={9}/> Rendering</div>
                                    <FieldRow label="Visible">
                                        <input type="checkbox" checked={selectedObject.visible}
                                            onChange={e=>{selectedObject.visible=e.target.checked; setSceneObjects(p=>[...p]);}}
                                            className="accent-blue-400"/>
                                    </FieldRow>
                                    <FieldRow label="Cast Shadow">
                                        <input type="checkbox" checked={selectedObject.castShadow}
                                            onChange={e=>{selectedObject.castShadow=e.target.checked; setSceneObjects(p=>[...p]);}}
                                            className="accent-orange-400"/>
                                    </FieldRow>
                                    <FieldRow label="Recv Shadow">
                                        <input type="checkbox" checked={selectedObject.receiveShadow}
                                            onChange={e=>{selectedObject.receiveShadow=e.target.checked; setSceneObjects(p=>[...p]);}}
                                            className="accent-orange-400"/>
                                    </FieldRow>
                                </div>
                                {/* Actions */}
                                <div className="flex gap-1">
                                    <button onClick={focusSelected}
                                        className="flex-1 py-1.5 text-[9px] bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 rounded border border-[#3a3a3a] flex items-center justify-center gap-1 transition-colors"
                                    ><Target size={10}/> Focus</button>
                                    <button onClick={duplicateSelected}
                                        className="flex-1 py-1.5 text-[9px] bg-[#2d2d2d] hover:bg-[#3d3d3d] text-yellow-300 rounded border border-[#3a3a3a] flex items-center justify-center gap-1 transition-colors"
                                    ><Copy size={10}/> Dupe</button>
                                    <button onClick={deleteSelected}
                                        className="flex-1 py-1.5 text-[9px] bg-[#3d1a1a] hover:bg-[#5d2a2a] text-red-400 rounded border border-[#5a2a2a] flex items-center justify-center gap-1 transition-colors"
                                    ><Trash2 size={10}/> Del</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2 py-12">
                                <Info size={28} className="opacity-20"/>
                                <div className="italic text-center text-[10px]">Select an object<br/>to view details</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Assets Panel — 3D Models Library */}
                {activeRightPanel==='assets' && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <PanelHeader title="3D Assets" icon={<Package size={10}/>} count={model3DAssets.length}/>
                        <div className="flex-1 overflow-y-auto p-1">
                            {model3DAssets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-600 gap-2">
                                    <Package size={28} className="opacity-20"/>
                                    <span className="text-[10px] italic text-center">No 3D assets yet.<br/>Import from Resources menu.</span>
                                </div>
                            ) : (
                                model3DAssets.map(asset => (
                                    <div key={asset.id}
                                        className="px-2 py-1.5 rounded mb-0.5 cursor-pointer hover:bg-[#2d2d2d] group flex flex-col gap-0.5 border border-transparent hover:border-[#3a3a3a] transition-colors"
                                        draggable
                                        onDragEnd={async () => {
                                            // Drop into scene: load the model and add it
                                            const scene = sceneRef.current;
                                            if (!scene) return;
                                            try {
                                                const { ModelLoader } = await import('../utils/modelLoader');
                                                const result = await ModelLoader.loadFromUrl(asset.src, asset.format);
                                                ModelLoader.normalize(result.scene, 32);
                                                result.scene.name = 'dynamic_obj';
                                                result.scene.traverse((c: any) => {
                                                    if (c.isMesh) { c.name = 'dynamic_obj'; c.castShadow = true; c.receiveShadow = true; }
                                                });
                                                result.scene.userData = { objName: asset.name, isImported: true, assetId: asset.id };
                                                scene.add(result.scene);
                                                setSceneObjects(prev => [...prev, result.scene]);
                                                setSelectedObject(result.scene);
                                                transformControlRef.current?.attach(result.scene);
                                                setImportStatus(`✅ Added: ${asset.name}`);
                                                setTimeout(() => setImportStatus(''), 2000);
                                            } catch(e: any) {
                                                setImportStatus(`❌ ${e.message}`);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Package size={10} className="text-blue-400 shrink-0"/>
                                            <span className="flex-1 text-[10px] text-gray-300 truncate">{asset.name}</span>
                                            <span className="text-[8px] px-1 bg-blue-900/40 text-blue-300 rounded uppercase">{asset.format}</span>
                                        </div>
                                        <div className="flex gap-2 pl-4 text-[9px] text-gray-500">
                                            {asset.polyCount !== undefined && <span>{asset.polyCount.toLocaleString()}▲</span>}
                                            {asset.animationNames?.length ? <span className="text-purple-400">{asset.animationNames.length} anim</span> : null}
                                        </div>
                                        {/* Quick-add button */}
                                        <button
                                            onClick={async () => {
                                                const scene = sceneRef.current; if (!scene) return;
                                                try {
                                                    const { ModelLoader } = await import('../utils/modelLoader');
                                                    const result = await ModelLoader.loadFromUrl(asset.src, asset.format);
                                                    ModelLoader.normalize(result.scene, 32);
                                                    result.scene.name = 'dynamic_obj';
                                                    result.scene.traverse((c: any) => {
                                                        if (c.isMesh) { c.name='dynamic_obj'; c.castShadow=true; c.receiveShadow=true; }
                                                    });
                                                    result.scene.userData = { objName: asset.name, isImported: true, assetId: asset.id };
                                                    scene.add(result.scene);
                                                    setSceneObjects(prev => [...prev, result.scene]);
                                                    setSelectedObject(result.scene);
                                                    transformControlRef.current?.attach(result.scene);
                                                    setImportStatus(`✅ Added: ${asset.name}`);
                                                    setTimeout(() => setImportStatus(''), 2000);
                                                } catch(e: any) { setImportStatus(`❌ ${e.message}`); }
                                            }}
                                            className="mt-1 w-full py-0.5 text-[9px] bg-[#1a2840] hover:bg-[#2a3850] text-blue-300 rounded border border-[#2a4060] flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        ><Plus size={9}/> Add to Scene</button>
                                    </div>
                                ))
                            )}
                        </div>
                        {/* Import button */}
                        <div className="border-t border-[#333] p-2 shrink-0">
                            <button
                                onClick={() => model3dInputRef.current?.click()}
                                className="w-full py-1.5 text-[10px] bg-blue-800 hover:bg-blue-700 text-white rounded border border-blue-700 flex items-center justify-center gap-1.5 transition-colors font-bold"
                            ><Upload size={11}/> Import 3D Model</button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    /* ─── JSX ────────────────────────────────────────────────────────────── */
    return (
        <div className="w-full h-full flex flex-col relative bg-[#0a0a0a] font-sans overflow-hidden">
            {/* ── Top Toolbar ── */}
            <div className={`ui-overlay flex items-center gap-1 px-2 py-1 bg-[#141414] border-b border-[#333] shrink-0 overflow-x-auto ${hideTopToolbar ? 'hidden' : ''}`}>
                {/* Transform */}
                <div className="flex bg-[#1e1e1e] border border-[#333] rounded overflow-hidden shrink-0">
                    {(['translate','rotate','scale'] as const).map(mode => (
                        <button key={mode}
                            className={`px-2 py-1 text-[10px] font-bold border-r border-[#333] flex items-center gap-1 last:border-r-0 ${transformMode===mode?'bg-win-blue text-white':'text-gray-400 hover:text-white hover:bg-[#2d2d2d]'}`}
                            onClick={()=>setTransformMode(mode)} title={`${mode} (${mode==='translate'?'W':mode==='rotate'?'E':'R'})`}
                        >
                            {mode==='translate'?<Waypoints size={11}/>:mode==='rotate'?<RotateCw size={11}/>:<Maximize2 size={11}/>}
                            {mode.charAt(0).toUpperCase()+mode.slice(1)}
                        </button>
                    ))}
                </div>

                {/* View */}
                <div className="flex bg-[#1e1e1e] border border-[#333] rounded overflow-hidden shrink-0">
                    <select value={viewType} onChange={e=>setViewType(e.target.value as any)}
                        className="bg-transparent text-white text-[10px] font-bold px-2 py-1 outline-none cursor-pointer hover:bg-[#2d2d2d]">
                        {['perspective','top','bottom','left','side','front','back','isometric'].map(v=>(
                            <option key={v} value={v} className="bg-[#1e1e1e] capitalize">{v.charAt(0).toUpperCase()+v.slice(1)}</option>
                        ))}
                    </select>
                    <div className="w-px bg-[#333]"/>
                    <button onClick={()=>setShowGrid(v=>!v)}
                        className={`px-2 py-1 text-[10px] font-bold flex items-center gap-1 ${showGrid?'text-win-blue':'text-gray-400 hover:text-white'}`}
                    ><Grid size={11}/> Grid</button>
                </div>

                {/* Import 3D */}
                <div className="flex bg-[#1e1e1e] border border-[#333] rounded overflow-hidden shrink-0">
                    <button onClick={()=>model3dInputRef.current?.click()}
                        className="px-2 py-1 text-[10px] font-bold text-[#60a5fa] hover:text-white hover:bg-[#2d2d2d] flex items-center gap-1"
                    ><Upload size={11}/> Import 3D</button>
                    <div className="w-px bg-[#333]"/>
                    {(['glb','gltf','obj'] as const).map(fmt => (
                        <button key={fmt} onClick={()=>handleExport(fmt)}
                            className="px-2 py-1 text-[10px] font-bold text-[#34d399] hover:text-white hover:bg-[#2d2d2d] flex items-center gap-0.5 border-r border-[#333] last:border-r-0"
                        ><Download size={10}/> {fmt.toUpperCase()}</button>
                    ))}
                    <div className="w-px bg-[#333]"/>
                    <button onClick={()=>handleExport('screenshot')}
                        className="px-2 py-1 text-[10px] font-bold text-[#f472b6] hover:text-white hover:bg-[#2d2d2d] flex items-center gap-1"
                    ><ImageIcon size={11}/> PNG</button>
                </div>

                {/* Object ops */}
                <div className="flex bg-[#1e1e1e] border border-[#333] rounded overflow-hidden shrink-0">
                    <button onClick={focusSelected} disabled={!selectedObject}
                        className="px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-[#2d2d2d] flex items-center gap-1 disabled:opacity-30"
                    ><Target size={11}/> Focus</button>
                    <div className="w-px bg-[#333]"/>
                    <button onClick={duplicateSelected} disabled={!selectedObject}
                        className="px-2 py-1 text-[10px] font-bold text-[#fbbf24] hover:text-white hover:bg-[#2d2d2d] flex items-center gap-1 disabled:opacity-30"
                    ><Copy size={11}/> Dupe</button>
                    <div className="w-px bg-[#333]"/>
                    <button onClick={deleteSelected} disabled={!selectedObject}
                        className="px-2 py-1 text-[10px] font-bold text-[#f87171] hover:text-white hover:bg-[#2d2d2d] flex items-center gap-1 disabled:opacity-30"
                    ><Trash2 size={11}/> Del</button>
                </div>

                {/* Fly speed */}
                <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 shrink-0">
                    <Rocket size={11} className="text-gray-400"/>
                    <input type="range" min="0.5" max="20" step="0.5" defaultValue="2.5"
                        onChange={e=>{ flySpeed.current = parseFloat(e.target.value); }}
                        className="w-16 accent-blue-400" title="Fly Speed"/>
                </div>

                {/* Status */}
                {importStatus && (
                    <div className="ml-auto text-[10px] text-gray-400 font-mono truncate max-w-[200px] shrink-0">{importStatus}</div>
                )}
                {isFlyMode && (
                    <div className="ml-auto flex items-center gap-1 bg-win-blue text-white text-[10px] px-2 py-0.5 rounded font-bold animate-pulse shrink-0">
                        <Rocket size={11}/> FLY (WASD+QE) | RMB to exit
                    </div>
                )}
            </div>

            {/* ── Main area ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* ── Viewport ── */}
                <div ref={containerRef} className="flex-1 relative overflow-hidden"
                    onDragOver={e=>e.preventDefault()}
                    onDrop={e=>{
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                            const fake = { target: { files: e.dataTransfer.files, value:'' } } as any;
                            handle3DModelImport(fake);
                        }
                    }}
                >
                    {/* Viewport label */}
                    <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/20 pointer-events-none z-10">
                        NOR MAKER · {viewType.toUpperCase()} · {isFlyMode?'FLY MODE':'EDIT MODE'}
                    </div>
                    {/* Coord display */}
                    {selectedObject && (
                        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-white/30 pointer-events-none z-10 text-right">
                            X:{selectedObject.position.x.toFixed(1)} Y:{selectedObject.position.y.toFixed(1)} Z:{selectedObject.position.z.toFixed(1)}
                        </div>
                    )}
                    {/* Drop hint overlay */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] text-white/20 pointer-events-none z-10 font-mono">
                        Drop GLB/GLTF/OBJ/FBX here
                    </div>
                </div>

                {/* ── Right Panel ── */}
                {renderRightPanel()}
            </div>

            {/* Hidden inputs */}
            <input ref={model3dInputRef} type="file" accept=".glb,.gltf,.obj,.fbx" className="hidden" onChange={handle3DModelImport}/>
            <input ref={texInputRef} type="file" accept="image/*" className="hidden"/>
            <input ref={skyboxInputRef} type="file" accept="image/*,.hdr,.exr" className="hidden"/>
        </div>
    );
};
