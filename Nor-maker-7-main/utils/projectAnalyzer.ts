/**
 * projectAnalyzer.ts
 * محرك الفحص المحلي — يفحص كل أصول المشروع ويُرجع تقرير شامل
 */

import { SpriteAsset, BackgroundAsset, SoundAsset, ScriptAsset, GameObject, RoomData, UIMenu, FontAsset, GameMetadata } from '../types';
import { ACTION_LIBRARY } from './actionLibrary';
import { EXTERNAL_ACTIONS } from './externalActions';

// ─── Types ───────────────────────────────────────────────────────────────────

export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueCategory = 'sprite' | 'object' | 'room' | 'script' | 'sound' | 'background' | 'project' | 'font' | 'ui' | 'gameplay';

export interface ProjectIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  errorCode: string;
  assetId: string;
  assetName: string;
  message: string;
  fixable: boolean;
  fixDescription: string;
  fixPayload?: any;
}

export interface AnalysisReport {
  issues: ProjectIssue[];
  score: number;
  autoFixCount: number;
  aiFixCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  analyzedAt: number;
}

export interface ProjectSnapshot {
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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALL_LIB_IDS = new Set([
  ...ACTION_LIBRARY.map(a => a.id),
  ...EXTERNAL_ACTIONS.map((a: any) => a.id)
]);

const VALID_DATA_URL = /^data:(image|audio|font)\//;
const VALID_BLOB_URL = /^blob:/;

const isValidSrc = (src: string | null | undefined): boolean => {
  if (!src) return false;
  return VALID_DATA_URL.test(src) || VALID_BLOB_URL.test(src) || src.startsWith('http');
};

const makeId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

// ─── Checkers ────────────────────────────────────────────────────────────────

function checkSprites(sprites: SpriteAsset[]): ProjectIssue[] {
  const issues: ProjectIssue[] = [];

  sprites.forEach(s => {
    if (!s.src || s.src.trim() === '') {
      issues.push({
        id: makeId('ISS'), severity: 'error', category: 'sprite',
        errorCode: 'EMPTY_SPRITE_SRC',
        assetId: s.id, assetName: s.name,
        message: `الصورة "${s.name}" فارغة وليس لها مصدر`,
        fixable: true,
        fixDescription: 'استبدال الـ src بـ fallback sprite',
        fixPayload: { type: 'set_fallback_src', assetId: s.id }
      });
    } else if (!isValidSrc(s.src)) {
      issues.push({
        id: makeId('ISS'), severity: 'error', category: 'sprite',
        errorCode: 'INVALID_DATAURL',
        assetId: s.id, assetName: s.name,
        message: `الصورة "${s.name}" تحتوي على مصدر تالف أو غير صالح`,
        fixable: true,
        fixDescription: 'استبدال المصدر التالف بـ fallback sprite',
        fixPayload: { type: 'set_fallback_src', assetId: s.id }
      });
    }

    if (!s.role) {
      issues.push({
        id: makeId('ISS'), severity: 'warning', category: 'sprite',
        errorCode: 'MISSING_SPRITE_ROLE',
        assetId: s.id, assetName: s.name,
        message: `الصورة "${s.name}" ليس لها دور (role) محدد`,
        fixable: true,
        fixDescription: 'تعيين الدور "decoration" كقيمة افتراضية',
        fixPayload: { type: 'set_default_role', assetId: s.id, role: 'decoration' }
      });
    }
  });

  return issues;
}

function checkObjects(objects: GameObject[], sprites: SpriteAsset[]): ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  const spriteIds = new Set(sprites.map(s => s.id));
  const objectIds = new Set(objects.map(o => o.id));
  const parentsSeen: Record<string, string> = {};

  // Precompute sprite lookups by name
  const spriteByName = new Map<string, SpriteAsset>();
  sprites.forEach(s => {
    if (s.name) spriteByName.set(s.name, s);
  });

