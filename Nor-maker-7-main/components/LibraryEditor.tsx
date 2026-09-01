
import * as React from 'react';
import { useState, useRef, useMemo } from 'react';
import {
  ArrowRight, ArrowUp, ArrowDown, Heart, Coins, Play, Trophy,
  X, Plus, ChevronRight, Gamepad2, Skull, Image as ImageIcon, Edit2,
  Grid, Move, Download, Upload, Copy, Settings, Layers, Square, Type,
  Layout, Clock, Trash2, Zap, AlertTriangle, MessageSquare, MousePointer,
  Lightbulb, Globe, MousePointer2, ArrowDownToLine, ArrowUpFromLine, Keyboard,
  Ghost, MapPin, PlayCircle, StopCircle, LogIn, LogOut, Activity, Footprints, Target
} from 'lucide-react';
import { ACTION_LIBRARY, ActionDefinition } from '../utils/actionLibrary';
import { EXTERNAL_ACTIONS } from '../utils/externalActions';
import { GameAction, GameObject, EventType, SpriteAsset, FontAsset, AnimationStateMachine } from '../types';
import * as geminiService from '../services/geminiService';
import AnimStateMachineEditor from './AnimStateMachineEditor';

const ALL_ACTIONS: ActionDefinition[] = [...ACTION_LIBRARY, ...EXTERNAL_ACTIONS];

import RetroButton from './RetroButton';

interface LibraryEditorProps {
  objectData: GameObject;
  onUpdate: (newData: GameObject) => void;
  sprites: SpriteAsset[];
  fonts?: FontAsset[];
  gameObjects?: GameObject[];
}

