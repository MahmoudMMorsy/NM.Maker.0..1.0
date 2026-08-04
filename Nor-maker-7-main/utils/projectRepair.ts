/**
 * projectRepair.ts
 * محرك الإصلاح التلقائي — يأخذ المشروع + الأخطاء ويُصلحها
 */

import { SpriteAsset, BackgroundAsset, SoundAsset, ScriptAsset, GameObject, RoomData, UIMenu, FontAsset, RoomSettings } from '../types';
import { ProjectIssue, ProjectSnapshot, IssueCategory } from './projectAnalyzer';
import { ErrorFix } from './errorKnowledgeDB';
import { saveFix, findLocalFix, makeSignature } from './errorKnowledgeDB';

// Fallback sprite (1x1 pixel PNG)
const FALLBACK_SPRITE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgABAAAAAQCAYAAAAf8/9hAAAAMklEQVR42mP8/5/hPwMDA8NQAwMomKYG/IcB8nXg///zsHwN/v//DwP5OvB/8HwNUA8AAElxK91j2b2AAAAAAElFTkSuQmCC";

const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  name: 'room1',
  caption: 'Room 1',
  speed: 30,
  lives: 3,
  persistent: false,
  clearView: true,
  creationCode: '',
  tileAnimSpeed: 250,
  enableViews: false,
  snapX: 16,
  snapY: 16,
  bgColor: '#C0C0C0',
  drawBgColor: true
};

const DEFAULT_BG = () => ({
  visible: false, foreground: false, source: null,
  tileH: true, tileV: true, stretch: false,
  x: 0, y: 0, hspeed: 0, vspeed: 0
});

const DEFAULT_VIEW = () => ({
  visible: false,
  viewX: 0, viewY: 0, viewW: 256, viewH: 240,
  portX: 0, portY: 0, portW: 256, portH: 240,
  followObj: null, hBorder: 32, vBorder: 32, hSpeed: -1, vSpeed: -1
});

const DEFAULT_ROOM: RoomData = {
  id: 'rm_default',
  width: 16,
  height: 15,
  map: new Array(240).fill(0),
  settings: { ...DEFAULT_ROOM_SETTINGS, name: 'room_default', caption: 'Default Room' },
  backgrounds: Array(8).fill(null).map(DEFAULT_BG),
  views: Array(8).fill(null).map(DEFAULT_VIEW)
};

export interface RepairResult {
  project: ProjectSnapshot;
  fixedIssues: ProjectIssue[];
  skippedIssues: ProjectIssue[];
  log: string[];
}

// ─── Main Repair Engine ───────────────────────────────────────────────────────

