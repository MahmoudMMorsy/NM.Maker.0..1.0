/**
 * NOR Game Format v1.0 — Exporter
 * Converts a NOR Maker project snapshot into a self-contained .nor JSON file.
 * The .nor file plays in the standalone nor-player.html with no browser framework needed.
 */

import type { SpriteAsset, GameObject, RoomData, SoundAsset, BackgroundAsset, GameMetadata } from '../types';

/* ─────────────────────────────────────────────
   NOR File Format Spec (v1.0)
   ─────────────────────────────────────────────
   Top-level JSON:
   {
     "nor":        "1.0",            // format version
     "title":      string,
     "author":     string,
     "game_type":  platformer | top_down | rpg | shooter | runner | puzzle,
     "screen":     { w, h },         // pixels
     "tile":       { w, h },         // tile size in pixels
     "fps":        number,           // target frames/sec
     "physics":    { gravity, jump_force, player_speed, max_fall_speed },
     "sprites":    NorSprite[],
     "sounds":     NorSound[],
     "rooms":      NorRoom[],
     "objects":    NorObject[],
     "start_room": string,           // room id
   }
───────────────────────────────────────────── */

export interface NorSprite {
    id: string;
    name: string;
    src: string;        // base64 data URL
    frame_w: number;
    frame_h: number;
    frame_count: number;
    anim_fps: number;
    role: string;
}

export interface NorSound {
    id: string;
    name: string;
    src: string;        // base64 data URL
}

export interface NorInstance {
    id: string;
    obj: string;        // object id
    x: number;
    y: number;
}

export interface NorRoom {
    id: string;
    name: string;
    w: number;          // tiles wide
    h: number;          // tiles tall
    tile_w: number;
    tile_h: number;
    bg_color: string;
    tiles: number[];    // flat array, tile ID per cell (0=empty, 1=solid)
    instances: NorInstance[];
}

export interface NorObject {
    id: string;
    name: string;
    sprite: string | null;
    solid: boolean;
    role: string;
    speed: number;
    health: number;
    script: string;     // NOR Script source
}

export interface NorFile {
    nor: string;
    title: string;
    author: string;
    description: string;
    game_type: string;
    screen: { w: number; h: number };
    tile: { w: number; h: number };
    fps: number;
    physics: {
        gravity: number;
        jump_force: number;
        player_speed: number;
        max_fall_speed: number;
    };
    sprites: NorSprite[];
    sounds: NorSound[];
    rooms: NorRoom[];
    objects: NorObject[];
    start_room: string;
}

/* ── Detect game type from objects / rooms ── */
function detectGameType(objects: GameObject[]): string {
    const roles = objects.map(o => o.role || '');
    if (roles.includes('player')) {
        const hasEnemy = roles.includes('enemy');
        const hasBullet = roles.includes('bullet');
        if (hasBullet) return 'shooter';
    }
    const cameraMode = objects[0]?.role;
    return 'platformer'; // default
}

/* ── Build default NOR Script for an object based on its role ── */
function defaultScript(role: string, obj: GameObject): string {
    switch (role) {
        case 'player':
            return `on create {
  speed = 3
  jump_force = -9
  hp = ${obj.health ?? 100}
}
on update {
  vx = 0
  if key("ArrowLeft") or key("KeyA") { vx = 0 - speed; facing = -1 }
  if key("ArrowRight") or key("KeyD") { vx = speed; facing = 1 }
  if (key("ArrowUp") or key("KeyW") or key("Space")) and grounded { vy = jump_force; grounded = false }
}
on collide_solid {
  if col_dir == "bottom" { grounded = true; vy = 0 }
  if col_dir == "top" { vy = 0 }
  if col_dir == "left" or col_dir == "right" { vx = 0 }
}`;
        case 'enemy':
            return `on create {
  speed = 1
  dir = 1
  hp = ${obj.health ?? 30}
  timer = 0
}
on update {
  vx = dir * speed
  timer = timer + 1
  if timer > 90 { dir = 0 - dir; timer = 0 }
}
on collide_solid {
  if col_dir == "left" or col_dir == "right" { dir = 0 - dir; vx = 0 }
  if col_dir == "bottom" { vy = 0; grounded = true }
}`;
        case 'item':
            return `on create {
  collected = false
}
on collide_player {
  if not collected {
    collected = true
    sound("pickup")
    destroy()
  }
}`;
        case 'bullet':
            return `on create {
  speed = 6
  life = 60
}
on update {
  x = x + (vx * speed)
  life = life - 1
  if life <= 0 { destroy() }
}
on collide_solid {
  destroy()
}`;
        case 'npc':
            return `on create {
  talked = false
}
on collide_player {
  if key_down("Space") and not talked {
    talked = true
    message("Hello!")
  }
}`;
        default:
            return `on create {
  hp = 10
}`;
    }
}

