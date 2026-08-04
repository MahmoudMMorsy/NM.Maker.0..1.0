/**
 * nesImporter.ts
 * يقرأ .nes (iNES format) ويستخرج:
 *   - CHR tiles → SpriteAssets (PNG data URLs قابلة للتحرير)
 *   - Nametable → room map (16×15 NOR grid)
 *   - Palette → bgColor للغرفة
 *   - Strings من PRG → title guess
 * الناتج: مشروع NOR كامل جاهز للتحرير
 */

import { SpriteAsset, BackgroundAsset, SoundAsset, FontAsset,
         ScriptAsset, GameObject, RoomData, GameMetadata, UIMenu } from '../types';

// ─── NES NTSC Palette → RGB ───────────────────────────────────────────────────
const NES_RGB: [number,number,number][] = [
  [84,84,84],[0,30,116],[8,16,144],[48,0,136],[68,0,100],[92,0,48],[84,4,0],[60,24,0],
  [32,42,0],[8,58,0],[0,64,0],[0,60,0],[0,50,60],[0,0,0],[0,0,0],[0,0,0],
  [152,150,152],[8,76,196],[48,50,236],[92,30,228],[136,20,176],[160,20,100],[152,34,32],
  [120,60,0],[84,90,0],[40,114,0],[8,124,0],[0,118,40],[0,102,120],[0,0,0],[0,0,0],[0,0,0],
  [236,238,236],[76,154,236],[120,124,236],[176,98,236],[228,84,236],[236,88,180],
  [236,106,100],[212,136,32],[160,170,0],[116,196,0],[76,208,32],[56,204,108],
  [56,180,204],[60,60,60],[0,0,0],[0,0,0],
  [236,238,236],[168,204,236],[188,188,236],[212,178,236],[236,174,236],[236,174,212],
  [236,180,176],[228,196,144],[204,210,120],[180,222,120],[168,226,144],[152,226,180],
  [160,214,228],[160,162,160],[0,0,0],[0,0,0],
];

function nesRgbHex(idx: number): string {
  const c = NES_RGB[idx & 0x3F] || [0,0,0];
  return `#${c[0].toString(16).padStart(2,'0')}${c[1].toString(16).padStart(2,'0')}${c[2].toString(16).padStart(2,'0')}`;
}

// ─── CHR tile → PNG data URL ──────────────────────────────────────────────────
function chrTileToPNG(
  chr:     Uint8Array,
  tileIdx: number,
  pal:     [number,number,number,number], // 4 NES palette indices
  scale    = 8
): string | null {
  const base = tileIdx * 16;
  if (base + 15 >= chr.length) return null;

  // Check if tile is empty
  let empty = true;
  for (let i=0;i<16;i++) if (chr[base+i]!==0) { empty=false; break; }
  if (empty) return null;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 8 * scale;
  const ctx = canvas.getContext('2d')!;

  for (let y=0;y<8;y++) {
    const p0 = chr[base+y];
    const p1 = chr[base+y+8];
    for (let x=0;x<8;x++) {
      const bit = 7-x;
      const c = ((p0>>bit)&1) | (((p1>>bit)&1)<<1);
      if (c===0) continue; // transparent
      const rgb = NES_RGB[pal[c] & 0x3F] || [0,0,0];
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      ctx.fillRect(x*scale, y*scale, scale, scale);
    }
  }
  return canvas.toDataURL('image/png');
}

// ─── PRG → palette bytes ──────────────────────────────────────────────────────
// Looks for LDA #$3F; STA $2006; LDA #$00; STA $2006 pattern
function extractPalette(prg: Uint8Array): number[] {
  const PPU_ADDR = 0x2006;
  for (let i=0; i<prg.length-80; i++) {
    if (prg[i]===0xA9 && prg[i+1]===0x3F &&
        prg[i+2]===0x8D && prg[i+3]===(PPU_ADDR&0xFF) &&
        prg[i+5]===0xA9 && prg[i+6]===0x00) {
      // Found palette write — read 32 LDA #imm bytes after this
      const bytes: number[] = [];
      let j = i+9;
      while (j<prg.length && bytes.length<32) {
        if (prg[j]===0xA9) { bytes.push(prg[j+1]); j+=4; } // LDA #x; STA $2007
        else break;
      }
      if (bytes.length >= 4) return bytes;
    }
  }
  return [0x0F,0x30,0x16,0x27]; // default dark palette
}

// ─── PRG → ASCII strings (for title detection) ───────────────────────────────
function extractStrings(prg: Uint8Array): string[] {
  const results: string[] = [];
  let cur = '';
  for (let i=0;i<prg.length;i++) {
    const b=prg[i];
    if (b>=0x20 && b<=0x7E) cur+=String.fromCharCode(b);
    else { if (cur.length>=4) results.push(cur.trim()); cur=''; }
  }
  return results.filter(s => /^[A-Z0-9 \-!:\.]+$/.test(s) && s.length>=4 && s.length<=32);
}

