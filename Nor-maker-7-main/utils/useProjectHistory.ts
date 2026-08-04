// utils/useProjectHistory.ts
// Global Undo/Redo — يغطي كل assets و objects و rooms و scripts و UI
// يعمل كـ stack خارج React state عشان يتجنب re-render cascade
// الـ consumer يستدعي pushSnapshot() قبل أي تعديل مهم، و undo/redo يرجّعوا الـ state

import { useRef, useCallback, useState } from 'react';
import { SpriteAsset, BackgroundAsset, SoundAsset, FontAsset, ScriptAsset, GameObject, RoomData, UIMenu } from '../types';

export interface ProjectSnapshot {
  sprites: SpriteAsset[];
  backgroundAssets: BackgroundAsset[];
  soundAssets: SoundAsset[];
  fontAssets: FontAsset[];
  scripts: ScriptAsset[];
  gameObjects: GameObject[];
  rooms: RoomData[];
  uiMenus: UIMenu[];
  // حقل اختياري للوصف — بيظهر في tooltip
  label?: string;
}

export interface ApplySnapshot {
  setSprites: (v: SpriteAsset[]) => void;
  setBackgroundAssets: (v: BackgroundAsset[]) => void;
  setSoundAssets: (v: SoundAsset[]) => void;
  setFontAssets: (v: FontAsset[]) => void;
  setScripts: (v: ScriptAsset[]) => void;
  setGameObjects: (v: GameObject[]) => void;
  setRooms: (v: RoomData[]) => void;
  setUiMenus: (v: UIMenu[]) => void;
}

const MAX_HISTORY = 50;

export function useProjectHistory() {
  // نستخدم ref مش state عشان نتجنب re-render عند كل push
  const pastRef   = useRef<ProjectSnapshot[]>([]);
  const futureRef = useRef<ProjectSnapshot[]>([]);

  // state بسيط بس لإخبار الـ UI إن في حاجة اتغيرت (canUndo / canRedo)
  const [historySize, setHistorySize] = useState({ past: 0, future: 0 });

  const refreshUI = useCallback(() => {
    setHistorySize({ past: pastRef.current.length, future: futureRef.current.length });
  }, []);

  // deep clone خفيف — بيعمل copy للـ arrays بدون JSON.parse/stringify الغالية على الـ base64
  const cloneSnapshot = useCallback((snap: ProjectSnapshot): ProjectSnapshot => ({
    sprites:          snap.sprites.map(s => ({ ...s })),
    backgroundAssets: snap.backgroundAssets.map(b => ({ ...b })),
    soundAssets:      snap.soundAssets.map(s => ({ ...s })),
    fontAssets:       snap.fontAssets.map(f => ({ ...f })),
    scripts:          snap.scripts.map(sc => ({ ...sc })),
    gameObjects:      snap.gameObjects.map(o => ({
      ...o,
      events: { ...o.events },
      animations: o.animations ? { ...o.animations } : undefined
    })),
    rooms: snap.rooms.map(r => ({
      ...r,
      map: [...r.map],
      settings: { ...r.settings },
      backgrounds: r.backgrounds.map(bg => ({ ...bg })),
      views: r.views.map(v => ({ ...v }))
    })),
    uiMenus: snap.uiMenus.map(m => ({
      ...m,
      elements: m.elements.map(el => ({ ...el }))
    })),
    label: snap.label
  }), []);

  // يُستدعى قبل أي تعديل — يحفظ الحالة الحالية في الـ past
  const pushSnapshot = useCallback((current: ProjectSnapshot) => {
    const clone = cloneSnapshot(current);
    pastRef.current = [...pastRef.current.slice(-MAX_HISTORY + 1), clone];
    futureRef.current = []; // أي تعديل جديد يمسح الـ redo
    refreshUI();
  }, [cloneSnapshot, refreshUI]);

  // Undo: يرجع آخر snapshot من الـ past
  const undo = useCallback((
    current: ProjectSnapshot,
    apply: ApplySnapshot
  ): ProjectSnapshot | null => {
    if (pastRef.current.length === 0) return null;

    const prev = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);

    // حفظ الحالة الحالية في الـ future
    futureRef.current = [...futureRef.current, cloneSnapshot(current)];

    // تطبيق الـ snapshot
    apply.setSprites(prev.sprites);
    apply.setBackgroundAssets(prev.backgroundAssets);
    apply.setSoundAssets(prev.soundAssets);
    apply.setFontAssets(prev.fontAssets);
    apply.setScripts(prev.scripts);
    apply.setGameObjects(prev.gameObjects);
    apply.setRooms(prev.rooms);
    apply.setUiMenus(prev.uiMenus);

    refreshUI();
    return prev;
  }, [cloneSnapshot, refreshUI]);

  // Redo: يعيد آخر snapshot من الـ future
  const redo = useCallback((
    current: ProjectSnapshot,
    apply: ApplySnapshot
  ): ProjectSnapshot | null => {
    if (futureRef.current.length === 0) return null;

    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);

    pastRef.current = [...pastRef.current, cloneSnapshot(current)];

    apply.setSprites(next.sprites);
    apply.setBackgroundAssets(next.backgroundAssets);
    apply.setSoundAssets(next.soundAssets);
    apply.setFontAssets(next.fontAssets);
    apply.setScripts(next.scripts);
    apply.setGameObjects(next.gameObjects);
    apply.setRooms(next.rooms);
    apply.setUiMenus(next.uiMenus);

    refreshUI();
    return next;
  }, [cloneSnapshot, refreshUI]);

  const clearHistory = useCallback(() => {
    pastRef.current   = [];
    futureRef.current = [];
    refreshUI();
  }, [refreshUI]);

  return {
    pushSnapshot,
    undo,
    redo,
    clearHistory,
    canUndo:    historySize.past   > 0,
    canRedo:    historySize.future > 0,
    undoCount:  historySize.past,
    redoCount:  historySize.future,
    undoLabel:  pastRef.current.at(-1)?.label  ?? 'Undo',
    redoLabel:  futureRef.current.at(-1)?.label ?? 'Redo',
  };
}
