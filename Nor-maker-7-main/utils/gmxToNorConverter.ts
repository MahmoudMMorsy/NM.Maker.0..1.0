/**
 * gmxToNorConverter.ts — v2
 * استيراد كامل لمشاريع GameMaker: Studio 1.x (.project.gmx)
 *
 * ما يُستورد:
 *   ✓ Sprites (كل الـ frames + strip detection + role inference)
 *   ✓ Sounds (filename من .sound.gmx + fallback paths)
 *   ✓ Backgrounds (data tag + fallback)
 *   ✓ Fonts (family, size, bold, italic)
 *   ✓ Scripts (.gml files)
 *   ✓ Objects (كل الـ action IDs + GML→JS transpiler)
 *   ✓ Object Parenting (inheritance)
 *   ✓ Rooms (instances + tiles + backgrounds + views + creation code)
 *   ✓ Extensions (names list)
 */

import {
  SpriteAsset, BackgroundAsset, SoundAsset, FontAsset,
  ScriptAsset, GameObject, RoomData, GameMetadata,
  EventType, GameAction
} from '../types';

export interface GmxConversionResult {
  metadata:     GameMetadata;
  sprites:      SpriteAsset[];
  backgrounds:  BackgroundAsset[];
  sounds:       SoundAsset[];
  fonts?:       FontAsset[];
  scripts:      ScriptAsset[];
  gameObjects:  GameObject[];
  rooms:        RoomData[];
  enabledExtensions?: string[];
  warnings:     string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;

const fileToText = (f: File): Promise<string> =>
  new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result as string); r.onerror=()=>rej(new Error(`Read failed: ${f.name}`)); r.readAsText(f,'utf-8'); });

const fileToDataUrl = (f: File): Promise<string> =>
  new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result as string); r.onerror=()=>rej(new Error(`Read failed: ${f.name}`)); r.readAsDataURL(f); });

const parseXml = (s: string): Document =>
  new DOMParser().parseFromString(s, 'text/xml');

/** Case-insensitive partial-path match */
// WeakMap to cache O(1) file index mapping per files array snapshot
const suffixCache = new WeakMap<File[], Map<string, File>>();
const filenameCache = new WeakMap<File[], Map<string, File>>();

function findFile(files: File[], partial: string): File | undefined {
  if (!partial) return undefined;
  const norm = partial.toLowerCase().replace(/\\/g,'/');

  let sMap = suffixCache.get(files);
  let fMap = filenameCache.get(files);
  if (!sMap || !fMap) {
    sMap = new Map<string, File>();
    fMap = new Map<string, File>();
    for (const fi of files) {
      const fp = ((fi as any).webkitRelativePath || fi.name).toLowerCase().replace(/\\/g,'/');
      // Store full path
      sMap.set(fp, fi);
      // Store path without top-level directory (e.g., MyProject/sprites/spr_player.png -> sprites/spr_player.png)
      const slashIndex = fp.indexOf('/');
      if (slashIndex !== -1) {
        sMap.set(fp.slice(slashIndex + 1), fi);
      }
      fMap.set(fi.name.toLowerCase(), fi);
    }
    suffixCache.set(files, sMap);
    filenameCache.set(files, fMap);
  }

  // O(1) Suffix lookup
  let f = sMap.get(norm);
  if (f) return f;

  // O(1) Filename-only fallback
  const fname = norm.split('/').pop() || '';
  f = fMap.get(fname);
  if (f) return f;

  // Extremely rare fallback scan
  return files.find(fi => {
    const fp = ((fi as any).webkitRelativePath || fi.name).toLowerCase().replace(/\\/g,'/');
    return fp.endsWith(norm);
  });
}

/** Infer sprite role from name */
function inferRole(name: string): SpriteAsset['role'] {
  const n = name.toLowerCase();
  if (/player|hero|char|protagonist|main/.test(n)) return 'player';
  if (/enemy|monster|boss|foe|mob/.test(n))       return 'enemy';
  if (/ground|floor|wall|tile|solid|block|plat/.test(n)) return 'ground';
  if (/item|coin|pick|collect|gem|power|bonus/.test(n))  return 'item';
  if (/bullet|proj|shot|arrow|beam/.test(n))       return 'bullet';
  return 'decoration';
}

