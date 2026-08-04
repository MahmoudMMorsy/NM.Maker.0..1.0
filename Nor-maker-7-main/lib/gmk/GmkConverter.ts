import { GmkProject, GmkSprite, GmkObject, GmkRoom, GmkScript, GmkSound, GmkBackground, GmkAction } from './GmkParser';
import { SpriteAsset, GameObject, RoomData, ScriptAsset, SoundAsset, BackgroundAsset, FontAsset } from '../../types';
import { ACTION_LIBRARY } from '../../utils/actionLibrary';

export class GmkConverter {
    /**
     * Converts a GmkProject to NOR-compatible application state
     */
    public static async convert(project: GmkProject): Promise<{
        sprites: SpriteAsset[],
        gameObjects: GameObject[],
        rooms: RoomData[],
        scripts: ScriptAsset[],
        sounds: SoundAsset[],
        backgrounds: BackgroundAsset[],
        fonts: FontAsset[],
        resourceTree?: any
    }> {
        console.log(`Converting GMK Project: ${project.version} (Found ${project.sprites.length} sprites)`);

        const sprites = await Promise.all(project.sprites.map(s => this.convertSprite(s as GmkSprite)));
        const sounds = project.sounds.map(s => this.convertSound(s as GmkSound));
        const backgrounds = await Promise.all(project.backgrounds.map(b => this.convertBackground(b as GmkBackground)));
        const scripts = project.scripts.map(s => this.convertScript(s as GmkScript));
        const fonts = project.fonts.map(f => this.convertFont(f as any));

        // Objects need to be converted before rooms so we can link IDs
        const gameObjects = project.objects.map(o => this.convertObject(o as GmkObject));

        const rooms = project.rooms.map(r => this.convertRoom(r as GmkRoom, gameObjects));

        return { sprites, gameObjects, rooms, scripts, sounds, backgrounds, fonts, resourceTree: project.resourceTree };
    }

    private static async convertSprite(gmkSpr: GmkSprite): Promise<SpriteAsset> {
        const data = gmkSpr.parse();
        let src = "";

        // Extract the first sub-image as a data URL
        if (gmkSpr.rawData && gmkSpr.rawData.length > 0) {
            try {
                src = await this.decodeGmkImage(gmkSpr.rawData, data.width, data.height);
            } catch (e) {
                console.warn(`Failed to decode sprite ${gmkSpr.name}:`, e);
                // Fallback to empty sprite
            }
        }

        return {
            id: `spr_${gmkSpr.name}`,
            name: gmkSpr.name,
            src: src || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            role: 'decoration', // Default role
            frameWidth: data.width,
            frameHeight: data.height
        };
    }

    private static convertSound(gmkSnd: GmkSound): SoundAsset {
        let src = "";
        if (gmkSnd.rawData) {
            const blob = new Blob([gmkSnd.rawData as any], { type: 'audio/wav' }); // GM8 sounds are typically WAV/MP3
            src = URL.createObjectURL(blob);
        }
        return {
            id: `snd_${gmkSnd.name}`,
            name: gmkSnd.name,
            src: src
        };
    }

    private static async convertBackground(gmkBg: GmkBackground): Promise<BackgroundAsset> {
        const data = gmkBg.parse();
        let src = "";
        if (gmkBg.rawData && gmkBg.rawData.length > 0) {
            try {
                src = await this.decodeGmkImage(gmkBg.rawData, data.width, data.height);
            } catch (e) {
                console.warn(`Failed to decode background ${gmkBg.name}:`, e);
            }
        }
        return {
            id: `bg_${gmkBg.name}`,
            name: gmkBg.name,
            src: src || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        };
    }

    private static convertScript(gmkScr: GmkScript): ScriptAsset {
        const data = gmkScr.parse();
        return {
            id: `scr_${gmkScr.name}`,
            name: gmkScr.name,
            code: data.code
        };
    }

    private static convertFont(gmkFont: any): FontAsset {
        return {
            id: `fnt_${gmkFont.name}`,
            name: gmkFont.name,
            family: gmkFont.fontName || 'Arial',
            size: gmkFont.size || 12,
            bold: gmkFont.bold || false,
            italic: gmkFont.italic || false
        };
    }

