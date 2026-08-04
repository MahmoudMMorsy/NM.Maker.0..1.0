
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Bold, Italic } from 'lucide-react';
import { FontAsset } from '../types';

interface FontEditorProps {
  font: FontAsset;
  onUpdate: (f: FontAsset) => void;
}

const FontEditor: React.FC<FontEditorProps> = ({ font, onUpdate }) => {
  const [localFont, setLocalFont] = useState(font);
  const [previewText, setPreviewText] = useState("The quick brown fox jumps over the lazy dog.\n0123456789\n!@#$%^&*()");

  useEffect(() => setLocalFont(font), [font]);

  const handleChange = (field: keyof FontAsset, value: any) => {
      const updated = { ...localFont, [field]: value };
      setLocalFont(updated);
      onUpdate(updated);
  };

  return (
    <div className="flex flex-col h-full bg-win-face p-4 animate-fade-in text-win-text select-none">
        <div className="flex flex-col md:flex-row gap-4 h-full">

            {/* Settings Column */}
            <div className="w-full md:w-64 flex flex-col gap-4">
                <fieldset className="border border-gray-400 p-2 pb-3">
                    <legend className="text-xs text-win-blue px-1">Font Settings</legend>

                    <div className="flex flex-col gap-1 mb-3">
                        <label className="text-xs">Name:</label>
                        <input
                            className="border border-win-darkshadow shadow-win-in px-1 py-0.5 text-xs w-full font-bold"
                            value={localFont.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1 mb-3">
                        <label className="text-xs">Font Family:</label>
                        <select
                            className="border border-win-darkshadow shadow-win-in px-1 py-0.5 text-xs w-full bg-white"
                            value={localFont.family}
                            onChange={(e) => handleChange('family', e.target.value)}
                        >
                            <option value="Arial">Arial (Sans Serif)</option>
                            <option value="Courier New">Courier New (Mono)</option>
                            <option value="Times New Roman">Times New Roman (Serif)</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Tahoma">Tahoma</option>
                            <option value="'Press Start 2P'">Pixel (Press Start)</option>
                            <option value="'Tajawal'">Arabic (Tajawal)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <label className="text-xs w-10">Size:</label>
                        <input
                            type="number"
                            className="border border-win-darkshadow shadow-win-in px-1 py-0.5 text-xs w-16"
                            value={localFont.size}
                            onChange={(e) => handleChange('size', parseInt(e.target.value))}
                        />
                        <span className="text-[10px] text-gray-500">pt</span>
                    </div>

                    <div className="flex gap-2 mt-1">
                        <button
                            className={`p-1 border flex-1 flex items-center justify-center gap-1 text-xs ${localFont.bold ? 'bg-win-select text-white border-win-darkshadow shadow-win-in' : 'bg-win-face border-win-highlight shadow-win-out'}`}
                            onClick={() => handleChange('bold', !localFont.bold)}
                        >
                            <Bold size={12}/> Bold
                        </button>
                        <button
                            className={`p-1 border flex-1 flex items-center justify-center gap-1 text-xs ${localFont.italic ? 'bg-win-select text-white border-win-darkshadow shadow-win-in' : 'bg-win-face border-win-highlight shadow-win-out'}`}
                            onClick={() => handleChange('italic', !localFont.italic)}
                        >
                            <Italic size={12}/> Italic
                        </button>
                    </div>
                </fieldset>

                <div className="p-2 bg-yellow-50 border border-yellow-200 text-[10px] text-gray-600 leading-tight">
                    <strong>Info:</strong> Fonts are rendered as system fonts in the Web prototype. For NES export, only bitmap approximation is used.
                </div>
            </div>

            {/* Preview Column */}
            <div className="flex-1 flex flex-col h-full min-h-[200px]">
                <label className="text-xs mb-1 font-bold px-1">Sample Text:</label>
                <textarea
                    className="flex-1 w-full border-2 border-win-darkshadow shadow-win-in p-4 resize-none focus:outline-none overflow-auto whitespace-pre"
                    style={{
                        fontFamily: localFont.family,
                        fontSize: `${localFont.size}px`,
                        fontWeight: localFont.bold ? 'bold' : 'normal',
                        fontStyle: localFont.italic ? 'italic' : 'normal',
                        backgroundColor: 'white',
                        color: 'black'
                    }}
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                />
            </div>
        </div>
    </div>
  );
};

export default FontEditor;
