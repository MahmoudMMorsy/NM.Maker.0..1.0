import { BinaryReader } from './BinaryReader';

export interface GmkResource {
    name: string;
    id: number;
}

export interface FossilizedResource extends GmkResource {
    error: string;
    offset: number;
    chunkLength: number;
}

export class GmkProjectBuilder {
    private reader: BinaryReader;
    private project: GmkProject;

    constructor(buffer: ArrayBuffer) {
        this.reader = new BinaryReader(buffer);
        this.project = {
            version: 0,
            appId: 0,
            constants: [],
            triggers: [],
            sprites: [],
            sounds: [],
            backgrounds: [],
            paths: [],
            scripts: [],
            fonts: [],
            timelines: [],
            objects: [],
            rooms: []
        };
    }

    private readResourceList<T extends GmkResource>(parseItem: (r: BinaryReader, id: number) => T, name: string, decryptSeed?: number): (T | FossilizedResource)[] {
        let ver = 0;
        let count = 0;
        try {
            ver = this.reader.readInt32();
            count = this.reader.readInt32();
            if (count > 100000) { // Safety check
                console.warn(`Suspiciously high resource count (${count}) for ${name}. Limiting to 10000.`);
                count = 10000;
            }
        } catch (e) {
            console.error(`Failed to read header for resource list: ${name}`, e);
            return [];
        }

        const items: (T | FossilizedResource)[] = [];

        for (let i = 0; i < count; i++) {
            try {
                const exists = this.reader.readBool();
                if (exists) {
                    if (ver >= 800) {
                        const chunk = this.reader.readZlibChunk(decryptSeed);
                        if (chunk.byteLength > 0) {
                            const r = new BinaryReader(chunk.buffer, chunk.byteOffset, chunk.byteLength);
                            items.push(parseItem(r, i));
                        } else {
                            items.push({ id: i, name: `<Empty ${name} ${i}>`, error: "Empty chunk", offset: this.reader.getOffset(), chunkLength: 0 } as FossilizedResource);
                        }
                    } else {
                        items.push(parseItem(this.reader, i));
                    }
                } else {
                    // Item does not exist, push a placeholder to maintain indexing
                    items.push({ id: i, name: `<Deleted ${name} ${i}>`, error: "Deleted", offset: this.reader.getOffset(), chunkLength: 0 } as FossilizedResource);
                }
            } catch (e) {
                console.error(`Error reading ${name} item ${i}:`, e);
                items.push({
                    id: i,
                    name: `Broken ${name} ${i}`,
                    error: e instanceof Error ? e.message : String(e),
                    offset: this.reader.getOffset(),
                    chunkLength: 0
                } as FossilizedResource);
            }
        }

        return items;
    }

