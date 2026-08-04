import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw,
  Maximize2, Minimize2, Shield, Zap, Sparkles, Terminal, Play, PlayCircle
} from 'lucide-react';

interface ConsoleViewerProps {
  mode: 'code' | 'game' | 'art';
  content: string;
  title: string;
}

const ConsoleViewer: React.FC<ConsoleViewerProps> = ({ mode, content, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [godModeActive, setGodModeActive] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [debugInfo, setDebugInfo] = useState({ instances: 0, score: 0, health: 100, lives: 3 });

  // Query live game engine state periodically
  useEffect(() => {
    if (mode !== 'game') return;
    const interval = setInterval(() => {
      const win = iframeRef.current?.contentWindow;
      if (win) {
        try {
          const activeInstances = win.instances ? win.instances.filter((i: any) => !i.destroyed).length : 0;
          setDebugInfo({
            instances: activeInstances,
            score: win.score || 0,
            health: win.player ? (win.player.health || 0) : (win.health || 0),
            lives: win.lives || 0
          });
        } catch (e) {
          // Cross-origin or engine not initialized yet
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [mode]);

  // Function to inject keyboard events into the iframe
  const sendKey = (key: string, type: 'keydown' | 'keyup') => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    let code = '';
    let keyCode = 0;

    switch(key) {
        case 'ArrowUp': code = 'ArrowUp'; keyCode = 38; break;
        case 'ArrowDown': code = 'ArrowDown'; keyCode = 40; break;
        case 'ArrowLeft': code = 'ArrowLeft'; keyCode = 37; break;
        case 'ArrowRight': code = 'ArrowRight'; keyCode = 39; break;
        case 'z': code = 'KeyZ'; keyCode = 90; break;
        case 'x': code = 'KeyX'; keyCode = 88; break;
        case 'Enter': code = 'Enter'; keyCode = 13; break;
        case 'Shift': code = 'ShiftLeft'; keyCode = 16; break;
    }

    const iwin = iframeRef.current?.contentWindow;
    if (!iwin) return;

    // Direct call bypassing browser security restrictions on programmatically dispatched events
    if (typeof (iwin as any).syncKeyboardToPlayers === 'function') {
      try {
        (iwin as any).syncKeyboardToPlayers(keyCode || key, type === 'keydown');
      } catch (err) {
        console.warn("Direct input sync failed:", err);
      }
    }

    try {
      const event = new KeyboardEvent(type, {
        key: key,
        code: code,
        keyCode: keyCode,
        bubbles: true,
        cancelable: true,
        view: iwin as any
      });

      // Correctly override the read-only properties
      Object.defineProperty(event, 'keyCode', { get: () => keyCode });
      Object.defineProperty(event, 'which', { get: () => keyCode });

      // Dispatch to multiple targets to ensure the game engine catches it
      iwin.dispatchEvent(event);
      const canvas = iwin.document?.querySelector('canvas');
      if (canvas) canvas.dispatchEvent(event);
      if (iwin.document?.body) iwin.document.body.dispatchEvent(event);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBtnDown = (e: React.PointerEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Only trigger if not already active
    if (!activeKeys[key]) {
        setActiveKeys(prev => ({...prev, [key]: true}));
        sendKey(key, 'keydown');
    }
  };

  const handleBtnUp = (e: React.PointerEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveKeys(prev => ({...prev, [key]: false}));
    sendKey(key, 'keyup');
  };

  const handleTouchStart = (e: React.TouchEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeKeys[key]) {
        setActiveKeys(prev => ({...prev, [key]: true}));
        sendKey(key, 'keydown');
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeKeys[key]) {
        setActiveKeys(prev => ({...prev, [key]: false}));
        sendKey(key, 'keyup');
    }
  };

  // Ensure iframe has focus for keyboard input when game mode starts and forward parent keys
  useEffect(() => {
    if (mode === 'game' && iframeRef.current) {
        iframeRef.current.focus();
    }

    if (mode !== 'game') return;

    const handleParentKey = (e: KeyboardEvent) => {
      // Don't forward if user is typing in an input or textarea
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (!iframeRef.current || !iframeRef.current.contentWindow) return;
      const iwin = iframeRef.current.contentWindow;

      // Direct call bypassing browser security restrictions on programmatically dispatched events
      if (typeof (iwin as any).syncKeyboardToPlayers === 'function') {
        try {
          (iwin as any).syncKeyboardToPlayers(e.keyCode || e.key, e.type === 'keydown');
        } catch (err) {
          console.warn("Direct parent input sync failed:", err);
        }
      }

      try {
        const event = new KeyboardEvent(e.type, {
          key: e.key,
          code: e.code,
          keyCode: e.keyCode,
          bubbles: true,
          cancelable: true,
          view: iwin as any
        });

        // Correctly override the read-only properties
        Object.defineProperty(event, 'keyCode', { get: () => e.keyCode });
        Object.defineProperty(event, 'which', { get: () => e.keyCode });

        iwin.dispatchEvent(event);
        const canvas = iwin.document?.querySelector('canvas');
        if (canvas) canvas.dispatchEvent(event);
        if (iwin.document?.body) iwin.document.body.dispatchEvent(event);
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener('keydown', handleParentKey);
    window.addEventListener('keyup', handleParentKey);

    return () => {
      window.removeEventListener('keydown', handleParentKey);
      window.removeEventListener('keyup', handleParentKey);
    };
  }, [mode]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Error entering full screen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Developer Tool: Execute custom code directly in iframe context
  const handleExecuteCheat = (codeToRun: string) => {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      try {
        // Run code safely in window context
        (win as any).eval(codeToRun);
        // Play synth feedback sound if engine has playSynthSound
        if ((win as any).playSynthSound) {
          (win as any).playSynthSound('coin');
        }
      } catch (err) {
        console.error("Cheat Code execution failed:", err);
      }
    }
  };

  // Play standalone synthesized sounds
  const playPreviewSound = (soundType: string) => {
    const win = iframeRef.current?.contentWindow;
    if (win && (win as any).playSynthSound) {
      try {
        (win as any).playSynthSound(soundType);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div
        ref={containerRef}
        className={`group relative bg-black overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'w-screen h-screen border-0 rounded-none z-[99999]'
            : 'w-full aspect-[4/3] rounded-lg border-4 border-gray-800 shadow-[0_0_20px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Toggle Fullscreen floating button */}
        {mode === 'game' && (
          <div className="absolute top-2 left-2 z-[60] flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black/60 hover:bg-black/90 text-white rounded border border-white/20 cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className={`p-2 rounded border cursor-pointer flex items-center gap-1.5 text-xs font-pixel ${
                showDevTools
                  ? 'bg-yellow-600 border-yellow-400 text-white shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                  : 'bg-black/60 hover:bg-black/90 text-yellow-400 border-white/20'
              }`}
              title="أدوات المطور والغش / Developer Tools & Cheats"
            >
              <Terminal className="w-5 h-5 animate-pulse" />
              <span>{showDevTools ? 'DEBUG ON' : 'DEV TOOLS'}</span>
            </button>
          </div>
        )}

        {/* TV Bezel Effect */}
        <div className="absolute inset-0 pointer-events-none z-20 border-[2px] border-white/5 rounded-lg shadow-inner"></div>

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none z-10 crt-overlay"></div>

        <div className="w-full h-full relative z-0 flex flex-col">
          {mode === 'code' && (
             <div className="w-full h-full bg-[#0000AA] p-4 overflow-auto font-mono text-xs text-white/90">
               <h3 className="text-center mb-4 text-yellow-300 font-pixel border-b-2 border-white/20 pb-2">
                 SOURCE CODE: {title}
               </h3>
               <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono">
                 {content}
               </pre>
             </div>
          )}

          {mode === 'art' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <img src={content || undefined} alt="Box Art" className="max-h-full max-w-full object-contain" />
            </div>
          )}

          {mode === 'game' && (
            <iframe
              ref={iframeRef}
              srcDoc={content}
              title="NES Emulator"
              className="w-full h-full border-none bg-black focus:outline-none"
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-downloads allow-forms allow-modals allow-popups allow-presentation allow-top-navigation allow-fullscreen"
              allowFullScreen={true}
            />
          )}
        </div>

        {/* Live Debug overlay inside Game mode */}
        {mode === 'game' && (
          <div className="absolute bottom-2 right-2 bg-black/75 border border-green-500/30 rounded p-1.5 z-40 text-[9px] font-pixel text-green-400 pointer-events-none flex flex-col gap-0.5 min-w-[120px]">
            <div className="flex justify-between">
              <span>ENTITIES:</span>
              <span className="text-white">{debugInfo.instances}</span>
            </div>
            <div className="flex justify-between">
              <span>SCORE:</span>
              <span className="text-yellow-400">{debugInfo.score}</span>
            </div>
            <div className="flex justify-between">
              <span>HEALTH:</span>
              <span className={debugInfo.health < 30 ? "text-red-400 animate-pulse" : "text-green-400"}>
                {debugInfo.health}%
              </span>
            </div>
            {godModeActive && (
              <div className="text-[8px] text-yellow-400 animate-pulse text-center font-bold mt-0.5 border-t border-green-500/20 pt-0.5">
                ⚡ GOD MODE ACTIVE ⚡
              </div>
            )}
          </div>
        )}

        {/* Screen Glare */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none z-30"></div>
      </div>

      {/* Developer Control Center Panel (Win98 style) */}
      {mode === 'game' && showDevTools && (
        <div className="mt-3 p-3 bg-win-face border-2 border-win-white shadow-win-out text-win-text font-ui rounded" dir="rtl">
          <div className="flex items-center justify-between border-b-2 border-win-white pb-1.5 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Terminal size={16} className="text-blue-800" />
              <span className="font-bold text-xs">لوحة تحكم أدوات المطور والغش (Bilingual Console)</span>
            </div>
            <button
              onClick={() => setShowDevTools(false)}
              className="px-1.5 py-0.5 bg-win-face border border-win-white font-mono text-[10px] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Left Column: Quick Cheats */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-gray-700">⚡ أزرار الغش الفورية (Instant Cheats)</span>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    handleExecuteCheat(`
                      if (window.player) window.player.health = 100;
                      window.health = 100;
                      window.lives = 9;
                      window.score = (window.score || 0) + 1000;
                    `);
                  }}
                  className="px-2 py-1 bg-win-face border-2 border-win-white active:border-win-shadow shadow-win-out text-center cursor-pointer text-[11px] hover:bg-gray-100 flex items-center justify-center gap-1"
                >
                  <Sparkles size={12} className="text-yellow-500" />
                  <span>طاقة ونقاط كاملة</span>
                </button>

                <button
                  onClick={() => {
                    setGodModeActive(true);
                    handleExecuteCheat(`
                      window.godMode = true;
                      if (window.player) {
                        window.player.invulnerable = true;
                        window.player.isInvincible = true;
                      }
                    `);
                  }}
                  className={`px-2 py-1 border-2 text-center cursor-pointer text-[11px] flex items-center justify-center gap-1 ${
                    godModeActive
                      ? 'bg-yellow-500 border-yellow-300 text-white font-bold shadow-inner'
                      : 'bg-win-face border-win-white shadow-win-out hover:bg-gray-100'
                  }`}
                >
                  <Shield size={12} className="text-blue-600" />
                  <span>تفعيل درع الخلود</span>
                </button>

                <button
                  onClick={() => {
                    handleExecuteCheat(`
                      if (window.player) {
                        window.player.speed = 7;
                        if (window.player.vx !== undefined) window.player.vx = 7;
                      }
                    `);
                  }}
                  className="px-2 py-1 bg-win-face border-2 border-win-white active:border-win-shadow shadow-win-out text-center cursor-pointer text-[11px] hover:bg-gray-100 flex items-center justify-center gap-1"
                >
                  <Zap size={12} className="text-green-600" />
                  <span>سرعة بطل فائقة</span>
                </button>

                <button
                  onClick={() => {
                    handleExecuteCheat(`
                      window.hasKey = true;
                      if (window.instances) {
                        window.instances.forEach(i => {
                          if (i.def && (i.def.name === 'obj_key' || i.def.name === 'obj_door')) {
                            i.destroyed = true;
                          }
                        });
                      }
                    `);
                  }}
                  className="px-2 py-1 bg-win-face border-2 border-win-white active:border-win-shadow shadow-win-out text-center cursor-pointer text-[11px] hover:bg-gray-100 flex items-center justify-center gap-1"
                >
                  <Terminal size={12} className="text-purple-600" />
                  <span>فتح كافة الأبواب</span>
                </button>
              </div>

              {/* Sound Preview Test */}
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[10px] text-gray-500 font-bold">🎵 اختبار مخرجات الصوت التوليدي (Sound Synth Board):</span>
                <div className="flex flex-wrap gap-1">
                  {['coin', 'laser', 'hit', 'explosion', 'powerup', 'jump'].map((snd) => (
                    <button
                      key={snd}
                      onClick={() => playPreviewSound(snd)}
                      className="px-2 py-0.5 bg-gray-200 border border-gray-400 hover:bg-gray-300 rounded text-[9px] font-pixel capitalize cursor-pointer"
                    >
                      🔊 {snd}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Custom JS Console Code Injector */}
            <div className="flex flex-col gap-1.5 justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-700">💻 موجه الأوامر البرمجي التفاعلي (Live JS Injector)</span>
                <span className="text-[9px] text-gray-500">اكتب أي كود لتنفيذه مباشرة في اللعبة (مثل: score = 99999)</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="مثال: score = 50000; or lives = 99;"
                  className="flex-1 px-2 py-1 bg-white border border-win-shadow text-xs font-mono text-blue-900 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customCode.trim()) {
                      handleExecuteCheat(customCode);
                      setCustomCode('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (customCode.trim()) {
                      handleExecuteCheat(customCode);
                      setCustomCode('');
                    }
                  }}
                  className="px-3 py-1 bg-blue-700 text-white border-2 border-blue-400 active:border-blue-900 shadow-win-out cursor-pointer hover:bg-blue-600 font-bold"
                >
                  تنفيذ
                </button>
              </div>
              <div className="flex flex-wrap gap-2 text-[9px] text-gray-500 mt-1">
                <span>متغيرات شائعة:</span>
                <code className="bg-gray-200 px-1 rounded">score</code>
                <code className="bg-gray-200 px-1 rounded">lives</code>
                <code className="bg-gray-200 px-1 rounded">health</code>
                <code className="bg-gray-200 px-1 rounded">instances</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Android Touch Controls - Enhanced for Playability */}
      {mode === 'game' && (
        <div className="mt-4 select-none touch-none" style={{ touchAction: 'none' }} dir="ltr">
          <div className="grid grid-cols-2 gap-4">

            {/* D-Pad Area */}
            <div className="flex items-center justify-center p-4 bg-gray-800/80 rounded-2xl border-2 border-gray-700 shadow-lg">
              <div className="grid grid-cols-3 gap-1">
                {/* UP */}
                <div className="col-start-2">
                    <button
                    className={`w-14 h-14 rounded-t-lg flex items-center justify-center transition-all border-b border-gray-900 ${activeKeys['ArrowUp'] ? 'bg-gray-500 translate-y-1' : 'bg-gray-700 shadow-[0_4px_0_#1f2937]'}`}
                    onPointerDown={(e) => handleBtnDown(e, 'ArrowUp')}
                    onPointerUp={(e) => handleBtnUp(e, 'ArrowUp')}
                    onPointerLeave={(e) => activeKeys['ArrowUp'] && handleBtnUp(e, 'ArrowUp')}
                    onTouchStart={(e) => handleTouchStart(e, 'ArrowUp')}
                    onTouchEnd={(e) => handleTouchEnd(e, 'ArrowUp')}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ touchAction: 'none' }}
                    >
                    <ChevronUp className="w-8 h-8 text-gray-300" />
                    </button>
                </div>

                {/* LEFT */}
                <div className="col-start-1 row-start-2">
                    <button
                    className={`w-14 h-14 rounded-l-lg flex items-center justify-center transition-all border-r border-gray-900 ${activeKeys['ArrowLeft'] ? 'bg-gray-500 translate-y-1' : 'bg-gray-700 shadow-[0_4px_0_#1f2937]'}`}
                    onPointerDown={(e) => handleBtnDown(e, 'ArrowLeft')}
                    onPointerUp={(e) => handleBtnUp(e, 'ArrowLeft')}
                    onPointerLeave={(e) => activeKeys['ArrowLeft'] && handleBtnUp(e, 'ArrowLeft')}
                    onTouchStart={(e) => handleTouchStart(e, 'ArrowLeft')}
                    onTouchEnd={(e) => handleTouchEnd(e, 'ArrowLeft')}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ touchAction: 'none' }}
                    >
                    <ChevronLeft className="w-8 h-8 text-gray-300" />
                    </button>
                </div>

                {/* CENTER (Decor) */}
                <div className="row-start-2 bg-gray-800 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-black/50 rounded-full"></div>
                </div>

                {/* RIGHT */}
                <div className="col-start-3 row-start-2">
                    <button
                    className={`w-14 h-14 rounded-r-lg flex items-center justify-center transition-all border-l border-gray-900 ${activeKeys['ArrowRight'] ? 'bg-gray-500 translate-y-1' : 'bg-gray-700 shadow-[0_4px_0_#1f2937]'}`}
                    onPointerDown={(e) => handleBtnDown(e, 'ArrowRight')}
                    onPointerUp={(e) => handleBtnUp(e, 'ArrowRight')}
                    onPointerLeave={(e) => activeKeys['ArrowRight'] && handleBtnUp(e, 'ArrowRight')}
                    onTouchStart={(e) => handleTouchStart(e, 'ArrowRight')}
                    onTouchEnd={(e) => handleTouchEnd(e, 'ArrowRight')}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ touchAction: 'none' }}
                    >
                    <ChevronRight className="w-8 h-8 text-gray-300" />
                    </button>
                </div>

                {/* DOWN */}
                <div className="col-start-2 row-start-3">
                    <button
                    className={`w-14 h-14 rounded-b-lg flex items-center justify-center transition-all border-t border-gray-900 ${activeKeys['ArrowDown'] ? 'bg-gray-500 translate-y-1' : 'bg-gray-700 shadow-[0_4px_0_#1f2937]'}`}
                    onPointerDown={(e) => handleBtnDown(e, 'ArrowDown')}
                    onPointerUp={(e) => handleBtnUp(e, 'ArrowDown')}
                    onPointerLeave={(e) => activeKeys['ArrowDown'] && handleBtnUp(e, 'ArrowDown')}
                    onTouchStart={(e) => handleTouchStart(e, 'ArrowDown')}
                    onTouchEnd={(e) => handleTouchEnd(e, 'ArrowDown')}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ touchAction: 'none' }}
                    >
                    <ChevronDown className="w-8 h-8 text-gray-300" />
                    </button>
                </div>
              </div>
            </div>

            {/* Action Buttons Area */}
            <div className="flex flex-col justify-between p-4 bg-gray-800/80 rounded-2xl border-2 border-gray-700 shadow-lg relative">

                {/* A / B Buttons */}
                <div className="flex items-center justify-center gap-6 mt-2">
                    <div className="flex flex-col items-center gap-2 translate-y-4">
                        <button
                            className={`w-16 h-16 rounded-full border-2 border-red-900 flex items-center justify-center transition-all ${activeKeys['x'] ? 'bg-red-500 translate-y-1 shadow-none' : 'bg-red-600 shadow-[0_4px_0_#7f1d1d]'}`}
                            onPointerDown={(e) => handleBtnDown(e, 'x')}
                            onPointerUp={(e) => handleBtnUp(e, 'x')}
                            onPointerLeave={(e) => activeKeys['x'] && handleBtnUp(e, 'x')}
                            onTouchStart={(e) => handleTouchStart(e, 'x')}
                            onTouchEnd={(e) => handleTouchEnd(e, 'x')}
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ touchAction: 'none' }}
                        >
                            <span className="font-pixel text-white text-xl drop-shadow-md">B</span>
                        </button>
                    </div>
                    <div className="flex flex-col items-center gap-2 -translate-y-2">
                        <button
                            className={`w-16 h-16 rounded-full border-2 border-red-900 flex items-center justify-center transition-all ${activeKeys['z'] ? 'bg-red-500 translate-y-1 shadow-none' : 'bg-red-600 shadow-[0_4px_0_#7f1d1d]'}`}
                            onPointerDown={(e) => handleBtnDown(e, 'z')}
                            onPointerUp={(e) => handleBtnUp(e, 'z')}
                            onPointerLeave={(e) => activeKeys['z'] && handleBtnUp(e, 'z')}
                            onTouchStart={(e) => handleTouchStart(e, 'z')}
                            onTouchEnd={(e) => handleTouchEnd(e, 'z')}
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ touchAction: 'none' }}
                        >
                            <span className="font-pixel text-white text-xl drop-shadow-md">A</span>
                        </button>
                    </div>
                </div>

                {/* Start / Select Buttons */}
                <div className="flex gap-4 justify-center mt-6">
                    <div className="flex flex-col items-center">
                        <button
                           className={`w-16 h-8 border-2 border-gray-600 rounded-full transform rotate-12 mb-1 transition-all ${activeKeys['Shift'] ? 'bg-gray-600' : 'bg-gray-900'}`}
                           onPointerDown={(e) => handleBtnDown(e, 'Shift')}
                           onPointerUp={(e) => handleBtnUp(e, 'Shift')}
                           onPointerLeave={(e) => activeKeys['Shift'] && handleBtnUp(e, 'Shift')}
                           onTouchStart={(e) => handleTouchStart(e, 'Shift')}
                           onTouchEnd={(e) => handleTouchEnd(e, 'Shift')}
                           onContextMenu={(e) => e.preventDefault()}
                           style={{ touchAction: 'none' }}
                        ></button>
                        <span className="text-[9px] tracking-widest text-gray-400 font-pixel">SELECT</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button
                           className={`w-16 h-8 border-2 border-gray-600 rounded-full transform rotate-12 mb-1 transition-all ${activeKeys['Enter'] ? 'bg-gray-600' : 'bg-gray-900'}`}
                           onPointerDown={(e) => handleBtnDown(e, 'Enter')}
                           onPointerUp={(e) => handleBtnUp(e, 'Enter')}
                           onPointerLeave={(e) => activeKeys['Enter'] && handleBtnUp(e, 'Enter')}
                           onTouchStart={(e) => handleTouchStart(e, 'Enter')}
                           onTouchEnd={(e) => handleTouchEnd(e, 'Enter')}
                           onContextMenu={(e) => e.preventDefault()}
                           style={{ touchAction: 'none' }}
                        ></button>
                        <span className="text-[9px] tracking-widest text-gray-400 font-pixel">START</span>
                    </div>
                </div>

                {/* Reset Button */}
                <div className="absolute top-2 right-2">
                    <button
                        onClick={() => {
                            if (iframeRef.current) {
                                const currentSrcDoc = iframeRef.current.srcdoc;
                                iframeRef.current.srcdoc = '';
                                setTimeout(() => {
                                    if (iframeRef.current) iframeRef.current.srcdoc = currentSrcDoc;
                                }, 10);
                            }
                        }}
                        className="w-8 h-8 bg-gray-900 border-2 border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 active:bg-gray-700 transition-all"
                        title="Reset Console"
                    >
                        <RotateCcw className="w-4 h-4 text-red-500" />
                    </button>
                    <div className="text-[7px] text-center text-gray-500 font-pixel mt-1">RESET</div>
                </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleViewer;
