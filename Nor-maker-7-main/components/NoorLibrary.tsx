import React from 'react';
import { Move, Layers, Settings, Target, Zap, Palette } from 'lucide-react';

const NoorLibrary = () => {
    const libraries = [
        { name: 'MOVE', icon: <Move size={16} />, color: 'bg-red-600' },
        { name: 'MAIN 1', icon: <Layers size={16} />, color: 'bg-blue-600' },
        { name: 'MAIN 2', icon: <Layers size={16} />, color: 'bg-blue-600' },
        { name: 'CONTROL', icon: <Settings size={16} />, color: 'bg-yellow-600' },
        { name: 'SCORE', icon: <Target size={16} />, color: 'bg-green-600' },
        { name: 'DRAW', icon: <Palette size={16} />, color: 'bg-purple-600' },
    ];

    return (
        <div className="flex flex-col gap-2 p-2 bg-win-face h-full">
            <h2 className="text-win-text font-bold text-xs border-b border-win-highlight mb-2">NOOR LIBRARIES</h2>
            {libraries.map((lib) => (
                <button key={lib.name} className={`flex items-center gap-2 p-2 ${lib.color} text-white text-xs font-bold shadow-win-out active:shadow-win-in`}>
                    {lib.icon}
                    {lib.name}
                </button>
            ))}
        </div>
    );
};

export default NoorLibrary;
