
import {
  ArrowRight, ArrowUp, ArrowDown, XCircle, Heart, Coins,
  Play, Repeat, Skull, ArrowRightCircle, Trophy, Gamepad2,
  Move, Anchor, Grid, RefreshCw, Volume2, Image, Type, Square,
  Clock, ToggleLeft, HelpCircle, Layers, Layout, Plus, Trash2,
  Zap, AlertTriangle, MessageSquare, MousePointer
} from 'lucide-react';

export interface ActionDefinition {
  id: string;
  category: string;
  name: string;
  description: string;
  iconName?: string;
  iconUrl?: string;
  functionName?: string; // New field for legacy functions
  params: {
    name: string;
    key: string;
    type: 'number' | 'string' | 'select' | 'boolean' | 'spr' | 'sound' | 'font';
    options?: string[];
    default: any
  }[];
  generateCode?: (params: Record<string, any>) => string;
}

let actionMapCache: Map<string, ActionDefinition> | null = null;

// Lazy Map index for O(1) action lookups in ACTION_LIBRARY
const getActionMap = (): Map<string, ActionDefinition> => {
  if (!actionMapCache) {
    actionMapCache = new Map(ACTION_LIBRARY.map(a => [a.id, a]));
  }
  return actionMapCache;
};

export const getActionDefinition = (libId: string): ActionDefinition | undefined => {
  return getActionMap().get(libId);
};

export const generateActionCode = (action: { libId: string, params: any }, externalLibrary?: ActionDefinition[]): string => {
  let def = getActionMap().get(action.libId);
  if (!def && externalLibrary) {
    def = externalLibrary.find(a => a.id === action.libId);
  }
  if (!def) return `// Action ${action.libId} not found\n`;

  if (def.generateCode) {
    return def.generateCode(action.params);
  }

  if (def.functionName) {
    const args = action.params?.args || [];
    const argsStr = args.map((a: any) => isNaN(Number(a)) ? `'${a}'` : a).join(', ');
    return `this.callLegacyAction('${def.functionName}', [${argsStr}], ${action.params?.rel || false}, ${action.params?.not || false});`;
  }

  return `// No generator for ${action.libId}\n`;
};

