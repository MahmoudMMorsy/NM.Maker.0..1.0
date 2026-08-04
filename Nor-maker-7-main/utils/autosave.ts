// utils/autosave.ts
// محرك الـ Autosave — IndexedDB (مش localStorage) عشان يتحمل الـ base64 الكبيرة
// يعمل debounce 3 ثواني حتى ما يحفظش عند كل ضغطة
// يدعم Recovery — لو فتح المحرر ولقى draft، يسأل المستخدم يرجعه

const DB_NAME    = 'NORMakerAutosave';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const DRAFT_KEY  = 'current_project';

let _db: IDBDatabase | null = null;
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db!); };
    req.onerror  = () => reject(req.error);
  });
}

export interface AutosaveDraft {
  sprites:          any[];
  backgroundAssets: any[];
  soundAssets:      any[];
  fontAssets:       any[];
  scripts:          any[];
  gameObjects:      any[];
  rooms:            any[];
  uiMenus:          any[];
  enabledExtensions:string[];
  gameData:         any;
  savedAt:          number;
}

// --- الحفظ (مع debounce) ---
export function scheduleSave(
  draft:     AutosaveDraft,
  onSaved?:  (ts: number) => void,
  delayMs:   number = 3000
): void {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(async () => {
    try {
      const db    = await getDB();
      const stamp = Date.now();
      await new Promise<void>((res, rej) => {
        const tx  = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put({ key: DRAFT_KEY, ...draft, savedAt: stamp });
        req.onsuccess = () => res();
        req.onerror   = () => rej(req.error);
      });
      if (onSaved) onSaved(stamp);
    } catch (err) {
      console.warn('[NOR Autosave] فشل الحفظ:', err);
    }
  }, delayMs);
}

// --- استرجاع الـ draft ---
export async function loadDraft(): Promise<AutosaveDraft | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// --- مسح الـ draft (لما يعمل New Project) ---
export async function clearDraft(): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((res, rej) => {
      const tx  = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(DRAFT_KEY);
      req.onsuccess = () => res();
      req.onerror   = () => rej(req.error);
    });
  } catch {
    // silent
  }
}

// --- فحص وجود draft (للـ recovery prompt) ---
export async function hasDraft(): Promise<{ exists: boolean; savedAt: number | null }> {
  const draft = await loadDraft();
  if (!draft) return { exists: false, savedAt: null };
  return { exists: true, savedAt: draft.savedAt };
}