  objects.forEach(obj => {
    // تحقق من الـ spriteId
    if (obj.spriteId && !spriteIds.has(obj.spriteId)) {
      const nameMatch = spriteByName.get(obj.spriteId);
      issues.push({
        id: makeId('ISS'), severity: 'warning', category: 'object',
        errorCode: 'MISSING_SPRITE_REF',
        assetId: obj.id, assetName: obj.name,
        message: `الكائن "${obj.name}" يشير لصورة "${obj.spriteId}" غير موجودة`,
        fixable: true,
        fixDescription: nameMatch
          ? `ربطه بالصورة "${nameMatch.name}" (${nameMatch.id})`
          : 'مسح الـ spriteId التالف',
        fixPayload: {
          type: 'fix_sprite_ref', assetId: obj.id,
          newSpriteId: nameMatch?.id ?? null
        }
      });
    }

    // تحقق من الـ parent - circular check
    if (obj.parent) {
      if (!objectIds.has(obj.parent)) {
        issues.push({
          id: makeId('ISS'), severity: 'warning', category: 'object',
          errorCode: 'INVALID_PARENT_REF',
          assetId: obj.id, assetName: obj.name,
          message: `الكائن "${obj.name}" يشير لـ parent "${obj.parent}" غير موجود`,
          fixable: true,
          fixDescription: 'مسح الـ parent reference',
          fixPayload: { type: 'clear_parent', assetId: obj.id }
        });
      } else {
        if (parentsSeen[obj.parent] === obj.id) {
          issues.push({
            id: makeId('ISS'), severity: 'error', category: 'object',
            errorCode: 'CIRCULAR_PARENT',
            assetId: obj.id, assetName: obj.name,
            message: `الكائن "${obj.name}" يُشكّل circular dependency مع parent!`,
            fixable: true,
            fixDescription: 'مسح الـ parent reference لكسر الحلقة',
            fixPayload: { type: 'clear_parent', assetId: obj.id }
          });
        }
        parentsSeen[obj.id] = obj.parent;
      }
    }

    // تحقق من الـ events
    let hasAnyEvent = false;
    if (obj.events) {
      Object.entries(obj.events).forEach(([eventKey, actions]) => {
        if (!Array.isArray(actions)) return;
        hasAnyEvent = hasAnyEvent || actions.length > 0;

        actions.forEach((action: any, idx) => {
          if (!action || !action.libId) return;
          if (!ALL_LIB_IDS.has(action.libId)) {
            issues.push({
              id: makeId('ISS'), severity: 'warning', category: 'object',
              errorCode: 'INVALID_LIBID',
              assetId: obj.id, assetName: obj.name,
              message: `الكائن "${obj.name}" → event "${eventKey}" → action[${idx}] يستخدم libId غير موجود: "${action.libId}"`,
              fixable: true,
              fixDescription: `حذف الـ action التالف من event "${eventKey}"`,
              fixPayload: { type: 'remove_invalid_action', assetId: obj.id, eventKey, actionIndex: idx, libId: action.libId }
            });
          }
        });
      });
    }

    if (!hasAnyEvent && obj.name !== 'obj_menu_ctrl') {
      issues.push({
        id: makeId('ISS'), severity: 'info', category: 'object',
        errorCode: 'NO_EVENTS',
        assetId: obj.id, assetName: obj.name,
        message: `الكائن "${obj.name}" ليس لديه أي events - لن يفعل شيئاً`,
        fixable: false,
        fixDescription: 'أضف events يدوياً من Object Editor',
      });
    }
  });

  return issues;
}

