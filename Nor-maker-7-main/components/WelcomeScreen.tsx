import React, { useState, useRef } from 'react';
import { Folder, Upload, Globe, Package, Gamepad2, Wand2, HardDrive, Rocket, Mic, Image as ImageIcon, X, Target, Waypoints, Zap, MessageSquare, TreePine, Eye, User, ArrowDown, Car, Glasses, Smartphone, File, ChevronRight, Trash2, Sparkles, FolderOpen } from 'lucide-react';
import RetroButton from './RetroButton';

const WelcomeScreen = ({ prompt, setPrompt, isListening, handleVoiceInput, handleGenerate, handleCreateOffline, selectedImage, setSelectedImage, onImageSelect, imageInputRef, gmkInputRef, handleOpenGmk, gmxFolderInputRef, handleOpenGmx, htmlInputRef, handleOpenHtml, nesInputRef, savedTemplates, handleLoadSavedTemplate, handleDeleteSavedTemplate, handleDeleteMultipleSavedTemplates, handleImportNor }: any) => {
    // Set 'local' (Game Templates) as the default active tab so the user sees all 9 premium templates instantly!
    const [wizardTab, setWizardTab] = useState<'ai' | 'local' | 'recent'>('local');
    const [localTemplate, setLocalTemplate] = useState<string>('starter');
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
    const [aiMode, setAiMode] = useState<'local' | 'online'>('local');
    const norInputRef = useRef<HTMLInputElement>(null);

    const toggleTemplateSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedTemplates(prev =>
            prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
        );
    };

    return (
        <div className="w-full h-full bg-zinc-100 p-2 sm:p-4 flex items-center justify-center font-sans overflow-y-auto" dir="rtl">
            <div className="w-full max-w-2xl bg-[#EBE7DD] border-2 border-win-white shadow-win-out flex flex-col rounded overflow-hidden my-auto">

                {/* Win98 Window Header */}
                <div className="h-8 bg-win-title text-white flex items-center px-3 font-bold text-xs justify-between" dir="ltr">
                    <div className="flex items-center gap-1.5">
                        <Gamepad2 size={16} className="text-yellow-300 animate-bounce" />
                        <span className="font-pixel text-[11px] tracking-wider text-white">صفحة البدء: قوالب الألعاب الجاهزة والأصول | Start Studio</span>
                    </div>
                    <div className="flex gap-1">
                        <button className="w-5 h-5 bg-[#EBE7DD] border border-zinc-500 flex items-center justify-center font-bold text-[10px] text-black">_</button>
                        <button onClick={() => handleCreateOffline('blank')} title="فتح مشروع فارغ" className="w-5 h-5 bg-[#EBE7DD] border border-zinc-500 flex items-center justify-center font-bold text-[10px] text-black">X</button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-4 space-y-4">

                    {/* Hero Title and Welcome Banner */}
                    <div className="text-center space-y-1.5 bg-win-face border border-win-white p-3 shadow-win-out">
                        <h1 className="text-2xl font-bold font-pixel text-blue-900 tracking-wide">NOR MAKER <span className="text-sm font-sans px-1.5 py-0.5 bg-red-600 text-white rounded font-bold animate-pulse">PRO 10X</span></h1>
                        <p className="text-xs text-zinc-800 font-bold">مرحباً بك في الاستوديو الاحترافي المطور لصناعة الألعاب الكلاسيكية!</p>
                        <p className="text-[11px] text-zinc-600">اختر من القوالب التسعة المتكاملة أو قم باستيراد مشروع خارجي للبدء فوراً.</p>
                    </div>

                    {/* Standalone Engine Downloads Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 p-2 text-right shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 rounded">
                        <div className="text-[11px] text-blue-950 font-bold flex items-center gap-1.5">
                            <Sparkles size={14} className="text-blue-600 animate-pulse"/>
                            <span>هل تريد تشغيل المحرك كبرنامج مستقل بدون متصفح؟ حمل نسخ المحرك الأصلية:</span>
                        </div>
                        <div className="flex gap-2">
                            <a href="/nor-maker-standalone.exe" download="NOR-Maker-AI.exe" className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded border border-blue-400 shadow-sm transition-all" dir="ltr">
                                <HardDrive size={12}/>
                                <span>PC (Windows .exe)</span>
                            </a>
                            <a href="/nor-maker-standalone.apk" download="NOR-Maker-AI.apk" className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded border border-green-400 shadow-sm transition-all" dir="ltr">
                                <Smartphone size={12}/>
                                <span>Mobile (Android .apk)</span>
                            </a>
                        </div>
                    </div>

                    {/* Gameplay Demo Video Player (Retro Styled) */}
                    <div className="bg-win-face border border-win-white p-2 shadow-win-out space-y-2">
                        <div className="flex items-center justify-between bg-[#000080] text-white px-2 py-0.5 text-xs font-bold" dir="ltr">
                            <span>🎥 فيديو تجربة قوالب الألعاب الجاهزة | Gameplay Demo Video</span>
                        </div>
                        <div className="relative w-full aspect-video bg-black rounded overflow-hidden border-2 border-zinc-500">
                            <video
                                src="/videos/gameplay_demo.webm"
                                controls
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <p className="text-[10px] text-zinc-600 text-center font-bold">
                            يستعرض هذا الفيديو أسلوب اللعب الفعلي، التحكم المتجاوب، والرسوميات لجميع القوالب المطورة!
                        </p>
                    </div>

                    {/* Quick Import Center (Bilingual Labels) */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" dir="rtl">
                        <input type="file" ref={norInputRef} className="hidden" accept=".nor,.pnor,application/octet-stream" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) { handleImportNor(e.target.files[0]); }
                        }} />

                        <button onClick={() => norInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 p-2 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-300 text-orange-950 text-[10px] font-bold hover:from-orange-100 hover:to-orange-200 shadow-sm rounded transition-all">
                            <FolderOpen size={16} className="text-orange-600"/>
                            <span>استيراد NOR.</span>
                        </button>

                        <button onClick={() => gmxFolderInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 p-2 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-300 text-purple-950 text-[10px] font-bold hover:from-purple-100 hover:to-purple-200 shadow-sm rounded transition-all">
                            <Package size={16} className="text-purple-600 animate-pulse"/>
                            <span>استيراد GMX ZIP</span>
                        </button>

                        <button onClick={() => gmkInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 p-2 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-300 text-yellow-950 text-[10px] font-bold hover:from-yellow-100 hover:to-yellow-200 shadow-sm rounded transition-all">
                            <Upload size={16} className="text-yellow-600"/>
                            <span>استيراد GM 8.2</span>
                        </button>

                        <button onClick={() => htmlInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 p-2 bg-gradient-to-br from-green-50 to-green-100 border border-green-300 text-green-950 text-[10px] font-bold hover:from-green-100 hover:to-green-200 shadow-sm rounded transition-all">
                            <Globe size={16} className="text-green-600"/>
                            <span>استيراد HTML5</span>
                        </button>

                        <button onClick={() => nesInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 p-2 bg-gradient-to-br from-red-50 to-red-100 border border-red-300 text-red-950 text-[10px] font-bold hover:from-red-100 hover:to-red-200 shadow-sm rounded transition-all">
                            <Gamepad2 size={16} className="text-red-600"/>
                            <span>استيراد NES ROM</span>
                        </button>
                    </div>

                    {/* Navigation Tabs (Tabs Section) */}
                    <div className="border-2 border-win-white bg-win-face shadow-win-out flex flex-col">

                        {/* Tab Headers */}
                        <div className="flex bg-[#D3CEB8] border-b border-zinc-400" dir="rtl">
                            <button
                                onClick={() => setWizardTab('local')}
                                className={`px-4 py-2 text-xs border-l border-zinc-400 flex items-center gap-1.5 transition-all cursor-pointer ${
                                    wizardTab === 'local'
                                        ? 'bg-win-face font-bold text-blue-900 border-t-2 border-t-blue-700 shadow-inner'
                                        : 'hover:bg-zinc-200 text-gray-700'
                                }`}
                            >
                                <Gamepad2 size={13} className="text-blue-600"/>
                                <span>🎮 قوالب الألعاب الجاهزة (9 Premium Templates)</span>
                            </button>

                            <button
                                onClick={() => setWizardTab('ai')}
                                className={`px-4 py-2 text-xs border-l border-zinc-400 flex items-center gap-1.5 transition-all cursor-pointer ${
                                    wizardTab === 'ai'
                                        ? 'bg-win-face font-bold text-purple-900 border-t-2 border-t-purple-700 shadow-inner'
                                        : 'hover:bg-zinc-200 text-gray-700'
                                }`}
                            >
                                <Wand2 size={13} className="text-purple-600"/>
                                <span>✨ مولد الذكاء الاصطناعي (AI Generator)</span>
                            </button>

                            <button
                                onClick={() => setWizardTab('recent')}
                                className={`px-4 py-2 text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                    wizardTab === 'recent'
                                        ? 'bg-win-face font-bold text-amber-900 border-t-2 border-t-amber-700 shadow-inner'
                                        : 'hover:bg-zinc-200 text-gray-700'
                                }`}
                            >
                                <Folder size={13} className="text-amber-600"/>
                                <span>📁 المشاريع والقوالب المحفوظة</span>
                            </button>
                        </div>

                        {/* Tab Content Box */}
                        <div className="bg-white border-t-0 p-3 min-h-[220px] max-h-[360px] overflow-y-auto">

                            {/* 1. Playable Premium Templates Tab (Active by Default!) */}
                            {wizardTab === 'local' && (
                                <div className="space-y-3">
                                    <div className="bg-blue-50 border-r-4 border-blue-600 p-2 text-[11px] text-blue-950 font-bold mb-2">
                                        🔥 اختر أحد القوالب التسعة الاحترافية المتكاملة المليئة بالرسومات، المؤثرات الصوتية 8-bit، وفيزياء اللعب المتطورة!
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        {[
                                            {
                                                id: 'starter',
                                                icon: <Package size={16} className="text-blue-600"/>,
                                                bg: 'bg-blue-100 border-blue-300',
                                                label: 'ألعاب منصات ومغامرات جانبية (Classic Platformer)',
                                                desc: 'فيزياء قفز واحتكاك مثالية، بلوكات حمم حية، مفاتيح وأبواب مقفلة مع واجهة HUD وصوت قفز توليدي.'
                                            },
                                            {
                                                id: 'rpg',
                                                icon: <MessageSquare size={16} className="text-yellow-600"/>,
                                                bg: 'bg-yellow-100 border-yellow-300',
                                                label: 'تقمص أدوار واستكشاف ومتاهة (RPG / Adventure)',
                                                desc: 'تجوال في قرية ريترو، التفاعل مع الساحر (NPC) بنوافذ حوارات، وفتح صناديق الكنز بالمفاتيح.'
                                            },
                                            {
                                                id: 'shooter',
                                                icon: <Target size={16} className="text-red-600"/>,
                                                bg: 'bg-red-100 border-red-300',
                                                label: 'إطلاق نار وفضاء وأركيد (Shooter / Space)',
                                                desc: 'سفينة فضائية متحركة، ليزر توليدي، موجات غزاة متدفقة مع مواجهة زعيم نهائي (Boss Battle) وتفجيرات.'
                                            },
                                            {
                                                id: 'runner',
                                                icon: <Zap size={16} className="text-orange-600"/>,
                                                bg: 'bg-orange-100 border-orange-300',
                                                label: 'جري لانهائي وتفادي عقبات (Endless Runner)',
                                                desc: 'تحكم بالقفز والانحناء لتفادي العقبات والخفافيش، نقاط متزايدة، وتسارع تدريجي مع صوتيات ريترو مذهلة.'
                                            },
                                            {
                                                id: 'maze',
                                                icon: <Waypoints size={16} className="text-green-600"/>,
                                                bg: 'bg-green-100 border-green-300',
                                                label: 'ألغاز وتحدي ذكاء ومتاهات (Puzzle / Maze)',
                                                desc: 'لوحات ضغط على الأرض لتفعيل بوابات حديدية، جمع البلورات، وفتح مسارات سرية للوصول للمخرج.'
                                            },
                                            {
                                                id: 'fighter',
                                                icon: <Target size={16} className="text-red-500 animate-pulse"/>,
                                                bg: 'bg-red-50 border-red-300',
                                                label: 'قتال وتلاحم قتالي (Fighting / Beat \'em Up)',
                                                desc: 'حلبة متكاملة، حركات هجوم كومبو (ركل ولكم)، صد للضربات، ومنافس ذكي مع شريط طاقة مزدوج.'
                                            },
                                            {
                                                id: 'racing',
                                                icon: <Car size={16} className="text-emerald-600"/>,
                                                bg: 'bg-emerald-100 border-emerald-300',
                                                label: 'سباقات وسرعة ومقاومة (Retro Racing)',
                                                desc: 'فيزياء انزلاق وانعطاف حقيقية (Drift Physics)، منافس ذكي، حواف مضمار حية، وعداد دورات حماسي.'
                                            },
                                            {
                                                id: 'strategy',
                                                icon: <Waypoints size={16} className="text-purple-600"/>,
                                                bg: 'bg-purple-100 border-purple-300',
                                                label: 'ألعاب استراتيجية وتخطيط (RTS Strategy)',
                                                desc: 'توليد الموارد عبر عمال مناجم الذهب تلقائياً، تدريب الفرسان والجنود، ومهاجمة قلعة جيش الأورك الحية.'
                                            },
                                            {
                                                id: 'arcade',
                                                icon: <Sparkles size={16} className="text-pink-600"/>,
                                                bg: 'bg-pink-100 border-pink-300',
                                                label: 'أركيد كلاسيكي كسر الطوب (Brick Breaker)',
                                                desc: 'فيزياء ارتداد مثالية، طوب متفجر (TNT)، مكافآت تسقط عشوائياً (Power-ups)، وطوب يتطلب عدة ضربات.'
                                            },
                                            { id: 'blank',         icon: <File size={16} className="text-gray-600"/>,       bg: 'bg-gray-100 border-gray-300',   label: 'مشروع فارغ كلياً (Blank Project)', desc: 'غرفة ومساحة عمل فارغة لبناء لعبتك الفريدة من الصفر المطلق.' },
                                        ].map(({ id, icon, bg, label, desc }) => (
                                            <label
                                                key={id}
                                                onClick={() => setLocalTemplate(id)}
                                                className={`flex items-center gap-3 cursor-pointer p-2 border-2 rounded transition-all ${
                                                    localTemplate === id
                                                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="tpl"
                                                    checked={localTemplate === id}
                                                    onChange={() => setLocalTemplate(id)}
                                                    className="shrink-0 accent-blue-700"
                                                />
                                                <div className={`w-8 h-8 border flex items-center justify-center rounded shrink-0 ${bg}`}>{icon}</div>
                                                <div className="flex-1 text-right">
                                                    <div className="font-bold text-[11px] text-zinc-950">{label}</div>
                                                    <div className="text-[10px] text-zinc-600 leading-normal mt-0.5">{desc}</div>
                                                </div>
                                            </label>
                                        ))}

                                        {/* User-saved templates section */}
                                        {savedTemplates && savedTemplates.length > 0 && (
                                            <>
                                                <div className="font-bold text-[10px] text-gray-700 mt-2 mb-1 px-2 flex justify-between items-center border-t border-gray-200 pt-2">
                                                    <span>قوالب محفوظة مخصصة (Saved Templates)</span>
                                                    {selectedTemplates.length > 0 && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMultipleSavedTemplates(selectedTemplates); setSelectedTemplates([]); }} className="text-red-600 flex items-center gap-1 text-[9px] bg-red-100 px-2 py-0.5 rounded border border-red-300">
                                                            <Trash2 size={9}/> حذف المحدد ({selectedTemplates.length})
                                                        </button>
                                                    )}
                                                </div>
                                                {savedTemplates.map((t: any) => (
                                                    <label key={t.id} className={`flex items-center gap-3 cursor-pointer p-2 border ${localTemplate === t.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-transparent'}`}>
                                                        <input type="checkbox" checked={selectedTemplates.includes(t.id)} onClick={(e) => toggleTemplateSelection(e, t.id)} onChange={() => {}} className="shrink-0"/>
                                                        <input type="radio" name="tpl" checked={localTemplate === t.id} onChange={() => setLocalTemplate(t.id)} className="shrink-0"/>
                                                        <div className="w-7 h-7 bg-purple-100 border border-purple-300 flex items-center justify-center rounded shrink-0"><Folder size={14} className="text-purple-600"/></div>
                                                        <div className="flex items-center justify-between w-full text-right">
                                                            <div>
                                                                <div className="font-bold text-[10px] text-black">{t.name || 'Untitled'}</div>
                                                                <div className="text-[9px] text-gray-500">{new Date(t.savedAt).toLocaleDateString()}</div>
                                                            </div>
                                                            {localTemplate === t.id && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSavedTemplate(t.id); }} className="p-1 hover:bg-red-200 rounded text-red-600"><Trash2 size={12}/></button>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    {/* Action Launch Button */}
                                    <div className="flex justify-end pt-3 border-t border-zinc-300 mt-3">
                                        <button
                                            onClick={() => {
                                                if (savedTemplates?.find((t: any) => t.id === localTemplate)) {
                                                    handleLoadSavedTemplate(localTemplate);
                                                } else {
                                                    handleCreateOffline(localTemplate);
                                                }
                                            }}
                                            className="px-6 h-9 font-bold w-full justify-center text-xs bg-blue-700 hover:bg-blue-600 text-white rounded border-2 border-blue-400 cursor-pointer shadow-win-out flex items-center gap-2"
                                        >
                                            <span>ابدأ اللعبة والقالب المختار الآن</span>
                                            <ChevronRight size={14} className="transform rotate-180" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 2. AI Generator Tab */}
                            {wizardTab === 'ai' && (
                                <div className="space-y-2 text-right">
                                    <p className="text-[11px] text-zinc-700 font-bold">نمط توليد اللعبة بالذكاء الاصطناعي:</p>
                                    <div className="flex gap-2 mb-1.5">
                                        <button
                                            onClick={() => setAiMode('local')}
                                            className={`flex-1 py-1.5 px-3 border-2 font-bold text-[10px] rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${aiMode === 'local' ? 'bg-purple-700 text-white border-purple-400 shadow-win-in' : 'bg-[#EBE7DD] text-zinc-700 border-zinc-400 hover:bg-zinc-200'}`}
                                        >
                                            <Sparkles size={12} className={aiMode === 'local' ? 'text-yellow-300 animate-pulse' : 'text-zinc-500'} />
                                            <span>توليد ذكي محلي (بدون نت)</span>
                                        </button>
                                        <button
                                            onClick={() => setAiMode('online')}
                                            className={`flex-1 py-1.5 px-3 border-2 font-bold text-[10px] rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${aiMode === 'online' ? 'bg-purple-700 text-white border-purple-400 shadow-win-in' : 'bg-[#EBE7DD] text-zinc-700 border-zinc-400 hover:bg-zinc-200'}`}
                                        >
                                            <Globe size={12} className={aiMode === 'online' ? 'text-cyan-300' : 'text-zinc-500'} />
                                            <span>توليد سحابي (Gemini AI)</span>
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-zinc-700 font-bold">اكتب فكرة لعبتك أو ارفع صورة فنية ليقوم الذكاء الاصطناعي بتوليد لعبة تفاعلية فريدة:</p>
                                    <div className="relative">
                                        <textarea
                                            value={prompt}
                                            onChange={e => setPrompt(e.target.value)}
                                            className="w-full h-24 p-2 border border-zinc-400 text-xs resize-none focus:outline-none focus:border-blue-400 bg-white"
                                            placeholder="مثال: لعبة منصات بطلها أرنب يجمع الجزر ويفادى العقارب البرية..."
                                            dir="auto"
                                        />
                                        <div className="absolute bottom-2 left-2 flex gap-1.5">
                                            <button onClick={handleVoiceInput} className={`p-1.5 rounded-full border text-xs cursor-pointer ${isListening ? 'bg-red-100 border-red-400 text-red-600 animate-pulse' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-blue-50'}`} title="التسجيل الصوتي">
                                                <Mic size={14}/>
                                            </button>
                                            <button onClick={() => onImageSelect()} className={`p-1.5 rounded-full border text-xs cursor-pointer ${selectedImage ? 'bg-green-100 border-green-400 text-green-600' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-blue-50'}`} title="رفع صورة مرجعية">
                                                <ImageIcon size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                    {selectedImage && (
                                        <div className="relative w-full h-16 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center overflow-hidden group rounded">
                                            <img src={selectedImage || undefined} className="h-full object-contain" alt="selected"/>
                                            <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer"><X size={10}/></button>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleGenerate(aiMode === 'local')}
                                        className="w-full h-9 justify-center font-bold text-xs bg-purple-700 hover:bg-purple-600 text-white rounded border-2 border-purple-400 cursor-pointer shadow-win-out flex items-center gap-2"
                                        disabled={!prompt && !selectedImage}
                                    >
                                        <span>توليد اللعبة بالذكاء الاصطناعي</span>
                                        <Rocket size={14} />
                                    </button>
                                </div>
                            )}

                            {/* 3. Saved Templates / Projects Tab */}
                            {wizardTab === 'recent' && (
                                <div className="space-y-1 text-right">
                                    {savedTemplates?.map((t: any) => (
                                        <button key={t.id} onClick={() => handleLoadSavedTemplate(t.id)} className="w-full text-right p-2.5 hover:bg-zinc-100 text-xs border-b border-zinc-100 flex items-center gap-2.5 cursor-pointer">
                                            <Folder size={14} className="text-purple-500 shrink-0"/>
                                            <span className="flex-1 font-bold">{t.name || 'Untitled Template'}</span>
                                            <span className="text-[10px] text-gray-500">{new Date(t.savedAt).toLocaleDateString()}</span>
                                        </button>
                                    ))}
                                    {(!savedTemplates || savedTemplates.length === 0) && (
                                        <div className="flex flex-col items-center justify-center h-36 text-gray-500 gap-2">
                                            <Folder size={32} className="text-gray-400" />
                                            <p className="text-xs font-bold">لا توجد قوالب محفوظة حالياً في متصفحك.</p>
                                            <p className="text-[10px] text-gray-400">يمكنك حفظ أي لعبة تقوم بصناعتها عبر: ملف (File) ← حفظ كقالب (Save as Template).</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
