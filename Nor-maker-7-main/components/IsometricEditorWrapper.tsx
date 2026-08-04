
import React from 'react';
import { IsometricEditor } from './IsometricEditor';

const IsometricEditorWrapper = ({ room, sprites, isoMap, onUpdateMap }: any) => {
    const [tool, setTool] = React.useState<'select'|'tile'|'ramp'|'sprite'|'eraser'>('tile');
    const [selectedTileId, setSelectedTileId] = React.useState(0);
    const [zDepth, setZDepth] = React.useState(0);
    const [drawOnSurface, setDrawOnSurface] = React.useState(false);
    const roomWithIso = { ...room, isoMap };
    return (
        <div className="h-full flex flex-col">
            <div className="flex gap-1 p-1 bg-win-face border-b border-win-shadow flex-wrap">
                {(['tile','ramp','sprite','eraser','select'] as const).map(t => (
                    <button key={t} onClick={() => setTool(t)} className={`px-2 py-0.5 text-[8px] border ${tool===t ? 'bg-win-select text-white border-win-darkshadow shadow-win-in' : 'bg-win-face border-win-shadow shadow-win-out hover:bg-win-highlight'}`}>{t}</button>
                ))}
                <span className="ml-2 text-[8px] flex items-center gap-1">Z:<input type="number" value={zDepth} onChange={e=>setZDepth(+e.target.value)} className="w-10 text-[8px] border border-win-shadow px-1" min="0" max="10"/></span>
                <label className="text-[8px] flex items-center gap-1 ml-1"><input type="checkbox" checked={drawOnSurface} onChange={e=>setDrawOnSurface(e.target.checked)}/> Draw on Surface</label>
            </div>
            <div className="flex-1 overflow-hidden">
                <IsometricEditor room={roomWithIso} sprites={sprites} selectedTileId={selectedTileId} zDepth={zDepth} drawOnSurface={drawOnSurface} tool={tool} onUpdateIsoMap={onUpdateMap} onUpdateZDepth={setZDepth} onUpdateDrawOnSurface={setDrawOnSurface} />
            </div>
        </div>
    );
};

export default IsometricEditorWrapper;