const RepeatIcon = ({size}:{size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
);

const EVENTS: { id: string; label: string; icon: any; subEvents?: { id: string; label: string }[] }[] = [
  { id: 'create', label: 'Create', icon: <Lightbulb size={14} className="text-yellow-500"/> },
  { id: 'mouse', label: 'Mouse', icon: <MousePointer2 size={14} className="text-gray-700"/>, subEvents: [
      { id: 'mouse_left', label: 'Left Button' }, { id: 'mouse_right', label: 'Right Button' }, { id: 'mouse_middle', label: 'Middle Button' }, { id: 'mouse_none', label: 'No Button' },
      { id: 'mouse_left_pressed', label: 'Left Pressed' }, { id: 'mouse_right_pressed', label: 'Right Pressed' }, { id: 'mouse_middle_pressed', label: 'Middle Pressed' },
      { id: 'mouse_left_released', label: 'Left Released' }, { id: 'mouse_right_released', label: 'Right Released' }, { id: 'mouse_middle_released', label: 'Middle Released' },
      { id: 'mouse_enter', label: 'Mouse Enter' }, { id: 'mouse_leave', label: 'Mouse Leave' },
      { id: 'mouse_global_left', label: 'Global Left' }, { id: 'mouse_global_right', label: 'Global Right' }, { id: 'mouse_global_middle', label: 'Global Middle' }
  ]},
  { id: 'destroy', label: 'Destroy', icon: <Trash2 size={14} className="text-green-600"/> },
  { id: 'other', label: 'Other', icon: <Settings size={14} className="text-green-700"/>, subEvents: [
      { id: 'other_outside', label: 'Outside Room' }, { id: 'other_boundary', label: 'Intersect Boundary' },
      { id: 'other_game_start', label: 'Game Start' }, { id: 'other_game_end', label: 'Game End' },
      { id: 'other_room_start', label: 'Room Start' }, { id: 'other_room_end', label: 'Room End' },
      { id: 'other_no_lives', label: 'No More Lives' }, { id: 'other_no_health', label: 'No More Health' },
      { id: 'other_animation_end', label: 'Animation End' }, { id: 'other_path_end', label: 'End of Path' },
      ...Array.from({length: 16}).map((_, i) => ({ id: `other_user_${i}`, label: `User Event ${i}` }))
  ]},
  { id: 'alarm', label: 'Alarm', icon: <Clock size={14} className="text-blue-600"/>, subEvents: Array.from({length: 12}).map((_, i) => ({ id: `alarm_${i}`, label: `Alarm ${i}` })) },
  { id: 'draw', label: 'Draw', icon: <ImageIcon size={14} className="text-orange-500"/>, subEvents: [
      { id: 'draw', label: 'Draw' }, { id: 'draw_gui', label: 'Draw GUI' },
      { id: 'draw_begin', label: 'Draw Begin' }, { id: 'draw_end', label: 'Draw End' },
      { id: 'draw_pre', label: 'Pre Draw' }, { id: 'draw_post', label: 'Post Draw' }
  ]},
  { id: 'step', label: 'Step', icon: <Footprints size={14} className="text-blue-500"/>, subEvents: [
      { id: 'step', label: 'Step' },
      { id: 'step_begin', label: 'Begin Step' },
      { id: 'step_end', label: 'End Step' }
  ]},
  { id: 'keypress', label: 'Key Press', icon: <ArrowDownToLine size={14} className="text-red-600"/>, subEvents: [
      { id: 'keypress_any', label: 'Any Key' },
      { id: 'keypress_ArrowLeft', label: 'Left Arrow' }, { id: 'keypress_ArrowRight', label: 'Right Arrow' },
      { id: 'keypress_ArrowUp', label: 'Up Arrow' }, { id: 'keypress_ArrowDown', label: 'Down Arrow' },
      { id: 'keypress_Space', label: 'Space' }, { id: 'keypress_Enter', label: 'Enter' },
      ...Array.from({length: 26}).map((_, i) => ({ id: `keypress_Key${String.fromCharCode(65 + i)}`, label: `${String.fromCharCode(65 + i)} Key` })),
      ...Array.from({length: 10}).map((_, i) => ({ id: `keypress_Digit${i}`, label: `${i} Key` }))
  ]},
  { id: 'collision', label: 'Collision', icon: <Zap size={14} className="text-red-500"/> },
  { id: 'keyrelease', label: 'Key Release', icon: <ArrowUpFromLine size={14} className="text-green-600"/>, subEvents: [
      { id: 'keyrelease_any', label: 'Any Key' },
      { id: 'keyrelease_ArrowLeft', label: 'Left Arrow' }, { id: 'keyrelease_ArrowRight', label: 'Right Arrow' },
      { id: 'keyrelease_ArrowUp', label: 'Up Arrow' }, { id: 'keyrelease_ArrowDown', label: 'Down Arrow' },
      { id: 'keyrelease_Space', label: 'Space' }, { id: 'keyrelease_Enter', label: 'Enter' },
      ...Array.from({length: 26}).map((_, i) => ({ id: `keyrelease_Key${String.fromCharCode(65 + i)}`, label: `${String.fromCharCode(65 + i)} Key` }))
  ]},
  { id: 'keyboard', label: 'Keyboard', icon: <Keyboard size={14} className="text-blue-700"/>, subEvents: [
      { id: 'keyboard_any', label: 'Any Key' },
      { id: 'keyboard_ArrowLeft', label: 'Left Arrow' }, { id: 'keyboard_ArrowRight', label: 'Right Arrow' },
      { id: 'keyboard_ArrowUp', label: 'Up Arrow' }, { id: 'keyboard_ArrowDown', label: 'Down Arrow' },
      { id: 'keyboard_Space', label: 'Space' }, { id: 'keyboard_Enter', label: 'Enter' },
      { id: 'keyboard_Control', label: 'Control' }, { id: 'keyboard_Alt', label: 'Alt' }, { id: 'keyboard_Shift', label: 'Shift' }, { id: 'keyboard_Escape', label: 'Escape' },
      ...Array.from({length: 26}).map((_, i) => ({ id: `keyboard_Key${String.fromCharCode(65 + i)}`, label: `${String.fromCharCode(65 + i)} Key` })),
      ...Array.from({length: 10}).map((_, i) => ({ id: `keyboard_Digit${i}`, label: `${i} Key` })),
      ...Array.from({length: 12}).map((_, i) => ({ id: `keyboard_F${i+1}`, label: `F${i+1} Key` }))
  ]},
  { id: 'trigger', label: 'Trigger', icon: <Target size={14} className="text-purple-600"/>, subEvents: [
      ...Array.from({length: 16}).map((_, i) => ({ id: `trigger_${i}`, label: `Trigger ${i}` }))
  ]},
];

const LibraryEditor: React.FC<LibraryEditorProps> = ({ objectData, onUpdate, sprites, fonts = [], gameObjects = [] }) => {
  const [selectedEvent, setSelectedEvent] = useState<EventType>('create');
  const [showSubMenu, setShowSubMenu] = useState<{ eventId: string; subEvents: { id: string; label: string }[] } | null>(null);
  const [isAddEventMenuOpen, setIsAddEventMenuOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('move');
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [editorView, setEditorView] = useState<'events' | 'fsm'>('events');
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pre-built O(1) Map lookup for ALL_ACTIONS to avoid linear array search per render
  const actionMap = useMemo(() => {
    return new Map<string, ActionDefinition>(ALL_ACTIONS.map(a => [a.id, a]));
  }, []);

  // Group ALL_ACTIONS by category once to perform O(1) tab list lookups during render
  const actionsByCategory = useMemo(() => {
    const map = new Map<string, ActionDefinition[]>();
    for (const action of ALL_ACTIONS) {
      const list = map.get(action.category);
      if (list) {
        list.push(action);
      } else {
        map.set(action.category, [action]);
      }
    }
    return map;
  }, []);

  // Memoize parent object options to avoid array allocations on every render pass
  const parentGameObjects = useMemo(() => {
    return gameObjects.filter(o => o.id !== objectData.id);
  }, [gameObjects, objectData.id]);

  // Pre-build O(1) Map index for sprite assets to replace linear Array.prototype.find on render
  const spriteMap = useMemo(() => new Map(sprites.map(s => [s.id, s])), [sprites]);

  // Dynamic Events List
  const dynamicEvents = useMemo(() => {
      return EVENTS.map(ev => {
          if (ev.id === 'collision') {
              return {
                  ...ev,
                  subEvents: gameObjects.map(obj => ({ id: `collision_${obj.id}`, label: `with ${obj.name}` }))
              };
          }
          return ev;
      });
  }, [gameObjects]);

  // Index dynamic events for O(1) label and icon lookups
  const eventMap = useMemo(() => {
      const map = new Map<string, { label: string; icon: React.ReactNode }>();
      dynamicEvents.forEach(ev => {
          map.set(ev.id, { label: ev.label, icon: ev.icon });
          if (ev.subEvents) {
              ev.subEvents.forEach(sub => {
                  map.set(sub.id, { label: sub.label, icon: ev.icon });
              });
          }
      });
      return map;
  }, [dynamicEvents]);

  const addAction = (libDef: ActionDefinition) => {
    const newAction: GameAction = {
      id: Math.random().toString(36).substr(2, 9),
      libId: libDef.id,
      params: libDef.params.reduce((acc, p) => ({ ...acc, [p.key]: p.default }), {})
    };

    const currentActions = objectData.events[selectedEvent] || [];
    onUpdate({
      ...objectData,
      events: {
        ...objectData.events,
        [selectedEvent]: [...currentActions, newAction]
      }
    });
  };

  const removeAction = (index: number) => {
    const currentActions = objectData.events[selectedEvent] || [];
    const newActions = [...currentActions];
    newActions.splice(index, 1);
    onUpdate({
      ...objectData,
      events: {
        ...objectData.events,
        [selectedEvent]: newActions
      }
    });
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    const currentActions = objectData.events[selectedEvent] || [];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentActions.length - 1) return;

    const newActions = [...currentActions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];

    onUpdate({
      ...objectData,
      events: {
        ...objectData.events,
        [selectedEvent]: newActions
      }
    });
  };

  const updateActionParam = (actionIndex: number, key: string, value: any) => {
    const currentActions = objectData.events[selectedEvent] || [];
    const newActions = [...currentActions];
    newActions[actionIndex] = {
      ...newActions[actionIndex],
      params: { ...newActions[actionIndex].params, [key]: value }
    };
    onUpdate({
      ...objectData,
      events: {
        ...objectData.events,
        [selectedEvent]: newActions
      }
    });
  };

  const handleExport = () => {
      const actions = objectData.events[selectedEvent] || [];
      const json = JSON.stringify(actions, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${objectData.name}_${selectedEvent}.json`;
      a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const actions = JSON.parse(ev.target?.result as string);
              if (Array.isArray(actions)) {
                  onUpdate({
                      ...objectData,
                      events: {
                          ...objectData.events,
                          [selectedEvent]: actions
                      }
                  });
              }
          } catch(err) {
              window.alert("Invalid Action File");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const renderLibraryList = () => {
    const actions = actionsByCategory.get(selectedTab) || [];
    return actions.map(def => (
      <div
        key={def.id}
        className="group flex flex-col items-center justify-center p-1 bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] cursor-grab hover:bg-[#C0C0C0] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
        draggable
        onDragStart={(e) => e.dataTransfer.setData('actionDefId', def.id)}
        onClick={() => addAction(def)}
        title={def.description}
        style={{ width: '40px', height: '40px' }}
      >
         {/* Dynamic Icons */}
         <div className="text-gray-800">
           {def.iconUrl ? (
             <img src={def.iconUrl || undefined} className="w-5 h-5 image-render-pixel" alt={def.name}/>
           ) : (
             <>
               {def.iconName === 'ArrowRight' && <ArrowRight size={20}/>}
               {def.iconName === 'ArrowUp' && <ArrowUp size={20}/>}
               {def.iconName === 'ArrowDown' && <ArrowDown size={20}/>}
               {def.iconName === 'Heart' && <Heart size={20}/>}
               {def.iconName === 'Coins' && <Coins size={20}/>}
               {def.iconName === 'Trophy' && <Trophy size={20}/>}
               {def.iconName === 'RotateCcw' && <Play size={20} className="rotate-180"/>}
               {def.iconName === 'XCircle' && <X size={20}/>}
               {def.iconName === 'ArrowRightCircle' && <ChevronRight size={20}/>}
               {def.iconName === 'Gamepad2' && <Gamepad2 size={20}/>}
               {def.iconName === 'Move' && <Move size={20}/>}
               {def.iconName === 'Grid' && <Grid size={20}/>}
               {def.iconName === 'Plus' && <Plus size={20}/>}
               {def.iconName === 'Image' && <ImageIcon size={20}/>}
               {def.iconName === 'RefreshCw' && <Play size={20} className="rotate-180"/>}
               {def.iconName === 'Volume2' && <div className="font-bold text-[10px]">SND</div>}
               {def.iconName === 'HelpCircle' && <Settings size={20}/>}
               {def.iconName === 'Clock' && <div className="font-bold text-[10px]">ALM</div>}
               {def.iconName === 'Layers' && <Layers size={20}/>}
               {def.iconName === 'Square' && <Square size={20}/>}
               {def.iconName === 'Type' && <Type size={20}/>}
               {def.iconName === 'Terminal' && <div className="font-bold text-[10px]">JS</div>}
               {def.iconName === 'Layout' && <Layout size={20}/>}
               {def.iconName === 'Anchor' && <Move size={20} className="rotate-45"/>}
               {def.iconName === 'Repeat' && <RepeatIcon size={20}/>}
               {def.iconName === 'ToggleLeft' && <Settings size={20} className="opacity-50"/>}
               {def.iconName === 'Trash2' && <Trash2 size={20}/>}
               {def.iconName === 'Zap' && <Zap size={20}/>}
               {def.iconName === 'AlertTriangle' && <AlertTriangle size={20}/>}
               {def.iconName === 'MessageSquare' && <MessageSquare size={20}/>}
               {def.iconName === 'MousePointer' && <MousePointer size={20}/>}
             </>
           )}
         </div>
      </div>
    ));
  };

  const TabBtn = ({ id, label, color }: { id: string, label: string, color: string }) => (
      <button
        onClick={() => setSelectedTab(id)}
        className={`flex-1 py-1 text-[9px] md:text-[10px] font-bold border-b-2 transition-colors truncate px-1 ${selectedTab === id ? `bg-win-face border-${color}-500 text-black` : 'text-gray-500 border-transparent hover:bg-gray-200'}`}
      >
          {label}
      </button>
  );

  const categories = useMemo(() => Array.from(new Set(ALL_ACTIONS.map(a => a.category))), []);
  const tabColors = ['orange', 'blue', 'blue', 'purple', 'green', 'red', 'yellow', 'cyan', 'indigo', 'rose', 'teal', 'amber'];

  return (
    <div dir="ltr" className="flex flex-col w-full h-full min-h-[500px] bg-[#ECE9D8] font-ui select-none overflow-hidden text-xs text-black border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080]">
      {/* View toggle: Classic Events vs PaperZD-style Animation State Machine */}
      <div className="flex items-center bg-[#D4D0C8] border-b border-[#808080] px-1 py-0.5 gap-0.5 shrink-0">
        <button onClick={() => setEditorView('events')}
          className={`px-2 py-0.5 text-[10px] font-bold border ${editorView === 'events' ? 'bg-white border-t-[#808080] border-l-[#808080] border-r-white border-b-white text-blue-800' : 'bg-[#D4D0C8] border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-gray-300'}`}>
          Events (Classic)
        </button>
        <button onClick={() => setEditorView('fsm')}
          className={`px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${editorView === 'fsm' ? 'bg-white border-t-[#808080] border-l-[#808080] border-r-white border-b-white text-blue-800' : 'bg-[#D4D0C8] border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-gray-300'}`}>
          <Activity size={10} /> Anim State Machine
          {objectData.stateMachine && <span className="text-[8px] bg-green-500 text-white px-1 rounded">●</span>}
        </button>
        <span className="ml-auto text-[10px] text-gray-600 px-2">Object: <b>{objectData.name}</b></span>
      </div>

      {editorView === 'fsm' ? (
        <div className="flex-1 min-h-0">
          <AnimStateMachineEditor
            fsm={objectData.stateMachine}
            sprites={sprites}
            onUpdate={(fsm: AnimationStateMachine) => onUpdate({ ...objectData, stateMachine: fsm })}
          />
        </div>
      ) : (
      <div className="flex flex-row w-full h-full min-h-0">
      {/* 1. LEFT PANEL: PROPERTIES */}
      <div className="flex flex-col w-[180px] p-2 gap-2 border-r border-[#808080] shrink-0 overflow-y-auto shadow-win-in">
        <div className="flex items-center gap-1">
          <span className="text-[10px] w-12 text-right font-bold">Name:</span>
          <input
              type="text"
              value={objectData.name}
              onChange={(e) => onUpdate({...objectData, name: e.target.value})}
              className="flex-1 text-[11px] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-0.5 bg-white shadow-win-in"
          />
        </div>

        <fieldset className="border border-[#BFBFBF] p-1 pb-2 mt-1 mx-1">
          <legend className="text-[10px] ml-1 px-1 -mt-2 bg-[#ECE9D8]">Sprite</legend>
          <div className="flex flex-col gap-1 items-center -mt-1">
             <div className="w-20 h-20 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white flex flex-col items-center justify-center p-1 relative shadow-win-in">
                {objectData.spriteId ? (
                   <img src={spriteMap.get(objectData.spriteId)?.src || undefined} className="max-w-full max-h-full image-render-pixel" />
                ) : (
                   <span className="text-[9px] text-gray-500">&lt;no sprite&gt;</span>
                )}
             </div>
             <div className="flex gap-1 w-full px-2">
               <button className="flex-1 bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] py-0.5 text-[9px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white">New</button>
               <button className="flex-1 bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] py-0.5 text-[9px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white">Edit</button>
             </div>
          </div>
          <div className="mt-2 text-center px-1">
            <select
                value={objectData.spriteId || ''}
                onChange={(e) => onUpdate({...objectData, spriteId: e.target.value || null})}
                className="w-full text-[10px] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-0.5"
            >
                <option value="">&lt;no sprite&gt;</option>
                {sprites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </fieldset>

        <div className="flex items-center gap-4 mt-1 text-[10px] pl-2 font-bold">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={objectData.visible !== false} // DEFAULT to true if undefined
              onChange={(e) => onUpdate({...objectData, visible: e.target.checked})}
            />
            Visible
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={!!objectData.solid}
              onChange={(e) => onUpdate({...objectData, solid: e.target.checked})}
            />
            Solid
          </label>
        </div>

        <div className="flex items-center gap-1 text-[10px] mt-1">
          <span className="w-12 text-right font-bold">Depth:</span>
          <input
              type="number"
              value={objectData.depth ?? 0}
              onChange={(e) => onUpdate({...objectData, depth: parseInt(e.target.value) || 0})}
              className="flex-1 text-[11px] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-0.5 bg-white shadow-win-in"
          />
        </div>

        <div className="flex items-center gap-4 text-[10px] mt-1 pl-2 font-bold">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={!!objectData.persistent}
              onChange={(e) => onUpdate({...objectData, persistent: e.target.checked})}
            />
            Persistent
          </label>
        </div>

        <div className="flex items-center gap-1 text-[10px] mt-2">
          <span className="w-12 text-right font-bold">Parent:</span>
          <select
            value={objectData.parent || ''}
            onChange={(e) => onUpdate({...objectData, parent: e.target.value || null})}
            className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-0.5 text-[10px]"
          >
            <option value="">&lt;no parent&gt;</option>
            {parentGameObjects.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 text-[10px]">
          <span className="w-12 text-right font-bold">Mask:</span>
          <select
             value={objectData.mask || ''}
             onChange={(e) => onUpdate({...objectData, mask: e.target.value || null})}
             className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-0.5 text-[10px]"
          >
            <option value="">&lt;same as sprite&gt;</option>
            {sprites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <button className="mt-4 text-blue-800 bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] w-[130px] mx-auto py-1 text-[10px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white flex items-center justify-center gap-1 hover:bg-[#E0DFD8]">
          <Settings size={12} /> Show Information
        </button>

        <button onClick={() => onUpdate(objectData)} className="mt-auto mb-2 bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] w-[100px] mx-auto py-1 text-[11px] font-bold active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white flex items-center justify-center gap-1 text-black hover:bg-[#E0DFD8]">
          <span className="text-green-600 font-bold text-sm leading-none">✔</span> OK
        </button>
      </div>

      <div className="flex flex-row flex-1 overflow-hidden">
      {/* 1. Event List */}
      <div className={`w-[160px] border-r border-[#808080] flex flex-col bg-[#ECE9D8] shrink-0 h-full relative ${isAddEventMenuOpen || showSubMenu ? 'z-40' : 'z-10'} shadow-win-in`}>
        <div className="p-1 pb-0 text-[10px] text-black">Events:</div>
        <div className="flex-1 bg-white border border-[#404040] shadow-win-in mx-1 mb-1 overflow-y-auto">
          {Object.keys(objectData.events).map(eventId => {
            const evInfo = eventMap.get(eventId);
            const label = evInfo?.label || eventId;
            const icon = evInfo?.icon;

            return (
              <div
                key={eventId}
                className={`flex items-center gap-2 p-1 cursor-pointer text-xs whitespace-nowrap ${selectedEvent === eventId ? 'bg-win-select text-white' : 'hover:bg-gray-100'}`}
                onClick={() => setSelectedEvent(eventId as EventType)}
              >
                {icon}
                <span className="flex-1 truncate">{label}</span>
              </div>
            );
          })}
        </div>

        <div className="p-1 flex gap-1 mb-1">
          <button
            onClick={() => setIsAddEventMenuOpen(true)}
            className="flex-1 py-0.5 bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-[10px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white text-black text-center"
          >
            Add Event
          </button>
          <button
            onClick={() => {
              const newEvents = { ...objectData.events };
              delete newEvents[selectedEvent];
              onUpdate({ ...objectData, events: newEvents });
              const remaining = Object.keys(newEvents);
              if (remaining.length > 0) setSelectedEvent(remaining[0] as EventType);
            }}
            className="flex-1 py-0.5 bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-[10px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white text-black text-center"
          >
            Delete
          </button>
          <button className="flex-1 py-0.5 bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-[10px] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white text-black text-center">
            Change
          </button>
        </div>

        {/* Add Event Menu Overlay */}
        {isAddEventMenuOpen && (
          <div className="absolute inset-0 bg-[#F0F0F0] z-30 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex flex-col shadow-lg">
            <div className="bg-white text-gray-600 px-2 py-1 text-[11px] font-sans flex items-center justify-between shrink-0 border-b border-gray-300">
              <span>Choose the Event to Add</span>
              <button onClick={() => {
                setIsAddEventMenuOpen(false);
                setShowSubMenu(null);
              }} className="hover:bg-red-500 hover:text-white p-0.5 transition-colors"><X size={12}/></button>
            </div>
            <div className="p-3 bg-[#F0F0F0] flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {dynamicEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => {
                      if (ev.subEvents && ev.subEvents.length > 0) {
                        setShowSubMenu({ eventId: ev.id, subEvents: ev.subEvents });
                      } else {
                        const currentEvents = objectData.events || {};
                        if (!currentEvents[ev.id]) {
                          onUpdate({
                            ...objectData,
                            events: { ...currentEvents, [ev.id]: [] }
                          });
                        }
                        setSelectedEvent(ev.id as EventType);
                        setIsAddEventMenuOpen(false);
                      }
                    }}
                    className="flex items-center gap-2 px-2 py-1 border border-[#808080] bg-[#E1E1E1] hover:bg-[#D1D1D1] active:bg-[#C1C1C1] shadow-[inset_1px_1px_0_white] transition-colors"
                  >
                    <div className="shrink-0">{ev.icon}</div>
                    <span className="text-[11px] font-sans text-left leading-tight underline decoration-gray-400 underline-offset-2 decoration-dotted">{ev.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                 <button
                    onClick={() => setIsAddEventMenuOpen(false)}
                    className="flex items-center gap-2 px-6 py-1 border border-[#808080] bg-[#E1E1E1] hover:bg-[#D1D1D1] active:bg-[#C1C1C1] shadow-[inset_1px_1px_0_white] text-[11px] font-sans"
                 >
                    <X size={14} className="text-red-600 font-bold" />
                    <span className="underline decoration-gray-400 underline-offset-2 decoration-dotted">Cancel</span>
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-menu Overlay (for Add Event) */}
        {showSubMenu && (
          <div className="absolute inset-0 bg-[#D4D0C8] z-40 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] flex flex-col shadow-lg">
            <div className="bg-win-blue text-white px-2 py-1 text-[10px] font-bold flex items-center justify-between shrink-0">
              <span className="truncate">{showSubMenu.eventId.toUpperCase()}</span>
              <button onClick={() => setShowSubMenu(null)} className="hover:bg-red-500 p-0.5"><X size={12}/></button>
            </div>
            <div className="p-1 bg-white flex-1 overflow-y-auto space-y-0.5">
              {showSubMenu.subEvents.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => {
                    const currentEvents = objectData.events || {};
                    if (!currentEvents[sub.id]) {
                      onUpdate({
                        ...objectData,
                        events: { ...currentEvents, [sub.id]: [] }
                      });
                    }
                    setSelectedEvent(sub.id as EventType);
                    setShowSubMenu(null);
                    setIsAddEventMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 text-[10px] border border-transparent hover:bg-win-select hover:text-white"
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Action List */}
      <div className="flex-1 flex flex-col bg-[#ECE9D8] min-w-0">
         <div className="p-1 pb-0 flex items-center justify-between text-[10px] text-black">
             <span>Actions:</span>
         </div>

         {/* AI Quick Actions Generator Panel */}
         <div className="mx-1 mb-1 p-1 bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] flex flex-col gap-1.5 shrink-0">
             <div className="flex items-center gap-1">
                 <Lightbulb size={12} className="text-yellow-600 animate-pulse"/>
                 <span className="text-[9px] font-bold text-blue-800">Musaed AI: Generate Ready-made Action Sequences</span>
             </div>
             <div className="flex gap-1">
                 <input
                     type="text"
                     placeholder="e.g. Move left with left arrow and play sound click (English/Arabic)"
                     value={aiPromptInput}
                     onChange={(e) => setAiPromptInput(e.target.value)}
                     className="flex-1 text-[10px] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-1.5 py-0.5 bg-white shadow-win-in outline-none text-black font-sans"
                     onKeyDown={async (e) => {
                         if (e.key === 'Enter') {
                             e.preventDefault();
                             document.getElementById('ai-quick-gen-btn')?.click();
                         }
                     }}
                 />
                 <button
                     id="ai-quick-gen-btn"
                     onClick={async () => {
                         if (!aiPromptInput.trim()) return;
                         try {
                             setIsAiGenerating(true);
                             const assetsContext = `
Sprites: ${sprites.map(s => s.id + ' (' + s.name + ')').join(', ')}
Fonts: ${fonts.map(f => f.id + ' (' + f.name + ')').join(', ')}
Objects: ${gameObjects.map(o => o.id + ' (' + o.name + ')').join(', ')}
                             `.trim();
                             const generatedActions = await geminiService.generateLibraryActionsFromPrompt(aiPromptInput, ALL_ACTIONS, assetsContext);
                             if (Array.isArray(generatedActions) && generatedActions.length > 0) {
                                 const generatedWithIds = generatedActions.map(act => ({
                                     id: Math.random().toString(36).substr(2, 9),
                                     libId: act.libId,
                                     params: act.params
                                 }));
                                 const currentActions = [...(objectData.events[selectedEvent] || [])];
                                 onUpdate({
                                     ...objectData,
                                     events: {
                                         ...objectData.events,
                                         [selectedEvent]: [...currentActions, ...generatedWithIds]
                                     }
                                 });
                                 setAiPromptInput('');
                             } else {
                                 window.alert("AI could not map this request to any library actions. Try a simpler prompt.");
                             }
                         } catch (err) {
                             console.error("AI Action generation failed:", err);
                             window.alert("Failed to generate actions. Please check console.");
                         } finally {
                             setIsAiGenerating(false);
                         }
                     }}
                     disabled={isAiGenerating || !aiPromptInput.trim()}
                     className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-0.5 border-2 border-t-[#80C0FF] border-l-[#80C0FF] border-r-blue-900 border-b-blue-900 text-[10px] active:border-t-blue-900 active:border-l-blue-900 active:border-r-[#80C0FF] active:border-b-[#80C0FF] disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
                 >
                     {isAiGenerating ? 'Generating...' : 'Generate Actions'}
                 </button>
             </div>
         </div>

         <div className="flex-1 bg-white border border-[#404040] mx-1 mb-1 shadow-win-in p-2 overflow-y-auto flex flex-col gap-2 relative">
         {(objectData.events[selectedEvent] || []).length === 0 && (
             <div className="text-gray-400 text-center mt-10 text-xs italic">
                 No actions.<br/>Drag & Drop not supported yet, click to add.
             </div>
         )}

         {(objectData.events[selectedEvent] || []).map((action, idx) => {
             const def = actionMap.get(action.libId);
             if(!def) return null;
             return (
                 <div key={action.id} className="bg-[#D4D0C8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] p-1 flex items-center gap-2 text-xs flex-wrap">
                     <div className="bg-gray-100 p-1 border border-gray-300 shrink-0">
                        {/* Simplified generic icon fallback if exact match not needed */}
                        <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                     </div>
                     <span className="font-bold text-win-blue w-20 md:w-24 truncate">{def.name}</span>

                     <div className="flex-1 flex gap-2 overflow-x-auto min-w-[100px] no-scrollbar">
                        {def.params.map(p => (
                            <div key={p.key} className="flex items-center gap-1 bg-gray-50 px-1 border border-gray-200 rounded shrink-0">
                                <span className="text-gray-500">{p.name}:</span>
                                {p.type === 'select' ? (
                                    <select
                                        className="bg-transparent font-bold outline-none max-w-[80px]"
                                        value={action.params[p.key]}
                                        onChange={(e) => updateActionParam(idx, p.key, e.target.value)}
                                    >
                                        {p.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : p.type === 'boolean' ? (
                                    <input
                                        type="checkbox"
                                        checked={!!action.params[p.key]}
                                        onChange={(e) => updateActionParam(idx, p.key, e.target.checked)}
                                    />
                                ) : p.key === 'spr' ? (
                                    /* Sprite Asset Selector */
                                    <select
                                        className="bg-transparent font-bold outline-none max-w-[80px]"
                                        value={action.params[p.key]}
                                        onChange={(e) => updateActionParam(idx, p.key, e.target.value)}
                                    >
                                        <option value="">(None)</option>
                                        {sprites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                ) : p.key === 'font' ? (
                                    /* Font Asset Selector */
                                    <select
                                        className="bg-transparent font-bold outline-none max-w-[80px]"
                                        value={action.params[p.key]}
                                        onChange={(e) => updateActionParam(idx, p.key, e.target.value)}
                                    >
                                        <option value="">(Default)</option>
                                        {fonts.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                ) : p.key === 'code' ? (
                                    <textarea
                                        className="w-48 h-12 bg-transparent font-mono text-[9px] outline-none border border-gray-300 resize-y"
                                        value={action.params[p.key]}
                                        onChange={(e) => updateActionParam(idx, p.key, e.target.value)}
                                    />
                                ) : (
                                    <input
                                        type={p.type === 'number' ? 'number' : 'text'}
                                        className="w-32 bg-transparent font-bold outline-none"
                                        value={action.params[p.key]}
                                        onChange={(e) => updateActionParam(idx, p.key, p.type==='number' ? parseFloat(e.target.value) : e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                     </div>

                     <div className="flex items-center gap-1 ml-auto">
                         {action.libId === 'ai_prompt' && (
                             <div className="flex gap-1">
                                 <button
                                     onClick={async () => {
                                         try {
                                             setIsGenerating(prev => ({ ...prev, [action.id]: true }));
                                             const assetsContext = `
Sprites: ${sprites.map(s => s.id + ' (' + s.name + ')').join(', ')}
Fonts: ${fonts.map(f => f.id + ' (' + f.name + ')').join(', ')}
Objects: ${gameObjects.map(o => o.id + ' (' + o.name + ')').join(', ')}
                                             `.trim();
                                             const generatedActions = await geminiService.generateLibraryActionsFromPrompt(action.params.prompt, ALL_ACTIONS, assetsContext);
                                             if (Array.isArray(generatedActions) && generatedActions.length > 0) {
                                                 const generatedWithIds = generatedActions.map(act => ({
                                                     id: Math.random().toString(36).substr(2, 9),
                                                     libId: act.libId,
                                                     params: act.params
                                                 }));
                                                 const currentActions = [...(objectData.events[selectedEvent] || [])];
                                                 currentActions.splice(idx, 1, ...generatedWithIds);
                                                 onUpdate({
                                                     ...objectData,
                                                     events: { ...objectData.events, [selectedEvent]: currentActions }
                                                 });
                                             } else {
                                                 window.alert("AI could not map this to any library actions.");
                                             }
                                         } catch (err) {
                                             console.error("Failed to generate actions:", err);
                                             window.alert("Failed to generate actions. See console for details.");
                                         } finally {
                                             setIsGenerating(prev => ({ ...prev, [action.id]: false }));
                                         }
                                     }}
                                     disabled={isGenerating[action.id]}
                                     className="text-white bg-green-600 hover:bg-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold disabled:opacity-50 cursor-pointer animate-pulse"
                                 >
                                     {isGenerating[action.id] ? 'Generating...' : 'Generate Actions'}
                                  </button>
                                  <button
                                      onClick={async () => {
                                          try {
                                              setIsGenerating(prev => ({ ...prev, [action.id]: true }));
                                              const assetsContext = `
Sprites: ${sprites.map(s => s.id + ' (' + s.name + ')').join(', ')}
Fonts: ${fonts.map(f => f.id + ' (' + f.name + ')').join(', ')}
Objects: ${gameObjects.map(o => o.id + ' (' + o.name + ')').join(', ')}
                                              `.trim();
                                              const generatedCode = await geminiService.generateActionCodeFromPrompt(action.params.prompt, ALL_ACTIONS, assetsContext);
                                              updateActionParam(idx, 'code', generatedCode);
                                          } catch (err) {
                                              console.error("Failed to generate code:", err);
                                              window.alert("Failed to generate code. See console for details.");
                                          } finally {
                                              setIsGenerating(prev => ({ ...prev, [action.id]: false }));
                                          }
                                      }}
                                      disabled={isGenerating[action.id]}
                                      className="text-white bg-blue-600 hover:bg-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold disabled:opacity-50 cursor-pointer"
                                  >
                                      {isGenerating[action.id] ? 'Generating...' : 'Generate Code'}
                                  </button>
                              </div>
                         )}
                         <button
                             onClick={() => {
                                 const code = def.generateCode ? def.generateCode(action.params) : '';
                                 const codeAction: GameAction = {
                                     id: Math.random().toString(36).substr(2, 9),
                                     libId: 'control_execute',
                                     params: { code }
                                 };
                                 const currentActions = [...(objectData.events[selectedEvent] || [])];
                                 currentActions[idx] = codeAction;
                                 onUpdate({
                                     ...objectData,
                                     events: { ...objectData.events, [selectedEvent]: currentActions }
                                 });
                             }}
                             className="text-gray-400 hover:text-win-blue p-1"
                             title="Convert to editable code"
                         >
                             <div className="font-bold text-[9px]">JS</div>
                         </button>
                         <button onClick={() => moveAction(idx, 'up')} className="text-gray-400 hover:text-win-blue p-1" disabled={idx === 0}>
                             <ArrowUp size={12}/>
                         </button>
                         <button onClick={() => moveAction(idx, 'down')} className="text-gray-400 hover:text-win-blue p-1" disabled={idx === (objectData.events[selectedEvent] || []).length - 1}>
                             <ArrowDown size={12}/>
                         </button>
                         <button onClick={() => removeAction(idx)} className="text-gray-400 hover:text-red-500 p-1">
                             <Trash2 size={14}/>
                         </button>
                     </div>
                 </div>
             );
         })}

         {/* Action List Toolbar */}
         <div className="sticky bottom-0 mt-auto flex justify-end gap-2 p-2 bg-[#D4D0C8] border-t-2 border-t-[#404040] border-l-2 border-l-[#404040] border-r-2 border-r-white border-b-2 border-b-white">
             <input type="file" className="hidden" ref={fileRef} accept=".json" onChange={handleImport} />
             <RetroButton onClick={handleExport} className="text-[8px] px-2 h-6" title="Export current event actions">
                 <Download size={10} className="mr-1"/> Export
             </RetroButton>
             <RetroButton onClick={() => fileRef.current?.click()} className="text-[8px] px-2 h-6" title="Import actions to current event">
                 <Upload size={10} className="mr-1"/> Import
             </RetroButton>
         </div>
      </div>
      </div>
      </div>

      {/* 3. Library Toolbox */}
      <div className="flex w-[180px] bg-[#ECE9D8] shrink-0 border-l border-[#808080] shadow-win-in">
          <div className="flex-1 flex flex-col p-1">
              <div className="grid grid-cols-3 gap-1 content-start border border-[#404040] bg-white p-1 min-h-[300px] shadow-win-in">
                 {renderLibraryList()}
              </div>
          </div>

          {/* Vertical Tabs */}
          <div className="w-[48px] flex flex-col bg-[#D4D0C8] overflow-y-auto overflow-x-hidden pt-2 border-l border-white shadow-[inset_1px_0_0_#DFDFDF]">
              {categories.map((cat, idx) => {
                  const isActive = selectedTab === cat;
                  return (
                      <button
                         key={cat}
                         onClick={() => setSelectedTab(cat)}
                         className={`relative w-full h-[70px] min-h-[70px] flex-shrink-0 border-2 font-bold mb-[1px] flex items-center justify-center text-[10px] transition-all text-black ${isActive ? 'bg-[#ECE9D8] border-t-white border-l-white border-b-[#808080] border-r-transparent mr-0 z-10 w-[50px]' : 'bg-[#D4D0C8] border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-[#dfdbd1]'}`}
                      >
                          <div className="absolute" style={{ transform: 'rotate(90deg)', whiteSpace: 'nowrap' }}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </div>
                      </button>
                  );
              })}
          </div>
      </div>
      </div>
      )}
    </div>
  );
};

export default LibraryEditor;
