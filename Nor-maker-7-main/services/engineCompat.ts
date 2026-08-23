/**
 * GML Compatibility Layer for the NOR Engine.
 * Provides standard GameMaker constants and functions for use within the engine's sandboxed iframe.
 */
export const GML_COMPAT_SCRIPT = `
    // --- GML Virtual Key Constants ---
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

    // --- GML Color Constants (BGR integer format) ---
    window.c_black    = 0x000000; window.c_white  = 0xFFFFFF;
    window.c_red      = 0x0000FF; window.c_green  = 0x00FF00; window.c_blue   = 0xFF0000;
    window.c_yellow   = 0x00FFFF; window.c_orange = 0x0080FF; window.c_purple = 0xFF0080;
    window.c_aqua     = 0xFFFF00; window.c_fuchsia= 0xFF00FF; window.c_lime   = 0x00FF80;
    window.c_maroon   = 0x000080; window.c_navy   = 0x800000; window.c_olive  = 0x008080;
    window.c_silver   = 0xC0C0C0; window.c_teal   = 0x808000; window.c_gray   = 0x808080;
    window.c_dkgray   = 0x404040; window.c_ltgray = 0xD3D3D3;

    window.make_color_rgb = (r,g,b) => (b<<16)|(g<<8)|r;
    window.color_get_red   = (c) => c & 0xFF;
    window.color_get_green = (c) => (c>>8) & 0xFF;
    window.color_get_blue  = (c) => (c>>16) & 0xFF;

    // --- GML Keyboard Functions ---
    window.keyboard_check = (k) => !!Input.keys[k] || !!Input.keys[mapGMKey(k)];
    window.keyboard_check_pressed = (k) => !!Input.keysPressed[k] || !!Input.keysPressed[mapGMKey(k)];
    window.keyboard_check_released = (k) => !!Input.keysReleased[k] || !!Input.keysReleased[mapGMKey(k)];

    // --- GML Mouse Functions ---
    window.mouse_x = 0; window.mouse_y = 0;
    window.mouse_check_button = (b) => b === 1 ? Input.mouse.left : false;

    // --- GML Math ---
    window.lengthdir_x = (len, dir) => len * Math.cos(dir * Math.PI / 180);
    window.lengthdir_y = (len, dir) => -len * Math.sin(dir * Math.PI / 180);
    window.point_direction = (x1, y1, x2, y2) => (Math.atan2(-(y2-y1), x2-x1) * 180 / Math.PI + 360) % 360;
    window.point_distance = (x1, y1, x2, y2) => Math.hypot(x2-x1, y2-y1);
    window.irandom = (n) => Math.floor(Math.random() * (n + 1));
    window.choose = (...args) => args[Math.floor(Math.random() * args.length)];
    window.clamp = (val, min, max) => Math.min(Math.max(val, min), max);
    window.lerp = (a, b, amt) => a + (b - a) * amt;
    window.dcos = (deg) => Math.cos(deg * Math.PI / 180);
    window.dsin = (deg) => Math.sin(deg * Math.PI / 180);
    window.degtorad = (deg) => deg * Math.PI / 180;
    window.radtodeg = (rad) => rad * 180 / Math.PI;
    window.sign = (val) => Math.sign(val);
    window.sqr = (val) => val * val;

    // --- GML String Functions ---
    window.string_length = (str) => String(str || '').length;
    window.string_copy = (str, index, count) => String(str || '').substring(Math.max(0, index - 1), Math.max(0, index - 1) + count);
    window.string_pos = (sub, str) => { const idx = String(str || '').indexOf(sub); return idx === -1 ? 0 : idx + 1; };

    // --- GML Drawing & State Helpers ---
    window._draw_color = 0xFFFFFF;
    window._draw_alpha = 1.0;
    window.draw_set_color = (c) => { window._draw_color = c; };
    window.draw_set_alpha = (a) => { window._draw_alpha = a; };

    // --- AUDIO API ---
    window.audio_play_sound = (s, p, l) => { if(l) GM82Audio.play_music(s); else GM82Audio.play_sfx(s); };
    window.audio_stop_sound = (s) => GM82Audio.stop_music();

    // --- INSTANCE API ---
    window.instance_destroy = (id) => {
        if(!id) return;
        if(typeof id === 'object') id.dead = true;
        else window.instances.filter(i => i.def.id === id || i.def.name === id).forEach(i => i.dead = true);
    };
    window.instance_exists = (obj) => window.instances.some(i => !i.dead && (i.def.id === obj || i.def.name === obj || i === obj));
`;
