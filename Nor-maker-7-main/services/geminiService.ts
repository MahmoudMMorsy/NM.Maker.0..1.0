
import { GoogleGenAI, Type } from "@google/genai";
import { GameMetadata, GeneratedGame, RoomData, ScriptAsset, GameObject, UIMenu, SpriteAsset, BackgroundAsset, SoundAsset, FontAsset } from '../types';
import { getStandaloneAssets } from '../utils/standalonePresets';
import { compileLocalGame, synthesizePixelArt } from './localAIService';

const getApiKey = (): string | undefined => {
    try {
        if (typeof process !== 'undefined' && process.env) {
            const env = process.env;
            return env['GEMINI_API_KEY'] || env['API_KEY'];
        }
    } catch (e) {}
    return undefined;
};

export const FALLBACK_BOX_ART = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
export const FALLBACK_SPRITE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgABAAAAAQCAYAAAAf8/9hAAAAMklEQVR42mP8/5/hPwMDA8NQAwMomKYG/IcB8nXg///zsHwN/v//DwP5OvB/8HwNUA8AAElxK91j2b2AAAAAAElFTkSuQmCC";

// --- AI GENERATORS ---

export const repairJSON = (json: string): string => {
    let cleaned = json.trim();
    // Remove markdown wrapping if present
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();

    // Try direct parsing first
    try {
        JSON.parse(cleaned);
        return cleaned;
    } catch (e) {
        // Direct parsing failed, proceed to extract/repair
    }

    // Find the starting point of JSON
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        startIdx = Math.min(firstBrace, firstBracket);
    } else {
        startIdx = firstBrace !== -1 ? firstBrace : firstBracket;
    }

    if (startIdx === -1) {
        return cleaned; // fallback
    }

    // Attempt to extract the first balanced JSON element
    let stack: ('{' | '[')[] = [];
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = startIdx; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (char === '\\') {
            escape = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (inString) {
            continue;
        }
        if (char === '{') {
            stack.push('{');
        } else if (char === '[') {
            stack.push('[');
        } else if (char === '}') {
            if (stack[stack.length - 1] === '{') {
                stack.pop();
            }
            if (stack.length === 0) {
                endIdx = i;
                break;
            }
        } else if (char === ']') {
            if (stack[stack.length - 1] === '[') {
                stack.pop();
            }
            if (stack.length === 0) {
                endIdx = i;
                break;
            }
        }
    }

    if (endIdx !== -1) {
        const extracted = cleaned.slice(startIdx, endIdx + 1);
        try {
            JSON.parse(extracted);
            return extracted;
        } catch (e) {
            // Extracted failed, fallback to healing it
            cleaned = extracted;
        }
    } else {
        // If it was truncated (no balanced end found), slice from startIdx to end of cleaned
        cleaned = cleaned.slice(startIdx);
    }

    // --- HEAL TRUNCATED OR MALFORMED JSON ---
    // Re-evaluate stack for the sliced/cleaned string to append missing closures
    stack = [];
    inString = false;
    escape = false;
    let lastValidCharIdx = -1;

    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (char === '\\') {
            escape = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (inString) {
            continue;
        }
        if (char === '{' || char === '[') {
            stack.push(char);
            lastValidCharIdx = i;
        } else if (char === '}') {
            if (stack[stack.length - 1] === '{') {
                stack.pop();
                lastValidCharIdx = i;
            }
        } else if (char === ']') {
            if (stack[stack.length - 1] === '[') {
                stack.pop();
                lastValidCharIdx = i;
            }
        } else if (!/\s/.test(char)) {
            lastValidCharIdx = i;
        }
    }

    // Slice up to the last valid non-whitespace character
    if (lastValidCharIdx !== -1) {
        cleaned = cleaned.slice(0, lastValidCharIdx + 1);
    }

    if (inString) {
        cleaned += '"';
    }

    // Clean up trailing commas or incomplete keys/values
    cleaned = cleaned.trim();
    while (cleaned.endsWith(',') || cleaned.endsWith(':') || cleaned.endsWith('{') || cleaned.endsWith('[')) {
        if (cleaned.endsWith('{') || cleaned.endsWith('[')) {
            // If it ends with opening, pop it from our closure reconstruction stack as well
            stack.pop();
        }
        cleaned = cleaned.slice(0, -1).trim();
    }

    // Append missing closures in reverse order
    while (stack.length > 0) {
        const open = stack.pop();
        if (open === '{') {
            cleaned += '}';
        } else if (open === '[') {
            cleaned += ']';
        }
    }

    return cleaned;
};

export const generateGameConcept = async (prompt: string): Promise<{ metadata: GameMetadata, assemblyCode: string }> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please set it in the environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Create a retro NES game concept based on: "${prompt}".`,
        config: {
            systemInstruction: "You are an expert NES developer. Return a JSON object with metadata (title, story, genre, controls) and valid 6502 assembly code (assemblyCode) for a simple NROM NES program that displays a background color.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    metadata: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            story: { type: Type.STRING },
                            genre: { type: Type.STRING },
                            controls: { type: Type.STRING },
                        },
                        required: ['title', 'story', 'genre', 'controls']
                    },
                    assemblyCode: { type: Type.STRING, description: "6502 assembly code for NES" }
                },
                required: ['metadata', 'assemblyCode']
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    try {
        return JSON.parse(repairJSON(text));
    } catch (e) {
        console.error("Failed to parse AI response as JSON:", text);
        throw new Error("AI returned invalid JSON format. Please try again.");
    }
};

export const generateBoxArt = async (title: string, story: string): Promise<string> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `Design a retro 8-bit NES box art layout for a game titled "${title}". Story: ${story}.`,
            config: {
                responseMimeType: 'application/json',
                systemInstruction: "You are an expert retro NES box art designer. Create a beautiful visual composition for the game box art. Specify colors, layout, and retro elements. Background colors must be high-contrast and saturated (avoid boring washed-out colors). Create 15 to 30 visual shapes/elements to draw on the box art to represent mountains, castles, stars, player characters, or spaceship elements based on the game theme.",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        backgroundColor: { type: Type.STRING, description: "Solid hex color for the background, e.g. '#020617', '#090514'" },
                        borderColor: { type: Type.STRING, description: "Border color, e.g. '#FFD700' (Gold)" },
                        titleColor: { type: Type.STRING, description: "Color for the title, e.g. '#EF4444'" },
                        textColor: { type: Type.STRING, description: "Color for secondary text" },
                        genreText: { type: Type.STRING, description: "The genre, e.g. 'ACTION SERIES', 'ARCADE SERIES', 'ADVENTURE SERIES'" },
                        artStyle: { type: Type.STRING, description: "Thematic style, e.g. 'space', 'fantasy', 'cyberpunk', 'retro'" },
                        elements: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    shape: { type: Type.STRING, description: "Type of shape: 'rect', 'circle', 'line', 'triangle', 'star'" },
                                    color: { type: Type.STRING },
                                    x: { type: Type.INTEGER, description: "Position X from 0 to 256" },
                                    y: { type: Type.INTEGER, description: "Position Y from 0 to 360" },
                                    width: { type: Type.INTEGER },
                                    height: { type: Type.INTEGER },
                                    radius: { type: Type.INTEGER }
                                },
                                required: ['shape', 'color', 'x', 'y']
                            },
                            description: "List of 15 to 30 visual shapes/elements to draw on the box art to create a beautiful retro scene"
                        }
                    },
                    required: ['backgroundColor', 'borderColor', 'titleColor', 'textColor', 'genreText', 'artStyle', 'elements']
                }
            }
        });

        const text = response.text;
        if (!text) return FALLBACK_BOX_ART;
        const config = JSON.parse(repairJSON(text));

        // Build canvas
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) return FALLBACK_BOX_ART;

        // 1. Fill background
        ctx.fillStyle = config.backgroundColor || '#000000';
        ctx.fillRect(0, 0, 256, 360);

        // 2. Draw retro elements / scene illustration
        const elements = config.elements || [];
        for (const el of elements) {
            ctx.fillStyle = el.color || '#ffffff';
            ctx.strokeStyle = el.color || '#ffffff';
            ctx.lineWidth = el.width || 2;

            if (el.shape === 'rect') {
                ctx.fillRect(el.x, el.y, el.width || 20, el.height || 20);
            } else if (el.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(el.x, el.y, el.radius || el.width || 10, 0, Math.PI * 2);
                ctx.fill();
            } else if (el.shape === 'line') {
                ctx.beginPath();
                ctx.moveTo(el.x, el.y);
                ctx.lineTo(el.x + (el.width || 20), el.y + (el.height || 0));
                ctx.stroke();
            } else if (el.shape === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(el.x, el.y);
                ctx.lineTo(el.x - (el.width || 15) / 2, el.y + (el.height || 20));
                ctx.lineTo(el.x + (el.width || 15) / 2, el.y + (el.height || 20));
                ctx.closePath();
                ctx.fill();
            } else if (el.shape === 'star') {
                ctx.beginPath();
                const spikes = 5;
                const outerRadius = el.radius || el.width || 8;
                const innerRadius = outerRadius / 2;
                let rot = Math.PI / 2 * 3;
                let x = el.x;
                let y = el.y;
                let step = Math.PI / spikes;

                ctx.moveTo(el.x, el.y - outerRadius);
                for (let i = 0; i < spikes; i++) {
                    x = el.x + Math.cos(rot) * outerRadius;
                    y = el.y + Math.sin(rot) * outerRadius;
                    ctx.lineTo(x, y);
                    rot += step;

                    x = el.x + Math.cos(rot) * innerRadius;
                    y = el.y + Math.sin(rot) * innerRadius;
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.lineTo(el.x, el.y - outerRadius);
                ctx.closePath();
                ctx.fill();
            }
        }

        // 3. Draw NES Black Box Style retro grid / stripes
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';

        // Draw top brand bar (Nintendo style but custom)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 256, 36);

        ctx.strokeStyle = config.borderColor || '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(4, 4, 248, 352);

        // Top Header text
        ctx.fillStyle = config.textColor || '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText("NOR ENTERTAINMENT SYSTEM", 128, 16);

        // Genre label on the left/bottom
        ctx.fillStyle = config.titleColor || '#EF4444';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(config.genreText || "ACTION SERIES", 128, 28);

        // 4. Draw Title with big blocky typography
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(10, 245, 236, 85);
        ctx.strokeStyle = config.borderColor || '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 245, 236, 85);

        ctx.fillStyle = config.titleColor || '#EF4444';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(title.toUpperCase(), 128, 275);

        ctx.fillStyle = config.textColor || '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText("NOR-MAKER ORIGINAL", 128, 300);

        // Gold Seal of Quality
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(215, 305, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 5px sans-serif';
        ctx.fillText("NOR", 215, 303);
        ctx.fillText("ORIGINAL", 215, 309);

        return canvas.toDataURL('image/png');
    } catch (e) {
        console.error("Box art generation failed", e);
        return FALLBACK_BOX_ART;
    }
};

export const generatePixelAsset = async (context: string, type: 'player'|'ground'|'item'|'enemy'): Promise<string> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `Generate a single 16x16 pixel art sprite for a "${type}" in a game about: ${context}.`,
            config: {
                responseMimeType: 'application/json',
                systemInstruction: "You are an expert 8-bit retro game artist. Design a beautiful 16x16 pixel art sprite. Decide a cohesive color palette of 2 to 5 colors (hex codes like #FF0000, or 'transparent'). Then create a 16x16 grid where each item represents the color at that pixel.",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        palette: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "List of hex colors, e.g. ['#ff0000', '#00ff00', 'transparent']"
                        },
                        grid: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "16 rows, each having exactly 16 strings matching one of the colors in the palette"
                            }
                        }
                    },
                    required: ['palette', 'grid']
                }
            }
        });

        const text = response.text;
        if (!text) {
            const assets = getStandaloneAssets();
            if (type === 'player') return assets.player;
            if (type === 'ground') return assets.ground;
            if (type === 'item') return assets.item;
            if (type === 'enemy') return assets.enemy;
            return FALLBACK_SPRITE;
        }
        const config = JSON.parse(repairJSON(text));

        // Draw to 16x16 canvas
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            const assets = getStandaloneAssets();
            if (type === 'player') return assets.player;
            if (type === 'ground') return assets.ground;
            if (type === 'item') return assets.item;
            if (type === 'enemy') return assets.enemy;
            return FALLBACK_SPRITE;
        }

        ctx.clearRect(0, 0, 16, 16);
        for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
                const color = config.grid?.[r]?.[c] || 'transparent';
                if (color !== 'transparent' && color !== 'none') {
                    ctx.fillStyle = color;
                    ctx.fillRect(c, r, 1, 1);
                }
            }
        }
        return canvas.toDataURL('image/png');
    } catch (e) {
        console.error(`Asset generation failed for ${type}. Falling back to high-quality local preset!`, e);
        const assets = getStandaloneAssets();
        if (type === 'player') return assets.player;
        if (type === 'ground') return assets.ground;
        if (type === 'item') return assets.item;
        if (type === 'enemy') return assets.enemy;
        return FALLBACK_SPRITE;
    }
};

export const getLocalOllamaModel = async (): Promise<string> => {
    try {
        const response = await fetch("http://localhost:11434/api/tags");
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.models)) {
                const names = data.models.map((m: any) => m.name.toLowerCase());

                // Prioritize Qwen2.5 Coder
                const qwen = names.find((n: string) => n.includes("qwen") || n.includes("coder"));
                if (qwen) return qwen;

                // Prioritize SmolLM2
                const smollm = names.find((n: string) => n.includes("smol") || n.includes("lm"));
                if (smollm) return smollm;

                // Any first available model
                if (names.length > 0) return names[0];
            }
        }
    } catch (e) {
        console.warn("[Local AI] Failed to query Ollama tags API:", e);
    }
    return "qwen2.5-coder:0.5b"; // Default fallback
};

export const generateLocalGameProjectData = (prompt: string, actionLibrary: any[]): any => {
    return compileLocalGame(prompt, actionLibrary);
};

export const generateGameProjectData = async (prompt: string, actionLibrary: any[], imageBase64?: string, forceLocal: boolean = false): Promise<any> => {
    const apiKey = getApiKey();
    if (!apiKey || forceLocal) {
        console.log("[Local AI] Force Local or No Gemini API key found. Using fully local, distilled offline model (Noor-Nanopixel-v3-Distilled) for zero-latency secure generation.");
        return generateLocalGameProjectData(prompt, actionLibrary);
    }

    const ai = new GoogleGenAI({ apiKey });

    const librarySummary = actionLibrary.map(l => ({
        id: l.id,
        name: l.name,
        params: l.params.map((p: any) => ({ key: p.key, type: p.type, options: p.options }))
    }));

    const systemPrompt = `You are a Lead Game Developer for the NOR Engine, an 8-bit style retro game development environment.
        Create a complete, fully playable, and highly interactive game project structure based on the user's prompt or image.

        Return a JSON object with this structure:
        {
          "metadata": { "title": "...", "story": "...", "genre": "...", "controls": "..." },
          "sprites": [
            { "id": "spr_player", "name": "spr_player", "role": "player", "prompt": "pixel art of a hero..." },
            { "id": "spr_ground", "name": "spr_ground", "role": "ground", "prompt": "pixel art of a stone tile..." },
            { "id": "spr_enemy", "name": "spr_enemy", "role": "enemy", "prompt": "pixel art of a monster..." }
          ],
          "objects": [
            {
              "id": "obj_player", "name": "obj_player", "spriteId": "spr_player", "solid": false,
              "events": {
                "step": [
                  { "libId": "move_gravity", "params": { "amt": 0.4 } },
                  { "libId": "move_keyboard", "params": { "spd": 2, "jmp": 8 } }
                ],
                "collision_obj_enemy": [{ "libId": "main2_game_over", "params": {} }]
              }
            },
            {
              "id": "obj_ground", "name": "obj_ground", "spriteId": "spr_ground", "solid": true,
              "events": {}
            }
          ],
          "rooms": [
            {
              "id": "rm_1", "width": 16, "height": 15,
              "map": [0, 0, 1, 1, ...], // 240 integers. 0=empty, 1=solid ground tile, 2=obj_player, 3=obj_enemy, etc. (ID = index in objects array + 2)
              "settings": { "name": "room1", "caption": "Level 1", "bgColor": "#C0C0C0" }
            }
          ]
        }

        CRITICAL NOR ENGINE ARCHITECTURE RULES:
        1. Collision events MUST be named 'collision_<target_object_id>'. For example, if the player collides with 'obj_enemy', the event key MUST be 'collision_obj_enemy'. If they collide with 'obj_coin', the event key MUST be 'collision_obj_coin'. Do not use short/un-prefixed names like 'collision_enemy' or 'collision_coin'.
        2. Any solid tile, floor block, obstacle, platform, brick, wall, or grid element that characters should walk on or bump into MUST have "solid": true in its object definition so players can stand on and collide with them.
        3. For side-scroller/platformer games, players ('obj_player') require gravity! Add "move_gravity" action (force: 0.4) on the step event in addition to "move_keyboard". Otherwise, they float.
        4. For top-down or 8-way movement games, use "move_8way" instead of "move_keyboard". Do NOT add gravity for top-down games.
        5. Ensure there is a complete game loop:
           - A player character with controls.
           - Solid platforms or floors for side-scrollers.
           - Items to collect (e.g. coins, stars) which trigger 'score_change_score' and get destroyed on collision.
           - Hazards or enemies that trigger 'main2_game_over' or reduce health on collision.
           - A victory condition or exit portal (e.g., reaching a portal goes to next room, or collecting items triggers win).

        Available Action Library IDs: ${librarySummary.map(l => l.id).join(', ')}.
        Use these IDs in the "libId" field of events.

        Ensure the map is a flat array of exactly 240 integers.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            metadata: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    story: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    controls: { type: Type.STRING }
                },
                required: ["title", "story", "genre", "controls"]
            },
            sprites: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        role: { type: Type.STRING, description: "Role of the sprite: 'player', 'ground', 'wall', 'enemy', 'item', 'gate'" },
                        prompt: { type: Type.STRING, description: "Pixel art visual prompt description for the asset generation" }
                    },
                    required: ["id", "name", "role", "prompt"]
                }
            },
            objects: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        spriteId: { type: Type.STRING, description: "The ID of the sprite associated with this object (e.g. 'spr_player')" },
                        solid: { type: Type.BOOLEAN, description: "Whether this object is solid (true for ground, wall, bricks, obstacle)" },
                        events: {
                            type: Type.STRING,
                            description: "JSON-serialized object mapping event keys (like 'step', 'create', 'collision_<object_id>') to action arrays. Example: '{\"step\": [{\"libId\": \"move_keyboard\", \"params\": {\"spd\": 2, \"jmp\": 8}}]}'"
                        }
                    },
                    required: ["id", "name", "events"]
                }
            },
            rooms: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        width: { type: Type.INTEGER },
                        height: { type: Type.INTEGER },
                        map: {
                            type: Type.ARRAY,
                            items: { type: Type.INTEGER },
                            description: "Flat array of exactly 240 tile integers (16x15 grid)"
                        },
                        settings: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                caption: { type: Type.STRING },
                                bgColor: { type: Type.STRING }
                            },
                            required: ["name", "caption", "bgColor"]
                        }
                    },
                    required: ["id", "width", "height", "map", "settings"]
                }
            }
        },
        required: ["metadata", "sprites", "objects", "rooms"]
    };

    const parts: any[] = [{ text: prompt || "Create a game based on this image" }];

    if (imageBase64) {
        const mimeType = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/)?.[1] || "image/png";
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: imageBase64.split(',')[1] || imageBase64
            }
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                systemInstruction: systemPrompt
            },
            contents: [{ role: 'user', parts }]
        });

        if (!response.text) {
            throw new Error("AI returned an empty response");
        }

        try {
            const parsed = JSON.parse(repairJSON(response.text));
            if (parsed && parsed.objects && Array.isArray(parsed.objects)) {
                parsed.objects.forEach((obj: any) => {
                    if (typeof obj.events === 'string') {
                        try {
                            obj.events = JSON.parse(obj.events);
                        } catch (e) {
                            console.warn("Failed to parse events string for object:", obj.id, e);
                            obj.events = {};
                        }
                    }
                });
            }
            return parsed;
        } catch (parseErr) {
            console.error("Failed to parse AI response as JSON:", response.text);
            throw new Error("AI response was not valid JSON");
        }
    } catch (e: any) {
        console.error("Gemini API Error. Falling back to local offline game generation model:", e);
        return generateLocalGameProjectData(prompt, actionLibrary);
    }
};

export const generateWebPrototype = async (title: string, story: string, assets: any): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Create a single-file HTML5 game prototype for "${title}". Story: ${story}.`,
        config: {
            systemInstruction: `You are an expert web game developer. Create a self-contained HTML5 game using Canvas API.
            It MUST include a 'GAME_DATA' object with a 'map' property in the source code, formatted like:
            const GAME_DATA = { map: [0, 0, 1, 1, ...] }; // Flat array of tile IDs (0=empty, 1=wall) for a 16x15 grid (240 tiles).
            Return ONLY the raw HTML code (starting with <!DOCTYPE html>). Do not use markdown blocks.`
        }
    });

    let code = response.text || "";
    // Clean up markdown if present
    code = code.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    return code;
};

export const generateJavaCode = async (title: string, levelMap: number[], width: number): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });
    const mapStr = JSON.stringify(levelMap);
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Write a J2ME GameMidlet.java for "${title}". Map: ${mapStr.substring(0, 500)}...`,
        config: {
            systemInstruction: `Write a J2ME (MIDP 2.0, CLDC 1.1) GameMidlet.java source code.
            The game is a simple platformer.
            The code must:
            - Extend MIDlet and implement CommandListener.
            - Use GameCanvas.
            - Have a simple game loop.
            - Render the map tiles.
            - Handle basic player movement.
            - Be a single file class named "GameMidlet".
            Return ONLY the Java code. Do not use markdown.`
        }
    });

    let code = response.text || "";
    code = code.replace(/^```java\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    return code;
};

export const generateActionCodeFromPrompt = async (prompt: string, library: any[], context: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });

    // We only need the summary of actions
    const librarySummary = library.map(l => ({ id: l.id, name: l.name }));

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Create JavaScript (GML logic) for the following prompt: "${prompt}".\nAssets Context:\n${context}\nAvailable Library IDs:\n${JSON.stringify(librarySummary)}`,
        config: {
            systemInstruction: `You are an expert game maker developer writing logic for a GML to JS engine.
            Return ONLY raw, valid Javascript code meant to run inside a component instance block.
            Do not use markdown blocks. Your code will be string-embedded.`
        }
    });

    let code = response.text || "";
    code = code.replace(/^```javascript\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    return code.trim();
};

export const generateLibraryActionsFromPrompt = async (prompt: string, library: any[], context: string): Promise<any[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });

    // Detailed library metadata for accurate parameter generation
    const libraryDetails = library.map(l => ({
        id: l.id,
        category: l.category,
        name: l.name,
        description: l.description,
        params: l.params.map((p: any) => ({
            key: p.key,
            type: p.type,
            options: p.options || [],
            default: p.default
        }))
    }));

    const systemInstruction = `You are an expert game designer. Your task is to analyze the user's intent (which may be in English or Arabic) and translate it into a sequence of available ready-made action library blocks.

    CRITICAL INSTRUCTION:
    - You must NOT generate raw JavaScript code.
    - You must ONLY select from the available Action IDs and fill in their parameters accurately.
    - Match any assets (like sprites, sounds, fonts, etc.) specified in the user's prompt with the provided assets context.
    - If the user prompt is in Arabic, interpret it carefully to map it to the most appropriate action block.

    Return a JSON array of actions. Each action in the array must be an object with:
    - "libId": The exact ID string of the action (e.g., "move_fixed", "combat_damage", "main1_sound", etc.).
    - "params": A key-value object of parameters where the keys match the parameter names specified in the action definition. Use appropriate types (numbers, booleans, or strings) matching the action's param definition.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `User Prompt: "${prompt}"

            Assets Context:
            ${context}

            Available Ready-made Actions:
            ${JSON.stringify(libraryDetails)}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            libId: { type: Type.STRING },
                            params: { type: Type.STRING, description: "JSON-serialized object containing parameters for this action" }
                        },
                        required: ["libId", "params"]
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        const parsed = JSON.parse(repairJSON(text));
        return parsed.map((act: any) => {
            if (typeof act.params === 'string') {
                try {
                    act.params = JSON.parse(act.params);
                } catch (e) {
                    console.warn("Failed to parse params string for action:", act.libId, e);
                    act.params = {};
                }
            }
            return act;
        });
    } catch (e) {
        console.error("Failed to generate library actions from prompt:", e);
        throw e;
    }
};

// --- AI PROJECT ANALYZER & REPAIR ONLINE ---

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

