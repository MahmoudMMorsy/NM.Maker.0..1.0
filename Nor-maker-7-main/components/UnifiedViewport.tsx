import React, { useState } from 'react';
import { Camera, Box, Square, Eye, MoveDiagonal, Play } from 'lucide-react';
import { ThreeDEditor } from './ThreeDEditor';
import type {
    SpriteAsset, BackgroundAsset, GameObject, UIMenu, RoomData,
    LevelData, RoomSettings, BackgroundDef, ViewDef, RoomViewMode,
    IsoCell, Scene3DObject, Model3DAsset
} from '../types';

export type CameraAngle = 'perspective' | 'top' | 'front' | 'side' | 'isometric' | 'game';

export interface UnifiedViewportProps {
    activeRoom: RoomData | undefined;
    levelData: LevelData;
    layers?: import('../types').LevelDataLayer[];
    onUpdateLayers?: (layers: import('../types').LevelDataLayer[]) => void;
    stamps?: import('../types').Stamp[];
    onSaveStamp?: (stamp: import('../types').Stamp) => void;
    width: number;
    height: number;
    sprites: SpriteAsset[];
    backgroundAssets: BackgroundAsset[];
    gameObjects: GameObject[];
    uiMenus: UIMenu[];
    onUpdate: (level: LevelData) => void;
    onResize: (w: number, h: number) => void;
    roomSettings: RoomSettings;
    onUpdateRoomSettings: (s: RoomSettings) => void;
    backgrounds: BackgroundDef[];
    onUpdateBackgrounds: (b: BackgroundDef[]) => void;
    views: ViewDef[];
    onUpdateViews: (v: ViewDef[]) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    viewMode: RoomViewMode;
    onUpdateViewMode: (m: RoomViewMode) => void;
    zDepth: number;
    onUpdateZDepth: (z: number) => void;
    drawOnSurface?: 'top' | 'side' | boolean;
    onUpdateDrawOnSurface?: (s: any) => void;
    isoMap: IsoCell[];
    onUpdateIsoMap: (m: IsoCell[]) => void;
    scene3D: Scene3DObject[];
    onUpdateScene3D: (s: Scene3DObject[]) => void;
    tileDefs?: any[];
    model3DAssets: Model3DAsset[];
    onAddModel3DAsset: (a: Model3DAsset) => void;
    onPlayGame?: () => void;
}

type InternalViewType = 'perspective' | 'top' | 'front' | 'side' | 'bottom' | 'back' | 'left' | 'isometric';

const ANGLES: { id: CameraAngle; label: string; icon: React.ReactNode; tip: string; mapsTo: InternalViewType }[] = [
    { id: 'perspective', label: 'Perspective', icon: <Eye size={12} />,         tip: 'منظور حر — UE5 free 3D', mapsTo: 'perspective' },
    { id: 'top',         label: 'Top',         icon: <Square size={12} />,      tip: 'عرض علوي — Top-down (orthographic)', mapsTo: 'top' },
    { id: 'front',       label: 'Front',       icon: <Camera size={12} />,      tip: 'مشهد جانبي — Side-scroller (orthographic)', mapsTo: 'front' },
    { id: 'side',        label: 'Side',        icon: <Camera size={12} />,      tip: 'Side', mapsTo: 'side' },
    { id: 'isometric',   label: 'Isometric',   icon: <MoveDiagonal size={12} />, tip: 'إيزومتري — 2.5D iso projection', mapsTo: 'isometric' },
    { id: 'game',        label: 'Game',        icon: <Play size={12} />,        tip: 'تشغيل اللعبة', mapsTo: 'perspective' },
];

const ANGLE_TO_VIEWMODE: Record<CameraAngle, RoomViewMode> = {
    perspective: '3d',
    top:         '2d',
    front:       '2d',
    side:        '2d',
    isometric:   '2.5d',
    game:        '2d',
};

export const UnifiedViewport: React.FC<UnifiedViewportProps> = (props) => {
    const {
        activeRoom, sprites, gameObjects, viewMode, onUpdateViewMode,
        scene3D, onUpdateScene3D, model3DAssets, onAddModel3DAsset,
        onUpdate: onUpdateMap, onPlayGame,
    } = props;

    const [angle, setAngle] = useState<CameraAngle>('perspective');

    const handleAngleClick = (a: CameraAngle) => {
        if (a === 'game') {
            if (onPlayGame) onPlayGame();
            return;
        }
        setAngle(a);
        const targetMode = ANGLE_TO_VIEWMODE[a];
        if (viewMode !== targetMode) onUpdateViewMode(targetMode);
    };

    const internalViewType: InternalViewType =
        ANGLES.find(x => x.id === angle)?.mapsTo ?? 'perspective';

    // Always render the SAME 3D scene. The camera angle just changes the
    // orthographic/perspective camera. This is exactly how UE5's "2D Game"
    // (2D Side-Scroller / Top-Down) template works: one true 3D world,
    // projected through whichever camera the editor selects.
    return (
        <div className="flex flex-col h-full w-full bg-win-face" dir="rtl">
            {/* UE5-style camera-angle bar (drives the same 3D scene) */}
            <div className="flex items-center gap-1 px-2 py-1 bg-win-shadow/30 border-b border-win-darkshadow text-[10px] font-pixel">
                <span className="text-win-text/70 me-2 flex items-center gap-1">
                    <Box size={12} /> زاوية الكاميرا:
                </span>
                {ANGLES.map(a => (
                    <button
                        key={a.id}
                        title={a.tip}
                        onClick={() => handleAngleClick(a.id)}
                        className={[
                            'flex items-center gap-1 px-2 py-1 rounded-sm border',
                            angle === a.id
                                ? 'bg-win-select text-white border-win-darkshadow shadow-win-in'
                                : 'bg-win-face border-win-shadow hover:border-win-highlight'
                        ].join(' ')}
                    >
                        {a.icon}
                        <span>{a.label}</span>
                    </button>
                ))}
                <div className="ms-auto text-[9px] text-win-text/60">
                    UE5-style 2D Game · one 3D scene · {internalViewType.toUpperCase()}
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                <ThreeDEditor
                    room={activeRoom as any}
                    sprites={sprites}
                    gameObjects={gameObjects}
                    model3DAssets={model3DAssets}
                    onAddModel3DAsset={onAddModel3DAsset}
                    onUpdateScene={onUpdateScene3D}
                    onUpdateMap={onUpdateMap}
                    viewType={internalViewType}
                    onViewTypeChange={(v) => {
                        // If the user picks an angle from ThreeDEditor's own
                        // built-in dropdown, sync our toolbar back to it.
                        const match = ANGLES.find(a => a.mapsTo === v);
                        if (match) {
                            setAngle(match.id);
                            const tm = ANGLE_TO_VIEWMODE[match.id];
                            if (viewMode !== tm) onUpdateViewMode(tm);
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default UnifiedViewport;
