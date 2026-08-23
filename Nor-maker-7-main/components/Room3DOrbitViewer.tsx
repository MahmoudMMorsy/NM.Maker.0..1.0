import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { X, RotateCcw, Grid, Layers } from 'lucide-react';

interface Room3DOrbitViewerProps {
    open: boolean;
    onClose: () => void;
    levelData: number[];
    width: number;
    height: number;
    snapX: number;
    snapY: number;
    roomSettings: any;
    sprites: any[];
    gameObjects: any[];
}

type VPId = 'persp' | 'top' | 'front' | 'side';

const VP_DEFS: { id: VPId; label: string; labelColor: string }[] = [
    { id: 'persp', label: 'Perspective', labelColor: '#60a5fa' },
    { id: 'top',   label: 'Top',         labelColor: '#86efac' },
    { id: 'front', label: 'Front',       labelColor: '#fca5a5' },
    { id: 'side',  label: 'Side (Right)', labelColor: '#c4b5fd' },
];

export const Room3DOrbitViewer: React.FC<Room3DOrbitViewerProps> = ({
    open, onClose, levelData, width, height, snapX, snapY, roomSettings, sprites, gameObjects,
}) => {
    const canvasRef    = useRef<HTMLCanvasElement>(null);
    const wrapRef      = useRef<HTMLDivElement>(null);
    const hitPersp     = useRef<HTMLDivElement>(null);
    const hitTop       = useRef<HTMLDivElement>(null);
    const hitFront     = useRef<HTMLDivElement>(null);
    const hitSide      = useRef<HTMLDivElement>(null);

    const rendererRef  = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef     = useRef<THREE.Scene | null>(null);
    const camsRef      = useRef<Record<VPId, THREE.Camera | null>>({ persp: null, top: null, front: null, side: null });
    const ctrlsRef     = useRef<Record<VPId, OrbitControls | null>>({ persp: null, top: null, front: null, side: null });
    const gridRef      = useRef<THREE.Group | null>(null);
    const animRef      = useRef<number>(0);
    const sizeRef      = useRef({ w: 0, h: 0 });

    const [activeVP,  setActiveVP]  = useState<VPId>('persp');
    const [showGrid,  setShowGrid]  = useState(true);
    const [showGrid3, _setShowGrid3] = useState(true);

    const toggleGrid = useCallback(() => {
        setShowGrid(v => {
            const next = !v;
            if (gridRef.current) gridRef.current.visible = next;
            return next;
        });
    }, []);

    const resetAll = useCallback(() => {
        const ctrl = ctrlsRef.current;
        Object.values(ctrl).forEach(c => { if (c) c.reset(); });
    }, []);

    useEffect(() => {
        if (!open || !canvasRef.current || !wrapRef.current) return;
        const canvas    = canvasRef.current;
        const wrap      = wrapRef.current;

        const roomW   = width  * snapX;
        const roomH   = height * snapY;
        const cx      = roomW / 2;
        const cz      = roomH / 2;
        const maxDim  = Math.max(roomW, roomH);
        const TILE_H  = Math.min(snapX, snapY) * 1.5;

        /* ── Renderer ── */
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
        renderer.autoClear         = false;
        rendererRef.current        = renderer;

        /* ── Scene ── */
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        /* ── Sky (gradient via hemisphere) ── */
        scene.background = new THREE.Color(0x6fa8dc);
        const hemi = new THREE.HemisphereLight(0xb0d4f1, 0x8d9980, 0.9);
        scene.add(hemi);

        /* ── Sun ── */
        const sun = new THREE.DirectionalLight(0xfff5cc, 2.2);
        sun.position.set(maxDim * 0.7, maxDim * 1.5, maxDim * 0.3);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.near   = 1;
        sun.shadow.camera.far    = maxDim * 10;
        sun.shadow.camera.left   = -maxDim * 2;
        sun.shadow.camera.right  =  maxDim * 2;
        sun.shadow.camera.top    =  maxDim * 2;
        sun.shadow.camera.bottom = -maxDim * 2;
        scene.add(sun);
        scene.add(new THREE.AmbientLight(0xffffff, 0.25));

        /* ── Ground ── */
        const groundMat  = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.9, metalness: 0 });
        const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), groundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.set(cx, 0, cz);
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        /* ── Grid ── */
        const gridGroup = new THREE.Group();
        const gridHelper = new THREE.GridHelper(maxDim * 1.5, Math.max(width, height) * 2, 0xbbbbbb, 0xcccccc);
        gridHelper.position.set(cx, 0.02, cz);
        gridGroup.add(gridHelper);
        scene.add(gridGroup);
        gridGroup.visible = true;
        gridRef.current   = gridGroup;

        /* ── Room border ── */
        const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(roomW, 1, roomH));
        const border    = new THREE.LineSegments(borderGeo, new THREE.LineBasicMaterial({ color: 0x4488ff }));
        border.position.set(cx, 0.5, cz);
        scene.add(border);

        /* ── Tiles ── */
        const palette = [0x5b9bd5, 0x70ad47, 0xff0000, 0xffc000, 0x4472c4, 0xed7d31, 0xa9d18e, 0x9dc3e6];
        const texLoader = new THREE.TextureLoader();
        const texCache  = new Map<string, THREE.Texture>();

        // Pre-build O(1) Map index for sprite lookups to avoid O(N * S) linear array scanning over level tiles
        const spriteMap = new Map<string, any>(sprites.map(s => [s.id, s]));

        levelData.forEach((tileId, idx) => {
            if (tileId === 0) return;
            const col = idx % width;
            const row = Math.floor(idx / width);
            const x   = col * snapX + snapX / 2;
            const z   = row * snapY + snapY / 2;

            if (tileId === 1) {
                /* Wall / solid block — UE-style grey cube */
                const faceColor  = 0xa0a0a0;
                const topColor   = 0xc0c0c0;
                const mats = [
                    new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ color: topColor,  roughness: 0.7 }),
                    new THREE.MeshStandardMaterial({ color: 0x787878,  roughness: 0.95 }),
                    new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.8 }),
                ];
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(snapX * 0.98, TILE_H, snapY * 0.98), mats);
                mesh.position.set(x, TILE_H / 2, z);
                mesh.castShadow    = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                return;
            }

            /* Game object — 2D sprite billboard */
            const objIdx = tileId - 2;
            const obj    = gameObjects[objIdx];
            // Fast O(1) lookup using spriteMap index instead of linear find
            const spr    = obj ? spriteMap.get(obj.spriteId) : null;

            if (spr?.src) {
                if (!texCache.has(spr.id)) {
                    const tex = texLoader.load(spr.src);
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter;
                    texCache.set(spr.id, tex);
                }
                const tex         = texCache.get(spr.id)!;
                const sprMat      = new THREE.SpriteMaterial({ map: tex, transparent: true });
                const spriteMesh  = new THREE.Sprite(sprMat);
                spriteMesh.position.set(x, TILE_H * 0.75, z);
                spriteMesh.scale.set(snapX * 0.9, snapY * 0.9, 1);
                scene.add(spriteMesh);
            } else {
                /* Colored placeholder box */
                const color = palette[objIdx % palette.length];
                const mesh  = new THREE.Mesh(
                    new THREE.BoxGeometry(snapX * 0.8, TILE_H * 0.8, snapY * 0.8),
                    new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
                );
                mesh.position.set(x, TILE_H * 0.4, z);
                mesh.castShadow = true;
                scene.add(mesh);
            }
        });

        /* ── Cameras ── */
        const orthoSize = maxDim * 0.65;

        /* Perspective */
        const perspCam = new THREE.PerspectiveCamera(60, 1, 0.1, 100000);
        perspCam.position.set(cx + maxDim * 0.7, maxDim * 0.9, cz + maxDim);
        perspCam.lookAt(cx, 0, cz);

        /* Top (looking down -Y) */
        const topCam = new THREE.OrthographicCamera(-orthoSize, orthoSize, orthoSize, -orthoSize, 0.1, 100000);
        topCam.position.set(cx, maxDim * 3, cz);
        topCam.lookAt(cx, 0, cz);
        topCam.up.set(0, 0, -1);

        /* Front (looking along +Z) */
        const frontCam = new THREE.OrthographicCamera(-orthoSize, orthoSize, orthoSize, -orthoSize, 0.1, 100000);
        frontCam.position.set(cx, maxDim * 0.5, cz - maxDim * 3);
        frontCam.lookAt(cx, maxDim * 0.5, cz);

        /* Side Right (looking along -X) */
        const sideCam = new THREE.OrthographicCamera(-orthoSize, orthoSize, orthoSize, -orthoSize, 0.1, 100000);
        sideCam.position.set(cx + maxDim * 3, maxDim * 0.5, cz);
        sideCam.lookAt(cx, maxDim * 0.5, cz);

        camsRef.current = { persp: perspCam, top: topCam, front: frontCam, side: sideCam };

        /* ── OrbitControls for each viewport via hit divs ── */
        const hitDivs: Record<VPId, HTMLDivElement | null> = {
            persp: hitPersp.current,
            top:   hitTop.current,
            front: hitFront.current,
            side:  hitSide.current,
        };

        const camList: [VPId, THREE.Camera][] = [
            ['persp', perspCam], ['top', topCam], ['front', frontCam], ['side', sideCam],
        ];

        camList.forEach(([vid, cam]) => {
            const el = hitDivs[vid];
            if (!el) return;
            const ctrl = new OrbitControls(cam, el);
            ctrl.target.set(cx, maxDim * 0.2, cz);
            ctrl.enableDamping   = true;
            ctrl.dampingFactor   = 0.07;
            ctrl.screenSpacePanning = true;
            if (vid !== 'persp') {
                ctrl.mouseButtons = {
                    LEFT:   THREE.MOUSE.PAN,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT:  THREE.MOUSE.ROTATE,
                };
            }
            ctrl.update();
            ctrlsRef.current[vid] = ctrl;
        });

        /* ── Resize ── */
        const onResize = () => {
            if (!wrap) return;
            const W = wrap.clientWidth;
            const H = wrap.clientHeight;
            sizeRef.current = { w: W, h: H };
            renderer.setSize(W, H);
            const hw = W / 2, hh = H / 2;
            perspCam.aspect = hw / hh;
            perspCam.updateProjectionMatrix();
            const ratio = hw / hh;
            [topCam, frontCam, sideCam].forEach(c => {
                const oc = c as THREE.OrthographicCamera;
                oc.left   = -orthoSize * ratio;
                oc.right  =  orthoSize * ratio;
                oc.updateProjectionMatrix();
            });
        };
        onResize();
        const ro = new ResizeObserver(onResize);
        ro.observe(wrap);

        /* ── Render loop ── */
        const vpDefs: { id: VPId; getRect: () => [number, number, number, number] }[] = [
            { id: 'persp', getRect: () => { const { w, h } = sizeRef.current; return [0,       h / 2, w / 2, h / 2]; } },
            { id: 'top',   getRect: () => { const { w, h } = sizeRef.current; return [w / 2,   h / 2, w / 2, h / 2]; } },
            { id: 'front', getRect: () => { const { w, h } = sizeRef.current; return [0,       0,     w / 2, h / 2]; } },
            { id: 'side',  getRect: () => { const { w, h } = sizeRef.current; return [w / 2,   0,     w / 2, h / 2]; } },
        ];

        const animate = () => {
            animRef.current = requestAnimationFrame(animate);
            renderer.clear();
            const { h } = sizeRef.current;
            vpDefs.forEach(({ id, getRect }) => {
                const ctrl = ctrlsRef.current[id];
                if (ctrl) ctrl.update();
                const cam  = camsRef.current[id];
                if (!cam) return;
                const [rx, ry, rw, rh] = getRect();
                /* WebGL Y is from bottom */
                renderer.setViewport(rx, h - ry - rh, rw, rh);
                renderer.setScissor (rx, h - ry - rh, rw, rh);
                renderer.setScissorTest(true);
                renderer.render(scene, cam);
            });
        };
        animate();

        return () => {
            cancelAnimationFrame(animRef.current);
            ro.disconnect();
            Object.values(ctrlsRef.current).forEach(c => c?.dispose());
            ctrlsRef.current = { persp: null, top: null, front: null, side: null };
            renderer.dispose();
            rendererRef.current = null;
        };
    }, [open, levelData, width, height, snapX, snapY]);

    if (!open) return null;

    /* ── Layout: 2×2 grid overlay on a shared <canvas> ── */
    return (
        <div
            className="absolute inset-0 z-40 flex flex-col bg-[#1a1a1a]"
            style={{ direction: 'ltr' }}
        >
            {/* Top bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border-b border-[#333] text-white text-[11px] shrink-0 select-none">
                <Layers size={13} className="text-blue-400 shrink-0" />
                <span className="font-bold text-blue-300">3D Viewport</span>
                <span className="text-gray-500 text-[10px] ml-1">— Maya / 3DS Max style · بيانات الروم 2D لا تتغير</span>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 ml-2 border-l border-gray-700 pl-2">
                    <span className="px-1 py-0.5 bg-gray-700 rounded text-[9px]">LMB</span> Rotate
                    <span className="px-1 py-0.5 bg-gray-700 rounded text-[9px] ml-1">MMB</span> Pan
                    <span className="px-1 py-0.5 bg-gray-700 rounded text-[9px] ml-1">Scroll</span> Zoom
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <button onClick={toggleGrid} title="Toggle Grid"
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${showGrid ? 'bg-blue-700 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <Grid size={11} /> Grid
                    </button>
                    <button onClick={resetAll} title="Reset All Cameras"
                        className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-[10px]">
                        <RotateCcw size={11} /> Reset
                    </button>
                    <button onClick={onClose}
                        className="flex items-center gap-1 px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-[10px]">
                        <X size={11} /> إغلاق
                    </button>
                </div>
            </div>

            {/* Viewport area */}
            <div ref={wrapRef} className="flex-1 relative overflow-hidden">
                {/* Shared WebGL canvas */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ pointerEvents: 'none', display: 'block' }}
                />

                {/* ── 4 hit areas (pointer events only) — 2×2 grid ── */}
                {/* Top-left: Perspective */}
                <div
                    ref={hitPersp}
                    onPointerEnter={() => setActiveVP('persp')}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{ top: 0, left: 0, width: '50%', height: '50%' }}
                >
                    <VPLabel label="Perspective" color="#60a5fa" active={activeVP === 'persp'} />
                </div>

                {/* Top-right: Top */}
                <div
                    ref={hitTop}
                    onPointerEnter={() => setActiveVP('top')}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{ top: 0, left: '50%', width: '50%', height: '50%' }}
                >
                    <VPLabel label="Top" color="#86efac" active={activeVP === 'top'} />
                </div>

                {/* Bottom-left: Front */}
                <div
                    ref={hitFront}
                    onPointerEnter={() => setActiveVP('front')}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{ top: '50%', left: 0, width: '50%', height: '50%' }}
                >
                    <VPLabel label="Front" color="#fca5a5" active={activeVP === 'front'} />
                </div>

                {/* Bottom-right: Side */}
                <div
                    ref={hitSide}
                    onPointerEnter={() => setActiveVP('side')}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{ top: '50%', left: '50%', width: '50%', height: '50%' }}
                >
                    <VPLabel label="Side (Right)" color="#c4b5fd" active={activeVP === 'side'} />
                </div>

                {/* Cross dividers */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    {/* Vertical line */}
                    <div className="absolute top-0 bottom-0 bg-[#333]" style={{ left: 'calc(50% - 1px)', width: 2 }} />
                    {/* Horizontal line */}
                    <div className="absolute left-0 right-0 bg-[#333]" style={{ top: 'calc(50% - 1px)', height: 2 }} />
                    {/* Center dot */}
                    <div className="absolute bg-[#555] rounded-full"
                        style={{ left: 'calc(50% - 4px)', top: 'calc(50% - 4px)', width: 8, height: 8 }} />
                </div>
            </div>

            {/* Status bar */}
            <div className="px-3 py-1 bg-[#111] border-t border-[#333] text-[10px] text-gray-500 flex items-center gap-4 shrink-0 select-none">
                <span className="text-gray-300">{roomSettings?.name || 'Room'}</span>
                <span>{width}×{height} tiles · {width * snapX}×{height * snapY} px</span>
                <span>Objects: {levelData.filter(t => t !== 0).length} / {levelData.length}</span>
                <span className="ml-auto text-blue-500">Three.js WebGL · 4-Viewport · 2D data preserved</span>
            </div>
        </div>
    );
};

/* ── Viewport label overlay ── */
const VPLabel: React.FC<{ label: string; color: string; active: boolean }> = ({ label, color, active }) => (
    <>
        {/* Subtle active border */}
        {active && (
            <div className="absolute inset-0 pointer-events-none" style={{
                border: `2px solid ${color}`,
                boxSizing: 'border-box',
                zIndex: 5,
            }} />
        )}
        {/* Label */}
        <div className="absolute top-2 left-3 text-[10px] font-bold select-none pointer-events-none"
            style={{ color, zIndex: 6, textShadow: '0 0 6px rgba(0,0,0,0.9)' }}>
            {label}
        </div>
    </>
);

export default Room3DOrbitViewer;
