// utils/useGamepad.ts
// Gamepad API Hook — يربط Controllers بنظام الـ input الموجود في المحرك
// يعمل polling على 60fps ويحوّل أزرار الـ gamepad لـ keyboard events
// بدما يكون الـ game runner مفتوح فقط

import { useEffect, useRef, useCallback } from 'react';

// معايير أزرار الـ gamepad (Standard Gamepad Layout)
const BUTTON_MAP: Record<number, string> = {
  0:  'Space',        // A / Cross  → Jump
  1:  'KeyX',         // B / Circle → Attack/Run
  2:  'KeyZ',         // X / Square → Action
  3:  'ShiftLeft',    // Y / Triangle → Dash
  4:  'KeyQ',         // LB → Q
  5:  'KeyE',         // RB → E
  8:  'Escape',       // Select/Back → Escape
  9:  'Enter',        // Start → Enter
  12: 'ArrowUp',      // D-pad Up
  13: 'ArrowDown',    // D-pad Down
  14: 'ArrowLeft',    // D-pad Left
  15: 'ArrowRight',   // D-pad Right
};

// Analog stick dead zone
const DEAD_ZONE = 0.25;

export interface GamepadState {
  connected:  boolean;
  id:         string;
  buttons:    boolean[];
  axes:       number[];
}

interface UseGamepadOptions {
  // الـ iframe اللي بنبعتله الـ events
  iframeRef?: React.RefObject<HTMLIFrameElement>;
  // هل نبعت keyboard events للـ window الأساسي؟
  broadcastToWindow?: boolean;
  enabled?: boolean;
}