// ─── Nametable heuristic ──────────────────────────────────────────────────────
// Looks for 960-byte region where most values are < 64 (likely tile IDs)
function findNametable(prg: Uint8Array): Uint8Array {
  for (let i=0;i<prg.length-960;i++) {
    let score=0;
    for (let j=0;j<960;j++) if (prg[i+j]<64) score++;
    if (score>800) return prg.slice(i, i+1024);
  }
  return new Uint8Array(1024); // empty fallback
}

// ─── NES → NOR room map ───────────────────────────────────────────────────────
// 32×30 NES nametable → 16×15 NOR map (2×2 NES tiles = 1 NOR tile)
function ntToNorMap(nt: Uint8Array, chr: Uint8Array): number[] {
  const norMap = new Array(16*15).fill(0);
  for (let ry=0;ry<15;ry++) {
    for (let rx=0;rx<16;rx++) {
      const nesX=rx*2, nesY=ry*2;
      const nesIdx=nesY*32+nesX;
      const tileId = nt[nesIdx]||0;
      if (tileId===0) { norMap[ry*16+rx]=0; continue; }
      // Check pixel density in CHR to decide if solid
      const base=tileId*16;
      if (base+15<chr.length) {
        let bits=0;
        for (let b=0;b<16;b++) bits+=popcount(chr[base+b]);
        norMap[ry*16+rx] = bits>30 ? 1 : 0; // solid if dense
      } else {
        norMap[ry*16+rx] = 1;
      }
    }
  }
  return norMap;
}

function popcount(n: number): number {
  let c=0; while(n){c+=n&1;n>>=1;} return c;
}

// ─── Public Result type ───────────────────────────────────────────────────────
export interface NESImportResult {
  metadata:         GameMetadata;
  sprites:          SpriteAsset[];
  backgroundAssets: BackgroundAsset[];
  soundAssets:      SoundAsset[];
  fontAssets:       FontAsset[];
  scripts:          ScriptAsset[];
  gameObjects:      GameObject[];
  rooms:            RoomData[];
  uiMenus:          UIMenu[];
  warnings:         string[];
}

