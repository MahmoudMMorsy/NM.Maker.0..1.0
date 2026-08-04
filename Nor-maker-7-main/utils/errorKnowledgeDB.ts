/**
 * errorKnowledgeDB.ts
 * قاعدة بيانات IndexedDB تحفظ كل خطأ تم حله ونوع إصلاحه.
 * تُستخدم لإيجاد الحلول محلياً دون الحاجة للإنترنت.
 */

const DB_NAME = 'NORKnowledgeDB';
const DB_VERSION = 2;
const STORE_ERRORS = 'error_fixes';
const STORE_PATTERNS = 'error_patterns';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ErrorFix {
  id: string;
  signature: string;
  category: 'sprite' | 'object' | 'room' | 'script' | 'sound' | 'background' | 'project' | 'runtime' | 'font' | 'ui' | 'gameplay';
  errorCode: string;
  errorMessage: string;  // النص الكامل للخطأ
  fixType: 'auto' | 'ai' | 'manual';
  fixDescription: string; // وصف الإصلاح الذي نجح
  fixPayload?: any;       // البيانات المستخدمة في الإصلاح (اختياري)
  solvedAt: number;       // timestamp
  timesApplied: number;   // عدد مرات تطبيق هذا الإصلاح
  successRate: number;    // نسبة النجاح 0-100
  tags: string[];         // كلمات مفتاحية للبحث
}

export interface ErrorPattern {
  id: string;
  pattern: string;        // regex أو نص يطابق أخطاء متشابهة
  genericFix: string;     // وصف الحل العام
  category: string;
  priority: number;       // أولوية المطابقة (أعلى = أهم)
}

// ─── DB Init ─────────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

export const initKnowledgeDB = (): Promise<IDBDatabase> => {
  if (_db) return Promise.resolve(_db);

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // جدول حلول الأخطاء
      if (!db.objectStoreNames.contains(STORE_ERRORS)) {
        const store = db.createObjectStore(STORE_ERRORS, { keyPath: 'id' });
        store.createIndex('signature', 'signature', { unique: false });
        store.createIndex('errorCode', 'errorCode', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('solvedAt', 'solvedAt', { unique: false });
      }

      // جدول الأنماط العامة
      if (!db.objectStoreNames.contains(STORE_PATTERNS)) {
        const ps = db.createObjectStore(STORE_PATTERNS, { keyPath: 'id' });
        ps.createIndex('category', 'category', { unique: false });
      }

      // زرع البيانات الأساسية عند الإنشاء
      const tx = (e.target as IDBOpenDBRequest).transaction!;
      const patternStore = tx.objectStore(STORE_PATTERNS);
      SEED_PATTERNS.forEach(p => patternStore.put(p));

      const errorStore = tx.objectStore(STORE_ERRORS);
      SEED_ERROR_FIXES.forEach(f => errorStore.put(f));
    };

    request.onsuccess = () => {
      _db = request.result;
      resolve(_db);
    };
    request.onerror = () => reject(request.error);
  });
};

// ─── Core Operations ─────────────────────────────────────────────────────────

/** يبحث عن حل محلي مطابق */
export const findLocalFix = async (
  errorCode: string,
  errorMessage: string,
  category?: string
): Promise<ErrorFix | null> => {
  const db = await initKnowledgeDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_ERRORS, 'readonly');
    const store = tx.objectStore(STORE_ERRORS);
    const index = store.index('errorCode');
    const req = index.getAll(errorCode);

    req.onsuccess = () => {
      const matches: ErrorFix[] = req.result || [];

      if (matches.length === 0) {
        // بحث بالنص إذا لم يطابق الكود
        const allReq = store.getAll();
        allReq.onsuccess = () => {
          const all: ErrorFix[] = allReq.result || [];
          const textMatch = all.find(fix => {
            const msgMatch = fix.errorMessage.toLowerCase().includes(errorMessage.toLowerCase().slice(0, 30));
            const catMatch = !category || fix.category === category;
            return msgMatch && catMatch && fix.successRate >= 70;
          });
          resolve(textMatch || null);
        };
        allReq.onerror = () => resolve(null);
        return;
      }

      // رتّب بحسب معدل النجاح وأحدث استخدام
      const best = matches
        .filter(m => !category || m.category === category)
        .sort((a, b) => (b.successRate + b.timesApplied) - (a.successRate + a.timesApplied))[0];

      resolve(best || null);
    };
    req.onerror = () => resolve(null);
  });
};

