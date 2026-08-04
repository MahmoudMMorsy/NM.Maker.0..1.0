
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import RetroButton from './RetroButton';

interface ScriptEditorProps {
  code: string;
  onUpdate: (newCode: string) => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ code, onUpdate }) => {
  const [localCode, setLocalCode] = useState(code);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalCode(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdate(localCode);
    setIsDirty(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 p-2 text-white">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2 text-yellow-500 text-xs">
           <AlertTriangle size={14} />
           <span>تحذير: التعديل اليدوي قد يكسر اللعبة. تأكد من صحة كود Javascript.</span>
        </div>
        {isDirty && <span className="text-xs text-nes-red animate-pulse">● تغييرات غير محفوظة</span>}
      </div>

      <div className="flex-1 relative border border-gray-700 rounded overflow-hidden">
        <textarea
          className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs sm:text-sm p-4 resize-none focus:outline-none leading-relaxed"
          value={localCode}
          onChange={handleChange}
          spellCheck={false}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <RetroButton onClick={handleSave} disabled={!isDirty}>
            <Save size={16} className="inline mr-2" />
            تطبيق الكود الجديد
        </RetroButton>
      </div>
    </div>
  );
};

export default ScriptEditor;