function checkRooms(rooms: RoomData[], objects: GameObject[]): ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  const maxObjIndex = objects.length + 1; // 0=empty, 1=ground, 2..N = objects

  rooms.forEach(room => {
    // تحقق من الأبعاد
    if (!room.width || room.width <= 0 || !room.height || room.height <= 0) {
      issues.push({
        id: makeId('ISS'), severity: 'error', category: 'room',
        errorCode: 'INVALID_DIMENSIONS',
        assetId: room.id, assetName: room.settings?.name || room.id,
        message: `الغرفة "${room.settings?.name}" تحتوي أبعاداً غير صالحة (${room.width}×${room.height})`,
        fixable: true,
        fixDescription: 'تعيين أبعاد افتراضية 16×15',
        fixPayload: { type: 'reset_dimensions', assetId: room.id }
      });
    } else {
      // تحقق من حجم الـ map
      const expected = room.width * room.height;
      if (!Array.isArray(room.map)) {
        issues.push({
          id: makeId('ISS'), severity: 'error', category: 'room',
          errorCode: 'MAP_SIZE_MISMATCH',
          assetId: room.id, assetName: room.settings?.name || room.id,
          message: `الغرفة "${room.settings?.name}" لا تحتوي مصفوفة map صالحة`,
          fixable: true,
          fixDescription: `إنشاء map فارغ بحجم ${expected}`,
          fixPayload: { type: 'resize_map', assetId: room.id, expected }
        });
      } else if (room.map.length !== expected) {
        issues.push({
          id: makeId('ISS'), severity: 'error', category: 'room',
          errorCode: 'MAP_SIZE_MISMATCH',
          assetId: room.id, assetName: room.settings?.name || room.id,
          message: `حجم map الغرفة "${room.settings?.name}" خاطئ: ${room.map.length} بدل ${expected}`,
          fixable: true,
          fixDescription: `تعديل حجم الـ map إلى ${expected} عنصر`,
          fixPayload: { type: 'resize_map', assetId: room.id, expected, current: room.map.length }
        });
      } else {
        // تحقق من الـ indices داخل الـ map
        const invalidRefs = room.map.reduce((acc: number[], val, idx) => {
          if (val > maxObjIndex) acc.push(idx);
          return acc;
        }, []);

        if (invalidRefs.length > 0) {
          issues.push({
            id: makeId('ISS'), severity: 'warning', category: 'room',
            errorCode: 'INVALID_OBJECT_REF',
            assetId: room.id, assetName: room.settings?.name || room.id,
            message: `الغرفة "${room.settings?.name}" تحتوي ${invalidRefs.length} خلية تشير لكائنات غير موجودة`,
            fixable: true,
            fixDescription: 'تصفير الخلايا التالفة',
            fixPayload: { type: 'clear_invalid_refs', assetId: room.id, indices: invalidRefs }
          });
        }
      }
    }

    // تحقق من الـ settings
    const s = room.settings;
    if (!s || typeof s.speed !== 'number' || !s.name) {
      issues.push({
        id: makeId('ISS'), severity: 'warning', category: 'room',
        errorCode: 'MISSING_ROOM_SETTINGS',
        assetId: room.id, assetName: room.settings?.name || room.id,
        message: `إعدادات الغرفة "${room.id}" ناقصة أو تالفة`,
        fixable: true,
        fixDescription: 'ملء الإعدادات الناقصة بالقيم الافتراضية',
        fixPayload: { type: 'fill_default_settings', assetId: room.id }
      });
    }

    // تحقق من الـ backgrounds array
    if (!Array.isArray(room.backgrounds)) {
      issues.push({
        id: makeId('ISS'), severity: 'warning', category: 'room',
        errorCode: 'MISSING_BACKGROUNDS_ARRAY',
        assetId: room.id, assetName: room.settings?.name || room.id,
        message: `مصفوفة خلفيات الغرفة "${room.settings?.name}" مفقودة`,
        fixable: true,
        fixDescription: 'إنشاء مصفوفة backgrounds افتراضية (8 عناصر)',
        fixPayload: { type: 'fill_default_backgrounds', assetId: room.id }
      });
    }

    // تحقق من الـ views array
    if (!Array.isArray(room.views)) {
      issues.push({
        id: makeId('ISS'), severity: 'info', category: 'room',
        errorCode: 'MISSING_VIEWS_ARRAY',
        assetId: room.id, assetName: room.settings?.name || room.id,
        message: `مصفوفة views الغرفة "${room.settings?.name}" مفقودة`,
        fixable: true,
        fixDescription: 'إنشاء مصفوفة views افتراضية (8 عناصر)',
        fixPayload: { type: 'fill_default_views', assetId: room.id }
      });
    }
  });

  return issues;
}

