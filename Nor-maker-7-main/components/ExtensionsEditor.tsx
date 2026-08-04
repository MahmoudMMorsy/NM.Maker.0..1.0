
import * as React from 'react';
import { Puzzle, Check, Info } from 'lucide-react';
import { GM82_EXTENSIONS } from '../utils/gm82Extensions';

interface ExtensionsEditorProps {
    enabledExtensions: string[];
    onToggle: (id: string) => void;
}

const ExtensionsEditor: React.FC<ExtensionsEditorProps> = ({ enabledExtensions, onToggle }) => {
    return (
        <div className="h-full bg-gray-950 p-4 text-white overflow-auto">
            <div className="mb-6 border-b border-gray-800 pb-4">
                <h3 className="flex items-center gap-2 text-yellow-400 font-bold text-lg mb-2">
                    <Puzzle size={24} />
                    امتدادات GM82Project
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                    قم بتفعيل المكتبات الإضافية لتعزيز قدرات محرك NOR. هذه الإضافات تحاكي وظائف GameMaker 8.2 الشهيرة وتضيف دوال جديدة للسكريبت.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {GM82_EXTENSIONS.map((ext) => {
                    const isEnabled = enabledExtensions.includes(ext.id);
                    return (
                        <div
                            key={ext.id}
                            onClick={() => onToggle(ext.id)}
                            className={`
                                relative p-4 rounded-lg border-2 cursor-pointer transition-all group
                                ${isEnabled
                                    ? 'bg-blue-900/30 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`font-mono font-bold text-lg ${isEnabled ? 'text-blue-300' : 'text-gray-300'}`}>
                                        {ext.name}
                                    </span>
                                    <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-500 border border-gray-700">DLL Wrapper</span>
                                </div>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isEnabled ? 'bg-blue-500 border-blue-400' : 'bg-gray-800 border-gray-600'}`}>
                                    {isEnabled && <Check size={14} className="text-white" />}
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm font-arabic mb-3">
                                {ext.description}
                            </p>

                            <div className="bg-black/50 p-2 rounded text-[10px] font-mono text-gray-500 overflow-hidden whitespace-nowrap text-ellipsis">
                                <Info size={10} className="inline mr-1"/>
                                يحقن كائن: <span className="text-green-400">window.{ext.id}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-200/80 font-arabic">
                ملاحظة: عند تفعيل إضافة، يجب الضغط على زر "تحديث اللعبة" ليتم دمج الكود البرمجي الخاص بها داخل المحرك.
            </div>
        </div>
    );
};

export default ExtensionsEditor;
