import * as React from 'react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Plus, Trash2, Play, Pause, Repeat, Zap, ArrowRight, Settings as SettingsIcon, Layers, Variable } from 'lucide-react';
import {
  AnimationStateMachine, AnimState, AnimTransition, AnimSequence,
  AnimNotify, AnimNotifyKind, SpriteAsset
} from '../types';

interface Props {
  fsm: AnimationStateMachine | undefined;
  sprites: SpriteAsset[];
  onUpdate: (fsm: AnimationStateMachine) => void;
}

const newId = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const NOTIFY_KINDS: AnimNotifyKind[] = ['PlaySound', 'SpawnFX', 'DealDamage', 'EnableHitbox', 'DisableHitbox', 'Footstep', 'Custom'];

function emptyFSM(): AnimationStateMachine {
  const idleId = newId('state');
  return {
    id: newId('fsm'),
    initialStateId: idleId,
    states: [{ id: idleId, name: 'Idle', sequenceId: null, x: 80, y: 80 }],
    transitions: [],
    sequences: [],
    variables: [
      { name: 'vx', value: 0 },
      { name: 'vy', value: 0 },
      { name: 'isGrounded', value: true },
    ],
  };
}

const AnimStateMachineEditor: React.FC<Props> = ({ fsm: fsmProp, sprites, onUpdate }) => {
  const fsm = fsmProp || emptyFSM();
  const [tab, setTab] = useState<'graph' | 'sequences' | 'variables'>('graph');
  const [selectedStateId, setSelectedStateId] = useState<string | null>(fsm.initialStateId);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(fsm.sequences[0]?.id || null);
  const [draggingState, setDraggingState] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [linking, setLinking] = useState<{ fromId: string } | null>(null);
  const [previewFrame, setPreviewFrame] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const graphRef = useRef<HTMLDivElement | null>(null);

  const update = (patch: Partial<AnimationStateMachine>) => onUpdate({ ...fsm, ...patch });

  const addState = () => {
    const id = newId('state');
    const s: AnimState = { id, name: `State ${fsm.states.length + 1}`, sequenceId: fsm.sequences[0]?.id || null, x: 100 + fsm.states.length * 30, y: 100 + fsm.states.length * 30 };
    update({ states: [...fsm.states, s] });
    setSelectedStateId(id);
  };

  const deleteState = (id: string) => {
    if (fsm.states.length <= 1) { window.alert('Must keep at least one state'); return; }
    const states = fsm.states.filter(s => s.id !== id);
    const transitions = fsm.transitions.filter(t => t.from !== id && t.to !== id);
    const initialStateId = fsm.initialStateId === id ? states[0].id : fsm.initialStateId;
    update({ states, transitions, initialStateId });
    if (selectedStateId === id) setSelectedStateId(states[0].id);
  };

  const updateState = (id: string, patch: Partial<AnimState>) => {
    update({ states: fsm.states.map(s => s.id === id ? { ...s, ...patch } : s) });
  };

  const addTransition = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    if (fsm.transitions.some(t => t.from === fromId && t.to === toId)) return;
    const t: AnimTransition = { id: newId('tr'), from: fromId, to: toId, condition: '', priority: 0 };
    update({ transitions: [...fsm.transitions, t] });
    setSelectedTransitionId(t.id);
  };

  const deleteTransition = (id: string) => {
    update({ transitions: fsm.transitions.filter(t => t.id !== id) });
    if (selectedTransitionId === id) setSelectedTransitionId(null);
  };

  const updateTransition = (id: string, patch: Partial<AnimTransition>) => {
    update({ transitions: fsm.transitions.map(t => t.id === id ? { ...t, ...patch } : t) });
  };

  const addSequence = () => {
    const seq: AnimSequence = { id: newId('seq'), name: `Sequence ${fsm.sequences.length + 1}`, spriteId: sprites[0]?.id || '', fps: 12, loop: true, notifies: [] };
    update({ sequences: [...fsm.sequences, seq] });
    setSelectedSequenceId(seq.id);
  };

  const updateSequence = (id: string, patch: Partial<AnimSequence>) => {
    update({ sequences: fsm.sequences.map(s => s.id === id ? { ...s, ...patch } : s) });
  };

  const deleteSequence = (id: string) => {
    update({
      sequences: fsm.sequences.filter(s => s.id !== id),
      states: fsm.states.map(st => st.sequenceId === id ? { ...st, sequenceId: null } : st),
    });
    if (selectedSequenceId === id) setSelectedSequenceId(fsm.sequences[0]?.id || null);
  };

  const onMouseDownState = (e: React.MouseEvent, st: AnimState) => {
    e.stopPropagation();
    if (linking) {
      addTransition(linking.fromId, st.id);
      setLinking(null);
      return;
    }
    setSelectedStateId(st.id);
    setSelectedTransitionId(null);
    const rect = graphRef.current?.getBoundingClientRect();
    if (rect) setDraggingState({ id: st.id, offX: e.clientX - rect.left - st.x, offY: e.clientY - rect.top - st.y });
  };

  useEffect(() => {
    if (!draggingState) return;
    const onMove = (ev: MouseEvent) => {
      const rect = graphRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, ev.clientX - rect.left - draggingState.offX);
      const y = Math.max(0, ev.clientY - rect.top - draggingState.offY);
      updateState(draggingState.id, { x, y });
    };
    const onUp = () => setDraggingState(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [draggingState]);

  // Performance optimization: Pre-build O(1) Map indices for states, sequences, and sprites
  // to avoid O(N) linear array searches (.find) during high-frequency graph renders (e.g. state dragging at 60fps)
  const stateMap = useMemo(() => {
    const map = new Map<string, AnimState>();
    for (const s of fsm.states) map.set(s.id, s);
    return map;
  }, [fsm.states]);

  const sequenceMap = useMemo(() => {
    const map = new Map<string, AnimSequence>();
    for (const seq of fsm.sequences) map.set(seq.id, seq);
    return map;
  }, [fsm.sequences]);

  const spriteMap = useMemo(() => {
    const map = new Map<string, SpriteAsset>();
    for (const sp of sprites) map.set(sp.id, sp);
    return map;
  }, [sprites]);

  // Preview animation playback with O(1) lookups
  const selectedSeq = useMemo(() => selectedSequenceId ? sequenceMap.get(selectedSequenceId) || null : null, [sequenceMap, selectedSequenceId]);
  const selectedSeqSprite = useMemo(() => selectedSeq?.spriteId ? spriteMap.get(selectedSeq.spriteId) || null : null, [selectedSeq, spriteMap]);

  useEffect(() => {
    if (!previewPlaying || !selectedSeq || !selectedSeqSprite || !(selectedSeqSprite.frames?.length)) return;
    const interval = setInterval(() => {
      setPreviewFrame(f => {
        const next = f + 1;
        if (next >= (selectedSeqSprite.frames?.length || 1)) return selectedSeq.loop ? 0 : f;
        return next;
      });
    }, 1000 / Math.max(1, selectedSeq.fps));
    return () => clearInterval(interval);
  }, [previewPlaying, selectedSeq, selectedSeqSprite]);

  const selectedState = selectedStateId ? stateMap.get(selectedStateId) || null : null;
  const selectedTransition = fsm.transitions.find(t => t.id === selectedTransitionId) || null;

  // ---------- render helpers ----------
  const STATE_W = 110, STATE_H = 44;

  const renderTransitionPath = (t: AnimTransition) => {
    const a = stateMap.get(t.from);
    const b = stateMap.get(t.to);
    if (!a || !b) return null;
    const ax = a.x + STATE_W / 2, ay = a.y + STATE_H / 2;
    const bx = b.x + STATE_W / 2, by = b.y + STATE_H / 2;
    const dx = bx - ax, dy = by - ay;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / len, ny = dy / len;
    const sx = ax + nx * (STATE_W / 2 + 4);
    const sy = ay + ny * (STATE_H / 2 + 4);
    const ex = bx - nx * (STATE_W / 2 + 8);
    const ey = by - ny * (STATE_H / 2 + 8);
    const isSel = selectedTransitionId === t.id;
    const stroke = isSel ? '#dc2626' : '#1e40af';
    return (
      <g key={t.id} onClick={(e) => { e.stopPropagation(); setSelectedTransitionId(t.id); setSelectedStateId(null); }} style={{ cursor: 'pointer' }}>
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={stroke} strokeWidth={isSel ? 3 : 2} markerEnd="url(#arrow)" />
        {t.condition && (
          <text x={(sx + ex) / 2} y={(sy + ey) / 2 - 4} fontSize={10} fill="#1e40af" textAnchor="middle"
            stroke="white" strokeWidth={3} paintOrder="stroke">{t.condition}</text>
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full bg-win-face text-win-text text-xs">
      {/* Tabs */}
      <div className="flex border-b border-gray-400 bg-gray-200 shrink-0">
        {([
          { k: 'graph', l: 'State Graph', icon: <Layers size={11} /> },
          { k: 'sequences', l: 'Sequences', icon: <Play size={11} /> },
          { k: 'variables', l: 'Variables', icon: <Variable size={11} /> },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-3 py-1 text-[10px] font-bold flex items-center gap-1 border-r border-gray-400 ${tab === t.k ? 'bg-win-face text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t.icon}{t.l}
          </button>
        ))}
        <div className="ml-auto flex items-center px-2 text-[10px] text-gray-600">
          <Zap size={11} className="mr-1 text-yellow-600" /> PaperZD-style FSM
        </div>
      </div>

      {tab === 'graph' && (
        <div className="flex-1 flex min-h-0">
          {/* States list */}
          <div className="w-40 border-r border-gray-400 bg-gray-100 flex flex-col shrink-0">
            <div className="px-2 py-1 bg-gray-300 font-bold text-[10px] flex items-center justify-between">
              <span>States ({fsm.states.length})</span>
              <button onClick={addState} className="hover:bg-blue-500 hover:text-white p-0.5 rounded" title="Add State"><Plus size={11} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {fsm.states.map(s => (
                <div key={s.id}
                  onClick={() => { setSelectedStateId(s.id); setSelectedTransitionId(null); }}
                  className={`px-2 py-1 cursor-pointer flex items-center gap-1 border-b border-gray-300 ${selectedStateId === s.id ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'}`}>
                  {s.id === fsm.initialStateId && <span title="Initial State" className="text-yellow-300 font-bold">★</span>}
                  <span className="truncate flex-1">{s.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteState(s.id); }}
                    className="hover:bg-red-500 hover:text-white p-0.5 rounded opacity-60 hover:opacity-100"><Trash2 size={9} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Graph canvas */}
          <div ref={graphRef} className="flex-1 relative overflow-auto bg-gray-50"
            style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            onClick={() => { setSelectedTransitionId(null); setLinking(null); }}>
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', minWidth: 1000, minHeight: 800 }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e40af" />
                </marker>
              </defs>
              <g style={{ pointerEvents: 'auto' }}>
                {fsm.transitions.map(renderTransitionPath)}
              </g>
            </svg>
            {fsm.states.map(s => {
              const isSel = selectedStateId === s.id;
              const isInitial = s.id === fsm.initialStateId;
              const seq = s.sequenceId ? sequenceMap.get(s.sequenceId) : undefined;
              return (
                <div key={s.id}
                  onMouseDown={(e) => onMouseDownState(e, s)}
                  className={`absolute select-none cursor-grab active:cursor-grabbing border-2 rounded shadow-md ${isSel ? 'border-red-500 bg-yellow-100' : isInitial ? 'border-yellow-600 bg-yellow-50' : 'border-blue-700 bg-white'}`}
                  style={{ left: s.x, top: s.y, width: STATE_W, height: STATE_H, zIndex: isSel ? 10 : 5 }}>
                  <div className={`text-center font-bold text-[11px] px-1 py-0.5 truncate ${isSel ? 'text-red-700' : 'text-blue-900'}`}>
                    {isInitial && '★ '}{s.name}
                  </div>
                  <div className="text-[9px] text-center text-gray-600 truncate px-1">
                    {seq ? `▶ ${seq.name}` : '— no anim —'}
                  </div>
                </div>
              );
            })}
            {linking && (
              <div className="absolute top-2 left-2 bg-yellow-300 border border-yellow-700 px-2 py-1 text-[10px] rounded shadow">
                Click a target state to create transition (or click empty area to cancel)
              </div>
            )}
          </div>

          {/* Right inspector */}
          <div className="w-56 border-l border-gray-400 bg-gray-100 flex flex-col shrink-0 overflow-y-auto">
            {selectedState ? (
              <div className="p-2">
                <div className="font-bold text-[10px] text-blue-900 border-b border-gray-400 pb-1 mb-2 flex items-center gap-1">
                  <SettingsIcon size={11} /> State Properties
                </div>
                <label className="block text-[10px] mb-1">Name</label>
                <input value={selectedState.name} onChange={e => updateState(selectedState.id, { name: e.target.value })}
                  className="w-full border border-gray-400 px-1 py-0.5 text-[11px] mb-2 bg-white" />
                <label className="block text-[10px] mb-1">Animation Sequence</label>
                <select value={selectedState.sequenceId || ''} onChange={e => updateState(selectedState.id, { sequenceId: e.target.value || null })}
                  className="w-full border border-gray-400 px-1 py-0.5 text-[11px] mb-2 bg-white">
                  <option value="">— None —</option>
                  {fsm.sequences.map(sq => <option key={sq.id} value={sq.id}>{sq.name}</option>)}
                </select>
                <button onClick={() => update({ initialStateId: selectedState.id })}
                  disabled={selectedState.id === fsm.initialStateId}
                  className="w-full border border-gray-400 bg-yellow-200 hover:bg-yellow-300 text-[10px] py-1 mb-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  ★ Set as Initial State
                </button>
                <button onClick={() => setLinking({ fromId: selectedState.id })}
                  className="w-full border border-gray-400 bg-blue-200 hover:bg-blue-300 text-[10px] py-1 mb-2 flex items-center justify-center gap-1">
                  <ArrowRight size={11} /> Add Transition From This
                </button>

                <div className="border-t border-gray-400 mt-3 pt-2">
                  <div className="font-bold text-[10px] mb-1 text-blue-900">Outgoing Transitions</div>
                  {fsm.transitions.filter(t => t.from === selectedState.id).map(t => {
                    const dst = stateMap.get(t.to);
                    return (
                      <div key={t.id} onClick={() => setSelectedTransitionId(t.id)}
                        className={`text-[10px] px-1 py-0.5 cursor-pointer rounded mb-0.5 ${selectedTransitionId === t.id ? 'bg-red-200' : 'hover:bg-blue-100'}`}>
                        → {dst?.name} {t.condition && <span className="text-blue-700 italic">[{t.condition}]</span>}
                      </div>
                    );
                  })}
                  {fsm.transitions.filter(t => t.from === selectedState.id).length === 0 && (
                    <div className="text-[10px] text-gray-500 italic">No outgoing transitions</div>
                  )}
                </div>
              </div>
            ) : selectedTransition ? (
              <div className="p-2">
                <div className="font-bold text-[10px] text-red-700 border-b border-gray-400 pb-1 mb-2 flex items-center gap-1">
                  <ArrowRight size={11} /> Transition
                </div>
                <div className="text-[10px] mb-2">
                  <b>{stateMap.get(selectedTransition.from)?.name}</b>
                  <span className="mx-1">→</span>
                  <b>{stateMap.get(selectedTransition.to)?.name}</b>
                </div>
                <label className="block text-[10px] mb-1">Condition (JS expr; empty = always)</label>
                <input value={selectedTransition.condition} onChange={e => updateTransition(selectedTransition.id, { condition: e.target.value })}
                  placeholder="vx > 0  /  isGrounded && input.jump"
                  className="w-full border border-gray-400 px-1 py-0.5 text-[11px] mb-2 bg-white font-mono" />
                <label className="block text-[10px] mb-1">Priority (higher checks first)</label>
                <input type="number" value={selectedTransition.priority || 0}
                  onChange={e => updateTransition(selectedTransition.id, { priority: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-400 px-1 py-0.5 text-[11px] mb-2 bg-white" />
                <button onClick={() => deleteTransition(selectedTransition.id)}
                  className="w-full border border-red-500 bg-red-100 hover:bg-red-300 text-red-800 text-[10px] py-1 flex items-center justify-center gap-1">
                  <Trash2 size={11} /> Delete Transition
                </button>
              </div>
            ) : (
              <div className="p-3 text-[10px] text-gray-500 italic">Select a state or transition to edit. Drag states to reposition. Use the "Add Transition From This" button on a selected state to link to another.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'sequences' && (
        <div className="flex-1 flex min-h-0">
          {/* Seq list */}
          <div className="w-40 border-r border-gray-400 bg-gray-100 flex flex-col shrink-0">
            <div className="px-2 py-1 bg-gray-300 font-bold text-[10px] flex items-center justify-between">
              <span>Sequences ({fsm.sequences.length})</span>
              <button onClick={addSequence} className="hover:bg-blue-500 hover:text-white p-0.5 rounded" title="Add Sequence"><Plus size={11} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {fsm.sequences.map(sq => (
                <div key={sq.id} onClick={() => { setSelectedSequenceId(sq.id); setPreviewFrame(0); }}
                  className={`px-2 py-1 cursor-pointer flex items-center gap-1 border-b border-gray-300 ${selectedSequenceId === sq.id ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'}`}>
                  <Play size={9} className={selectedSequenceId === sq.id ? 'text-white' : 'text-blue-700'} />
                  <span className="truncate flex-1">{sq.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteSequence(sq.id); }}
                    className="hover:bg-red-500 hover:text-white p-0.5 rounded opacity-60 hover:opacity-100"><Trash2 size={9} /></button>
                </div>
              ))}
              {fsm.sequences.length === 0 && (
                <div className="p-2 text-[10px] text-gray-500 italic">No sequences. Click + to create.</div>
              )}
            </div>
          </div>

          {/* Sequence editor */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {selectedSeq ? (
              <div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-[10px] mb-1 font-bold">Name</label>
                    <input value={selectedSeq.name} onChange={e => updateSequence(selectedSeq.id, { name: e.target.value })}
                      className="w-full border border-gray-400 px-1 py-0.5 text-[11px] bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] mb-1 font-bold">Sprite (frames source)</label>
                    <select value={selectedSeq.spriteId} onChange={e => updateSequence(selectedSeq.id, { spriteId: e.target.value })}
                      className="w-full border border-gray-400 px-1 py-0.5 text-[11px] bg-white">
                      <option value="">— None —</option>
                      {sprites.map(sp => <option key={sp.id} value={sp.id}>{sp.name} ({(sp.frames||[]).length}f)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] mb-1 font-bold">FPS</label>
                    <input type="number" min={1} max={60} value={selectedSeq.fps}
                      onChange={e => updateSequence(selectedSeq.id, { fps: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full border border-gray-400 px-1 py-0.5 text-[11px] bg-white" />
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-1 text-[10px]">
                      <input type="checkbox" checked={selectedSeq.loop} onChange={e => updateSequence(selectedSeq.id, { loop: e.target.checked })} />
                      <Repeat size={11} /> Loop
                    </label>
                    <label className="flex items-center gap-1 text-[10px]">
                      <input type="checkbox" checked={!!selectedSeq.pingPong} onChange={e => updateSequence(selectedSeq.id, { pingPong: e.target.checked })} />
                      Ping-Pong
                    </label>
                  </div>
                </div>

                {/* Preview */}
                <div className="border border-gray-400 bg-black mb-3 flex items-center justify-center" style={{ height: 120 }}>
                  {selectedSeqSprite && (selectedSeqSprite.frames||[])[previewFrame] ? (
                    <img src={(selectedSeqSprite.frames||[])[previewFrame]} alt="frame" style={{ maxHeight: 110, imageRendering: 'pixelated' }} />
                  ) : (
                    <div className="text-gray-500 text-[10px]">No sprite frames</div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setPreviewPlaying(p => !p)}
                    className="border border-gray-400 bg-gray-200 hover:bg-gray-300 px-2 py-1 text-[10px] flex items-center gap-1">
                    {previewPlaying ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Play</>}
                  </button>
                  <input type="range" min={0} max={Math.max(0, ((selectedSeqSprite?.frames||[]).length || 1) - 1)} value={previewFrame}
                    onChange={e => { setPreviewFrame(parseInt(e.target.value)); setPreviewPlaying(false); }}
                    className="flex-1" />
                  <span className="text-[10px] font-mono">
                    Frame {previewFrame + 1}/{(selectedSeqSprite?.frames||[]).length || 0}
                  </span>
                </div>

                {/* Notify timeline */}
                <div className="border-t border-gray-400 pt-2">
                  <div className="font-bold text-[10px] mb-1 text-blue-900 flex items-center gap-1">
                    <Zap size={11} className="text-yellow-600" /> Animation Notifies ({selectedSeq.notifies.length})
                    <button onClick={() => updateSequence(selectedSeq.id, {
                      notifies: [...selectedSeq.notifies, { id: newId('nt'), frame: previewFrame, kind: 'PlaySound', payload: '' }]
                    })}
                      className="ml-auto border border-gray-400 bg-blue-200 hover:bg-blue-300 px-1 py-0.5 text-[10px] flex items-center gap-1">
                      <Plus size={10} /> Add at frame {previewFrame + 1}
                    </button>
                  </div>
                  {/* Visual timeline */}
                  {selectedSeqSprite && (selectedSeqSprite.frames||[]).length > 0 && (
                    <div className="relative h-7 bg-gray-300 border border-gray-500 mb-2 rounded">
                      {selectedSeq.notifies.map(n => {
                        const pct = (n.frame / Math.max(1, (selectedSeqSprite.frames||[]).length - 1)) * 100;
                        return (
                          <div key={n.id} title={`${n.kind}@${n.frame}`}
                            className="absolute top-0 bottom-0 w-1 bg-yellow-500 cursor-pointer hover:bg-yellow-600"
                            style={{ left: `${pct}%` }} />
                        );
                      })}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-red-500" style={{ left: `${(previewFrame / Math.max(1, (selectedSeqSprite.frames||[]).length - 1)) * 100}%` }} />
                    </div>
                  )}
                  {selectedSeq.notifies.map(n => (
                    <div key={n.id} className="grid grid-cols-12 gap-1 mb-1 items-center">
                      <input type="number" min={0} max={((selectedSeqSprite?.frames||[]).length || 1) - 1} value={n.frame}
                        onChange={e => updateSequence(selectedSeq.id, { notifies: selectedSeq.notifies.map(x => x.id === n.id ? { ...x, frame: parseInt(e.target.value) || 0 } : x) })}
                        className="col-span-2 border border-gray-400 px-1 py-0.5 text-[10px] bg-white" />
                      <select value={n.kind} onChange={e => updateSequence(selectedSeq.id, { notifies: selectedSeq.notifies.map(x => x.id === n.id ? { ...x, kind: e.target.value as AnimNotifyKind } : x) })}
                        className="col-span-3 border border-gray-400 px-1 py-0.5 text-[10px] bg-white">
                        {NOTIFY_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                      <input value={n.payload || ''} onChange={e => updateSequence(selectedSeq.id, { notifies: selectedSeq.notifies.map(x => x.id === n.id ? { ...x, payload: e.target.value } : x) })}
                        placeholder="payload (sound name, fx, dmg…)"
                        className="col-span-6 border border-gray-400 px-1 py-0.5 text-[10px] bg-white" />
                      <button onClick={() => updateSequence(selectedSeq.id, { notifies: selectedSeq.notifies.filter(x => x.id !== n.id) })}
                        className="col-span-1 hover:bg-red-500 hover:text-white p-0.5 rounded text-red-600"><Trash2 size={10} /></button>
                    </div>
                  ))}
                  {selectedSeq.notifies.length === 0 && (
                    <div className="text-[10px] text-gray-500 italic">No notifies. Click + to add at current frame.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-gray-500 italic">Select or create a sequence</div>
            )}
          </div>
        </div>
      )}

      {tab === 'variables' && (
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          <div className="flex items-center mb-2">
            <div className="font-bold text-[11px] text-blue-900 flex items-center gap-1">
              <Variable size={11} /> Runtime Variables ({fsm.variables.length})
            </div>
            <button onClick={() => update({ variables: [...fsm.variables, { name: `var${fsm.variables.length + 1}`, value: 0 }] })}
              className="ml-auto border border-gray-400 bg-blue-200 hover:bg-blue-300 px-2 py-1 text-[10px] flex items-center gap-1">
              <Plus size={10} /> Add Variable
            </button>
          </div>
          <div className="text-[10px] text-gray-600 mb-2 italic">Variables are exposed to transition conditions (e.g. <code>vx &gt; 0</code>). Set initial values here. Game logic / blueprints update them at runtime.</div>
          {fsm.variables.map((v, i) => (
            <div key={i} className="grid grid-cols-12 gap-1 mb-1 items-center">
              <input value={v.name} onChange={e => update({ variables: fsm.variables.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })}
                className="col-span-4 border border-gray-400 px-1 py-0.5 text-[11px] bg-white font-mono" />
              <input value={String(v.value)} onChange={e => {
                const raw = e.target.value;
                let val: any = raw;
                if (raw === 'true') val = true;
                else if (raw === 'false') val = false;
                else if (raw !== '' && !isNaN(Number(raw))) val = Number(raw);
                update({ variables: fsm.variables.map((x, j) => j === i ? { ...x, value: val } : x) });
              }}
                className="col-span-7 border border-gray-400 px-1 py-0.5 text-[11px] bg-white font-mono" />
              <button onClick={() => update({ variables: fsm.variables.filter((_, j) => j !== i) })}
                className="col-span-1 hover:bg-red-500 hover:text-white p-0.5 rounded text-red-600"><Trash2 size={10} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimStateMachineEditor;