export const ACTION_LIBRARY: ActionDefinition[] = [
  // --- AI (AI Tab) ---
  {
    id: 'ai_prompt',
    category: 'ai',
    name: 'AI Action',
    description: 'Generate game logic using AI prompt',
    iconName: 'Lightbulb',
    params: [
      { name: 'Prompt', key: 'prompt', type: 'string', default: 'Make the player jump' },
      { name: 'Code', key: 'code', type: 'string', default: '' }
    ],
    generateCode: (params) => {
      return params.code || `/* AI Code not generated yet for: ${params.prompt} */`;
    }
  },
  // --- MOVEMENT (Move Tab) ---
  {
    id: 'move_fixed',
    category: 'move',
    name: 'Move Fixed',
    description: 'Start moving in a direction (8 directions + stop)',
    iconName: 'ArrowRight',
    params: [
      { name: 'Direction', key: 'dir', type: 'select', options: ['left', 'right', 'up', 'down', 'up-left', 'up-right', 'down-left', 'down-right', 'stop'], default: 'right' },
      { name: 'Speed', key: 'spd', type: 'number', default: 2 }
    ],
    generateCode: (p) => {
      if (p.dir === 'stop') return `this.dx = 0; this.dy = 0;`;
      if (p.dir === 'left') return `this.dx = -${p.spd}; this.dy = 0; this.facing = -1;`;
      if (p.dir === 'right') return `this.dx = ${p.spd}; this.dy = 0; this.facing = 1;`;
      if (p.dir === 'up') return `this.dy = -${p.spd}; this.dx = 0;`;
      if (p.dir === 'down') return `this.dy = ${p.spd}; this.dx = 0;`;
      if (p.dir === 'up-left') return `this.dx = -${p.spd*0.7}; this.dy = -${p.spd*0.7};`;
      if (p.dir === 'up-right') return `this.dx = ${p.spd*0.7}; this.dy = -${p.spd*0.7};`;
      if (p.dir === 'down-left') return `this.dx = -${p.spd*0.7}; this.dy = ${p.spd*0.7};`;
      if (p.dir === 'down-right') return `this.dx = ${p.spd*0.7}; this.dy = ${p.spd*0.7};`;
      return '';
    }
  },
  {
    id: 'move_towards',
    category: 'move',
    name: 'Move Towards',
    description: 'Move towards a specific X,Y point',
    iconName: 'Anchor',
    params: [
      { name: 'X', key: 'tx', type: 'number', default: 0 },
      { name: 'Y', key: 'ty', type: 'number', default: 0 },
      { name: 'Speed', key: 'spd', type: 'number', default: 2 }
    ],
    generateCode: (p) => `
      var dist = Math.hypot(${p.tx} - this.x, ${p.ty} - this.y);
      if (dist > ${p.spd}) {
        var angle = Math.atan2(${p.ty} - this.y, ${p.tx} - this.x);
        this.dx = Math.cos(angle) * ${p.spd};
        this.dy = Math.sin(angle) * ${p.spd};
      } else {
        this.x = ${p.tx}; this.y = ${p.ty}; this.dx = 0; this.dy = 0;
      }
    `
  },
  {
    id: 'move_hspeed',
    category: 'move',
    name: 'Speed Horizontal',
    description: 'Set horizontal speed directly',
    iconName: 'ArrowRight',
    params: [{ name: 'Speed', key: 'spd', type: 'number', default: 0 }],
    generateCode: (p) => `this.dx = ${p.spd};`
  },
  {
    id: 'move_vspeed',
    category: 'move',
    name: 'Speed Vertical',
    description: 'Set vertical speed directly',
    iconName: 'ArrowDown',
    params: [{ name: 'Speed', key: 'spd', type: 'number', default: 0 }],
    generateCode: (p) => `this.dy = ${p.spd};`
  },
  {
    id: 'move_gravity',
    category: 'move',
    name: 'Set Gravity',
    description: 'Apply constant downward force',
    iconName: 'ArrowDown',
    params: [{ name: 'Force', key: 'amt', type: 'number', default: 0.5 }],
    generateCode: (p) => `this.gravity = ${p.amt};`
  },
  {
    id: 'move_friction',
    category: 'move',
    name: 'Set Friction',
    description: 'Apply constant slowing force',
    iconName: 'ToggleLeft',
    params: [{ name: 'Amount', key: 'amt', type: 'number', default: 0.1 }],
    generateCode: (p) => `this.friction = ${p.amt};`
  },
  {
    id: 'move_keyboard',
    category: 'move',
    name: 'Keyboard Platformer',
    description: 'Move with Arrows/WASD + Jump',
    iconName: 'Gamepad2',
    params: [
      { name: 'Speed', key: 'spd', type: 'number', default: 2 },
      { name: 'Jump', key: 'jmp', type: 'number', default: 8 }
    ],
    generateCode: (p) => `
      var spd = ${p.spd};
      var jmp = ${p.jmp};
      if (!this.gravity) this.gravity = 0.4;
      var input = this.playerIndex === 1 ? (window as any).P2_Input : (window as any).P1_Input;
      if (input.checkLeft()) { this.dx = -spd; this.facing = -1; }
      else if (input.checkRight()) { this.dx = spd; this.facing = 1; }
      else { this.dx = 0; }

      if (input.checkJump() && this.grounded) {
          this.dy = -jmp;
      }
    `
  },
  {
    id: 'move_8way',
    category: 'move',
    name: '8-Way Movement',
    description: 'Move in 8 directions with Arrows/WASD',
    iconName: 'Move',
    params: [{ name: 'Speed', key: 'spd', type: 'number', default: 2 }],
    generateCode: (p) => `
      var spd = ${p.spd};
      var h = 0; var v = 0;
      var input = this.playerIndex === 1 ? (window as any).P2_Input : (window as any).P1_Input;
      if (input.checkLeft()) h = -1;
      if (input.checkRight()) h = 1;
      if (input.checkJump() || input.check('ArrowUp') || input.check('KeyW') || input.check('w') || input.check('KeyI') || input.check('i')) v = -1;
      if (input.checkDown()) v = 1;

      if (h !== 0 || v !== 0) {
          var angle = Math.atan2(v, h);
          this.dx = Math.cos(angle) * spd;
          this.dy = Math.sin(angle) * spd;
          if (h !== 0) this.facing = h;
      } else {
          this.dx = 0; this.dy = 0;
      }
    `
  },
  {
    id: 'move_jump',
    category: 'move',
    name: 'Jump to Point',
    description: 'Instantly move to X,Y',
    iconName: 'Move',
    params: [
      { name: 'X', key: 'x', type: 'number', default: 0 },
      { name: 'Y', key: 'y', type: 'number', default: 0 }
    ],
    generateCode: (p) => `this.x = ${p.x}; this.y = ${p.y};`
  },
  {
    id: 'move_jump_random',
    category: 'move',
    name: 'Jump Random',
    description: 'Move to a random position',
    iconName: 'RefreshCw',
    params: [],
    generateCode: () => `
      this.x = Math.random() * (currentRoom.width * 16 - this.w);
      this.y = Math.random() * (currentRoom.height * 16 - this.h);
    `
  },
  {
    id: 'move_wrap',
    category: 'move',
    name: 'Wrap Screen',
    description: 'Wrap around room edges',
    iconName: 'Repeat',
    params: [{ name: 'Margin', key: 'mar', type: 'number', default: 0 }],
    generateCode: (p) => `
      if (this.x < -${p.mar}) this.x = (currentRoom.width*16) + ${p.mar};
      if (this.x > (currentRoom.width*16) + ${p.mar}) this.x = -${p.mar};
      if (this.y < -${p.mar}) this.y = (currentRoom.height*16) + ${p.mar};
      if (this.y > (currentRoom.height*16) + ${p.mar}) this.y = -${p.mar};
    `
  },
  {
    id: 'move_snap',
    category: 'move',
    name: 'Snap to Grid',
    description: 'Align to grid coordinates',
    iconName: 'Grid',
    params: [
      { name: 'H-Snap', key: 'hs', type: 'number', default: 16 },
      { name: 'V-Snap', key: 'vs', type: 'number', default: 16 }
    ],
    generateCode: (p) => `
      this.x = Math.round(this.x / ${p.hs}) * ${p.hs};
      this.y = Math.round(this.y / ${p.vs}) * ${p.vs};
    `
  },
  {
    id: 'move_bounce',
    category: 'move',
    name: 'Bounce',
    description: 'Bounce against solid walls',
    iconName: 'RefreshCw',
    params: [
      { name: 'Precise', key: 'pre', type: 'boolean', default: false }
    ],
    generateCode: (p) => `
      var oldX = this.x; var oldY = this.y;
      this.x += this.dx;
      if (this.checkCol(currentRoom.map, currentRoom.width)) this.dx = -this.dx;
      this.x = oldX;
      this.y += this.dy;
      if (this.checkCol(currentRoom.map, currentRoom.width)) this.dy = -this.dy;
      this.y = oldY;
    `
  },

  // --- MAIN1 (Objects & Rooms) ---

  {
    id: 'main1_create',
    category: 'main1',
    name: 'Create Instance',
    description: 'Spawn another object',
    iconName: 'Plus',
    params: [
      { name: 'Object', key: 'obj', type: 'string', default: 'obj_name' },
      { name: 'X', key: 'x', type: 'number', default: 0 },
      { name: 'Y', key: 'y', type: 'number', default: 0 },
      { name: 'Relative', key: 'rel', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      var def = GAME_DATA.objects.find(o => o.name === '${p.obj}');
      if(def) {
         var nx = ${p.rel ? 'this.x + ' : ''}${p.x};
         var ny = ${p.rel ? 'this.y + ' : ''}${p.y};
         window.instances.push(new GMObject(nx, ny, def));
      }
    `
  },
  {
    id: 'main1_set_anim_state',
    category: 'main1',
    name: 'Set Animation State',
    description: 'Set a specific animation state (e.g. attack1, hurt, idle). Leave empty to return to automatic physics-based animation.',
    iconName: 'Image',
    params: [
      { name: 'State', key: 'state', type: 'select', options: ['', 'idle', 'walk', 'run', 'jump', 'fall', 'attack1', 'attack2', 'defend', 'hurt', 'death', 'crouch', 'climb', 'dash'], default: 'attack1' }
    ],
    generateCode: (p) => `this.animState = ${p.state ? `'${p.state}'` : 'null'};`
  },
  {
    id: 'main1_destroy',
    category: 'main1',
    name: 'Destroy Instance',
    description: 'Remove object',
    iconName: 'XCircle',
    params: [
      { name: 'Target', key: 'target', type: 'select', options: ['self', 'other'], default: 'self' }
    ],
    generateCode: (p) => {
        if (p.target === 'other') return `if(typeof other !== 'undefined' && other) other.dead = true;`;
        return `this.dead = true;`;
    }
  },
  {
    id: 'main1_destroy_other',
    category: 'main1',
    name: 'Destroy Other',
    description: 'Remove the other object in collision',
    iconName: 'Trash2',
    params: [],
    generateCode: () => `if(typeof other !== 'undefined' && other) other.dead = true;`
  },
  {
    id: 'main1_sprite',
    category: 'main1',
    name: 'Change Sprite',
    description: 'Swap current sprite',
    iconName: 'Image',
    params: [
      { name: 'Sprite ID', key: 'spr', type: 'string', default: '' },
      { name: 'Frame', key: 'idx', type: 'number', default: 0 },
      { name: 'Speed', key: 'spd', type: 'number', default: 0.2 }
    ],
    generateCode: (p) => `
      this.def = { ...this.def, spriteId: '${p.spr}' };
      this.frame = ${p.idx};
      this.animSpeed = ${p.spd};
      this.resolveSize();
    `
  },
  {
    id: 'main1_sound',
    category: 'main1',
    name: 'Play Sound',
    description: 'Play a sound effect',
    iconName: 'Volume2',
    params: [
      { name: 'Sound ID', key: 'snd', type: 'string', default: '' },
      { name: 'Loop', key: 'loop', type: 'boolean', default: false }
    ],
    generateCode: (p) => `GM82Audio.play_sfx('${p.snd}', ${p.loop});`
  },
  {
    id: 'main1_music_play',
    category: 'main1',
    name: 'Play Music',
    description: 'Play background music',
    iconName: 'Volume2',
    params: [
      { name: 'Sound ID', key: 'snd', type: 'string', default: '' }
    ],
    generateCode: (p) => `GM82Audio.play_music('${p.snd}');`
  },
  {
    id: 'main1_music_stop',
    category: 'main1',
    name: 'Stop Music',
    description: 'Stop background music',
    iconName: 'Volume2',
    params: [],
    generateCode: () => `GM82Audio.stop_music();`
  },
  {
    id: 'main1_instance_change',
    category: 'main1',
    name: 'Change Instance',
    description: 'Transform into another object type',
    iconName: 'RefreshCw',
    params: [
      { name: 'Object', key: 'obj', type: 'string', default: 'obj_name' },
      { name: 'Perform Events', key: 'ev', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      var def = GAME_DATA.objects.find(o => o.name === '${p.obj}');
      if(def) {
          this.def = def;
          this.resolveSize();
          if(${p.ev}) this.triggerEvent('create');
      }
    `
  },
  {
    id: 'main1_room_goto',
    category: 'main1',
    name: 'Go to Room',
    description: 'Transition to room',
    iconName: 'ArrowRightCircle',
    params: [{ name: 'Room ID', key: 'rm', type: 'string', default: 'rm_1' }],
    generateCode: (p) => `loadRoom('${p.rm}');`
  },
  {
    id: 'main1_game_state',
    category: 'main1',
    name: 'Set Game State',
    description: 'Change game state (Menu, Pause, etc)',
    iconName: 'Gamepad2',
    params: [{ name: 'State', key: 'state', type: 'select', options: ['MENU', 'PLAYING', 'PAUSED', 'SETTINGS'], default: 'MENU' }],
    generateCode: (p) => `gameState = '${p.state}';`
  },

  // --- MAIN2 (Timing & Game) ---
  {
    id: 'main2_alarm',
    category: 'main2',
    name: 'Set Alarm',
    description: 'Trigger Alarm event after steps',
    iconName: 'Clock',
    params: [
      { name: 'Alarm ID', key: 'id', type: 'select', options: ['0','1','2','3','4','5','6','7'], default: '0' },
      { name: 'Steps', key: 'steps', type: 'number', default: 30 }
    ],
    generateCode: (p) => `this.alarms[${p.id}] = ${p.steps};`
  },
  {
    id: 'main2_game_over',
    category: 'main2',
    name: 'Game Over',
    description: 'Show Game Over screen and restart',
    iconName: 'Skull',
    params: [],
    generateCode: () => `
        window.alert('GAME OVER');
        resetGame();
    `
  },
  {
    id: 'main2_game_over_only',
    category: 'main2',
    name: 'Game Over (No Restart)',
    description: 'Show Game Over screen without restarting',
    iconName: 'Skull',
    params: [],
    generateCode: () => `
        window.alert('GAME OVER');
        // No resetGame() called
    `
  },
  {
    id: 'main2_message',
    category: 'main2',
    name: 'Show Message',
    description: 'Display an alert box',
    iconName: 'HelpCircle',
    params: [{ name: 'Text', key: 'txt', type: 'string', default: 'Hello!' }],
    generateCode: (p) => `window.alert('${p.txt}');`
  },
  {
    id: 'main2_alert',
    category: 'main2',
    name: 'Show Alert',
    description: 'Display a warning box',
    iconName: 'AlertTriangle',
    params: [{ name: 'Text', key: 'txt', type: 'string', default: 'Warning!' }],
    generateCode: (p) => `window.alert('⚠️ ' + '${p.txt}');`
  },
  {
    id: 'main2_comment',
    category: 'main2',
    name: 'Comment',
    description: 'Add a non-executing comment',
    iconName: 'MessageSquare',
    params: [{ name: 'Text', key: 'txt', type: 'string', default: 'Note...' }],
    generateCode: (p) => `// ${p.txt}`
  },
  {
    id: 'main2_restart_room',
    category: 'main2',
    name: 'Restart Room',
    description: 'Restart the current room/level',
    iconName: 'RefreshCw',
    params: [],
    generateCode: () => `if (window.restartRoom) window.restartRoom();`
  },
  {
    id: 'main2_restart',
    category: 'main2',
    name: 'Restart Game',
    description: 'Reload the entire game',
    iconName: 'RefreshCw',
    params: [],
    generateCode: () => `location.reload();`
  },

  // --- CONTROL (Logic) ---
  {
    id: 'control_var',
    category: 'control',
    name: 'Set Variable',
    description: 'Set custom variable',
    iconName: 'HelpCircle',
    params: [
      { name: 'Name', key: 'name', type: 'string', default: 'myVar' },
      { name: 'Value', key: 'val', type: 'string', default: '0' },
      { name: 'Relative', key: 'rel', type: 'boolean', default: false }
    ],
    generateCode: (p) => {
        const valSafe = isNaN(Number(p.val)) ? `'${p.val}'` : p.val;
        return `this['${p.name}'] = ${p.rel ? `(this['${p.name}']||0) + ` : ''}${valSafe};`;
    }
  },
  {
    id: 'control_test_var',
    category: 'control',
    name: 'Test Variable',
    description: 'If condition is False, skip next action',
    iconName: 'HelpCircle',
    params: [
      { name: 'Variable', key: 'name', type: 'string', default: 'health' },
      { name: 'Op', key: 'op', type: 'select', options: ['==', '<', '>', '<=', '>='], default: '==' },
      { name: 'Value', key: 'val', type: 'number', default: 0 },
      { name: 'Target', key: 'target', type: 'select', options: ['self', 'other'], default: 'self' }
    ],
    generateCode: (p) => {
      if (p.target === 'other') {
        return `if (typeof other === 'undefined' || !other || !( (other['${p.name}']||0) ${p.op} ${p.val} )) return;`;
      }
      return `if (!( (this['${p.name}']||0) ${p.op} ${p.val} )) return;`;
    }
  },
  {
    id: 'control_if_empty',
    category: 'control',
    name: 'Check Empty',
    description: 'If position is NOT empty, skip next action',
    iconName: 'HelpCircle',
    params: [
      { name: 'X', key: 'x', type: 'number', default: 0 },
      { name: 'Y', key: 'y', type: 'number', default: 0 },
      { name: 'Relative', key: 'rel', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      var tx = ${p.rel ? 'this.x + ' : ''}${p.x};
      var ty = ${p.rel ? 'this.y + ' : ''}${p.y};
      var oldX = this.x; var oldY = this.y;
      this.x = tx; this.y = ty;
      var col = this.checkCol(currentRoom.map, currentRoom.width);
      this.x = oldX; this.y = oldY;
      if (col) return;
    `
  },
  {
    id: 'control_if_chance',
    category: 'control',
    name: 'Test Chance',
    description: '1 in N chance to perform next action',
    iconName: 'HelpCircle',
    params: [{ name: 'Sides', key: 'n', type: 'number', default: 2 }],
    generateCode: (p) => `if (Math.random() * ${p.n} >= 1) return;`
  },
  {
    id: 'score_test',
    category: 'control',
    name: 'Test Score',
    description: 'If score condition is False, skip next action',
    iconName: 'Coins',
    params: [
      { name: 'Op', key: 'op', type: 'select', options: ['==', '<', '>', '<=', '>='], default: '>=' },
      { name: 'Value', key: 'val', type: 'number', default: 100 }
    ],
    generateCode: (p) => `if (!( window.score ${p.op} ${p.val} )) return;`
  },
  {
    id: 'control_if_key',
    category: 'control',
    name: 'Check Key',
    description: 'If key is NOT pressed, skip next action',
    iconName: 'Gamepad2',
    params: [
      { name: 'Key', key: 'key', type: 'select', options: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'z', 'x', 'c', 'v', 'Enter'], default: 'Space' },
      { name: 'On Press', key: 'press', type: 'boolean', default: true }
    ],
    generateCode: (p) => {
        const key = p.key === 'Space' ? ' ' : p.key;
        const gmlKey = key.length === 1 ? 'Key' + key.toUpperCase() : key;
        return `if (!Input.keys['${key}'] && !Input.keys['${gmlKey}']) return;`;
    }
  },
  {
    id: 'control_if_any_key',
    category: 'control',
    name: 'Check Any Key',
    description: 'If NO key is pressed, skip next action',
    iconName: 'Gamepad2',
    params: [],
    generateCode: () => `
        var anyPressed = false;
        for (var k in Input.keys) {
            if (Input.keys[k]) { anyPressed = true; break; }
        }
        if (!anyPressed && !Input.mouse.left) return;
    `
  },
  {
    id: 'control_if_mouse_over',
    category: 'control',
    name: 'If Mouse Over',
    description: 'Check if mouse is over this object',
    iconName: 'MousePointer',
    params: [],
    generateCode: () => `
      if (Input.mouse.x < this.x || Input.mouse.x > this.x + this.w || Input.mouse.y < this.y || Input.mouse.y > this.y + this.h) return;
    `
  },
  {
    id: 'control_execute',
    category: 'control',
    name: 'Execute Code',
    description: 'Run JS Code directly',
    iconName: 'Terminal',
    params: [{ name: 'Code', key: 'code', type: 'string', default: '// JS code' }],
    generateCode: (p) => `${p.code}`
  },

  // --- SCORE ---
  {
    id: 'score_set',
    category: 'score',
    name: 'Set Score',
    description: 'Set global score',
    iconName: 'Coins',
    params: [
      { name: 'Points', key: 'amt', type: 'number', default: 10 },
      { name: 'Relative', key: 'rel', type: 'boolean', default: true }
    ],
    generateCode: (p) => `window.score = ${p.rel ? 'window.score + ' : ''}${p.amt};`
  },
  {
    id: 'lives_set',
    category: 'score',
    name: 'Set Lives',
    description: 'Set lives count',
    iconName: 'Heart',
    params: [
      { name: 'Lives', key: 'amt', type: 'number', default: 3 },
      { name: 'Relative', key: 'rel', type: 'boolean', default: false }
    ],
    generateCode: (p) => `window.lives = ${p.rel ? 'window.lives + ' : ''}${p.amt};`
  },
  {
    id: 'health_set',
    category: 'score',
    name: 'Set Health',
    description: 'Set health percentage (0-100)',
    iconName: 'Heart',
    params: [
      { name: 'Health', key: 'amt', type: 'number', default: 100 },
      { name: 'Relative', key: 'rel', type: 'boolean', default: false }
    ],
    generateCode: (p) => `this.health = ${p.rel ? '(this.health || 0) + ' : ''}${p.amt};`
  },
  {
    id: 'combat_damage',
    category: 'score',
    name: 'Deal Damage',
    description: 'Reduce health of self or other',
    iconName: 'Skull',
    params: [
      { name: 'Amount', key: 'amt', type: 'number', default: 10 },
      { name: 'Target', key: 'target', type: 'select', options: ['self', 'other'], default: 'self' }
    ],
    generateCode: (p) => {
        if (p.target === 'other') return `if(typeof other !== 'undefined' && other) { other.health -= ${p.amt}; if (other.health <= 0) other.dead = true; }`;
        return `this.health -= ${p.amt}; if (this.health <= 0) this.dead = true;`;
    }
  },
  {
    id: 'combat_damage_iframe',
    category: 'score',
    name: 'Take Damage (I-Frames)',
    description: 'Take damage and become temporarily invincible',
    iconName: 'ShieldAlert',
    params: [
      { name: 'Amount', key: 'amt', type: 'number', default: 10 },
      { name: 'I-Frames (Steps)', key: 'frames', type: 'number', default: 60 },
      { name: 'Target', key: 'target', type: 'select', options: ['self', 'other'], default: 'self' }
    ],
    generateCode: (p) => {
      if (p.target === 'other') {
        return `
          if (typeof other !== 'undefined' && other) {
            if (other.invincible > 0) return;
            other.health = (other.health || 0) - ${p.amt};
            other.invincible = ${p.frames};
            if (other.health <= 0) other.dead = true;
          }
        `;
      }
      return `
        if (this.invincible > 0) return;
        this.health = (this.health || 0) - ${p.amt};
        this.invincible = ${p.frames};
        if (this.health <= 0) this.dead = true;
      `;
    }
  },

  // --- DRAW ---
  {
    id: 'draw_self',
    category: 'draw',
    name: 'Draw Self',
    description: 'Draw standard sprite',
    iconName: 'Layers',
    params: [],
    generateCode: () => `
      if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;
      if (this.def.spriteId && assets[this.def.spriteId]) {
         var img = assets[this.def.spriteId];
         var fw = this.w; var fh = this.h;
         var sx = Math.floor(this.frame) * fw;
         ctx.save();
         ctx.translate(Math.round(this.x) + (fw/2), Math.round(this.y) + (fh/2));
         ctx.scale(this.facing, 1);
         ctx.drawImage(img, sx, 0, fw, fh, -fw/2, -fh/2, fw, fh);
         ctx.restore();
      }
    `
  },
  {
    id: 'draw_healthbar',
    category: 'draw',
    name: 'Draw Healthbar',
    description: 'Draw a customizable health bar with optional sprites',
    iconName: 'Heart',
    params: [
      { name: 'Width', key: 'w', type: 'number', default: 16 },
      { name: 'Height', key: 'h', type: 'number', default: 2 },
      { name: 'Offset Y', key: 'yoff', type: 'number', default: -4 },
      { name: 'BG Color', key: 'bg', type: 'string', default: '#000000' },
      { name: 'FG Color', key: 'fg', type: 'string', default: '#00FF00' },
      { name: 'Low Color', key: 'low', type: 'string', default: '#FF0000' },
      { name: 'BG Sprite', key: 'bgSpr', type: 'string', default: '' },
      { name: 'FG Sprite', key: 'fgSpr', type: 'string', default: '' },
      { name: 'Border', key: 'border', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      var pct = Math.max(0, (this.health || 0) / 100);
      var bx = this.x + (this.w/2) - (${p.w}/2);
      var by = this.y + ${p.yoff};

      if ('${p.bgSpr}' && assets['${p.bgSpr}']) {
        ctx.drawImage(assets['${p.bgSpr}'], bx, by, ${p.w}, ${p.h});
      } else {
        if (window.norDrawRetroPanel) {
            window.norDrawRetroPanel(ctx, bx, by, ${p.w}, ${p.h}, '${p.bg}', 'sunken');
        } else {
            ctx.fillStyle = '${p.bg}';
            ctx.fillRect(bx, by, ${p.w}, ${p.h});
        }
      }

      if ('${p.fgSpr}' && assets['${p.fgSpr}']) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by, ${p.w} * pct, ${p.h});
        ctx.clip();
        ctx.drawImage(assets['${p.fgSpr}'], bx, by, ${p.w}, ${p.h});
        ctx.restore();
      } else {
        ctx.fillStyle = pct > 0.25 ? '${p.fg}' : '${p.low}';
        var fillW = Math.max(0, ${p.w} - (window.norDrawRetroPanel ? 4 : 0));
        var fillH = Math.max(0, ${p.h} - (window.norDrawRetroPanel ? 4 : 0));
        var offXY = window.norDrawRetroPanel ? 2 : 0;
        ctx.fillRect(bx + offXY, by + offXY, fillW * pct, fillH);
      }

      if (${p.border} && !window.norDrawRetroPanel) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, by, ${p.w}, ${p.h});
      }
    `
  },
  {
    id: 'draw_text',
    category: 'draw',
    name: 'Draw Text',
    description: 'Draw text on screen',
    iconName: 'Type',
    params: [
      { name: 'Text', key: 'txt', type: 'string', default: 'Hello' },
      { name: 'X', key: 'x', type: 'number', default: 0 },
      { name: 'Y', key: 'y', type: 'number', default: 0 },
      { name: 'Color', key: 'col', type: 'string', default: '#FFFFFF' },
      { name: 'Align', key: 'align', type: 'select', options: ['left', 'center', 'right'], default: 'left' },
      { name: 'Relative', key: 'rel', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      ctx.textAlign = '${p.align || 'left'}';
      ctx.font = '8px "Press Start 2P", monospace';
      var dx = ${p.rel ? 'this.x + ' : ''}${p.x};
      var dy = ${p.rel ? 'this.y + ' : ''}${p.y};
      if (window.norDrawRetroText) {
          window.norDrawRetroText(ctx, '${p.txt}', dx, dy, '${p.col}');
      } else {
          ctx.fillStyle = '${p.col}';
          ctx.fillText('${p.txt}', dx, dy);
      }
      ctx.textAlign = 'left';
    `
  },
  {
    id: 'draw_rect',
    category: 'draw',
    name: 'Draw Rectangle',
    description: 'Draw a colored box',
    iconName: 'Square',
    params: [
      { name: 'X1', key: 'x1', type: 'number', default: 0 },
      { name: 'Y1', key: 'y1', type: 'number', default: 0 },
      { name: 'X2', key: 'x2', type: 'number', default: 16 },
      { name: 'Y2', key: 'y2', type: 'number', default: 16 },
      { name: 'Color', key: 'col', type: 'string', default: '#FF0000' },
      { name: 'Outline', key: 'out', type: 'boolean', default: false },
      { name: 'Relative', key: 'rel', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      var x1 = ${p.rel ? 'this.x + ' : ''}${p.x1};
      var y1 = ${p.rel ? 'this.y + ' : ''}${p.y1};
      var x2 = ${p.rel ? 'this.x + ' : ''}${p.x2};
      var y2 = ${p.rel ? 'this.y + ' : ''}${p.y2};
      if(${p.out}) {
          ctx.strokeStyle = '${p.col}';
          ctx.strokeRect(x1, y1, x2-x1, y2-y1);
      } else {
          if (window.norDrawRetroPanel) {
              window.norDrawRetroPanel(ctx, x1, y1, x2-x1, y2-y1, '${p.col}', 'raised');
          } else {
              ctx.fillStyle = '${p.col}';
              ctx.fillRect(x1, y1, x2-x1, y2-y1);
          }
      }
    `
  },
  {
    id: 'draw_sprite',
    category: 'draw',
    name: 'Draw Sprite',
    description: 'Draw a sprite at position',
    iconName: 'Image',
    params: [
      { name: 'Sprite ID', key: 'spr', type: 'string', default: '' },
      { name: 'X', key: 'x', type: 'number', default: 0 },
      { name: 'Y', key: 'y', type: 'number', default: 0 },
      { name: 'Frame', key: 'idx', type: 'number', default: 0 },
      { name: 'Relative', key: 'rel', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      if (assets['${p.spr}']) {
          var img = assets['${p.spr}'];
          var fw = img.width > img.height ? img.height : img.width;
          var nx = ${p.rel ? 'this.x + ' : ''}${p.x};
          var ny = ${p.rel ? 'this.y + ' : ''}${p.y};
          ctx.drawImage(img, ${p.idx}*fw, 0, fw, img.height, nx, ny, fw, img.height);
      }
    `
  },

  // --- EXTRA ---
  {
    id: 'combat_shoot',
    category: 'extra',
    name: 'Shoot Projectile',
    description: 'Spawn a projectile in the direction the object is facing',
    iconName: 'Zap',
    params: [
      { name: 'Object', key: 'obj', type: 'select', options: ['obj_bullet', 'obj_enemy', 'obj_item'], default: 'obj_bullet' },
      { name: 'Speed', key: 'spd', type: 'number', default: 4 },
      { name: 'Offset X', key: 'xoff', type: 'number', default: 0 },
      { name: 'Offset Y', key: 'yoff', type: 'number', default: 0 }
    ],
    generateCode: (p) => `
      var b = window.room_create('${p.obj}', this.x + ${p.xoff}, this.y + ${p.yoff});
      if (b) {
        b.dx = (this.facing || 1) * ${p.spd};
        b.dy = 0;
      }
    `
  },
  {
    id: 'extra_cursor',
    category: 'extra',
    name: 'Set Cursor',
    description: 'Change mouse cursor',
    iconName: 'ArrowRight',
    params: [{ name: 'Type', key: 'type', type: 'select', options: ['default', 'pointer', 'crosshair', 'none'], default: 'default' }],
    generateCode: (p) => `document.body.style.cursor = '${p.type === 'none' ? 'none' : p.type}';`
  },
  {
    id: 'extra_zap',
    category: 'extra',
    name: 'Screen Flash',
    description: 'Flash the screen color',
    iconName: 'Zap',
    params: [
      { name: 'Color', key: 'col', type: 'string', default: '#FFFFFF' },
      { name: 'Duration', key: 'dur', type: 'number', default: 5 }
    ],
    generateCode: (p) => `
      var overlay = document.createElement('div');
      overlay.style.position = 'fixed'; overlay.style.inset = '0';
      overlay.style.background = '${p.col}'; overlay.style.zIndex = '9999';
      overlay.style.pointerEvents = 'none';
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), ${p.dur} * 16);
    `
  },
  {
    id: 'extra_cursor_pos',
    category: 'extra',
    name: 'Set Mouse Pos',
    description: 'Move mouse cursor (simulated)',
    iconName: 'MousePointer',
    params: [
      { name: 'X', key: 'x', type: 'number', default: 0 },
      { name: 'Y', key: 'y', type: 'number', default: 0 }
    ],
    generateCode: (p) => `Input.mouse.x = ${p.x}; Input.mouse.y = ${p.y};`
  },
  {
    id: 'move_jump_to_start',
    category: 'move',
    name: 'Jump to Start',
    description: 'Instantly move back to creation position',
    iconName: 'RefreshCw',
    params: [],
    generateCode: () => `this.x = this.startX || 0; this.y = this.startY || 0;`
  },
  {
    id: 'move_step_towards',
    category: 'move',
    name: 'Step Towards',
    description: 'Move one step towards a point',
    iconName: 'ArrowRight',
    params: [
      { name: 'X', key: 'tx', type: 'number', default: 0 },
      { name: 'Y', key: 'ty', type: 'number', default: 0 },
      { name: 'Speed', key: 'spd', type: 'number', default: 2 }
    ],
    generateCode: (p) => `
      var angle = Math.atan2(${p.ty} - this.y, ${p.tx} - this.x);
      this.dx = Math.cos(angle) * ${p.spd};
      this.dy = Math.sin(angle) * ${p.spd};
    `
  },
  {
    id: 'main1_instance_create_at_mouse',
    category: 'main1',
    name: 'Create at Mouse',
    description: 'Spawn object at mouse position',
    iconName: 'Plus',
    params: [
      { name: 'Object', key: 'obj', type: 'string', default: 'obj_name' }
    ],
    generateCode: (p) => `
      var def = GAME_DATA.objects.find(o => o.name === '${p.obj}');
      if(def) {
         window.instances.push(new GMObject(Input.mouse.x, Input.mouse.y, def));
      }
    `
  },
  {
    id: 'control_if_collision',
    category: 'control',
    name: 'Check Collision',
    description: 'If NO collision at (X,Y), skip next action',
    iconName: 'HelpCircle',
    params: [
      { name: 'X', key: 'x', type: 'number', default: 0 },
      { name: 'Y', key: 'y', type: 'number', default: 0 },
      { name: 'Object', key: 'obj', type: 'string', default: 'obj_wall' },
      { name: 'Relative', key: 'rel', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      var tx = ${p.rel ? 'this.x + ' : ''}${p.x};
      var ty = ${p.rel ? 'this.y + ' : ''}${p.y};
      var col = window.instances.find(i => i.def.name === '${p.obj}' &&
                tx < i.x + i.w && tx + this.w > i.x &&
                ty < i.y + i.h && ty + this.h > i.y);
      if (!col) return;
    `
  },
  {
    id: 'draw_sprite_ext',
    category: 'draw',
    name: 'Draw Sprite Ext',
    description: 'Draw sprite with scale/rotation',
    iconName: 'Image',
    params: [
      { name: 'Sprite ID', key: 'spr', type: 'string', default: '' },
      { name: 'X', key: 'x', type: 'number', default: 0 },
      { name: 'Y', key: 'y', type: 'number', default: 0 },
      { name: 'Scale X', key: 'sx', type: 'number', default: 1 },
      { name: 'Scale Y', key: 'sy', type: 'number', default: 1 },
      { name: 'Rotation', key: 'rot', type: 'number', default: 0 },
      { name: 'Alpha', key: 'alp', type: 'number', default: 1 },
      { name: 'Relative', key: 'rel', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      if (assets['${p.spr}']) {
          var img = assets['${p.spr}'];
          var fw = img.width > img.height ? img.height : img.width;
          var nx = ${p.rel ? 'this.x + ' : ''}${p.x};
          var ny = ${p.rel ? 'this.y + ' : ''}${p.y};
          ctx.save();
          ctx.translate(nx + fw/2, ny + img.height/2);
          ctx.rotate(${p.rot} * Math.PI / 180);
          ctx.scale(${p.sx}, ${p.sy});
          ctx.globalAlpha = ${p.alp};
          ctx.drawImage(img, 0, 0, fw, img.height, -fw/2, -img.height/2, fw, img.height);
          ctx.restore();
      }
    `
  },
  {
    id: 'extra_screen_shake',
    category: 'extra',
    name: 'Screen Shake',
    description: 'Shake the camera',
    iconName: 'Zap',
    params: [
      { name: 'Amount', key: 'amt', type: 'number', default: 4 },
      { name: 'Duration', key: 'dur', type: 'number', default: 10 }
    ],
    generateCode: (p) => `
      window.shake = ${p.amt};
      window.shakeTime = ${p.dur};
    `
  },
  {
    id: 'extra_particle_create',
    category: 'extra',
    name: 'Create Particles',
    description: 'Spawn simple particles',
    iconName: 'Zap',
    params: [
      { name: 'X', key: 'x', type: 'number', default: 0 },
      { name: 'Y', key: 'y', type: 'number', default: 0 },
      { name: 'Count', key: 'cnt', type: 'number', default: 8 },
      { name: 'Color', key: 'col', type: 'string', default: '#FFFFFF' },
      { name: 'Relative', key: 'rel', type: 'boolean', default: true }
    ],
    generateCode: (p) => `
      for(var i=0; i<${p.cnt}; i++) {
        var px = ${p.rel ? 'this.x + ' : ''}${p.x};
        var py = ${p.rel ? 'this.y + ' : ''}${p.y};
        var part = { x: px, y: py, dx: (Math.random()-0.5)*4, dy: (Math.random()-0.5)*4, life: 20 + Math.random()*20, col: '${p.col}' };
        if(!window.particles) window.particles = [];
        window.particles.push(part);
      }
    `
  },
  {
    id: 'extra_dialog_show',
    category: 'extra',
    name: 'Show Dialog',
    description: 'Display a message box',
    iconName: 'MessageSquare',
    params: [
      { name: 'Text', key: 'txt', type: 'string', default: 'Hello!' },
      { name: 'Speaker', key: 'who', type: 'string', default: 'NPC' }
    ],
    generateCode: (p) => `
      window.isPaused = true;
      if(!window.ui) window.ui = {};
      window.ui.dialog = { text: '${p.txt}', speaker: '${p.who}', active: true };
    `
  },
  {
    id: 'extra_inventory_add',
    category: 'extra',
    name: 'Add to Inventory',
    description: 'Add an item to player inventory',
    iconName: 'Package',
    params: [
      { name: 'Item', key: 'item', type: 'string', default: 'Sword' }
    ],
    generateCode: (p) => `
      if(!window.inventory) window.inventory = [];
      window.inventory.push('${p.item}');
    `
  }
];