    public build(): GmkProject {
        const magic = this.reader.readInt32();
        if (magic !== 1234321 && magic !== 978472782) {
            throw new Error(`Invalid GMK magic number: ${magic}.`);
        }
        this.project.version = this.reader.readInt32();
        this.project.appId = this.reader.readInt32();

        const isGm80 = this.project.version === 800;
        const decryptSeed = isGm80 ? this.project.appId : undefined;

        // Skip DirectX settings (8 * Int32) for version 800
        if (isGm80) {
            for (let i = 0; i < 8; i++) this.reader.readInt32();
        } else {
            // Version 8.1+ uses 4 unknown ints
            for (let i = 0; i < 4; i++) this.reader.readInt32();
        }

        // 1. Settings
        try {
            const settingsVer = this.reader.readInt32();
            if (settingsVer >= 800) {
                this.reader.readZlibChunk(decryptSeed);
                this.reader.readDouble(); // Last Changed
            }
        } catch (e) {
            console.warn("Failed to read settings chunk:", e);
        }

        // 2. Triggers
        this.project.triggers = this.readResourceList((r) => {
            const ver = r.readInt32();
            const name = r.readString();
            const condition = r.readString();
            const checkStep = r.readInt32();
            const constant = r.readString();
            return { name, condition, checkStep, constant } as any;
        }, "Triggers", decryptSeed) as any;
        if (this.project.version >= 800) this.reader.readDouble(); // Last Changed

        // 3. Constants
        try {
            const constantsVer = this.reader.readInt32();
            if (constantsVer >= 800) {
                const chunk = this.reader.readZlibChunk(decryptSeed);
                if (chunk.byteLength > 0) {
                    const r = new BinaryReader(chunk.buffer, chunk.byteOffset, chunk.byteLength);
                    const count = r.readInt32();
                    for (let i = 0; i < count; i++) {
                        const name = r.readString();
                        const value = r.readString();
                        this.project.constants.push({ name, value });
                    }
                }
                this.reader.readDouble(); // Last Changed
            }
        } catch (e) {
            console.warn("Failed to read constants:", e);
        }

        // 4. Sounds
        this.project.sounds = this.readResourceList((r, id) => {
            const name = r.readString();
            r.readDouble(); // last changed
            const sndVer = r.readInt32();

            const kind = r.readInt32();
            const fileType = r.readString();
            const fileName = r.readString();

            const hasData = r.readBool();
            let data: Uint8Array | undefined;
            if (hasData) {
                const dataSize = r.readInt32();
                data = r.readBytes(dataSize);
            }

            const effects = r.readInt32();
            const volume = r.readDouble();
            const pan = r.readDouble();
            const preload = r.readBool();

            return { id, name, kind, fileType, fileName, volume, pan, preload, rawData: data };
        }, "Sounds", decryptSeed) as any;
        if (this.project.version >= 800) this.reader.readDouble(); // Last Changed (Entire List)

        // 5. Sprites
        this.project.sprites = this.readResourceList((r, id) => {
            const name = r.readString();
            if (this.project.version >= 800) r.readDouble(); // last changed (individual)
            const sprVer = r.readInt32();

            let width = 0, height = 0;
            let originX = 0, originY = 0;
            if (sprVer >= 800) {
                width = r.readInt32();
                height = r.readInt32();
                // skip bbox(4), transparent(1), smooth(1), preload(1), bbmode(1), shape(1)
                r.setOffset(r.getOffset() + 4 * 9);
                originX = r.readInt32();
                originY = r.readInt32();
            }

            const subImages = r.readInt32();
            // Store the rest of the chunk as rawData for lazy parsing of subimages
            const rawData = r.readBytes(r.byteLength - r.getOffset());

            const sprite: GmkSprite = {
                id,
                name,
                rawData,
                parse: () => {
                    if (sprite.parsed) return sprite.parsed;
                    sprite.parsed = { width, height, subImages, originX, originY };
                    return sprite.parsed;
                }
            };
            return sprite;
        }, "Sprites", decryptSeed) as any;
        if (this.project.version >= 800) this.reader.readDouble(); // Last Changed (Entire List)

        // 6. Backgrounds
        this.project.backgrounds = this.readResourceList((r, id) => {
            const name = r.readString();
            if (this.project.version >= 800) r.readDouble(); // last changed (individual)
            const bgVer = r.readInt32();

            const useAsTileset = r.readBool();
            const tileWidth = r.readInt32();
            const tileHeight = r.readInt32();
            const hOffset = r.readInt32();
            const vOffset = r.readInt32();
            const hSep = r.readInt32();
            const vSep = r.readInt32();

            let width = 0, height = 0;
            const bgVer2 = r.readInt32();
            if (bgVer2 >= 800) {
                width = r.readInt32();
                height = r.readInt32();
            }

            const rawData = r.readBytes(r.byteLength - r.getOffset());

            const background: GmkBackground = {
                id,
                name,
                rawData,
                parse: () => {
                    if (background.parsed) return background.parsed;
                    background.parsed = { width, height, useAsTileset, tileWidth, tileHeight, hOffset, vOffset, hSep, vSep };
                    return background.parsed;
                }
            };
            return background;
        }, "Backgrounds", decryptSeed) as any;
        if (this.project.version >= 800) this.reader.readDouble(); // Last Changed (Entire List)

        // 7. Paths
        this.project.paths = this.readResourceList((r, id) => {
            const name = r.readString();
            if (this.project.version >= 800) r.readDouble(); // last changed (individual)
            const pathVer = r.readInt32();

            const isSmooth = r.readBool();
            const isClosed = r.readBool();
            const precision = r.readInt32();
            const room = r.readInt32();
            const snapX = r.readInt32();
            const snapY = r.readInt32();

            const numPoints = r.readInt32();
            const points: GmkPathPoint[] = [];
            for (let i = 0; i < numPoints; i++) {
                const x = r.readDouble();
                const y = r.readDouble();
                const speed = r.readDouble();
                points.push({ x, y, speed });
            }

            const rawData = r.readBytes(r.byteLength - r.getOffset());

            const path: GmkPath = {
                id,
                name,
                rawData,
                parse: () => {
                    if (path.parsed) return path.parsed;
                    path.parsed = { isSmooth, isClosed, precision, snapX, snapY, points };
                    return path.parsed;
                }
            };
            return path;
        }, "Paths", decryptSeed) as any;
        if (this.project.version >= 800) this.reader.readDouble(); // Last Changed (Entire List)

        // 8. Scripts
        this.project.scripts = this.readResourceList((r, id) => {
            const name = r.readString();
            if (this.project.version >= 800) r.readDouble(); // last changed (individual)
            const version = r.readInt32();
            const code = r.readString();

            const rawData = r.readBytes(r.byteLength - r.getOffset());

            const script: GmkScript = {
                id,
                name,
                rawData,
                parse: () => {
                    if (script.parsed) return script.parsed;
                    script.parsed = { code };
                    return script.parsed;
                }
            };
            return script;
        }, "Scripts", decryptSeed);

        this.project.fonts = this.readResourceList((r, id) => {
            const name = r.readString();
            if (this.project.version >= 800) r.readDouble(); // last changed (individual)
            const fontVer = r.readInt32();

            const fontName = r.readString();
            const size = r.readInt32();
            const bold = r.readBool();
            const italic = r.readBool();

            let charset = 0, aaLevel = 0, firstChar = 0, lastChar = 0;
            if (fontVer >= 800) {
                firstChar = r.readInt32();
                lastChar = r.readInt32();
                charset = r.readInt32();
                aaLevel = r.readInt32();
            }

            const rawData = r.readBytes(r.byteLength - r.getOffset());
            return { id, name, fontName, size, bold, italic, firstChar, lastChar, charset, aaLevel, rawData };
        }, "Fonts", decryptSeed) as any;
        if (this.project.version >= 800) this.reader.readDouble(); // Last Changed (Entire List)

        // 10. Timelines
        this.project.timelines = this.readResourceList((r, id) => {
            const name = r.readString();
            r.readDouble(); // last changed
            const tlVer = r.readInt32();

            const numMoments = r.readInt32();
            const moments: GmkTimelineMoment[] = [];
            for (let i = 0; i < numMoments; i++) {
                const step = r.readInt32();
                const actions = GmkParser.readActions(r);
                moments.push({ step, actions });
            }

            const rawData = r.readBytes(r.byteLength - r.getOffset());

            const timeline: GmkTimeline = {
                id,
                name,
                rawData,
                parse: () => {
                    if (timeline.parsed) return timeline.parsed;
                    timeline.parsed = { moments };
                    return timeline.parsed;
                }
            };
            return timeline;
        }, "Timelines", decryptSeed) as any;
        if (this.project.version >= 800) this.reader.readDouble(); // Last Changed (Entire List)

        // 11. Objects
        this.project.objects = this.readResourceList((r, id) => {
            const name = r.readString();
            r.readDouble(); // last changed
            const objVer = r.readInt32();
            const spriteId = r.readInt32();
            const solid = r.readBool();
            const visible = r.readBool();
            const depth = r.readInt32();
            const persistent = r.readBool();
            const parentId = r.readInt32();
            const maskId = r.readInt32();

            const events: GmkEvent[] = [];
            const numMainEvents = 11;
            for (let mainType = 0; mainType < numMainEvents; mainType++) {
                while (true) {
                    let subType = -1;
                    try {
                        subType = r.readInt32();
                    } catch (e) {
                        break;
                    }
                    if (subType === -1) break;

                    const actions = GmkParser.readActions(r);
                    events.push({ mainType, subType, actions });
                }
            }

            const rawData = r.readBytes(r.byteLength - r.getOffset());

            const object: GmkObject = {
                id,
                name,
                rawData,
                parse: () => {
                    if (object.parsed) return object.parsed;
                    object.parsed = { spriteId, solid, visible, depth, persistent, parentId, maskId, events };
                    return object.parsed;
                }
            };
            return object;
        }, "Objects", decryptSeed) as any;
        if (this.project.version >= 800) this.reader.readDouble(); // Last Changed (Entire List)

        // 12. Rooms
        this.project.rooms = this.readResourceList((r, id) => {
            const name = r.readString();
            r.readDouble(); // last changed
            const roomVer = r.readInt32();
            const caption = r.readString();
            const width = r.readInt32();
            const height = r.readInt32();
            const snapY = r.readInt32();
            const snapX = r.readInt32();
            const isometric = r.readBool();
            const speed = r.readInt32();
            const persistent = r.readBool();
            const color = r.readInt32();
            const showColor = r.readBool();
            const creationCode = r.readString();

            const numBgs = r.readInt32();
            const backgrounds: GmkRoomBackground[] = [];
            for (let i = 0; i < numBgs; i++) {
                const visible = r.readBool();
                const foreground = r.readBool();
                const bgId = r.readInt32();
                const x = r.readInt32();
                const y = r.readInt32();
                const tiledX = r.readBool();
                const tiledY = r.readBool();
                const speedX = r.readInt32();
                const speedY = r.readInt32();
                const stretch = r.readBool();
                backgrounds.push({ visible, foreground, bgId, x, y, tiledX, tiledY, speedX, speedY, stretch });
            }

            const enableViews = r.readBool();
            const numViews = r.readInt32();
            const views: GmkRoomView[] = [];
            for (let i = 0; i < numViews; i++) {
                const visible = r.readBool();
                const viewX = r.readInt32();
                const viewY = r.readInt32();
                const viewW = r.readInt32();
                const viewH = r.readInt32();
                const portX = r.readInt32();
                const portY = r.readInt32();
                const portW = r.readInt32();
                const portH = r.readInt32();
                const hBorder = r.readInt32();
                const vBorder = r.readInt32();
                const hSpeed = r.readInt32();
                const vSpeed = r.readInt32();
                const objId = r.readInt32();
                views.push({ visible, viewX, viewY, viewW, viewH, portX, portY, portW, portH, hBorder, vBorder, hSpeed, vSpeed, objId });
            }

            const numInstances = r.readInt32();
            const instances: GmkRoomInstance[] = [];
            for (let i = 0; i < numInstances; i++) {
                const x = r.readInt32();
                const y = r.readInt32();
                const objId = r.readInt32();
                const instId = r.readInt32();
                const instCreationCode = r.readString();
                const locked = r.readBool();
                instances.push({ id: instId, objId, x, y, creationCode: instCreationCode, locked });
            }

            const numTiles = r.readInt32();
            const tiles: GmkRoomTile[] = [];
            for (let i = 0; i < numTiles; i++) {
                const x = r.readInt32();
                const y = r.readInt32();
                const bgId = r.readInt32();
                const bgX = r.readInt32();
                const bgY = r.readInt32();
                const tileW = r.readInt32();
                const tileH = r.readInt32();
                const depth = r.readInt32();
                const tileId = r.readInt32();
                const locked = r.readBool();
                tiles.push({ id: tileId, bgId, x, y, bgX, bgY, width: tileW, height: tileH, depth, locked });
            }

            const remember = r.readBool();
            const editorWidth = r.readInt32();
            const editorHeight = r.readInt32();
            const showGrid = r.readBool();
            const showObjects = r.readBool();
            const showTiles = r.readBool();
            const showBackgrounds = r.readBool();
            const showForegrounds = r.readBool();
            const showViews = r.readBool();
            const deleteUnderlyingObjects = r.readBool();
            const deleteUnderlyingTiles = r.readBool();
            const tab = r.readInt32();
            const scrollBarX = r.readInt32();
            const scrollBarY = r.readInt32();

            const rawData = r.readBytes(r.byteLength - r.getOffset());

            const room: GmkRoom = {
                id,
                name,
                rawData,
                parse: () => {
                    if (room.parsed) return room.parsed;
                    room.parsed = { caption, width, height, speed, persistent, color, showColor, creationCode, backgrounds, views, instances, tiles };
                    return room.parsed;
                }
            };
            return room;
        }, "Rooms", decryptSeed) as any;
        if (this.project.version >= 800) this.reader.readDouble(); // Last Changed (Entire List)

        try {
            this.project.lastInstanceId = this.reader.readInt32();
            this.project.lastTileId = this.reader.readInt32();
        } catch (e) {
            console.warn("Failed to read last instance/tile IDs:", e);
        }

        // 13. Game Information
        try {
            const gameInfoVer = this.reader.readInt32();
            if (gameInfoVer >= 800) {
                const exists = this.reader.readBool();
                if (exists) {
                    const chunk = this.reader.readZlibChunk(decryptSeed);
                    if (chunk.byteLength > 0) {
                        const r = new BinaryReader(chunk.buffer, chunk.byteOffset, chunk.byteLength);
                        const infoVer = r.readInt32();
                        const backgroundColor = r.readInt32();
                        const window = r.readBool();
                        const caption = r.readString();
                        const left = r.readInt32();
                        const top = r.readInt32();
                        const width = r.readInt32();
                        const height = r.readInt32();
                        const showBorder = r.readBool();
                        const allowResize = r.readBool();
                        const stayOnTop = r.readBool();
                        const pauseGame = r.readBool();
                        r.readDouble(); // last changed
                        const gameInfo = r.readString();

                        this.project.gameInformation = {
                            backgroundColor,
                            window,
                            caption,
                            left,
                            top,
                            width,
                            height,
                            showBorder,
                            allowResize,
                            stayOnTop,
                            pauseGame,
                            text: gameInfo
                        };
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to read game information:", e);
        }

        // 14. Global Settings
        try {
            const globalSettingsVer = this.reader.readInt32();
            if (globalSettingsVer >= 800) {
                const exists = this.reader.readBool();
                if (exists) {
                    const chunk = this.reader.readZlibChunk(decryptSeed);
                    if (chunk.byteLength > 0) {
                        const r = new BinaryReader(chunk.buffer, chunk.byteOffset, chunk.byteLength);
                        const settingsVer = r.readInt32();
                        const startFullscreen = r.readBool();
                        const interpolateColors = r.readBool();
                        const dontDrawBorder = r.readBool();
                        const displayCursor = r.readBool();
                        const scaling = r.readInt32();
                        const allowWindowResize = r.readBool();
                        const alwaysOnTop = r.readBool();
                        const colorOutsideRoom = r.readInt32();
                        const setResolution = r.readBool();
                        const colorDepth = r.readInt32();
                        const resolution = r.readInt32();
                        const frequency = r.readInt32();
                        const dontShowButtons = r.readBool();
                        const useSynchronization = r.readBool();
                        const disableScreensavers = r.readBool();
                        const letF4SwitchFullscreen = r.readBool();
                        const letF1ShowGameInfo = r.readBool();
                        const letEscEndGame = r.readBool();
                        const letF5SaveF6Load = r.readBool();
                        const letF9Screenshot = r.readBool();
                        const treatCloseAsEsc = r.readBool();
                        const gamePriority = r.readInt32();
                        const freezeOnLoseFocus = r.readBool();
                        const loadBarMode = r.readInt32();
                        const backLoadBar = r.readInt32();
                        const frontLoadBar = r.readInt32();
                        const showCustomLoadImage = r.readBool();
                        const imagePartiallyTransparent = r.readBool();
                        const loadImageAlpha = r.readInt32();
                        const scaleProgressBar = r.readBool();
                        const displayErrors = r.readBool();
                        const writeToLog = r.readInt32();
                        const abortOnError = r.readBool();
                        const treatUninitializedAs0 = r.readBool();
                        const author = r.readString();
                        const version = r.readString();
                        const information = r.readString();
                        const major = r.readInt32();
                        const minor = r.readInt32();
                        const release = r.readInt32();
                        const build = r.readInt32();
                        const company = r.readString();
                        const product = r.readString();
                        const copyright = r.readString();
                        const description = r.readString();

                        this.project.globalSettings = {
                            startFullscreen,
                            interpolateColors,
                            dontDrawBorder,
                            displayCursor,
                            scaling,
                            allowWindowResize,
                            alwaysOnTop,
                            colorOutsideRoom,
                            setResolution,
                            colorDepth,
                            resolution,
                            frequency,
                            dontShowButtons,
                            useSynchronization,
                            disableScreensavers,
                            letF4SwitchFullscreen,
                            letF1ShowGameInfo,
                            letEscEndGame,
                            letF5SaveF6Load,
                            letF9Screenshot,
                            treatCloseAsEsc,
                            gamePriority,
                            freezeOnLoseFocus,
                            loadBarMode,
                            backLoadBar,
                            frontLoadBar,
                            showCustomLoadImage,
                            imagePartiallyTransparent,
                            loadImageAlpha,
                            scaleProgressBar,
                            displayErrors,
                            writeToLog: writeToLog !== 0,
                            abortOnError,
                            treatUninitializedAs0,
                            author,
                            version,
                            information,
                            major,
                            minor,
                            release,
                            build,
                            company,
                            product,
                            copyright,
                            description
                        };
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to read global settings:", e);
        }

        // 15. Resource Tree
        try {
            console.log("Reading Resource Tree...");
            this.project.resourceTree = this.readResourceTree();
        } catch (e) {
            console.warn("Failed to read resource tree:", e);
        }

        console.log("Successfully sequenced GMK DNA.");
        console.log(`Found ${this.project.sprites.length} sprites, ${this.project.objects.length} objects, ${this.project.rooms.length} rooms.`);

        return this.project;
    }

    private readResourceTree(): GmkResourceTree {
        const ver = this.reader.readInt32();
        return this.readResourceTreeNode();
    }

    private readResourceTreeNode(): GmkResourceTree {
        const status = this.reader.readInt32();
        const kind = this.reader.readInt32();
        const id = this.reader.readInt32();
        const name = this.reader.readString();
        const childCount = this.reader.readInt32();

        const children: GmkResourceTree[] = [];
        for (let i = 0; i < childCount; i++) {
            children.push(this.readResourceTreeNode());
        }

        return { name, id, kind, status, children };
    }
}
export interface GmkSpriteData {
    width: number;
    height: number;
    subImages: number;
    originX: number;
    originY: number;
}

export interface GmkSprite extends GmkResource {
    rawData: Uint8Array;
    parsed?: GmkSpriteData;
    parse(): GmkSpriteData;
}

export interface GmkScriptData {
    code: string;
}

export interface GmkScript extends GmkResource {
    rawData: Uint8Array;
    parsed?: GmkScriptData;
    parse(): GmkScriptData;
}

export interface GmkAction {
    libId: number;
    actionId: number;
    actionKind: number;
    allowRelative: boolean;
    isQuestion: boolean;
    canApplyTo: boolean;
    execType: number;
    execName: string;
    code: string;
    argsCount: number;
    argsType: number[];
    target: number;
    relative: boolean;
    argsVal: string[];
    not: boolean;
}

export interface GmkEvent {
    mainType: number;
    subType: number;
    actions: GmkAction[];
}

export interface GmkObjectData {
    spriteId: number;
    solid: boolean;
    visible: boolean;
    depth: number;
    persistent: boolean;
    parentId: number;
    maskId: number;
    events: GmkEvent[];
}

export interface GmkObject extends GmkResource {
    rawData: Uint8Array;
    parsed?: GmkObjectData;
    parse(): GmkObjectData;
}

export interface GmkRoomBackground {
    visible: boolean;
    foreground: boolean;
    bgId: number;
    x: number;
    y: number;
    tiledX: boolean;
    tiledY: boolean;
    speedX: number;
    speedY: number;
    stretch: boolean;
}

export interface GmkRoomView {
    visible: boolean;
    viewX: number;
    viewY: number;
    viewW: number;
    viewH: number;
    portX: number;
    portY: number;
    portW: number;
    portH: number;
    hBorder: number;
    vBorder: number;
    hSpeed: number;
    vSpeed: number;
    objId: number;
}

export interface GmkRoomInstance {
    id: number;
    objId: number;
    x: number;
    y: number;
    creationCode: string;
    locked: boolean;
}

export interface GmkRoomTile {
    id: number;
    bgId: number;
    x: number;
    y: number;
    bgX: number;
    bgY: number;
    width: number;
    height: number;
    depth: number;
    locked: boolean;
}

export interface GmkRoomData {
    caption: string;
    width: number;
    height: number;
    speed: number;
    persistent: boolean;
    color: number;
    showColor: boolean;
    creationCode: string;
    backgrounds: GmkRoomBackground[];
    views: GmkRoomView[];
    instances: GmkRoomInstance[];
    tiles: GmkRoomTile[];
}

export interface GmkRoom extends GmkResource {
    rawData: Uint8Array;
    parsed?: GmkRoomData;
    parse(): GmkRoomData;
}

export interface GmkBackgroundData {
    width: number;
    height: number;
    useAsTileset: boolean;
    tileWidth: number;
    tileHeight: number;
    hOffset: number;
    vOffset: number;
    hSep: number;
    vSep: number;
}

export interface GmkBackground extends GmkResource {
    rawData: Uint8Array;
    parsed?: GmkBackgroundData;
    parse(): GmkBackgroundData;
}

export interface GmkSound extends GmkResource {
    kind: number;
    fileType: string;
    fileName: string;
    volume: number;
    pan: number;
    preload: boolean;
    rawData?: Uint8Array;
}

export interface GmkFont extends GmkResource {
    fontName: string;
    size: number;
    bold: boolean;
    italic: boolean;
    charset: number;
    aaLevel: number;
    rawData?: Uint8Array;
}

export interface GmkPathPoint {
    x: number;
    y: number;
    speed: number;
}

export interface GmkPathData {
    isSmooth: boolean;
    isClosed: boolean;
    precision: number;
    snapX: number;
    snapY: number;
    points: GmkPathPoint[];
}

export interface GmkPath extends GmkResource {
    rawData: Uint8Array;
    parsed?: GmkPathData;
    parse(): GmkPathData;
}

export interface GmkTimelineMoment {
    step: number;
    actions: GmkAction[];
}

export interface GmkTimelineData {
    moments: GmkTimelineMoment[];
}

export interface GmkTimeline extends GmkResource {
    rawData: Uint8Array;
    parsed?: GmkTimelineData;
    parse(): GmkTimelineData;
}

export interface GmkConstant {
    name: string;
    value: string;
}

export interface GmkTrigger {
    name: string;
    condition: string;
    checkStep: number;
    constant: string;
}

export interface GmkGameInformation {
    backgroundColor: number;
    window: boolean;
    caption: string;
    left: number;
    top: number;
    width: number;
    height: number;
    showBorder: boolean;
    allowResize: boolean;
    stayOnTop: boolean;
    pauseGame: boolean;
    text: string;
}

export interface GmkGlobalSettings {
    startFullscreen: boolean;
    interpolateColors: boolean;
    dontDrawBorder: boolean;
    displayCursor: boolean;
    scaling: number;
    allowWindowResize: boolean;
    alwaysOnTop: boolean;
    colorOutsideRoom: number;
    setResolution: boolean;
    colorDepth: number;
    resolution: number;
    frequency: number;
    dontShowButtons: boolean;
    useSynchronization: boolean;
    disableScreensavers: boolean;
    letF4SwitchFullscreen: boolean;
    letF1ShowGameInfo: boolean;
    letEscEndGame: boolean;
    letF5SaveF6Load: boolean;
    letF9Screenshot: boolean;
    treatCloseAsEsc: boolean;
    gamePriority: number;
    freezeOnLoseFocus: boolean;
    loadBarMode: number;
    backLoadBar: number;
    frontLoadBar: number;
    showCustomLoadImage: boolean;
    imagePartiallyTransparent: boolean;
    loadImageAlpha: number;
    scaleProgressBar: boolean;
    displayErrors: boolean;
    writeToLog: boolean;
    abortOnError: boolean;
    treatUninitializedAs0: boolean;
    author: string;
    version: string;
    information: string;
    major: number;
    minor: number;
    release: number;
    build: number;
    company: string;
    product: string;
    copyright: string;
    description: string;
}

export interface GmkResourceTree {
    name: string;
    id: number;
    kind: number;
    status: number;
    children: GmkResourceTree[];
}

export interface GmkProject {
    version: number;
    appId: number;
    constants: GmkConstant[];
    triggers: GmkTrigger[];
    sprites: (GmkSprite | FossilizedResource)[];
    sounds: (GmkSound | FossilizedResource)[];
    backgrounds: (GmkBackground | FossilizedResource)[];
    paths: (GmkPath | FossilizedResource)[];
    scripts: (GmkScript | FossilizedResource)[];
    fonts: (GmkFont | FossilizedResource)[];
    timelines: (GmkTimeline | FossilizedResource)[];
    objects: (GmkObject | FossilizedResource)[];
    rooms: (GmkRoom | FossilizedResource)[];
    lastInstanceId?: number;
    lastTileId?: number;
    gameInformation?: GmkGameInformation;
    globalSettings?: GmkGlobalSettings;
    resourceTree?: GmkResourceTree;
}

export class GmkParser {
    public static readActions(r: BinaryReader): GmkAction[] {
        try {
            const actionsVer = r.readInt32();
            const numActions = r.readInt32();

            // Safety check: don't try to read more than 1000 actions per event
            if (numActions < 0 || numActions > 1000) {
                console.warn(`Invalid number of actions: ${numActions}. Skipping actions.`);
                return [];
            }

            const actions: GmkAction[] = [];
            for (let k = 0; k < numActions; k++) {
                // ...
            const actionVer = r.readInt32();
            const libId = r.readInt32();
            const actionId = r.readInt32();
            const actionKind = r.readInt32();
            const allowRelative = r.readBool();
            const isQuestion = r.readBool();
            const canApplyTo = r.readBool();
            const execType = r.readInt32();
            const execName = r.readString();
            const code = r.readString();
            const argsCount = r.readInt32();

            const argsType: number[] = [];
            for (let a = 0; a < argsCount; a++) {
                argsType.push(r.readInt32());
            }

            const target = r.readInt32();
            const relative = r.readBool();

            const argsVal: string[] = [];
            for (let a = 0; a < argsCount; a++) {
                argsVal.push(r.readString());
            }

            const not = r.readBool();

            actions.push({
                libId, actionId, actionKind, allowRelative, isQuestion, canApplyTo,
                execType, execName, code, argsCount, argsType, target, relative, argsVal, not
            });
        }
        return actions;
    } catch (e) {
        console.error("Error reading actions:", e);
        return [];
    }
}

    public static parse(buffer: ArrayBuffer): GmkProject {
        try {
            const builder = new GmkProjectBuilder(buffer);
            return builder.build();
        } catch (e) {
            console.error("Critical error parsing GMK file:", e);
            throw new Error(`Failed to parse GMK file: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
}