export const autoRepairProject = async (
  project: ProjectSnapshot,
  issues: ProjectIssue[],
  onlyFixable = true
): Promise<RepairResult> => {
  // نسخة عميقة من المشروع
  let fixed: ProjectSnapshot = {
    sprites: project.sprites.map(s => ({ ...s })),
    backgroundAssets: project.backgroundAssets.map(b => ({ ...b })),
    soundAssets: project.soundAssets.map(s => ({ ...s })),
    fontAssets: project.fontAssets.map(f => ({ ...f })),
    scripts: project.scripts.map(s => ({ ...s })),
    gameObjects: project.gameObjects.map(o => ({ ...o, events: { ...o.events } })),
    rooms: project.rooms.map(r => ({
      ...r,
      map: Array.isArray(r.map) ? [...r.map] : [],
      settings: { ...r.settings },
      backgrounds: Array.isArray(r.backgrounds) ? r.backgrounds.map(b => ({ ...b })) : [],
      views: Array.isArray(r.views) ? r.views.map(v => ({ ...v })) : []
    })),
    uiMenus: project.uiMenus.map(m => ({ ...m })),
    enabledExtensions: [...project.enabledExtensions]
  };

  const fixedIssues: ProjectIssue[] = [];
  const skippedIssues: ProjectIssue[] = [];
  const log: string[] = [];

  const issuesToProcess = onlyFixable ? issues.filter(i => i.fixable) : issues;

  // ── Try local DB fix first, then apply built-in fix ──────────────────────
  for (const issue of issuesToProcess) {
    // ابحث في قاعدة البيانات المحلية أولاً
    const localFix = await findLocalFix(issue.errorCode, issue.message, issue.category);
    if (localFix) {
      log.push(`📚 [DB] وُجد حل محفوظ لـ "${issue.errorCode}": ${localFix.fixDescription}`);
    }

    const payload = issue.fixPayload;
    if (!payload) {
      skippedIssues.push(issue);
      continue;
    }

    let applied = false;

    switch (payload.type) {
      // ── Sprite fixes ─────────────────────────────────────────────────────
      case 'set_fallback_src': {
        const idx = fixed.sprites.findIndex(s => s.id === payload.assetId);
        if (idx !== -1) {
          fixed.sprites[idx].src = FALLBACK_SPRITE;
          log.push(`✅ ${issue.assetName}: استُبدل بـ fallback sprite`);
          applied = true;
        }
        break;
      }

      case 'set_default_role': {
        const idx = fixed.sprites.findIndex(s => s.id === payload.assetId);
        if (idx !== -1) {
          fixed.sprites[idx].role = payload.role || 'decoration';
          log.push(`✅ ${issue.assetName}: تعيين role = "${payload.role}"`);
          applied = true;
        }
        break;
      }

      // ── Object fixes ──────────────────────────────────────────────────────
      case 'fix_sprite_ref': {
        const idx = fixed.gameObjects.findIndex(o => o.id === payload.assetId);
        if (idx !== -1) {
          fixed.gameObjects[idx].spriteId = payload.newSpriteId;
          log.push(`✅ ${issue.assetName}: تعديل spriteId → "${payload.newSpriteId || 'null'}"`);
          applied = true;
        }
        break;
      }

      case 'clear_parent': {
        const idx = fixed.gameObjects.findIndex(o => o.id === payload.assetId);
        if (idx !== -1) {
          fixed.gameObjects[idx].parent = null;
          log.push(`✅ ${issue.assetName}: مسح parent reference`);
          applied = true;
        }
        break;
      }

      case 'remove_invalid_action': {
        const idx = fixed.gameObjects.findIndex(o => o.id === payload.assetId);
        if (idx !== -1) {
          const obj = fixed.gameObjects[idx];
          const evArr = obj.events[payload.eventKey];
          if (Array.isArray(evArr)) {
            obj.events[payload.eventKey] = evArr.filter(
              (a: any) => a.libId !== payload.libId
            );
            log.push(`✅ ${issue.assetName}: حذف action تالف "${payload.libId}" من event "${payload.eventKey}"`);
            applied = true;
          }
        }
        break;
      }

      // ── Room fixes ────────────────────────────────────────────────────────
      case 'resize_map': {
        const idx = fixed.rooms.findIndex(r => r.id === payload.assetId);
        if (idx !== -1) {
          const room = fixed.rooms[idx];
          const w = room.width > 0 ? room.width : 16;
          const h = room.height > 0 ? room.height : 15;
          const expected = w * h;
          const current = Array.isArray(room.map) ? room.map : [];
          if (current.length < expected) {
            fixed.rooms[idx].map = [...current, ...new Array(expected - current.length).fill(0)];
          } else {
            fixed.rooms[idx].map = current.slice(0, expected);
          }
          log.push(`✅ ${issue.assetName}: تعديل map إلى ${expected} (${w}×${h})`);
          applied = true;
        }
        break;
      }

      case 'clear_invalid_refs': {
        const idx = fixed.rooms.findIndex(r => r.id === payload.assetId);
        if (idx !== -1 && Array.isArray(payload.indices)) {
          payload.indices.forEach((cellIdx: number) => {
            fixed.rooms[idx].map[cellIdx] = 0;
          });
          log.push(`✅ ${issue.assetName}: تصفير ${payload.indices.length} خلايا تالفة`);
          applied = true;
        }
        break;
      }

      case 'reset_dimensions': {
        const idx = fixed.rooms.findIndex(r => r.id === payload.assetId);
        if (idx !== -1) {
          fixed.rooms[idx].width = 16;
          fixed.rooms[idx].height = 15;
          fixed.rooms[idx].map = new Array(240).fill(0);
          log.push(`✅ ${issue.assetName}: إعادة تعيين الأبعاد إلى 16×15`);
          applied = true;
        }
        break;
      }

      case 'fill_default_settings': {
        const idx = fixed.rooms.findIndex(r => r.id === payload.assetId);
        if (idx !== -1) {
          const currentSettings = fixed.rooms[idx].settings || {};
          fixed.rooms[idx].settings = {
            ...DEFAULT_ROOM_SETTINGS,
            ...currentSettings,
            name: currentSettings.name || `room${idx}`,
            caption: currentSettings.caption || `Room ${idx + 1}`
          };
          log.push(`✅ ${issue.assetName}: ملء الإعدادات الناقصة`);
          applied = true;
        }
        break;
      }

      case 'fill_default_backgrounds': {
        const idx = fixed.rooms.findIndex(r => r.id === payload.assetId);
        if (idx !== -1) {
          fixed.rooms[idx].backgrounds = Array(8).fill(null).map(DEFAULT_BG);
          log.push(`✅ ${issue.assetName}: إنشاء مصفوفة backgrounds`);
          applied = true;
        }
        break;
      }

      case 'fill_default_views': {
        const idx = fixed.rooms.findIndex(r => r.id === payload.assetId);
        if (idx !== -1) {
          fixed.rooms[idx].views = Array(8).fill(null).map(DEFAULT_VIEW);
          log.push(`✅ ${issue.assetName}: إنشاء مصفوفة views`);
          applied = true;
        }
        break;
      }

      // ── Project fixes ─────────────────────────────────────────────────────
      case 'create_default_room': {
        if (fixed.rooms.length === 0) {
          fixed.rooms.push({ ...DEFAULT_ROOM });
          log.push(`✅ Project: إنشاء غرفة افتراضية rm_default`);
          applied = true;
        }
        break;
      }

      // ── Script fixes ──────────────────────────────────────────────────────
      case 'fill_placeholder_code': {
        const idx = fixed.scripts.findIndex(s => s.id === payload.assetId);
        if (idx !== -1) {
          fixed.scripts[idx].code = `// Script: ${fixed.scripts[idx].name}\n// أضف الكود هنا\n`;
          log.push(`✅ ${issue.assetName}: إضافة placeholder code`);
          applied = true;
        }
        break;
      }

      // ── Gameplay / Controls fixes ──────────────────────────────────────────
      case 'add_movement_action': {
        const idx = fixed.gameObjects.findIndex(o => o.id === payload.assetId);
        if (idx !== -1) {
          const obj = fixed.gameObjects[idx];
          if (!obj.events) obj.events = {};
          const eventKey = payload.eventKey || 'step';
          const currentEvents = obj.events[eventKey] || [];
          const actId = `ACT_${Math.random().toString(36).slice(2, 8)}`;
          const newAction = {
            id: actId,
            libId: payload.actionId || 'move_8way',
            params: payload.actionId === 'move_keyboard' ? { spd: 2, jmp: 8 } : { spd: 2 }
          };
          obj.events[eventKey] = [...currentEvents, newAction];
          log.push(`✅ ${issue.assetName}: تم إضافة حركة "${payload.actionId || 'move_8way'}" في حدث "${eventKey}"`);
          applied = true;
        }
        break;
      }

      case 'add_gravity_action': {
        const idx = fixed.gameObjects.findIndex(o => o.id === payload.assetId);
        if (idx !== -1) {
          const obj = fixed.gameObjects[idx];
          if (!obj.events) obj.events = {};
          const eventKey = 'step';
          const currentEvents = obj.events[eventKey] || [];
          const actId = `ACT_${Math.random().toString(36).slice(2, 8)}`;
          const newAction = {
            id: actId,
            libId: 'move_gravity',
            params: { amt: 0.4 }
          };
          obj.events[eventKey] = [...currentEvents, newAction];
          log.push(`✅ ${issue.assetName}: تم إضافة الجاذبية (Set Gravity = 0.4) في حدث "step"`);
          applied = true;
        }
        break;
      }

      case 'move_action_to_step': {
        const idx = fixed.gameObjects.findIndex(o => o.id === payload.assetId);
        if (idx !== -1) {
          const obj = fixed.gameObjects[idx];
          if (!obj.events) obj.events = {};
          const fromEvent = payload.fromEvent;
          if (fromEvent && Array.isArray(obj.events[fromEvent])) {
            const MOVEMENT_ACTION_IDS = new Set([
              'move_fixed', 'move_towards', 'move_hspeed', 'move_vspeed',
              'move_keyboard', 'move_8way', 'move_jump', 'move_jump_random',
              'move_wrap', 'move_snap', 'move_bounce', 'move_gravity'
            ]);
            const INPUT_ACTION_IDS = new Set([
              'move_keyboard', 'move_8way', 'control_if_key', 'control_if_any_key',
              'control_execute', 'control_if_mouse_over'
            ]);

            const actionsToMove = obj.events[fromEvent]!.filter((a: any) => MOVEMENT_ACTION_IDS.has(a?.libId) || INPUT_ACTION_IDS.has(a?.libId));
            // Remove from fromEvent
            obj.events[fromEvent] = obj.events[fromEvent]!.filter((a: any) => !(MOVEMENT_ACTION_IDS.has(a?.libId) || INPUT_ACTION_IDS.has(a?.libId)));
            // Append to step
            if (!obj.events['step']) obj.events['step'] = [];
            obj.events['step'] = [...obj.events['step']!, ...actionsToMove];
            log.push(`✅ ${issue.assetName}: تم نقل حركة الكائن من "${fromEvent}" إلى حدث "step" لتفعيل التحكم المستمر`);
            applied = true;
          }
        }
        break;
      }

      case 'place_object_in_room': {
        const objIndex = payload.objIndex;
        if (fixed.rooms.length > 0 && objIndex !== undefined) {
          const room = fixed.rooms[0]; // Place in the first room
          if (Array.isArray(room.map)) {
            let placed = false;
            const cols = room.width || 16;
            const rows = room.height || 15;

            // Look for a spot that is empty (0) but has solid ground (1) below it
            for (let r = rows - 2; r >= 0; r--) {
              for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                const belowIdx = (r + 1) * cols + c;
                if (room.map[idx] === 0 && room.map[belowIdx] === 1) {
                  room.map[idx] = objIndex;
                  placed = true;
                  break;
                }
              }
              if (placed) break;
            }

            // Otherwise, find any empty spot
            if (!placed) {
              const emptyIdx = room.map.indexOf(0);
              if (emptyIdx !== -1) {
                room.map[emptyIdx] = objIndex;
                placed = true;
              }
            }

            if (placed) {
              log.push(`✅ ${issue.assetName}: تم وضع الكائن تلقائياً في الغرفة الأولى "${room.settings?.name || room.id}"`);
              applied = true;
            } else {
              log.push(`⚠️ ${issue.assetName}: لم نجد مكاناً فارغاً في الغرفة لتسكين الكائن`);
            }
          }
        }
        break;
      }

      case 'populate_empty_room': {
        const idx = fixed.rooms.findIndex(r => r.id === payload.assetId);
        if (idx !== -1) {
          const room = fixed.rooms[idx];
          const cols = room.width || 16;
          const rows = room.height || 15;
          room.map = new Array(cols * rows).fill(0);

          // Place ground tiles (1) at bottom row
          for (let c = 0; c < cols; c++) {
            room.map[(rows - 1) * cols + c] = 1;
          }

          // Find player object
          const playerIdx = fixed.gameObjects.findIndex(o =>
            o.name.toLowerCase().includes('player') ||
            (o.spriteId && fixed.sprites.find(s => s.id === o.spriteId)?.role === 'player')
          );

          if (playerIdx !== -1) {
            const playerMapIndex = playerIdx + 2;
            const px = Math.floor(cols / 2);
            const py = rows - 2;
            room.map[py * cols + px] = playerMapIndex;
            log.push(`✅ ${issue.assetName}: تم تعبئة الغرفة بأرضية ووضع اللاعب في المنتصف`);
          } else if (fixed.gameObjects.length > 0) {
            const objMapIndex = 2;
            const px = Math.floor(cols / 2);
            const py = rows - 2;
            room.map[py * cols + px] = objMapIndex;
            log.push(`✅ ${issue.assetName}: تم تعبئة الغرفة بأرضية ووضع كائن "${fixed.gameObjects[0].name}"`);
          } else {
            log.push(`✅ ${issue.assetName}: تم رسم أرضية فقط لأنه لا توجد كائنات ألعاب بعد`);
          }
          applied = true;
        }
        break;
      }

      default:
        skippedIssues.push(issue);
        continue;
    }

    if (applied) {
      fixedIssues.push(issue);
      // احفظ الحل في قاعدة البيانات
      await saveFix({
        signature: makeSignature(issue.errorCode, issue.category),
        category: issue.category,
        errorCode: issue.errorCode,
        errorMessage: issue.message,
        fixType: 'auto',
        fixDescription: issue.fixDescription,
        fixPayload: payload,
        tags: [issue.category, issue.errorCode, issue.assetName]
      });
    } else {
      skippedIssues.push(issue);
    }
  }

  log.push(`\n📊 تم إصلاح ${fixedIssues.length} مشكلة، تخطي ${skippedIssues.length}`);

  return { project: fixed, fixedIssues, skippedIssues, log };
};