    private static convertObject(gmkObj: GmkObject): GameObject {
        const data = gmkObj.parse();
        const events: any = { create: [], step: [] };

        // Map GMK events to NOR events
        data.events.forEach(ev => {
            const norActions = ev.actions.map(a => this.mapAction(a)).filter(a => a !== null);

            // Map mainType (GMK) to EventType (NOR)
            // GMK Types: 0=Create, 1=Destroy, 2=Alarm, 3=Step, 4=Collision, 5=Keyboard, 6=Mouse, 7=Other, 8=Draw, 9=KeyPress, 10=KeyRelease
            if (ev.mainType === 0) events.create = [...(events.create || []), ...norActions];
            else if (ev.mainType === 3) events.step = [...(events.step || []), ...norActions];
            else if (ev.mainType === 4) {
                 // Collision: subType is the target object index
                 events[`collision_obj_${ev.subType}`] = norActions;
            }
            else if (ev.mainType === 8) events.draw = [...(events.draw || []), ...norActions];
            // ... more mappings as needed
        });

        return {
            id: `obj_${gmkObj.name}`,
            name: gmkObj.name,
            spriteId: data.spriteId >= 0 ? `spr_obj_${data.spriteId}` : '', // Need to resolve sprite names later
            events: events,
            health: 100,
            lives: 1
        };
    }

    private static convertRoom(gmkRm: GmkRoom, objects: GameObject[]): RoomData {
        const data = gmkRm.parse();

        // GMK uses pixels, NOR uses 16x16 tiles
        const gridW = Math.max(1, Math.ceil(data.width / 16));
        const gridH = Math.max(1, Math.ceil(data.height / 16));

        // Initialize levelMap with the correct size
        const levelMap = new Array(gridW * gridH).fill(0);

        data.instances.forEach(inst => {
            const gridX = Math.floor(inst.x / 16);
            const gridY = Math.floor(inst.y / 16);
            if (gridX >= 0 && gridX < gridW && gridY >= 0 && gridY < gridH) {
                const idx = gridY * gridW + gridX;
                // Object ID in map is usually index + 2 (in some simple NOR logic)
                // However, GmkConverter should ideally map objId correctly.
                // For now, we'll try to find the index of the object in the project list.
                const objIndex = objects.findIndex(o => o.id === `obj_${inst.objId}`);
                if (objIndex !== -1) {
                    levelMap[idx] = objIndex + 2;
                } else {
                    // Fallback to raw objId if not found in list (might be built-in or broken)
                    levelMap[idx] = (inst.objId % 100) + 2;
                }
            }
        });

        return {
            id: `rm_${gmkRm.name}`,
            width: gridW,
            height: gridH,
            map: levelMap,
            settings: {
                name: gmkRm.name,
                caption: data.caption,
                speed: data.speed,
                bgColor: this.intToHexColor(data.color),
                lives: 3,
                persistent: data.persistent,
                clearView: true,
                creationCode: data.creationCode,
                tileAnimSpeed: 250,
                enableViews: data.views.some(v => v.visible),
                drawBgColor: data.showColor,
                snapX: 16,
                snapY: 16
            },
            backgrounds: data.backgrounds.map(bg => ({
                visible: bg.visible,
                foreground: bg.foreground,
                source: bg.bgId >= 0 ? `bg_unknown_${bg.bgId}` : null,
                x: bg.x,
                y: bg.y,
                tileH: bg.tiledX,
                tileV: bg.tiledY,
                stretch: bg.stretch,
                hspeed: bg.speedX,
                vspeed: bg.speedY
            })),
            views: data.views.map(v => ({
                visible: v.visible,
                viewX: v.viewX,
                viewY: v.viewY,
                viewW: v.viewW,
                viewH: v.viewH,
                portX: v.portX,
                portY: v.portY,
                portW: v.portW,
                portH: v.portH,
                followObj: null, // to be linked
                hBorder: v.hBorder,
                vBorder: v.vBorder,
                hSpeed: v.hSpeed,
                vSpeed: v.vSpeed
            }))
        };
    }