export const aiAnalyzeAndRepairProject = async (
    project: ProjectSnapshot,
    userPrompt: string,
    gameGenre?: string
): Promise<{
    aiObservations: string[];
    aiShortages: string[];
    patchedProject: ProjectSnapshot;
    log: string[];
}> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please set it in the environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });

    // Build condensed project payload for Gemini to keep it extremely fast and avoid hitting token limits
    const condensedProject = {
        metadata: project.metadata,
        sprites: project.sprites.map(s => ({
            id: s.id,
            name: s.name,
            role: s.role,
            src: s.src && s.src.length > 100 ? `[Truncated Base64, Length: ${s.src.length}]` : s.src,
            width: (s as any).width,
            height: (s as any).height,
            frameWidth: (s as any).frameWidth,
            frameHeight: (s as any).frameHeight,
            frameCount: (s as any).frameCount
        })),
        backgroundAssets: project.backgroundAssets.map(b => ({
            id: b.id,
            name: b.name,
            src: b.src && b.src.length > 100 ? `[Truncated Base64, Length: ${b.src.length}]` : b.src
        })),
        soundAssets: project.soundAssets.map(s => ({
            id: s.id,
            name: s.name,
            src: s.src && s.src.length > 100 ? `[Truncated Base64, Length: ${s.src.length}]` : s.src
        })),
        fontAssets: project.fontAssets.map(f => ({
            id: f.id,
            name: f.name
        })),
        scripts: project.scripts.map(s => ({
            id: s.id,
            name: s.name,
            code: s.code
        })),
        gameObjects: project.gameObjects.map(o => ({
            id: o.id,
            name: o.name,
            spriteId: o.spriteId,
            animations: o.animations,
            parent: o.parent,
            events: o.events,
            solid: o.solid,
            visible: o.visible,
            depth: o.depth
        })),
        rooms: project.rooms.map(r => ({
            id: r.id,
            width: r.width,
            height: r.height,
            map: r.map,
            settings: r.settings,
            backgrounds: r.backgrounds,
            views: r.views
        })),
        uiMenus: project.uiMenus.map(m => ({
            id: m.id,
            name: m.name,
            elements: m.elements,
            visible: m.visible
        })),
        enabledExtensions: project.enabledExtensions
    };

    const systemInstruction = `You are the Lead Game Architect, veteran retro game designer, and AI Repair specialist for the NOR Maker game editor (inspired by classic GameMaker and NES console limitations).
You understand game development deeply: physics, collisions, variables, sound effects, sprite animations, input handling, game loops, game over screens, and win conditions.
Your task is to analyze game projects, diagnose any gameplay, architectural, or asset shortages, and return a perfectly patched, complete, polished, and fully playable game.

GUIDELINES FOR THE NOR MAKER GAME ARCHITECTURE & EVENT SYSTEM:

1. GAME OBJECTS & EVENTS STRUCTURING:
   - Each GameObject has an "events" map where keys are event names and values are arrays of Actions.
   - Event names MUST be:
     - "create": Executed once when the object instance spawns. Perfect for initializing variables like this.hp = 10; this.maxHp = 10; or playing level music.
     - "step": Executed 30 times per second (each frame). Ideal for inputs, AI behavior, tracking the player, friction, movement, gravity adjustments, and boundaries checks.
     - "draw": Custom drawing logic on screen.
     - "collision_<target_object_id>": Triggered when colliding with a specific object type. E.g., "collision_obj_enemy", "collision_obj_coin", "collision_obj_bullet".
       - IMPORTANT: The event key MUST exactly use the target object's ID prefixed with "collision_". E.g., if target is "obj_slime", the event name MUST be "collision_obj_slime".

2. ACTION LIBRARIES AND USABLE ACTIONS:
   - An Action is an object with { "libId": string, "params": Record<string, any> }.
   - Common Action IDs you can generate in events:
     - "move_keyboard": { "spd": number, "jmp": number } - Side-scrolling platformer movement using Arrows/WASD. NOTE: Always pair with gravity (usually "move_gravity" with force 0.4 in "step" or "create") so the player doesn't float in the air.
     - "move_8way": { "spd": number } - 8-directional top-down movement. Ideal for adventure/RPG games.
     - "move_fixed": { "dir": "left"|"right"|"up"|"down"|"stop", "spd": number } - Continuous linear movement. Perfect for simple bullets, patroling slimes, moving hazards.
     - "move_gravity": { "amt": number } - Applies constant gravity downward (e.g. 0.4). Essential for platformers.
     - "move_friction": { "amt": number } - Applies slowing friction (e.g. 0.1) so instances slide smoothly to a halt.
     - "main1_create": { "obj": "object_name", "x": number, "y": number, "rel": boolean } - Spawns another object at coordinates. "rel": true makes coordinates relative to the spawning instance.
     - "main1_destroy": { "target": "self"|"other" } - Safely deletes an instance. Use target "other" in collision events to destroy the object being collided with.
     - "main1_sound": { "snd": "sound_asset_id", "loop": boolean } - Plays a sound effect.
     - "main1_music_play": { "snd": "sound_asset_id" } - Plays level background music.
     - "main1_room_goto": { "rm": "room_id" } - Transitions to another room. Excellent for win doors, exit portals, or level transitions.
     - "score_change_score": { "amt": number } - Adds or subtracts score points.
     - "control_execute": { "code": "javascript_code" } - Executes custom raw JavaScript.

3. WRITING ELEGANT RAW JAVASCRIPT IN "control_execute" ACTIONS:
   - Within the code block, "this" refers to the current game object instance.
   - Use these built-in properties:
     - "this.x", "this.y": Coordinate positions (grid cells are 16x16, screen is 256x240).
     - "this.dx", "this.dy": Horizontal/Vertical velocities (pixels per frame).
     - "this.w", "this.h": Bound dimensions.
     - "this.grounded": Boolean indicating whether the object is standing on solid ground tile or solid object.
     - "this.facing": Sprite scale multiplier (1 = right/normal, -1 = left/flipped).
   - Core functions:
     - "window.room_create(obj_name, x, y)": Spawns an object and returns its instance. E.g., var b = window.room_create("obj_bullet", this.x + 8, this.y); if(b) b.dx = 4;
     - "loadRoom(room_id)": Loads a room. E.g. loadRoom("rm_level_2");
     - "GM82Audio.play_sfx(sound_id, loop)": Triggers SFX.
   - Accessing Player Input:
     - var input = this.playerIndex === 1 ? window.P2_Input : window.P1_Input;
     - input.checkLeft() -> boolean
     - input.checkRight() -> boolean
     - input.checkJump() -> boolean
     - input.checkDown() -> boolean
     - input.check('ArrowUp') or input.check('KeyW') or input.check('Space') -> boolean
   - Collision Logic (Inside Collision Events):
     - The variable "other" is globally populated during collision events. You can interact with it. E.g. "other.dead = true; this.hp -= 2; if(this.hp <= 0) { this.dead = true; }"

4. CRITICAL GAME DESIGN PRINCIPLES:
   - PLAYER CONTROLS: Every playable game must have a player object (usually "obj_player") that has reliable, responsive input controls via "move_keyboard" or "move_8way" or custom keyboard JS code in the "step" event.
   - COLLISION INTERACTIONS: Solid tiles/objects (like brick walls, floors) must have solid = true. Hazards (like spikes, pits, lava, fireballs) must detect player collisions, causing health/life reduction or playing a death SFX and resetting the level (using Reset Game action or resetGame() function).
   - GOALS & WIN CONDITIONS: Every game needs an objective! E.g., collecting all items (obj_coin), reaching a portal (obj_portal), defeating a boss, or scoring 100 points, which triggers loading the next room, victory screen, or win music.
   - ENEMY AI: Slimes, bats, or guards shouldn't stand still. Give them patrol behaviors in "step" (reversing direction if they hit walls or screen edges) or tracking logic (moving toward the player: var p = window.instances.find(i => i.def.name === 'obj_player'); if(p) { this.dx = p.x > this.x ? 1 : -1; }).
   - AUDIO IMMERSION: Level transitions, jumping, hit impacts, shooting, and game over screens must trigger appropriate SFX or level music to create a retro arcade feeling.

5. DETECTING GAME GENRE & METADATA:
   - Always analyze the "metadata" object (if present in project data) which contains '{ title: string, story: string, genre: string, controls: string }' to understand the exact game type, objectives, and theme.
   - For Platformers/Side-scrollers: Add "move_gravity" (force: 0.4) on the player's step event in addition to "move_keyboard", and ensure you place solid ground block tiles (tile index 1 or objects with solid=true) beneath them.
   - For Top-down/8-directional RPG/Maze games: Use "move_8way" (no gravity!).
   - For Shooter/Space/Arcade games: Control movement appropriately, and spawn laser/bullet objects.

6. PLAYER & ENEMY ANIMATION STATES DETECTING & MANAGEMENT:
   - Each GameObject may contain an "animations" mapping of key states (e.g. "idle", "walk", "run", "jump", "fall", "attack1", "hurt", "death") to sprite asset IDs.
   - You MUST inspect the player's and enemy's "animations" field to understand what states are available.
   - If they are defined, you can dynamically trigger animations by setting "this.animState = 'walk';" or "this.animState = 'jump';" or "this.animState = 'hurt';" inside scripts or events.
   - Ensure the Sprite facing direction (left/right flipping) matches the movement velocity: "this.facing = this.dx > 0 ? 1 : (this.dx < 0 ? -1 : this.facing);" in "step" event so character flips naturally.
   - If "animations" is missing on an object but sprites exist in the sprite list with matching names (e.g. "spr_player_walk", "spr_player_idle", "spr_enemy_run", "spr_player_death"), map them correctly inside the returned GameObject's "animations" property so the game automatically animates them!

7. ARABIC LANGUAGE OUTPUT:
   - Write all observations ("aiObservations"), missing features list ("aiShortages"), and repair log entries ("log") in rich, encouraging, expert game developer Arabic. Keep the tone professional, insightful, and sophisticated (بأسلوب راقٍ واحترافي يحاكي خبراء تصميم ألعاب الريترو وصناعة الألعاب الكلاسيكية).`;

    const promptText = `
${gameGenre ? `Target Game Genre / Style requested by the developer: "${gameGenre}"
Please ensure all physics, gravity settings, animations, player controls, enemy AI patterns, sound effects, HUD indicators, and game loop events align strictly with this specific genre's standards (e.g., standard platformer physics vs. 8-way adventure vs. scrolling shooter).
` : ''}
Below is the user's specific feedback or custom request for repairing/completing their game:
"${userPrompt || "Conduct an in-depth game quality audit, detect any shortages, and apply comprehensive repairs/additions so the game is fully playable, functional, and complete."}"

Current Project Data:
${JSON.stringify(condensedProject, null, 2)}

Identify:
1. "aiObservations" (general feedback on playability, bugs, or controls).
2. "aiShortages" (specific missing game assets/features like sound effects, start screens, win/lose logic, enemy logic, HUD, or proper keyboard controls).
3. "patchedProject" (the updated version of the project).
   - IMPORTANT: If you keep an asset unmodified, retain its ID, name, and exact details.
   - For 'src' in sprites, backgrounds, or sounds: if the original src had "[Truncated Base64...", keep it exactly as "[Truncated Base64, Length: X]" or keep it as-is, so the engine can re-inject the original data on the client side.
   - Ensure that any added objects or events reference valid sprite IDs and exist in the sprites list.
   - Ensure that room map values align with the index list of gameObjects (where 0 is empty, 1 is ground, 2 and higher are objects in gameObjects list index + 2).
   - If adding script assets, ensure they are fully-coded JavaScript modules.
   - Return all observations, shortages, and log entries in Arabic (الرجاء كتابة الملاحظات والنقص واللوج باللغة العربية بأسلوب راقٍ وواضح لمطور الألعاب).

Format the entire output as a single, valid JSON object.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    aiObservations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    aiShortages: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    patchedProject: {
                        type: Type.OBJECT,
                        properties: {
                            sprites: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        src: { type: Type.STRING },
                                        role: { type: Type.STRING }
                                    },
                                    required: ['id', 'name', 'src']
                                }
                            },
                            backgroundAssets: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        src: { type: Type.STRING }
                                    },
                                    required: ['id', 'name', 'src']
                                }
                            },
                            soundAssets: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        src: { type: Type.STRING }
                                    },
                                    required: ['id', 'name', 'src']
                                }
                            },
                            fontAssets: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING }
                                    },
                                    required: ['id', 'name']
                                }
                            },
                            scripts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        code: { type: Type.STRING }
                                    },
                                    required: ['id', 'name', 'code']
                                }
                            },
                            gameObjects: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        spriteId: { type: Type.STRING, nullable: true },
                                        animations: {
                                            type: Type.OBJECT,
                                            description: "Mapping of animation states (e.g. idle, walk, run, jump, fall, attack1, hurt, death) to Sprite IDs",
                                            properties: {
                                                idle: { type: Type.STRING, nullable: true },
                                                walk: { type: Type.STRING, nullable: true },
                                                run: { type: Type.STRING, nullable: true },
                                                jump: { type: Type.STRING, nullable: true },
                                                fall: { type: Type.STRING, nullable: true },
                                                attack1: { type: Type.STRING, nullable: true },
                                                hurt: { type: Type.STRING, nullable: true },
                                                death: { type: Type.STRING, nullable: true }
                                            }
                                        },
                                        parent: { type: Type.STRING, nullable: true },
                                        solid: { type: Type.BOOLEAN, nullable: true },
                                        visible: { type: Type.BOOLEAN, nullable: true },
                                        depth: { type: Type.INTEGER, nullable: true },
                                        events: {
                                            type: Type.STRING,
                                            description: "JSON string representing event handlers mapped to arrays of actions. E.g. '{\"step\": [{\"libId\": \"move_fixed\", \"params\": {}}]}'"
                                        }
                                    },
                                    required: ['id', 'name']
                                }
                            },
                            rooms: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        width: { type: Type.INTEGER },
                                        height: { type: Type.INTEGER },
                                        map: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                                        settings: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING },
                                                caption: { type: Type.STRING },
                                                bgColor: { type: Type.STRING }
                                            },
                                            required: ["name", "caption", "bgColor"]
                                        },
                                        backgrounds: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    visible: { type: Type.BOOLEAN },
                                                    foreground: { type: Type.BOOLEAN },
                                                    source: { type: Type.STRING, nullable: true },
                                                    tileH: { type: Type.BOOLEAN },
                                                    tileV: { type: Type.BOOLEAN },
                                                    stretch: { type: Type.BOOLEAN },
                                                    x: { type: Type.INTEGER },
                                                    y: { type: Type.INTEGER },
                                                    hspeed: { type: Type.INTEGER },
                                                    vspeed: { type: Type.INTEGER }
                                                }
                                            }
                                        },
                                        views: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    visible: { type: Type.BOOLEAN },
                                                    viewX: { type: Type.INTEGER },
                                                    viewY: { type: Type.INTEGER },
                                                    viewW: { type: Type.INTEGER },
                                                    viewH: { type: Type.INTEGER },
                                                    portX: { type: Type.INTEGER },
                                                    portY: { type: Type.INTEGER },
                                                    portW: { type: Type.INTEGER },
                                                    portH: { type: Type.INTEGER },
                                                    followObj: { type: Type.STRING, nullable: true },
                                                    hBorder: { type: Type.INTEGER },
                                                    vBorder: { type: Type.INTEGER },
                                                    hSpeed: { type: Type.INTEGER },
                                                    vSpeed: { type: Type.INTEGER }
                                                }
                                            }
                                        }
                                    },
                                    required: ['id', 'width', 'height', 'map']
                                }
                            },
                            uiMenus: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        visible: { type: Type.BOOLEAN },
                                        elements: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    id: { type: Type.STRING },
                                                    name: { type: Type.STRING },
                                                    type: { type: Type.STRING },
                                                    x: { type: Type.INTEGER },
                                                    y: { type: Type.INTEGER },
                                                    w: { type: Type.INTEGER },
                                                    h: { type: Type.INTEGER },
                                                    text: { type: Type.STRING, nullable: true },
                                                    spriteId: { type: Type.STRING, nullable: true },
                                                    barColor: { type: Type.STRING, nullable: true },
                                                    barValue: { type: Type.STRING, nullable: true },
                                                    action: { type: Type.STRING, nullable: true },
                                                    textColor: { type: Type.STRING, nullable: true },
                                                    bgColor: { type: Type.STRING, nullable: true },
                                                    fontSize: { type: Type.INTEGER, nullable: true },
                                                    fontFamily: { type: Type.STRING, nullable: true },
                                                    textAlign: { type: Type.STRING, nullable: true },
                                                    visible: { type: Type.BOOLEAN },
                                                    groupId: { type: Type.STRING, nullable: true }
                                                },
                                                required: ['id', 'name', 'type', 'x', 'y', 'w', 'h', 'visible']
                                            }
                                        }
                                    },
                                    required: ['id', 'name', 'elements', 'visible']
                                }
                            },
                            enabledExtensions: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ['sprites', 'backgroundAssets', 'soundAssets', 'fontAssets', 'scripts', 'gameObjects', 'rooms', 'uiMenus', 'enabledExtensions']
                    },
                    log: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['aiObservations', 'aiShortages', 'patchedProject', 'log']
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    const parsed = JSON.parse(repairJSON(text));

    // Parse events string back to object for gameObjects in the repaired project
    if (parsed && parsed.patchedProject && Array.isArray(parsed.patchedProject.gameObjects)) {
        parsed.patchedProject.gameObjects.forEach((obj: any) => {
            if (typeof obj.events === 'string') {
                try {
                    obj.events = JSON.parse(obj.events);
                } catch (e) {
                    console.warn("Failed to parse events string for object in repair:", obj.id, e);
                    obj.events = {};
                }
            }
        });
    }

    // Re-inject the original Base64 contents for truncated assets
    parsed.patchedProject.sprites = parsed.patchedProject.sprites.map((s: any) => {
        const orig = project.sprites.find(o => o.id === s.id);
        if (orig && (!s.src || s.src.includes('Truncated Base64') || s.src === '')) {
            s.src = orig.src;
        }
        return s;
    });

    parsed.patchedProject.backgroundAssets = parsed.patchedProject.backgroundAssets.map((b: any) => {
        const orig = project.backgroundAssets.find(o => o.id === b.id);
        if (orig && (!b.src || b.src.includes('Truncated Base64') || b.src === '')) {
            b.src = orig.src;
        }
        return b;
    });

    parsed.patchedProject.soundAssets = parsed.patchedProject.soundAssets.map((snd: any) => {
        const orig = project.soundAssets.find(o => o.id === snd.id);
        if (orig && (!snd.src || snd.src.includes('Truncated Base64') || snd.src === '')) {
            snd.src = orig.src;
        }
        return snd;
    });

    return parsed;
};

// --- CORE ENGINE GENERATOR ---
export const createEngineHTML = (
    projectData: {
        assets: { sprites: any[], backgrounds: any[], sounds: any[], fonts: any[] },
        rooms: RoomData[],
        scripts: ScriptAsset[],
        gameObjects: GameObject[], // New dynamic object list
        objectEvents: any, // Legacy mapping, we should prefer the gameObjects structure now, but keep for compat if needed.
        uiMenus: UIMenu[],
        extensions: string[]
    }
) => {
    const assetMap: Record<string, string> = {};
    projectData.assets.sprites.forEach(s => assetMap[s.id] = s.src);
    projectData.assets.backgrounds.forEach(b => assetMap[b.id] = b.src);
    projectData.assets.sounds.forEach(s => assetMap[s.id] = s.src);

    // Construct Object Definitions for Runtime
    // Preserve the complete object contract for the generated runtime.
    const objectDefinitions = projectData.gameObjects.map(obj => {
        return {
            ...obj,
            id: obj.id,
            name: obj.name,
            spriteId: obj.spriteId,
            animations: obj.animations || {}
        };
    });

    const rooms = projectData.rooms.length > 0 ? projectData.rooms : [{
        id: 'rm_default', width: 16, height: 15, map: new Array(240).fill(0),
        settings: { name: 'default', speed: 30 }, backgrounds: [], views: []
    }];

    const startRoomId = projectData.rooms.length > 0 ? projectData.rooms[0].id : 'rm_default';

    const runtimeEventDiagnostics: any[] = [];
    const normalizeRuntimeEventKey = (key: any) => {
        if (key === undefined || key === null) return "";
        const raw = String(key).trim();
        const compact = raw.toLowerCase().replace(/[-. ]+/g, "_");
        const aliases: Record<string, string> = {
            create: "create", creation: "create", stepbegin: "step_begin", step_begin: "step_begin",
            step: "step", stepend: "step_end", step_end: "step_end", draw: "draw",
            destroy: "destroy", cleanup: "cleanup", alarm: "alarm", keyboard: "keyboard",
            keypress: "keypress", keyrelease: "keyrelease", mouse: "mouse"
        };
        if (aliases[compact]) return aliases[compact];
        const compound = raw.match(/^(collision|keyboard|keypress|keyrelease|alarm)[_. -]+(.+)$/i);
        if (compound) return compound[1].toLowerCase() + "_" + compound[2];
        return raw;
    };

    const compileRuntimeEventValue = (objId: string, eventKey: string, value: any): string => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object" && !Array.isArray(value)) {
            if (typeof value.code === "string") return value.code;
            if (typeof value.js === "string") return value.js;
            if (typeof value.gml === "string") {
                runtimeEventDiagnostics.push({ objectId: objId, event: eventKey, status: "PARTIAL", reason: "raw_gml_source_not_compiled", length: value.gml.length });
                return "";
            }
            if (Array.isArray(value.actions)) value = value.actions;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return "";
            const snippets = value.map(item => item && (typeof item === "string" ? item : (item.code || item.js))).filter(code => typeof code === "string");
            if (snippets.length === value.length) return snippets.join("\n");
            runtimeEventDiagnostics.push({ objectId: objId, event: eventKey, status: "PARTIAL", reason: "unsupported_event_value" });
            return "";
        }
        if (value !== undefined && value !== null) runtimeEventDiagnostics.push({ objectId: objId, event: eventKey, status: "PARTIAL", reason: "unsupported_event_value" });
        return "";
    };

    const normalizeRuntimeEvents = () => {
        const out: Record<string, Record<string, string>> = {};
        const sourceMap = projectData.objectEvents || {};
        projectData.gameObjects.forEach(obj => {
            const objId = obj.id;
            const mapped = sourceMap[objId];
            const source = mapped && (Array.isArray(mapped) || Object.keys(mapped).length > 0) ? mapped : ((obj as any).events || mapped || {});
            const target: Record<string, string> = out[objId] = {};
            if (Array.isArray(source)) {
                source.forEach((entry: any) => {
                    const eventKey = normalizeRuntimeEventKey(entry && (entry.eventKey || entry.key || entry.name));
                    if (!eventKey) {
                        runtimeEventDiagnostics.push({ objectId: objId, status: "PARTIAL", reason: "event_key_missing" });
                        return;
                    }
                    const entryValue = entry.actions ?? entry.code ?? entry.js ?? (entry.gml !== undefined ? { gml: entry.gml } : entry.value);
                    const code = compileRuntimeEventValue(objId, eventKey, entryValue);
                    if (code) target[eventKey] = target[eventKey] ? target[eventKey] + "\n" + code : code;
                });
            } else if (source && typeof source === "object") {
                Object.entries(source).forEach(([key, value]) => {
                    const eventKey = normalizeRuntimeEventKey(key);
                    const code = compileRuntimeEventValue(objId, eventKey, value);
                    if (code) target[eventKey] = code;
                });
            }
        });
        return out;
    };

    const normalizedObjectEvents = normalizeRuntimeEvents();

    // Helper to safely stringify and escape JSON for HTML embedding
    const safeJSON = (data: any) => JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    // Construct UI menus with restart logic
    const processedUIMenus = projectData.uiMenus.map(menu => {
        if (menu.id === 'menu_lose') {
            return {
                ...menu,
                elements: menu.elements.map(el => {
                    if (el.id === 'l_restart' && el.action && el.action.includes('window.resetGame()')) {
                        return { ...el, action: el.action.replace('window.resetGame()', 'if(window.restartRoom) window.restartRoom(); else window.resetGame();') };
                    }
                    return el;
                })
            };
        }
        return menu;
    });

    const fullGameData = {
        assets: {
             sprites: projectData.assets.sprites,
             backgrounds: projectData.assets.backgrounds,
             sounds: projectData.assets.sounds,
             fonts: projectData.assets.fonts
        },
        rooms: rooms,
        startRoom: startRoomId,
        scripts: projectData.scripts,
        objects: objectDefinitions,
        uiMenus: processedUIMenus,
        events: normalizedObjectEvents,
        runtimeDiagnostics: { events: runtimeEventDiagnostics },
        defaultTransition: (projectData as any).defaultTransition || { type: 'fade', duration: 500, color: '#000000', easing: 'easeInOut' }
    };

    // Fix Background Logic for Runtime - Infinite Scrolling
    const bgRenderLogic = `
        if (currentRoom.backgrounds) {
            currentRoom.backgrounds.forEach(bg => {
                if (!!bg.foreground !== foreground) return;
                if (bg.visible && bg.source && assets[bg.source]) {
                    const img = assets[bg.source];
                    if (!img.complete || img.naturalWidth === 0) return;

                    // Move background logic moved to update phase, but for legacy compatibility we do it here once per frame
                    if (!foreground) {
                        bg.x = (bg.x || 0) + (bg.hspeed || 0);
                        bg.y = (bg.y || 0) + (bg.vspeed || 0);
                    }

                    const vw = camera.w; const vh = camera.h;
                    if (bg.stretch) {
                         ctx.drawImage(img, camera.x, camera.y, vw, vh);
                    } else {
                        let startX = bg.x; let startY = bg.y;
                        const imgW = img.width; const imgH = img.height;

                        if (bg.tileH) {
                            let offsetX = (camera.x - bg.x) % imgW;
                            if (offsetX < 0) offsetX += imgW;
                            startX = camera.x - offsetX;
                        }
                        if (bg.tileV) {
                            let offsetY = (camera.y - bg.y) % imgH;
                            if (offsetY < 0) offsetY += imgH;
                            startY = camera.y - offsetY;
                        }

                        const endX = bg.tileH ? (camera.x + vw) : (startX + imgW);
                        const endY = bg.tileV ? (camera.y + vh) : (startY + imgH);

                        for (let dx = startX; dx < endX; dx += imgW) {
                            for (let dy = startY; dy < endY; dy += imgH) {
                                if (dx + imgW <= camera.x || dx >= camera.x + vw) continue;
                                if (dy + imgH <= camera.y || dy >= camera.y + vh) continue;
                                ctx.drawImage(img, Math.floor(dx), Math.floor(dy));
                            }
                        }
                    }
                }
            });
        }
    `;

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <script>
      // Fix for "Cannot set property fetch of #<Window> which has only a getter"
      if (typeof window !== 'undefined') {
        try {
          const originalFetch = window.fetch;
          if (originalFetch) {
            Object.defineProperty(window, 'fetch', {
              value: originalFetch,
              writable: true,
              configurable: true
            });
          }
        } catch (e) {}
      }
    </script>
    <link href="/fonts/press-start-2p.css" rel="stylesheet">
    <style>
        body { margin:0; background:#181818; display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden; user-select:none; touch-action:none; }
        canvas { position: relative; z-index: 10; image-rendering: pixelated; max-width:100%; max-height:100%; box-shadow: 0 0 50px rgba(0,0,0,0.8); background: #000; }
        #loading { position:absolute; color:white; font-family:monospace; font-weight:bold; text-align:center; z-index: 100; }
        #canvas3d { position:absolute; top:0; left:0; width:100%; height:100%; display:none; z-index: 1; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <div id="loading">LOADING NOR ENGINE...</div>
    <canvas id="gameCanvas" tabindex="1"></canvas>
    <div id="canvas3d"></div>

    <script id="nor-game-data" type="application/json">` + safeJSON(fullGameData) + `</script>

    <script>
    window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error('NOR ENGINE ERROR:', msg, url, lineNo);
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'block';
            loadingDiv.innerHTML = '<div style="color:#ff5555; padding:20px; background:rgba(0,0,0,0.8); border:2px solid red;">' +
                'CRITICAL ERROR:<br>' + msg + '<br>Line: ' + lineNo + '</div>';
        }
        return false;
    };

    // Load data from JSON tag
    try {
        const dataText = document.getElementById('nor-game-data').textContent;
        window.GAME_DATA = JSON.parse(dataText);
        console.log("NOR ENGINE: Data loaded successfully");
    } catch(e) {
        console.error("NOR ENGINE: Failed to parse game data", e);
        throw new Error("Data Parse Error: " + e.message);
    }

    // Font loading - Moved external font off critical path to prevent blocking on restricted iframe environments
    setTimeout(() => {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    }, 100);

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    window.imageSmoothing = false;
    window.renderingScaleMultiplier = 1;
    ctx.imageSmoothingEnabled = !!window.imageSmoothing;
    const assets = {};
    let currentRoom = null;
    let camera = { x: 0, y: 0, w: 256, h: 240 };
    let gameLoopId = null;
    window.language = 'ar';
    window.soundEnabled = true;

    // --- GML Virtual Key Constants ---
    const vk_constants = {
        0: 'nokey', 1: 'anykey', 8: 'backspace', 9: 'tab', 13: 'enter', 27: 'escape', 32: 'space',
        37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown',
        16: 'shift', 17: 'control', 18: 'alt',
        112: 'f1', 113: 'f2', 114: 'f3', 115: 'f4', 116: 'f5', 117: 'f6', 118: 'f7', 119: 'f8', 120: 'f9', 121: 'f10', 122: 'f11', 123: 'f12'
    };
    window.vk_constants = vk_constants;

    window.vk_nokey    = 0;   window.vk_anykey   = 1;
    window.vk_backspace= 8;   window.vk_tab      = 9;
    window.vk_enter    = 13;  window.vk_escape   = 27;
    window.vk_space    = 32;
    window.vk_left     = 37;  window.vk_up       = 38;
    window.vk_right    = 39;  window.vk_down     = 40;
    window.vk_shift    = 16;  window.vk_control  = 17; window.vk_alt = 18;
    window.vk_f1 = 112; window.vk_f2 = 113; window.vk_f3 = 114; window.vk_f4 = 115;
    window.vk_f5 = 116; window.vk_f6 = 117; window.vk_f7 = 118; window.vk_f8 = 119;
    window.vk_f9 = 120; window.vk_f10= 121; window.vk_f11= 122; window.vk_f12= 123;
    window.vk_numpad0=96;window.vk_numpad1=97;window.vk_numpad2=98;window.vk_numpad3=99;
    window.vk_numpad4=100;window.vk_numpad5=101;window.vk_numpad6=102;window.vk_numpad7=103;
    window.vk_numpad8=104;window.vk_numpad9=105;
    window.vk_multiply=106;window.vk_add=107;window.vk_subtract=109;
    window.vk_decimal=110; window.vk_divide=111;
    window.vk_lshift=160;window.vk_rshift=161;window.vk_lcontrol=162;window.vk_rcontrol=163;
    window.vk_lalt=164;window.vk_ralt=165;
    window.mb_none=0; window.mb_left=1; window.mb_right=2; window.mb_middle=3;

    // Key-code to GML name mapper (Matches gmxToNorConverter.ts)
    const mapGMKey = (code) => {
        if (code === 1) return 'any';
        if (code === 8) return 'Backspace';
        if (code === 13) return 'Enter';
        if (code === 16) return 'Shift';
        if (code === 17) return 'Control';
        if (code === 18) return 'Alt';
        if (code === 27) return 'Escape';
        if (code === 32) return 'Space';
        if (code === 37) return 'ArrowLeft';
        if (code === 38) return 'ArrowUp';
        if (code === 39) return 'ArrowRight';
        if (code === 40) return 'ArrowDown';
        if (code >= 48 && code <= 57) return 'Digit' + (code - 48);
        if (code >= 65 && code <= 90) return 'Key' + String.fromCharCode(code);
        if (code >= 112 && code <= 123) return 'F' + (code - 111);
        return String(code);
    };

    const GML_KEYMAP = {};
    for (let i = 0; i < 256; i++) {
        const name = mapGMKey(i);
        if (name) GML_KEYMAP[i] = name;
    }
    window.GML_KEYMAP = GML_KEYMAP;

    // =====================================================================
    // INPUT SYSTEM — Keyboard, Mouse, Touch, Gamepad (Co-op & Gamepads)
    // =====================================================================
    const createPlayerInput = () => {
        return {
            keys: {},
            keysPressed: {},
            keysReleased: {},
            mouse: { x: 0, y: 0, left: false, right: false, middle: false,
                     leftPressed: false, rightPressed: false },
            gamepad: { connected: false, axes: [0,0,0,0], buttons: new Array(20).fill(false),
                       buttonsPressed: new Array(20).fill(false) },
            touch: { left: false, right: false, up: false, action: false },
            check: function(k) { return !!(this.keys[k]); },
            checkJump: function() { return this.check('ArrowUp') || this.check('Space') || this.check('KeyZ') || this.gamepad.buttons[0]; },
            checkLeft: function() { return this.check('ArrowLeft') || (this.gamepad.axes[0] < -0.4) || this.gamepad.buttons[14]; },
            checkRight: function() { return this.check('ArrowRight') || (this.gamepad.axes[0] > 0.4) || this.gamepad.buttons[15]; },
            checkDown: function() { return this.check('ArrowDown') || (this.gamepad.axes[1] > 0.4) || this.gamepad.buttons[13]; },
            checkAction: function() { return this.check('KeyX') || this.check('KeyZ') || this.gamepad.buttons[1]; },
            syncKey: function(keyCodeOrName, down) {
                let keyCode;
                let name;
                if (typeof keyCodeOrName === 'number') {
                    keyCode = keyCodeOrName;
                    name = mapGMKey(keyCode);
                } else {
                    name = keyCodeOrName;
                    const constants = window.vk_constants || {};
                    const foundCode = Object.keys(constants).find(k => constants[k] === name);
                    if (foundCode) {
                        keyCode = parseInt(foundCode);
                    } else {
                        const keymap = window.GML_KEYMAP || {};
                        for (let k in keymap) {
                            if (keymap[k] === name) {
                                keyCode = parseInt(k);
                                break;
                            }
                        }
                    }
                }

                if (down) {
                    if (!this.keys[name || ''] && (keyCode === undefined || !this.keys[keyCode])) {
                        if (name) this.keysPressed[name] = true;
                        if (keyCode !== undefined) this.keysPressed[keyCode] = true;
                        this.keysPressed[1] = true; // vk_anykey
                        this.keysPressed['any'] = true;

                        if (name && name.startsWith('Key') && name.length === 4) {
                            this.keysPressed[name.charAt(3).toLowerCase()] = true;
                        }
                        if (name === 'Space') this.keysPressed[' '] = true;
                    }
                    if (name) this.keys[name] = true;
                    if (keyCode !== undefined) this.keys[keyCode] = true;
                    if (name && name.startsWith('Key') && name.length === 4) {
                        this.keys[name.charAt(3).toLowerCase()] = true;
                    }
                    if (name === 'Space') this.keys[' '] = true;
                    this.keys[1] = true;
                    this.keys['any'] = true;
                } else {
                    if (this.keys[name || ''] || (keyCode !== undefined && this.keys[keyCode])) {
                        if (name) this.keysReleased[name] = true;
                        if (keyCode !== undefined) this.keysReleased[keyCode] = true;
                        if (name && name.startsWith('Key') && name.length === 4) {
                            this.keysReleased[name.charAt(3).toLowerCase()] = true;
                        }
                        if (name === 'Space') this.keysReleased[' '] = true;
                    }
                    if (name) this.keys[name] = false;
                    if (keyCode !== undefined) this.keys[keyCode] = false;
                    if (name && name.startsWith('Key') && name.length === 4) {
                        this.keys[name.charAt(3).toLowerCase()] = false;
                    }
                    if (name === 'Space') this.keys[' '] = false;
                    this.keys[1] = Object.values(this.keys).some(v => v === true && typeof v !== 'string');
                    this.keys['any'] = this.keys[1];
                }
            }
        };
    };

    const P1_Input = createPlayerInput();
    const P2_Input = createPlayerInput();

    window.P1_Input = P1_Input;
    window.P2_Input = P2_Input;

    const syncKeyboardToPlayers = (keyCodeOrName, down) => {
        let name = keyCodeOrName;
        if (typeof keyCodeOrName === 'number') {
            name = mapGMKey(keyCodeOrName) || '';
        }

        // Player 1 mapping
        if (name === 'ArrowLeft') {
            P1_Input.syncKey('ArrowLeft', down);
        } else if (name === 'ArrowRight') {
            P1_Input.syncKey('ArrowRight', down);
        } else if (name === 'ArrowUp') {
            P1_Input.syncKey('ArrowUp', down);
        } else if (name === 'ArrowDown') {
            P1_Input.syncKey('ArrowDown', down);
        } else if (name === 'Space' || name === 'KeyZ' || name === 'z' || name === 'Z' || name === 90) {
            P1_Input.syncKey('Space', down);
            P1_Input.syncKey('KeyZ', down);
            P1_Input.syncKey('z', down);
            P1_Input.syncKey(' ', down);
        } else if (name === 'KeyX' || name === 'x' || name === 'X' || name === 88) {
            P1_Input.syncKey('KeyX', down);
            P1_Input.syncKey('x', down);
        } else {
            // General keys go to P1
            P1_Input.syncKey(name, down);
        }

        // Player 2 mapping: Maps physical WASD/IJKL keys to Player 2's virtual arrows/buttons
        if (name === 'KeyA' || name === 'KeyJ') {
            P2_Input.syncKey('ArrowLeft', down);
            P2_Input.syncKey('KeyA', down);
            P2_Input.syncKey('a', down);
        } else if (name === 'KeyD' || name === 'KeyL') {
            P2_Input.syncKey('ArrowRight', down);
            P2_Input.syncKey('KeyD', down);
            P2_Input.syncKey('d', down);
        } else if (name === 'KeyW' || name === 'KeyI') {
            P2_Input.syncKey('ArrowUp', down);
            P2_Input.syncKey('KeyW', down);
            P2_Input.syncKey('w', down);
        } else if (name === 'KeyS' || name === 'KeyK') {
            P2_Input.syncKey('ArrowDown', down);
            P2_Input.syncKey('KeyS', down);
            P2_Input.syncKey('s', down);
        } else if (name === 'KeyF' || name === 'ShiftLeft') {
            P2_Input.syncKey('Space', down);
            P2_Input.syncKey('KeyZ', down);
            P2_Input.syncKey('z', down);
            P2_Input.syncKey(' ', down);
            P2_Input.syncKey('ArrowUp', down);
        } else if (name === 'KeyG') {
            P2_Input.syncKey('KeyX', down);
            P2_Input.syncKey('x', down);
        } else {
            P2_Input.syncKey(name, down);
        }
    };
    window.syncKeyboardToPlayers = syncKeyboardToPlayers;

    const Input = {
        get keys() { return P1_Input.keys; },
        get keysPressed() { return P1_Input.keysPressed; },
        get keysReleased() { return P1_Input.keysReleased; },
        get mouse() { return P1_Input.mouse; },
        get gamepad() { return P1_Input.gamepad; },
        get touch() { return P1_Input.touch; },

        // Helper to sync numeric and named keys and handle pressed/released state
        syncKey: function(keyCodeOrName, down) {
            P1_Input.syncKey(keyCodeOrName, down);
        },

        pollGamepad: function() {
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];

            const updatePlayerGamepad = (playerInput, pad) => {
                if (!pad) {
                    playerInput.gamepad.connected = false;
                    return;
                }
                playerInput.gamepad.connected = true;
                const prev = playerInput.gamepad.buttons.slice();
                playerInput.gamepad.axes = Array.from(pad.axes);
                playerInput.gamepad.buttons = pad.buttons.map(b => b.pressed);
                playerInput.gamepad.buttonsPressed = playerInput.gamepad.buttons.map((b, i) => b && !prev[i]);

                const axisX = pad.axes[0] !== undefined ? pad.axes[0] : 0;
                const axisY = pad.axes[1] !== undefined ? pad.axes[1] : 0;

                const LEFT  = axisX < -0.4 || pad.buttons[14]?.pressed;
                const RIGHT = axisX >  0.4 || pad.buttons[15]?.pressed;
                const UP    = axisY < -0.4 || pad.buttons[12]?.pressed;
                const DOWN  = axisY >  0.4 || pad.buttons[13]?.pressed;
                const A     = pad.buttons[0]?.pressed;  // Cross/A
                const B     = pad.buttons[1]?.pressed;  // Circle/B
                const X     = pad.buttons[2]?.pressed;  // Square/X
                const Y     = pad.buttons[3]?.pressed;  // Triangle/Y
                const START = pad.buttons[9]?.pressed;
                const SELECT= pad.buttons[8]?.pressed;
                const L1    = pad.buttons[4]?.pressed;
                const R1    = pad.buttons[5]?.pressed;
                const L2    = pad.buttons[6]?.pressed;
                const R2    = pad.buttons[7]?.pressed;

                playerInput.syncKey('ArrowLeft', LEFT);
                playerInput.syncKey('ArrowRight', RIGHT);
                playerInput.syncKey('ArrowUp', UP);
                playerInput.syncKey('ArrowDown', DOWN);
                playerInput.syncKey('Space', A);
                playerInput.syncKey('KeyZ', A);
                playerInput.syncKey('z', A);
                playerInput.syncKey(' ', A);
                playerInput.syncKey('KeyX', B);
                playerInput.syncKey('x', B);
                playerInput.syncKey('KeyA', X);
                playerInput.syncKey('a', X);
                playerInput.syncKey('KeyS', Y);
                playerInput.syncKey('s', Y);
                playerInput.syncKey('KeyQ', L1);
                playerInput.syncKey('KeyE', R1);
                playerInput.syncKey('KeyR', L2);
                playerInput.syncKey('KeyF', R2);
                playerInput.syncKey('Enter', START);
                playerInput.syncKey('Escape', SELECT);
                playerInput.syncKey('p', SELECT);
                playerInput.syncKey('KeyP', SELECT);
            };

            const activePads = [];
            for (let i = 0; i < pads.length; i++) {
                const p = pads[i];
                if (p) activePads.push(p);
            }

            updatePlayerGamepad(P1_Input, activePads[0] || null);
            updatePlayerGamepad(P2_Input, activePads[1] || null);
        },

        clearFrameState: function() {
            P1_Input.keysPressed = {};
            P1_Input.keysReleased = {};
            P1_Input.mouse.leftPressed  = false;
            P1_Input.mouse.rightPressed = false;
            P1_Input.gamepad.buttonsPressed = new Array(20).fill(false);

            P2_Input.keysPressed = {};
            P2_Input.keysReleased = {};
            P2_Input.mouse.leftPressed  = false;
            P2_Input.mouse.rightPressed = false;
            P2_Input.gamepad.buttonsPressed = new Array(20).fill(false);
        },

        init: function() {
            window.addEventListener('keydown', e => {
                const keyCode = e.keyCode || e.which;
                const name = e.code || e.key;
                if (keyCode) {
                    syncKeyboardToPlayers(keyCode, true);
                } else if (name) {
                    syncKeyboardToPlayers(name, true);
                }

                window.keyboard_key = keyCode;
                window.keyboard_lastkey = keyCode;
                window.keyboard_string += e.key && e.key.length === 1 ? e.key : '';
            });
            window.addEventListener('keyup', e => {
                const keyCode = e.keyCode || e.which;
                const name = e.code || e.key;
                if (keyCode) {
                    syncKeyboardToPlayers(keyCode, false);
                } else if (name) {
                    syncKeyboardToPlayers(name, false);
                }
                window.keyboard_key = 0;
            });

            // Mouse
            canvas.addEventListener('mousemove', e => {
                const rect = canvas.getBoundingClientRect();
                const qMult = window.renderingScaleMultiplier || 1;
                Input.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width) / qMult;
                Input.mouse.y = (e.clientY - rect.top)  * (canvas.height / rect.height) / qMult;
            });
            canvas.addEventListener('mousedown', e => {
                canvas.focus();
                if (e.button === 0) { Input.mouse.left = true; Input.mouse.leftPressed = true; }
                if (e.button === 2) { Input.mouse.right = true; Input.mouse.rightPressed = true; }
                if (e.button === 1)   Input.mouse.middle = true;

                // UI clicks
                if (e.button === 0 && window.GAME_DATA.uiMenus) {
                    const qMult = window.renderingScaleMultiplier || 1;
                    const logicalScale = (window.currentScale || 1) / qMult;
                    const lx = Input.mouse.x / logicalScale;
                    const ly = Input.mouse.y / logicalScale;
                    let hit = false;
                    for (let i = window.GAME_DATA.uiMenus.length - 1; i >= 0; i--) {
                        const menu = window.GAME_DATA.uiMenus[i];
                        if (!menu.visible) continue;
                        for (let j = menu.elements.length - 1; j >= 0; j--) {
                            const el = menu.elements[j];
                            if (!el.visible || el.type !== 'button' || !el.action) continue;
                            if (lx >= el.x && lx <= el.x+el.w && ly >= el.y && ly <= el.y+el.h) {
                                try { eval(el.action); } catch(err){}
                                hit = true; break;
                            }
                        }
                        if (hit) break;
                    }
                    if (hit) return;
                }
                window.instances.forEach(i => i.triggerEvent('mouse', e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle'));
            });
            canvas.addEventListener('mouseup', e => {
                if (e.button === 0) Input.mouse.left = false;
                if (e.button === 2) Input.mouse.right = false;
                if (e.button === 1) Input.mouse.middle = false;
            });
            canvas.addEventListener('contextmenu', e => e.preventDefault());

            // Touch — virtual d-pad and UI interaction
            const handleTouch = (e, down) => {
                if (e.cancelable) e.preventDefault();
                const rect = canvas.getBoundingClientRect();

                // Handle UI clicks on touchstart
                if (down && e.type === 'touchstart' && window.GAME_DATA.uiMenus) {
                    const t = e.touches[0];
                    const qMult = window.renderingScaleMultiplier || 1;
                    const tx = (t.clientX - rect.left) * (canvas.width / rect.width) / qMult;
                    const ty = (t.clientY - rect.top)  * (canvas.height / rect.height) / qMult;
                    const logicalScale = (window.currentScale || 1) / qMult;
                    const lx = tx / logicalScale;
                    const ly = ty / logicalScale;

                    let hit = false;
                    for (let i = window.GAME_DATA.uiMenus.length - 1; i >= 0; i--) {
                        const menu = window.GAME_DATA.uiMenus[i];
                        if (!menu.visible) continue;
                        for (let j = menu.elements.length - 1; j >= 0; j--) {
                            const el = menu.elements[j];
                            if (!el.visible || el.type !== 'button' || !el.action) continue;
                            if (lx >= el.x && lx <= el.x+el.w && ly >= el.y && ly <= el.y+el.h) {
                                try { eval(el.action); } catch(err){}
                                hit = true; break;
                            }
                        }
                        if (hit) break;
                    }
                    if (hit) return;
                }

                // Reset touch states before recalculating
                Input.touch.left = false;
                Input.touch.right = false;
                Input.touch.up = false;
                Input.touch.action = false;

                if (down) {
                    Array.from(e.touches).forEach(t => {
                        const tx = (t.clientX - rect.left) / rect.width;
                        const ty = (t.clientY - rect.top)  / rect.height;
                        if (tx < 0.4) { // Left zone = directional
                            if (tx < 0.15) Input.touch.left = true;
                            else if (tx > 0.25) Input.touch.right = true;
                            if (ty < 0.4) Input.touch.up = true;
                        } else if (tx > 0.6) { // Right zone = action/jump
                            Input.touch.action = true;
                        }
                    });
                }

                Input.syncKey('ArrowLeft', Input.touch.left);
                Input.syncKey('ArrowRight', Input.touch.right);
                Input.syncKey('ArrowUp', Input.touch.up);
                Input.syncKey('Space', Input.touch.action);
                Input.syncKey('KeyZ', Input.touch.action);
            };
            canvas.addEventListener('touchstart',  e => { canvas.focus(); handleTouch(e, true); },  {passive:false});
            canvas.addEventListener('touchmove',   e => handleTouch(e, true),  {passive:false});
            canvas.addEventListener('touchend',    e => handleTouch(e, false), {passive:false});
            canvas.addEventListener('touchcancel', e => handleTouch(e, false), {passive:false});

            // Gamepad connect/disconnect
            window.addEventListener('gamepadconnected',    () => { console.log('NOR ENGINE: Gamepad connected'); });
            window.addEventListener('gamepaddisconnected', () => { Input.gamepad.connected = false; });
        },
        check:       function(k) { return !!(Input.keys[k]); },
        checkJump:   function() { return Input.check('ArrowUp')  || Input.check('Space') || Input.check('KeyZ') || Input.gamepad.buttons[0]; },
        checkLeft:   function() { return Input.check('ArrowLeft')  || (Input.gamepad.axes[0] < -0.4) || Input.gamepad.buttons[14]; },
        checkRight:  function() { return Input.check('ArrowRight') || (Input.gamepad.axes[0] >  0.4) || Input.gamepad.buttons[15]; },
        checkDown:   function() { return Input.check('ArrowDown')  || (Input.gamepad.axes[1] >  0.4) || Input.gamepad.buttons[13]; },
        checkAction: function() { return Input.check('KeyX') || Input.check('KeyZ') || Input.gamepad.buttons[1]; }
    };
    window.Input = Input;

    const GM82Audio = {
        ctx: null, buffers: {}, currentMusic: null,
        init: function() {
            if(!GM82Audio.ctx) {
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (AudioContextClass) {
                        GM82Audio.ctx = new AudioContextClass();
                        if (window.GAME_DATA.assets.sounds) {
                            window.GAME_DATA.assets.sounds.forEach(s => GM82Audio.load(s.id, s.src));
                        }
                    }
                } catch(e) {
                    console.warn("NOR ENGINE: AudioContext initialization failed (will proceed silently):", e);
                    GM82Audio.ctx = null;
                }
            }
        },
        load: async function(id, src) {
            if (!src || src.length < 50) return Promise.resolve();
            if (!GM82Audio.ctx) GM82Audio.init();
            if (!GM82Audio.ctx) return Promise.resolve();
            try {
                let arrayBuffer;
                if (src.startsWith('data:')) {
                    const b64 = src.split(',')[1];
                    if (!b64 || b64.length < 10) return Promise.resolve();
                    const binary = atob(b64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    arrayBuffer = bytes.buffer;
                } else if (src.startsWith('blob:')) {
                    const resp = await fetch(src);
                    if (!resp.ok) throw new Error('blob fetch failed');
                    arrayBuffer = await resp.arrayBuffer();
                } else {
                    return Promise.resolve();
                }
                GM82Audio.buffers[id] = await GM82Audio.ctx.decodeAudioData(arrayBuffer);
            } catch(e) {
                console.warn("NOR ENGINE: Audio load error for " + id + " (will use procedural fallback):", e);
            }
            return Promise.resolve();
        },
        _beep: function(freq, type, dur, vol) {
            if (!GM82Audio.ctx) GM82Audio.init();
            if (!GM82Audio.ctx) return;
            try {
                if (GM82Audio.ctx.state === 'suspended') GM82Audio.ctx.resume();
                const o = GM82Audio.ctx.createOscillator();
                const g = GM82Audio.ctx.createGain();
                const now = GM82Audio.ctx.currentTime;
                o.type = type || 'square'; o.frequency.value = freq || 440;
                g.gain.setValueAtTime(vol||0.2, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + (dur||0.1));
                o.connect(g); g.connect(GM82Audio.ctx.destination);
                o.start(now); o.stop(now + (dur||0.1));
            } catch(e) {
                console.warn("NOR ENGINE: _beep failed:", e);
            }
        },
        _proceduralSFX: function(name) {
            const n = (name||'').toLowerCase();
            if (n.includes('jump'))                              GM82Audio._beep(380,'square',0.14,0.25);
            else if (n.includes('hit')||n.includes('hurt'))     GM82Audio._beep(140,'sawtooth',0.22,0.30);
            else if (n.includes('coin')||n.includes('item'))    { GM82Audio._beep(880,'sine',0.07,0.20); setTimeout(()=>GM82Audio._beep(1320,'sine',0.07,0.20),70); }
            else if (n.includes('shoot')||n.includes('bullet')) GM82Audio._beep(700,'square',0.08,0.18);
            else if (n.includes('death')||n.includes('die'))    GM82Audio._beep(220,'sawtooth',0.45,0.25);
            else if (n.includes('win')||n.includes('goal'))     { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>GM82Audio._beep(f,'square',0.16,0.20),i*100)); }
            else if (n.includes('explosion')||n.includes('boom')) GM82Audio._beep(80,'sawtooth',0.5,0.35);
            else                                                GM82Audio._beep(440,'square',0.06,0.15);
        },
        play_sfx: function(name, loop = false) {
            if (!window.soundEnabled) return;
            if(!GM82Audio.ctx) GM82Audio.init();
            if(!GM82Audio.ctx) return;
            try {
                if(GM82Audio.ctx.state === 'suspended') GM82Audio.ctx.resume();
                if (GM82Audio.buffers[name]) {
                    const source = GM82Audio.ctx.createBufferSource();
                    source.buffer = GM82Audio.buffers[name];
                    source.loop = loop;
                    source.connect(GM82Audio.ctx.destination);
                    source.start(0);
                    return source;
                } else {
                    // Try playing later if still loading, then use procedural fallback
                    setTimeout(() => {
                        if (!window.soundEnabled) return;
                        if (!GM82Audio.ctx) return;
                        try {
                            if (GM82Audio.buffers[name]) {
                                const source = GM82Audio.ctx.createBufferSource();
                                source.buffer = GM82Audio.buffers[name];
                                source.loop = loop;
                                source.connect(GM82Audio.ctx.destination);
                                source.start(0);
                                if (loop) GM82Audio.currentMusic = source;
                            } else if (!loop) {
                                // Buffer never loaded — use procedural SFX so game isn't silent
                                GM82Audio._proceduralSFX(name);
                            }
                        } catch(err) {
                            console.warn("NOR ENGINE: play_sfx deferred failed:", err);
                        }
                    }, 300);
                }
            } catch(e) {
                console.warn("NOR ENGINE: play_sfx failed:", e);
            }
        },
        play_music: function(name) {
            if (!window.soundEnabled) return;
            if (GM82Audio.currentMusic) {
                try { GM82Audio.currentMusic.stop(); } catch(e) {}
                GM82Audio.currentMusic = null;
            }
            GM82Audio.currentMusic = GM82Audio.play_sfx(name, true);
        },
        stop_music: function() {
            if (GM82Audio.currentMusic) {
                try { GM82Audio.currentMusic.stop(); } catch(e) {}
                GM82Audio.currentMusic = null;
            }
        }
    };

    const Scripts = {};
    GAME_DATA.scripts.forEach(s => {
        try {
            // Wrap GML code to handle argument0..N and argument[]
            // Use standard string concat to avoid nested template literal hell
            const prefix = "const argument = args || [];" +
                         "const argument0 = argument[0], argument1 = argument[1], argument2 = argument[2]," +
                         "argument3 = argument[3], argument4 = argument[4], argument5 = argument[5]," +
                         "argument6 = argument[6], argument7 = argument[7], argument8 = argument[8];";
            const wrappedCode = prefix + "\\n" + s.code;
            Scripts[s.name] = new Function('args', wrappedCode);
        } catch(e){ console.error('Failed to compile script:', s.name, e); }
    });
    window.Scripts = Scripts;

    window.stopMusic = () => GM82Audio.stop_music();
    window.playMusic = (name) => GM82Audio.play_music(name);
    window.playSound = (name) => GM82Audio.play_sfx(name);

    // --- GML Sound API (GM8.1 + GMS style) ---
    window.sound_play        = (s) => GM82Audio.play_sfx(s);
    window.sound_stop        = (s) => {}; // stub — AudioContext sources can't be stopped by name easily
    window.sound_loop        = (s) => GM82Audio.play_sfx(s, true);
    window.sound_is_playing  = (s) => true; // optimistic
    window.sound_volume      = (s,v) => {};
    window.sound_global_volume = (v) => {};
    window.sound_fade        = (s,v,t) => {};
    // GMS audio API
    window.audio_play_sound  = (s,pri,loop) => { if(loop) GM82Audio.play_music(s); else GM82Audio.play_sfx(s); };
    window.audio_stop_sound  = (s) => GM82Audio.stop_music(s);
    window.audio_is_playing  = (s) => false; // Simplified stub
    window.audio_sound_gain  = (s,v,t) => {}; // Simplified stub

    // --- GML Animation Notifies & State Machine (PaperZD style) ---
    window.animation_notify_add = (objName, sprId, frame, callback) => {
        if (!window._animation_notifies) window._animation_notifies = {};
        if (!window._animation_notifies[objName]) window._animation_notifies[objName] = {};
        if (!window._animation_notifies[objName][sprId]) window._animation_notifies[objName][sprId] = {};
        window._animation_notifies[objName][sprId][frame] = callback;
    };

    window.state_machine_init = (inst, states) => {
        inst.states = states;
        inst.state = Object.keys(states)[0];
        inst.state_timer = 0;
    };

    window.state_machine_update = (inst) => {
        if (!inst.states || !inst.state) return;
        const stateDef = inst.states[inst.state];
        if (stateDef && stateDef.update) stateDef.update.call(inst);
        inst.state_timer++;
    };

    window.state_machine_set = (inst, newState) => {
        if (inst.state === newState) return;
        const oldState = inst.state;
        inst.state = newState;
        inst.state_timer = 0;
        if (inst.states[oldState] && inst.states[oldState].exit) inst.states[oldState].exit.call(inst);
        if (inst.states[newState] && inst.states[newState].enter) inst.states[newState].enter.call(inst);
    };

    // --- GML Dialog Functions ---
    window.show_message = (str) => window.alert(str);
    window.show_question = (str) => window.confirm(str);
    window.show_debug_message = (str) => console.log('GML Debug:', str);

    // --- GML Scripting ---
    window.script_execute = (scr, ...args) => {
        if (typeof scr === 'function') return scr(...args);
        if (typeof scr === 'string' && window[scr]) return window[scr](...args);
        return null;
    };
    window.audio_stop_sound  = (s) => {};
    window.audio_stop_all    = () => GM82Audio.stop_music();
    window.audio_is_playing  = (s) => true;
    window.audio_sound_get_track_position = (s) => 0;
    window.audio_set_master_volume = (v) => {};

    // =====================================================================
    // GML COMPATIBILITY LAYER
    // Provides standard GameMaker constants and functions so imported GML
    // code runs without modification.
    // =====================================================================

    // --- GML Color Constants (BGR integer format like GM) ---
    window.c_black    = 0x000000; window.c_white  = 0xFFFFFF;
    window.c_red      = 0x0000FF; window.c_green  = 0x00FF00; window.c_blue   = 0xFF0000;
    window.c_yellow   = 0x00FFFF; window.c_orange = 0x0080FF; window.c_purple = 0xFF0080;
    window.c_aqua     = 0xFFFF00; window.c_fuchsia= 0xFF00FF; window.c_lime   = 0x00FF80;
    window.c_maroon   = 0x000080; window.c_navy   = 0x800000; window.c_olive  = 0x008080;
    window.c_silver   = 0xC0C0C0; window.c_teal   = 0x808000; window.c_gray   = 0x808080;
    window.c_grey     = 0x808080; window.c_dkgray = 0x404040; window.c_ltgray = 0xD3D3D3;
    window.make_color_rgb = (r,g,b) => (b<<16)|(g<<8)|r;
    window.make_colour_rgb = window.make_color_rgb;
    window.color_get_red   = (c) => c & 0xFF;
    window.color_get_green = (c) => (c>>8) & 0xFF;
    window.color_get_blue  = (c) => (c>>16) & 0xFF;
    window.merge_color = (c1,c2,t) => {
        const r=Math.round(window.color_get_red(c1)+(window.color_get_red(c2)-window.color_get_red(c1))*t);
        const g=Math.round(window.color_get_green(c1)+(window.color_get_green(c2)-window.color_get_green(c1))*t);
        const b=Math.round(window.color_get_blue(c1)+(window.color_get_blue(c2)-window.color_get_blue(c1))*t);
        return window.make_color_rgb(r,g,b);
    };
    window.merge_colour = window.merge_color;

    function _gmlKey(key) {
        if (key === 0) return false; // vk_nokey
        if (key === 1) return Object.values(Input.keys).some(Boolean); // vk_anykey
        if (Input.keys[key]) return true;
        const name = mapGMKey(key);
        if (name && Input.keys[name]) return true;
        return false;
    }

    // --- GML Keyboard Functions ---
    window.keyboard_check         = (key) => _gmlKey(key);
    window.keyboard_check_pressed = (key) => {
        if (Input.keysPressed[key]) return true;
        const name = mapGMKey(key);
        return !!(name && Input.keysPressed[name]);
    };
    window.keyboard_check_released= (key) => {
        if (Input.keysReleased[key]) return true;
        const name = mapGMKey(key);
        return !!(name && Input.keysReleased[name]);
    };
    window.keyboard_check_direct  = (key) => _gmlKey(key);
    window.keyboard_lastkey       = 0;
    window.keyboard_lastchar      = '';
    window.keyboard_string        = '';
    window.keyboard_key           = 0;

    // --- GML Mouse Functions ---
    window.mouse_check_button         = (btn) => btn===1?Input.mouse.left  : btn===2?Input.mouse.right  : btn===3?Input.mouse.middle   : false;
    window.mouse_check_button_pressed = (btn) => btn===1?Input.mouse.leftPressed : btn===2?Input.mouse.rightPressed : false;
    window.mouse_check_button_released= (btn) => false;
    window.mouse_x = () => Input.mouse.x;
    window.mouse_y = () => Input.mouse.y;

    // --- GML Gamepad Functions ---
    window.gamepad_is_supported         = ()    => true;
    window.gamepad_is_connected         = (idx) => idx===0 && Input.gamepad.connected;
    window.gamepad_button_check         = (idx,btn) => !!(Input.gamepad.buttons[btn]);
    window.gamepad_button_check_pressed = (idx,btn) => !!(Input.gamepad.buttonsPressed[btn]);
    window.gamepad_axis_value           = (idx,axis) => Input.gamepad.axes[axis] || 0;
    window.gamepad_set_vibration        = ()    => {};
    window.gamepad_hat_count            = ()    => 0;
    window.gamepad_button_count         = ()    => 20;
    window.gamepad_axis_count           = ()    => 4;

    // --- GML Instance / Room Functions ---

    window.instance_create_depth = (x, y, depth, objName) => {
        const inst = window.instance_create(x, y, objName);
        if (inst) inst.depth = depth;
        return inst;
    };
    window.instance_destroy = (inst) => {
        if (inst === undefined || inst === null) {
            if (window._currentInstance) window._currentInstance.dead = true;
            return;
        }
        if (typeof inst === 'object' && inst.id) { inst.dead = true; }
        else if (typeof inst === 'string' || typeof inst === 'number') {
            const targets = window.instances.filter(i => !i.dead && (i.def.name === inst || i.def.id === inst || inst === 'all'));
            targets.forEach(t => t.dead = true);
        }
    };
    window.draw_text_transformed = (x, y, str, xscale, yscale, angle) => {
        if (!_drawCtx) return;
        _drawCtx.save();
        _drawCtx.translate(x, y);
        _drawCtx.rotate(-angle * Math.PI / 180);
        _drawCtx.scale(xscale, yscale);
        _drawCtx.fillStyle = _drawColor;
        _drawCtx.font = _drawFont;
        _drawCtx.fillText(String(str), 0, 0);
        _drawCtx.restore();
    };
    window.move_bounce_all = (adv) => {
        const me = window._currentInstance;
        if (!me) return;
        if (me.checkCol(currentRoom.map, currentRoom.width)) {
             // Simple bounce: reverse direction
             me.dx = -me.dx;
             me.dy = -me.dy;
        }
    };

    window.instance_create = (x,y,objName) => {
        const def = window.GAME_DATA.objects.find(o=>o.name===objName||o.id===objName);
        if (def) {
            const inst=new GMObject(x,y,def);
            window.instances.push(inst);
            inst._created = true;
            inst.triggerEvent('create');
            return inst;
        }
        return null;
    };
    // replaced
    window._old_instance_destroy = (inst) => {
        if (!inst) return;
        // inst may be an instance object directly or an object name string
        if (typeof inst === 'object' && inst.dead !== undefined) { inst.dead = true; }
        else if (typeof inst === 'string') { window.instances.filter(i=>!i.dead&&(i.def.name===inst||i.def.id===inst)).forEach(i=>i.dead=true); }
    };
    window.instance_exists = (obj) => {
        if (obj === null || obj === undefined) return false;
        return window.instances.some(i => !i.dead && (i.def.name === obj || i.def.id === obj || i === obj));
    };
    window.instance_number  = (objName) => window.instances.filter(i=>!i.dead&&(i.def.name===objName||i.def.id===objName)).length;
    window.instance_find    = (objName,n) => window.instances.filter(i=>!i.dead&&(i.def.name===objName||i.def.id===objName))[n||0]||null;

    // --- GML Room/Game Functions ---
    window.room_goto = (rid) => loadRoom(rid);
    window.room_restart = () => loadRoom(currentRoom.id);
    window.game_restart = () => resetGame();
    window.game_end = () => { window.isGameOver = true; };

    // --- GML Data Structure Stubs (Advanced) ---
    window.ds_grid_create = (w, h) => {
        const g = new Array(w).fill(0).map(() => new Array(h).fill(0));
        g.w = w; g.h = h; return g;
    };
    window.ds_grid_destroy = (g) => { g.length = 0; };
    window.ds_grid_set = (g, x, y, v) => { if (g[x]) g[x][y] = v; };
    window.ds_grid_get = (g, x, y) => (g[x] ? g[x][y] : 0);
    window.ds_grid_width = (g) => g.w || 0;
    window.ds_grid_height = (g) => g.h || 0;
    window.ds_grid_clear = (g, v) => { for(let i=0; i<g.w; i++) for(let j=0; j<g.h; j++) g[i][j] = v; };

    // --- GML Collision Functions (Shape Based) ---
    window.collision_rectangle = (x1, y1, x2, y2, obj, prec, notme) => {
        const me = window._currentInstance;
        return window.instances.find(i => {
            if (i.dead || (notme && i === me)) return false;
            if (typeof obj === 'string' && i.def.name !== obj && i.def.id !== obj && obj !== 'all') return false;
            return i.x < Math.max(x1, x2) && i.x + i.w > Math.min(x1, x2) && i.y < Math.max(y1, y2) && i.y + i.h > Math.min(y1, y2);
        }) || null;
    };
    window.collision_circle = (x, y, rad, obj, prec, notme) => {
        const me = window._currentInstance;
        return window.instances.find(i => {
            if (i.dead || (notme && i === me)) return false;
            if (typeof obj === 'string' && i.def.name !== obj && i.def.id !== obj && obj !== 'all') return false;
            // Simplified: distance from center of circle to center of instance box
            const dx = (i.x + i.w/2) - x;
            const dy = (i.y + i.h/2) - y;
            return Math.hypot(dx, dy) < rad + Math.max(i.w, i.h)/2;
        }) || null;
    };
    window.point_in_rectangle = (px, py, x1, y1, x2, y2) => px >= x1 && px <= x2 && py >= y1 && py <= y2;
    window.point_in_circle = (px, py, cx, cy, rad) => Math.hypot(px - cx, py - cy) <= rad;

    // --- Array Helpers ---
    window.__get2d = (arr, i, j) => {
        if (!arr || !arr[i]) return undefined;
        return arr[i][j];
    };

    // --- GML Drawing Functions (Expanded) ---
    window.draw_self = () => {
        const me = window._currentInstance;
        if (!me || !me.def.spriteId) return;
        window.draw_sprite_ext(me.def.spriteId, me.image_index, me.x, me.y, me.image_xscale || 1, me.image_yscale || 1, me.image_angle || 0, me.image_blend || 0xFFFFFF, me.image_alpha || 1);
    };
    window.draw_sprite_ext = (spr, sub, x, y, xscale, yscale, rot, col, alpha) => {
        const img = assets[spr];
        if (!img) return;
        ctx.save();
        ctx.translate(x, y);
        if (rot !== 0) ctx.rotate(-rot * Math.PI / 180);
        ctx.scale(xscale, yscale);
        ctx.globalAlpha = alpha;

        if (col && col !== 0xFFFFFF) {
            const offscreen = document.createElement('canvas');
            const w = img.naturalWidth || img.width || 32;
            const h = img.naturalHeight || img.height || 32;
            offscreen.width = w;
            offscreen.height = h;
            const oCtx = offscreen.getContext('2d');
            if (oCtx) {
                oCtx.drawImage(img, 0, 0);
                oCtx.globalCompositeOperation = 'source-atop';
                const r = (col >> 16) & 0xFF;
                const g = (col >> 8) & 0xFF;
                const b = col & 0xFF;
                oCtx.fillStyle = "rgba(" + r + "," + g + "," + b + ", 0.5)"; // 50% blend tint to keep player textures visible
                oCtx.fillRect(0, 0, w, h);
                ctx.drawImage(offscreen, 0, 0);
            } else {
                ctx.drawImage(img, 0, 0);
            }
        } else {
            ctx.drawImage(img, 0, 0);
        }
        ctx.restore();
    };
    window.draw_rectangle = (x1, y1, x2, y2, outline) => {
        if (outline) ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        else ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    };
    window.draw_circle = (x, y, r, outline) => {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        if (outline) ctx.stroke(); else ctx.fill();
    };
    window.draw_line = (x1, y1, x2, y2) => {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };

    window.norDrawRetroPanel = (ctx, x, y, w, h, bgColor, borderType = 'raised') => {
        ctx.fillStyle = bgColor || '#4a5568';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        ctx.fillStyle = borderType === 'raised' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.fillRect(x + 2, y, w - 4, 2); // Top
        ctx.fillRect(x, y + 2, 2, h - 4); // Left

        ctx.fillStyle = borderType === 'raised' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
        ctx.fillRect(x + 2, y + h - 2, w - 4, 2); // Bottom
        ctx.fillRect(x + w - 2, y + 2, 2, h - 4); // Right

        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(x + 1, y + 1, 1, 1);
        ctx.fillRect(x + w - 2, y + 1, 1, 1);
        ctx.fillRect(x + 1, y + h - 2, 1, 1);
        ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
    };

    window.norDrawRetroText = (ctx, text, x, y, color) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(text, x + 1, y + 1);
        ctx.fillStyle = color || '#ffffff';
        ctx.fillText(text, x, y);
    };

    window.instance_number  = (objName) => window.instances.filter(i=>!i.dead&&(i.def.name===objName||i.def.id===objName)).length;
    window.instance_change = (objName, perfCreate) => {
        const me = window._currentInstance;
        if (!me) return;
        const def = window.GAME_DATA.objects.find(o=>o.name===objName||o.id===objName);
        if (def) {
            me.def = def;
            me.currentSpriteId = def.spriteId;
            me.resolveSize();
            if (perfCreate) me.triggerEvent('create');
        }
    };
    window.instance_nearest = (x,y,objName) => window.instances.filter(i=>!i.dead&&(i.def.name===objName||i.def.id===objName)).sort((a,b)=>((a.x-x)**2+(a.y-y)**2)-((b.x-x)**2+(b.y-y)**2))[0]||null;
    window.instance_furthest = (x,y,objName) => window.instances.filter(i=>!i.dead&&(i.def.name===objName||i.def.id===objName)).sort((a,b)=>((b.x-x)**2+(b.y-y)**2)-((a.x-x)**2+(a.y-y)**2))[0]||null;

    window.distance_to_point = (x, y) => {
        const me = window._currentInstance;
        if (!me) return 0;
        return Math.hypot(x - me.x, y - me.y);
    };
    window.distance_to_object = (obj) => {
        const me = window._currentInstance;
        if (!me) return 0;
        const target = window.instance_nearest(me.x, me.y, obj);
        if (!target) return 1000000;
        return Math.hypot(target.x - me.x, target.y - me.y);
    };

    window.motion_set = (dir, spd) => {
        const me = window._currentInstance;
        if (!me) return;
        me.direction = dir; me.speed = spd;
        me.dx = Math.cos(dir * Math.PI / 180) * spd;
        me.dy = -Math.sin(dir * Math.PI / 180) * spd;
    };
    window.motion_add = (dir, spd) => {
        const me = window._currentInstance;
        if (!me) return;
        const adx = Math.cos(dir * Math.PI / 180) * spd;
        const ady = -Math.sin(dir * Math.PI / 180) * spd;
        me.dx += adx; me.dy += ady;
        me.speed = Math.hypot(me.dx, me.dy);
        me.direction = Math.atan2(-me.dy, me.dx) * 180 / Math.PI;
    };

    window.place_meeting = (x, y, obj, self) => {
        const me = self || window._currentInstance;
        if (!me) return false;
        const mw = me.w || 16; const mh = me.h || 16;

        // 1. If checking for a solid wall/ground, check tilemap value 1 first!
        const objNameLower = typeof obj === 'string' ? obj.toLowerCase() : '';
        const isWallCheck = objNameLower.includes('wall') || objNameLower.includes('ground') || objNameLower.includes('floor') || objNameLower.includes('brick') || objNameLower.includes('block') || objNameLower.includes('solid');

        if (isWallCheck && currentRoom && currentRoom.map) {
            const origX = me.x; const origY = me.y;
            me.x = x; me.y = y;
            const hasTileCol = me.checkCol(currentRoom.map, currentRoom.width);
            me.x = origX; me.y = origY;
            if (hasTileCol) return true;
        }

        // 2. Check live instances
        return window.instances.some(i => {
            if (i.dead || i === me) return false;
            if (typeof obj === 'string' && i.def.name !== obj && i.def.id !== obj) return false;
            if (typeof obj === 'number' && i.def.id !== obj) return false;
            return x < i.x + i.w && x + mw > i.x && y < i.y + i.h && y + mh > i.y;
        });
    };
    window.place_free = (x, y, self) => {
        const me = self || window._currentInstance;
        if (!me) return true;
        const mw = me.w || 16; const mh = me.h || 16;
        return !window.instances.some(i => {
            if (i.dead || i === me || !i.solid) return false;
            return x < i.x + i.w && x + mw > i.x && y < i.y + i.h && y + mh > i.y;
        });
    };
    window.instance_place = (x, y, obj, self) => {
        const me = self || window._currentInstance;
        if (!me) return null;
        const mw = me.w || 16; const mh = me.h || 16;
        return window.instances.find(i => {
            if (i.dead || i === me) return false;
            if (typeof obj === 'string' && i.def.name !== obj && i.def.id !== obj) return false;
            return x < i.x + i.w && x + mw > i.x && y < i.y + i.h && y + mh > i.y;
        }) || null;
    };
    window.instance_position = (x, y, obj) => {
        return window.instances.find(i => {
            if (i.dead) return false;
            if (typeof obj === 'string' && i.def.name !== obj && i.def.id !== obj) return false;
            return x >= i.x && x < i.x + i.w && y >= i.y && y < i.y + i.h;
        }) || null;
    };
    window.move_contact_solid = (dir, maxdist) => {
        const me = window._currentInstance;
        if (!me) return;
        const rad = dir * Math.PI / 180;
        const dx = Math.cos(rad);
        const dy = -Math.sin(rad);
        let dist = 0;
        const limit = maxdist < 0 ? 1000 : maxdist;
        while (dist < limit && window.place_free(me.x + dx, me.y + dy, me.x)) {
            me.x += dx; me.y += dy;
            dist += 1;
            if (dist > 2000) break; // Safety
        }
    };
    window.move_outside_solid = (dir, maxdist) => {
        const me = window._currentInstance;
        if (!me) return;
        if (window.place_free(me.x, me.y, me)) return;
        const rad = dir * Math.PI / 180;
        const dx = Math.cos(rad);
        const dy = -Math.sin(rad);
        let dist = 0;
        const limit = maxdist < 0 ? 1000 : maxdist;
        while (dist < limit && !window.place_free(me.x, me.y, me)) {
            me.x += dx; me.y += dy;
            dist += 1;
            if (dist > 2000) break; // Safety
        }
    };
    // collision_rectangle: returns live instance or noone (null)
    window.collision_rectangle = (x1,y1,x2,y2,obj,prec,notme) => {
        const caller = notme ? window._currentInstance : null;
        return window.instances.find(i=>{
            if (i.dead) return false;
            if (caller && i===caller) return false;
            if (typeof obj === 'string' ? (i.def.name!==obj&&i.def.id!==obj) : false) return false;
            if (typeof obj === 'string' && i.def.name!==obj && i.def.id!==obj) return false;
            return x1<i.x+i.w && x2>i.x && y1<i.y+i.h && y2>i.y;
        }) || null;
    };
    window.collision_line = (x1,y1,x2,y2,obj,prec,notme) => {
        // Simplified: check if any target instance's bbox intersects the line's bounding box
        const minX=Math.min(x1,x2), maxX=Math.max(x1,x2), minY=Math.min(y1,y2), maxY=Math.max(y1,y2);
        return window.collision_rectangle(minX,minY,maxX,maxY,obj,prec,notme);
    };
    window.collision_point = (x,y,obj,prec,notme) =>
        window.instances.find(i=>!i.dead&&(i.def.name===obj||i.def.id===obj)&&x>=i.x&&x<i.x+i.w&&y>=i.y&&y<i.y+i.h)||null;
    window.collision_circle = (x,y,r,obj,prec,notme) =>
        window.instances.find(i=>!i.dead&&(i.def.name===obj||i.def.id===obj)&&
            Math.hypot(x-(i.x+i.w/2),y-(i.y+i.h/2))<r+(i.w+i.h)/4)||null;
    window.move_towards_point = (inst,x,y,spd) => {
        if (!inst) return;
        const angle = Math.atan2(y-inst.y, x-inst.x);
        inst.dx = Math.cos(angle)*spd; inst.hspeed=inst.dx;
        inst.dy = Math.sin(angle)*spd; inst.vspeed=inst.dy;
    };
    window.room_goto        = (id) => window.loadRoom(id);
    window.room_goto_next   = ()   => { const r=window.GAME_DATA.rooms; const idx=r.findIndex(x=>x.id===currentRoom?.id); if(idx<r.length-1) window.loadRoom(r[idx+1].id); };
    window.room_goto_previous= ()  => { const r=window.GAME_DATA.rooms; const idx=r.findIndex(x=>x.id===currentRoom?.id); if(idx>0) window.loadRoom(r[idx-1].id); };
    window.room_restart     = ()   => { if(currentRoom) window.loadRoom(currentRoom.id); };
    window.game_end         = ()   => { window.isGameOver = true; };
    window.game_restart     = ()   => window.resetGame();

    const engine = {
        get canvas() { return canvas; },
        get ctx() { return ctx; },
        get currentRoom() { return currentRoom; },
        get instances() { return window.instances; },
        placeMeeting: function(x, y, obj, self) {
            return window.place_meeting(x, y, obj, self);
        },
        placeFree: function(x, y, self) {
            return window.place_free(x, y, self);
        },
        instanceCreate: function(x, y, objName) {
            return window.room_create(objName, x, y);
        },
        instanceDestroy: function(inst) {
            return window.instance_destroy(inst);
        },
        audioPlaySound: function(snd, loop = false) {
            return GM82Audio.play_sfx(snd, loop);
        }
    };
    window.engine = engine;

    // --- GML Math / String Functions ---
    window.lengthdir_x    = (len, dir) => len * Math.cos(dir * Math.PI / 180);
    window.lengthdir_y    = (len, dir) => -len * Math.sin(dir * Math.PI / 180);
    window.point_direction= (x1,y1,x2,y2) => { let a=(Math.atan2(-(y2-y1),(x2-x1))*180/Math.PI)%360; return a<0?a+360:a; };
    window.point_distance = (x1,y1,x2,y2) => Math.sqrt((x2-x1)**2+(y2-y1)**2);
    window.irandom        = (n) => Math.floor(Math.random()*(n+1));
    window.irandom_range  = (lo,hi) => Math.floor(lo+Math.random()*(hi-lo+1));
    window.random         = (n) => Math.random()*n;
    window.random_range   = (lo,hi) => lo+Math.random()*(hi-lo);
    window.choose         = (...args) => args[Math.floor(Math.random()*args.length)];
    window.abs            = Math.abs;   window.sign   = Math.sign;
    window.sin            = Math.sin;   window.cos    = Math.cos;
    window.tan            = Math.tan;   window.arctan  = Math.atan;
    window.arctan2        = Math.atan2; window.sqrt   = Math.sqrt;
    window.power          = Math.pow;   window.sqr    = (x)=>x*x;
    window.ln             = Math.log;   window.log2   = Math.log2;
    window.log10          = Math.log10; window.exp    = Math.exp;
    window.pi             = Math.PI;

    // Degree-based trig
    window.dsin = (d) => Math.sin(d * Math.PI / 180);
    window.dcos = (d) => Math.cos(d * Math.PI / 180);
    window.dtan = (d) => Math.tan(d * Math.PI / 180);
    window.darcsin = (x) => Math.asin(x) * 180 / Math.PI;
    window.darccos = (x) => Math.acos(x) * 180 / Math.PI;
    window.darctan = (x) => Math.atan(x) * 180 / Math.PI;
    window.darctan2 = (y, x) => Math.atan2(y, x) * 180 / Math.PI;

    window.floor  = Math.floor; window.ceil   = Math.ceil;
    window.round  = Math.round; window.frac   = (x)=>x-Math.floor(x);
    window.min    = Math.min;   window.max    = Math.max;
    window.mean   = (...a) => a.reduce((p, c) => p + c, 0) / a.length;
    window.median = (...a) => { a.sort((x,y)=>x-y); return a[Math.floor(a.length/2)]; };
    window.clamp  = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
    window.lerp   = (a,b,t) => a+(b-a)*t;
    window.dot_product = (x1, y1, x2, y2) => x1 * x2 + y1 * y2;
    window.angle_difference = (s, d) => ((((d - s) % 360) + 540) % 360) - 180;

    window.degtorad= (d) => d*Math.PI/180;
    window.radtodeg= (r) => r*180/Math.PI;
    window.string  = (v) => String(v);
    window.real    = (s) => parseFloat(s)||0;
    window.string_length = (s) => String(s).length;
    window.string_copy   = (s,idx,cnt) => String(s).substr(idx-1,cnt);
    window.string_pos    = (sub,s) => String(s).indexOf(sub)+1;
    window.string_upper  = (s) => String(s).toUpperCase();
    window.string_lower  = (s) => String(s).toLowerCase();
    window.string_repeat = (s, n) => String(s).repeat(n);
    window.string_letters = (s) => String(s).replace(/[^a-zA-Z]/g, '');
    window.string_digits  = (s) => String(s).replace(/[^0-9]/g, '');
    window.string_lettersdigits = (s) => String(s).replace(/[^a-zA-Z0-9]/g, '');
    window.string_count = (sub, s) => (String(s).match(new RegExp(sub, 'g')) || []).length;
    window.string_delete = (s,idx,cnt) => { const str=String(s); return str.substr(0,idx-1)+str.substr(idx-1+cnt); };
    window.string_insert = (sub,s,idx) => { const str=String(s); return str.substr(0,idx-1)+sub+str.substr(idx-1); };
    window.string_replace= (s,sub,rep) => String(s).split(sub).join(rep);
    window.string_replace_all = window.string_replace;
    window.string_char_at= (s,idx) => String(s)[idx-1]||'';
    window.number_format = (n,dec) => n.toFixed(dec);
    window.string_format = (v, tot, dec) => v.toFixed(dec).padStart(tot, ' ');
    window.ord  = (c) => String(c).charCodeAt(0)||0;
    window.chr  = (n) => String.fromCharCode(n);
    window.is_string = (v) => typeof v === 'string';
    window.is_real   = (v) => typeof v === 'number';
    window.is_bool   = (v) => typeof v === 'boolean';
    window.is_array  = (v) => Array.isArray(v);

    // --- GML Date/Time Functions ---
    window.date_current_datetime = () => Date.now() / (24 * 60 * 60 * 1000) + 25569; // Excel/GML Epoch
    window.date_get_year = (d) => new Date((d - 25569) * 24 * 60 * 60 * 1000).getFullYear();
    window.date_get_month = (d) => new Date((d - 25569) * 24 * 60 * 60 * 1000).getMonth() + 1;
    window.date_get_day = (d) => new Date((d - 25569) * 24 * 60 * 60 * 1000).getDate();
    window.date_get_hour = (d) => new Date((d - 25569) * 24 * 60 * 60 * 1000).getHours();
    window.date_get_minute = (d) => new Date((d - 25569) * 24 * 60 * 60 * 1000).getMinutes();
    window.date_get_second = (d) => new Date((d - 25569) * 24 * 60 * 60 * 1000).getSeconds();
    window.date_inc_day = (d, n) => d + n;
    window.date_inc_month = (d, n) => {
        const dt = new Date((d - 25569) * 24 * 60 * 60 * 1000);
        dt.setMonth(dt.getMonth() + n);
        return dt.getTime() / (24 * 60 * 60 * 1000) + 25569;
    };

    // --- GML Data Structure Stubs ---
    window.ds_list_create = () => [];
    window.ds_list_destroy = (l) => { l.length = 0; };
    window.ds_list_add = (l, v) => l.push(v);
    window.ds_list_size = (l) => l.length;
    window.ds_list_clear = (l) => { l.length = 0; };
    window.ds_list_find_value = (l, idx) => l[idx];
    window.ds_list_delete = (l, idx) => l.splice(idx, 1);

    window.ds_map_create = () => ({});
    window.ds_map_destroy = (m) => {};
    window.ds_map_add = (m, k, v) => { m[k] = v; };
    window.ds_map_find_value = (m, k) => m[k];
    window.ds_map_exists = (m, k) => k in m;
    window.ds_map_delete = (m, k) => { delete m[k]; };
    window.ds_map_clear = (m) => { for (let k in m) delete m[k]; };

    // --- GML View Functions ---
    window.view_xview = new Proxy({}, {
        get: (target, prop) => {
            const idx = parseInt(prop);
            const v = currentRoom.views && currentRoom.views[idx];
            return v ? v.viewX : 0;
        },
        set: (target, prop, val) => {
            const idx = parseInt(prop);
            if (currentRoom.views && currentRoom.views[idx]) currentRoom.views[idx].viewX = val;
            return true;
        }
    });
    window.view_yview = new Proxy({}, {
        get: (target, prop) => {
            const idx = parseInt(prop);
            const v = currentRoom.views && currentRoom.views[idx];
            return v ? v.viewY : 0;
        },
        set: (target, prop, val) => {
            const idx = parseInt(prop);
            if (currentRoom.views && currentRoom.views[idx]) currentRoom.views[idx].viewY = val;
            return true;
        }
    });
    window.view_wview = new Proxy({}, {
        get: (target, prop) => {
            const idx = parseInt(prop);
            const v = currentRoom.views && currentRoom.views[idx];
            return v ? v.viewW : 256;
        },
        set: (target, prop, val) => {
            const idx = parseInt(prop);
            if (currentRoom.views && currentRoom.views[idx]) currentRoom.views[idx].viewW = val;
            return true;
        }
    });
    window.view_hview = new Proxy({}, {
        get: (target, prop) => {
            const idx = parseInt(prop);
            const v = currentRoom.views && currentRoom.views[idx];
            return v ? v.viewH : 240;
        },
        set: (target, prop, val) => {
            const idx = parseInt(prop);
            if (currentRoom.views && currentRoom.views[idx]) currentRoom.views[idx].viewH = val;
            return true;
        }
    });
    window.view_visible = new Proxy({}, {
        get: (target, prop) => {
            const idx = parseInt(prop);
            const v = currentRoom.views && currentRoom.views[idx];
            return v ? v.visible : false;
        },
        set: (target, prop, val) => {
            const idx = parseInt(prop);
            if (currentRoom.views && currentRoom.views[idx]) currentRoom.views[idx].visible = !!val;
            return true;
        }
    });

    // --- GML Drawing Constants ---
    window.fa_left = 'left'; window.fa_center = 'center'; window.fa_right = 'right';
    window.fa_top = 'top';   window.fa_middle = 'middle'; window.fa_bottom = 'bottom';

    window.draw_set_color = (c) => {
        if (typeof c === 'number') {
            const r = c & 0xFF; const g = (c >> 8) & 0xFF; const b = (c >> 16) & 0xFF;
            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.strokeStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        } else {
            ctx.fillStyle = c; ctx.strokeStyle = c;
        }
    };
    window.draw_set_alpha = (a) => { ctx.globalAlpha = a; };
    window.draw_set_font = (f) => {
        // Simple mapping: if Press Start 2P is used, it will be the default
        ctx.font = '8px "Press Start 2P"';
    };
    window.draw_text = (x, y, str) => {
        ctx.fillText(str, x, y);
    };
    window.draw_sprite = (spr, sub, x, y) => {
        const img = assets[spr];
        if (!img) return;
        const frameW = img.width; // Simplified
        ctx.drawImage(img, x, y);
    };
    window.is_undefined = (v) => v === undefined;
    window.int64 = (n) => Math.trunc(n);

    // --- GML Timing / Alarm Helpers ---
    window.alarm_set   = (inst,idx,val) => { if(inst && inst.alarms) inst.alarms[idx]=val; };
    window.alarm_get   = (inst,idx)     => inst?.alarms?.[idx] ?? -1;
    window.get_timer   = ()             => performance.now()*1000;
    window.fps         = 60;
    window.fps_real    = 60;
    window.delta_time  = 1000000/60;
    window.current_time= () => performance.now();
    window.date_current_datetime = () => Date.now();

    // --- GML Room Globals (live getters) ---
    Object.defineProperty(window, 'room_width',  { get: () => currentRoom ? (currentRoom.width  * ((currentRoom.settings&&currentRoom.settings.snapX)||16)) : 800 });
    Object.defineProperty(window, 'room_height', { get: () => currentRoom ? (currentRoom.height * ((currentRoom.settings&&currentRoom.settings.snapY)||16)) : 608 });
    Object.defineProperty(window, 'room_speed',  { get: () => currentRoom?.settings?.speed || 30 });
    Object.defineProperty(window, 'room',        { get: () => currentRoom?.id || '' });
    Object.defineProperty(window, 'room_caption',{ get: () => currentRoom?.settings?.name || '' });

    // --- Misc GML API ---
    window.show_message = (msg) => window.alert('[Game Message] ' + msg);
    window.show_debug_message = (msg) => console.debug('[GML debug]', msg);
    window.variable_global_set= (n,v) => { window[n]=v; };
    window.variable_global_get= (n)   => window[n];
    window.with_all = (objName, func) => {
        const targets = window.instances.filter(i => !i.dead && (i.def.name === objName || i.def.id === objName || objName === 'all'));
        targets.forEach(t => {
            const prev = window._currentInstance;
            window._currentInstance = t;
            try { func.call(t); } catch(e) {}
            window._currentInstance = prev;
        });
    };
    window.global            = window;
    window.noone             = null;
    window.undefined_        = undefined;
    window.GM_version        = '8.1.141';
    window.GM_runtime_version = '8.1.141';

    // --- GML Particle System (Stubs/Basic) ---
    window.part_system_create = () => {
        const sys = { id: uid(), emitters: [], active: true };
        if (!window.part_system_list) window.part_system_list = [];
        window.part_system_list.push(sys);
        return sys;
    };
    window.part_system_destroy = (sys) => {
        if (window.part_system_list) {
            window.part_system_list = window.part_system_list.filter(s => s !== sys);
        }
    };
    window.part_type_create = () => ({ id: uid(), shape: 0, color1: 0xFFFFFF, alpha1: 1, size_min: 1, size_max: 1, speed_min: 0, speed_max: 0, dir_min: 0, dir_max: 360, life_min: 30, life_max: 60 });
    window.part_type_shape = (t, s) => { t.shape = s; };
    window.part_type_color1 = (t, c) => { t.color1 = c; };
    window.part_type_alpha1 = (t, a) => { t.alpha1 = a; };
    window.part_type_size = (t, min, max, inc, wiggle) => { t.size_min = min; t.size_max = max; t.size_inc = inc; t.size_wiggle = wiggle; };
    window.part_type_speed = (t, smin, smax, sinc, sfric) => { t.speed_min = smin; t.speed_max = smax; t.speed_inc = sinc; t.speed_fric = sfric; };
    window.part_type_direction = (t, dmin, dmax, dinc, dwig) => { t.dir_min = dmin; t.dir_max = dmax; t.dir_inc = dinc; t.dir_wig = dwig; };
    window.part_type_life = (t, lmin, lmax) => { t.life_min = lmin; t.life_max = lmax; };

    window.part_emitter_create = (sys) => { const e = { id: uid(), sys, x1:0, x2:0, y1:0, y2:0, shape:0, distribution:0 }; sys.emitters.push(e); return e; };
    window.part_emitter_region = (sys, emit, x1, x2, y1, y2, shape, dist) => { emit.x1 = x1; emit.x2 = x2; emit.y1 = y1; emit.y2 = y2; emit.shape = shape; emit.distribution = dist; };
    window.part_emitter_burst = (sys, emit, type, count) => {
        for (let i = 0; i < count; i++) {
            const rx = emit.x1 + Math.random() * (emit.x2 - emit.x1);
            const ry = emit.y1 + Math.random() * (emit.y2 - emit.y1);
            window.part_particles_create(sys, rx, ry, type, 1);
        }
    };
    window.part_particles_create = (sys, x, y, t, count) => {
        for (let i = 0; i < count; i++) {
            const spd = t.speed_min + Math.random() * (t.speed_max - t.speed_min);
            const dir = t.dir_min + Math.random() * (t.dir_max - t.dir_min);
            const life = t.life_min + Math.random() * (t.life_max - t.life_min);
            const size = t.size_min + Math.random() * (t.size_max - t.size_min);
            const col = typeof t.color1 === 'number' ? '#' + t.color1.toString(16).padStart(6, '0') : (t.color1 || 'white');

            if (!window.particles) window.particles = [];
            window.particles.push({
                x, y,
                dx: Math.cos(dir * Math.PI / 180) * spd,
                dy: -Math.sin(dir * Math.PI / 180) * spd,
                life: Math.round(life),
                col: col,
                size: size,
                alpha: t.alpha1
            });
        }
    };

    // --- GML Draw Extras ---
    window.screen_get_width  = () => 800;
    window.screen_get_height = () => 608;
    window.window_get_width  = () => 800;
    window.window_get_height = () => 608;
    window.display_get_width = () => window.innerWidth;
    window.display_get_height= () => window.innerHeight;
    window.view_xview = new Array(8).fill(0);
    window.view_yview = new Array(8).fill(0);
    window.view_wview = new Array(8).fill(800);
    window.view_hview = new Array(8).fill(608);
    window.view_enabled = false;
    window.view_visible = new Array(8).fill(false);

    // --- ds_list / ds_map stubs ---
    const _ds_lists = {}; let _ds_list_id = 0;
    window.ds_list_create = () => { const id=_ds_list_id++; _ds_lists[id]=[]; return id; };
    window.ds_list_add    = (id,...v) => { if(_ds_lists[id]) _ds_lists[id].push(...v); };
    window.ds_list_size   = (id) => _ds_lists[id]?.length||0;
    window.ds_list_find_value = (id,n) => _ds_lists[id]?.[n]??(-1);
    window.ds_list_delete = (id,n) => { if(_ds_lists[id]) _ds_lists[id].splice(n,1); };
    window.ds_list_destroy= (id) => { delete _ds_lists[id]; };
    const _ds_maps = {}; let _ds_map_id = 0;
    window.ds_map_create  = () => { const id=_ds_map_id++; _ds_maps[id]={}; return id; };
    window.ds_map_set     = (id,k,v) => { if(_ds_maps[id]) _ds_maps[id][k]=v; };
    window.ds_map_find_value = (id,k) => _ds_maps[id]?.[k]??0;
    window.ds_map_exists  = (id,k) => !!(id in _ds_maps && k in _ds_maps[id]);
    window.ds_map_destroy = (id) => { delete _ds_maps[id]; };


    // --- Real Canvas Draw Functions ---
    // These use a shared _drawCtx reference updated each Draw event call
    let _drawCtx = null;
    let _drawColor = '#ffffff';
    let _drawAlpha = 1;
    let _drawFont  = '14px monospace';

    window.draw_set_color = (c) => {
        if (typeof c === 'number') {
            // GM stores colors as BGR integer
            const r = c & 0xFF;
            const g = (c >> 8) & 0xFF;
            const b = (c >> 16) & 0xFF;
            _drawColor = "rgb(" + r + "," + g + "," + b + ")";
        } else {
            _drawColor = c;
        }
    };
    window.draw_set_colour = window.draw_set_color;
    window.draw_set_alpha  = (a) => { _drawAlpha = a; };
    window.draw_set_font   = (f) => { _drawFont = typeof f === 'string' ? f : '14px monospace'; };

    window.draw_sprite = (spr, subimg, x, y) => {
        if (!_drawCtx) return;
        const img = assets[spr];
        if (!img || !img.complete || img.naturalWidth === 0) return;
        const meta = SPRITE_METADATA[spr];
        let fIndex = subimg;
        if (fIndex === -1 && window._currentInstance) fIndex = window._currentInstance.image_index;
        else if (fIndex === -1) fIndex = 0;
        if (meta && meta.fw && meta.fh) {
            const frame = Math.floor(fIndex) % Math.max(1, Math.floor(img.width / meta.fw));
            _drawCtx.drawImage(img, frame * meta.fw, 0, meta.fw, meta.fh, x, y, meta.fw, meta.fh);
        } else {
            _drawCtx.drawImage(img, x, y);
        }
    };
    window.draw_sprite_ext = (spr, subimg, x, y, xscale, yscale, rot, color, alpha) => {
        if (!_drawCtx) return;
        const img = assets[spr];
        if (!img || !img.complete) return;
        const meta = SPRITE_METADATA[spr];
        const fw = meta?.fw || img.width;
        const fh = meta?.fh || img.height;
        let fIndex = subimg;
        if (fIndex === -1 && window._currentInstance) fIndex = window._currentInstance.image_index;
        else if (fIndex === -1) fIndex = 0;
        const frame = meta ? Math.floor(fIndex) % Math.max(1,Math.floor(img.width/fw)) : 0;
        _drawCtx.save();
        _drawCtx.globalAlpha = alpha !== undefined ? alpha : 1;
        _drawCtx.translate(x, y);
        _drawCtx.rotate((rot || 0) * Math.PI / 180);
        _drawCtx.scale(xscale !== undefined ? xscale : 1, yscale !== undefined ? yscale : 1);
        _drawCtx.drawImage(img, frame * fw, 0, fw, fh, 0, 0, fw, fh);
        _drawCtx.restore();
    };
    window.draw_text = (x, y, str) => {
        if (!_drawCtx) return;
        _drawCtx.save();
        _drawCtx.fillStyle = _drawColor;
        _drawCtx.globalAlpha = _drawAlpha;
        _drawCtx.font = _drawFont;
        _drawCtx.fillText(String(str), x, y);
        _drawCtx.restore();
    };
    window.draw_text_color = window.draw_text;
    window.draw_text_colour = window.draw_text;
    window.draw_rectangle = (x1,y1,x2,y2,outline) => {
        if (!_drawCtx) return;
        _drawCtx.save();
        _drawCtx.strokeStyle = _drawColor;
        _drawCtx.fillStyle   = _drawColor;
        _drawCtx.globalAlpha = _drawAlpha;
        if (outline) _drawCtx.strokeRect(x1, y1, x2-x1, y2-y1);
        else         _drawCtx.fillRect(x1, y1, x2-x1, y2-y1);
        _drawCtx.restore();
    };
    window.draw_circle = (x,y,r,outline) => {
        if (!_drawCtx) return;
        _drawCtx.save();
        _drawCtx.strokeStyle = _drawColor;
        _drawCtx.fillStyle   = _drawColor;
        _drawCtx.globalAlpha = _drawAlpha;
        _drawCtx.beginPath();
        _drawCtx.arc(x, y, r, 0, Math.PI * 2);
        if (outline) _drawCtx.stroke(); else _drawCtx.fill();
        _drawCtx.restore();
    };
    window.draw_ellipse = (x1,y1,x2,y2,outline) => {
        if (!_drawCtx) return;
        const cx=(x1+x2)/2, cy=(y1+y2)/2, rx=(x2-x1)/2, ry=(y2-y1)/2;
        _drawCtx.save();
        _drawCtx.strokeStyle = _drawColor;
        _drawCtx.fillStyle   = _drawColor;
        _drawCtx.globalAlpha = _drawAlpha;
        _drawCtx.beginPath();
        _drawCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
        if (outline) _drawCtx.stroke(); else _drawCtx.fill();
        _drawCtx.restore();
    };
    window.draw_line = (x1,y1,x2,y2) => {
        if (!_drawCtx) return;
        _drawCtx.save();
        _drawCtx.strokeStyle = _drawColor;
        _drawCtx.globalAlpha = _drawAlpha;
        _drawCtx.beginPath();
        _drawCtx.moveTo(x1,y1);
        _drawCtx.lineTo(x2,y2);
        _drawCtx.stroke();
        _drawCtx.restore();
    };
    window.draw_point = (x,y) => {
        if (!_drawCtx) return;
        _drawCtx.save();
        _drawCtx.fillStyle = _drawColor;
        _drawCtx.fillRect(x,y,1,1);
        _drawCtx.restore();
    };
    // Expose setter so triggerEvent('draw') passes ctx
    window._setDrawCtx = (ctx) => { _drawCtx = ctx; if (ctx) ctx.imageSmoothingEnabled = !!window.imageSmoothing; };

    // =====================================================================
    // Compile Object Events
    // =====================================================================
    const OBJECT_EVENTS = {};
    if (window.GAME_DATA.events) {
        Object.keys(window.GAME_DATA.events).forEach(objId => {
            OBJECT_EVENTS[objId] = {};
            const evs = window.GAME_DATA.events[objId];
            Object.keys(evs).forEach(evType => {
                try {
                    // Wrap in with(this) to allow GML-style direct variable access (e.g. x += 5 instead of this.x += 5)
                    // We must escape the newline character to prevent SyntaxError inside the inline script template string!
                    // Declare explicit Input and engine local variables to guarantee reliable scope resolution on Android WebViews.
                    OBJECT_EVENTS[objId][evType] = new Function('other', 'ctx', 'const Input = window.Input; const engine = window.engine; with(this) { ' + evs[evType] + '\\n}');
                } catch(e) {
                    console.error('Event Compile Error in ' + objId + ' [' + evType + ']:', e);
                }
            });
        });
    }

    ${projectData.extensions.map(ext => '// Ext ' + ext + '\n').join('\n')}

    const SPRITE_METADATA = {};
    if (window.GAME_DATA.assets.sprites) {
        window.GAME_DATA.assets.sprites.forEach(s => {
            SPRITE_METADATA[s.id] = {
                fw: s.frameWidth,
                fh: s.frameHeight,
                bLeft: s.bboxLeft,
                bRight: s.bboxRight,
                bTop: s.bboxTop,
                bBottom: s.bboxBottom
            };
        });
    }

    // --- GENERIC GAME OBJECT CLASS ---
    class SpatialHash {
        constructor(cellSize = 64) {
            this.cellSize = cellSize;
            this.buckets = new Map();
        }
        clear() { this.buckets.clear(); }
        getKeys(x, y, w, h) {
            const x1 = Math.floor(x / this.cellSize);
            const y1 = Math.floor(y / this.cellSize);
            const x2 = Math.floor((x + w) / this.cellSize);
            const y2 = Math.floor((y + h) / this.cellSize);
            const keys = [];
            for (let i = x1; i <= x2; i++) {
                for (let j = y1; j <= y2; j++) keys.push(i + ',' + j);
            }
            return keys;
        }
        insert(inst) {
            if (inst.dead) return;
            const keys = this.getKeys(inst.x, inst.y, inst.w, inst.h);
            for (let i=0; i<keys.length; i++) {
                let bucket = this.buckets.get(keys[i]);
                if (!bucket) { bucket = []; this.buckets.set(keys[i], bucket); }
                bucket.push(inst);
            }
        }
        getPotentials(x, y, w, h) {
            const keys = this.getKeys(x, y, w, h);
            const result = new Set();
            for (let i=0; i<keys.length; i++) {
                const bucket = this.buckets.get(keys[i]);
                if (bucket) {
                    for (let j=0; j<bucket.length; j++) if (!bucket[j].dead) result.add(bucket[j]);
                }
            }
            return result;
        }
    }

    let _globalInstanceIdCounter = 100000;

    class GMObject {
        constructor(x, y, def) {
            this.instance_id = _globalInstanceIdCounter++;
            this.x = x; this.y = y; this.z = 0; this.w = 16; this.h = 16;
            this.dx = 0; this.dy = 0; this.dz = 0;
            this.def = def;
            this.dead = false;
            this.facing = 1;
            this.grounded = false;
            this.inAir = false;
            this.frame = 0;
            this.animSpeed = 0.2;
            this.alarms = new Array(12).fill(-1);
            this.health = def.health !== undefined ? def.health : 100;
            this.lives = def.lives !== undefined ? def.lives : 1;
            this.visible = def.visible !== false;
            this.solid = def.solid === true;
            this.depth = def.depth || 0;
            this.persistent = def.persistent === true;
            this.currentSpriteId = def.spriteId;
            this.animState = null;

            // --- GML Standard Properties ---
            this.id = this;                          // GML: id refers to the instance itself
            this.object_index = def.id;              // GML: object_index is the object's ID/name
            this.sprite_index = def.spriteId || -1;  // GML: sprite_index
            this.image_index  = 0;                   // GML: image_index (current frame)
            this.image_speed  = 1;                   // GML: animation speed multiplier
            this.image_angle  = 0;                   // GML: rotation angle of sprite
            this.image_alpha  = 1;                   // GML: transparency (0-1)
            this.image_xscale = 1;                   // GML: horizontal scale
            this.image_yscale = 1;                   // GML: vertical scale
            this.image_blend  = 0xFFFFFF;            // GML: blend color
            this.speed        = 0;                   // GML: scalar speed
            this.direction    = 0;                   // GML: movement direction in degrees
            this.friction     = 0;                   // GML: friction (subtracted each step)
            this.gravity      = 0;                   // GML: gravity amount per step
            this.gravity_direction = 270;            // GML: gravity direction (270 = down)
            this.hspeed       = 0;                   // GML: alias for dx
            this.vspeed       = 0;                   // GML: alias for dy
            this.xprevious    = x;                   // GML: previous frame X
            this.yprevious    = y;                   // GML: previous frame Y
            this.xstart       = x;                   // GML: start X position
            this.ystart       = y;                   // GML: start Y position
            this.path_index   = -1;
            this.timeline_index = -1;
            this.mask_index   = def.mask || -1;

            // --- Bounding Box Getters ---
            Object.defineProperty(this, 'bbox_left', { get: () => {
                const meta = SPRITE_METADATA[this.mask_index !== -1 ? this.mask_index : this.currentSpriteId];
                if (meta && meta.bLeft !== undefined) return Math.round(this.x + meta.bLeft);
                return Math.round(this.x);
            }});
            Object.defineProperty(this, 'bbox_top', { get: () => {
                const meta = SPRITE_METADATA[this.mask_index !== -1 ? this.mask_index : this.currentSpriteId];
                if (meta && meta.bTop !== undefined) return Math.round(this.y + meta.bTop);
                return Math.round(this.y);
            }});
            Object.defineProperty(this, 'bbox_right', { get: () => {
                const meta = SPRITE_METADATA[this.mask_index !== -1 ? this.mask_index : this.currentSpriteId];
                if (meta && meta.bRight !== undefined) return Math.round(this.x + meta.bRight);
                return Math.round(this.x + this.w - 1);
            }});
            Object.defineProperty(this, 'bbox_bottom', { get: () => {
                const meta = SPRITE_METADATA[this.mask_index !== -1 ? this.mask_index : this.currentSpriteId];
                if (meta && meta.bBottom !== undefined) return Math.round(this.y + meta.bBottom);
                return Math.round(this.y + this.h - 1);
            }});

            this.resolveSize();
            this._lastNotifiedFrame = -1;
            // triggerEvent('create') is now called AFTER the instance is pushed to window.instances
        }

        resolveSize() {
            if (!this.currentSpriteId) return;
            const img = assets[this.currentSpriteId];
            if (img && img.complete && img.naturalWidth > 0) {
                const meta = SPRITE_METADATA[this.currentSpriteId];
                if (meta && meta.fw && meta.fh) { this.w = meta.fw; this.h = meta.fh; }
                else if (img.width > img.height) { this.w = img.height; this.h = img.height; }
                else { this.w = img.width; this.h = img.height; }
            }
        }

        triggerEvent(type, data = null, ctx = null) {
            if (this.dead) return;
            let eventKey = type;
            if (type === 'alarm') eventKey = 'alarm_' + data;
            if (['keyboard', 'keypress', 'keyrelease'].includes(type)) {
                // For keyboard events, data can be a keyCode (number) or a key name (string)
                // We want to normalize it to the GMX-style name if possible
                const name = typeof data === 'number' ? mapGMKey(data) : data;
                eventKey = type + '_' + name;

                // If not found with the name, try the raw keyCode as a fallback
                if (!(OBJECT_EVENTS[this.def.id] && OBJECT_EVENTS[this.def.id][eventKey])) {
                    if (typeof data === 'number') eventKey = type + '_' + data;
                }
            }
            if (type === 'mouse') eventKey = type + '_' + data;

            if (OBJECT_EVENTS[this.def.id] && OBJECT_EVENTS[this.def.id][eventKey]) {
                const prevInst = window._currentInstance;
                window._currentInstance = this;
                try {
                    OBJECT_EVENTS[this.def.id][eventKey].call(this, data, ctx); // data maps to 'other', ctx maps to 'ctx'
                } catch(e) {
                    console.error('[' + this.def.id + '::' + eventKey + '] execution error:', e);
                }
                window._currentInstance = prevInst;
            }
        }

        callLegacyAction(funcName, args, relative = false, not = false) {
            if (this.dead) return;
            const self = this;

            // Implementation of common GM 8.1 functions
            switch(funcName) {
                case 'action_move_fixed':
                    // args: [directions_mask, speed]
                    const mask = args[0];
                    const spd = args[1];
                    const dirs = [];
                    if (mask & 1) dirs.push({dx:-1, dy:-1}); //NW
                    if (mask & 2) dirs.push({dx:0, dy:-1}); //N
                    if (mask & 4) dirs.push({dx:1, dy:-1}); //NE
                    if (mask & 8) dirs.push({dx:-1, dy:0}); //W
                    if (mask & 16) { this.dx=0; this.dy=0; return; } //Stop
                    if (mask & 32) dirs.push({dx:1, dy:0}); //E
                    if (mask & 64) dirs.push({dx:-1, dy:1}); //SW
                    if (mask & 128) dirs.push({dx:0, dy:1}); //S
                    if (mask & 256) dirs.push({dx:1, dy:1}); //SE

                    if (dirs.length > 0) {
                        const d = dirs[Math.floor(Math.random() * dirs.length)];
                        this.dx = d.dx * spd;
                        this.dy = d.dy * spd;
                    }
                    break;
                case 'action_move_point':
                    const tx = args[0]; const ty = args[1]; const mSpd = args[2];
                    const angle = Math.atan2(ty - this.y, tx - this.x);
                    this.dx = Math.cos(angle) * mSpd;
                    this.dy = Math.sin(angle) * mSpd;
                    break;
                case 'action_set_gravity':
                    this.gravity = args[1];
                    // direction args[0] not fully supported in simple engine
                    break;
                case 'action_set_friction':
                    this.friction = args[0];
                    break;
                case 'action_kill_object':
                    this.dead = true;
                    break;
                case 'action_create_object':
                    const objName = args[0];
                    const nx = relative ? this.x + args[1] : args[1];
                    const ny = relative ? this.y + args[2] : args[2];
                    if (window.room_create) window.room_create(objName, nx, ny);
                    break;
                case 'action_sprite_set':
                    this.currentSpriteId = args[0];
                    this.frame = args[1];
                    this.animSpeed = args[2];
                    this.resolveSize();
                    break;
                case 'action_sound':
                    if (window.playSound) window.playSound(args[0]);
                    break;
                case 'action_if_variable':
                    const val = this[args[0]];
                    const target = args[1];
                    const op = args[2]; // 1: <, 2: <=, 3: ==, 4: !=, 5: >=, 6: >
                    let result = false;
                    switch(op) {
                        case 1: result = val < target; break;
                        case 2: result = val <= target; break;
                        case 3: result = val == target; break;
                        case 4: result = val != target; break;
                        case 5: result = val >= target; break;
                        case 6: result = val > target; break;
                    }
                    if (not) result = !result;
                    // Note: 'if' actions in the engine expect the next block to be conditional.
                    // This is a simplified implementation.
                    return result;
                default:
                    console.warn("Legacy Action not implemented: " + funcName, args);
            }
        }

        draw(ctx) {
            if (this.dead || !this.visible) return;
            // Inject canvas context for GML draw_* functions
            if (window._setDrawCtx) window._setDrawCtx(ctx);
            if (OBJECT_EVENTS[this.def.id] && OBJECT_EVENTS[this.def.id]['draw']) {
                this.triggerEvent('draw', null, ctx);
                return;
            }

            if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

            let img = null;
            if (this.sprite_index) img = assets[this.sprite_index];
            else if (this.currentSpriteId) img = assets[this.currentSpriteId];

            if (img && img.complete && img.naturalWidth > 0) {
                const sprId = this.sprite_index || this.currentSpriteId;
                const meta = SPRITE_METADATA[sprId];
                let frameW = img.width;
                let frameH = img.height;
                let numFrames = 1;

                if (meta && meta.fw && meta.fh) {
                    frameW = meta.fw;
                    frameH = meta.fh;
                    numFrames = Math.floor(img.width / frameW);
                } else {
                    numFrames = Math.floor(img.width / img.height);
                    if (numFrames > 1) {
                        frameW = img.height;
                        frameH = img.height;
                    }
                }

                if (numFrames > 1) {
                    // Animation is handled in updateAnimation() now
                } else { this.frame = 0; }

                if (this.w !== frameW) this.w = frameW;
                if (this.h !== frameH) this.h = frameH;

                const sx = Math.floor(this.image_index) * frameW;
                ctx.save();
                ctx.globalAlpha = this.image_alpha;
                ctx.translate(Math.round(this.x) + (frameW/2), Math.round(this.y) + (frameH/2));
                ctx.rotate(this.image_angle * Math.PI / 180);
                ctx.scale(this.facing * this.image_xscale, 1 * this.image_yscale);
                ctx.drawImage(img, sx, 0, frameW, frameH, -frameW/2, -frameH/2, frameW, frameH);
                ctx.restore();
            } else if (this.currentSpriteId) {
                ctx.fillStyle = '#ff00ff';
                ctx.globalAlpha = this.image_alpha;
                ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, this.h);
            }
        }

        updateAnimation() {
            if (this.dx > 0.1) this.facing = 1;
            else if (this.dx < -0.1) this.facing = -1;

            if (!this.def.animations) return;
            const anims = this.def.animations;
            let nextSprite = anims.idle || this.def.spriteId;

            if (this.animState && anims[this.animState]) {
                nextSprite = anims[this.animState];
            } else {
                if (this.dy < 0) {
                    nextSprite = anims.jump || anims.walk || nextSprite;
                } else if (this.dy > 0 && !this.grounded) {
                    nextSprite = anims.fall || anims.walk || nextSprite;
                } else if (Math.abs(this.dx) > 0.1) {
                    nextSprite = (Math.abs(this.dx) > 3 && anims.run) ? anims.run : (anims.walk || nextSprite);
                }
            }

            if (this.currentSpriteId !== nextSprite) {
                this.currentSpriteId = nextSprite;
                this.resolveSize();
            }

            // Animation Notify Logic
            const sprId = this.currentSpriteId;
            const frame = Math.floor(this.image_index);
            const objNotifies = window._animation_notifies && window._animation_notifies[this.def.name];
            if (objNotifies && objNotifies[sprId] && objNotifies[sprId][frame]) {
                if (this._lastNotifiedFrame !== frame) {
                    objNotifies[sprId][frame].call(this);
                    this._lastNotifiedFrame = frame;
                }
            } else {
                this._lastNotifiedFrame = frame;
            }

            // State Machine Update
            if (this.states) window.state_machine_update(this);
        }

        update(map, cols) {
            // Save previous position for GML xprevious/yprevious
            this.xprevious = this.x;
            this.yprevious = this.y;

            // Sync GML hspeed/vspeed aliases → dx/dy (GML code writes to hspeed/vspeed)
            if (this.hspeed !== this.dx) this.dx = this.hspeed;
            if (this.vspeed !== this.dy) this.dy = this.vspeed;

            // Apply GML speed+direction → dx/dy if speed was set
            if (this.speed !== 0) {
                this.dx = this.speed * Math.cos(this.direction * Math.PI / 180);
                this.dy = -this.speed * Math.sin(this.direction * Math.PI / 180);
            }

            // Sync image_index to frame
            this.image_index = this.frame;
            this.sprite_index = this.currentSpriteId;

            this.triggerEvent('step_begin');
            this.triggerEvent('step');

            // 3D Movement Override
            let is3DPlayer = false;
            if (window.currentRoom && window.currentRoom.viewMode === '3d') {
                const isPlayerObj = this.def.role === 'player' ||
                                   this.def.name.toLowerCase().includes('player') ||
                                   this.def.name.toLowerCase().includes('hero') ||
                                   this.def.name.toLowerCase().includes('character') ||
                                   (window.currentRoom.views && window.currentRoom.views[0] && (this.def.name === window.currentRoom.views[0].followObj || this.def.id === window.currentRoom.views[0].followObj));

                if (isPlayerObj) {
                    is3DPlayer = true;
                    const camMode = window.currentRoom.settings.cameraMode || (window.GAME_DATA.metadata.template === 'first_person' || window.GAME_DATA.metadata.template === 'vr' ? 'first_person' : 'third_person');

                    let h = 0; let v = 0;
                    if (Input.keys['ArrowLeft'] || Input.keys['KeyA'] || Input.keys['a']) h = -1;
                    if (Input.keys['ArrowRight'] || Input.keys['KeyD'] || Input.keys['d']) h = 1;
                    if (Input.keys['ArrowUp'] || Input.keys['KeyW'] || Input.keys['w']) v = -1;
                    if (Input.keys['ArrowDown'] || Input.keys['KeyS'] || Input.keys['s']) v = 1;

                    const moveSpeed = this.max_speed || 4;
                    if (h !== 0 || v !== 0) {
                        // In first/third person, movement is relative to yaw. In top-down/isometric, it's fixed.
                        const useYaw = (camMode === 'first_person' || camMode === 'third_person');
                        const moveAngle = (useYaw ? (window.yaw || 0) : 0) + Math.atan2(h, -v);

                        this.dx = Math.sin(moveAngle) * moveSpeed;
                        this.dy = Math.cos(moveAngle) * moveSpeed;

                        // Update facing for 3D sprites
                        if (h !== 0) this.facing = Math.sign(h);
                    } else {
                        this.dx = 0;
                        this.dy = 0;
                    }

                    // Reset GML speed to prevent persistent velocity from GML scripts
                    this.speed = 0;
                    this.hspeed = 0;
                    this.vspeed = 0;

                    const currentInput = this.playerIndex === 1 ? window.P2_Input : window.P1_Input;

                    // 3D Jumping (Space / Z)
                    const canJump = this.z <= 0.01;
                    if ((currentInput.keysPressed['Space'] || currentInput.keysPressed['KeyZ'] || currentInput.keysPressed['z'] || currentInput.keysPressed[' ']) && canJump) {
                        this.dz = 0.5;
                        this.triggerEvent('keypress_Space');
                        this.triggerEvent('keypress_32');
                    }

                    this.z += this.dz;
                    if (this.z > 0.01) {
                        this.dz -= 0.025; // 3D gravity
                        this.grounded = false;
                        this.isJumping = true;
                    } else {
                        this.z = 0;
                        this.dz = 0;
                        this.grounded = true;
                        this.isJumping = false;
                    }

                    // 3D Attacking (X / Mouse Left)
                    if (currentInput.keysPressed['KeyX'] || currentInput.keysPressed['x'] || currentInput.mouse.leftPressed) {
                        this.triggerEvent('keypress_x');
                        this.triggerEvent('keypress_KeyX');
                        this.triggerEvent('mouse_left');
                    }
                }
            }

            if (this.invincible > 0) this.invincible--;

            for(let i=0; i<this.alarms.length; i++) {
                if (this.alarms[i] > 0) {
                    this.alarms[i]--;
                    if (this.alarms[i] === 0) {
                        this.triggerEvent('alarm', i);
                    }
                }
            }

            // --- GMX KEYBOARD EVENTS ---
            // Trigger events for all active keys (both numeric and named)
            // We normalize them to names to avoid calling the same event twice
            const currentInput = this.playerIndex === 1 ? window.P2_Input : window.P1_Input;
            const activeKeys = new Set();
            for (let k in currentInput.keys) {
                if (currentInput.keys[k]) {
                    const name = typeof k === 'number' || !isNaN(Number(k)) ? mapGMKey(Number(k)) : k;
                    if (name) activeKeys.add(name);
                }
            }
            activeKeys.forEach(name => this.triggerEvent('keyboard', name));

            const pressedKeys = new Set();
            for (let k in currentInput.keysPressed) {
                if (currentInput.keysPressed[k]) {
                    const name = typeof k === 'number' || !isNaN(Number(k)) ? mapGMKey(Number(k)) : k;
                    if (name) pressedKeys.add(name);
                }
            }
            pressedKeys.forEach(name => this.triggerEvent('keypress', name));

            const releasedKeys = new Set();
            for (let k in currentInput.keysReleased) {
                if (currentInput.keysReleased[k]) {
                    const name = typeof k === 'number' || !isNaN(Number(k)) ? mapGMKey(Number(k)) : k;
                    if (name) releasedKeys.add(name);
                }
            }
            releasedKeys.forEach(name => this.triggerEvent('keyrelease', name));

            // Apply gravity along gravity_direction (GML: 270=down)
            const gAmt = this.gravity || 0;
            if (gAmt !== 0 && !is3DPlayer) {
                const gRad = this.gravity_direction * Math.PI / 180;
                this.dx += gAmt * Math.cos(gRad);
                this.dy -= gAmt * Math.sin(gRad);
            }

            // Apply friction (GML: subtracted from speed each step, not multiplied)
            if (this.friction !== 0 && !is3DPlayer) {
                const spd = Math.hypot(this.dx, this.dy);
                if (spd > 0) {
                    const newSpd = Math.max(0, spd - this.friction);
                    const ratio = newSpd / spd;
                    this.dx *= ratio;
                    this.dy *= ratio;
                }
            }

            if (Math.abs(this.dx) > 0 || Math.abs(this.dy) > 0) {
                if (Math.abs(this.dx) < 0.05) this.dx = 0;
                if (Math.abs(this.dy) < 0.05) this.dy = 0;
                this.move(map, cols);
            }

            // Sync dx/dy back to GML aliases after movement
            this.hspeed = this.dx;
            this.vspeed = this.dy;
            this.speed  = Math.hypot(this.dx, this.dy);
            if (this.dx !== 0 || this.dy !== 0) {
                this.direction = (Math.atan2(-this.dy, this.dx) * 180 / Math.PI + 360) % 360;
            }
            // Sync back images/sprites if GML code changed them
            if (this.sprite_index !== this.currentSpriteId) {
                this.currentSpriteId = this.sprite_index;
                this.resolveSize();
            }
            this.frame = this.image_index;

            this.updateAnimation();
            this.triggerEvent('step_end');
        }

        updateAnimation() {
            let img = null;
            if (this.currentSpriteId) img = assets[this.currentSpriteId];
            if (!img || !img.complete || img.naturalWidth === 0) return;

            const meta = SPRITE_METADATA[this.currentSpriteId];
            let numFrames = 1;

            if (meta && meta.fw && meta.fh) {
                numFrames = Math.floor(img.width / meta.fw);
            } else {
                numFrames = Math.floor(img.width / img.height);
            }

            if (numFrames > 1) {
                // Update frame based on image_speed (GML behavior)
                this.frame += (this.animSpeed * this.image_speed);
                if (this.frame >= numFrames) this.frame = 0;
                if (this.frame < 0) this.frame = numFrames - 0.01;
            } else {
                this.frame = 0;
            }
            this.image_index = this.frame;
        }

        move(map, cols) {
            this.grounded = false;

            // Room boundaries
            const sw = (window.currentRoom && window.currentRoom.settings && window.currentRoom.settings.snapX) || 16;
            const sh = (window.currentRoom && window.currentRoom.settings && window.currentRoom.settings.snapY) || 16;
            const rw = (window.currentRoom && window.currentRoom.width * sw) || 10000;
            const rh = (window.currentRoom && window.currentRoom.height * sh) || 10000;

            // Horizontal movement
            if (this.dx !== 0) {
                this.x += this.dx;

                // Boundary check
                if (this.x < 0) { this.x = 0; this.dx = 0; }
                if (this.x + this.w > rw) { this.x = rw - this.w; this.dx = 0; }

                if (this.checkCol(map, cols)) {
                    const sign = Math.sign(this.dx);
                    this.x = Math.round(this.x);
                    while (this.checkCol(map, cols)) this.x -= sign;
                    this.dx = 0;
                }
            }

            // Vertical movement
            if (this.dy !== 0) {
                this.y += this.dy;

                // Boundary check
                if (this.y < 0) { this.y = 0; this.dy = 0; }
                if (this.y + this.h > rh) { this.y = rh - this.h; this.dy = 0; }

                if (this.checkCol(map, cols)) {
                    const sign = Math.sign(this.dy);
                    this.y = Math.round(this.y);
                    while (this.checkCol(map, cols)) this.y -= sign;

                    // In 3D mode, vertical movement (Y in 2D) is horizontal (Z in 3D).
                    // So hitting a "solid" tile shouldn't set grounded=true.
                    const is3D = window.currentRoom && window.currentRoom.viewMode === '3d';
                    if (this.dy > 0 && !is3D) {
                        this.grounded = true;
                        this.inAir = false;
                    }
                    this.dy = 0;
                } else {
                    const is3D = window.currentRoom && window.currentRoom.viewMode === '3d';
                    if (!is3D) this.inAir = true;
                }
            }

            // Robust Grounded Check: Check if standing on solid ground or instance 1 pixel down
            const is3D = window.currentRoom && window.currentRoom.viewMode === '3d';
            if (!is3D) {
                this.y += 1;
                if (this.checkCol(map, cols)) {
                    this.grounded = true;
                    this.inAir = false;
                }
                this.y -= 1;
            }
        }

        checkCol(map, cols) {
            // In 3D mode, if we are jumping high enough, ignore 2D tile collisions
            if (window.currentRoom && window.currentRoom.viewMode === '3d' && this.z > 0.5) {
                return false;
            }

            // Use the current room's snap size for tile-space conversion.
            const sw = (currentRoom && currentRoom.settings && currentRoom.settings.snapX) || 16;
            const sh = (currentRoom && currentRoom.settings && currentRoom.settings.snapY) || 16;
            const margin = 1;

            // 1. Check tile map collision (tile value 1 = solid)
            const left   = Math.floor((this.x + margin) / sw);
            const right  = Math.floor((this.x + this.w - margin - 1) / sw);
            const top    = Math.floor((this.y + margin) / sh);
            const bottom = Math.floor((this.y + this.h - 1) / sh);

            const getTile = (c, r) => {
                if (c < 0 || c >= cols || r < 0 || r >= map.length / cols) return 0;
                return map[r * cols + c];
            };
            if (getTile(left, top) === 1 || getTile(right, top) === 1 ||
                getTile(left, bottom) === 1 || getTile(right, bottom) === 1) return true;

            // 2. Check collision against solid GMObject instances (key for GMX games)
            if (window.instances) {
                for (const other of window.instances) {
                    if (other === this || other.dead || !other.solid) continue;
                    if (this.x < other.x + other.w && this.x + this.w > other.x &&
                        this.y < other.y + other.h && this.y + this.h > other.y) {
                        return true;
                    }
                }
            }
            return false;
        }
    }

    // --- GAME STATE ---
    window.instances = [];
    window.score = 0;
    // --- GML COMPATIBILITY LAYER ---
    window.NOR_GLOBAL = {};
    window.__gml_array_get = (arr, i) => Array.isArray(arr) ? arr[i] : 0;
    window.__gml_array_set = (arr, i, val) => { if(Array.isArray(arr)) arr[i] = val; };
    window.current_time = Date.now();
    window.room_first = 0;
    window.room_last = (GAME_DATA.rooms ? GAME_DATA.rooms.length - 1 : 0);

    window.lives = 3;
    window.achievements = [];
    window.CONSTANTS = { GRAVITY: 0 }; // gravity is 0 by default; each object sets its own via this.gravity
    window.hudVisible = false;
    window.isPaused = false;

    window.room_create = (objIdOrName, x, y) => {
        const def = window.GAME_DATA.objects.find(o => o.id === objIdOrName || o.name === objIdOrName);
        if (def) {
            const inst = new GMObject(x, y, def);
            window.instances.push(inst);
            inst._created = true;
            inst.triggerEvent('create');
            return inst;
        }
        return null;
    };

    let transition = { active: false, alpha: 0, state: 'out', targetRoom: null, type: 'fade', color: '#000', duration: 500 };

    function resetGame() {
        window.score = 0;
    // --- GML COMPATIBILITY LAYER ---
    window.NOR_GLOBAL = {};
    window.__gml_array_get = (arr, i) => Array.isArray(arr) ? arr[i] : 0;
    window.__gml_array_set = (arr, i, val) => { if(Array.isArray(arr)) arr[i] = val; };
    window.current_time = Date.now();
    window.room_first = 0;
    window.room_last = (GAME_DATA.rooms ? GAME_DATA.rooms.length - 1 : 0);

        const firstRoom = window.GAME_DATA.rooms && window.GAME_DATA.rooms[0];
        window.lives = (firstRoom && firstRoom.settings && firstRoom.settings.lives !== undefined) ? firstRoom.settings.lives : 3;
        window.achievements = [];
        window.hudVisible = false;
        window.isGameOver = false;
        window.particles = [];
        window.ui = { dialog: { active: false, text: '', speaker: '' } };
        window.shake = 0;
        window.shakeTime = 0;
        window.inventory = [];
        window.roomStartState = null;
        canvas.focus();
        loadRoom(window.GAME_DATA.startRoom, true); // initial load skips transition logic
    }
    window.resetGame = resetGame;

    function restartRoom() {
        if (currentRoom) {
            if (window.roomStartState && window.roomStartState.roomId === currentRoom.id) {
                window.score = window.roomStartState.score;
                window.inventory = [...window.roomStartState.inventory];
            } else {
                window.score = 0;
    // --- GML COMPATIBILITY LAYER ---
    window.NOR_GLOBAL = {};
    window.__gml_array_get = (arr, i) => Array.isArray(arr) ? arr[i] : 0;
    window.__gml_array_set = (arr, i, val) => { if(Array.isArray(arr)) arr[i] = val; };
    window.current_time = Date.now();
    window.room_first = 0;
    window.room_last = (GAME_DATA.rooms ? GAME_DATA.rooms.length - 1 : 0);

            }
            window.lives = (currentRoom.settings && currentRoom.settings.lives !== undefined) ? currentRoom.settings.lives : 3;
            window.isGameOver = false;
            window.particles = [];
            window.ui = { dialog: { active: false, text: '', speaker: '' } };
            window.shake = 0;
            window.shakeTime = 0;
            loadRoom(currentRoom.id);
        } else {
            resetGame();
        }
    }
    window.restartRoom = restartRoom;

    function init() {
        console.log("NOR ENGINE: init() called");
        Input.init();
        GM82Audio.init();

        // Handle global inputs for menus
        window.addEventListener('keydown', e => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                window.isPaused = !window.isPaused;
                if (window.GAME_DATA.uiMenus) {
                    const pauseMenu = window.GAME_DATA.uiMenus.find(m => m.id === 'menu_pause');
                    if (pauseMenu) pauseMenu.visible = window.isPaused;
                }
            }
            if (e.key === 'F11' || (e.key === 'Enter' && e.altKey)) {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.error("Failed to enter fullscreen:", err);
                    });
                } else {
                    document.exitFullscreen();
                }
            }
        });

        const allAssets = [];
        try {
            if (window.GAME_DATA && window.GAME_DATA.assets) {
                if (window.GAME_DATA.assets.sprites) window.GAME_DATA.assets.sprites.forEach(s => { if(s && s.src) allAssets.push({ id: s.id, src: s.src, type: 'img' }); });
                if (window.GAME_DATA.assets.backgrounds) window.GAME_DATA.assets.backgrounds.forEach(b => { if(b && b.src) allAssets.push({ id: b.id, src: b.src, type: 'img' }); });
                if (window.GAME_DATA.assets.sounds) window.GAME_DATA.assets.sounds.forEach(s => { if(s && s.src) allAssets.push({ id: s.id, src: s.src, type: 'snd' }); });
            }
        } catch(e) {
            console.error("NOR ENGINE: Error mapping assets, continuing anyway.", e);
        }

        console.log("NOR ENGINE: Loading " + allAssets.length + " assets...");

        let loadedCount = 0;
        let startCalled = false;
        const checkStart = () => {
            if (startCalled) return;
            loadedCount++;
            if (loadedCount >= allAssets.length) {
                startCalled = true;
                start();
            }
        };

        // Safety timeout — if assets take too long, start anyway
        setTimeout(() => {
            if (!startCalled) {
                console.warn("NOR ENGINE: Asset loading timed out. Starting anyway...");
                startCalled = true;
                start();
            }
        }, 8000);

        if (allAssets.length === 0) { console.log("NOR ENGINE: No assets to load."); startCalled = true; start(); return; }

        allAssets.forEach(asset => {
            if (asset.type === 'snd') {
                GM82Audio.load(asset.id, asset.src).then(checkStart).catch(checkStart);
            } else {
                const img = new Image();
                img.onload = () => {
                    assets[asset.id] = img;
                    checkStart();
                };
                img.onerror = (e) => {
                    console.error("NOR ENGINE: Failed to load image: " + asset.id);
                    checkStart();
                };
                img.src = asset.src;
            }
        });
    }

    function loadRoom(roomId, immediate = false) {
        if (!immediate && transition.active && transition.state === 'out') return;

        const room = window.GAME_DATA.rooms.find(r => r.id === roomId);
        if (!room) return;

        if (!immediate && !transition.active) {
            const trans = room.settings.transition || window.GAME_DATA.defaultTransition || { type: 'fade', duration: 500, color: '#000000' };
            transition = {
                active: true,
                alpha: 0,
                state: 'out',
                targetRoom: roomId,
                type: trans.type || 'fade',
                color: trans.color || '#000',
                duration: trans.duration || 500
            };
            return;
        }

        if (immediate) transition.active = false;

        currentRoom = room;

        // Retain persistent instances across rooms
        const persistentInstances = window.instances ? window.instances.filter(i => i.persistent) : [];
        window.instances = [...persistentInstances];

        // Save state for restarts
        if (!window.roomStartState || window.roomStartState.roomId !== roomId) {
            window.roomStartState = {
                roomId: roomId,
                score: window.score || 0,
                inventory: [...(window.inventory || [])]
            };
        }

        const cols = room.width;
        // Use room-specific snap size for pixel placement of instances
        const snapW = (room.settings && room.settings.snapX) || 16;
        const snapH = (room.settings && room.settings.snapY) || 16;
        room.map.forEach((t, i) => {
            if (t > 1) {
                const tx = i % cols;
                const ty = Math.floor(i / cols);
                const x  = tx * snapW;
                const y  = ty * snapH;
                const objIndex = t - 2;
                const def = window.GAME_DATA.objects[objIndex];
                if (def) {
                    const inst = new GMObject(x, y, def);
                    window.instances.push(inst);
                }
            }
        });

        // If co-op multiplayer is enabled, automatically spawn Player 2
        if (window.coopEnabled) {
            let player1 = window.instances.find(inst => {
                const name = (inst.def.id || inst.def.name || "").toLowerCase();
                return name === 'obj_player' || name.includes('player') || name === 'obj_hero';
            });
            if (player1 && !window.instances.some(inst => inst !== player1 && ((inst.def.id || inst.def.name || "").toLowerCase().includes('player') || inst.playerIndex === 1))) {
                player1.playerIndex = 0;
                const player2 = new GMObject(player1.x + 32, player1.y, player1.def);
                player2.playerIndex = 1;
                player2.image_blend = 0x55FF55; // Distinguishing beautiful bright green tint!
                window.instances.push(player2);
                console.log("NOR ENGINE: Spawned P2 co-op clone at", player2.x, player2.y);
            }
        }

        // Trigger create events ONLY AFTER all objects are placed in instances array
        // (Solves GMX creation code calling instance_exists or collision checking locally)
        window.instances.forEach(inst => {
            if (!inst._created) {
                inst._created = true;
                inst.triggerEvent('create');
            }
        });

        // Execute room creation code (contains instance_create calls with exact pixel coords from GMX)
        if (room.settings && room.settings.creationCode) {
            try {
                const ccFn = new Function(room.settings.creationCode);
                ccFn.call(null);
            } catch(e) {
                console.warn('NOR ENGINE: Room creationCode error:', e.message);
            }
        }

        camera.x = 0; camera.y = 0;

        // --- 3D / 2.5D INIT ---
        const canvas3d = document.getElementById('canvas3d');
        if (room.viewMode === '3d') {
            canvas.style.display = 'block';
            canvas.style.background = 'transparent';
            canvas.style.boxShadow = 'none';
            canvas3d.style.display = 'block';
            init3DRenderer(room);
        } else {
            canvas.style.display = 'block';
            canvas.style.background = '#000';
            canvas.style.boxShadow = '0 0 50px rgba(0,0,0,0.8)';
            canvas3d.style.display = 'none';
        }
    }

    let renderer3d, scene3d, camera3d;
    window.threeTextures = {};
    window.getThreeTexture = function(spriteId) {
        if (window.threeTextures[spriteId]) return window.threeTextures[spriteId];
        const img = assets[spriteId];
        if (img && img.complete && img.naturalWidth > 0) {
            const tex = new THREE.Texture(img);
            tex.needsUpdate = true;
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            window.threeTextures[spriteId] = tex;
            return tex;
        }
        return null;
    };

    function init3DRenderer(room) {
        if (typeof THREE === 'undefined') {
            console.warn("NOR ENGINE: THREE.js not loaded yet. Retrying in 100ms...");
            setTimeout(() => init3DRenderer(room), 100);
            return;
        }

        if (renderer3d) {
            // Clear existing scene and mesh references
            if (scene3d) {
                while(scene3d.children.length > 0){
                    const child = scene3d.children[0];
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else child.material.dispose();
                    }
                    scene3d.remove(child);
                }
            }
            if (window.instances) {
                window.instances.forEach(inst => { inst._mesh = null; });
            }
        } else {
            try {
                renderer3d = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer3d.setSize(window.innerWidth, window.innerHeight);
                renderer3d.setPixelRatio(window.devicePixelRatio || 1);
                renderer3d.setClearColor(0x000000, 0);

                const container = document.getElementById('canvas3d');
                if (container) {
                    container.innerHTML = ''; // Clear any previous content
                    container.appendChild(renderer3d.domElement);
                }

                camera3d = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                scene3d = new THREE.Scene();

                window.addEventListener('resize', () => {
                    if (renderer3d && camera3d) {
                        renderer3d.setSize(window.innerWidth, window.innerHeight);
                        camera3d.aspect = window.innerWidth / window.innerHeight;
                        camera3d.updateProjectionMatrix();
                    }
                });

                // Reset orientation
                window.yaw = 0;
                window.pitch = 0;

                // Add mouse look controls
                document.addEventListener('mousemove', (e) => {
                    if (document.pointerLockElement === document.getElementById('canvas3d')) {
                        if (window.yaw === undefined) window.yaw = 0;
                        if (window.pitch === undefined) window.pitch = 0;
                        window.yaw -= e.movementX * 0.002;
                        window.pitch -= e.movementY * 0.002;
                        window.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, window.pitch));
                    }
                });
                const canvas3dEl = document.getElementById('canvas3d');
                if (canvas3dEl) {
                    canvas3dEl.addEventListener('click', () => {
                        const camMode = window.currentRoom && window.currentRoom.settings.cameraMode ? window.currentRoom.settings.cameraMode : (window.GAME_DATA.metadata.template === 'first_person' || window.GAME_DATA.metadata.template === 'vr' ? 'first_person' : 'third_person');
                        if (camMode === 'first_person' || camMode === 'third_person') {
                            canvas3dEl.requestPointerLock();
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to initialize 3D Renderer:", err);
                return;
            }
        }

        if (!scene3d) return;

        scene3d.background = new THREE.Color(room.settings.bgColor || 0x181818);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 7);
        scene3d.add(light);
        scene3d.add(new THREE.AmbientLight(0x808080));

        // Find ground sprite
        const sprites = (GAME_DATA && GAME_DATA.assets && GAME_DATA.assets.sprites) ? GAME_DATA.assets.sprites : [];
        let groundSprite = sprites.find(s => s.role === 'ground')
            || sprites.find(s => s.id === 'spr_ground' || s.name === 'spr_ground')
            || (sprites.length > 0 ? sprites[0] : null);
        let groundTex = groundSprite ? window.getThreeTexture(groundSprite.id) : null;

        // Populate 3D scene from room map
        const sw = 16;
        if (room.map) {
            room.map.forEach((t, i) => {
                if (t === 1) {
                    const tx = (i % room.width) - room.width/2;
                    const ty = -Math.floor(i / room.width) + room.height/2;
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    let material;
                    if (groundTex) {
                        material = new THREE.MeshLambertMaterial({ map: groundTex });
                    } else {
                        material = new THREE.MeshLambertMaterial({ color: 0x888888 });
                    }
                    const cube = new THREE.Mesh(geometry, material);
                    cube.position.set(tx, 0.5, ty);
                    scene3d.add(cube);
                }
            });
        }

        // Add floor
        const floorGeo = new THREE.PlaneGeometry(room.width || 32, room.height || 32);
        let floorMat;
        if (groundTex) {
            try {
                const floorTex = groundTex.clone();
                floorTex.wrapS = THREE.RepeatWrapping;
                floorTex.wrapT = THREE.RepeatWrapping;
                floorTex.repeat.set(room.width || 32, room.height || 32);
                floorTex.needsUpdate = true;
                floorMat = new THREE.MeshLambertMaterial({ map: floorTex });
            } catch (e) {
                floorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            }
        } else {
            floorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        }
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        scene3d.add(floor);

        if (camera3d) {
            camera3d.position.set(0, 10, 15);
            camera3d.lookAt(0, 0, 0);
        }
    }
    window.loadRoom = loadRoom;
    window.room_create = (objName, x, y) => {
        const def = window.GAME_DATA.objects.find(o => o.name === objName);
        if (def) {
            const inst = new GMObject(x, y, def);
            window.instances.push(inst);
            return inst;
        }
        return null;
    };

    function start() {
        console.log("NOR ENGINE: Starting game loop...");
        const loadingScreen = document.getElementById('loading');
        if (loadingScreen) loadingScreen.style.display = 'none';

        // Ensure loop is requested BEFORE resetGame logic takes over,
        // preventing infinite transitions caused by logic stall.
        loop();

        try {
            resetGame();
        } catch(e) {
            console.error("NOR ENGINE: Error in resetGame()", e);
        }
    }

    function drawBackgrounds(foreground) { ${bgRenderLogic} }

    function loop() {
        gameLoopId = requestAnimationFrame(loop);

        // Poll input
        Input.pollGamepad();

        // --- PAUSE/RESTART LOGIC ---
        if (Input.keys['p'] || Input.keys['P'] || Input.keys['Enter']) {
             if (!window.isPausedPressed) {
                 window.isPaused = !window.isPaused;
                 window.isPausedPressed = true;
                 if (GAME_DATA.uiMenus) {
                     const pauseMenu = GAME_DATA.uiMenus.find(m => m.id === 'menu_pause');
                     if (pauseMenu) pauseMenu.visible = window.isPaused;
                 }
             }
        } else {
             window.isPausedPressed = false;
        }

        if (window.isGameOver && (Input.keys['r'] || Input.keys['R'])) {
            restartRoom();
            window.isGameOver = false;
        }



        if (!currentRoom) {
            if (transition.active) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = "rgba(0,0,0," + transition.alpha + ")";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                if (transition.state === 'out') {
                    transition.alpha += 0.05;
                    if (transition.alpha >= 1) {
                        transition.state = 'in';
                        loadRoom(transition.targetRoom);
                    }
                } else {
                    transition.alpha -= 0.05;
                    if (transition.alpha <= 0) {
                        transition.active = false;
                    }
                }
            }
            return;
        }

        // --- VIEW LOGIC ---
        let vw = 256, vh = 240;
        let scale = 1;

        const cols = currentRoom.width;
        const rows = currentRoom.height;
        // Use room snap sizes for pixel dimensions
        const snapW = (currentRoom.settings && currentRoom.settings.snapX) || 16;
        const snapH = (currentRoom.settings && currentRoom.settings.snapY) || 16;
        const roomPxW = cols * snapW;
        const roomPxH = rows * snapH;

        const activeView = currentRoom.views && currentRoom.views.find(v => v.visible);
        const qMult = window.renderingScaleMultiplier || 1;
        if (activeView) {
            vw = activeView.viewW; vh = activeView.viewH;
            canvas.width = activeView.portW * qMult; canvas.height = activeView.portH * qMult;

            let targetX = camera.x; let targetY = camera.y;
            if (activeView.followObj) {
                const target = window.instances.find(i => i.def.name === activeView.followObj);
                if (target) {
                    targetX = target.x + (target.w / 2) - (vw / 2);
                    targetY = target.y + (target.h / 2) - (vh / 2);
                }
            }
            camera.x = Math.max(0, Math.min(targetX, roomPxW - vw));
            camera.y = Math.max(0, Math.min(targetY, roomPxH - vh));
            camera.w = vw; camera.h = vh;
            scale = (activeView.portW / vw) * qMult;
        } else {
            canvas.width  = roomPxW * qMult; canvas.height = roomPxH * qMult;
            camera.x = 0; camera.y = 0; camera.w = roomPxW; camera.h = roomPxH;
            scale = qMult;
        }
        window.currentScale = scale;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = !!window.imageSmoothing;
        if (window.shakeTime > 0) {
            ctx.translate((Math.random() - 0.5) * window.shake, (Math.random() - 0.5) * window.shake);
            window.shakeTime--;
        }
        if (currentRoom.viewMode === '3d') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = false;
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.scale(scale, scale);
        ctx.translate(-camera.x, -camera.y);

        if (currentRoom.viewMode !== '3d') {
            drawBackgrounds(false);
        }

        const startCol = Math.floor(camera.x / snapW);
        const endCol   = startCol + Math.ceil(vw / snapW) + 2;
        const startRow = Math.floor(camera.y / snapH);
        const endRow   = startRow + Math.ceil(vh / snapH) + 2;

        // Find ground sprite by role, fallback to first sprite
        let groundSprite = GAME_DATA.assets.sprites.find(s => s.role === 'ground')
            || GAME_DATA.assets.sprites.find(s => s.id === 'spr_ground' || s.name === 'spr_ground')
            || GAME_DATA.assets.sprites[0];
        const groundImg = groundSprite ? assets[groundSprite.id] : null;

        if (currentRoom.viewMode === '2.5d') {
            drawIsometricMap();
        } else if (currentRoom.viewMode !== '3d') {
            for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                    if (r < 0 || c < 0 || c >= cols || r >= rows) continue;
                    const t = currentRoom.map[r * cols + c];
                    if (t === 1) {
                        if (groundImg && groundImg.complete && groundImg.naturalWidth > 0) {
                            const gMeta = SPRITE_METADATA[groundSprite.id];
                            const gW = (gMeta && gMeta.fw) ? gMeta.fw : groundImg.height;
                            const gH = (gMeta && gMeta.fh) ? gMeta.fh : groundImg.height;
                            ctx.drawImage(groundImg, 0, 0, gW, gH, c*snapW, r*snapH, snapW, snapH);
                        } else {
                            ctx.fillStyle = '#654321';
                            ctx.fillRect(c*snapW, r*snapH, snapW, snapH);
                        }
                    }
                }
            }
        }

        function projectIso(x, y, z = 0) {
            const ISO_ANGLE = Math.PI / 6;
            return {
                x: (x - y) * Math.cos(ISO_ANGLE),
                y: (x + y) * Math.sin(ISO_ANGLE) - z
            };
        }

        function drawIsometricMap() {
            const sw = 16; const sh = 16;
            const offsetX = canvas.width / 2;
            const offsetY = 50;

            // Draw floor/tiles
            if (currentRoom.isoMap && currentRoom.isoMap.length > 0) {
                // Draw base grid
                for (let x = 0; x < currentRoom.width; x++) {
                    for (let y = 0; y < currentRoom.height; y++) {
                        const pos = projectIso(x * sw, y * sh);
                        drawIsoTile(pos.x + offsetX, pos.y + offsetY, sw, sh, '#444');
                    }
                }

                // Draw isoMap cells
                const sortedMap = [...currentRoom.isoMap].sort((a, b) => {
                    if (a.z !== b.z) return a.z - b.z;
                    if (a.y !== b.y) return a.y - b.y;
                    return a.x - b.x;
                });

                sortedMap.forEach(cell => {
                    const pos = projectIso(cell.x * sw, cell.y * sh, cell.z * sh);
                    drawVoxel(pos.x + offsetX, pos.y + offsetY, sw, sh, sh, '#b3c2e6', '#8c9cbf', '#6a799c');
                });
            } else {
                currentRoom.map.forEach((t, i) => {
                    const tx = i % cols;
                    const ty = Math.floor(i / cols);
                    const pos = projectIso(tx * sw, ty * sh);

                    if (t === 1) { // Wall/Solid - as Voxel
                        drawVoxel(pos.x + offsetX, pos.y + offsetY, sw, sh, sw, '#8b4513', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)');
                    } else { // Floor
                        drawIsoTile(pos.x + offsetX, pos.y + offsetY, sw, sh, '#444');
                    }
                });
            }

            // Draw objects in isometric
            window.instances.forEach(inst => {
                const pos = projectIso(inst.x, inst.y, inst.z || 0);
                const img = assets[inst.currentSpriteId];
                if (img) {
                    ctx.drawImage(img, pos.x + offsetX - inst.w/2, pos.y + offsetY - inst.h);
                }
            });
        }

        function drawIsoTile(x, y, w, h, col) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + h/2);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x - w, y + h/2);
            ctx.closePath();
            ctx.fillStyle = col;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.stroke();
        }

        function drawVoxel(x, y, w, h, z, topCol, leftCol, rightCol) {
            // Top Face
            ctx.fillStyle = topCol;
            drawIsoTile(x, y - z, w, h, topCol);

            // Left Face
            ctx.fillStyle = leftCol;
            ctx.beginPath();
            ctx.moveTo(x - w, y + h/2 - z);
            ctx.lineTo(x, y + h - z);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x - w, y + h/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Right Face
            ctx.fillStyle = rightCol;
            ctx.beginPath();
            ctx.moveTo(x + w, y + h/2 - z);
            ctx.lineTo(x, y + h - z);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x + w, y + h/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        if (!window.isPaused && !transition.active && !window.isGameOver) {
            window.instances.forEach(inst => {
                inst.update(currentRoom.map, cols);
            });

            // Rebuild Spatial Hash for collision detection
            const spatialHash = new SpatialHash(64);
            const instLen = window.instances.length;
            for (let i = 0; i < instLen; i++) {
                spatialHash.insert(window.instances[i]);
            }

            // Collision detection O(N) using Spatial Hash
            const checkedPairs = new Set();
            for (let i = 0; i < instLen; i++) {
                const a = window.instances[i];
                if (a.dead) continue;
                const potentials = spatialHash.getPotentials(a.x, a.y, a.w, a.h);

                potentials.forEach(b => {
                    if (a === b || b.dead) return;
                    // Generate unique pair ID to avoid double-checking
                    const pairId = a.instance_id < b.instance_id ? (a.instance_id + '-' + b.instance_id) : (b.instance_id + '-' + a.instance_id);
                    if (checkedPairs.has(pairId)) return;
                    checkedPairs.add(pairId);

                    // Custom AABB collision using bbox bounds
                    if (a.bbox_left <= b.bbox_right && a.bbox_right >= b.bbox_left && a.bbox_top <= b.bbox_bottom && a.bbox_bottom >= b.bbox_top) {
                        a.triggerEvent('collision_' + b.def.id, b);
                        b.triggerEvent('collision_' + a.def.id, a);
                    }
                });
            }

            // --- PLAYER DEATH LOGIC ---
            const playerBefore = window.instances.find(i => i.def.name.toLowerCase().includes('player') || (activeView && i.def.name === activeView.followObj));

            if (playerBefore && playerBefore.health !== undefined && playerBefore.health <= 0) {
                playerBefore.dead = true;
            }

            const playerDied = playerBefore && playerBefore.dead;

            window.instances.forEach(i => {
                if (i.dead && i._mesh && scene3d) {
                    scene3d.remove(i._mesh);
                    if (i._mesh.geometry) i._mesh.geometry.dispose();
                    if (i._mesh.material) {
                        if (Array.isArray(i._mesh.material)) i._mesh.material.forEach(m => m.dispose());
                        else i._mesh.material.dispose();
                    }
                    i._mesh = null;
                }
            });
            window.instances = window.instances.filter(i => !i.dead);

            const playerAfter = window.instances.find(i => i.def.name.toLowerCase().includes('player') || (activeView && i.def.name === activeView.followObj));
            if (playerAfter) {
                window.hudVisible = true;
            }

            if (playerDied) {
                window.lives -= 1;
                if (window.lives > 0) {
                    loadRoom(currentRoom.id);
                } else {
                    window.isGameOver = true;
                    if (window.GAME_DATA.uiMenus) {
                        const loseMenu = window.GAME_DATA.uiMenus.find(m => m.id === 'menu_lose');
                        if (loseMenu) loseMenu.visible = true;
                    }
                }
            }

            // Achievement check
            if (window.score >= 100 && !window.achievements.includes('score_100')) {
                window.achievements.push('score_100');
                console.log("Achievement unlocked: Score 100!");
            }
        }

        // Depth sorting (higher depth = drawn first/underneath)
        window.instances.sort((a,b) => b.depth - a.depth);

        if (currentRoom.viewMode !== '3d') {
            window.instances.forEach(inst => {
                inst.draw(ctx);
            });
        }

        // Particles
        if (window.particles) {
            window.particles.forEach((p, i) => {
                p.x += p.dx;
                p.y += p.dy;
                p.life--;
                if (p.life <= 0) {
                    window.particles.splice(i, 1);
                    return;
                }
                ctx.fillStyle = p.col;
                ctx.fillRect(p.x - (activeView ? activeView.viewX : 0), p.y - (activeView ? activeView.viewY : 0), 2, 2);
            });
        }

        if (currentRoom.viewMode !== '3d') {
            drawBackgrounds(true);
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        if (window.isPaused) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const hasPauseMenu = window.GAME_DATA.uiMenus && window.GAME_DATA.uiMenus.some(m => m.id === 'menu_pause' && m.visible);
            if (!hasPauseMenu) {
                const pw = 160, ph = 80;
                const px = canvas.width/2 - pw/2, py = canvas.height/2 - ph/2;
                window.norDrawRetroPanel(ctx, px, py, pw, ph, '#2d3748', 'raised');
                ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                window.norDrawRetroText(ctx, window.language === 'ar' ? "توقف مؤقت" : "PAUSED", canvas.width/2, canvas.height/2 - 10, '#ffffff');
                ctx.font = '8px "Press Start 2P"';
                window.norDrawRetroText(ctx, window.language === 'ar' ? "اضغط P للاستئناف" : "Press P to Resume", canvas.width/2, canvas.height/2 + 20, '#a0aec0');
            }
        }

        // Dialog Box
        if (window.ui && window.ui.dialog && window.ui.dialog.active) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            window.norDrawRetroPanel(ctx, 10, canvas.height - 60, canvas.width - 20, 50, '#1a202c', 'raised');

            ctx.font = '8px "Press Start 2P"';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            window.norDrawRetroText(ctx, window.ui.dialog.speaker + ":", 20, canvas.height - 52, '#f6e05e');

            ctx.font = '7px "Press Start 2P"';
            window.norDrawRetroText(ctx, window.ui.dialog.text, 20, canvas.height - 38, '#ffffff');

            ctx.font = '6px "Press Start 2P"';
            ctx.textAlign = 'right';
            window.norDrawRetroText(ctx, window.language === 'ar' ? "اضغط Z للمتابعة" : "Press Z to continue", canvas.width - 20, canvas.height - 22, '#a0aec0');

            if (Input.keys['z']) {
                window.ui.dialog.active = false;
                window.isPaused = false;
                Input.keys['z'] = false; // Consume key
            }
        }

        if (window.isGameOver) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const gw = 220, gh = 120;
            const gx = canvas.width/2 - gw/2, gy = canvas.height/2 - gh/2;
            window.norDrawRetroPanel(ctx, gx, gy, gw, gh, '#742a2a', 'raised');

            ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            window.norDrawRetroText(ctx, "GAME OVER", canvas.width/2, canvas.height/2 - 30, '#fc8181');

            ctx.font = '8px "Press Start 2P"';
            window.norDrawRetroText(ctx, "FINAL SCORE: " + window.score, canvas.width/2, canvas.height/2 - 5, '#f6e05e');

            if (window.achievements && window.achievements.length > 0) {
                window.norDrawRetroText(ctx, "ACHIEVEMENTS: " + window.achievements.length, canvas.width/2, canvas.height/2 + 10, '#68d391');
            }

            ctx.font = '7px "Press Start 2P"';
            window.norDrawRetroText(ctx, window.language === 'ar' ? "اضغط R لإعادة المحاولة" : "Press R to Retry", canvas.width/2, canvas.height/2 + 35, '#e2e8f0');
        }

        if (transition.active) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            const p = transition.alpha;
            const w = canvas.width;
            const h = canvas.height;
            ctx.fillStyle = transition.color || '#000';

            ctx.save();
            switch(transition.type) {
                case 'fade':
                    ctx.globalAlpha = p;
                    ctx.fillRect(0, 0, w, h);
                    break;
                case 'circle_wipe':
                case 'mario_iris':
                    ctx.beginPath();
                    const radius = (w + h) * (transition.type === 'mario_iris' ? Math.pow(p, 0.8) : p);
                    ctx.arc(w/2, h/2, radius, 0, Math.PI*2);
                    ctx.fill();
                    break;
                case 'gm8_create_center':
                    ctx.translate(w/2, h/2);
                    ctx.scale(p, p);
                    ctx.fillRect(-w/2, -h/2, w, h);
                    break;
                case 'gm8_create_left':
                    ctx.fillRect(0, 0, w*p, h);
                    break;
                case 'gm8_create_right':
                    ctx.fillRect(w - w*p, 0, w*p, h);
                    break;
                case 'gm8_create_top':
                    ctx.fillRect(0, 0, w, h*p);
                    break;
                case 'gm8_create_bottom':
                    ctx.fillRect(0, h - h*p, w, h*p);
                    break;
                case 'gm8_interlace_h':
                case 'scanline':
                    const lineH = h/20;
                    for(let i=0; i<20; i++) {
                        const dir = i%2===0 ? 1 : -1;
                        const offset = dir === 1 ? (w * (1-p)) : (-w * (1-p));
                        ctx.fillRect(offset, i*lineH, w, lineH);
                    }
                    break;
                case 'gm8_interlace_v':
                    const lineW = w/20;
                    for(let i=0; i<20; i++) {
                        const dir = i%2===0 ? 1 : -1;
                        const offset = dir === 1 ? (h * (1-p)) : (-h * (1-p));
                        ctx.fillRect(i*lineW, offset, lineW, h);
                    }
                    break;
                case 'gm8_push_left':
                case 'slide_left':
                case 'megaman_slide':
                    ctx.fillRect(w - w*p, 0, w, h);
                    break;
                case 'gm8_push_right':
                case 'slide_right':
                    ctx.fillRect(w*p - w, 0, w, h);
                    break;
                case 'gm8_push_top':
                case 'slide_up':
                    ctx.fillRect(0, h - h*p, w, h);
                    break;
                case 'gm8_push_bottom':
                case 'slide_down':
                    ctx.fillRect(0, h*p - h, w, h);
                    break;
                case 'gm8_rotate_left':
                    ctx.translate(w/2, h/2);
                    ctx.rotate(-Math.PI * (1-p));
                    ctx.scale(p, p);
                    ctx.fillRect(-w/2, -h/2, w, h);
                    break;
                case 'gm8_rotate_right':
                    ctx.translate(w/2, h/2);
                    ctx.rotate(Math.PI * (1-p));
                    ctx.scale(p, p);
                    ctx.fillRect(-w/2, -h/2, w, h);
                    break;
                case 'pokemon_battle':
                    if (p < 0.5) {
                        ctx.fillStyle = (Math.floor(p * 20) % 2 === 0) ? '#FFF' : 'transparent';
                        ctx.fillRect(0, 0, w, h);
                    } else {
                        ctx.globalAlpha = (p - 0.5) * 2;
                        ctx.fillRect(0, 0, w, h);
                    }
                    break;
                case 'ff_swirl':
                    ctx.translate(w/2, h/2);
                    ctx.rotate(p * Math.PI * 8);
                    ctx.scale(p * 2, p * 2);
                    ctx.fillRect(-w/2, -h/2, w, h);
                    break;
                case 'zelda_fade':
                    ctx.globalAlpha = Math.pow(p, 1.5);
                    ctx.fillRect(0, 0, w, h);
                    break;
                case 'diamond_wipe':
                    ctx.beginPath();
                    const s = (w+h)*p;
                    ctx.moveTo(w/2, h/2 - s);
                    ctx.lineTo(w/2 + s, h/2);
                    ctx.lineTo(w/2, h/2 + s);
                    ctx.lineTo(w/2 - s, h/2);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'curtain':
                    ctx.fillRect(0, 0, (w/2)*p, h);
                    ctx.fillRect(w - (w/2)*p, 0, (w/2)*p, h);
                    break;
                case 'shutter':
                    ctx.fillRect(0, 0, w, (h/2)*p);
                    ctx.fillRect(0, h - (h/2)*p, w, (h/2)*p);
                    break;
                case 'pixelate':
                    ctx.globalAlpha = p;
                    ctx.fillRect(0, 0, w, h);
                    const blockSize = 16 * (1-p + 0.1);
                    for(let x=0; x<w; x+=blockSize) {
                        for(let y=0; y<h; y+=blockSize) {
                            if (Math.random() < p) ctx.fillRect(x, y, blockSize, blockSize);
                        }
                    }
                    break;
                case 'grid_wipe':
                    const rows = 4; const cols = 4;
                    const rw = w/cols; const rh = h/rows;
                    for(let i=0; i<rows*cols; i++) {
                        const r = Math.floor(i/cols); const c = i%cols;
                        const progress = Math.max(0, Math.min(1, p * 2 - (i/(rows*cols))));
                        ctx.fillRect(c*rw + rw/2 - (rw/2)*progress, r*rh + rh/2 - (rh/2)*progress, rw*progress, rh*progress);
                    }
                    break;
                case 'checkerboard':
                    const cbSize = 32;
                    for(let x=0; x<w; x+=cbSize) {
                        for(let y=0; y<h; y+=cbSize) {
                            const delay = (x+y)/(w+h);
                            const progress = Math.max(0, Math.min(1, p * 1.5 - delay));
                            ctx.fillRect(x + cbSize/2 - (cbSize/2)*progress, y + cbSize/2 - (cbSize/2)*progress, cbSize*progress, cbSize*progress);
                        }
                    }
                    break;
                case 'tv_off':
                    const tvH = Math.max(2, h * (1-p));
                    const tvW = w * Math.max(0, 1 - p*2);
                    if (p < 0.5) ctx.fillRect(0, 0, w, (h-tvH)/2), ctx.fillRect(0, (h+tvH)/2, w, (h-tvH)/2);
                    else ctx.fillRect(0, 0, w, h);
                    break;
                case 'diagonal_wipe':
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(w*p*2, 0);
                    ctx.lineTo(0, h*p*2);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'mosaic':
                    const mSize = 16;
                    for(let x=0; x<w; x+=mSize) {
                        for(let y=0; y<h; y+=mSize) {
                            if (Math.random() < p) ctx.fillRect(x, y, mSize, mSize);
                        }
                    }
                    break;
                case 'noise':
                    ctx.globalAlpha = p;
                    for(let i=0; i<1000 * p; i++) {
                        ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
                    }
                    break;
                case 'heart_wipe':
                    // Simple heart shape approximation
                    ctx.beginPath();
                    const hr = (w+h)*p;
                    ctx.arc(w/2 - hr/4, h/2 - hr/4, hr/4, Math.PI, 0);
                    ctx.arc(w/2 + hr/4, h/2 - hr/4, hr/4, Math.PI, 0);
                    ctx.lineTo(w/2, h/2 + hr/2);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'star_wipe':
                    ctx.beginPath();
                    const sr = (w+h)*p;
                    for(let i=0; i<5; i++) {
                        ctx.lineTo(w/2 + Math.cos((18+i*72)*Math.PI/180)*sr, h/2 - Math.sin((18+i*72)*Math.PI/180)*sr);
                        ctx.lineTo(w/2 + Math.cos((54+i*72)*Math.PI/180)*sr/2, h/2 - Math.sin((54+i*72)*Math.PI/180)*sr/2);
                    }
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'wave':
                    for(let y=0; y<h; y+=4) {
                        const off = Math.sin(y/20 + p*10) * 20 * p;
                        ctx.fillRect(0, y, w*p + off, 4);
                    }
                    break;
                default:
                    ctx.globalAlpha = p;
                    ctx.fillRect(0, 0, w, h);
            }
            ctx.restore();
            ctx.globalAlpha = 1;

            const step = 1000 / (60 * transition.duration);
            if (transition.state === 'out') {
                transition.alpha += step;
                if (transition.alpha >= 1) {
                    transition.alpha = 1;
                    transition.state = 'in';
                    loadRoom(transition.targetRoom);
                }
            } else {
                transition.alpha -= step;
                if (transition.alpha <= 0) {
                    transition.alpha = 0;
                    transition.active = false;
                }
            }
        }

        if (currentRoom.viewMode === '3d' && renderer3d && scene3d && camera3d) {
            try {
                const snapW = (currentRoom.settings && currentRoom.settings.snapX) || 16;
                const snapH = (currentRoom.settings && currentRoom.settings.snapY) || 16;

                window.instances.forEach(inst => {
                    if (!inst._mesh) {
                        let tex = inst.currentSpriteId ? window.getThreeTexture(inst.currentSpriteId) : null;
                        if (tex) {
                            // Clone texture so each instance can have its own frame offset
                            const instTex = tex.clone();
                            instTex.needsUpdate = true;
                            const material = new THREE.SpriteMaterial({ map: instTex, color: 0xffffff, transparent: true, alphaTest: 0.5 });
                            inst._mesh = new THREE.Sprite(material);
                            // Scale sprite based on image size relative to snap size
                            const img = assets[inst.currentSpriteId];
                            const meta = SPRITE_METADATA[inst.currentSpriteId];
                            if (img) {
                                const fw = meta?.fw || img.width;
                                const fh = meta?.fh || img.height;
                                inst._mesh.scale.set(fw / snapW, fh / snapH, 1);

                                // Set initial frame
                                const numFrames = Math.floor(img.width / fw);
                                instTex.repeat.set(1 / numFrames, 1);
                                instTex.offset.set((Math.floor(inst.image_index) % numFrames) / numFrames, 0);
                            }
                        } else {
                            const geometry = new THREE.BoxGeometry(1, 1, 1);
                            const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
                            inst._mesh = new THREE.Mesh(geometry, material);
                        }
                        scene3d.add(inst._mesh);
                    } else if (inst._mesh.isSprite && inst.currentSpriteId) {
                        const img = assets[inst.currentSpriteId];
                        const meta = SPRITE_METADATA[inst.currentSpriteId];
                        if (img) {
                            const fw = meta?.fw || img.width;
                            const fh = meta?.fh || img.height;
                            const numFrames = Math.floor(img.width / fw);
                            const instTex = inst._mesh.material.map;

                            // Update frame offset
                            instTex.repeat.set(1 / numFrames, 1);
                            instTex.offset.set((Math.floor(inst.image_index) % numFrames) / numFrames, 0);

                            // Update scale if sprite changed
                            if (inst._lastSpriteId !== inst.currentSpriteId) {
                                inst._mesh.scale.set(fw / snapW, fh / snapH, 1);
                                inst._lastSpriteId = inst.currentSpriteId;

                                // If sprite changed, we might need to reload the base texture image
                                let baseTex = window.getThreeTexture(inst.currentSpriteId);
                                if (baseTex) {
                                    instTex.image = baseTex.image;
                                    instTex.needsUpdate = true;
                                }
                            }
                        }
                    }
                    const tx = (inst.x / snapW) - currentRoom.width/2;
                    const ty = -(inst.y / snapH) + currentRoom.height/2;

                    // If it's a sprite, offset Y so it stands on the ground + its vertical z
                    if (inst._mesh.isSprite) {
                        inst._mesh.position.set(tx, (inst._mesh.scale.y / 2) + (inst.z || 0), ty);
                    } else {
                        inst._mesh.position.set(tx, 0.5 + (inst.z || 0), ty);
                    }
                });

                const player = window.instances.find(i => i.def.name.toLowerCase().includes('player') || (activeView && i.def.name === activeView.followObj));
                if (player) {
                    const tx = (player.x / snapW) - currentRoom.width/2;
                    const ty = -(player.y / snapH) + currentRoom.height/2;

                    const camMode = currentRoom.settings.cameraMode || (window.GAME_DATA.metadata.template === 'first_person' || window.GAME_DATA.metadata.template === 'vr' ? 'first_person' : 'third_person');

                    if (camMode === 'first_person') {
                        camera3d.position.x = tx;
                        camera3d.position.z = ty;
                        camera3d.position.y = 0.5 + (player.z || 0);

                        // Simple mouse look
                        if (window.yaw === undefined) window.yaw = 0;
                        if (window.pitch === undefined) window.pitch = 0;

                        const targetX = tx - Math.sin(window.yaw) * Math.cos(window.pitch);
                        const targetY = 0.5 + (player.z || 0) + Math.sin(window.pitch);
                        const targetZ = ty - Math.cos(window.yaw) * Math.cos(window.pitch);
                        camera3d.lookAt(targetX, targetY, targetZ);

                        // Hide player mesh in first person
                        if (player._mesh) player._mesh.visible = false;
                    } else if (camMode === 'third_person') {
                        camera3d.position.x = tx;
                        camera3d.position.z = ty + 5;
                        camera3d.position.y = 3;
                        camera3d.lookAt(tx, 0.5, ty);
                        if (player._mesh) player._mesh.visible = true;
                    } else if (camMode === 'top_down') {
                        camera3d.position.x = tx;
                        camera3d.position.z = ty + 0.1; // slight offset to avoid gimbal lock
                        camera3d.position.y = 10;
                        camera3d.lookAt(tx, 0, ty);
                        if (player._mesh) player._mesh.visible = true;
                    } else if (camMode === 'isometric') {
                        camera3d.position.x = tx - 10;
                        camera3d.position.z = ty + 10;
                        camera3d.position.y = 10;
                        camera3d.lookAt(tx, 0, ty);
                        if (player._mesh) player._mesh.visible = true;
                    }
                }

                renderer3d.render(scene3d, camera3d);
            } catch (e) {
                console.error("NOR ENGINE: 3D Render Error:", e);
            }
        }

        // Render UI
        function renderUI() {
            if (!window.GAME_DATA.uiMenus) return;
            const qMult = window.renderingScaleMultiplier || 1;
            const logicalScale = (window.currentScale || 1) / qMult;
            const mx = Input.mouse.x / logicalScale;
            const my = Input.mouse.y / logicalScale;
            const mdown = Input.mouse.left;

            window.GAME_DATA.uiMenus.forEach(menu => {
                if (!menu.visible) return;
                menu.elements.forEach(el => {
                    if (!el.visible) return;
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.scale(scale, scale);
                    if (el.type === 'text') {
                        ctx.font = (el.fontSize || 8) + 'px ' + (el.fontFamily || '"Press Start 2P"');
                        ctx.textBaseline = 'top';
                        ctx.textAlign = el.textAlign || 'left';
                        let displayText = el.text || '';
                        if (displayText.startsWith('=')) {
                            try { displayText = eval(displayText.substring(1)); } catch(e) {}
                        }
                        window.norDrawRetroText(ctx, displayText, el.x, el.y, el.textColor || 'white');
                    } else if (el.type === 'bar') {
                        const val = eval(el.barValue || '0');
                        window.norDrawRetroPanel(ctx, el.x, el.y, el.w, el.h, '#4a5568', 'sunken');
                        ctx.fillStyle = el.barColor || '#48bb78';
                        const fillW = Math.max(0, el.w - 4);
                        const fillH = Math.max(0, el.h - 4);
                        ctx.fillRect(el.x + 2, el.y + 2, fillW * (Math.max(0, Math.min(1, val / 100))), fillH);
                    } else if (el.type === 'image') {
                        const img = assets[el.spriteId];
                        if (img) {
                            ctx.drawImage(img, el.x, el.y, el.w, el.h);
                        }
                    } else if (el.type === 'button') {
                        const isHovered = mx >= el.x && mx <= el.x + el.w && my >= el.y && my <= el.y + el.h;
                        const isActive = isHovered && mdown;

                        let bCol = el.bgColor || '#2b6cb0';
                        if (isActive) {
                            bCol = '#2c5282'; // darker
                        } else if (isHovered) {
                            bCol = '#4299e1'; // lighter
                        }

                        window.norDrawRetroPanel(ctx, el.x, el.y, el.w, el.h, bCol, isActive ? 'sunken' : 'raised');

                        ctx.font = (el.fontSize || 8) + 'px ' + (el.fontFamily || '"Press Start 2P"');
                        ctx.textBaseline = 'middle';
                        ctx.textAlign = 'center';
                        let displayText = el.text || 'Button';
                        if (displayText.startsWith('=')) {
                            try { displayText = eval(displayText.substring(1)); } catch(e) {}
                        }

                        const textOffY = isActive ? 1 : 0;
                        window.norDrawRetroText(ctx, displayText, el.x + el.w/2, el.y + el.h/2 + textOffY, el.textColor || 'white');
                    }
                });
            });
        }
        renderUI();
        Input.clearFrameState();
    }
    window.room_goto = (id) => loadRoom(id);

    console.log("NOR ENGINE: Script loaded, checking DOM readiness...");
    const bootEngine = () => {
        try {
            init();
        } catch (e) {
            console.error("NOR ENGINE: Fatal error during initialize:", e);
            const ls = document.getElementById('loading');
            if (ls) ls.innerText = "ERROR STARTING ENGINE. CHECK CONSOLE.";
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootEngine);
    } else {
        bootEngine();
    }

    // Ultimate fallback: if DOMContentLoaded fails or assets never load properly
    setTimeout(() => {
        const ls = document.getElementById('loading');
        if (ls && ls.style.display !== 'none') {
            console.warn("NOR ENGINE: Hard timeout reached! Forcing start...");
            ls.style.display = 'none';
            try { start(); } catch(e) {}
        }
    }, 10000);
    </script>

    <!-- NOR VIRTUAL GAMEPAD & CUSTOMIZER SYSTEM -->
    <style>
        #nor-gamepad-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999;
            pointer-events: none;
            box-sizing: border-box;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .nor-gamepad-btn, .nor-gamepad-btn-group, .nor-settings-btn {
            position: absolute;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
            box-sizing: border-box;
            transition: transform 0.1s ease;
        }
        .nor-gamepad-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.12);
            border: 2px solid rgba(255, 255, 255, 0.35);
            color: #fff;
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 1000;
        }
        .nor-gamepad-btn:active, .nor-gamepad-btn.active {
            background: rgba(255, 255, 255, 0.35) !important;
            border-color: #fff !important;
            transform: scale(0.92);
        }
        .nor-gamepad-btn.circular {
            border-radius: 50%;
        }
        .nor-gamepad-btn.square {
            border-radius: 8px;
        }
        .nor-gamepad-btn.pill {
            border-radius: 20px;
            font-size: 10px;
            letter-spacing: 1px;
            font-family: "Press Start 2P", monospace, sans-serif;
        }

        /* D-Pad Container */
        #nor-btn-dpad {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            width: 130px;
            height: 130px;
            z-index: 1000;
        }
        .nor-dpad-part {
            background: rgba(40, 40, 40, 0.55);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: rgba(255, 255, 255, 0.85);
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            outline: none;
            touch-action: none;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
        }
        .nor-dpad-part:active, .nor-dpad-part.active {
            background: rgba(255, 255, 255, 0.3) !important;
            color: #fff !important;
        }
        #nor-dpad-up { grid-column: 2; grid-row: 1; border-radius: 8px 8px 0 0; border-bottom: none; }
        #nor-dpad-left { grid-column: 1; grid-row: 2; border-radius: 8px 0 0 8px; border-right: none; }
        .nor-dpad-part-center { grid-column: 2; grid-row: 2; background: rgba(30, 30, 30, 0.7); border: none; }
        #nor-dpad-right { grid-column: 3; grid-row: 2; border-radius: 0 8px 8px 0; border-left: none; }
        #nor-dpad-down { grid-column: 2; grid-row: 3; border-radius: 0 0 8px 8px; border-top: none; }

        /* Floating Settings Button */
        .nor-top-actions {
            position: absolute;
            top: 15px;
            right: 15px;
            display: flex;
            gap: 10px;
            z-index: 10001;
        }
        .nor-settings-btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.45);
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            color: #fff;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 10001;
            transition: transform 0.2s ease, background 0.2s ease;
        }
        .nor-settings-btn:hover {
            background: rgba(0, 0, 0, 0.7);
            transform: rotate(30deg);
        }
        .nor-settings-btn:active {
            transform: scale(0.9) rotate(60deg);
        }

        /* Edit Layout Active Mode */
        .nor-edit-active .draggable {
            outline: 2px dashed #f59e0b !important;
            outline-offset: 4px;
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.6) !important;
            cursor: move !important;
        }
        .nor-edit-active .draggable::after {
            content: "✥";
            position: absolute;
            top: -10px;
            right: -10px;
            background: #f59e0b;
            color: #000;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            pointer-events: none;
        }
        .nor-edit-active .draggable.selected {
            outline: 2px solid #3b82f6 !important;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.9) !important;
        }

        /* Settings Modal styling */
        #nor-gamepad-settings-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.82);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            font-family: system-ui, -apple-system, sans-serif;
            color: #fff;
            padding: 10px;
            box-sizing: border-box;
        }
        .nor-settings-content {
            background: #1e1e1e;
            border: 2px solid #3a3a3a;
            border-radius: 12px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.6);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            animation: norFadeIn 0.2s ease-out;
        }
        @keyframes norFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .nor-settings-header {
            background: #2a2a2a;
            padding: 14px 18px;
            border-bottom: 1px solid #3a3a3a;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            font-size: 15px;
        }
        #nor-settings-close-x {
            background: none;
            border: none;
            color: #888;
            font-size: 24px;
            cursor: pointer;
            padding: 0 4px;
            line-height: 1;
        }
        #nor-settings-close-x:hover { color: #fff; }
        .nor-settings-body {
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            overflow-y: auto;
            max-height: calc(100vh - 120px);
        }
        .nor-setting-row {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
        }
        .nor-setting-row.justify-between {
            justify-content: space-between;
        }
        .nor-flex-col {
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        .nor-input {
            background: #0f0f0f;
            border: 1px solid #444;
            color: #fff;
            padding: 8px 12px;
            border-radius: 8px;
            outline: none;
            font-size: 13px;
        }
        .nor-input:focus { border-color: #3b82f6; }
        .nor-slider {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: #333;
            outline: none;
            -webkit-appearance: none;
            margin-top: 6px;
        }
        .nor-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
        }
        .nor-btn-action {
            background: #3b82f6;
            border: none;
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
            font-size: 13px;
            transition: background 0.15s ease;
        }
        .nor-btn-action:hover { background: #2563eb; }
        .nor-btn-action:active { background: #1d4ed8; }
        .nor-btn-action.secondary {
            background: #10b981;
        }
        .nor-btn-action.secondary:hover { background: #059669; }
        .nor-btn-action.secondary:active { background: #047857; }

        .nor-setting-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
            width: 100%;
        }
        .nor-btn-action.reset-btn {
            background: #4b5563;
            flex: 1;
        }
        .nor-btn-action.reset-btn:hover { background: #374151; }
        .nor-btn-action.reset-btn:active { background: #1f2937; }
        .nor-btn-action.save-btn {
            background: #2563eb;
            flex: 2;
        }
        .nor-btn-action.save-btn:hover { background: #1d4ed8; }
        .nor-btn-action.save-btn:active { background: #1e40af; }

        /* Language Text Visibility options */
        .lang-ar .en-text { display: none !important; }
        .lang-en .ar-text { display: none !important; }

        /* Language alignment */
        .lang-ar { direction: rtl; }
        .lang-en { direction: ltr; }
    </style>

    <div id="nor-gamepad-overlay" style="display: none;">
        <!-- D-pad Unit -->
        <div id="nor-btn-dpad" class="nor-gamepad-btn-group draggable" data-btn="dpad">
            <button id="nor-dpad-up" class="nor-dpad-part">▲</button>
            <button id="nor-dpad-left" class="nor-dpad-part">◀</button>
            <button id="nor-dpad-center" class="nor-dpad-part-center"></button>
            <button id="nor-dpad-right" class="nor-dpad-part">▶</button>
            <button id="nor-dpad-down" class="nor-dpad-part">▼</button>
        </div>

        <!-- Action Buttons -->
        <button id="nor-btn-action-b" class="nor-gamepad-btn draggable" data-btn="action-b">B</button>
        <button id="nor-btn-action-a" class="nor-gamepad-btn draggable" data-btn="action-a">A</button>

        <!-- Menu/Start/Select Buttons -->
        <button id="nor-btn-select" class="nor-gamepad-btn draggable" data-btn="select">SELECT</button>
        <button id="nor-btn-start" class="nor-gamepad-btn draggable" data-btn="start">START</button>

        <!-- Floating top actions -->
        <div class="nor-top-actions">
            <div id="nor-btn-rotate-screen" class="nor-settings-btn" title="Rotate Screen">🔄</div>
            <div id="nor-btn-fullscreen" class="nor-settings-btn" title="Fullscreen">🔲</div>
            <div id="nor-gamepad-settings-trigger" class="nor-settings-btn" title="Settings">⚙</div>
        </div>
    </div>

    <!-- Layout Customization Toolbar -->
    <div id="nor-layout-toolbar" style="display: none; position: fixed; top: 12px; left: 50%; transform: translateX(-50%); background: rgba(20,20,20,0.92); border: 2px solid #f59e0b; padding: 12px 16px; border-radius: 12px; z-index: 100002; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.6); width: 92%; max-width: 350px; box-sizing: border-box; color: white;">
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <p class="ar-text" style="font-size: 13px; text-align: center; margin: 0; color: #f59e0b; font-weight: bold;">وضع تعديل الأزرار: اسحب لتغيير الموضع</p>
            <p class="en-text" style="font-size: 13px; text-align: center; margin: 0; color: #f59e0b; font-weight: bold;">Edit Layout: Drag buttons to move them</p>

            <p class="ar-text" style="font-size: 11px; text-align: center; margin: 0; color: #aaa;">اضغط على أي زر لتخصيص حجمه وشكله</p>
            <p class="en-text" style="font-size: 11px; text-align: center; margin: 0; color: #aaa;">Tap any button to customize its size & shape</p>

            <div id="nor-btn-customizer-controls" style="display: none; border-top: 1px dashed #444; margin-top: 4px; padding-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="ar-text" style="font-size: 12px;">حجم الزر:</span>
                    <span class="en-text" style="font-size: 12px;">Button Size:</span>
                    <input type="range" id="nor-btn-size-slider" min="40" max="130" value="70" style="width: 120px; accent-color: #3b82f6;" />
                </div>
                <div id="nor-shape-control-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span class="ar-text" style="font-size: 12px;">شكل الزر:</span>
                    <span class="en-text" style="font-size: 12px;">Button Shape:</span>
                    <select id="nor-btn-shape-select" style="background: #111; color: white; border: 1px solid #555; border-radius: 4px; padding: 3px 6px; font-size: 12px; outline: none;">
                        <option value="circle">دائري (Circle)</option>
                        <option value="square">مربع (Square)</option>
                        <option value="pill">بيضاوي (Pill)</option>
                    </select>
                </div>
            </div>

            <button id="nor-btn-done-layout" style="background: #10b981; border: none; color: white; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; transition: background 0.15s ease;">
                <span class="ar-text">إنهاء وحفظ التعديلات ✔️</span>
                <span class="en-text">Done & Save ✔️</span>
            </button>
        </div>
    </div>

    <!-- Settings & Options Modal -->
    <div id="nor-gamepad-settings-modal" style="display: none;">
        <div class="nor-settings-content">
            <div class="nor-settings-header">
                <span class="ar-text">إعدادات التحكم والعرض للأندرويد</span>
                <span class="en-text">Android Controller & Screen Settings</span>
                <button id="nor-settings-close-x">×</button>
            </div>
            <div class="nor-settings-body">
                <!-- Interface Language -->
                <div class="nor-setting-row justify-between">
                    <span class="ar-text" style="font-size: 13px;">لغة واجهة التحكم:</span>
                    <span class="en-text" style="font-size: 13px;">Control Language:</span>
                    <select id="nor-setting-lang" class="nor-input">
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                    </select>
                </div>

                <!-- Toggle Controller -->
                <div class="nor-setting-row">
                    <input type="checkbox" id="nor-setting-enabled" style="width:18px; height:18px; cursor:pointer;" />
                    <label for="nor-setting-enabled" class="ar-text" style="font-size: 13px; cursor:pointer;">تفعيل أزرار التحكم اللمسية</label>
                    <label for="nor-setting-enabled" class="en-text" style="font-size: 13px; cursor:pointer;">Enable Touch On-Screen Gamepad</label>
                </div>

                <!-- Force Desktop / Test Mode -->
                <div class="nor-setting-row">
                    <input type="checkbox" id="nor-setting-force-desktop" style="width:18px; height:18px; cursor:pointer;" />
                    <label for="nor-setting-force-desktop" class="ar-text" style="font-size: 13px; cursor:pointer;">تفعيل على الكمبيوتر (للاختبار والpreview)</label>
                    <label for="nor-setting-force-desktop" class="en-text" style="font-size: 13px; cursor:pointer;">Force Enable on Desktop (For Testing)</label>
                </div>

                <!-- Co-op Mode -->
                <div class="nor-setting-row" style="border-top: 1px dashed #444; padding-top: 12px; margin-top: 12px;">
                    <input type="checkbox" id="nor-setting-coop" style="width:18px; height:18px; cursor:pointer;" />
                    <label for="nor-setting-coop" class="ar-text" style="font-size: 13px; cursor:pointer; font-weight: bold; color: #10b981;">تفعيل اللعب الزوجي (Co-op Multiplayer) 👥</label>
                    <label for="nor-setting-coop" class="en-text" style="font-size: 13px; cursor:pointer; font-weight: bold; color: #10b981;">Enable Co-op Multiplayer Mode 👥</label>
                </div>

                <!-- Player controls explanation -->
                <div id="nor-coop-controls-desc" style="display: none; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 10px; border-radius: 8px; margin-top: 8px; font-size: 11px; line-height: 1.4; color: #e2e8f0;">
                    <div class="ar-text">
                        <strong>🎮 خطط التحكم للعب الزوجي:</strong><br/>
                        • <strong>اللاعب الأول (Player 1):</strong> الأسهم / ذراع التحكم الأول 1.<br/>
                        • <strong>اللاعب الثاني (Player 2):</strong> أزرار WASD أو IJKL / ذراع التحكم الثاني 2.<br/>
                        <em>* سيتم تلقائياً تلوين اللاعب الثاني باللون الأخضر المميز!</em>
                    </div>
                    <div class="en-text">
                        <strong>🎮 Multiplayer Control Schemes:</strong><br/>
                        • <strong>Player 1:</strong> Arrow Keys / Gamepad Index 1.<br/>
                        • <strong>Player 2:</strong> WASD or IJKL Keys / Gamepad Index 2.<br/>
                        <em>* Player 2 will be automatically tinted green to distinguish them!</em>
                    </div>
                </div>

                <!-- Display Mode -->
                <div class="nor-flex-col">
                    <span class="ar-text" style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">نوع عرض الشاشة (Display Mode):</span>
                    <span class="en-text" style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">Screen Display Mode:</span>
                    <select id="nor-setting-display" class="nor-input">
                        <option value="fit">ملائمة الأبعاد (Aspect Fit)</option>
                        <option value="stretch">تمديد كامل الشاشة (Stretch / Fill)</option>
                        <option value="pixel">الحجم الأصلي (Pixel Perfect)</option>
                    </select>
                </div>

                <!-- Rendering Quality -->
                <div class="nor-flex-col">
                    <span class="ar-text" style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">دقة وجودة الرندرة (موصى به للشاشات والتلفزيونات الكبيرة):</span>
                    <span class="en-text" style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">Rendering Quality (Best for TVs & Big Screens):</span>
                    <select id="nor-setting-quality" class="nor-input">
                        <option value="1">أصلي (1x - للـ Retro الكلاسيكي)</option>
                        <option value="2">عالي (2x - للشاشات المتوسطة HD)</option>
                        <option value="3">فائق (3x - لشاشات التلفزيون FHD)</option>
                        <option value="4">دقة 4K فائقة (4x - للشاشات الضخمة وتلفزيونات 4K Smart TV)</option>
                    </select>
                </div>

                <!-- Image Smoothing Filter -->
                <div class="nor-flex-col">
                    <span class="ar-text" style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">تنعيم حواف الصورة (Image Smoothing Filter):</span>
                    <span class="en-text" style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">Image Smoothing & Filtering:</span>
                    <select id="nor-setting-smoothing" class="nor-input">
                        <option value="pixel">بيكسل حاد (Pixel-Perfect Retro)</option>
                        <option value="smooth">تنعيم سينمائي (Bilinear Smooth HQ)</option>
                    </select>
                </div>

                <!-- Opacity Slider -->
                <div class="nor-flex-col">
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <span class="ar-text">شفافية الأزرار:</span>
                        <span class="en-text">Buttons Opacity:</span>
                        <span id="nor-opacity-val">60%</span>
                    </div>
                    <input type="range" id="nor-setting-opacity" min="10" max="100" class="nor-slider" />
                </div>

                <!-- Customize Layout Button -->
                <button id="nor-btn-edit-layout" class="nor-btn-action">
                    <span class="ar-text">تخصيص وتغيير أماكن وأشكال الأزرار 🛠️</span>
                    <span class="en-text">Customize Buttons Positions & Shapes 🛠️</span>
                </button>

                <!-- Save / Reset Actions -->
                <div class="nor-setting-actions">
                    <button id="nor-btn-reset" class="nor-btn-action reset-btn">
                        <span class="ar-text">إعادة ضبط</span>
                        <span class="en-text">Reset Defaults</span>
                    </button>
                    <button id="nor-btn-save" class="nor-btn-action save-btn">
                        <span class="ar-text">حفظ وإغلاق</span>
                        <span class="en-text">Save & Apply</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        const gameTitle = (window.GAME_DATA && window.GAME_DATA.title) || document.title || 'nor_game';
        const storageKey = 'nor_gamepad_config_' + gameTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        const defaultLayout = {
            enabled: true,
            forceDesktop: false,
            opacity: 60,
            displayMode: 'fit',
            renderingQuality: '1',
            imageSmoothing: 'pixel',
            lang: (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en',
            coop: false,
            buttons: {
                'dpad': { left: 8, top: 56, size: 130, shape: 'square' },
                'action-b': { left: 74, top: 62, size: 68, shape: 'circle' },
                'action-a': { left: 85, top: 53, size: 68, shape: 'circle' },
                'select': { left: 36, top: 86, size: 65, shape: 'pill' },
                'start': { left: 52, top: 86, size: 65, shape: 'pill' }
            }
        };

        let activeConfig = JSON.parse(JSON.stringify(defaultLayout));

        const loadConfig = () => {
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    activeConfig = {
                        ...defaultLayout,
                        ...parsed,
                        buttons: {
                            ...defaultLayout.buttons,
                            ...(parsed.buttons || {})
                        }
                    };
                }
            } catch (e) {
                console.error('Failed to load config', e);
            }
        };

        const saveConfig = () => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(activeConfig));
            } catch (e) {
                console.error('Failed to save config', e);
            }
        };

        const applyConfig = (config) => {
            window.coopEnabled = !!config.coop;
            const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
            const overlay = document.getElementById('nor-gamepad-overlay');
            if (overlay) {
                overlay.style.display = 'block'; // Keep the settings trigger (⚙) always accessible
            }

            // Dynamically show/hide virtual gamepad buttons
            const buttonsVisible = config.enabled && (isTouch || config.forceDesktop);
            const gpButtons = document.querySelectorAll('#nor-gamepad-overlay .draggable');
            gpButtons.forEach(btn => {
                btn.style.display = buttonsVisible ? '' : 'none';
            });

            const elementsToOpacity = document.querySelectorAll('.nor-gamepad-btn, .nor-gamepad-btn-group');
            elementsToOpacity.forEach(el => {
                el.style.opacity = config.opacity / 100;
            });

            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                if (config.displayMode === 'stretch') {
                    canvas.style.setProperty('width', '100vw', 'important');
                    canvas.style.setProperty('height', '100vh', 'important');
                    canvas.style.setProperty('max-width', '100vw', 'important');
                    canvas.style.setProperty('max-height', '100vh', 'important');
                    canvas.style.setProperty('object-fit', 'fill', 'important');
                } else if (config.displayMode === 'pixel') {
                    canvas.style.removeProperty('width');
                    canvas.style.removeProperty('height');
                    canvas.style.setProperty('max-width', 'none', 'important');
                    canvas.style.setProperty('max-height', 'none', 'important');
                    canvas.style.setProperty('object-fit', 'contain', 'important');
                } else { // 'fit'
                    canvas.style.setProperty('width', 'auto', 'important');
                    canvas.style.setProperty('height', 'auto', 'important');
                    canvas.style.setProperty('max-width', '100%', 'important');
                    canvas.style.setProperty('max-height', '100%', 'important');
                    canvas.style.setProperty('object-fit', 'contain', 'important');
                }

                // Apply Image Smoothing
                if (config.imageSmoothing === 'smooth') {
                    canvas.style.setProperty('image-rendering', 'auto', 'important');
                    window.imageSmoothing = true;
                } else {
                    canvas.style.setProperty('image-rendering', 'pixelated', 'important');
                    window.imageSmoothing = false;
                }

                // Apply Rendering Quality Multiplier
                const resMult = parseInt(config.renderingQuality || '1') || 1;
                window.renderingScaleMultiplier = resMult;
            }

            Object.keys(config.buttons).forEach(btnId => {
                const btnConfig = config.buttons[btnId];
                const el = document.querySelector('[data-btn="' + btnId + '"]');
                if (el) {
                    el.style.left = btnConfig.left + '%';
                    el.style.top = btnConfig.top + '%';
                    el.style.right = 'auto';
                    el.style.bottom = 'auto';

                    if (btnId === 'dpad') {
                        el.style.width = btnConfig.size + 'px';
                        el.style.height = btnConfig.size + 'px';
                    } else {
                        el.style.width = btnConfig.size + 'px';
                        el.style.height = (btnConfig.shape === 'pill' ? Math.floor(btnConfig.size / 2.5) : btnConfig.size) + 'px';

                        el.classList.remove('circular', 'square', 'pill');
                        if (btnConfig.shape === 'circle') el.classList.add('circular');
                        else if (btnConfig.shape === 'square') el.classList.add('square');
                        else if (btnConfig.shape === 'pill') el.classList.add('pill');
                    }
                }
            });

            const modal = document.getElementById('nor-gamepad-settings-modal');
            const toolbar = document.getElementById('nor-layout-toolbar');
            [modal, toolbar].forEach(el => {
                if (el) {
                    el.classList.remove('lang-ar', 'lang-en');
                    el.classList.add(config.lang === 'ar' ? 'lang-ar' : 'lang-en');
                }
            });
        };

        const registerButtonInput = (el, keyOrCodes) => {
            const handleDown = (e) => {
                if (document.body.classList.contains('nor-edit-active')) return;
                e.preventDefault();
                e.stopPropagation();

                if (Array.isArray(keyOrCodes)) {
                    keyOrCodes.forEach(k => Input.syncKey(k, true));
                } else {
                    Input.syncKey(keyOrCodes, true);
                }
                el.classList.add('active');
            };

            const handleUp = (e) => {
                if (document.body.classList.contains('nor-edit-active')) return;
                e.preventDefault();
                e.stopPropagation();

                if (Array.isArray(keyOrCodes)) {
                    keyOrCodes.forEach(k => Input.syncKey(k, false));
                } else {
                    Input.syncKey(keyOrCodes, false);
                }
                el.classList.remove('active');
            };

            el.addEventListener('touchstart', handleDown, { passive: false });
            el.addEventListener('touchend', handleUp, { passive: false });
            el.addEventListener('touchcancel', handleUp, { passive: false });

            el.addEventListener('mousedown', handleDown);
            el.addEventListener('mouseup', handleUp);
            el.addEventListener('mouseleave', handleUp);
        };

        loadConfig();
        applyConfig(activeConfig);

        registerButtonInput(document.getElementById('nor-dpad-up'), 'ArrowUp');
        registerButtonInput(document.getElementById('nor-dpad-down'), 'ArrowDown');
        registerButtonInput(document.getElementById('nor-dpad-left'), 'ArrowLeft');
        registerButtonInput(document.getElementById('nor-dpad-right'), 'ArrowRight');
        registerButtonInput(document.getElementById('nor-btn-action-a'), ['Space', 'KeyZ']);
        registerButtonInput(document.getElementById('nor-btn-action-b'), 'KeyX');
        registerButtonInput(document.getElementById('nor-btn-select'), 'Escape');
        registerButtonInput(document.getElementById('nor-btn-start'), 'Enter');

        const trigger = document.getElementById('nor-gamepad-settings-trigger');
        const modal = document.getElementById('nor-gamepad-settings-modal');

        document.getElementById('nor-btn-fullscreen').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error("Failed to enter fullscreen:", err);
                });
            } else {
                document.exitFullscreen();
            }
        });

        document.getElementById('nor-btn-rotate-screen').addEventListener('click', () => {
            if (screen.orientation && screen.orientation.lock) {
                const currentType = screen.orientation.type;
                let newType = 'landscape';
                if (currentType.includes('landscape')) {
                    newType = 'portrait';
                }
                screen.orientation.lock(newType).catch(err => {
                    console.error("Failed to lock orientation:", err);
                    alert("تدوير الشاشة قد يتطلب تفعيل وضع الشاشة الكاملة أولاً (Screen rotation might require Fullscreen mode first).");
                });
            } else {
                alert("تدوير الشاشة غير مدعوم في هذا المتصفح (Screen rotation not supported in this browser).");
            }
        });

        // Allow opening the settings modal with F2 and dismissing with Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                } else {
                    trigger.click();
                }
            } else if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });

        const closeX = document.getElementById('nor-settings-close-x');
        const saveBtn = document.getElementById('nor-btn-save');
        const resetBtn = document.getElementById('nor-btn-reset');
        const editLayoutBtn = document.getElementById('nor-btn-edit-layout');
        const doneLayoutBtn = document.getElementById('nor-btn-done-layout');
        const toolbar = document.getElementById('nor-layout-toolbar');

        trigger.addEventListener('click', () => {
            modal.style.display = 'flex';

            document.getElementById('nor-setting-lang').value = activeConfig.lang;
            document.getElementById('nor-setting-enabled').checked = activeConfig.enabled;
            document.getElementById('nor-setting-force-desktop').checked = activeConfig.forceDesktop;
            document.getElementById('nor-setting-display').value = activeConfig.displayMode;
            document.getElementById('nor-setting-quality').value = activeConfig.renderingQuality || '1';
            document.getElementById('nor-setting-smoothing').value = activeConfig.imageSmoothing || 'pixel';
            document.getElementById('nor-setting-opacity').value = activeConfig.opacity;
            document.getElementById('nor-opacity-val').innerText = activeConfig.opacity + '%';

            const coopCb = document.getElementById('nor-setting-coop');
            coopCb.checked = !!activeConfig.coop;
            document.getElementById('nor-coop-controls-desc').style.display = coopCb.checked ? 'block' : 'none';
        });

        document.getElementById('nor-setting-coop').addEventListener('change', (e) => {
            document.getElementById('nor-coop-controls-desc').style.display = e.target.checked ? 'block' : 'none';
        });

        closeX.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        document.getElementById('nor-setting-opacity').addEventListener('input', (e) => {
            document.getElementById('nor-opacity-val').innerText = e.target.value + '%';
            activeConfig.opacity = parseInt(e.target.value);
            applyConfig(activeConfig);
        });

        saveBtn.addEventListener('click', () => {
            activeConfig.lang = document.getElementById('nor-setting-lang').value;
            activeConfig.enabled = document.getElementById('nor-setting-enabled').checked;
            activeConfig.forceDesktop = document.getElementById('nor-setting-force-desktop').checked;
            activeConfig.displayMode = document.getElementById('nor-setting-display').value;
            activeConfig.renderingQuality = document.getElementById('nor-setting-quality').value;
            activeConfig.imageSmoothing = document.getElementById('nor-setting-smoothing').value;
            activeConfig.opacity = parseInt(document.getElementById('nor-setting-opacity').value);
            activeConfig.coop = document.getElementById('nor-setting-coop').checked;

            saveConfig();
            applyConfig(activeConfig);
            modal.style.display = 'none';
        });

        resetBtn.addEventListener('click', () => {
            if (confirm(activeConfig.lang === 'ar' ? 'هل أنت متأكد من إعادة ضبط الأزرار؟' : 'Are you sure you want to reset controller layout?')) {
                activeConfig = JSON.parse(JSON.stringify(defaultLayout));
                saveConfig();
                applyConfig(activeConfig);
                modal.style.display = 'none';
            }
        });

        let isDragging = false;
        let activeDragEl = null;
        let startX, startY;
        let initialLeft, initialTop;
        let selectedBtnId = null;

        const selectButtonForCustomization = (btnId) => {
            selectedBtnId = btnId;
            const controls = document.getElementById('nor-btn-customizer-controls');
            const shapeRow = document.getElementById('nor-shape-control-row');

            if (!selectedBtnId || selectedBtnId === 'settings-trigger') {
                controls.style.display = 'none';
                return;
            }

            controls.style.display = 'block';
            const btnConfig = activeConfig.buttons[selectedBtnId];
            if (btnConfig) {
                document.getElementById('nor-btn-size-slider').value = btnConfig.size;

                if (selectedBtnId === 'dpad') {
                    shapeRow.style.display = 'none';
                } else {
                    shapeRow.style.display = 'flex';
                    document.getElementById('nor-btn-shape-select').value = btnConfig.shape || 'circle';
                }
            }
        };

        const draggables = document.querySelectorAll('.draggable');
        draggables.forEach(el => {
            el.addEventListener('pointerdown', e => {
                if (!document.body.classList.contains('nor-edit-active')) return;

                document.querySelectorAll('.draggable').forEach(d => d.classList.remove('selected'));
                el.classList.add('selected');

                const btnId = el.getAttribute('data-btn');
                selectButtonForCustomization(btnId);

                isDragging = true;
                activeDragEl = el;
                startX = e.clientX;
                startY = e.clientY;

                const rect = el.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;

                el.setPointerCapture(e.pointerId);
                e.stopPropagation();
            });

            el.addEventListener('pointermove', e => {
                if (!isDragging || activeDragEl !== el) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                let newLeft = initialLeft + dx;
                let newTop = initialTop + dy;

                newLeft = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, newLeft));
                newTop = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, newTop));

                const pctLeft = (newLeft / window.innerWidth) * 100;
                const pctTop = (newTop / window.innerHeight) * 100;

                el.style.left = pctLeft + '%';
                el.style.top = pctTop + '%';
                el.style.bottom = 'auto';
                el.style.right = 'auto';

                const btnId = el.getAttribute('data-btn');
                if (activeConfig.buttons[btnId]) {
                    activeConfig.buttons[btnId].left = Math.round(pctLeft);
                    activeConfig.buttons[btnId].top = Math.round(pctTop);
                }
            });

            el.addEventListener('pointerup', e => {
                if (activeDragEl === el) {
                    el.releasePointerCapture(e.pointerId);
                    isDragging = false;
                    activeDragEl = null;
                }
            });
        });

        editLayoutBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.classList.add('nor-edit-active');
            toolbar.style.display = 'block';
            selectButtonForCustomization(null);
        });

        document.getElementById('nor-btn-size-slider').addEventListener('input', e => {
            if (!selectedBtnId) return;
            const size = parseInt(e.target.value);
            activeConfig.buttons[selectedBtnId].size = size;
            applyConfig(activeConfig);
        });

        document.getElementById('nor-btn-shape-select').addEventListener('change', e => {
            if (!selectedBtnId) return;
            const shape = e.target.value;
            activeConfig.buttons[selectedBtnId].shape = shape;
            applyConfig(activeConfig);
        });

        doneLayoutBtn.addEventListener('click', () => {
            document.body.classList.remove('nor-edit-active');
            document.querySelectorAll('.draggable').forEach(d => d.classList.remove('selected'));
            toolbar.style.display = 'none';
            saveConfig();
            applyConfig(activeConfig);
            modal.style.display = 'flex';
        });

        // Apply display config changes to canvas resize
        const originalResize = window.onresize || function(){};
        window.onresize = function() {
            applyConfig(activeConfig);
            originalResize();
        };
    })();
    </script>
</body>
</html>`;
    return html;
}