function checkScripts(scripts: ScriptAsset[]): ProjectIssue[] {
  const issues: ProjectIssue[] = [];

  scripts.forEach(s => {
    if (!s.code || s.code.trim() === '' || s.code.trim() === '// JavaScript Code') {
      issues.push({
        id: makeId('ISS'), severity: 'info', category: 'script',
        errorCode: 'EMPTY_SCRIPT',
        assetId: s.id, assetName: s.name,
        message: `السكريبت "${s.name}" فارغ`,
        fixable: true,
        fixDescription: 'إضافة comment توضيحي',
        fixPayload: { type: 'fill_placeholder_code', assetId: s.id }
      });
    } else {
      // فحص بسيط للـ syntax errors الشائعة
      const syntaxErrors = [];
      const opens = (s.code.match(/\{/g) || []).length;
      const closes = (s.code.match(/\}/g) || []).length;
      if (Math.abs(opens - closes) > 2) syntaxErrors.push(`أقواس {} غير متوازنة (${opens} مفتوح، ${closes} مغلق)`);

      const openParens = (s.code.match(/\(/g) || []).length;
      const closeParens = (s.code.match(/\)/g) || []).length;
      if (Math.abs(openParens - closeParens) > 2) syntaxErrors.push(`أقواس () غير متوازنة`);

      if (syntaxErrors.length > 0) {
        issues.push({
          id: makeId('ISS'), severity: 'warning', category: 'script',
          errorCode: 'SCRIPT_SYNTAX_ERROR',
          assetId: s.id, assetName: s.name,
          message: `السكريبت "${s.name}" قد يحتوي أخطاء: ${syntaxErrors.join(', ')}`,
          fixable: false,
          fixDescription: 'يحتاج مراجعة يدوية أو AI fix',
        });
      }
    }
  });

  return issues;
}

function checkSounds(sounds: SoundAsset[]): ProjectIssue[] {
  return sounds.filter(s => !s.src || s.src.trim() === '').map(s => ({
    id: makeId('ISS'), severity: 'warning' as IssueSeverity, category: 'sound' as IssueCategory,
    errorCode: 'EMPTY_SOUND_SRC',
    assetId: s.id, assetName: s.name,
    message: `الصوت "${s.name}" فارغ وليس له مصدر`,
    fixable: false,
    fixDescription: 'الرجاء تحميل ملف صوتي',
  }));
}

function checkBackground(bgs: BackgroundAsset[]): ProjectIssue[] {
  return bgs.filter(b => !b.src || b.src.trim() === '').map(b => ({
    id: makeId('ISS'), severity: 'info' as IssueSeverity, category: 'background' as IssueCategory,
    errorCode: 'EMPTY_BG_SRC',
    assetId: b.id, assetName: b.name,
    message: `الخلفية "${b.name}" فارغة وليس لها مصدر`,
    fixable: false,
    fixDescription: 'الرجاء تحميل صورة للخلفية',
  }));
}

function checkProject(project: ProjectSnapshot): ProjectIssue[] {
  const issues: ProjectIssue[] = [];

  if (project.rooms.length === 0) {
    issues.push({
      id: makeId('ISS'), severity: 'error', category: 'project',
      errorCode: 'NO_ROOMS',
      assetId: 'project', assetName: 'Project',
      message: 'المشروع لا يحتوي أي غرف! لن يُمكن تشغيله',
      fixable: true,
      fixDescription: 'إنشاء غرفة افتراضية rm_default',
      fixPayload: { type: 'create_default_room' }
    });
  }

  // Precompute sprite lookup by ID
  const spriteById = new Map<string, SpriteAsset>();
  project.sprites.forEach(s => {
    spriteById.set(s.id, s);
  });

  const hasPlayer = project.gameObjects.some(o =>
    o.name.toLowerCase().includes('player') || (o.spriteId ? spriteById.get(o.spriteId)?.role === 'player' : false)
  );

  if (project.gameObjects.length > 0 && !hasPlayer) {
    issues.push({
      id: makeId('ISS'), severity: 'info', category: 'project',
      errorCode: 'NO_PLAYER_OBJECT',
      assetId: 'project', assetName: 'Project',
      message: 'لا يوجد كائن player في المشروع',
      fixable: false,
      fixDescription: 'أضف كائن player يدوياً أو استخدم AI لإنشائه',
    });
  }

  return issues;
}

// ─── Gameplay Diagnostics — Why are controls not working? ────────────────────

/** كل libIds المتعلقة بالتحكم والحركة */
const MOVEMENT_ACTION_IDS = new Set([
  'move_fixed', 'move_towards', 'move_hspeed', 'move_vspeed',
  'move_keyboard', 'move_8way', 'move_jump', 'move_jump_random',
  'move_wrap', 'move_snap', 'move_bounce', 'move_gravity'
]);

