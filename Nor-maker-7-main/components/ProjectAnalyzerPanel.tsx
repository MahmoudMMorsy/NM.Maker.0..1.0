import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle, CheckCircle, Info, Wrench, Brain, Database, Download,
  Upload, RefreshCw, X, ChevronDown, ChevronRight, Zap, Shield, Search,
  Trash2, Activity, Clock, HardDrive
} from 'lucide-react';
import { ProjectSnapshot, analyzeProject, AnalysisReport, ProjectIssue } from '../utils/projectAnalyzer';
import { autoRepairProject } from '../utils/projectRepair';
import { aiAnalyzeAndRepairProject } from '../services/geminiService';
import { getAllFixes, deleteFix, exportKnowledgeDB, importKnowledgeDB, ErrorFix } from '../utils/errorKnowledgeDB';
import { SpriteAsset, BackgroundAsset, SoundAsset, FontAsset, ScriptAsset, GameObject, RoomData, UIMenu, GameMetadata } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectAnalyzerPanelProps {
  sprites: SpriteAsset[];
  backgroundAssets: BackgroundAsset[];
  soundAssets: SoundAsset[];
  fontAssets: FontAsset[];
  scripts: ScriptAsset[];
  gameObjects: GameObject[];
  rooms: RoomData[];
  uiMenus: UIMenu[];
  enabledExtensions: string[];
  metadata?: GameMetadata;
  onApplyFix: (fixed: ProjectSnapshot) => void;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const SeverityIcon = ({ severity }: { severity: string }) => {
  if (severity === 'error') return <AlertTriangle size={13} className="text-red-500 shrink-0" />;
  if (severity === 'warning') return <AlertTriangle size={13} className="text-yellow-500 shrink-0" />;
  return <Info size={13} className="text-blue-500 shrink-0" />;
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const cls = severity === 'error'
    ? 'bg-red-100 text-red-700 border-red-300'
    : severity === 'warning'
      ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
      : 'bg-blue-100 text-blue-700 border-blue-300';
  return (
    <span className={`text-[8px] font-bold px-1.5 py-0.5 border rounded-full uppercase ${cls}`}>
      {severity}
    </span>
  );
};

const ScoreRing = ({ score }: { score: number }) => {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-black leading-none" style={{ color }}>{score}</span>
        <span className="text-[7px] text-gray-500 font-bold">HEALTH</span>
      </div>
    </div>
  );
};

export const GAME_GENRE_OPTIONS = [
  { value: 'platformer', label: 'ألعاب منصات / مغامرات جانبية (Platformer)' },
  { value: 'rpg', label: 'ألعاب تقمص أدوار / استكشاف ومتاهة (RPG / Adventure)' },
  { value: 'shooter', label: 'ألعاب إطلاق نار / فضاء وأركيد (Shooter / Space)' },
  { value: 'runner', label: 'ألعاب جري لانهائي وتفادي عقبات (Endless Runner)' },
  { value: 'puzzle', label: 'ألعاب ألغاز وتحدي ذكاء (Puzzle / Maze)' },
  { value: 'fighting', label: 'ألعاب قتال وتلاحم (Fighting / Beat \'em Up)' },
  { value: 'racing', label: 'ألعاب سباقات وسرعة (Racing)' },
  { value: 'strategy', label: 'ألعاب استراتيجية وتخطيط (Strategy)' },
  { value: 'arcade', label: 'ألعاب أركيد كلاسيكية (Classic Arcade / Retro)' },
  { value: 'other', label: 'أخرى / نمط لعب مخصص (Custom Style)' }
];

// ─── Main Panel ───────────────────────────────────────────────────────────────