    private static mapAction(a: GmkAction): any {
        // Map common GMK library actions to NOR equivalents
        // Lib 1 (Move): 1=Move Fixed, 2=Move Towards, 3=Move HSpeed, 4=Move VSpeed, 8=Gravity, 9=Friction
        if (a.libId === 1) {
            if (a.actionId === 1) return { libId: 'move_fixed', params: { dir: 'right', spd: 2 } };
            if (a.actionId === 2) return { libId: 'move_towards', params: { tx: Number(a.argsVal[0]), ty: Number(a.argsVal[1]), spd: Number(a.argsVal[2]) } };
            if (a.actionId === 3) return { libId: 'move_hspeed', params: { spd: Number(a.argsVal[0]) } };
            if (a.actionId === 4) return { libId: 'move_vspeed', params: { spd: Number(a.argsVal[0]) } };
            if (a.actionId === 5) return { libId: 'move_jump_random', params: {} };
            if (a.actionId === 8) return { libId: 'move_gravity', params: { amt: Number(a.argsVal[0]) || 0.5 } };
            if (a.actionId === 9) return { libId: 'move_friction', params: { amt: Number(a.argsVal[0]) || 0.1 } };
        }
        // Lib 3 (Main1): 1=Create, 3=Destroy, 10=Restart Room, 11=Next Room, 4=Sprite (Change)
        if (a.libId === 3) {
            if (a.actionId === 1) return { libId: 'main1_create', params: { obj: a.argsVal[0], x: Number(a.argsVal[1]), y: Number(a.argsVal[2]), rel: a.relative } };
            if (a.actionId === 3) return { libId: 'main1_destroy', params: { target: 'self' } };
            if (a.actionId === 4) return { libId: 'main1_sprite', params: { sprite: `spr_${a.argsVal[0]}` } };
            if (a.actionId === 5) return { libId: 'main1_sound', params: { snd: `snd_${a.argsVal[0]}`, loop: a.argsVal[1] === '1' } };
            if (a.actionId === 10) return { libId: 'main2_restart_room', params: {} };
        }

        // Lib 6 (Control): 1=Execute Code, 2=Set Variable, 4=Test Variable
        if (a.libId === 6) {
            if (a.actionId === 1) return { libId: 'control_execute', params: { code: a.code || "" } };
            if (a.actionId === 2) return { libId: 'control_variable', params: { name: a.argsVal[0], value: a.argsVal[1], rel: a.relative } };
            if (a.actionId === 4) return { libId: 'control_if', params: { name: a.argsVal[0], value: a.argsVal[1], op: '==' } };
        }

        // Generic Legacy Action Mapping
        return {
            libId: `ext_${a.libId}_${a.actionId}`,
            params: {
                args: a.argsVal,
                rel: a.relative,
                not: a.not,
                target: a.target
            }
        };
    }

    private static async decodeGmkImage(rawData: Uint8Array, width?: number, height?: number): Promise<string> {
        // 1. Try to find the BMP ('BM') signature
        let offset = -1;
        for (let i = 0; i < Math.min(rawData.length - 2, 16); i++) {
            if (rawData[i] === 0x42 && rawData[i+1] === 0x4D) {
                offset = i;
                break;
            }
        }

        if (offset !== -1) {
            const blob = new Blob([rawData.slice(offset) as any], { type: 'image/bmp' });
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(blob);
            });
        }

        // 2. Fallback to raw BGRA (GM8.1 style) if width and height are provided
        if (width && height && rawData.length >= width * height * 4) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return "";

                const imageData = ctx.createImageData(width, height);
                const data = imageData.data;

                // BGRA -> RGBA conversion
                for (let i = 0; i < width * height; i++) {
                    const srcIdx = i * 4;
                    const dstIdx = i * 4;
                    data[dstIdx + 0] = rawData[srcIdx + 2]; // Red
                    data[dstIdx + 1] = rawData[srcIdx + 1]; // Green
                    data[dstIdx + 2] = rawData[srcIdx + 0]; // Blue
                    data[dstIdx + 3] = rawData[srcIdx + 3]; // Alpha
                }

                ctx.putImageData(imageData, 0, 0);
                return canvas.toDataURL('image/png');
            } catch (e) {
                console.error("Failed to decode raw BGRA image:", e);
            }
        }

        return "";
    }

    private static intToHexColor(color: number): string {
        // GMK uses BGR format integers
        const b = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const r = color & 0xFF;
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }
}