/** يحفظ خطأ وحله في قاعدة البيانات */
export const saveFix = async (fix: Omit<ErrorFix, 'id' | 'solvedAt' | 'timesApplied' | 'successRate'>): Promise<string> => {
  const db = await initKnowledgeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ERRORS, 'readwrite');
    const store = tx.objectStore(STORE_ERRORS);

    // تحقق أولاً إذا يوجد سجل بنفس الـ errorCode
    const idx = store.index('errorCode');
    const findReq = idx.getAll(fix.errorCode);

    findReq.onsuccess = () => {
      const existing: ErrorFix[] = findReq.result || [];
      const dup = existing.find(e => e.fixType === fix.fixType && e.category === fix.category);

      if (dup) {
        // زد العداد وحسّن معدل النجاح
        const updated: ErrorFix = {
          ...dup,
          timesApplied: dup.timesApplied + 1,
          successRate: Math.min(100, dup.successRate + 5),
          fixPayload: fix.fixPayload || dup.fixPayload,
          tags: [...new Set([...dup.tags, ...fix.tags])]
        };
        store.put(updated);
        resolve(dup.id);
      } else {
        const newFix: ErrorFix = {
          ...fix,
          id: `fix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          solvedAt: Date.now(),
          timesApplied: 1,
          successRate: fix.fixType === 'auto' ? 90 : fix.fixType === 'ai' ? 80 : 70,
        };
        const putReq = store.put(newFix);
        putReq.onsuccess = () => resolve(newFix.id);
        putReq.onerror = () => reject(putReq.error);
      }
    };
    findReq.onerror = () => reject(findReq.error);
  });
};

/** يُنقص معدل النجاح إذا فشل الإصلاح */
export const reportFixFailed = async (fixId: string): Promise<void> => {
  const db = await initKnowledgeDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_ERRORS, 'readwrite');
    const store = tx.objectStore(STORE_ERRORS);
    const req = store.get(fixId);
    req.onsuccess = () => {
      if (req.result) {
        const updated = { ...req.result, successRate: Math.max(0, req.result.successRate - 15) };
        store.put(updated);
      }
      resolve();
    };
    req.onerror = () => resolve();
  });
};

/** جلب كل السجلات (للعرض في الـ UI) */
export const getAllFixes = async (): Promise<ErrorFix[]> => {
  const db = await initKnowledgeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ERRORS, 'readonly');
    const store = tx.objectStore(STORE_ERRORS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

/** حذف سجل محدد */
export const deleteFix = async (id: string): Promise<void> => {
  const db = await initKnowledgeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ERRORS, 'readwrite');
    const store = tx.objectStore(STORE_ERRORS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/** تصدير قاعدة البيانات كـ JSON */
export const exportKnowledgeDB = async (): Promise<string> => {
  const fixes = await getAllFixes();
  return JSON.stringify({ version: DB_VERSION, exportedAt: Date.now(), fixes }, null, 2);
};

/** استيراد قاعدة بيانات من JSON */
export const importKnowledgeDB = async (json: string): Promise<number> => {
  const db = await initKnowledgeDB();
  const data = JSON.parse(json);
  const fixes: ErrorFix[] = data.fixes || [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ERRORS, 'readwrite');
    const store = tx.objectStore(STORE_ERRORS);
    let count = 0;
    fixes.forEach(fix => {
      store.put(fix);
      count++;
    });
    tx.oncomplete = () => resolve(count);
    tx.onerror = () => reject(tx.error);
  });
};

/** توليد signature (بصمة) مختصرة لخطأ ما */
export const makeSignature = (errorCode: string, category: string): string => {
  return `${category}::${errorCode}`.toLowerCase().replace(/[^a-z0-9:_]/g, '_');
};

// ─── Seed Data: أخطاء شائعة مبنية مسبقاً ────────────────────────────────────

const SEED_ERROR_FIXES: ErrorFix[] = [
  {
    id: 'seed_001',
    signature: 'sprite::empty_src',
    category: 'sprite',
    errorCode: 'EMPTY_SPRITE_SRC',
    errorMessage: 'Sprite has no image source',
    fixType: 'auto',
    fixDescription: 'استبدل الـ src بـ fallback pixel sprite',
    fixPayload: { action: 'set_fallback_src' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 95,
    tags: ['sprite', 'empty', 'src', 'missing', 'image']
  },
  {
    id: 'seed_002',
    signature: 'room::map_size_mismatch',
    category: 'room',
    errorCode: 'MAP_SIZE_MISMATCH',
    errorMessage: 'Room map array length does not match width × height',
    fixType: 'auto',
    fixDescription: 'تعديل حجم الـ map بالـ padding بالأصفار أو الحذف من النهاية',
    fixPayload: { action: 'resize_map' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 98,
    tags: ['room', 'map', 'size', 'mismatch', 'width', 'height']
  },
  {
    id: 'seed_003',
    signature: 'room::invalid_object_ref',
    category: 'room',
    errorCode: 'INVALID_OBJECT_REF',
    errorMessage: 'Room map references an object index that does not exist in gameObjects',
    fixType: 'auto',
    fixDescription: 'استبدل الـ indices غير الصالحة بـ 0 (فراغ)',
    fixPayload: { action: 'clear_invalid_refs' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 95,
    tags: ['room', 'map', 'object', 'reference', 'invalid', 'index']
  },
  {
    id: 'seed_004',
    signature: 'object::invalid_libid',
    category: 'object',
    errorCode: 'INVALID_LIBID',
    errorMessage: 'GameAction references a libId that does not exist in ACTION_LIBRARY',
    fixType: 'auto',
    fixDescription: 'حذف الـ actions التي تحتوي libId غير موجود',
    fixPayload: { action: 'remove_invalid_actions' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 90,
    tags: ['object', 'action', 'libid', 'invalid', 'library']
  },
  {
    id: 'seed_005',
    signature: 'object::missing_sprite',
    category: 'object',
    errorCode: 'MISSING_SPRITE_REF',
    errorMessage: 'Object references a spriteId that does not exist in sprites list',
    fixType: 'auto',
    fixDescription: 'مسح الـ spriteId أو ربطه بـ sprite بنفس الاسم إن وُجد',
    fixPayload: { action: 'fix_sprite_ref' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 88,
    tags: ['object', 'sprite', 'reference', 'missing', 'id']
  },
  {
    id: 'seed_006',
    signature: 'project::no_rooms',
    category: 'project',
    errorCode: 'NO_ROOMS',
    errorMessage: 'Project has no rooms defined',
    fixType: 'auto',
    fixDescription: 'إنشاء غرفة بيضاء افتراضية rm_default',
    fixPayload: { action: 'create_default_room' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 99,
    tags: ['project', 'rooms', 'empty', 'missing']
  },
  {
    id: 'seed_007',
    signature: 'room::missing_settings',
    category: 'room',
    errorCode: 'MISSING_ROOM_SETTINGS',
    errorMessage: 'Room settings object is incomplete or missing required fields',
    fixType: 'auto',
    fixDescription: 'ملء الـ settings الناقصة بالقيم الافتراضية',
    fixPayload: { action: 'fill_default_settings' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 99,
    tags: ['room', 'settings', 'missing', 'defaults']
  },
  {
    id: 'seed_008',
    signature: 'script::empty_code',
    category: 'script',
    errorCode: 'EMPTY_SCRIPT',
    errorMessage: 'Script asset has empty or null code',
    fixType: 'auto',
    fixDescription: 'استبدال الكود الفارغ بـ comment توضيحي',
    fixPayload: { action: 'fill_placeholder_code' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 95,
    tags: ['script', 'empty', 'code', 'null']
  },
  {
    id: 'seed_009',
    signature: 'object::no_player',
    category: 'project',
    errorCode: 'NO_PLAYER_OBJECT',
    errorMessage: 'No object with player role found in the project',
    fixType: 'ai',
    fixDescription: 'الـ AI يُنشئ obj_player مع events أساسية',
    fixPayload: { action: 'ai_create_player' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 85,
    tags: ['player', 'object', 'missing', 'role']
  },
  {
    id: 'seed_010',
    signature: 'runtime::loading_hang',
    category: 'runtime',
    errorCode: 'ENGINE_LOADING_HANG',
    errorMessage: 'Game stays stuck on LOADING screen and never starts',
    fixType: 'auto',
    fixDescription: 'إعادة توليد الـ webPrototype مع تفعيل start() بشكل صريح',
    fixPayload: { action: 'regenerate_engine' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 90,
    tags: ['loading', 'hang', 'stuck', 'start', 'engine', 'runtime']
  },
  {
    id: 'seed_011',
    signature: 'sprite::invalid_dataurl',
    category: 'sprite',
    errorCode: 'INVALID_DATAURL',
    errorMessage: 'Sprite src is not a valid data URL or blob URL',
    fixType: 'auto',
    fixDescription: 'استبدال الـ URL الفاسد بـ fallback sprite',
    fixPayload: { action: 'set_fallback_src' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 92,
    tags: ['sprite', 'dataurl', 'invalid', 'corrupt', 'blob']
  },
  {
    id: 'seed_012',
    signature: 'object::circular_parent',
    category: 'object',
    errorCode: 'CIRCULAR_PARENT',
    errorMessage: 'Object parent reference creates a circular dependency',
    fixType: 'auto',
    fixDescription: 'مسح الـ parent reference لكسر الـ circular dependency',
    fixPayload: { action: 'clear_parent' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 95,
    tags: ['object', 'parent', 'circular', 'dependency']
  },
  {
    id: 'seed_013',
    signature: 'room::negative_dimensions',
    category: 'room',
    errorCode: 'INVALID_DIMENSIONS',
    errorMessage: 'Room width or height is zero or negative',
    fixType: 'auto',
    fixDescription: 'تعيين الأبعاد الافتراضية 16×15',
    fixPayload: { action: 'reset_dimensions' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 99,
    tags: ['room', 'width', 'height', 'zero', 'negative', 'invalid']
  },
  {
    id: 'seed_014',
    signature: 'runtime::syntax_error',
    category: 'runtime',
    errorCode: 'SCRIPT_SYNTAX_ERROR',
    errorMessage: 'Script contains a JavaScript syntax error',
    fixType: 'ai',
    fixDescription: 'الـ AI يصلح الـ syntax error في الكود',
    fixPayload: { action: 'ai_fix_syntax' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 80,
    tags: ['script', 'syntax', 'error', 'javascript', 'code']
  },
  {
    id: 'seed_015',
    signature: 'project::missing_backgrounds',
    category: 'room',
    errorCode: 'MISSING_BACKGROUNDS_ARRAY',
    errorMessage: 'Room backgrounds array is null or undefined',
    fixType: 'auto',
    fixDescription: 'إنشاء مصفوفة backgrounds افتراضية (8 عناصر فارغة)',
    fixPayload: { action: 'fill_default_backgrounds' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 99,
    tags: ['room', 'backgrounds', 'null', 'missing', 'array']
  },
  {
    id: 'seed_016',
    signature: 'gameplay::no_movement_actions',
    category: 'gameplay',
    errorCode: 'NO_MOVEMENT_ACTIONS',
    errorMessage: 'Player object has no movement or control actions in any event',
    fixType: 'auto',
    fixDescription: 'أضف action "8-Way Movement" (move_8way) في event "step" للكائن',
    fixPayload: { action: 'add_movement_action', actionId: 'move_8way', eventKey: 'step' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 92,
    tags: ['controls', 'movement', 'input', 'keyboard', 'player', 'step', 'not working']
  },
  {
    id: 'seed_017',
    signature: 'gameplay::movement_not_in_step',
    category: 'gameplay',
    errorCode: 'MOVEMENT_NOT_IN_STEP',
    errorMessage: 'Movement action exists but is not in the step event',
    fixType: 'manual',
    fixDescription: 'انقل action الحركة من event حالي إلى event "step" في Object Editor',
    fixPayload: { action: 'move_to_step_event' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 95,
    tags: ['controls', 'movement', 'step', 'event', 'wrong event', 'create']
  },
  {
    id: 'seed_018',
    signature: 'gameplay::player_not_in_room',
    category: 'gameplay',
    errorCode: 'PLAYER_NOT_IN_ROOM',
    errorMessage: 'Player object is not placed in any room map',
    fixType: 'manual',
    fixDescription: 'افتح Room Editor واضغط على الكائن في القائمة، ثم ارسمه في الغرفة',
    fixPayload: { action: 'place_in_room' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 99,
    tags: ['player', 'room', 'map', 'placed', 'not in room', 'invisible', 'missing']
  },
  {
    id: 'seed_019',
    signature: 'gameplay::legacy_key_handler',
    category: 'gameplay',
    errorCode: 'LEGACY_KEY_HANDLER',
    errorMessage: 'Object uses addEventListener/onkeydown instead of Input.keys',
    fixType: 'manual',
    fixDescription: 'استبدل addEventListener("keydown") بـ Input.keys["ArrowLeft"] داخل event "step"',
    fixPayload: { action: 'replace_legacy_key_handler' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 88,
    tags: ['keyboard', 'input', 'addeventlistener', 'onkeydown', 'iframe', 'legacy', 'controls']
  },
  {
    id: 'seed_020',
    signature: 'gameplay::platformer_no_gravity',
    category: 'gameplay',
    errorCode: 'PLATFORMER_NO_GRAVITY',
    errorMessage: 'Platformer object using move_keyboard has no gravity set',
    fixType: 'auto',
    fixDescription: 'أضف action "Set Gravity" بقيمة 0.5 في event "step"',
    fixPayload: { action: 'add_gravity_action' },
    solvedAt: 0,
    timesApplied: 0,
    successRate: 90,
    tags: ['platformer', 'gravity', 'flying', 'jump', 'grounded', 'physics']
  }
];

const SEED_PATTERNS: ErrorPattern[] = [
  {
    id: 'pat_001',
    pattern: 'Cannot read prop',
    genericFix: 'الـ property غير موجود - تحقق من أن الكائن مُعرَّف قبل الوصول إليه',
    category: 'runtime',
    priority: 10
  },
  {
    id: 'pat_002',
    pattern: 'is not a function',
    genericFix: 'الـ function غير موجودة - تحقق من أن الـ libId صحيح',
    category: 'object',
    priority: 9
  },
  {
    id: 'pat_003',
    pattern: 'undefined is not',
    genericFix: 'قيمة غير مُعرَّفة - تحقق من الـ references والـ IDs',
    category: 'runtime',
    priority: 8
  },
  {
    id: 'pat_004',
    pattern: 'map.*length',
    genericFix: 'حجم الـ map غير متطابق مع أبعاد الغرفة',
    category: 'room',
    priority: 9
  },
  {
    id: 'pat_005',
    pattern: 'LOADING',
    genericFix: 'المحرك عالق - تحقق من وجود start() أو أعد توليد المشروع',
    category: 'runtime',
    priority: 10
  }
];