const ProjectAnalyzerPanel: React.FC<ProjectAnalyzerPanelProps> = ({
  sprites, backgroundAssets, soundAssets, fontAssets,
  scripts, gameObjects, rooms, uiMenus, enabledExtensions,
  metadata,
  onApplyFix
}) => {
  const [tab, setTab] = useState<'analyzer' | 'knowledge'>('analyzer');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairLog, setRepairLog] = useState<string[]>([]);
  const [fixedCount, setFixedCount] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [knowledgeEntries, setKnowledgeEntries] = useState<ErrorFix[]>([]);
  const [dbSearch, setDbSearch] = useState('');
  const [isLoadingDB, setIsLoadingDB] = useState(false);
  const dbImportRef = useRef<HTMLInputElement>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('platformer');
  const [aiObservations, setAiObservations] = useState<string[]>([]);
  const [aiShortages, setAiShortages] = useState<string[]>([]);
  const [isAiRepairing, setIsAiRepairing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Synchronize genre state with game metadata if present
  useEffect(() => {
    if (metadata?.genre) {
      const lowercaseGenre = metadata.genre.toLowerCase();
      if (lowercaseGenre.includes('platformer') || lowercaseGenre.includes('منصات')) {
        setSelectedGenre('platformer');
      } else if (lowercaseGenre.includes('rpg') || lowercaseGenre.includes('تقمص') || lowercaseGenre.includes('أدوار')) {
        setSelectedGenre('rpg');
      } else if (lowercaseGenre.includes('shooter') || lowercaseGenre.includes('إطلاق') || lowercaseGenre.includes('نار')) {
        setSelectedGenre('shooter');
      } else if (lowercaseGenre.includes('runner') || lowercaseGenre.includes('جري')) {
        setSelectedGenre('runner');
      } else if (lowercaseGenre.includes('puzzle') || lowercaseGenre.includes('ألغاز')) {
        setSelectedGenre('puzzle');
      } else if (lowercaseGenre.includes('fighting') || lowercaseGenre.includes('قتال')) {
        setSelectedGenre('fighting');
      } else if (lowercaseGenre.includes('racing') || lowercaseGenre.includes('سباق')) {
        setSelectedGenre('racing');
      } else if (lowercaseGenre.includes('strategy') || lowercaseGenre.includes('استراتيجية')) {
        setSelectedGenre('strategy');
      } else if (lowercaseGenre.includes('arcade') || lowercaseGenre.includes('أركيد')) {
        setSelectedGenre('arcade');
      } else {
        setSelectedGenre('other');
      }
    }
  }, [metadata]);

  // Track selected issues for custom AI guided repair
  const [selectedIssueIds, setSelectedIssueIds] = useState<Record<string, boolean>>({});

  const toggleIssueSelection = (id: string) => {
    setSelectedIssueIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllIssues = () => {
    if (!report) return;
    const allSelected = report.issues.every(i => selectedIssueIds[i.id]);
    const next: Record<string, boolean> = {};
    report.issues.forEach(i => {
      next[i.id] = !allSelected;
    });
    setSelectedIssueIds(next);
  };

  const buildSnapshot = useCallback((): ProjectSnapshot => ({
    sprites, backgroundAssets, soundAssets, fontAssets,
    scripts, gameObjects, rooms, uiMenus, enabledExtensions,
    metadata
  }), [sprites, backgroundAssets, soundAssets, fontAssets, scripts, gameObjects, rooms, uiMenus, enabledExtensions, metadata]);

  const runAiRepair = async () => {
    setIsAiRepairing(true);
    setAiError(null);
    setRepairLog([]);
    setFixedCount(null);
    const snap = buildSnapshot();
    try {
      setRepairLog(['🔄 جارٍ إرسال أصول اللعبة وهيكل المشروع للفحص بالذكاء الاصطناعي...']);

      // Build guided prompt with selected issues details
      let promptToSend = aiPrompt;
      if (report && report.issues.length > 0) {
        const selectedIssues = report.issues.filter(i => selectedIssueIds[i.id]);
        if (selectedIssues.length > 0) {
          promptToSend = `[المشاكل المحددة المطلوب إصلاحها من قبل المستخدم]:\n` +
            selectedIssues.map(i => `- [${i.severity}] في الكائن/الأصل ${i.assetName} (${i.errorCode}): ${i.message}`).join('\n') +
            `\n\n[تعليمات وتوجيهات المستخدم الإضافية للإصلاح والتعديل]:\n${aiPrompt || "يرجى إصلاح وتعديل المشاكل المحددة بأفضل كود برمجى ممكن."}`;
        }
      }

      const result = await aiAnalyzeAndRepairProject(snap, promptToSend, selectedGenre);

      setAiObservations(result.aiObservations);
      setAiShortages(result.aiShortages);
      setRepairLog([
        '✅ اكتمل الفحص وتعديل المشروع بنجاح!',
        ...result.log.map(l => `🛠️ تم تعديل: ${l}`)
      ]);

      onApplyFix(result.patchedProject);

      setTimeout(() => {
        const newReport = analyzeProject(result.patchedProject);
        setReport(newReport);
        const initialSelected: Record<string, boolean> = {};
        newReport.issues.forEach(i => { initialSelected[i.id] = true; });
        setSelectedIssueIds(initialSelected);
        setFixedCount(result.log.length);
      }, 800);
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || "فشل الفحص بالذكاء الاصطناعي");
      setRepairLog([`❌ خطأ أثناء الإصلاح بالذكاء الاصطناعي: ${e.message || "فشل الاتصال بخدمة AI"}`]);
    }
    setIsAiRepairing(false);
  };

  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setRepairLog([]);
    setFixedCount(null);
    setTimeout(() => {
      const snap = buildSnapshot();
      const result = analyzeProject(snap);
      setReport(result);
      setIsAnalyzing(false);

      // فتح كل التصنيفات تلقائياً وتحديد كل المشاكل افتراضياً
      const cats: Record<string, boolean> = {};
      const initialSelected: Record<string, boolean> = {};
      result.issues.forEach(i => {
        cats[i.category] = true;
        initialSelected[i.id] = true;
      });
      setExpandedCategories(cats);
      setSelectedIssueIds(initialSelected);
    }, 400);
  }, [buildSnapshot]);

  const runAutoFix = async () => {
    if (!report) return;
    setIsRepairing(true);
    const snap = buildSnapshot();
    try {
      const result = await autoRepairProject(snap, report.issues, true);
      setRepairLog(result.log);
      setFixedCount(result.fixedIssues.length);
      onApplyFix(result.project);
      // أعد التحليل بعد الإصلاح
      setTimeout(() => {
        const newReport = analyzeProject(result.project);
        setReport(newReport);
        const initialSelected: Record<string, boolean> = {};
        newReport.issues.forEach(i => { initialSelected[i.id] = true; });
        setSelectedIssueIds(initialSelected);
      }, 600);
    } catch (e: any) {
      setRepairLog([`❌ خطأ في الإصلاح: ${e.message}`]);
    }
    setIsRepairing(false);
  };

  const runSingleFix = async (issue: ProjectIssue) => {
    const snap = buildSnapshot();
    const result = await autoRepairProject(snap, [issue], true);
    if (result.fixedIssues.length > 0) {
      onApplyFix(result.project);
      const newReport = analyzeProject(result.project);
      setReport(newReport);
      const initialSelected: Record<string, boolean> = {};
      newReport.issues.forEach(i => { initialSelected[i.id] = true; });
      setSelectedIssueIds(initialSelected);
    }
  };

  const loadKnowledge = async () => {
    setIsLoadingDB(true);
    const entries = await getAllFixes();
    setKnowledgeEntries(entries.sort((a, b) => b.timesApplied - a.timesApplied));
    setIsLoadingDB(false);
  };

  useEffect(() => {
    if (tab === 'knowledge') loadKnowledge();
  }, [tab]);

  const handleExportDB = async () => {
    const json = await exportKnowledgeDB();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nor_knowledge_${Date.now()}.json`;
    a.click();
  };

  const handleImportDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const count = await importKnowledgeDB(text);
    window.alert(`✅ تم استيراد ${count} سجل في قاعدة المعرفة`);
    loadKnowledge();
    e.target.value = '';
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteFix(id);
    loadKnowledge();
  };

  // Group issues by category (memoized to prevent re-grouping on every render)
  const grouped = React.useMemo(() => {
    return (report?.issues || []).reduce<Record<string, ProjectIssue[]>>((acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
      return acc;
    }, {});
  }, [report?.issues]);

  const filteredIssues = (issues: ProjectIssue[]) =>
    filterSeverity === 'all' ? issues : issues.filter(i => i.severity === filterSeverity);

  const categoryIcons: Record<string, React.ReactNode> = {
    sprite: <span>🖼</span>,
    object: <span>🧩</span>,
    room: <span>🗺</span>,
    script: <span>📜</span>,
    sound: <span>🔊</span>,
    background: <span>🌅</span>,
    project: <span>📁</span>,
    font: <span>🔤</span>,
    ui: <span>🖥</span>,
    runtime: <span>⚙️</span>,
    gameplay: <span>🎮</span>,
  };

  // Memoize filteredKnowledge list to optimize search filtering in the knowledge base tab
  const filteredKnowledge = React.useMemo(() => {
    return knowledgeEntries.filter(e =>
      !dbSearch || e.errorCode.includes(dbSearch) ||
      e.errorMessage.toLowerCase().includes(dbSearch.toLowerCase()) ||
      e.fixDescription.toLowerCase().includes(dbSearch.toLowerCase())
    );
  }, [knowledgeEntries, dbSearch]);

  return (
    <div className="h-full flex flex-col bg-win-face font-ui text-win-text overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-win-blue to-win-blueGrad text-white px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield size={14} className="shrink-0" />
          <div>
            <div className="font-bold text-[10px]">Project Analyzer & Repair</div>
            <div className="text-[8px] opacity-75">فحص وإصلاح مشاريع الألعاب بالذكاء الاصطناعي</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-400 bg-win-face shrink-0">
        <button
          onClick={() => setTab('analyzer')}
          className={`px-4 py-1.5 text-[9px] font-bold border-r border-gray-400 flex items-center gap-1.5 ${tab === 'analyzer' ? 'bg-white border-b-white text-win-blue' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <Activity size={11} /> محلل المشاريع
        </button>
        <button
          onClick={() => setTab('knowledge')}
          className={`px-4 py-1.5 text-[9px] font-bold flex items-center gap-1.5 ${tab === 'knowledge' ? 'bg-white border-b-white text-win-blue' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <Database size={11} /> قاعدة المعرفة
        </button>
      </div>

      {/* ── Tab: Analyzer ─────────────────────────────────────────────────────── */}
      {tab === 'analyzer' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Start Screen with Traditional vs AI options */}
          {!report && !isAnalyzing && !isAiRepairing && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto gap-4">
              <div className="text-center py-2 shrink-0">
                <Brain size={32} className="text-purple-600 mx-auto animate-pulse mb-1" />
                <h2 className="font-bold text-[11px] text-gray-800">مركز فحص وإصلاح الألعاب بالذكاء الاصطناعي 🧠</h2>
                <p className="text-[9px] text-gray-500 max-w-sm mx-auto leading-relaxed mt-1">
                  مرحباً بك في مركز فحص وإصلاح ألعاب NOR Maker بالـ AI. يمكنك تحليل أخطاء المشروع البرمجية التقليدية، أو تفويض الذكاء الاصطناعي لتشخيص النقص الفني وتعديل وإكمال اللعبة أونلاين.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Traditional rule-based scanner */}
                <div className="bg-white border border-gray-300 p-3 rounded shadow-win-out flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-win-blue mb-1">
                      <Search size={12} className="shrink-0" />
                      <span className="font-bold text-[10px]">الفحص والتحليل السريع (محلي)</span>
                    </div>
                    <p className="text-[8.5px] text-gray-500 leading-relaxed mb-3">
                      تحليل محلي سريع للبنية الهيكلية لملفات اللعبة. يكتشف الكائنات الناقصة والغرف الفارغة ويقترح إصلاحات تلقائية فورية دون استخدام الإنترنت.
                    </p>
                  </div>
                  <button
                    onClick={runAnalysis}
                    className="w-full py-1 bg-win-blue text-white text-[9px] font-bold rounded border border-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1 shadow-win-out"
                  >
                    <Search size={10} /> ابدأ الفحص التشخيصي
                  </button>
                </div>

                {/* AI-powered deep scanner & repairer */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-300 p-3 rounded shadow-win-out flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-purple-700 mb-1">
                      <Zap size={12} className="shrink-0 text-purple-600" />
                      <span className="font-bold text-[10px]">فحص وإصلاح ذكي بالذكاء الاصطناعي (أونلاين 🌐)</span>
                    </div>
                    <p className="text-[8.5px] text-gray-600 leading-relaxed mb-2">
                      ميزة فحص حقيقية بالـ AI! يقوم بمراجعة المشروع، كتابة كود التصادم والتحرك والجاذبية، تفعيل الكائنات، وإصلاح النواقص وبناء كود متكامل.
                    </p>

                    <div className="mb-2">
                      <label className="block text-[7.5px] font-bold text-purple-800 mb-0.5">نوع ونمط اللعبة المستهدف (لتوجيه منطق الذكاء الاصطناعي):</label>
                      <select
                        value={selectedGenre}
                        onChange={e => setSelectedGenre(e.target.value)}
                        className="w-full text-[8.5px] p-1 border border-purple-200 bg-white rounded outline-none focus:border-purple-500 font-sans"
                      >
                        {GAME_GENRE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-2">
                      <label className="block text-[7.5px] font-bold text-purple-800 mb-0.5">تعليمات مخصصة للإصلاح (اختياري):</label>
                      <textarea
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        className="w-full h-12 text-[8px] p-1.5 border border-purple-200 bg-white rounded outline-none focus:border-purple-500 resize-none font-sans"
                        placeholder="مثال: أضف كائن عدو ذكي يتحرك، وأصلح أخطاء الجاذبية والتصادم مع الأرض، وأضف صوت القفز..."
                      />
                    </div>
                  </div>
                  <button
                    onClick={runAiRepair}
                    className="w-full py-1 bg-purple-700 hover:bg-purple-800 text-white text-[9px] font-bold rounded border border-purple-800 flex items-center justify-center gap-1 shadow-win-out"
                  >
                    <Brain size={10} /> تشغيل مصلح الـ AI أونلاين
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-[8.5px] text-center font-bold">
                  ⚠️ خطأ: {aiError}
                </div>
              )}
            </div>
          )}

          {/* Loading and Progress Logs */}
          {(isAnalyzing || isAiRepairing) && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <RefreshCw size={24} className="text-purple-600 animate-spin" />
              <div className="text-[10px] font-bold text-purple-700 animate-pulse">
                {isAiRepairing
                  ? "جارٍ الاتصال بالذكاء الاصطناعي لفحص اللعبة وتعديلها أونلاين..."
                  : "جارٍ فحص المشروع وتحليل أسلوب اللعب والتحكم..."}
              </div>
              <p className="text-[8.5px] text-gray-500 max-w-xs leading-relaxed">
                {isAiRepairing
                  ? "يقوم الـ AI الآن بمراجعة هياكل الكود والتحكم والغرف، وإضافة الأصول وصوت اللعبة، وإصلاح العيوب تلقائياً."
                  : "يفحص أجهزة الإدخال، نظام الحركة والجاذبية، التصادمات، والصور..."}
              </p>
              {repairLog.length > 0 && (
                <div className="mt-2 w-full max-w-sm max-h-32 overflow-y-auto bg-gray-900 text-green-400 p-2 rounded text-[8px] font-mono border border-gray-700 text-left">
                  {repairLog.map((line, i) => <div key={i}>{line}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Report */}
          {report && !isAnalyzing && !isAiRepairing && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Summary Bar */}
              <div className="shrink-0 bg-white border-b border-gray-300 p-3">
                <div className="flex items-center gap-4">
                  <ScoreRing score={report.score} />
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
                      <div className="text-lg font-black text-red-600">{report.errorCount}</div>
                      <div className="text-[8px] text-red-500 font-bold">أخطاء</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
                      <div className="text-lg font-black text-yellow-600">{report.warningCount}</div>
                      <div className="text-[8px] text-yellow-500 font-bold">تحذيرات</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                      <div className="text-lg font-black text-blue-600">{report.infoCount}</div>
                      <div className="text-[8px] text-blue-500 font-bold">ملاحظات</div>
                    </div>
                  </div>
                </div>

                {/* Fixed notification */}
                {fixedCount !== null && (
                  <div className="mt-2 bg-green-50 border border-green-300 rounded p-2 flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500 shrink-0" />
                    <span className="text-[9px] text-green-700 font-bold">تم تطبيق تعديلات الـ AI وإصلاح العيوب البرمجية بنجاح!</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={runAutoFix}
                    disabled={isRepairing || report.autoFixCount === 0}
                    className="flex-1 py-1 bg-green-600 text-white text-[9px] font-bold flex items-center justify-center gap-1 disabled:opacity-40 hover:bg-green-700 shadow-win-out border border-green-500"
                  >
                    {isRepairing ? <RefreshCw size={11} className="animate-spin" /> : <Wrench size={11} />}
                    إصلاح تلقائي للعيوب ({report.autoFixCount})
                  </button>
                  <button
                    onClick={runAnalysis}
                    className="px-3 py-1 bg-win-face text-[9px] font-bold flex items-center gap-1 shadow-win-out border border-gray-400 hover:bg-gray-100"
                    title="إعادة الفحص"
                  >
                    <RefreshCw size={11} />
                  </button>
                </div>

                {/* AI Guided Smart Repair Block */}
                <div className="mt-2 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-300 rounded p-2.5 shadow-win-in">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1 text-purple-700">
                      <Brain size={12} className="text-purple-600 shrink-0" />
                      <span className="font-bold text-[9.5px]">إصلاح وتطوير موجه بالذكاء الاصطناعي (أونلاين 🌐)</span>
                    </div>
                    {report.issues.length > 0 && (
                      <span className="text-[8px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-200">
                        {report.issues.filter(i => selectedIssueIds[i.id]).length} مشاكل محددة
                      </span>
                    )}
                  </div>
                  <p className="text-[8px] text-gray-600 leading-relaxed mb-2">
                    اكتب هنا ما تريد من الذكاء الاصطناعي إصلاحه أو إضافته بدقة (مثال: "أصلح كود القفز واجعله قفزاً مضاعفاً، وأصلح الجاذبية"):
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[7.5px] font-bold text-purple-800">نوع ونمط اللعبة المستهدف:</label>
                      <select
                        value={selectedGenre}
                        onChange={e => setSelectedGenre(e.target.value)}
                        className="w-full text-[8.5px] p-1 border border-purple-200 bg-white rounded outline-none focus:border-purple-400 font-sans"
                      >
                        {GAME_GENRE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      className="w-full h-11 text-[8.5px] p-1.5 border border-purple-200 bg-white rounded outline-none focus:border-purple-400 resize-none font-sans"
                      placeholder="أدخل توجيهاتك المخصصة لمصلح الذكاء الاصطناعي..."
                    />
                    <button
                      onClick={runAiRepair}
                      className="w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-[9px] font-bold rounded shadow-win-out flex items-center justify-center gap-1 border border-purple-800"
                    >
                      <Brain size={11} />
                      {report.issues.filter(i => selectedIssueIds[i.id]).length > 0
                        ? `إصلاح المشاكل المحددة وتخصيص اللعبة بالـ AI`
                        : `تعديل وترقية اللعبة بالـ AI`}
                    </button>
                  </div>

                  {/* Render AI Observations & Shortages if present */}
                  {(aiObservations.length > 0 || aiShortages.length > 0) && (
                    <div className="mt-2 pt-2 border-t border-purple-200 grid grid-cols-1 md:grid-cols-2 gap-2 text-[7.5px] text-gray-700">
                      {aiObservations.length > 0 && (
                        <div className="bg-white border border-purple-100 p-1.5 rounded">
                          <div className="font-bold text-purple-800 mb-0.5 flex items-center gap-0.5">👁️ ملاحظات الـ AI الفنية:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-gray-600 font-sans">
                            {aiObservations.slice(0, 4).map((obs, idx) => <li key={idx} className="truncate" title={obs}>{obs}</li>)}
                          </ul>
                        </div>
                      )}
                      {aiShortages.length > 0 && (
                        <div className="bg-white border border-purple-100 p-1.5 rounded">
                          <div className="font-bold text-indigo-800 mb-0.5 flex items-center gap-0.5">🛠️ النواقص التي تم إكمالها وتعديلها:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-gray-600 font-sans">
                            {aiShortages.slice(0, 4).map((sh, idx) => <li key={idx} className="truncate" title={sh}>{sh}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Repair Log */}
                {repairLog.length > 0 && (
                  <div className="mt-2 max-h-20 overflow-y-auto bg-gray-900 text-green-400 p-1.5 rounded text-[8px] font-mono border border-gray-600">
                    {repairLog.map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                )}
              </div>

              {/* Filter & Selection Control */}
              <div className="shrink-0 flex items-center justify-between px-2 py-1.5 bg-win-face border-b border-gray-300">
                <div className="flex gap-1">
                  {(['all', 'error', 'warning', 'info'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilterSeverity(f)}
                      className={`px-2 py-0.5 text-[8px] font-bold rounded border ${filterSeverity === f ? 'bg-win-select text-white border-win-blue' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    >
                      {f === 'all' ? 'الكل' : f === 'error' ? '🔴 أخطاء' : f === 'warning' ? '🟡 تحذيرات' : '🔵 ملاحظات'}
                    </button>
                  ))}
                </div>
                {report.issues.length > 0 && (
                  <button
                    onClick={toggleAllIssues}
                    className="text-[8px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-white border border-purple-200 px-1.5 py-0.5 rounded shadow-sm hover:bg-purple-50 transition-colors"
                  >
                    {report.issues.every(i => selectedIssueIds[i.id]) ? 'إلغاء تحديد الكل' : 'تحديد الكل للإصلاح'}
                  </button>
                )}
              </div>

              {/* Issues List */}
              <div className="flex-1 overflow-y-auto">
                {report.issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-8">
                    <CheckCircle size={32} className="text-green-500" />
                    <div className="font-bold text-sm text-green-600">المشروع سليم تماماً! 🎉</div>
                    <div className="text-[9px] text-gray-500">لا توجد أخطاء أو تحذيرات</div>
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, catIssues]) => {
                    const filtered = filteredIssues(catIssues);
                    if (filtered.length === 0) return null;
                    const isExpanded = expandedCategories[category] !== false;
                    const errCount = catIssues.filter(i => i.severity === 'error').length;
                    const warnCount = catIssues.filter(i => i.severity === 'warning').length;

                    return (
                      <div key={category} className="border-b border-gray-200">
                        {/* Category Header */}
                        <button
                          onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))}
                          className="w-full flex items-center gap-2 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-left animate-fade-in"
                        >
                          {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                          <span className="text-sm">{categoryIcons[category] || '📋'}</span>
                          <span className="text-[9px] font-bold flex-1 capitalize">{category}</span>
                          {errCount > 0 && (
                            <span className="text-[8px] font-bold bg-red-100 text-red-700 px-1.5 rounded-full">{errCount}x❌</span>
                          )}
                          {warnCount > 0 && (
                            <span className="text-[8px] font-bold bg-yellow-100 text-yellow-700 px-1.5 rounded-full">{warnCount}x⚠</span>
                          )}
                        </button>

                        {/* Issues in category */}
                        {isExpanded && filtered.map(issue => (
                          <div
                            key={issue.id}
                            className={`px-3 py-2 border-b border-gray-100 flex gap-2 items-start text-[9px] hover:bg-gray-50 transition-colors
                              ${issue.severity === 'error' ? 'border-l-2 border-l-red-400' :
                                issue.severity === 'warning' ? 'border-l-2 border-l-yellow-400' :
                                'border-l-2 border-l-blue-300'}`}
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedIssueIds[issue.id]}
                              onChange={() => toggleIssueSelection(issue.id)}
                              className="mt-1 shrink-0 w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer border-gray-300 text-purple-600 focus:ring-purple-500"
                              title="تحديد لإصلاحه بالذكاء الاصطناعي"
                            />
                            <SeverityIcon severity={issue.severity} />
                            <div className="flex-1 min-w-0" onClick={() => toggleIssueSelection(issue.id)}>
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5 cursor-pointer">
                                <span className="font-bold text-gray-800 truncate">{issue.assetName}</span>
                                <SeverityBadge severity={issue.severity} />
                                <span className="text-gray-400 font-mono text-[7px]">{issue.errorCode}</span>
                              </div>
                              <div className="text-gray-600 leading-relaxed cursor-pointer">{issue.message}</div>
                              {issue.fixable && (
                                <div className="text-green-600 mt-0.5 flex items-center gap-1 cursor-pointer">
                                  <Wrench size={9} />
                                  <span>{issue.fixDescription}</span>
                                </div>
                              )}
                            </div>
                            {issue.fixable && (
                              <button
                                onClick={(e) => { e.stopPropagation(); runSingleFix(issue); }}
                                className="shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 text-[8px] font-bold rounded flex items-center gap-0.5 shadow-win-out"
                                title="إصلاح هذه المشكلة محلياً"
                              >
                                <Zap size={9} /> Fix
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Knowledge Base ────────────────────────────────────────────────── */}
      {tab === 'knowledge' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-gray-300 bg-win-face">
            <div className="flex-1 flex items-center gap-1 bg-white border border-gray-400 shadow-win-in px-1.5 py-0.5">
              <Search size={10} className="text-gray-400 shrink-0" />
              <input
                value={dbSearch}
                onChange={e => setDbSearch(e.target.value)}
                className="flex-1 text-[9px] outline-none bg-transparent min-w-0"
                placeholder="بحث في قاعدة المعرفة..."
              />
            </div>
            <button onClick={handleExportDB} className="p-1 shadow-win-out bg-win-face border border-gray-400 hover:bg-gray-100" title="تصدير قاعدة المعرفة">
              <Download size={11} />
            </button>
            <button onClick={() => dbImportRef.current?.click()} className="p-1 shadow-win-out bg-win-face border border-gray-400 hover:bg-gray-100" title="استيراد قاعدة معرفة">
              <Upload size={11} />
            </button>
            <button onClick={loadKnowledge} className="p-1 shadow-win-out bg-win-face border border-gray-400 hover:bg-gray-100" title="تحديث">
              <RefreshCw size={11} />
            </button>
            <input ref={dbImportRef} type="file" accept=".json" className="hidden" onChange={handleImportDB} />
          </div>

          {/* Stats */}
          <div className="shrink-0 flex gap-2 px-2 py-1.5 bg-white border-b border-gray-200 text-[8px]">
            <div className="flex items-center gap-1 text-gray-600">
              <HardDrive size={10} />
              <span>{knowledgeEntries.length} حل محفوظ</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle size={10} />
              <span>{knowledgeEntries.filter(e => e.fixType === 'auto').length} تلقائي</span>
            </div>
            <div className="flex items-center gap-1 text-purple-600">
              <Brain size={10} />
              <span>{knowledgeEntries.filter(e => e.fixType === 'ai').length} AI</span>
            </div>
          </div>

          {/* Entries */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingDB ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw size={20} className="animate-spin text-win-blue" />
              </div>
            ) : filteredKnowledge.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
                <Database size={28} className="text-gray-300" />
                <div className="text-[9px] text-gray-500">
                  {dbSearch ? 'لا توجد نتائج للبحث' : 'قاعدة المعرفة فارغة — ستتعبأ تلقائياً عند إصلاح الأخطاء'}
                </div>
              </div>
            ) : (
              filteredKnowledge.map(entry => (
                <div key={entry.id} className="border-b border-gray-100 px-2 py-2 hover:bg-gray-50 group">
                  <div className="flex items-start gap-1.5">
                    <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${entry.fixType === 'auto' ? 'bg-green-500' : entry.fixType === 'ai' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                      {entry.fixType === 'auto' ? <Zap size={9} /> : entry.fixType === 'ai' ? <Brain size={9} /> : <Wrench size={9} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[9px] text-gray-800 font-mono">{entry.errorCode}</span>
                        <span className="text-[7px] bg-gray-100 text-gray-500 px-1 rounded border">{entry.category}</span>
                        <span className={`text-[7px] px-1.5 rounded-full font-bold ${entry.successRate >= 80 ? 'bg-green-100 text-green-700' : entry.successRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {entry.successRate}% نجاح
                        </span>
                      </div>
                      <div className="text-[8px] text-gray-600 mt-0.5 truncate">{entry.errorMessage}</div>
                      <div className="text-[8px] text-green-600 flex items-center gap-1 mt-0.5">
                        <Wrench size={8} />
                        {entry.fixDescription}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[7px] text-gray-400">
                        <span className="flex items-center gap-0.5"><Activity size={8} /> {entry.timesApplied}× مُطبَّق</span>
                        <span className="flex items-center gap-0.5"><Clock size={8} /> {entry.solvedAt ? new Date(entry.solvedAt).toLocaleDateString('ar') : 'مُبني مسبقاً'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600"
                      title="حذف السجل"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAnalyzerPanel;
