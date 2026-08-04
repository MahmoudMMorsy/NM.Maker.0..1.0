
import * as React from 'react';
import { useState, useRef } from 'react';
import { GameMetadata, Localization } from '../types';
import { Plus, Trash2, Globe, Save, Upload, Image as ImageIcon } from 'lucide-react';
import RetroButton from './RetroButton';

interface GameInfoEditorProps {
    metadata: GameMetadata;
    localization: Localization;
    onUpdateMetadata: (meta: GameMetadata) => void;
    onUpdateLocalization: (loc: Localization) => void;
}

const GameInfoEditor: React.FC<GameInfoEditorProps> = ({ metadata, localization, onUpdateMetadata, onUpdateLocalization }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'localization'>('general');
    const [newLang, setNewLang] = useState('');
    const [newKey, setNewKey] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateMetadata({
                    ...metadata,
                    iconUrl: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveIcon = () => {
        onUpdateMetadata({
            ...metadata,
            iconUrl: null
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddLanguage = () => {
        if (newLang && !metadata.languages.includes(newLang)) {
            onUpdateMetadata({
                ...metadata,
                languages: [...metadata.languages, newLang]
            });
            setNewLang('');
        }
    };

    const handleRemoveLanguage = (lang: string) => {
        if (metadata.languages.length <= 1) return;
        onUpdateMetadata({
            ...metadata,
            languages: metadata.languages.filter(l => l !== lang),
            defaultLanguage: metadata.defaultLanguage === lang ? metadata.languages.find(l => l !== lang)! : metadata.defaultLanguage
        });
    };

    const handleAddKey = () => {
        if (newKey && !localization[newKey]) {
            const newLoc = { ...localization };
            newLoc[newKey] = {};
            metadata.languages.forEach(lang => {
                newLoc[newKey][lang] = '';
            });
            onUpdateLocalization(newLoc);
            setNewKey('');
        }
    };

    const handleRemoveKey = (key: string) => {
        const newLoc = { ...localization };
        delete newLoc[key];
        onUpdateLocalization(newLoc);
    };

    const handleUpdateTranslation = (key: string, lang: string, value: string) => {
        const newLoc = { ...localization };
        newLoc[key] = { ...newLoc[key], [lang]: value };
        onUpdateLocalization(newLoc);
    };

    return (
        <div className="flex flex-col h-full bg-win-face overflow-hidden">
            <div className="flex border-b border-win-shadow bg-win-face">
                <button onClick={() => setActiveTab('general')} className={`px-4 py-1 text-xs font-bold border-r border-win-shadow ${activeTab === 'general' ? 'bg-win-select text-white' : 'hover:bg-gray-100'}`}>General</button>
                <button onClick={() => setActiveTab('localization')} className={`px-4 py-1 text-xs font-bold border-r border-win-shadow ${activeTab === 'localization' ? 'bg-win-select text-white' : 'hover:bg-gray-100'}`}>Localization</button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {activeTab === 'general' && (
                    <div className="flex flex-col gap-4 max-w-lg">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold">Game Title</label>
                            <input
                                type="text"
                                value={metadata.title}
                                onChange={(e) => onUpdateMetadata({ ...metadata, title: e.target.value })}
                                className="border border-win-shadow px-2 py-1 text-xs bg-white"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold">App Launcher Icon (APK Only)</label>
                            <div className="flex items-center gap-4 bg-gray-50 border border-win-shadow p-2.5">
                                <div className="flex items-center justify-center w-12 h-12 bg-white border border-win-shadow overflow-hidden shadow-inner flex-shrink-0">
                                    {metadata.iconUrl ? (
                                        <img
                                            src={metadata.iconUrl}
                                            alt="App Icon Preview"
                                            className="w-full h-full object-contain image-rendering-pixelated"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <ImageIcon className="text-gray-400" size={20} />
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleIconChange}
                                            accept="image/png, image/jpeg"
                                            className="hidden"
                                        />
                                        <RetroButton
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 bg-win-face border-win-highlight shadow-win"
                                        >
                                            <Upload size={12} /> Upload Icon
                                        </RetroButton>
                                        {metadata.iconUrl && (
                                            <RetroButton
                                                onClick={handleRemoveIcon}
                                                className="px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 text-red-600 bg-win-face border-win-highlight shadow-win"
                                            >
                                                <Trash2 size={12} /> Remove
                                            </RetroButton>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-gray-500">Supports PNG/JPEG (1:1 aspect ratio, minimum 192x192 recommended)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold">Story / Description</label>
                            <textarea
                                value={metadata.story}
                                onChange={(e) => onUpdateMetadata({ ...metadata, story: e.target.value })}
                                className="border border-win-shadow px-2 py-1 text-xs bg-white h-24 resize-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold">Genre</label>
                            <input
                                type="text"
                                value={metadata.genre}
                                onChange={(e) => onUpdateMetadata({ ...metadata, genre: e.target.value })}
                                className="border border-win-shadow px-2 py-1 text-xs bg-white"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold">Controls</label>
                            <input
                                type="text"
                                value={metadata.controls}
                                onChange={(e) => onUpdateMetadata({ ...metadata, controls: e.target.value })}
                                className="border border-win-shadow px-2 py-1 text-xs bg-white"
                            />
                        </div>

                        <div className="h-px bg-gray-300 my-2"></div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold flex items-center gap-1"><Globe size={14}/> Supported Languages</label>
                            <div className="flex flex-wrap gap-2">
                                {metadata.languages.map(lang => (
                                    <div key={lang} className="flex items-center gap-1 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-[2px] text-[10px]">
                                        <span>{lang}</span>
                                        <button onClick={() => handleRemoveLanguage(lang)} className="text-red-500 hover:text-red-700"><Trash2 size={10}/></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center mt-1">
                                <input
                                    type="text"
                                    placeholder="e.g. fr, es, jp"
                                    value={newLang}
                                    onChange={(e) => setNewLang(e.target.value)}
                                    className="border border-win-shadow px-2 py-1 text-xs bg-white w-24"
                                />
                                <RetroButton onClick={handleAddLanguage} className="px-2 py-1"><Plus size={12}/> Add</RetroButton>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-2">
                            <label className="text-[11px] font-bold">Default Language</label>
                            <select
                                value={metadata.defaultLanguage}
                                onChange={(e) => onUpdateMetadata({ ...metadata, defaultLanguage: e.target.value })}
                                className="border border-win-shadow px-2 py-1 text-xs bg-white"
                            >
                                {metadata.languages.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === 'localization' && (
                    <div className="flex flex-col h-full">
                        <div className="flex gap-2 items-center mb-4">
                            <input
                                type="text"
                                placeholder="New Key (e.g. start_btn)"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                className="border border-win-shadow px-2 py-1 text-xs bg-white w-48"
                            />
                            <RetroButton onClick={handleAddKey} className="px-2 py-1"><Plus size={12}/> Add Key</RetroButton>
                        </div>

                        <div className="flex-1 border border-win-shadow bg-white overflow-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="border border-win-shadow px-2 py-1 text-left w-32">Key</th>
                                        {metadata.languages.map(lang => (
                                            <th key={lang} className="border border-win-shadow px-2 py-1 text-left">{lang}</th>
                                        ))}
                                        <th className="border border-win-shadow px-2 py-1 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(localization).map(key => (
                                        <tr key={key}>
                                            <td className="border border-win-shadow px-2 py-1 font-bold bg-gray-50">{key}</td>
                                            {metadata.languages.map(lang => (
                                                <td key={lang} className="border border-win-shadow p-0">
                                                    <input
                                                        type="text"
                                                        value={localization[key][lang] || ''}
                                                        onChange={(e) => handleUpdateTranslation(key, lang, e.target.value)}
                                                        className="w-full px-2 py-1 border-none focus:outline-none focus:bg-blue-50"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-win-shadow px-2 py-1 text-center">
                                                <button onClick={() => handleRemoveKey(key)} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameInfoEditor;