// ─── Main import function ─────────────────────────────────────────────────────
export async function importNESFile(nesBytes: Uint8Array): Promise<NESImportResult> {
  const warnings: string[] = [];

  // Validate iNES magic
  if (nesBytes[0]!==0x4E||nesBytes[1]!==0x45||nesBytes[2]!==0x53||nesBytes[3]!==0x1A)
    throw new Error('ملف غير صالح: ليس NES ROM (iNES format مطلوب)');

  const prgBanks = nesBytes[4] || 1;
  const chrBanks = nesBytes[5];
  const flags6   = nesBytes[6];
  const trainer  = !!(flags6 & 0x04);
  const mapper   = ((flags6>>4)&0x0F) | (nesBytes[7]&0xF0);

  if (mapper>4) warnings.push(`Mapper ${mapper} — الاستيراد الأساسي سيعمل لكن قد تفقد بعض الـ tiles`);

  const prgOff = 16 + (trainer?512:0);
  const chrOff = prgOff + prgBanks*16384;

  const prg = nesBytes.slice(prgOff, prgOff + prgBanks*16384);
  const chr = chrBanks>0
    ? nesBytes.slice(chrOff, chrOff+chrBanks*8192)
    : new Uint8Array(8192); // CHR RAM game

  // Extract palette
  const rawPal = extractPalette(prg);
  const bgPal: [number,number,number,number] = [
    rawPal[0]??0x0F, rawPal[1]??0x30, rawPal[2]??0x16, rawPal[3]??0x27
  ];
  const bgColor = nesRgbHex(bgPal[0]);

  // Extract title
  const strings = extractStrings(prg);
  const title = strings.find(s=>s.length>=4&&s.length<=20) || `NES_ROM_${prgBanks}PRG`;

  // Find and parse nametable
  const nt = findNametable(prg);
  const usedTileIds = new Set<number>();
  for (let i=0;i<960;i++) usedTileIds.add(nt[i]||0);

  // Convert CHR tiles to sprites
  const sprites: SpriteAsset[] = [];
  const sprPal: [number,number,number,number] = [
    rawPal[16]??0x0F, rawPal[17]??0x30, rawPal[18]??0x16, rawPal[19]??0x27
  ];

  // Known NOR roles by typical CHR slot
  const slotRole: Record<number,string> = {
    2:'item', 3:'player', 4:'ground', 5:'enemy', 6:'decoration'
  };

  // Extract tiles used in nametable + known sprite slots
  const toExtract = new Set([...usedTileIds, 2, 3, 4, 5, 6]);
  for (const tid of toExtract) {
    if (tid===0) continue;
    // Try BG palette for background tiles, SPR palette for known sprites
    const usePal: [number,number,number,number] =
      (tid===3||tid===5||tid===2) ? sprPal : bgPal;
    const png = chrTileToPNG(chr, tid, usePal, 8);
    if (!png) continue;
    const role = slotRole[tid] ?? (tid<0x10?'ground':'decoration');
    sprites.push({
      id:   `spr_nes_tile_${tid.toString(16).padStart(2,'0')}`,
      name: `tile_${tid.toString(16).padStart(2,'0')}${slotRole[tid]?'_'+slotRole[tid]:''}`,
      src:  png,
      role: role as any,
      frameWidth: 8, frameHeight: 8,
    });
  }

  if (sprites.length===0) {
    warnings.push('لم تُعثر على tiles مرئية — ربما CHR RAM (dynamic tiles)');
  }

  // Build room from nametable
  const norMap = ntToNorMap(nt, chr);
  const room: RoomData = {
    id: 'rm_imported',
    width: 16, height: 15,
    map: norMap,
    settings: {
      name: 'rm_imported', caption: `${title} — Room 1`,
      speed: 30, lives: 3, persistent: false, clearView: true,
      creationCode: '', tileAnimSpeed: 250, enableViews: false,
      snapX: 16, snapY: 16, bgColor, drawBgColor: true,
    },
    backgrounds: Array(8).fill(null).map(()=>({
      visible:false,foreground:false,source:null,
      tileH:true,tileV:true,stretch:false,x:0,y:0,hspeed:0,vspeed:0
    })),
    views: Array(8).fill(null).map(()=>({
      visible:false,viewX:0,viewY:0,viewW:256,viewH:240,
      portX:0,portY:0,portW:256,portH:240,
      followObj:null,hBorder:32,vBorder:32,hSpeed:-1,vSpeed:-1
    })),
  };

  // Build game objects from detected sprite roles
  const gameObjects: GameObject[] = [];
  const playerSpr = sprites.find(s=>s.role==='player');
  const groundSpr = sprites.find(s=>s.role==='ground');
  const enemySpr  = sprites.find(s=>s.role==='enemy');
  const itemSpr   = sprites.find(s=>s.role==='item');

  if (playerSpr||sprites.length>0) {
    gameObjects.push({
      id:'obj_player', name:'obj_player',
      spriteId: playerSpr?.id || sprites[0]?.id || null,
      role:'player', solid:false, visible:true, depth:0, persistent:false,
      health:3, lives:3,
      events:{
        create:[
          {id:'p1',libId:'move_gravity',params:{amt:0.5}},
          {id:'p2',libId:'control_var', params:{name:'health',val:'3',rel:false}},
        ],
        step:[
          {id:'p3',libId:'control_if_key',params:{key:'ArrowRight',press:true}},
          {id:'p4',libId:'move_hspeed',   params:{spd:2}},
          {id:'p5',libId:'control_if_key',params:{key:'ArrowLeft', press:true}},
          {id:'p6',libId:'move_hspeed',   params:{spd:-2}},
          {id:'p7',libId:'control_if_key',params:{key:'Space',     press:true}},
          {id:'p8',libId:'move_vspeed',   params:{spd:-6}},
        ],
      },
    });
  }
  if (enemySpr) gameObjects.push({
    id:'obj_enemy', name:'obj_enemy', spriteId:enemySpr.id,
    role:'enemy', solid:false, visible:true, depth:0, persistent:false,
    events:{
      create:[{id:'e1',libId:'move_fixed',params:{dir:'left',spd:1}}],
      collision_obj_player:[{id:'e2',libId:'combat_damage',params:{amt:1,target:'other'}}],
    },
  });
  if (itemSpr) gameObjects.push({
    id:'obj_item', name:'obj_item', spriteId:itemSpr.id,
    role:'item', solid:false, visible:true, depth:0, persistent:false,
    events:{
      collision_obj_player:[
        {id:'i1',libId:'score_add',params:{amt:100}},
        {id:'i2',libId:'instance_destroy',params:{}},
      ],
    },
  });

  // Info script
  const scripts: ScriptAsset[] = [{
    id:'scr_nes_info', name:'scr_nes_info',
    code:`// Imported from NES ROM\n// Title guess: ${title}\n// Mapper: ${mapper}\n// PRG: ${prgBanks}×16KB  CHR: ${chrBanks}×8KB\n// Tiles extracted: ${sprites.length}\n${warnings.map(w=>`// ⚠ ${w}`).join('\n')}`,
  }];

  const metadata: GameMetadata = {
    title, story:`Imported NES ROM — Mapper ${mapper}, PRG ${prgBanks}×16KB, CHR ${chrBanks}×8KB`,
    genre:'Platformer', controls:'Arrows: Move  Space/A: Jump',
    languages:['en'], defaultLanguage:'en',
  };

  return {
    metadata, sprites,
    backgroundAssets:[], soundAssets:[], fontAssets:[],
    scripts, gameObjects, rooms:[room], uiMenus:[], warnings,
  };
}