const INPUT_ACTION_IDS = new Set([
  'move_keyboard', 'move_8way', 'control_if_key', 'control_if_any_key',
  'control_execute', 'control_if_mouse_over'
]);

/** Event keys التي تُشغَّل بسبب الـ input */
const KEY_EVENT_NAMES = [
  'step', 'key_left', 'key_right', 'key_up', 'key_down',
  'key_space', 'key_z', 'key_x', 'key_enter',
  'press_left', 'press_right', 'press_up', 'press_down',
  'press_space', 'press_z', 'press_x',
  'keydown', 'keyup', 'keypress'
];

// Cache for flattened object actions to avoid repetitive traversal/flat operations
const actionsCache = new WeakMap<GameObject, any[]>();

function getActionsInEvent(obj: GameObject, eventKey: string): any[] {
  if (!obj.events || !obj.events[eventKey as any]) return [];
  const ev = obj.events[eventKey as any];
  return Array.isArray(ev) ? ev : [];
}

function getAllActionsOfObj(obj: GameObject): any[] {
  if (!obj.events) return [];
  let cached = actionsCache.get(obj);
  if (!cached) {
    cached = Object.values(obj.events).flat().filter(Boolean) as any[];
    actionsCache.set(obj, cached);
  }
  return cached;
}

function hasCodeContaining(obj: GameObject, keywords: string[]): boolean {
  const allActions = getAllActionsOfObj(obj);
  return allActions.some((a: any) => {
    if (a.libId === 'control_execute' && a.params?.code) {
      return keywords.some(kw => a.params.code.includes(kw));
    }
    return false;
  });
}

