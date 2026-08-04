
import { useState } from 'react';

export type OpenWindow = {
  id: string;
  type: 'runner' | 'sprites' | 'backgrounds_edit' | 'sounds_edit' | 'fonts_edit' | 'script_edit' | 'ui_edit' | 'room' | 'object_edit' | 'extensions' | 'settings' | 'info' | 'analyzer' | 'tileset_edit' | 'three_d' | 'isometric' | 'noor_library' | 'model3d_editor' | 'android_export';
  targetId?: string;
  title: string;
  minimized: boolean;
};

export const useWindowManager = () => {
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [activeWindow, setActiveWindow] = useState<string>('welcome');
  const [windowStack, setWindowStack] = useState<string[]>([]);

  const bringToTop = (id: string) => {
    setWindowStack(prev => {
        const filtered = prev.filter(wId => wId !== id);
        return [...filtered, id];
    });
    setActiveWindow(id);
  };

  const openWindow = (type: OpenWindow['type'], targetId?: string, title?: string) => {
    const winId = targetId ? `${type}_${targetId}` : `${type}_${Date.now()}`;

    setOpenWindows(prev => {
      const existing = prev.find(w => w.id === winId || (targetId && w.type === type && w.targetId === targetId));
      let next;
      if (existing) {
        next = prev.map(w => w.id === existing.id ? { ...w, minimized: false } : w);
        bringToTop(existing.id);
      } else {
        next = [...prev, { id: winId, type, targetId, title: title || type, minimized: false }];
        bringToTop(winId);
      }

      const seen = new Set();
      return next.filter(w => {
        if (seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      });
    });
  };

  const closeWindow = (id: string) => {
    setOpenWindows(prev => prev.filter(w => w.id !== id));
    setWindowStack(prev => prev.filter(wId => wId !== id));
    if (activeWindow === id) {
      setActiveWindow('idle');
    }
  };

  const minimizeWindow = (id: string) => {
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w));
    if (activeWindow === id) {
      setActiveWindow('idle');
    }
  };

  const restoreWindow = (id: string) => {
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: false } : w));
    bringToTop(id);
  };

  const getZIndex = (id: string) => {
      const index = windowStack.indexOf(id);
      return index === -1 ? 10 : 50 + index;
  };

  return {
    openWindows,
    setOpenWindows,
    activeWindow,
    setActiveWindow,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    bringToTop,
    getZIndex
  };
};
