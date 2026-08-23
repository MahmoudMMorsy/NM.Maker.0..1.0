
// GM82 Project Polyfills for NOR Web Engine
// This mimics the functionality of the requested GM82 extensions using HTML5 APIs

export interface ExtensionDef {
    id: string;
    name: string;
    description: string;
    code: string;
}

export const GM82_EXTENSIONS: ExtensionDef[] = [
    {
        id: 'GM82Core',
        name: 'GM82Core',
        description: 'وظائف النواة الأساسية: رياضيات، تصادمات، وتحكم.',
        code: `
// --- GM82Core Extension ---
const GM82Core = {
    lengthdir_x: (len, dir) => len * Math.cos(dir * Math.PI / 180),
    lengthdir_y: (len, dir) => len * Math.sin(dir * Math.PI / 180),
    point_distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    point_direction: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI,
    choose: (...args) => args[Math.floor(Math.random() * args.length)],
    random_range: (min, max) => Math.random() * (max - min) + min,
    irandom_range: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    lerp: (a, b, amt) => a + (b - a) * amt,
    dcos: (deg) => Math.cos(deg * Math.PI / 180),
    dsin: (deg) => Math.sin(deg * Math.PI / 180),
    degtorad: (deg) => deg * Math.PI / 180,
    radtodeg: (rad) => rad * 180 / Math.PI,
    sign: (val) => Math.sign(val),
    sqr: (val) => val * val,
    // Basic Box Collision
    place_meeting: (x, y, obj, otherArr) => {
        // Simplified AABB for the web engine context
        // Assumes otherArr contains objects with {x, y, w, h}
        if (!otherArr) return false;
        const myRight = x + 16; // Assumes 16x16
        const myBottom = y + 16;
        for (let other of otherArr) {
            if (x < other.x + 16 && myRight > other.x &&
                y < other.y + 16 && myBottom > other.y) {
                return true;
            }
        }
        return false;
    }
};
window.GM82Core = GM82Core;
`
    },
    {
        id: 'GM82Audio',
        name: 'GM82Audio',
        description: 'نظام صوتي متطور (Web Audio API) بديل للصوتيات الأساسية.',
        code: `
// --- GM82Audio Extension ---
const GM82Audio = {
    ctx: null,
    init: function() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play_sound: function(freq, type = 'square', duration = 0.1, vol = 0.1) {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    play_sfx: function(name) {
       // Placeholder for asset based audio
       if (name === 'jump') this.play_sound(440, 'square', 0.2);
       if (name === 'hit') this.play_sound(150, 'sawtooth', 0.3);
       if (name === 'coin') this.play_sound(880, 'sine', 0.1);
    }
};
window.GM82Audio = GM82Audio;
`
    },
    {
        id: 'GM82DX9',
        name: 'GM82DX9',
        description: 'مؤثرات بصرية ورسومية (Shaders & Filters).',
        code: `
// --- GM82DX9 Extension (Simulated via Canvas API) ---
const GM82DX9 = {
    set_filter: function(ctx, filterString) {
        // Example: 'blur(5px)' or 'contrast(200%)'
        ctx.filter = filterString;
    },
    reset_filter: function(ctx) {
        ctx.filter = 'none';
    },
    draw_sprite_ext: function(ctx, img, x, y, xscale, yscale, rot, alpha) {
        ctx.save();
        ctx.translate(x + 8, y + 8); // Pivot center 8x8 assumed
        ctx.rotate(rot * Math.PI / 180);
        ctx.scale(xscale, yscale);
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, -8, -8);
        ctx.restore();
    },
    blend_mode: function(ctx, mode) {
        // add, multiply, screen, source-over
        ctx.globalCompositeOperation = mode;
    }
};
window.GM82DX9 = GM82DX9;
`
    },
    {
        id: 'GM82Buffer',
        name: 'GM82Buffer',
        description: 'التعامل مع البيانات الثنائية (Binary Data & Buffers).',
        code: `
// --- GM82Buffer Extension ---
const GM82Buffer = {
    create: (size) => new DataView(new ArrayBuffer(size)),
    write_u8: (view, offset, val) => view.setUint8(offset, val),
    read_u8: (view, offset) => view.getUint8(offset),
    write_string: (view, offset, str) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    },
    // Useful for saving/loading level states
    serialize_map: (mapData) => JSON.stringify(mapData),
    deserialize_map: (jsonStr) => JSON.parse(jsonStr)
};
window.GM82Buffer = GM82Buffer;
`
    },
    {
        id: 'GM82Room',
        name: 'GM82Room',
        description: 'إدارة الغرف والانتقالات (Scene Management).',
        code: `
// --- GM82Room Extension ---
const GM82Room = {
    current: 0,
    goto: function(roomId) {
        this.current = roomId;
        // Trigger a custom event for the engine to handle reset
        window.dispatchEvent(new CustomEvent('GM82Room_Goto', { detail: { room: roomId } }));
    },
    restart: function() {
        window.dispatchEvent(new CustomEvent('GM82Room_Restart'));
    },
    next: function() {
        this.current++;
        this.goto(this.current);
    }
};
window.GM82Room = GM82Room;
`
    },
    {
        id: 'GM82Video',
        name: 'GM82Video',
        description: 'تشغيل مقاطع الفيديو داخل اللعبة.',
        code: `
// --- GM82Video Extension ---
const GM82Video = {
    element: null,
    play: function(src, loop = false) {
        if (!this.element) {
            this.element = document.createElement('video');
            this.element.style.position = 'absolute';
            this.element.style.top = '0';
            this.element.style.left = '0';
            this.element.style.width = '100%';
            this.element.style.height = '100%';
            this.element.style.objectFit = 'cover';
            this.element.style.zIndex = '50';
            document.body.appendChild(this.element);

            // Allow closing on click
            this.element.onclick = () => this.stop();
        }
        this.element.src = src;
        this.element.loop = loop;
        this.element.style.display = 'block';
        this.element.play().catch(e => console.warn("Video autoplay blocked", e));
    },
    stop: function() {
        if (this.element) {
            this.element.pause();
            this.element.style.display = 'none';
        }
    }
};
window.GM82Video = GM82Video;
`
    }
];