export function useGamepad(options: UseGamepadOptions = {}) {
  const { iframeRef, broadcastToWindow = false, enabled = true } = options;

  const rafRef         = useRef<number>(0);
  const prevButtons    = useRef<boolean[]>([]);
  const prevAxisLeft   = useRef<{ x: boolean; y: boolean }>({ x: false, y: false });
  const stateRef       = useRef<GamepadState>({ connected: false, id: '', buttons: [], axes: [] });

  // إرسال keyboard event للـ window أو الـ iframe
  const dispatch = useCallback((key: string, type: 'keydown' | 'keyup') => {
    const event = new KeyboardEvent(type, {
      key,
      code: key,
      bubbles: true,
      cancelable: true,
    });

    if (iframeRef?.current?.contentWindow) {
      iframeRef.current.contentWindow.dispatchEvent(event);
    }
    if (broadcastToWindow) {
      window.dispatchEvent(event);
    }
  }, [iframeRef, broadcastToWindow]);

  const poll = useCallback(() => {
    if (!enabled) { rafRef.current = requestAnimationFrame(poll); return; }

    const gamepads = navigator.getGamepads();
    const gp = gamepads[0]; // نستخدم أول controller متصل

    if (!gp) {
      stateRef.current.connected = false;
      rafRef.current = requestAnimationFrame(poll);
      return;
    }

    stateRef.current.connected = true;
    stateRef.current.id        = gp.id;

    // ⚡ Bolt: Avoid per-frame array allocations (.map / Array.from) in the 60+ FPS RAF polling loop.
    // Reusing existing arrays prevents frequent garbage collection pauses during gameplay.
    if (stateRef.current.buttons.length !== gp.buttons.length) {
      stateRef.current.buttons = new Array(gp.buttons.length);
    }
    for (let i = 0; i < gp.buttons.length; i++) {
      stateRef.current.buttons[i] = gp.buttons[i].pressed;
    }

    if (stateRef.current.axes.length !== gp.axes.length) {
      stateRef.current.axes = new Array(gp.axes.length);
    }
    for (let i = 0; i < gp.axes.length; i++) {
      stateRef.current.axes[i] = gp.axes[i];
    }

    // --- Buttons ---
    if (prevButtons.current.length !== gp.buttons.length) {
      prevButtons.current = new Array(gp.buttons.length).fill(false);
    }

    for (let i = 0; i < gp.buttons.length; i++) {
      const btn = gp.buttons[i];
      const key = BUTTON_MAP[i];
      const prev = prevButtons.current[i];
      const curr = btn.pressed;

      if (key) {
        if (curr && !prev) dispatch(key, 'keydown');
        if (!curr && prev) dispatch(key, 'keyup');
      }
      prevButtons.current[i] = curr;
    }

    // --- Left Analog Stick (axes 0, 1) ---
    const lx = gp.axes[0] ?? 0;
    const ly = gp.axes[1] ?? 0;

    const leftNow = {
      x: Math.abs(lx) > DEAD_ZONE,
      y: Math.abs(ly) > DEAD_ZONE,
    };

    // X axis → Left / Right
    if (leftNow.x && !prevAxisLeft.current.x) {
      dispatch(lx < 0 ? 'ArrowLeft' : 'ArrowRight', 'keydown');
    }
    if (!leftNow.x && prevAxisLeft.current.x) {
      dispatch(lx < 0 ? 'ArrowLeft' : 'ArrowRight', 'keyup');
    }
    // Y axis → Up / Down
    if (leftNow.y && !prevAxisLeft.current.y) {
      dispatch(ly < 0 ? 'ArrowUp' : 'ArrowDown', 'keydown');
    }
    if (!leftNow.y && prevAxisLeft.current.y) {
      dispatch(ly < 0 ? 'ArrowUp' : 'ArrowDown', 'keyup');
    }

    prevAxisLeft.current = leftNow;

    rafRef.current = requestAnimationFrame(poll);
  }, [enabled, dispatch]);

  useEffect(() => {
    const onConnect    = (e: GamepadEvent) => {
      console.log(`[NOR Gamepad] متصل: ${e.gamepad.id}`);
    };
    const onDisconnect = (e: GamepadEvent) => {
      console.log(`[NOR Gamepad] منفصل: ${e.gamepad.id}`);
      prevButtons.current  = [];
      prevAxisLeft.current = { x: false, y: false };
    };

    window.addEventListener('gamepadconnected',    onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    // بدء الـ polling
    rafRef.current = requestAnimationFrame(poll);

    return () => {
      window.removeEventListener('gamepadconnected',    onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
      cancelAnimationFrame(rafRef.current);
    };
  }, [poll]);

  // بيرجع الحالة الحالية للـ UI
  const getState = useCallback((): GamepadState => ({ ...stateRef.current }), []);

  return { getState };
}

// --- الـ script الـ inline للـ iframe ---
// بيضيف Gamepad support جوّا اللعبة مباشرةً (بدون postMessage)
export const GAMEPAD_SCRIPT = `
(function() {
  if (!navigator.getGamepads) return;
  const DZONE = 0.25;
  const MAP = {0:'Space',1:'KeyX',2:'KeyZ',3:'ShiftLeft',12:'ArrowUp',13:'ArrowDown',14:'ArrowLeft',15:'ArrowRight'};
  let prev = [];
  let pAx  = {x:false, y:false};

  function fire(code, type) {
    const ev = new KeyboardEvent(type, {key:code, code:code, bubbles:true, cancelable:true});
    window.dispatchEvent(ev);
    document.dispatchEvent(ev);
  }

  function poll() {
    const gp = navigator.getGamepads()[0];
    if (gp) {
      if (prev.length !== gp.buttons.length) {
        prev = new Array(gp.buttons.length).fill(false);
      }
      for (let i = 0; i < gp.buttons.length; i++) {
        const b = gp.buttons[i];
        const key = MAP[i];
        const was = prev[i];
        if (key) {
          if (b.pressed && !was) fire(key, 'keydown');
          if (!b.pressed && was) fire(key, 'keyup');
        }
        prev[i] = b.pressed;
      }
      const lx=gp.axes[0]||0, ly=gp.axes[1]||0;
      const nxX = Math.abs(lx) > DZONE;
      const nxY = Math.abs(ly) > DZONE;
      if (nxX && !pAx.x) fire(lx<0?'ArrowLeft':'ArrowRight','keydown');
      if (!nxX && pAx.x) fire(lx<0?'ArrowLeft':'ArrowRight','keyup');
      if (nxY && !pAx.y) fire(ly<0?'ArrowUp':'ArrowDown','keydown');
      if (!nxY && pAx.y) fire(ly<0?'ArrowUp':'ArrowDown','keyup');
      pAx.x = nxX;
      pAx.y = nxY;
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);
  console.log('[NOR] Gamepad support active');
})();
`;
