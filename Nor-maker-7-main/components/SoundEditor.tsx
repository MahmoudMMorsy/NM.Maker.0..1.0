
import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import { Play, Square, Upload, Volume2, Music, Trash2 } from 'lucide-react';
import RetroButton from './RetroButton';

interface SoundEditorProps {
  soundId: string;
  name: string;
  initialSrc: string;
  onSave: (src: string) => void;
}

const SoundEditor: React.FC<SoundEditorProps> = ({ soundId, name, initialSrc, onSave }) => {
  const [src, setSrc] = useState(initialSrc);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    setSrc(initialSrc);
  }, [soundId, initialSrc]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setSrc(result);
        onSave(result); // Auto-save on import
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => window.alert("Error playing audio: " + e));
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-win-face p-4 animate-fade-in select-none">
      {/* Visualizer Display */}
      <div className="bg-black border-2 border-win-shadow shadow-win-in h-32 mb-4 relative flex items-center justify-center overflow-hidden">
        {/* Fake Bars Visualizer */}
        <div className="absolute inset-0 flex items-end justify-center px-4 pb-1 gap-1 opacity-50">
            {Array.from({length: 30}).map((_, i) => (
                <div
                    key={i}
                    className={`flex-1 bg-green-500 transition-all duration-75 ease-in-out ${isPlaying ? 'animate-pulse' : ''}`}
                    style={{
                        height: isPlaying ? `${Math.random() * 80 + 10}%` : '5%',
                        opacity: isPlaying ? 1 : 0.3
                    }}
                ></div>
            ))}
        </div>

        {src ? (
            <div className="z-10 text-green-400 font-mono text-xs flex flex-col items-center drop-shadow-md">
                <Music size={24} className={`mb-2 ${isPlaying ? 'animate-bounce' : ''}`}/>
                <span>{name}.wav</span>
                <span className="text-[10px] opacity-70 mt-1">
                    {isPlaying ? "PLAYING..." : "READY"}
                </span>
            </div>
        ) : (
            <div className="z-10 text-red-400 font-mono text-xs">NO DATA</div>
        )}

        <audio
            ref={audioRef}
            src={src}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-win-face border border-win-highlight shadow-win-out p-2 mb-4">
          <div className="flex gap-2">
              <RetroButton onClick={togglePlay} disabled={!src} className="w-20 justify-center font-bold">
                  {isPlaying ? <><Square size={12} className="fill-current mr-2"/> STOP</> : <><Play size={12} className="fill-current mr-2"/> PLAY</>}
              </RetroButton>
          </div>
          <div className="flex items-center gap-2 text-win-text">
              <Volume2 size={16}/>
              <input
                type="range" min="0" max="1" step="0.1" className="w-20 h-2 bg-gray-300 appearance-none border border-gray-500"
                onChange={(e) => { if(audioRef.current) audioRef.current.volume = parseFloat(e.target.value); }}
              />
          </div>
      </div>

      {/* File Import */}
      <fieldset className="border border-gray-400 p-2 pt-1 flex flex-col gap-2 flex-1">
          <legend className="text-[11px] text-win-blue px-1">Source File</legend>
          <div className="flex gap-2 items-center mt-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex-1 border border-win-darkshadow shadow-win-in bg-white px-2 py-1 text-xs truncate h-7 flex items-center">
                  {src ? name : "No file loaded"}
              </div>
              <RetroButton onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} className="mr-1 inline"/> Load...
              </RetroButton>
          </div>
          <div className="mt-auto flex justify-between items-end">
              <p className="text-[10px] text-gray-500">Supported: WAV, MP3, OGG</p>
              <RetroButton onClick={() => { setSrc(''); onSave(''); }} className="text-red-600">
                  <Trash2 size={14} className="mr-1 inline"/> Clear
              </RetroButton>
          </div>
      </fieldset>
    </div>
  );
};

export default SoundEditor;
