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

    // --- GML DATA STRUCTURES API (ds_list, ds_map, ds_grid, ds_stack, ds_queue) ---
    window._ds_lists = {}; window._ds_list_id = 0;
    window.ds_list_create = () => { const id = ++window._ds_list_id; window._ds_lists[id] = []; return id; };
    window.ds_list_destroy = (id) => { delete window._ds_lists[id]; };
    window.ds_list_clear = (id) => { if(window._ds_lists[id]) window._ds_lists[id] = []; };
    window.ds_list_size = (id) => (window._ds_lists[id] || []).length;
    window.ds_list_add = (id, ...vals) => { if(window._ds_lists[id]) window._ds_lists[id].push(...vals); };
    window.ds_list_find_value = (id, pos) => (window._ds_lists[id] || [])[pos];
    window.ds_list_delete = (id, pos) => { if(window._ds_lists[id]) window._ds_lists[id].splice(pos, 1); };
    window.ds_list_find_index = (id, val) => (window._ds_lists[id] || []).indexOf(val);
    window.ds_list_empty = (id) => (window._ds_lists[id] || []).length === 0;

    window._ds_maps = {}; window._ds_map_id = 0;
    window.ds_map_create = () => { const id = ++window._ds_map_id; window._ds_maps[id] = {}; return id; };
    window.ds_map_destroy = (id) => { delete window._ds_maps[id]; };
    window.ds_map_clear = (id) => { if(window._ds_maps[id]) window._ds_maps[id] = {}; };
    window.ds_map_size = (id) => Object.keys(window._ds_maps[id] || {}).length;
    window.ds_map_add = (id, k, v) => { if(window._ds_maps[id]) { window._ds_maps[id][k] = v; return true; } return false; };
    window.ds_map_replace = (id, k, v) => { if(window._ds_maps[id]) window._ds_maps[id][k] = v; };
    window.ds_map_find_value = (id, k) => (window._ds_maps[id] || {})[k];
    window.ds_map_exists = (id, k) => (window._ds_maps[id] || {}).hasOwnProperty(k);
    window.ds_map_delete = (id, k) => { if(window._ds_maps[id]) delete window._ds_maps[id][k]; };
    window.ds_map_empty = (id) => Object.keys(window._ds_maps[id] || {}).length === 0;

    window._ds_grids = {}; window._ds_grid_id = 0;
    window.ds_grid_create = (w, h) => {
        const id = ++window._ds_grid_id;
        window._ds_grids[id] = { w, h, data: Array.from({length: h}, () => Array(w).fill(0)) };
        return id;
    };
    window.ds_grid_destroy = (id) => { delete window._ds_grids[id]; };
    window.ds_grid_width = (id) => (window._ds_grids[id] ? window._ds_grids[id].w : 0);
    window.ds_grid_height = (id) => (window._ds_grids[id] ? window._ds_grids[id].h : 0);
    window.ds_grid_set = (id, x, y, val) => { if(window._ds_grids[id] && window._ds_grids[id].data[y]) window._ds_grids[id].data[y][x] = val; };
    window.ds_grid_get = (id, x, y) => (window._ds_grids[id] && window._ds_grids[id].data[y] ? window._ds_grids[id].data[y][x] : 0);
    window.ds_grid_clear = (id, val) => {
        if(window._ds_grids[id]) {
            const g = window._ds_grids[id];
            g.data = Array.from({length: g.h}, () => Array(g.w).fill(val));
        }
    };

    window._ds_stacks = {}; window._ds_stack_id = 0;
    window.ds_stack_create = () => { const id = ++window._ds_stack_id; window._ds_stacks[id] = []; return id; };
    window.ds_stack_destroy = (id) => { delete window._ds_stacks[id]; };
    window.ds_stack_push = (id, ...vals) => { if(window._ds_stacks[id]) window._ds_stacks[id].push(...vals); };
    window.ds_stack_pop = (id) => (window._ds_stacks[id] ? window._ds_stacks[id].pop() : undefined);
    window.ds_stack_top = (id) => (window._ds_stacks[id] ? window._ds_stacks[id][window._ds_stacks[id].length - 1] : undefined);
    window.ds_stack_size = (id) => (window._ds_stacks[id] || []).length;
    window.ds_stack_empty = (id) => (window._ds_stacks[id] || []).length === 0;

    window._ds_queues = {}; window._ds_queue_id = 0;
    window.ds_queue_create = () => { const id = ++window._ds_queue_id; window._ds_queues[id] = []; return id; };
    window.ds_queue_destroy = (id) => { delete window._ds_queues[id]; };
    window.ds_queue_enqueue = (id, ...vals) => { if(window._ds_queues[id]) window._ds_queues[id].push(...vals); };
    window.ds_queue_dequeue = (id) => (window._ds_queues[id] ? window._ds_queues[id].shift() : undefined);
    window.ds_queue_head = (id) => (window._ds_queues[id] ? window._ds_queues[id][0] : undefined);
    window.ds_queue_size = (id) => (window._ds_queues[id] || []).length;
    window.ds_queue_empty = (id) => (window._ds_queues[id] || []).length === 0;

    // --- GML PARTICLE SYSTEM API (part_system, part_type, part_emitter) ---
    window._part_systems = {}; window._part_system_id = 0;
    window.part_system_create = () => {
        const id = ++window._part_system_id;
        window._part_systems[id] = { particles: [], emitters: {} };
        return id;
    };
    window.part_system_destroy = (id) => { delete window._part_systems[id]; };
    window.part_system_clear = (id) => { if(window._part_systems[id]) window._part_systems[id].particles = []; };
    window.part_system_exists = (id) => !!window._part_systems[id];

    window._part_types = {}; window._part_type_id = 0;
    window.part_type_create = () => {
        const id = ++window._part_type_id;
        window._part_types[id] = {
            shape: 'pixel', color1: '#FFFFFF', color2: '#FFFFFF',
            sizeMin: 2, sizeMax: 4, lifeMin: 20, lifeMax: 40,
            speedMin: 1, speedMax: 3, dirMin: 0, dirMax: 360, gravity: 0
        };
        return id;
    };
    window.part_type_destroy = (id) => { delete window._part_types[id]; };
    window.part_type_shape = (id, shape) => { if(window._part_types[id]) window._part_types[id].shape = shape; };
    window.part_type_color1 = (id, col) => { if(window._part_types[id]) window._part_types[id].color1 = col; };
    window.part_type_color2 = (id, col1, col2) => {
        if(window._part_types[id]) { window._part_types[id].color1 = col1; window._part_types[id].color2 = col2; }
    };
    window.part_type_size = (id, minS, maxS) => {
        if(window._part_types[id]) { window._part_types[id].sizeMin = minS; window._part_types[id].sizeMax = maxS; }
    };
    window.part_type_life = (id, minL, maxL) => {
        if(window._part_types[id]) { window._part_types[id].lifeMin = minL; window._part_types[id].lifeMax = maxL; }
    };
    window.part_type_speed = (id, minSp, maxSp) => {
        if(window._part_types[id]) { window._part_types[id].speedMin = minSp; window._part_types[id].speedMax = maxSp; }
    };
    window.part_type_direction = (id, minD, maxD) => {
        if(window._part_types[id]) { window._part_types[id].dirMin = minD; window._part_types[id].dirMax = maxD; }
    };
    window.part_type_gravity = (id, grav, dir) => {
        if(window._part_types[id]) { window._part_types[id].gravity = grav; window._part_types[id].gravDir = dir; }
    };

    window._part_emitter_id = 0;
    window.part_emitter_create = (psId) => {
        const id = ++window._part_emitter_id;
        if(window._part_systems[psId]) {
            window._part_systems[psId].emitters[id] = { x1: 0, x2: 0, y1: 0, y2: 0 };
        }
        return id;
    };
    window.part_emitter_region = (psId, emId, x1, x2, y1, y2) => {
        if(window._part_systems[psId] && window._part_systems[psId].emitters[emId]) {
            window._part_systems[psId].emitters[emId] = { x1, x2, y1, y2 };
        }
    };
    window.part_emitter_burst = (psId, emId, ptId, count) => {
        const sys = window._part_systems[psId];
        const pt = window._part_types[ptId];
        if(!sys || !pt) return;
        const em = sys.emitters[emId] || { x1: 0, x2: 0, y1: 0, y2: 0 };
        for(let i = 0; i < count; i++) {
            const px = em.x1 + Math.random() * (em.x2 - em.x1 || 1);
            const py = em.y1 + Math.random() * (em.y2 - em.y1 || 1);
            const spd = pt.speedMin + Math.random() * (pt.speedMax - pt.speedMin);
            const dir = (pt.dirMin + Math.random() * (pt.dirMax - pt.dirMin)) * Math.PI / 180;
            const life = pt.lifeMin + Math.random() * (pt.lifeMax - pt.lifeMin);
            const size = pt.sizeMin + Math.random() * (pt.sizeMax - pt.sizeMin);
            sys.particles.push({
                x: px, y: py,
                dx: Math.cos(dir) * spd, dy: -Math.sin(dir) * spd,
                life, maxLife: life, size,
                color: pt.color1, grav: pt.gravity || 0
            });
        }
    };

    // --- GML SURFACES & PRIMITIVES API ---
    window._surfaces = {}; window._surface_id = 0; window._current_surface = null;
    window.surface_create = (w, h) => {
        const id = ++window._surface_id;
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        window._surfaces[id] = cv;
        return id;
    };
    window.surface_destroy = (id) => {
        if(window._current_surface === id) window._current_surface = null;
        delete window._surfaces[id];
    };
    window.surface_exists = (id) => !!window._surfaces[id];
    window.surface_set_target = (id) => { if(window._surfaces[id]) window._current_surface = id; };
    window.surface_reset_target = () => { window._current_surface = null; };
    window.draw_surface = (id, x, y) => {
        const cv = window._surfaces[id];
        if(cv && window.ctx) window.ctx.drawImage(cv, x, y);
    };

    window._primitive_points = []; window._primitive_type = null;
    window.draw_primitive_begin = (kind) => {
        window._primitive_points = [];
        window._primitive_type = kind || 'linelist';
    };
    window.draw_vertex = (x, y) => {
        window._primitive_points.push({ x, y });
    };
    window.draw_primitive_end = () => {
        if(!window.ctx || window._primitive_points.length === 0) return;
        const pts = window._primitive_points;
        const ctx = window.ctx;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for(let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = 'rgba(' + (window._draw_color & 255) + ',' + ((window._draw_color >> 8) & 255) + ',' + ((window._draw_color >> 16) & 255) + ',' + window._draw_alpha + ')';
        ctx.stroke();
    };
    window.part_particles_create = (psId, x, y, ptId, count) => {
        const sys = window._part_systems[psId];
        const pt = window._part_types[ptId];
        if(!sys || !pt) return;
        for(let i = 0; i < count; i++) {
            const spd = pt.speedMin + Math.random() * (pt.speedMax - pt.speedMin);
            const dir = (pt.dirMin + Math.random() * (pt.dirMax - pt.dirMin)) * Math.PI / 180;
            const life = pt.lifeMin + Math.random() * (pt.lifeMax - pt.lifeMin);
            const size = pt.sizeMin + Math.random() * (pt.sizeMax - pt.sizeMin);
            sys.particles.push({
                x, y,
                dx: Math.cos(dir) * spd, dy: -Math.sin(dir) * spd,
                life, maxLife: life, size,
                color: pt.color1, grav: pt.gravity || 0
            });
        }
    };
`;
