
import * as React from 'react';
import { Gamepad2, Upload, Globe, Package, Wand2, HardDrive, RefreshCw, Trash2, Mic, Image as ImageIcon, Rocket, X, ChevronRight, MessageSquare, Target, Zap, Eye, User, ArrowDown, Car, Smartphone, Glasses, File, Folder } from 'lucide-react';
import RetroButton from '../components/RetroButton';

// Mockup styling
const TAB_CLASS = "px-4 py-2 text-[10px] uppercase font-bold border-t border-l border-r border-gray-400";
const ACTIVE_TAB_CLASS = "bg-white text-black border-b-white";
const INACTIVE_TAB_CLASS = "bg-gray-200 text-gray-600";

const StartPageMockup = ({ prompt, setPrompt, selectedImage, setSelectedImage, wizardTab, setWizardTab, cloudProjects, loadCloudProjects, handleGenerate, isListening, handleVoiceInput, imageInputRef, gmkInputRef, gmxFolderInputRef, htmlInputRef, nesInputRef }: any) => {
    return (
        <div className="w-full h-full bg-win-workspace p-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl bg-win-face border border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="h-8 bg-win-blue text-white flex items-center px-4 font-bold text-sm justify-between">
                    <span>NOR MAKER 8.2 — Start Page</span>
                    <div className="flex gap-1">
                        <button className="w-5 h-5 bg-gray-200 text-black flex items-center justify-center font-bold pb-1 shadow-win-out">_</button>
                        <button className="w-5 h-5 bg-gray-200 text-black flex items-center justify-center font-bold shadow-win-out">X</button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Panel: Tabs */}
                    <div className="md:col-span-1 flex flex-col gap-2">
                        <button onClick={() => setWizardTab('recent')} className={`text-left p-3 border ${wizardTab === 'recent' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-300'}`}>
                            🕘 Recent Projects
                        </button>
                        <button onClick={() => setWizardTab('ai')} className={`text-left p-3 border ${wizardTab === 'ai' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-300'}`}>
                            ✨ Cloud Wizard
                        </button>
                        <button onClick={() => setWizardTab('import')} className={`text-left p-3 border ${wizardTab === 'import' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-300'}`}>
                            📦 Import Center
                        </button>
                    </div>

                    {/* Right Panel: Content */}
                    <div className="md:col-span-3 border border-gray-400 bg-white p-6 min-h-[400px]">
                        {wizardTab === 'ai' && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-xl font-bold">Cloud Wizard (AI)</h2>
                                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-32 p-3 border border-gray-400" placeholder="Describe your game idea..." />
                                <div className="flex gap-2">
                                    <RetroButton onClick={handleVoiceInput}><Mic size={16}/> Voice</RetroButton>
                                    <RetroButton onClick={() => imageInputRef.current?.click()}><ImageIcon size={16}/> Upload Image</RetroButton>
                                </div>
                                <RetroButton onClick={handleGenerate} className="!bg-green-600 !text-white w-full h-12 text-lg">Create Game</RetroButton>
                            </div>
                        )}
                        {wizardTab === 'import' && (
                            <div className="grid grid-cols-2 gap-4">
                                <RetroButton onClick={() => gmkInputRef.current?.click()} className="h-20 flex-col"> <Upload/> GM 8.2</RetroButton>
                                <RetroButton onClick={() => htmlInputRef.current?.click()} className="h-20 flex-col"> <Globe/> HTML</RetroButton>
                                <RetroButton onClick={() => gmxFolderInputRef.current?.click()} className="h-20 flex-col"> <Package/> .gmx</RetroButton>
                                <RetroButton onClick={() => nesInputRef.current?.click()} className="h-20 flex-col"> <Gamepad2/> NES ROM</RetroButton>
                                <RetroButton onClick={() => {}} className="h-20 flex-col !bg-orange-100 !border-orange-400 !text-orange-900"> <Folder/> NOR Project</RetroButton>
                            </div>
                        )}
                        {wizardTab === 'recent' && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">Recent Projects</h2>
                                {/* List items here */}
                                <p className="text-gray-500">No recent projects.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartPageMockup;