// ─── GML → JS Transpiler (basic) ─────────────────────────────────────────────
function gmlToJs(gml: string): string {
  if (!gml.trim()) return '';
  let js = gml;

  // Variable declarations: var x = 5  →  let x = 5
  js = js.replace(/\bvar\s+/g, 'let ');

  // Booleans
  js = js.replace(/\btrue\b/g,  'true').replace(/\bfalse\b/g, 'false');

  // GML string functions → JS equivalents
  const strFns: [RegExp,string][] = [
    [/\bstring_length\s*\(/g,   '(s=>s.length)('],
    [/\bstring_pos\s*\(/g,      '((a,b)=>b.indexOf(a)+1)('],
    [/\bstring_copy\s*\(/g,     '((s,i,n)=>s.substr(i-1,n))('],
    [/\bstring_upper\s*\(/g,    '((s)=>s.toUpperCase())('],
    [/\bstring_lower\s*\(/g,    '((s)=>s.toLowerCase())('],
    [/\bstring_concat\s*\(/g,   '((a,b)=>a+b)('],
    [/\breal\s*\(/g,            'parseFloat('],
    [/\bstring\s*\(/g,          'String('],
    [/\bfloor\s*\(/g,           'Math.floor('],
    [/\bceil\s*\(/g,            'Math.ceil('],
    [/\bround\s*\(/g,           'Math.round('],
    [/\babs\s*\(/g,             'Math.abs('],
    [/\bsqrt\s*\(/g,            'Math.sqrt('],
    [/\bpower\s*\(/g,           'Math.pow('],
    [/\bsign\s*\(/g,            'Math.sign('],
    [/\bmin\s*\(/g,             'Math.min('],
    [/\bmax\s*\(/g,             'Math.max('],
    [/\bclamp\s*\(/g,           '((v,lo,hi)=>Math.min(Math.max(v,lo),hi))('],
    [/\birandom\s*\(/g,         '((n)=>Math.floor(Math.random()*(n+1)))('],
    [/\brandom\s*\(/g,          '((n)=>Math.random()*n)('],
    [/\bchoose\s*\(/g,          '((...a)=>a[Math.floor(Math.random()*a.length)])('],
    [/\bpoint_distance\s*\(/g,  '((x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1))('],
    [/\bpoint_direction\s*\(/g, '((x1,y1,x2,y2)=>(Math.atan2(-(y2-y1),x2-x1)*180/Math.PI+360)%360)('],
    [/\blengthdir_x\s*\(/g,     '((l,d)=>l*Math.cos(d*Math.PI/180))('],
    [/\blengthdir_y\s*\(/g,     '((l,d)=>-l*Math.sin(d*Math.PI/180))('],
  ];
  strFns.forEach(([re,rep]) => { js = js.replace(re, rep); });

  // GML built-ins → engine equivalents
  const builtins: [RegExp,string][] = [
    // Instance functions
    [/\binstance_create\s*\(/g,        'this.instanceCreate('],
    [/\binstance_destroy\s*\(\s*\)/g,  'this.dead=true;(()=>{})('],
    [/\binstance_destroy\s*\(/g,       '((id)=>{if(id&&id.dead!==undefined)id.dead=true;})('],
    [/\binstance_exists\s*\(/g,        '((o)=>window.instances?.some(i=>!i.dead&&(i.def?.name===o||i===o)))('],
    [/\binstance_number\s*\(/g,        '((o)=>window.instances?.filter(i=>!i.dead&&i.def?.name===o).length||0)('],
    [/\binstance_nearest\s*\(/g,       'this.instanceNearest('],
    [/\binstance_position\s*\(/g,      'this.instanceAtPos('],
    [/\bcollision_rectangle\s*\(/g,    'this.collisionRect('],
    [/\bcollision_circle\s*\(/g,       'this.collisionCircle('],
    [/\bplace_meeting\s*\(/g,          'this.placeMeeting('],
    [/\bplace_free\s*\(/g,             'this.placeFree('],
    [/\bplace_empty\s*\(/g,            'this.placeFree('],
    // Motion
    [/\bmove_towards_point\s*\(/g,     'this.moveTowards('],
    [/\bmove_snap\s*\(/g,              'this.snap('],
    [/\bmotion_add\s*\(/g,             'this.motionAdd('],
    [/\bmotion_set\s*\(/g,             'this.motionSet('],
    // Sprite
    [/(?<!\.)\bsprite_index\b/g,              'this.spriteId'],
    [/(?<!\.)\bimage_index\b/g,               'this.animFrame'],
    [/(?<!\.)\bimage_speed\b/g,               'this.animSpeed'],
    [/(?<!\.)\bimage_xscale\b/g,              'this.scaleX'],
    [/(?<!\.)\bimage_yscale\b/g,              'this.scaleY'],
    [/(?<!\.)\bimage_angle\b/g,               'this.angle'],
    [/(?<!\.)\bimage_alpha\b/g,               'this.alpha'],
    [/(?<!\.)\bimage_blend\b/g,               'this.tint'],
    // Object vars
    [/(?<!\.)\bx\b/g,           'this.x'],
    [/(?<!\.)\by\b/g,           'this.y'],
    [/(?<!\.)\bhspeed\b/g,      'this.dx'],
    [/(?<!\.)\bvspeed\b/g,      'this.dy'],
    [/(?<!\.)\bspeed\b/g,       'this.speed'],
    [/(?<!\.)\bdirection\b/g,   'this.direction'],
    [/(?<!\.)\bgravity\b/g,     'this.gravity'],
    [/(?<!\.)\bfriction\b/g,    'this.friction'],
    [/(?<!\.)\bvisible\b/g,     'this.visible'],
    [/(?<!\.)\bsolid\b/g,       'this.solid'],
    [/(?<!\.)\bdepth\b/g,       'this.depth'],
    [/(?<!\.)\bpersistent\b/g,  'this.persistent'],
    [/(?<!\.)\bmask_index\b/g,  'this.maskId'],
    // Built-in vars
    [/\broom_speed\b/g,  'window.roomSpeed||30'],
    [/\broom_width\b/g,  'window.ROOM_W||320'],
    [/\broom_height\b/g, 'window.ROOM_H||240'],
    [/\broom\b/g,        'window.currentRoomId'],
    [/\bview_xview\[0\]/g,'window.camera?.x||0'],
    [/\bview_yview\[0\]/g,'window.camera?.y||0'],
    [/\bview_wview\[0\]/g,'window.camera?.w||320'],
    [/\bview_hview\[0\]/g,'window.camera?.h||240'],
    // Score/Lives/Health
    [/\bscore\b/g,  'window.score'],
    [/\blives\b/g,  'window.lives'],
    [/\bhealth\b/g, 'window.health'],
    // Sound
    [/\baudio_play_sound\s*\(/g,  'window.audio_play_sound('],
    [/\baudio_stop_sound\s*\(/g,  'window.audio_stop_sound('],
    [/\bsound_play\s*\(/g,        'window.audio_play_sound('],
    [/\bsound_stop\s*\(/g,        'window.audio_stop_sound('],
    // Room navigation
    [/\broom_goto\s*\(/g,         'window.gotoRoom('],
    [/\broom_goto_next\s*\(\s*\)/g,'window.gotoRoom(window.currentRoomIdx+1)'],
    [/\broom_goto_previous\s*\(\s*\)/g,'window.gotoRoom(window.currentRoomIdx-1)'],
    [/\broom_restart\s*\(\s*\)/g, 'window.restartRoom()'],
    [/\bgame_restart\s*\(\s*\)/g, 'window.resetGame()'],
    [/\bgame_end\s*\(\s*\)/g,     'window.gameOver=true'],
    // Draw
    [/\bdraw_self\s*\(\s*\)/g,    'this._drawSelf()'],
    [/\bdraw_sprite\s*\(/g,       'this.drawSprite('],
    [/\bdraw_text\s*\(/g,         'this.drawText('],
    [/\bdraw_rectangle\s*\(/g,    'this.drawRect('],
    [/\bdraw_circle\s*\(/g,       'this.drawCircle('],
    [/\bdraw_set_color\s*\(/g,    'this.drawColor('],
    [/\bdraw_set_alpha\s*\(/g,    '((a)=>{this.alpha=a;})('],
    [/\bdraw_set_font\s*\(/g,     '((f)=>{})('],
    [/\bshow_message\s*\(/g,      'window.alert('],
    // Alarm
    [/\balarm\[(\d+)\]/g,         'this.alarm[$1]'],
    // Other
    [/\bkeyboard_check\s*\(/g,    'window.keyboard_check('],
    [/\bkeyboard_check_pressed\s*\(/g, 'window.keyboard_check_pressed('],
    [/\bkeyboard_check_released\s*\(/g,'window.keyboard_check_released('],
    [/\bmouse_check_button\s*\(/g,'window.mouse_check_button('],
    [/\btrigger_object\b/g,       'this'],
    [/\bother\b/g,                'this._other'],
    [/\bself\b/g,                 'this'],
    [/\bnoone\b/g,                'null'],
    [/\ball\b/g,                  '"all"'],
    [/\bglobal\./g,               'window.NOR_GLOBAL.'],
    // GML not equal
    [/\bif\s*\(/g,                'if ('],
    [/\!/g,                       '!'],
    [/&&/g,                       '&&'],
    [/\|\|/g,                     '||'],
    [/\bdiv\b/g,                  'Math.floor'],
    [/\bmod\b/g,                  '%'],
  ];
  builtins.forEach(([re, rep]) => {
    if (typeof rep === 'string') js = js.replace(re, rep);
    else js = js.replace(re, rep as any);
  });

  // exit → return
  js = js.replace(/\bexit\b/g, 'return');

  // Handle GML 2D arrays `a[0, 1]` -> `(__gml2d_get(a, 0, 1))` (or assignment)
  // To avoid writing a fully recursive descent AST, we enhance block and bracket matching.

  // 1. Convert `with (obj) { ... }` and `repeat (n) { ... }` correctly using a balanced braces parser
  js = parseGMLBlocks(js);

  return js;
}

// ─── GML Safe Structural Parser ───
function parseGMLBlocks(str: string): string {
    // 1. AST phase for 2D arrays: replace `a[i, j]` with `__gml2d(a, i, j)`
    // GML allows 2d indices via comma inside bracket. In JS arr[0,1] is invalid logic.
    // We parse balanced brackets.
    let arrPass = '';
    let arrIdx = 0;
    while (arrIdx < str.length) {
        let bStart = str.indexOf('[', arrIdx);
        if (bStart === -1) {
            arrPass += str.slice(arrIdx);
            break;
        }
        arrPass += str.slice(arrIdx, bStart);

        let bDepth = 0;
        let bEnd = -1;
        for (let j = bStart; j < str.length; j++) {
            if (str[j] === '[') bDepth++;
            else if (str[j] === ']') {
                bDepth--;
                if (bDepth === 0) {
                    bEnd = j;
                    break;
                }
            }
        }

        if (bEnd !== -1) {
            let inner = str.substring(bStart + 1, bEnd);
            // check if there's a comma at top level
            let commaIdx = -1;
            let innerDepth = 0;
            for (let k = 0; k < inner.length; k++) {
                if (inner[k] === '(' || inner[k] === '[') innerDepth++;
                else if (inner[k] === ')' || inner[k] === ']') innerDepth--;
                else if (inner[k] === ',' && innerDepth === 0) {
                    commaIdx = k;
                    break;
                }
            }

            if (commaIdx !== -1) {
                let id1 = inner.substring(0, commaIdx).trim();
                let id2 = inner.substring(commaIdx + 1).trim();

                // Backtrack to find the array variable name
                // e.g. "my_array [" -> "my_array"
                let nameMatch = arrPass.match(/([a-zA-Z0-9_]+)\s*$/);
                if (nameMatch && nameMatch.index !== undefined) {
                    let varName = nameMatch[1];
                    arrPass = arrPass.substring(0, nameMatch.index);
                    // Generate proper 2D array accessor format
                    arrPass += `__get2d(${varName}, ${id1}, ${id2})`;
                } else {
                    arrPass += `[${inner}]`;
                }
            } else {
                arrPass += `[${inner}]`;
            }
            arrIdx = bEnd + 1;
        } else {
            arrPass += str.slice(arrIdx);
            break;
        }
    }
    str = arrPass;

    // 2. AST phase for Multi-variable declarations: `var a=1, b=2, c;` -> `let a=1, b=2, c;`
    // Handled by standard `js = js.replace(/\bvar\s+/g, 'let ');` safely if commas are kept unless there are GML specific quirks.

    // 3. Replaces the broken regex logic for `repeat` and `with`
    let result = '';
    let i = 0;

    const findBalancedBlock = (startIdx: number): { block: string, endIdx: number } => {
        let blockStart = str.indexOf('{', startIdx);
        if (blockStart === -1) {
            // No block, just a single statement
            let semi = str.indexOf(';', startIdx);
            if (semi === -1) semi = str.length;
            return { block: str.substring(startIdx, semi + 1), endIdx: semi + 1 };
        }

        let depth = 0;
        let blockEnd = -1;
        for (let j = blockStart; j < str.length; j++) {
            if (str[j] === '{') depth++;
            else if (str[j] === '}') {
                depth--;
                if (depth === 0) {
                    blockEnd = j;
                    break;
                }
            }
        }

        if (blockEnd === -1) blockEnd = str.length; // Malformed
        return { block: str.substring(blockStart + 1, blockEnd), endIdx: blockEnd + 1 };
    };

    while (i < str.length) {
        // Find next 'with' or 'repeat'
        let withMatch = str.slice(i).match(/\bwith\s*\(/);
        let repMatch  = str.slice(i).match(/\brepeat\s*\(/);

        let nextIdx = str.length;
        let type = '';
        let matchLen = 0;

        if (withMatch && withMatch.index !== undefined) {
            nextIdx = i + withMatch.index;
            type = 'with';
            matchLen = withMatch[0].length;
        }
        if (repMatch && repMatch.index !== undefined && (i + repMatch.index) < nextIdx) {
            nextIdx = i + repMatch.index;
            type = 'repeat';
            matchLen = repMatch[0].length;
        }

        if (type === '') {
            result += str.slice(i);
            break;
        }

        // Add everything up to the keyword
        result += str.slice(i, nextIdx);

        // Extract the condition `(...)`
        let condStart = nextIdx + matchLen - 1; // points to '('
        let depth = 0;
        let condEnd = -1;
        for (let j = condStart; j < str.length; j++) {
            if (str[j] === '(') depth++;
            else if (str[j] === ')') {
                depth--;
                if (depth === 0) {
                    condEnd = j;
                    break;
                }
            }
        }

        if (condEnd === -1) break;

        let condition = str.substring(condStart + 1, condEnd);
        let blockStart = condEnd + 1;

        // Extract the block `{...}` or statement
        let parsedBlock = findBalancedBlock(blockStart);

        // Recursively parse the body to handle nested blocks
        let body = parseGMLBlocks(parsedBlock.block);

        if (type === 'with') {
            result += `(window.instances||[]).filter(i=>!i.dead&&(i.def?.name===(${condition.trim()})||i===(${condition.trim()}))).forEach(i => { i._other = this; (function(){${body}}).call(i); })`;
        } else if (type === 'repeat') {
            result += `for(let _ri_${nextIdx}=0; _ri_${nextIdx}<(${condition.trim()}); _ri_${nextIdx}++){${body}}`;
        }

        i = parsedBlock.endIdx;
    }

    return result;
}

// ─── GMX Action ID → NOR action ──────────────────────────────────────────────
function mapGMAction(
  actionId: number,
  libId: number,
  args: string[],
  isRelative: boolean,
  isNot: boolean,
  idMap: Record<string,string>
): { libId: string; params: any } {

  const resolveObj = (s: string) => idMap[s] || s || 'self';
  const num  = (s: string, def=0) => parseFloat(s) || def;
  const bool = (s: string) => s === '1' || s === 'true';

  switch (actionId) {
    // ── MOVE ──────────────────────────────────────────────────────────────
    case 101: { // Move Fixed
      const dirStr = args[0] || '000000000';
      const dirs = ['down-left','down','down-right','left','stop','right','up-left','up','up-right'];
      const d = dirs[dirStr.split('').findIndex(c=>c==='1')] || 'stop';
      return { libId:'move_fixed', params:{ dir:d, spd:num(args[1]) } };
    }
    case 102: return { libId:'control_execute', params:{ code:`this.motionSet(${num(args[0])},${num(args[1])});` } };
    case 103: return { libId:'move_towards', params:{ tx:num(args[0]), ty:num(args[1]), spd:num(args[2]) } };
    case 104: return { libId:'control_execute', params:{ code:`this.moveTowards(${args[0]},${args[1]},${num(args[2])});` } };
    case 105: return { libId:'move_towards', params:{ tx:num(args[0]), ty:num(args[1]), spd:num(args[2]) } };
    case 107: return { libId:'move_gravity', params:{ amt:num(args[0]) } };
    case 108: return { libId:'control_execute', params:{ code:`this.friction=${num(args[0])};` } };
    case 109: return { libId:'move_jump', params:{ x:num(args[0]), y:num(args[1]) } };
    case 110: return { libId:'control_execute', params:{ code:`this.x+=this.dx;this.y+=this.dy;` } };
    case 112: return { libId:'move_wrap', params:{ mar:num(args[0]) } };
    case 113: return { libId:'control_execute', params:{ code:`this.dx=-this.dx;` } };
    case 114: return { libId:'control_execute', params:{ code:`this.dy=-this.dy;` } };
    case 115: return { libId:'move_bounce', params:{ pre:bool(args[0]) } };

    // ── MAIN1 ──────────────────────────────────────────────────────────────
    case 201: return { libId:'main1_create', params:{ obj:resolveObj(args[0]), x:num(args[1]), y:num(args[2]), rel:isRelative } };
    case 202: return { libId:'main1_instance_change', params:{ obj:resolveObj(args[0]), ev:bool(args[1]) } };
    case 203: return { libId:'main1_destroy', params:{ target:'self' } };
    case 204: return { libId:'control_execute', params:{ code:`if(this.placeMeeting(this.x,this.y,'${resolveObj(args[0])}')){this.dead=true;}` } };
    case 206: return { libId:'control_execute', params:{ code:`// change_sprite ${args[0]}` } };
    case 207: return { libId:'control_execute', params:{ code:`this.x=window.ROOM_W/2;this.y=window.ROOM_H/2;` } }; // center
    case 211: return { libId:'main1_sound', params:{ snd:resolveObj(args[0]), loop:bool(args[1]) } };
    case 213: return { libId:'control_execute', params:{ code:`window.audio_stop_sound(${resolveObj(args[0])});` } };
    case 214: return { libId:'control_execute', params:{ code:`window.audio_stop_sound();` } };
    case 215: return { libId:'control_execute', params:{ code:`// music_set_volume(${args[0]})` } };
    case 221: return { libId:'control_execute', params:{ code:`window.gotoRoom(${resolveObj(args[0])});` } };
    case 222: return { libId:'control_execute', params:{ code:`window.gotoRoom(window.currentRoomIdx-1);` } };
    case 223: return { libId:'control_execute', params:{ code:`window.gotoRoom(window.currentRoomIdx+1);` } };
    case 224: return { libId:'control_execute', params:{ code:`window.restartRoom();` } };
    case 231: return { libId:'control_execute', params:{ code:`window.gameOver=true;` } };

    // ── MAIN2 ──────────────────────────────────────────────────────────────
    case 301: return { libId:'main2_alarm', params:{ steps:num(args[0]), id:args[1]||'0' } };
    case 311: return { libId:'control_var', params:{ name:args[0], val:args[1], rel:isRelative } };
    case 312: return { libId:'control_execute', params:{ code:`${args[0]}=${isRelative?`${args[0]}+`:``}${args[1]};` } };
    case 321: return { libId:'control_execute', params:{ code:`// draw_variable ${args[0]}` } };

    // ── DRAW (401-499) ──────────────────────────────────────────────────────
    case 401: return { libId:'control_execute', params:{ code:`this._drawSelf();` } };
    case 403: return { libId:'control_execute', params:{ code:`this.drawSprite('${resolveObj(args[0])}',${num(args[1])},${num(args[2])},${num(args[3])});` } };
    case 405: return { libId:'control_execute', params:{ code:`this.drawText(${num(args[0])},${num(args[1])},'${(args[2]||'').replace(/'/g,"\\'")}');` } };
    case 406: return { libId:'control_execute', params:{ code:`this.drawText(${num(args[0])},${num(args[1])},String(${args[2]||'0'}));` } };
    case 408: return { libId:'control_execute', params:{ code:`this.drawRect(${num(args[0])},${num(args[1])},${num(args[2])},${num(args[3])},${bool(args[4])});` } };
    case 410: return { libId:'control_execute', params:{ code:`this.drawCircle(${num(args[0])},${num(args[1])},${num(args[2])},${bool(args[3])});` } };
    case 422: return { libId:'control_execute', params:{ code:`this.drawColor('${args[0]||'#000000'}');` } };
    case 431: return { libId:'control_execute', params:{ code:`this.alpha=${num(args[0],1)};` } };
    case 432: return { libId:'control_execute', params:{ code:`this.angle=${num(args[0])};` } };

    // ── SPRITE/ANIMATION ────────────────────────────────────────────────────
    case 541: return { libId:'main1_sprite', params:{ spr:resolveObj(args[0]), idx:num(args[1]), spd:num(args[2],1) } };
    case 542: return { libId:'control_execute', params:{ code:`this.visible=${bool(args[0])};` } };
    case 543: return { libId:'control_execute', params:{ code:`this.depth=${num(args[0])};` } };
    case 544: return { libId:'control_execute', params:{ code:`this.animSpeed=${num(args[0],1)};` } };

    // ── CONTROL ─────────────────────────────────────────────────────────────
    case 601: return { libId:'control_if', params:{ expr:args[0]||'true', not:isNot } };
    case 602: return { libId:'control_else', params:{} };
    case 603: return { libId:'control_execute', params:{ code: gmlToJs(args[0]||'') } };
    case 604: return { libId:'control_comment', params:{ text:args[0]||'' } };
    case 605: return { libId:'control_execute', params:{ code:`for(let _i=0;_i<${num(args[0],1)};_i++){` } };
    case 606: return { libId:'control_execute', params:{ code:`}` } }; // end block
    case 607: return { libId:'control_execute', params:{ code:`while(${gmlToJs(args[0]||'true')}){` } };
    case 608: return { libId:'control_execute', params:{ code:`}` } };
    case 609: return { libId:'control_execute', params:{ code:`break;` } };
    case 611: return { libId:'control_execute', params:{ code:`return;` } };

    // ── SCORE/LIVES/HEALTH ──────────────────────────────────────────────────
    case 701: return { libId:'score_set', params:{ amt:num(args[0]), rel:isRelative } };
    case 702: return { libId:'score_add', params:{ amt:num(args[0]) } };
    case 711: return { libId:'lives_set', params:{ amt:num(args[0]), rel:isRelative } };
    case 721: return { libId:'health_set', params:{ amt:num(args[0]), rel:isRelative } };

    // ── ROOM (801-899) ──────────────────────────────────────────────────────
    case 801: return { libId:'control_execute', params:{ code:`window.gotoRoom(${resolveObj(args[0])});` } };
    case 802: return { libId:'control_execute', params:{ code:`window.gotoRoom(window.currentRoomIdx+1);` } };
    case 803: return { libId:'control_execute', params:{ code:`window.gotoRoom(window.currentRoomIdx-1);` } };
    case 804: return { libId:'control_execute', params:{ code:`window.restartRoom();` } };

    default: {
      const codeArgs = args.map(a => isNaN(Number(a)) ? `'${a.replace(/'/g,"\\'")}' ` : a).join(', ');
      return { libId:'control_execute', params:{ code:`this.callLegacyAction('action_${actionId}', [${codeArgs}], ${isRelative}, ${isNot});` } };
    }
  }
}

// ─── Key/Mouse mappers ────────────────────────────────────────────────────────
function mapGMKey(code: number): string {
  if (code===1)  return 'any';
  if (code===8)  return 'Backspace';
  if (code===9)  return 'Tab';
  if (code===13) return 'Enter';
  if (code===16) return 'Shift';
  if (code===17) return 'Control';
  if (code===18) return 'Alt';
  if (code===19) return 'Pause';
  if (code===27) return 'Escape';
  if (code===32) return 'Space';
  if (code===33) return 'PageUp';
  if (code===34) return 'PageDown';
  if (code===35) return 'End';
  if (code===36) return 'Home';
  if (code===37) return 'ArrowLeft';
  if (code===38) return 'ArrowUp';
  if (code===39) return 'ArrowRight';
  if (code===40) return 'ArrowDown';
  if (code===46) return 'Delete';
  if (code>=48 && code<=57) return `Digit${code-48}`;
  if (code>=65 && code<=90) return `Key${String.fromCharCode(code)}`;
  if (code>=96 && code<=105) return `Numpad${code-96}`;
  if (code>=112 && code<=123) return `F${code-111}`;
  return `Key${code}`;
}
function mapGMMouse(code: number): string {
  return ['left','right','middle','none','left_pressed','right_pressed','middle_pressed',
          'left_released','right_released','middle_released','enter','leave'][code] || 'none';
}
function mapOtherEvent(enumb: number): string {
  if (enumb===0)  return 'other_outside';
  if (enumb===1)  return 'other_boundary';
  if (enumb===2)  return 'other_game_start';
  if (enumb===3)  return 'other_game_end';
  if (enumb===4)  return 'other_room_start';
  if (enumb===5)  return 'other_room_end';
  if (enumb===6)  return 'other_no_more_lives';
  if (enumb===7)  return 'other_animation_end';
  if (enumb===8)  return 'other_end_of_path';
  if (enumb===9)  return 'other_no_more_health';
  if (enumb>=10 && enumb<=25) return `other_user_${enumb-10}`;
  if (enumb===30) return 'other_close_button';
  return `other_${enumb}`;
}

// ─── Main Function ────────────────────────────────────────────────────────────
export const convertGmxFolderToNor = async (fileList: FileList): Promise<GmxConversionResult> => {
  const files = Array.from(fileList) as File[];
  const warnings: string[] = [];

  // 1. Find master project file
  const projectFile = files.find(f => f.name.toLowerCase().endsWith('.project.gmx'));
  if (!projectFile) throw new Error("لم يتم العثور على ملف '.project.gmx'. تأكد من اختيار مجلد GameMaker: Studio 1.x صالح.");

  const xmlText = await fileToText(projectFile);
  const doc = parseXml(xmlText);

  const result: GmxConversionResult = {
    metadata: {
      title: projectFile.name.replace('.project.gmx',''),
      story: 'Imported from GameMaker: Studio 1.x',
      genre: 'imported', controls: '',
      languages:['en','ar'], defaultLanguage:'ar'
    },
    sprites:[], backgrounds:[], sounds:[], fonts:[], scripts:[],
    gameObjects:[], rooms:[], enabledExtensions:[], warnings
  };

  const idMap: Record<string,string> = {};
  const objNameToIndex: Record<string,number> = {};
  const parentMap: Record<string,string|null> = {};

  // ─── 2. SPRITES ──────────────────────────────────────────────────────────
  const sprNodes = Array.from(doc.querySelectorAll('sprites sprite'));
  for (const node of sprNodes) {
    const gmxPath = node.textContent?.trim(); if (!gmxPath) continue;
    const name    = gmxPath.split(/[/\\]/).pop() || 'spr';
    const id      = `spr_${name}_${uid()}`;
    idMap[name]   = id;

    const xmlFile = findFile(files, `${gmxPath}.sprite.gmx`);
    if (!xmlFile) { warnings.push(`Sprite XML not found: ${gmxPath}`); continue; }

    const sxml = parseXml(await fileToText(xmlFile));
    const w    = parseInt(sxml.querySelector('width')?.textContent  || '32', 10);
    const h    = parseInt(sxml.querySelector('height')?.textContent || '32', 10);

    const bboxLeft = parseInt(sxml.querySelector('bbox_left')?.textContent || '0', 10);
    const bboxRight = parseInt(sxml.querySelector('bbox_right')?.textContent || String(w-1), 10);
    const bboxTop = parseInt(sxml.querySelector('bbox_top')?.textContent || '0', 10);
    const bboxBottom = parseInt(sxml.querySelector('bbox_bottom')?.textContent || String(h-1), 10);

    // Read ALL frames
    const frameNodes = Array.from(sxml.querySelectorAll('frame'));
    let src = '';
    if (frameNodes.length > 1) {
      // Build sprite strip by drawing all frames onto one canvas
      const frames: string[] = [];
      for (const fn of frameNodes) {
        const imgPath = fn.textContent?.trim(); if (!imgPath) continue;
        const imgFile = findFile(files, imgPath);
        if (imgFile) frames.push(await fileToDataUrl(imgFile));
      }
      if (frames.length > 0) {
        // Stitch into horizontal strip
        const canvas = document.createElement('canvas');
        canvas.width  = w * frames.length;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        let loadCount = 0;
        await Promise.all(frames.map((f, i) => new Promise<void>(res => {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img,0,0,w,h, i*w,0,w,h); loadCount++; res(); };
          img.onerror = () => { loadCount++; res(); };
          img.src = f;
        })));
        src = canvas.toDataURL('image/png');
      }
    } else if (frameNodes.length === 1) {
      const imgPath = frameNodes[0].textContent?.trim();
      if (imgPath) {
        const imgFile = findFile(files, imgPath);
        if (imgFile) src = await fileToDataUrl(imgFile);
        else warnings.push(`Sprite image not found: ${imgPath}`);
      }
    } else {
      // Some projects use images directly as <data>
      const dataNode = sxml.querySelector('data');
      if (dataNode?.textContent) {
        const imgFile = findFile(files, dataNode.textContent.trim());
        if (imgFile) src = await fileToDataUrl(imgFile);
      }
    }

    if (!src) { warnings.push(`No image data for sprite: ${name}`); continue; }

    result.sprites.push({
      id, name, src,
      role: inferRole(name),
      frameWidth:  w,
      frameHeight: h,
      paper2d: true,
      pixelPerfect: true,
      bboxLeft: bboxLeft,
      bboxRight: bboxRight,
      bboxTop: bboxTop,
      bboxBottom: bboxBottom
    } as SpriteAsset);
  }

  // ─── 3. SOUNDS ───────────────────────────────────────────────────────────
  const sndNodes = Array.from(doc.querySelectorAll('sounds sound'));
  for (const node of sndNodes) {
    const gmxPath = node.textContent?.trim(); if (!gmxPath) continue;
    const name    = gmxPath.split(/[/\\]/).pop() || 'snd';
    const id      = `snd_${name}_${uid()}`;
    idMap[name]   = id;

    const xmlFile = findFile(files, `${gmxPath}.sound.gmx`);
    let physPath  = '';
    if (xmlFile) {
      const sxml    = parseXml(await fileToText(xmlFile));
      // GMX .sound.gmx has <filename> which is the actual audio file path
      const fn      = sxml.querySelector('filename')?.textContent?.trim();
      const ext     = sxml.querySelector('extension')?.textContent?.trim() || '.wav';
      physPath      = fn || `${gmxPath}${ext}`;
    } else {
      // Try common extensions
      for (const e of ['.wav','.mp3','.ogg']) {
        if (findFile(files, `${gmxPath}${e}`)) { physPath = `${gmxPath}${e}`; break; }
      }
    }

    if (physPath) {
      const file = findFile(files, physPath);
      if (file) {
        result.sounds.push({ id, name, src: await fileToDataUrl(file) });
        continue;
      }
    }
    warnings.push(`Sound file not found: ${name}`);
    result.sounds.push({ id, name, src: '' });
  }

  // ─── 4. BACKGROUNDS ──────────────────────────────────────────────────────
  const bgNodes = Array.from(doc.querySelectorAll('backgrounds background'));
  for (const node of bgNodes) {
    const gmxPath = node.textContent?.trim(); if (!gmxPath) continue;
    const name    = gmxPath.split(/[/\\]/).pop() || 'bg';
    const id      = `bg_${name}_${uid()}`;
    idMap[name]   = id;

    const xmlFile = findFile(files, `${gmxPath}.background.gmx`);
    let src = '';
    if (xmlFile) {
      const bxml = parseXml(await fileToText(xmlFile));
      // <data> contains the relative path to the image
      const dataPath = bxml.querySelector('data')?.textContent?.trim();
      if (dataPath) {
        const imgFile = findFile(files, dataPath);
        if (imgFile) src = await fileToDataUrl(imgFile);
      }
    }
    if (!src) {
      // Try name.png directly
      const direct = findFile(files, `${name}.png`) || findFile(files, `${name}.bmp`);
      if (direct) src = await fileToDataUrl(direct);
      else warnings.push(`Background image not found: ${name}`);
    }
    result.backgrounds.push({ id, name, src });
  }

  // ─── 5. FONTS ────────────────────────────────────────────────────────────
  const fontNodes = Array.from(doc.querySelectorAll('fonts font'));
  for (const node of fontNodes) {
    const gmxPath = node.textContent?.trim(); if (!gmxPath) continue;
    const name    = gmxPath.split(/[/\\]/).pop() || 'fnt';
    const id      = `fnt_${name}_${uid()}`;
    idMap[name]   = id;

    const xmlFile = findFile(files, `${gmxPath}.font.gmx`);
    if (xmlFile) {
      const fxml   = parseXml(await fileToText(xmlFile));
      const family = fxml.querySelector('fontname')?.textContent?.trim() || 'Arial';
      const size   = parseInt(fxml.querySelector('size')?.textContent || '12', 10);
      const bold   = fxml.querySelector('bold')?.textContent === '1';
      const italic = fxml.querySelector('italic')?.textContent === '1';
      result.fonts!.push({ id, name, family, size, bold, italic });
    } else {
      result.fonts!.push({ id, name, family:'Arial', size:12, bold:false, italic:false });
    }
  }

  // ─── 6. SCRIPTS ──────────────────────────────────────────────────────────
  const scrNodes = Array.from(doc.querySelectorAll('scripts script'));
  for (const node of scrNodes) {
    const gmxPath = node.textContent?.trim(); if (!gmxPath) continue;
    const rawName = gmxPath.split(/[/\\]/).pop() || 'scr';
    const name    = rawName.replace(/\.gml$/i,'');
    const id      = `scr_${name}_${uid()}`;
    idMap[name]   = id;

    const file = findFile(files, gmxPath) || findFile(files, `${gmxPath}.gml`);
    if (file) {
      const gml  = await fileToText(file);
      result.scripts.push({ id, name, code: `// GML Script: ${name}\n${gmlToJs(gml)}` });
    } else {
      warnings.push(`Script not found: ${name}`);
    }
  }

  // ─── 7. OBJECTS ──────────────────────────────────────────────────────────
  const objNodes = Array.from(doc.querySelectorAll('objects object'));
  for (const node of objNodes) {
    const gmxPath = node.textContent?.trim(); if (!gmxPath) continue;
    const name    = gmxPath.split(/[/\\]/).pop() || 'obj';
    const id      = `obj_${name}_${uid()}`;
    idMap[name]   = id;

    const xmlFile = findFile(files, `${gmxPath}.object.gmx`);
    if (!xmlFile) { warnings.push(`Object XML not found: ${name}`); continue; }

    const oxml   = parseXml(await fileToText(xmlFile));
    const sprName = oxml.querySelector('spriteName')?.textContent?.trim() || '<undefined>';
    const pName   = oxml.querySelector('parentName')?.textContent?.trim() || '<undefined>';
    parentMap[name] = pName !== '<undefined>' ? pName : null;

    const eventsMap: Partial<Record<EventType, GameAction[]>> = {};
    for (const ev of Array.from(oxml.querySelectorAll('events event'))) {
      const typeId = parseInt(ev.getAttribute('eventtype') || '-1', 10);
      const enumb  = parseInt(ev.getAttribute('enumb') || '0', 10);
      const ename  = ev.getAttribute('ename') || '';

      let eventStr: EventType | null = null;
      if (typeId===0) eventStr='create';
      else if (typeId===1) eventStr='destroy';
      else if (typeId===2) eventStr=`alarm_${enumb}`;
      else if (typeId===3) eventStr=enumb===1?'step_begin':enumb===2?'step_end':'step';
      else if (typeId===4) { const tgt=idMap[ename]||ename; eventStr=`collision_${tgt}`; }
      else if (typeId===5) eventStr=`keyboard_${mapGMKey(enumb)}`;
      else if (typeId===6) eventStr=`mouse_${mapGMMouse(enumb)}`;
      else if (typeId===7) eventStr=mapOtherEvent(enumb);
      else if (typeId===8) eventStr=enumb===64?'draw_gui':'draw';
      else if (typeId===9)  eventStr=`keypress_${mapGMKey(enumb)}`;
      else if (typeId===10) eventStr=`keyrelease_${mapGMKey(enumb)}`;
      else if (typeId===11) eventStr='draw_gui';
      else if (typeId===13) eventStr='async_system';
      else if (typeId===15) eventStr='gesture_tap';
      if (!eventStr) { warnings.push(`Unknown event type ${typeId} in ${name}`); continue; }

      if (!eventsMap[eventStr]) eventsMap[eventStr] = [];

      for (const act of Array.from(ev.querySelectorAll('action'))) {
        const aId  = parseInt(act.querySelector('id')?.textContent || '0', 10);
        const lId  = parseInt(act.querySelector('libid')?.textContent || '1', 10);
        const rel  = act.querySelector('relative')?.textContent === '1';
        const not_ = act.querySelector('isnot')?.textContent === '1';
        const argVals = Array.from(act.querySelectorAll('arguments argument')).map(a =>
          a.querySelector('string')?.textContent || '0');

        const mapped = mapGMAction(aId, lId, argVals, rel, not_, idMap);
        eventsMap[eventStr]!.push({ id:`act_${uid()}`, libId:mapped.libId, params:mapped.params });
      }
    }

    const oIdx = result.gameObjects.length;
    result.gameObjects.push({
      id, name,
      spriteId: sprName !== '<undefined>' ? (idMap[sprName] || null) : null,
      solid:      oxml.querySelector('solid')?.textContent === '1',
      visible:    oxml.querySelector('visible')?.textContent !== '0',
      depth:      parseInt(oxml.querySelector('depth')?.textContent || '0', 10),
      persistent: oxml.querySelector('persistent')?.textContent === '1',
      role:       inferRole(name),
      events:     eventsMap as Record<EventType, GameAction[]>,
    });
    objNameToIndex[name] = oIdx;
  }

  // ─── 8. PARENTING (inheritance) ──────────────────────────────────────────
  for (const obj of result.gameObjects) {
    let cur = parentMap[obj.name];
    const visited = new Set<string>();
    while (cur && !visited.has(cur)) {
      visited.add(cur);
      const parent = result.gameObjects.find(o => o.name === cur);
      if (!parent) break;
      for (const [evType, actions] of Object.entries(parent.events)) {
        if (!obj.events[evType as EventType]) {
          obj.events[evType as EventType] = [...(actions || [])];
        }
      }
      cur = parentMap[parent.name];
    }
  }

  // ─── 9. ROOMS ────────────────────────────────────────────────────────────
  const rmNodes = Array.from(doc.querySelectorAll('rooms room'));
  for (const node of rmNodes) {
    const gmxPath = node.textContent?.trim(); if (!gmxPath) continue;
    const name    = gmxPath.split(/[/\\]/).pop() || 'rm';
    const id      = `rm_${name}_${uid()}`;
    idMap[name]   = id;

    const xmlFile = findFile(files, `${gmxPath}.room.gmx`);
    if (!xmlFile) { warnings.push(`Room XML not found: ${name}`); continue; }

    const rxml = parseXml(await fileToText(xmlFile));

    const roomW = parseInt(rxml.querySelector('width')?.textContent  || '320', 10);
    const roomH = parseInt(rxml.querySelector('height')?.textContent || '240', 10);
    const speed = parseInt(rxml.querySelector('speed')?.textContent  || '30',  10);
    const caption = rxml.querySelector('caption')?.textContent?.trim() || name;
    const persistent = rxml.querySelector('persistent')?.textContent === '1';
    const creationCode = rxml.querySelector('makerSettings creationCode')?.textContent?.trim()
                      || rxml.querySelector('creationCode')?.textContent?.trim() || '';

    // Background color (BGR decimal → RGB hex)
    const bgVal = parseInt(rxml.querySelector('colour')?.textContent || '16777215', 10);
    const bgR   = bgVal & 255, bgG = (bgVal>>8) & 255, bgB = (bgVal>>16) & 255;
    const bgHex = `#${((1<<24)|(bgR<<16)|(bgG<<8)|bgB).toString(16).slice(1)}`;
    const drawBgCol = rxml.querySelector('showcolour')?.textContent !== '-1';

    const snapX = parseInt(rxml.querySelector('snapX')?.textContent || rxml.querySelector('snap_x')?.textContent || '16', 10);
    const snapY = parseInt(rxml.querySelector('snapY')?.textContent || rxml.querySelector('snap_y')?.textContent || '16', 10);

    const mapW = Math.max(1, Math.floor(roomW / snapX));
    const mapH = Math.max(1, Math.floor(roomH / snapY));
    const levelMap = new Array(mapW * mapH).fill(0);

    // Instances
    let instanceCode = `// Auto-imported instances from GMX room: ${name}\n`;
    for (const inst of Array.from(rxml.querySelectorAll('instances instance'))) {
      const oName = inst.getAttribute('objName') || '';
      const ix    = parseInt(inst.getAttribute('x') || '0', 10);
      const iy    = parseInt(inst.getAttribute('y') || '0', 10);
      const cc    = inst.getAttribute('code')?.trim() || '';
      if (!oName) continue;

      instanceCode += `instance_create(${ix},${iy},"${oName}");${cc?` // ${cc.slice(0,40)}`:''}\n`;

      const tx  = Math.floor(ix / snapX);
      const ty  = Math.floor(iy / snapY);
      const oI  = objNameToIndex[oName];
      if (oI !== undefined && tx>=0 && tx<mapW && ty>=0 && ty<mapH) {
        levelMap[ty * mapW + tx] = oI + 2;
      }
    }

    // Tiles — فقدانها كانت مشكلة كبيرة
    let tileCode = '';
    const tileNodes = Array.from(rxml.querySelectorAll('tiles tile'));
    if (tileNodes.length > 0) {
      tileCode = `\n// Tile layer (${tileNodes.length} tiles)\n`;
      for (const tile of tileNodes) {
        const bgName = tile.getAttribute('bgName') || '';
        const tx     = parseInt(tile.getAttribute('x') || '0', 10);
        const ty     = parseInt(tile.getAttribute('y') || '0', 10);
        const w2     = parseInt(tile.getAttribute('w') || snapX.toString(), 10);
        const h2     = parseInt(tile.getAttribute('h') || snapY.toString(), 10);
        const xo     = parseInt(tile.getAttribute('xo') || '0', 10);
        const yo     = parseInt(tile.getAttribute('yo') || '0', 10);
        const depth  = parseInt(tile.getAttribute('depth') || '0', 10);
        const bgId   = idMap[bgName] || '';
        tileCode += `// tile: bg=${bgName} at (${tx},${ty}) w=${w2} h=${h2} src=(${xo},${yo}) depth=${depth}\n`;
        // Mark tile cells in levelMap using solid=1 if background is a tile sheet
        const mtx = Math.floor(tx / snapX);
        const mty = Math.floor(ty / snapY);
        if (mtx>=0 && mtx<mapW && mty>=0 && mty<mapH && !levelMap[mty*mapW+mtx]) {
          levelMap[mty*mapW+mtx] = 1; // mark as solid tile
        }
      }
    }

    // Backgrounds
    const roomBgs = Array.from(rxml.querySelectorAll('backgrounds background')).map(bg => ({
      visible:    bg.getAttribute('visible') === '-1' || bg.getAttribute('visible') === '1',
      foreground: bg.getAttribute('foreground') === '-1' || bg.getAttribute('foreground') === '1',
      source:     idMap[bg.getAttribute('name')||''] || null,
      tileH:      bg.getAttribute('htiled') === '-1' || bg.getAttribute('htiled') === '1',
      tileV:      bg.getAttribute('vtiled') === '-1' || bg.getAttribute('vtiled') === '1',
      stretch:    bg.getAttribute('stretch') === '-1' || bg.getAttribute('stretch') === '1',
      x:          parseInt(bg.getAttribute('x') || '0', 10),
      y:          parseInt(bg.getAttribute('y') || '0', 10),
      hspeed:     parseInt(bg.getAttribute('hspeed') || '0', 10),
      vspeed:     parseInt(bg.getAttribute('vspeed') || '0', 10),
    }));
    // Pad to 8
    while (roomBgs.length < 8) roomBgs.push({ visible:false, foreground:false, source:null, tileH:true, tileV:true, stretch:false, x:0, y:0, hspeed:0, vspeed:0 });

    // Views
    const roomViews = Array.from(rxml.querySelectorAll('view')).map(v => ({
      visible:  v.getAttribute('visible') === '1' || v.getAttribute('visible') === '-1',
      viewX:    parseInt(v.getAttribute('xview')  || '0',   10),
      viewY:    parseInt(v.getAttribute('yview')  || '0',   10),
      viewW:    parseInt(v.getAttribute('wview')  || '320', 10),
      viewH:    parseInt(v.getAttribute('hview')  || '240', 10),
      portX:    parseInt(v.getAttribute('xport')  || '0',   10),
      portY:    parseInt(v.getAttribute('yport')  || '0',   10),
      portW:    parseInt(v.getAttribute('wport')  || '320', 10),
      portH:    parseInt(v.getAttribute('hport')  || '240', 10),
      followObj:v.getAttribute('objName') || null,
      hBorder:  parseInt(v.getAttribute('hbor')   || '32',  10),
      vBorder:  parseInt(v.getAttribute('vbor')   || '32',  10),
      hSpeed:   parseInt(v.getAttribute('hspeed') || '-1',  10),
      vSpeed:   parseInt(v.getAttribute('vspeed') || '-1',  10),
    }));
    while (roomViews.length < 8) roomViews.push({ visible:false, viewX:0, viewY:0, viewW:320, viewH:240, portX:0, portY:0, portW:320, portH:240, followObj:null, hBorder:32, vBorder:32, hSpeed:-1, vSpeed:-1 });

    const combinedCode = [
      instanceCode.trim(),
      tileCode.trim(),
      creationCode.trim() ? `\n// Room creation code:\n${gmlToJs(creationCode)}` : ''
    ].filter(Boolean).join('\n');

    result.rooms.push({
      id, width:mapW, height:mapH, map:levelMap,
      viewMode: '2d', // default; camera switch is done in editor
      settings: {
        name, caption, speed,
        lives:3, persistent, clearView:true,
        creationCode: combinedCode,
        tileAnimSpeed:250,
        enableViews: roomViews.some(v=>v.visible),
        snapX, snapY, bgColor:bgHex, drawBgColor:drawBgCol
      },
      backgrounds: roomBgs as any,
      views: roomViews as any,
    });
  }

  // ─── 10. EXTENSIONS ──────────────────────────────────────────────────────
  const extNodes = Array.from(doc.querySelectorAll('extensions extension'));
  for (const node of extNodes) {
    const name = node.textContent?.trim().split(/[/\\]/).pop() || '';
    if (name) result.enabledExtensions!.push(name);
  }

  return result;
};
