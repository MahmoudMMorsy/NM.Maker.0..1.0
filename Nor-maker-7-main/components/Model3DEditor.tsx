/**
 * Model3DEditor — محرر الأصول ثلاثية الأبعاد
 * Standalone window for managing, previewing, and exporting 3D models.
 */
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    Upload, Download, Trash2, Box, Eye, EyeOff, Play, Pause,
    Grid, Sun, Package, RefreshCw, Image as ImageIcon, Info,
    ChevronRight, Film, Layers, ZoomIn, ZoomOut, RotateCw,
    Check, Plus, Copy, Move, Search
} from 'lucide-react';
import { Model3DAsset } from '../types';

interface Model3DEditorProps {
    assets: Model3DAsset[];
    onAssetsChange: (assets: Model3DAsset[]) => void;
    onClose?: () => void;
}

/* ─── Mini viewport ─────────────────────────────────────────────────────── */
const ModelPreviewViewport: React.FC<{ asset: Model3DAsset | null }> = ({ asset }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const clockRef = useRef(new THREE.Clock());
    const modelRef = useRef<THREE.Object3D | null>(null);
    const frameRef = useRef<number>(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showWire, setShowWire] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [activeAnim, setActiveAnim] = useState('');
    const [anims, setAnims] = useState<string[]>([]);
    const [loadError, setLoadError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Init Three.js scene once
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const w = container.clientWidth || 400, h = container.clientHeight || 300;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x13131f);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, w / h, 0.01, 2000);
        camera.position.set(2, 1.5, 2.5);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.08;
        controlsRef.current = controls;

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
        sun.position.set(3, 6, 4); sun.castShadow = true;
        scene.add(sun);
        const fill = new THREE.DirectionalLight(0x8888ff, 0.4);
        fill.position.set(-3, -1, -3); scene.add(fill);

        // Grid
        const grid = new THREE.GridHelper(10, 20, 0x333355, 0x222233);
        grid.name = 'grid'; grid.position.y = -0.01;
        scene.add(grid);

        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 1 })
        );
        floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
        scene.add(floor);

        let animId: number;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            const delta = clockRef.current.getDelta();
            mixerRef.current?.update(delta);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();
        frameRef.current = animId!;

        const onResize = () => {
            const nw = container.clientWidth || 400, nh = container.clientHeight || 300;
            camera.aspect = nw / nh; camera.updateProjectionMatrix();
            renderer.setSize(nw, nh);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
    }, []);

    // Load model when asset changes
    useEffect(() => {
        const scene = sceneRef.current; if (!scene) return;
        if (modelRef.current) { scene.remove(modelRef.current); modelRef.current = null; }
        mixerRef.current = null; setAnims([]); setActiveAnim(''); setLoadError('');
        if (!asset) return;

        setIsLoading(true);
        const load = async () => {
            try {
                let root: THREE.Object3D;
                let animations: THREE.AnimationClip[] = [];

                if (asset.format === 'glb' || asset.format === 'gltf') {
                    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
                    const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
                    const loader = new GLTFLoader();
                    const draco = new DRACOLoader();
                    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
                    loader.setDRACOLoader(draco);
                    const gltf = await new Promise<any>((res, rej) => loader.load(asset.src, res, undefined, rej));
                    root = gltf.scene; animations = gltf.animations || [];
                } else if (asset.format === 'obj') {
                    const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
                    root = await new Promise<any>((res, rej) => new OBJLoader().load(asset.src, res, undefined, rej));
                } else if (asset.format === 'fbx') {
                    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
                    const fbx = await new Promise<any>((res, rej) => new FBXLoader().load(asset.src, res, undefined, rej));
                    root = fbx; animations = fbx.animations || [];
                } else if (asset.format === 'stl') {
                    const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
                    const geo = await new Promise<THREE.BufferGeometry>((res, rej) => new STLLoader().load(asset.src, res, undefined, rej));
                    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x888899 }));
                    root = new THREE.Group(); root.add(mesh);
                } else { throw new Error('Unsupported format'); }

                // Auto-center
                const box = new THREE.Box3().setFromObject(root);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = maxDim > 0 ? 2 / maxDim : 1;
                root.position.sub(center.multiplyScalar(scale));
                root.scale.setScalar(scale);
                root.traverse((c: any) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });

                scene.add(root);
                modelRef.current = root;

                if (animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(root);
                    mixerRef.current = mixer;
                    const names = animations.map(a => a.name);
                    setAnims(names); setActiveAnim(names[0]);
                    mixer.clipAction(animations[0]).play();
                }
                setIsLoading(false);
            } catch (e: any) {
                setLoadError(e.message || 'Failed to load'); setIsLoading(false);
            }
        };
        load();
    }, [asset?.id]);

    // Wire toggle
    useEffect(() => {
        if (!modelRef.current) return;
        modelRef.current.traverse((c: any) => {
            if (c.isMesh && c.material) {
                const mats = Array.isArray(c.material) ? c.material : [c.material];
                mats.forEach((m: any) => { m.wireframe = showWire; });
            }
        });
    }, [showWire]);

    // Grid toggle
    useEffect(() => {
        sceneRef.current?.traverse(o => { if (o.name === 'grid') o.visible = showGrid; });
    }, [showGrid]);

    // Animation control
    const playAnim = (name: string) => {
        const mixer = mixerRef.current; const model = modelRef.current;
        if (!mixer || !model) return;
        mixer.stopAllAction();
        const clip = THREE.AnimationClip.findByName(
            (model as any).animations || [], name
        );
        if (clip) mixer.clipAction(clip).play();
        setActiveAnim(name);
    };

    const resetCamera = () => {
        cameraRef.current?.position.set(2, 1.5, 2.5);
        controlsRef.current?.target.set(0, 0, 0);
        controlsRef.current?.update();
    };

    return (
        <div className="flex flex-col h-full bg-[#0d0d1a]">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1 bg-[#13131f] border-b border-[#2a2a3a] shrink-0">
                <button onClick={() => setShowWire(v => !v)}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[9px] rounded border ${showWire ? 'bg-[#1a3050] border-[#2a5080] text-blue-300' : 'border-[#2a2a3a] text-gray-400 hover:text-gray-200'}`}
                ><Eye size={9}/> Wire</button>
                <button onClick={() => setShowGrid(v => !v)}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[9px] rounded border ${showGrid ? 'bg-[#1a3050] border-[#2a5080] text-blue-300' : 'border-[#2a2a3a] text-gray-400 hover:text-gray-200'}`}
                ><Grid size={9}/> Grid</button>
                <button onClick={resetCamera}
                    className="flex items-center gap-1 px-2 py-0.5 text-[9px] rounded border border-[#2a2a3a] text-gray-400 hover:text-gray-200"
                ><RefreshCw size={9}/> Reset Cam</button>

                {anims.length > 0 && <>
                    <div className="w-px h-3 bg-[#2a2a3a] mx-1"/>
                    <Film size={9} className="text-purple-400"/>
                    <select value={activeAnim} onChange={e => playAnim(e.target.value)}
                        className="bg-[#1e1e2e] text-[9px] text-gray-300 border border-[#2a2a3a] px-1 py-0.5 rounded outline-none">
                        {anims.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </>}

                <div className="ml-auto text-[9px] text-gray-500 font-mono">
                    {asset ? `${asset.format.toUpperCase()} · ${asset.polyCount?.toLocaleString() || '?'} poly` : '—'}
                </div>
            </div>

            {/* Viewport */}
            <div ref={containerRef} className="flex-1 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
                        <div className="text-blue-400 text-[11px] font-mono animate-pulse flex items-center gap-2">
                            <RefreshCw size={14} className="animate-spin"/> Loading model...
                        </div>
                    </div>
                )}
                {loadError && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="text-red-400 text-[11px] font-mono text-center px-4">❌ {loadError}</div>
                    </div>
                )}
                {!asset && !isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-600">
                        <Box size={48} className="opacity-20"/>
                        <span className="text-[11px] font-mono">Select a model to preview</span>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Main Model3DEditor ─────────────────────────────────────────────────── */
const Model3DEditor: React.FC<Model3DEditorProps> = ({ assets, onAssetsChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedId, setSelectedId] = useState<string | null>(assets[0]?.id || null);
    const [search, setSearch] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [importStatus, setImportStatus] = useState('');

    const selected = assets.find(a => a.id === selectedId) || null;
    const filtered = assets.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.format.toLowerCase().includes(search.toLowerCase())
    );

    const importFiles = async (files: FileList | File[]) => {
        const fileArr = Array.from(files);
        const supported = fileArr.filter(f => /\.(glb|gltf|obj|fbx|stl)$/i.test(f.name));
        if (!supported.length) { setImportStatus('❌ No supported formats found (GLB/GLTF/OBJ/FBX/STL)'); return; }

        setImportStatus(`Importing ${supported.length} file(s)...`);
        const newAssets: Model3DAsset[] = [];

        for (const file of supported) {
            const src = URL.createObjectURL(file);
            const fmt = file.name.split('.').pop()!.toLowerCase() as Model3DAsset['format'];
            const id = `mdl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

            // Quick stats
            let polyCount = 0, textureCount = 0, animationNames: string[] = [];
            try {
                if (fmt === 'glb' || fmt === 'gltf') {
                    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
                    const gltf = await new Promise<any>((res, rej) => new GLTFLoader().load(src, res, undefined, rej));
                    animationNames = (gltf.animations || []).map((a: any) => a.name);
                    gltf.scene.traverse((c: any) => {
                        if (c.isMesh?.()) { polyCount += (c.geometry?.index?.count||0)/3; }
                    });
                }
            } catch { /* non-critical */ }

            newAssets.push({
                id, name: file.name.replace(/\.[^.]+$/, ''),
                src, format: fmt,
                polyCount, textureCount,
                animationNames,
                fileSize: file.size,
            });
        }

        const merged = [...assets, ...newAssets];
        onAssetsChange(merged);
        if (newAssets[0]) setSelectedId(newAssets[0].id);
        setImportStatus(`✅ Imported ${newAssets.length} model(s)`);
        setTimeout(() => setImportStatus(''), 3000);
    };

    const deleteAsset = (id: string) => {
        const asset = assets.find(a => a.id === id);
        if (asset?.src.startsWith('blob:')) URL.revokeObjectURL(asset.src);
        const updated = assets.filter(a => a.id !== id);
        onAssetsChange(updated);
        if (selectedId === id) setSelectedId(updated[0]?.id || null);
    };

    const exportAsset = async (asset: Model3DAsset, format: 'glb' | 'gltf' | 'obj') => {
        // Re-load and re-export
        const { ModelLoader } = await import('../utils/modelLoader');
        try {
            const result = await ModelLoader.loadFromUrl(asset.src, asset.format);
            let blob: Blob;
            if (format === 'glb') blob = await ModelLoader.exportGLB(result.scene);
            else if (format === 'gltf') blob = await ModelLoader.exportGLTF(result.scene);
            else blob = await ModelLoader.exportOBJ(result.scene);
            ModelLoader.downloadBlob(blob, `${asset.name}.${format}`);
        } catch (e: any) { window.alert('Export error: ' + e.message); }
    };

    const duplicateAsset = (asset: Model3DAsset) => {
        const copy: Model3DAsset = { ...asset, id: `mdl_${Date.now()}`, name: asset.name + '_copy' };
        onAssetsChange([...assets, copy]);
        setSelectedId(copy.id);
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatBadge: Record<string, string> = {
        glb: 'bg-blue-900/50 text-blue-300',
        gltf: 'bg-indigo-900/50 text-indigo-300',
        obj: 'bg-green-900/50 text-green-300',
        fbx: 'bg-orange-900/50 text-orange-300',
        stl: 'bg-purple-900/50 text-purple-300',
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#0d0d1a] text-white overflow-hidden"
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); importFiles(e.dataTransfer.files); }}
        >
            {/* Drop overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-blue-900/40 border-4 border-dashed border-blue-400 pointer-events-none">
                    <Box size={56} className="text-blue-300 mb-2 opacity-80"/>
                    <span className="text-blue-200 text-[14px] font-bold">Drop 3D Models Here</span>
                    <span className="text-blue-300/70 text-[11px] mt-1">GLB · GLTF · OBJ · FBX · STL</span>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Asset Library */}
                <div className="w-56 flex flex-col border-r border-[#1e1e30] bg-[#10101e] shrink-0">
                    {/* Search + Import */}
                    <div className="p-2 border-b border-[#1e1e30] flex flex-col gap-1.5">
                        <div className="flex items-center gap-1 bg-[#1a1a2e] border border-[#2a2a3a] rounded px-1.5 py-0.5">
                            <Search size={9} className="text-gray-500"/>
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search models..."
                                className="flex-1 bg-transparent text-[10px] text-gray-300 outline-none placeholder-gray-600"/>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-[10px] font-bold rounded transition-colors">
                            <Upload size={11}/> Import Models
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden"
                            multiple accept=".glb,.gltf,.obj,.fbx,.stl"
                            onChange={e => { if (e.target.files) importFiles(e.target.files); e.target.value = ''; }}/>
                    </div>

                    {/* Asset list */}
                    <div className="flex-1 overflow-y-auto p-1">
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-600 gap-2">
                                <Box size={28} className="opacity-20"/>
                                <span className="text-[10px] italic">
                                    {search ? 'No results' : 'No models imported'}
                                </span>
                            </div>
                        )}
                        {filtered.map(asset => (
                            <div key={asset.id}
                                onClick={() => setSelectedId(asset.id)}
                                className={`group flex flex-col gap-0.5 px-2 py-1.5 rounded mb-0.5 cursor-pointer transition-colors ${selectedId === asset.id ? 'bg-[#1a2840] border border-[#2a4060]' : 'hover:bg-[#151525]'}`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <Box size={11} className={selectedId === asset.id ? 'text-blue-400' : 'text-gray-500'}/>
                                    <span className="flex-1 text-[11px] text-gray-200 truncate">{asset.name}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${formatBadge[asset.format] || 'bg-gray-800 text-gray-400'}`}>
                                        {asset.format}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 pl-5 text-[9px] text-gray-500">
                                    {asset.polyCount !== undefined && <span>{asset.polyCount.toLocaleString()}▲</span>}
                                    {asset.animationNames?.length ? <span className="text-purple-400">{asset.animationNames.length}♦</span> : null}
                                    {asset.fileSize !== undefined && <span>{formatBytes(asset.fileSize)}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Status */}
                    {importStatus && (
                        <div className="px-2 py-1.5 border-t border-[#1e1e30] text-[9px] text-gray-400 font-mono truncate">
                            {importStatus}
                        </div>
                    )}
                    <div className="px-2 py-1 border-t border-[#1e1e30] text-[9px] text-gray-600">
                        {assets.length} model{assets.length !== 1 ? 's' : ''} · Drop to import
                    </div>
                </div>

                {/* Center: Preview Viewport */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <ModelPreviewViewport asset={selected}/>
                </div>

                {/* Right: Details / Actions */}
                <div className="w-52 flex flex-col border-l border-[#1e1e30] bg-[#10101e] shrink-0">
                    <div className="px-3 py-2 border-b border-[#1e1e30] bg-[#13131f]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Info size={10}/> Properties
                        </span>
                    </div>

                    {selected ? (
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                            {/* Name */}
                            <div>
                                <div className="text-[9px] text-gray-500 mb-1 uppercase">Name</div>
                                <input type="text" value={selected.name}
                                    onChange={e => onAssetsChange(assets.map(a => a.id === selected.id ? {...a, name: e.target.value} : a))}
                                    className="w-full bg-[#1a1a2e] border border-[#2a2a3a] text-[11px] text-gray-200 px-2 py-1 rounded outline-none focus:border-blue-500"/>
                            </div>

                            {/* Stats */}
                            <div className="bg-[#1a1a2e] rounded p-2 space-y-1.5">
                                <div className="text-[9px] text-gray-500 uppercase mb-1">Stats</div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Format</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${formatBadge[selected.format]}`}>{selected.format}</span>
                                </div>
                                {selected.polyCount !== undefined && (
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-500">Polygons</span>
                                        <span className="text-gray-300">{selected.polyCount.toLocaleString()}</span>
                                    </div>
                                )}
                                {selected.textureCount !== undefined && (
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-500">Textures</span>
                                        <span className="text-gray-300">{selected.textureCount}</span>
                                    </div>
                                )}
                                {selected.animationNames?.length ? (
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-500">Animations</span>
                                        <span className="text-purple-300">{selected.animationNames.length}</span>
                                    </div>
                                ) : null}
                                {selected.fileSize !== undefined && (
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-500">File Size</span>
                                        <span className="text-gray-300">{formatBytes(selected.fileSize)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Animations list */}
                            {selected.animationNames && selected.animationNames.length > 0 && (
                                <div className="bg-[#1a1a2e] rounded p-2">
                                    <div className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1"><Film size={9}/> Animations</div>
                                    {selected.animationNames.map(name => (
                                        <div key={name} className="text-[10px] text-purple-300 px-1 py-0.5 font-mono truncate">• {name}</div>
                                    ))}
                                </div>
                            )}

                            {/* Export */}
                            <div className="bg-[#1a1a2e] rounded p-2">
                                <div className="text-[9px] text-gray-500 uppercase mb-2 flex items-center gap-1"><Download size={9}/> Export As</div>
                                <div className="flex flex-col gap-1">
                                    {(['glb', 'gltf', 'obj'] as const).map(fmt => (
                                        <button key={fmt} onClick={() => exportAsset(selected, fmt)}
                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-[#252535] hover:bg-[#353545] text-[10px] text-gray-300 rounded border border-[#2a2a3a] transition-colors text-left">
                                            <Download size={10} className="text-green-400 shrink-0"/>
                                            <span className="uppercase font-bold text-green-400 w-8">{fmt}</span>
                                            <span className="text-gray-500 text-[9px]">
                                                {fmt==='glb'?'Binary (compact)':fmt==='gltf'?'JSON (editable)':'Wavefront OBJ'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1.5">
                                <button onClick={() => duplicateAsset(selected)}
                                    className="flex-1 py-1.5 text-[9px] bg-[#252535] hover:bg-[#353545] text-yellow-300 rounded border border-[#2a2a3a] flex items-center justify-center gap-1 transition-colors">
                                    <Copy size={10}/> Duplicate
                                </button>
                                <button onClick={() => deleteAsset(selected.id)}
                                    className="flex-1 py-1.5 text-[9px] bg-[#3d1a1a] hover:bg-[#5d2a2a] text-red-400 rounded border border-[#5a2a2a] flex items-center justify-center gap-1 transition-colors">
                                    <Trash2 size={10}/> Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-600">
                            <div className="text-center text-[10px] italic">Select a model</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Model3DEditor;
