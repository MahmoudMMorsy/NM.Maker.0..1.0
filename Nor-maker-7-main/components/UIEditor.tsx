import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { UIMenu, UIElement, SpriteAsset } from '../types';
import { Plus, Trash2, Move, Type, Image as ImageIcon, AlignLeft, Square, ArrowUp, ArrowDown } from 'lucide-react';

interface UIEditorProps {
    menu: UIMenu;
    onUpdate: (menu: UIMenu) => void;
    sprites: SpriteAsset[];
}

export default function UIEditor({ menu, onUpdate, sprites }: UIEditorProps) {
    // ⚡ Bolt: Pre-build an O(1) Map lookup index for sprites to avoid linear array searches (O(N)) on every element during canvas renders.
    const spriteMap = useMemo(() => {
        const map = new Map<string, SpriteAsset>();
        for (let i = 0; i < sprites.length; i++) {
            map.set(sprites[i].id, sprites[i]);
        }
        return map;
    }, [sprites]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ startMouseX: 0, startMouseY: 0, initialPositions: {} as { [key: string]: { x: number, y: number } } });

    const handleAddElement = (type: UIElement['type']) => {
        const newElement: UIElement = {
            id: `elem_${Date.now()}`,
            name: `New ${type}`,
            type,
            x: 10,
            y: 10,
            w: type === 'text' ? 100 : type === 'bar' ? 100 : 32,
            h: type === 'text' ? 20 : type === 'bar' ? 10 : 32,
            visible: true,
            text: type === 'text' || type === 'button' ? 'Text' : undefined,
            barColor: type === 'bar' ? '#ff0000' : undefined,
            barValue: type === 'bar' ? '100' : undefined,
        };
        onUpdate({ ...menu, elements: [...menu.elements, newElement] });
        setSelectedIds([newElement.id]);
    };

    const handleUpdateElement = (id: string, updates: Partial<UIElement>) => {
        onUpdate({
            ...menu,
            elements: menu.elements.map(el => el.id === id ? { ...el, ...updates } : el)
        });
    };

    const handleDeleteElement = (id: string) => {
        onUpdate({
            ...menu,
            elements: menu.elements.filter(el => el.id !== id)
        });
        setSelectedIds(prev => prev.filter(p => p !== id));
    };

    const handleDeleteElements = () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Delete ${selectedIds.length} elements?`)) {
            onUpdate({
                ...menu,
                elements: menu.elements.filter(el => !selectedIds.includes(el.id))
            });
            setSelectedIds([]);
        }
    };

    const handleRenameElement = (el: UIElement) => {
        const newName = window.prompt("Enter new name:", el.name);
        if (newName) {
            handleUpdateElement(el.id, { name: newName });
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedIds.length > 0) {
                    handleDeleteElements();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, menu, onUpdate]);

    const selectedElement = menu.elements.find(el => selectedIds.includes(el.id));

    const handleMoveOrder = (id: string, dir: -1 | 1) => {
        const idx = menu.elements.findIndex(e => e.id === id);
        if (idx === -1) return;
        if (idx + dir < 0 || idx + dir >= menu.elements.length) return;
        const newEls = [...menu.elements];
        const temp = newEls[idx];
        newEls[idx] = newEls[idx + dir];
        newEls[idx + dir] = temp;
        onUpdate({ ...menu, elements: newEls });
    };

    const handlePointerDown = (e: React.PointerEvent, el: UIElement) => {
        let newSelected = [...selectedIds];
        if (e.shiftKey || e.ctrlKey) {
            if (newSelected.includes(el.id)) {
                newSelected = newSelected.filter(id => id !== el.id);
            } else {
                newSelected.push(el.id);
            }
        } else {
            newSelected = [el.id];
        }
        setSelectedIds(newSelected);

        const initialPositions: { [key: string]: { x: number, y: number } } = {};
        menu.elements.forEach(e => {
            if (newSelected.includes(e.id) || (el.groupId && e.groupId === el.groupId)) {
                initialPositions[e.id] = { x: e.x, y: e.y };
            }
        });

        setDraggingId(el.id);
        setDragOffset({
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            initialPositions
        });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        e.stopPropagation();
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (draggingId) {
            const dx = Math.round(e.clientX - dragOffset.startMouseX);
            const dy = Math.round(e.clientY - dragOffset.startMouseY);

            const newElements = menu.elements.map(el => {
                if (dragOffset.initialPositions[el.id]) {
                    return {
                        ...el,
                        x: dragOffset.initialPositions[el.id].x + dx,
                        y: dragOffset.initialPositions[el.id].y + dy
                    };
                }
                return el;
            });
            onUpdate({ ...menu, elements: newElements });
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (draggingId) {
            setDraggingId(null);
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div className="flex h-full bg-win-face text-win-text font-ui text-sm">
            {/* Left Sidebar - Element List */}
            <div className="w-48 border-r border-gray-400 flex flex-col bg-white">
                <div className="p-2 border-b border-gray-400 bg-win-face flex justify-between items-center">
                    <span className="font-bold">Elements</span>
                    <div className="flex gap-1">
                        {selectedIds.length > 0 && (
                            <button onClick={handleDeleteElements} title="Delete Selected" className="p-1 hover:bg-red-100 text-red-500 border border-transparent hover:border-red-400"><Trash2 size={14}/></button>
                        )}
                        <button onClick={() => handleAddElement('text')} title="Add Text" className="p-1 hover:bg-gray-200 border border-transparent hover:border-gray-400"><Type size={14}/></button>
                        <button onClick={() => handleAddElement('image')} title="Add Image" className="p-1 hover:bg-gray-200 border border-transparent hover:border-gray-400"><ImageIcon size={14}/></button>
                        <button onClick={() => handleAddElement('button')} title="Add Button" className="p-1 hover:bg-gray-200 border border-transparent hover:border-gray-400"><Square size={14}/></button>
                        <button onClick={() => handleAddElement('bar')} title="Add Progress Bar" className="p-1 hover:bg-gray-200 border border-transparent hover:border-gray-400"><AlignLeft size={14}/></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-1">
                    {selectedIds.length > 1 && (
                        <div className="flex gap-1 mb-2">
                            <button
                                onClick={() => {
                                    const gid = `group_${Date.now()}`;
                                    const newElements = menu.elements.map(el =>
                                        selectedIds.includes(el.id) ? { ...el, groupId: gid } : el
                                    );
                                    onUpdate({ ...menu, elements: newElements });
                                }}
                                className="flex-1 bg-win-face border border-win-shadow shadow-win-out text-[10px] py-1 font-bold hover:bg-gray-100"
                            >
                                Group (ضم بجروب)
                            </button>
                        </div>
                    )}
                    {(() => {
                        const grouped: Record<string, UIElement[]> = {};
                        const ungrouped: UIElement[] = [];
                        menu.elements.forEach(el => {
                            if (el.groupId) (grouped[el.groupId] = grouped[el.groupId] || []).push(el);
                            else ungrouped.push(el);
                        });

                        const renderElementItem = (el: UIElement) => (
                            <div
                                key={el.id}
                                onClick={(e) => {
                                    if (e.shiftKey || e.ctrlKey) {
                                        setSelectedIds(prev => prev.includes(el.id) ? prev.filter(p=>p!==el.id) : [...prev, el.id]);
                                    } else {
                                        setSelectedIds([el.id]);
                                    }
                                }}
                                onDoubleClick={() => handleRenameElement(el)}
                                className={`flex items-center justify-between p-1 cursor-pointer border ${selectedIds.includes(el.id) ? 'bg-win-select text-white border-dotted border-gray-400' : 'border-transparent hover:bg-gray-100'}`}
                            >
                                <span className="truncate flex-1 min-w-0 pointer-events-none" title="Double click to rename">{el.name} ({el.type})</span>
                                <div className="flex gap-1 ml-1">
                                    <button onClick={(e) => { e.stopPropagation(); handleMoveOrder(el.id, -1); }} className="text-gray-500 hover:text-black">
                                        <ArrowUp size={12} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleMoveOrder(el.id, 1); }} className="text-gray-500 hover:text-black">
                                        <ArrowDown size={12} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteElement(el.id); }} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        );

                        return (
                            <>
                                {Object.entries(grouped).map(([gid, elements]) => (
                                    <div key={gid} className="mb-2 border border-blue-100 rounded bg-blue-50/30 overflow-hidden">
                                        <div className="bg-blue-100/50 px-2 py-1 text-[10px] font-bold flex justify-between items-center group">
                                            <span className="flex items-center gap-1"><Square size={10} className="fill-blue-400 text-blue-500"/> Group ({elements.length})</span>
                                            <button
                                                onClick={() => {
                                                    onUpdate({ ...menu, elements: menu.elements.map(el => el.groupId === gid ? { ...el, groupId: undefined } : el) });
                                                }}
                                                className="text-red-500 hover:font-bold hidden group-hover:block"
                                            >
                                                Ungroup
                                            </button>
                                        </div>
                                        <div className="pl-2 border-l-2 border-blue-200">
                                            {elements.map(renderElementItem)}
                                        </div>
                                    </div>
                                ))}
                                {ungrouped.map(renderElementItem)}
                            </>
                        );
                    })()}
                    {menu.elements.length === 0 && <div className="p-4 text-gray-500 text-center text-xs italic">No elements added.</div>}
                </div>
            </div>

            {/* Center - Canvas Preview */}
            <div className="flex-1 bg-gray-300 relative overflow-hidden border-r border-gray-400 flex items-center justify-center p-4">
                <div className="bg-black relative shadow-lg" style={{ width: 320, height: 240, overflow: 'hidden' }}>
                    {/* Mock Canvas Area (320x240 typical retro resolution) */}
                    {menu.elements.map(el => {
                        const isSelected = selectedIds.includes(el.id);
                        return (
                            <div
                                key={el.id}
                                onPointerDown={(e) => handlePointerDown(e, el)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                className={`absolute cursor-pointer ${isSelected ? 'ring-1 ring-white ring-dashed z-10' : ''}`}
                                style={{
                                    left: el.x,
                                    top: el.y,
                                    width: el.w,
                                    height: el.h,
                                    display: el.visible ? 'flex' : 'none',
                                    alignItems: 'center',
                                    justifyContent: el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center',
                                    backgroundColor: el.type === 'button' ? (el.bgColor || '#444444') : el.type === 'bar' ? '#222222' : (el.bgColor || 'transparent'),
                                    color: el.textColor || 'white',
                                    border: el.type === 'button' ? '2px solid #888' : 'none',
                                    fontSize: el.fontSize ? `${el.fontSize}px` : '8px',
                                    fontFamily: el.fontFamily || '"Press Start 2P"',
                                    textAlign: el.textAlign || 'center'
                                }}
                            >
                                {el.type === 'text' && <span>{el.text}</span>}
                                {el.type === 'button' && <span>{el.text}</span>}
                                {el.type === 'image' && (
                                    el.spriteId ?
                                    <img src={spriteMap.get(el.spriteId)?.src || undefined} alt={el.name} style={{width:'100%', height:'100%', objectFit:'contain'}} />
                                    : <div className="w-full h-full bg-pink-500 opacity-50 flex items-center justify-center text-[8px]">IMG</div>
                                )}
                                {el.type === 'bar' && (
                                    <div className="w-full h-full" style={{backgroundColor: '#222'}}>
                                        <div style={{width: '50%', height: '100%', backgroundColor: el.barColor || 'red'}}></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="w-64 bg-win-face flex flex-col">
                <div className="p-2 border-b border-gray-400 font-bold bg-win-face">Properties</div>
                <div className="flex-1 overflow-y-auto p-2 space-y-3">
                    <div>
                        <label className="block text-xs mb-1">Menu Name</label>
                        <input
                            type="text"
                            className="w-full border border-gray-400 p-1 text-black"
                            value={menu.name}
                            onChange={(e) => onUpdate({ ...menu, name: e.target.value })}
                        />
                    </div>
                    <hr className="border-gray-400" />

                    {selectedElement ? (
                        <>
                            <div className="font-bold text-xs text-win-blue">Element: {selectedElement.name}</div>

                            <div>
                                <label className="block text-xs mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-400 p-1 text-black"
                                    value={selectedElement.name}
                                    onChange={(e) => handleUpdateElement(selectedElement.id, { name: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs mb-1">X</label>
                                    <input type="number" className="w-full border border-gray-400 p-1 text-black" value={selectedElement.x} onChange={(e) => handleUpdateElement(selectedElement.id, { x: parseInt(e.target.value)||0 })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs mb-1">Y</label>
                                    <input type="number" className="w-full border border-gray-400 p-1 text-black" value={selectedElement.y} onChange={(e) => handleUpdateElement(selectedElement.id, { y: parseInt(e.target.value)||0 })} />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs mb-1">Width</label>
                                    <input type="number" className="w-full border border-gray-400 p-1 text-black" value={selectedElement.w} onChange={(e) => handleUpdateElement(selectedElement.id, { w: parseInt(e.target.value)||0 })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs mb-1">Height</label>
                                    <input type="number" className="w-full border border-gray-400 p-1 text-black" value={selectedElement.h} onChange={(e) => handleUpdateElement(selectedElement.id, { h: parseInt(e.target.value)||0 })} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="el_visible"
                                    checked={selectedElement.visible}
                                    onChange={(e) => handleUpdateElement(selectedElement.id, { visible: e.target.checked })}
                                />
                                <label htmlFor="el_visible" className="text-xs">Visible by default</label>
                            </div>

                            {selectedElement.groupId && (
                                <div className="mt-2 p-2 bg-win-shadow/20 border border-win-shadow/40 rounded-sm">
                                    <div className="text-[10px] text-win-blue font-bold mb-1 flex justify-between items-center">
                                        <span>Group: {selectedElement.groupId}</span>
                                        <button
                                            onClick={() => {
                                                const gid = selectedElement.groupId;
                                                const newElements = menu.elements.map(el =>
                                                    el.groupId === gid ? { ...el, groupId: undefined } : el
                                                );
                                                onUpdate({ ...menu, elements: newElements });
                                            }}
                                            className="text-red-600 hover:underline"
                                        >
                                            Ungroup (فك الجروب)
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-gray-500">All elements in this group move together.</p>
                                </div>
                            )}

                            {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
                                <>
                                    <div>
                                        <label className="block text-xs mb-1 mt-2">Text Content</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-400 p-1 text-black"
                                            value={selectedElement.text || ''}
                                            onChange={(e) => handleUpdateElement(selectedElement.id, { text: e.target.value })}
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Start with '=' for dynamic code (e.g. =window.score)</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <label className="block text-xs mb-1">Text Color</label>
                                            <input type="color" className="w-full border border-gray-400 p-0 h-6" value={selectedElement.textColor || '#ffffff'} onChange={(e) => handleUpdateElement(selectedElement.id, { textColor: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs mb-1">Background</label>
                                            <input type="color" className="w-full border border-gray-400 p-0 h-6" value={selectedElement.bgColor || '#000000'} onChange={(e) => handleUpdateElement(selectedElement.id, { bgColor: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <label className="block text-xs mb-1">Font Size</label>
                                            <input type="number" className="w-full border border-gray-400 p-1 text-black" value={selectedElement.fontSize || 8} onChange={(e) => handleUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 8 })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs mb-1">Align</label>
                                            <select className="w-full border border-gray-400 p-1 text-black" value={selectedElement.textAlign || 'center'} onChange={(e) => handleUpdateElement(selectedElement.id, { textAlign: e.target.value as any })}>
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <label className="block text-xs mb-1">Font Family</label>
                                        <select className="w-full border border-gray-400 p-1 text-black" value={selectedElement.fontFamily || '"Press Start 2P"'} onChange={(e) => handleUpdateElement(selectedElement.id, { fontFamily: e.target.value })}>
                                            <option value='"Press Start 2P"'>Press Start 2P</option>
                                            <option value="Arial">Arial</option>
                                            <option value="Tahoma">Tahoma</option>
                                            <option value="Verdana">Verdana</option>
                                            <option value="Courier New">Courier New</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {selectedElement.type === 'button' && (
                                <div>
                                    <label className="block text-xs mb-1 mt-2">On Click Action (JS Code)</label>
                                    <textarea
                                        className="w-full border border-gray-400 p-1 text-black font-mono text-xs"
                                        rows={3}
                                        value={selectedElement.action || ''}
                                        onChange={(e) => handleUpdateElement(selectedElement.id, { action: e.target.value })}
                                        placeholder="e.g. window.score += 10; window.isPaused = false;"
                                    />
                                </div>
                            )}

                            {selectedElement.type === 'image' && (
                                <div>
                                    <label className="block text-xs mb-1 mt-2">Sprite</label>
                                    <select
                                        className="w-full border border-gray-400 p-1 text-black"
                                        value={selectedElement.spriteId || ''}
                                        onChange={(e) => handleUpdateElement(selectedElement.id, { spriteId: e.target.value })}
                                    >
                                        <option value="">-- Select Sprite --</option>
                                        {sprites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {selectedElement.type === 'bar' && (
                                <>
                                    <div>
                                        <label className="block text-xs mb-1 mt-2">Bar Color</label>
                                        <input
                                            type="color"
                                            className="w-full border border-gray-400 p-0 h-8"
                                            value={selectedElement.barColor || '#ff0000'}
                                            onChange={(e) => handleUpdateElement(selectedElement.id, { barColor: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 mt-2">Value Expression (JS)</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-400 p-1 text-black font-mono text-xs"
                                            placeholder="e.g. global.health"
                                            value={selectedElement.barValue || ''}
                                            onChange={(e) => handleUpdateElement(selectedElement.id, { barValue: e.target.value })}
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Evaluated to 0-100%</p>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-gray-500 text-xs italic text-center mt-4">Select an element to edit properties.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