/* ── Main export function ── */
export function exportToNor(
    metadata: GameMetadata,
    sprites: SpriteAsset[],
    sounds: SoundAsset[],
    rooms: RoomData[],
    objects: GameObject[]
): string {
    /* Sprites */
    const norSprites: NorSprite[] = sprites.map(s => ({
        id:          s.id,
        name:        s.name,
        src:         s.src || '',
        frame_w:     s.frameWidth  ?? 32,
        frame_h:     s.frameHeight ?? 32,
        frame_count: s.frames?.length ?? 1,
        anim_fps:    12,
        role:        s.role ?? 'decoration',
    }));

    /* Sounds */
    const norSounds: NorSound[] = sounds.map(s => ({
        id:   s.id,
        name: s.name,
        src:  s.src || '',
    }));

    /* Objects */
    const norObjects: NorObject[] = objects.map(obj => ({
        id:      obj.id,
        name:    obj.name,
        sprite:  obj.spriteId,
        solid:   obj.solid ?? false,
        role:    obj.role ?? 'decoration',
        speed:   3,
        health:  obj.health ?? 100,
        script:  defaultScript(obj.role ?? 'decoration', obj),
    }));

    /* Rooms */
    const norRooms: NorRoom[] = rooms.map((room, idx) => {
        const snap_w = room.settings?.snapX ?? 16;
        const snap_h = room.settings?.snapY ?? 16;
        const tw = room.width;
        const th = room.height;

        /* Build instances from tile data — objects (tileId >= 2) become instances */
        const instances: NorInstance[] = [];
        const cleanTiles: number[] = [];

        (room.map || []).forEach((tileId, i) => {
            if (tileId >= 2) {
                const col = i % tw;
                const row = Math.floor(i / tw);
                const objIdx = tileId - 2;
                const obj = objects[objIdx];
                if (obj) {
                    instances.push({
                        id:  `inst_${room.id}_${i}`,
                        obj: obj.id,
                        x:   col * snap_w,
                        y:   row * snap_h,
                    });
                }
                cleanTiles.push(0); // remove from tile map (handled as instance)
            } else {
                cleanTiles.push(tileId); // 0=empty, 1=solid wall
            }
        });

        return {
            id:       room.id,
            name:     room.settings?.name ?? `room${idx}`,
            w:        tw,
            h:        th,
            tile_w:   snap_w,
            tile_h:   snap_h,
            bg_color: room.settings?.bgColor ?? '#222034',
            tiles:    cleanTiles,
            instances,
        };
    });

    /* Detect game type */
    const game_type = detectGameType(objects);

    /* First room as start */
    const start_room = norRooms[0]?.id ?? 'room0';

    /* Physics defaults per game type */
    const physics = game_type === 'top_down'
        ? { gravity: 0, jump_force: 0, player_speed: 3, max_fall_speed: 0 }
        : { gravity: 0.4, jump_force: -9, player_speed: 3, max_fall_speed: 14 };

    /* Screen dimensions from first room */
    const firstRoom = rooms[0];
    const snap_w = firstRoom?.settings?.snapX ?? 16;
    const snap_h = firstRoom?.settings?.snapY ?? 16;
    const screenW = Math.min((firstRoom?.width  ?? 20) * snap_w, 512);
    const screenH = Math.min((firstRoom?.height ?? 15) * snap_h, 384);

    const norFile: NorFile = {
        nor:         '1.0',
        title:       metadata?.title  ?? 'Untitled',
        author:      'NOR Maker',
        description: metadata?.story  ?? '',
        game_type,
        screen:      { w: screenW, h: screenH },
        tile:        { w: snap_w,  h: snap_h },
        fps:         60,
        physics,
        sprites:     norSprites,
        sounds:      norSounds,
        rooms:       norRooms,
        objects:     norObjects,
        start_room,
    };

    return JSON.stringify(norFile, null, 2);
}