function checkGameplay(project: ProjectSnapshot): ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  const { gameObjects, rooms, sprites } = project;

  if (gameObjects.length === 0 || rooms.length === 0) return [];

  // Precompute sprite lookup by ID
  const spriteById = new Map<string, SpriteAsset>();
  sprites.forEach(s => {
    spriteById.set(s.id, s);
  });

  // ── ❶ اكتشاف الكائن "Player" ─────────────────────────────────────────────
  const playerObjects = gameObjects.filter(o => {
    const nameLower = o.name.toLowerCase();
    const hasPlayerName = nameLower.includes('player') || nameLower.startsWith('pl_') || nameLower === 'obj_pl';
    const hasPlayerSprite = o.spriteId ? spriteById.get(o.spriteId)?.role === 'player' : false;
    return hasPlayerName || hasPlayerSprite;
  });

  const controllableObjects = playerObjects.length > 0 ? playerObjects : gameObjects;

  // Precompute a set of all indices placed in any room to speed up isPlacedInAnyRoom checks from O(N * R * M) to O(R * M) + O(1)
  const placedIndices = new Set<number>();
  rooms.forEach(room => {
    if (Array.isArray(room.map)) {
      room.map.forEach(val => {
        if (val > 1) {
          placedIndices.add(val);
        }
      });
    }
  });

  controllableObjects.forEach(obj => {
    const allActions = getAllActionsOfObj(obj);

    // ── ❷ هل يوجد أي action للحركة على الإطلاق؟ ────────────────────────────
    const hasAnyMovement = allActions.some((a: any) => MOVEMENT_ACTION_IDS.has(a?.libId));
    const hasInputCode = hasCodeContaining(obj, ['Input.keys', 'Input.mouse', 'keydown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'keyboard_check']);

    if (!hasAnyMovement && !hasInputCode) {
      issues.push({
        id: makeId('GP'),
        severity: 'error',
        category: 'gameplay',
        errorCode: 'NO_MOVEMENT_ACTIONS',
        assetId: obj.id,
        assetName: obj.name,
        message: `🎮 الكائن "${obj.name}" لا يحتوي أي action للتحكم/الحركة — التحكم لن يعمل أبداً`,
        fixable: true,
        fixDescription: 'إضافة action "8-Way Movement" على event "step"',
        fixPayload: { type: 'add_movement_action', assetId: obj.id, actionId: 'move_8way', eventKey: 'step' }
      });
      return; // لا داعي لفحوصات تفصيلية إذا لا يوجد movement أصلاً
    }

    // ── ❸ هل التحكم موجود لكن ليس في **step** event؟ ───────────────────────
    const stepActions = getActionsInEvent(obj, 'step');
    const hasMovementInStep = stepActions.some((a: any) => MOVEMENT_ACTION_IDS.has(a?.libId) || INPUT_ACTION_IDS.has(a?.libId));
    const hasInputCodeInStep = (() => {
      const stepEvCode = stepActions.find((a: any) => a?.libId === 'control_execute')?.params?.code || '';
      return ['Input.keys', 'ArrowLeft', 'ArrowRight', 'keyboard_check', 'dx =', 'dy ='].some(k => stepEvCode.includes(k));
    })();

    if (hasAnyMovement && !hasMovementInStep && !hasInputCodeInStep) {
      // ابحث في أي event وُجد فيه
      const foundInEvents = Object.keys(obj.events || {}).filter(evKey => {
        const acts = getActionsInEvent(obj, evKey);
        return acts.some((a: any) => MOVEMENT_ACTION_IDS.has(a?.libId) || INPUT_ACTION_IDS.has(a?.libId));
      });

      issues.push({
        id: makeId('GP'),
        severity: 'error',
        category: 'gameplay',
        errorCode: 'MOVEMENT_NOT_IN_STEP',
        assetId: obj.id,
        assetName: obj.name,
        message: `🎮 الكائن "${obj.name}": action الحركة موجود في "${foundInEvents.join(', ')}" وليس في "step" — لن يتحرك`,
        fixable: foundInEvents.length > 0,
        fixDescription: foundInEvents.length > 0 ? `نقل حركة الكائن تلقائياً من حدث "${foundInEvents[0]}" إلى حدث "step"` : 'انقل action الحركة إلى event "step" في Object Editor',
        fixPayload: foundInEvents.length > 0 ? { type: 'move_action_to_step', assetId: obj.id, fromEvent: foundInEvents[0] } : undefined
      });
    }

    // ── ❹ هل يستخدم move_keyboard أو move_8way بشكل صحيح؟ ─────────────────
    const hasKeyboardMover = allActions.some((a: any) => a?.libId === 'move_keyboard' || a?.libId === 'move_8way');

    if (hasKeyboardMover && !hasMovementInStep) {
      const wrongEvent = Object.keys(obj.events || {}).find(evKey => {
        const acts = getActionsInEvent(obj, evKey);
        return evKey !== 'step' && acts.some((a: any) => a?.libId === 'move_keyboard' || a?.libId === 'move_8way');
      });

      issues.push({
        id: makeId('GP'),
        severity: 'warning',
        category: 'gameplay',
        errorCode: 'KEYBOARD_MOVER_WRONG_EVENT',
        assetId: obj.id,
        assetName: obj.name,
        message: `🎮 "${obj.name}": يستخدم move_keyboard/move_8way لكنه ليس في event "step" — سيعمل مرة واحدة فقط`,
        fixable: !!wrongEvent,
        fixDescription: wrongEvent ? `نقل move_keyboard/move_8way تلقائياً من حدث "${wrongEvent}" إلى حدث "step"` : 'تأكد أن move_keyboard في event "step" وليس create أو أي حدث آخر',
        fixPayload: wrongEvent ? { type: 'move_action_to_step', assetId: obj.id, fromEvent: wrongEvent } : undefined
      });
    }

    // ── ❺ هل الكائن موضوع فعلاً داخل غرفة؟ ─────────────────────────────────
    const objIndex = gameObjects.indexOf(obj) + 2; // 0=empty, 1=ground, 2+=objects
    const isPlacedInAnyRoom = placedIndices.has(objIndex);

    if (!isPlacedInAnyRoom) {
      issues.push({
        id: makeId('GP'),
        severity: 'error',
        category: 'gameplay',
        errorCode: 'PLAYER_NOT_IN_ROOM',
        assetId: obj.id,
        assetName: obj.name,
        message: `🗺 الكائن "${obj.name}" غير موضوع في أي غرفة — لن يظهر في اللعبة`,
        fixable: rooms.length > 0,
        fixDescription: 'وضع الكائن تلقائياً في الغرفة الأولى في خلية مناسبة',
        fixPayload: { type: 'place_object_in_room', assetId: obj.id, objIndex }
      });
    }
  });

  // ── ❻ هل يوجد step event لأي كائن مهم؟ ────────────────────────────────────
  const objectsWithNoStep = gameObjects.filter(obj => {
    if (obj.name === 'obj_menu_ctrl') return false;
    const stepActions = getActionsInEvent(obj, 'step');
    return stepActions.length === 0;
  });

  if (objectsWithNoStep.length === gameObjects.length && gameObjects.length > 0) {
    issues.push({
      id: makeId('GP'),
      severity: 'warning',
      category: 'gameplay',
      errorCode: 'NO_STEP_EVENTS',
      assetId: 'project',
      assetName: 'Project',
      message: `⚡ لا يوجد أي كائن يحتوي event "step" — اللعبة ستكون جامدة تماماً`,
      fixable: false,
      fixDescription: 'أضف event "step" لكائنات اللعبة من Object Editor',
    });
  }

  // ── ❼ هل يوجد create event على كائن بدون step? ─────────────────────────
  gameObjects.forEach(obj => {
    const createActions = getActionsInEvent(obj, 'create');
    const stepActions = getActionsInEvent(obj, 'step');
    const hasMovementInCreate = createActions.some((a: any) => MOVEMENT_ACTION_IDS.has(a?.libId));

    if (hasMovementInCreate && stepActions.length === 0) {
      issues.push({
        id: makeId('GP'),
        severity: 'warning',
        category: 'gameplay',
        errorCode: 'MOVEMENT_IN_CREATE_ONLY',
        assetId: obj.id,
        assetName: obj.name,
        message: `⚡ الكائن "${obj.name}": action الحركة في "create" بدون "step" — سيتحرك مرة واحدة عند الإنشاء فقط`,
        fixable: false,
        fixDescription: 'أضف action الحركة إلى event "step" أيضاً',
      });
    }
  });

  // ── ❽ هل الغرفة فارغة تماماً (كل الخلايا صفر)؟ ──────────────────────────
  rooms.forEach(room => {
    if (!Array.isArray(room.map)) return;
    const hasAnyObject = room.map.some(v => v > 1); // 0=empty, 1=ground, 2+=objects
    const hasGround = room.map.some(v => v === 1);

    if (!hasAnyObject) {
      issues.push({
        id: makeId('GP'),
        severity: 'warning',
        category: 'gameplay',
        errorCode: 'EMPTY_ROOM_NO_OBJECTS',
        assetId: room.id,
        assetName: room.settings?.name || room.id,
        message: `🗺 الغرفة "${room.settings?.name}" فارغة تماماً — لا توجد كائنات`,
        fixable: gameObjects.length > 0,
        fixDescription: 'رسم أرضية ووضع اللاعب في المنتصف تلقائياً',
        fixPayload: { type: 'populate_empty_room', assetId: room.id }
      });
    }

    if (!hasGround && gameObjects.some(o => {
      const acts = getAllActionsOfObj(o);
      return acts.some((a: any) => a?.libId === 'move_keyboard'); // platformer needs ground
    })) {
      issues.push({
        id: makeId('GP'),
        severity: 'info',
        category: 'gameplay',
        errorCode: 'NO_GROUND_TILES',
        assetId: room.id,
        assetName: room.settings?.name || room.id,
        message: `🗺 "${room.settings?.name}": لا توجد أرضية — اللاعب سيسقط بلا نهاية (للعبة platformer)`,
        fixable: false,
        fixDescription: 'في Room Editor، ارسم أرضية (Tile index 1) في أسفل الغرفة',
      });
    }
  });

  // ── ❾ هل يوجد كائن يستخدم move_keyboard بدون gravity؟ ────────────────────
  gameObjects.forEach(obj => {
    const allActions = getAllActionsOfObj(obj);
    const hasKeyboardPlatformer = allActions.some((a: any) => a?.libId === 'move_keyboard');
    const hasGravity = allActions.some((a: any) => a?.libId === 'move_gravity');
    const hasGravityCode = hasCodeContaining(obj, ['gravity', 'this.dy +=', 'grounded']);

    if (hasKeyboardPlatformer && !hasGravity && !hasGravityCode) {
      issues.push({
        id: makeId('GP'),
        severity: 'info',
        category: 'gameplay',
        errorCode: 'PLATFORMER_NO_GRAVITY',
        assetId: obj.id,
        assetName: obj.name,
        message: `🎮 "${obj.name}": يستخدم تحكم platformer بدون gravity — اللاعب سيطير في الهواء`,
        fixable: true,
        fixDescription: 'إضافة action "Set Gravity" في event "step"',
        fixPayload: { type: 'add_gravity_action', assetId: obj.id }
      });
    }
  });

  // ── ❿ هل كود التحكم يتضمن عملية تلقائية قد تمنع الـ input؟ ───────────────
  gameObjects.forEach(obj => {
    const allCode = getAllActionsOfObj(obj)
      .filter((a: any) => a?.libId === 'control_execute')
      .map((a: any) => a?.params?.code || '')
      .join('\n');

    // روتينات تحكم شائعة الخطأ
    if (allCode.includes('document.getElementsByTagName') || allCode.includes('window.focus')) {
      issues.push({
        id: makeId('GP'),
        severity: 'info',
        category: 'gameplay',
        errorCode: 'MANUAL_FOCUS_CODE',
        assetId: obj.id,
        assetName: obj.name,
        message: `⌨️ "${obj.name}": يحتوي كود لمعالجة focus — قد يتعارض مع نظام Input المدمج`,
        fixable: false,
        fixDescription: 'تجنب إضافة focus/blur handlers يدوياً — المحرك يديرها تلقائياً',
      });
    }

    // فحص إذا الكود يستخدم طريقة قديمة للكشف عن الـ keys
    const usesOldKeyAPI = allCode.includes('addEventListener') || allCode.includes('onkeydown') || allCode.includes('onkeyup');
    if (usesOldKeyAPI) {
      issues.push({
        id: makeId('GP'),
        severity: 'warning',
        category: 'gameplay',
        errorCode: 'LEGACY_KEY_HANDLER',
        assetId: obj.id,
        assetName: obj.name,
        message: `⌨️ "${obj.name}": يستخدم addEventListener/onkeydown مباشرة بدلاً من Input.keys — قد لا يعمل في الـ iframe`,
        fixable: false,
        fixDescription: 'استبدل بـ: Input.keys["ArrowLeft"] بدلاً من addEventListener("keydown")',
      });
    }

    // فحص مشكلة شائعة جداً: استخدام "e.preventDefault" بشكل خاطئ
    if (allCode.includes('preventDefault') && !allCode.includes('// ')) {
      issues.push({
        id: makeId('GP'),
        severity: 'info',
        category: 'gameplay',
        errorCode: 'PREVENT_DEFAULT_MISUSE',
        assetId: obj.id,
        assetName: obj.name,
        message: `⌨️ "${obj.name}": يستخدم preventDefault — تأكد أنه لا يمنع أحداث التحكم الأساسية`,
        fixable: false,
        fixDescription: 'استخدم Input.keys المدمج بدلاً من معالجة أحداث DOM يدوياً',
      });
    }
  });

  return issues;
}

// ─── Main Analyzer ───────────────────────────────────────────────────────────

export const analyzeProject = (project: ProjectSnapshot): AnalysisReport => {
  const allIssues: ProjectIssue[] = [
    ...checkSprites(project.sprites),
    ...checkBackground(project.backgroundAssets),
    ...checkSounds(project.soundAssets),
    ...checkScripts(project.scripts),
    ...checkObjects(project.gameObjects, project.sprites),
    ...checkRooms(project.rooms, project.gameObjects),
    ...checkProject(project),
    ...checkGameplay(project),
  ];

  const errorCount = allIssues.filter(i => i.severity === 'error').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;
  const infoCount = allIssues.filter(i => i.severity === 'info').length;
  const autoFixCount = allIssues.filter(i => i.fixable).length;
  const aiFixCount = 0; // سيتم احتسابه بعد البحث في قاعدة البيانات

  // حساب Health Score
  const penalty = errorCount * 15 + warningCount * 5 + infoCount * 1;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    issues: allIssues,
    score,
    autoFixCount,
    aiFixCount,
    errorCount,
    warningCount,
    infoCount,
    analyzedAt: Date.now()
  };
};
