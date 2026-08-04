
// A lightweight 6502 Assembler for NES (NROM-256)
// Compiles assembly string to a .nes binary file

const OPCODES: Record<string, Record<string, number>> = {
  'ADC': { 'imm': 0x69, 'zp': 0x65, 'zpx': 0x75, 'abs': 0x6D, 'absx': 0x7D, 'absy': 0x79, 'indx': 0x61, 'indy': 0x71 },
  'AND': { 'imm': 0x29, 'zp': 0x25, 'zpx': 0x35, 'abs': 0x2D, 'absx': 0x3D, 'absy': 0x39, 'indx': 0x21, 'indy': 0x31 },
  'ASL': { 'acc': 0x0A, 'impl': 0x0A, 'zp': 0x06, 'zpx': 0x16, 'abs': 0x0E, 'absx': 0x1E },
  'BCC': { 'rel': 0x90 },
  'BCS': { 'rel': 0xB0 },
  'BEQ': { 'rel': 0xF0 },
  'BIT': { 'zp': 0x24, 'abs': 0x2C },
  'BMI': { 'rel': 0x30 },
  'BNE': { 'rel': 0xD0 },
  'BPL': { 'rel': 0x10 },
  'BRK': { 'impl': 0x00 },
  'BVC': { 'rel': 0x50 },
  'BVS': { 'rel': 0x70 },
  'CLC': { 'impl': 0x18 },
  'CLD': { 'impl': 0xD8 },
  'CLI': { 'impl': 0x58 },
  'CLV': { 'impl': 0xB8 },
  'CMP': { 'imm': 0xC9, 'zp': 0xC5, 'zpx': 0xD5, 'abs': 0xCD, 'absx': 0xDD, 'absy': 0xD9, 'indx': 0xC1, 'indy': 0xD1 },
  'CPX': { 'imm': 0xE0, 'zp': 0xE4, 'abs': 0xEC },
  'CPY': { 'imm': 0xC0, 'zp': 0xC4, 'abs': 0xCC },
  'DEC': { 'zp': 0xC6, 'zpx': 0xD6, 'abs': 0xCE, 'absx': 0xDE },
  'DEX': { 'impl': 0xCA },
  'DEY': { 'impl': 0x88 },
  'EOR': { 'imm': 0x49, 'zp': 0x45, 'zpx': 0x55, 'abs': 0x4D, 'absx': 0x5D, 'absy': 0x59, 'indx': 0x41, 'indy': 0x51 },
  'INC': { 'zp': 0xE6, 'zpx': 0xF6, 'abs': 0xEE, 'absx': 0xFE },
  'INX': { 'impl': 0xE8 },
  'INY': { 'impl': 0xC8 },
  'JMP': { 'abs': 0x4C, 'ind': 0x6C },
  'JSR': { 'abs': 0x20 },
  'LDA': { 'imm': 0xA9, 'zp': 0xA5, 'zpx': 0xB5, 'abs': 0xAD, 'absx': 0xBD, 'absy': 0xB9, 'indx': 0xA1, 'indy': 0xB1 },
  'LDX': { 'imm': 0xA2, 'zp': 0xA6, 'zpy': 0xB6, 'abs': 0xAE, 'absy': 0xBE },
  'LDY': { 'imm': 0xA0, 'zp': 0xA4, 'zpx': 0xB4, 'abs': 0xAC, 'absx': 0xBC },
  'LSR': { 'acc': 0x4A, 'impl': 0x4A, 'zp': 0x46, 'zpx': 0x56, 'abs': 0x4E, 'absx': 0x5E },
  'NOP': { 'impl': 0xEA },
  'ORA': { 'imm': 0x09, 'zp': 0x05, 'zpx': 0x15, 'abs': 0x0D, 'absx': 0x1D, 'absy': 0x19, 'indx': 0x01, 'indy': 0x11 },
  'PHA': { 'impl': 0x48 },
  'PHP': { 'impl': 0x08 },
  'PLA': { 'impl': 0x68 },
  'PLP': { 'impl': 0x28 },
  'ROL': { 'acc': 0x2A, 'impl': 0x2A, 'zp': 0x26, 'zpx': 0x36, 'abs': 0x2E, 'absx': 0x3E },
  'ROR': { 'acc': 0x6A, 'impl': 0x6A, 'zp': 0x66, 'zpx': 0x76, 'abs': 0x6E, 'absx': 0x7E },
  'RTI': { 'impl': 0x40 },
  'RTS': { 'impl': 0x60 },
  'SBC': { 'imm': 0xE9, 'zp': 0xE5, 'zpx': 0xF5, 'abs': 0xED, 'absx': 0xFD, 'absy': 0xF9, 'indx': 0xE1, 'indy': 0xF1 },
  'SEC': { 'impl': 0x38 },
  'SED': { 'impl': 0xF8 },
  'SEI': { 'impl': 0x78 },
  'STA': { 'zp': 0x85, 'zpx': 0x95, 'abs': 0x8D, 'absx': 0x9D, 'absy': 0x99, 'indx': 0x81, 'indy': 0x91 },
  'STX': { 'zp': 0x86, 'zpy': 0x96, 'abs': 0x8E },
  'STY': { 'zp': 0x84, 'zpx': 0x94, 'abs': 0x8C },
  'TAX': { 'impl': 0xAA },
  'TAY': { 'impl': 0xA8 },
  'TSX': { 'impl': 0xBA },
  'TXA': { 'impl': 0x8A },
  'TXS': { 'impl': 0x9A },
  'TYA': { 'impl': 0x98 },
};

// --- CHR ROM BASE ---
const BASE_CHR_TILES = new Uint8Array(8192).fill(0);

// Helper to write a 8x8 1-bit bitmap to 2-bit NES CHR format
function writeTile(target: Uint8Array, tileIndex: number, bitmap: number[]) {
  const offset = tileIndex * 16;
  for (let y = 0; y < 8; y++) {
    target[offset + y] = bitmap[y];      // Plane 0
    target[offset + y + 8] = bitmap[y];  // Plane 1 -> Color 3
  }
}

// 1. Solid Block (Tile 1)
writeTile(BASE_CHR_TILES, 1, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
// 2. Ball / Circle (Tile 2)
writeTile(BASE_CHR_TILES, 2, [0x3C, 0x7E, 0xFF, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C]);
// 3. Player/Character (Tile 3)
writeTile(BASE_CHR_TILES, 3, [0x18, 0x3C, 0x3C, 0x18, 0xDB, 0x7E, 0x24, 0x42]);
// 4. Brick Pattern (Tile 4)
writeTile(BASE_CHR_TILES, 4, [0xFF, 0x80, 0x80, 0xFF, 0x08, 0x08, 0xFF, 0x08]);
// 5. Enemy (Tile 5) - Ghost/Spike
writeTile(BASE_CHR_TILES, 5, [0x3C, 0x7E, 0xDB, 0xFF, 0xFF, 0xDB, 0x66, 0xC3]);

// 5. Basic Font (0-9, A-Z)
const fontMap: Record<string, number[]> = {
  '0': [0x3C,0x66,0x66,0x66,0x66,0x66,0x66,0x3C],
  '1': [0x18,0x38,0x18,0x18,0x18,0x18,0x18,0x7E],
  '2': [0x3C,0x66,0x06,0x0C,0x18,0x30,0x60,0x7E],
  '3': [0x3C,0x66,0x06,0x1C,0x06,0x66,0x66,0x3C],
  '4': [0x0C,0x1C,0x3C,0x6C,0xCC,0xFE,0x0C,0x0C],
  '5': [0x7E,0x60,0x60,0x7C,0x06,0x06,0x66,0x3C],
  '6': [0x3C,0x66,0x60,0x7C,0x66,0x66,0x66,0x3C],
  '7': [0x7E,0x06,0x0C,0x18,0x30,0x30,0x30,0x30],
  '8': [0x3C,0x66,0x66,0x3C,0x66,0x66,0x66,0x3C],
  '9': [0x3C,0x66,0x66,0x3E,0x06,0x06,0x66,0x3C],
  'A': [0x3C,0x66,0x66,0x7E,0x66,0x66,0x66,0x66],
  'B': [0x7C,0x66,0x66,0x7C,0x66,0x66,0x66,0x7C],
  'C': [0x3C,0x66,0x60,0x60,0x60,0x60,0x66,0x3C],
  'D': [0x78,0x6C,0x66,0x66,0x66,0x66,0x6C,0x78],
  'E': [0x7E,0x60,0x60,0x78,0x60,0x60,0x60,0x7E],
  'F': [0x7E,0x60,0x60,0x78,0x60,0x60,0x60,0x60],
  'G': [0x3C,0x66,0x60,0x60,0x6E,0x66,0x66,0x3C],
  'H': [0x66,0x66,0x66,0x7E,0x66,0x66,0x66,0x66],
  'I': [0x3C,0x18,0x18,0x18,0x18,0x18,0x18,0x3C],
  'J': [0x06,0x06,0x06,0x06,0x06,0x66,0x66,0x3C],
  'K': [0x66,0x6C,0x78,0x70,0x78,0x6C,0x66,0x66],
  'L': [0x60,0x60,0x60,0x60,0x60,0x60,0x66,0x7E],
  'M': [0x63,0x77,0x7F,0x6B,0x63,0x63,0x63,0x63],
  'N': [0x66,0x76,0x7E,0x7E,0x6E,0x66,0x66,0x66],
  'O': [0x3C,0x66,0x66,0x66,0x66,0x66,0x66,0x3C],
  'P': [0x7C,0x66,0x66,0x7C,0x60,0x60,0x60,0x60],
  'Q': [0x3C,0x66,0x66,0x66,0x66,0x6A,0x6C,0x36],
  'R': [0x7C,0x66,0x66,0x7C,0x78,0x6C,0x66,0x66],
  'S': [0x3C,0x66,0x60,0x3C,0x06,0x06,0x66,0x3C],
  'T': [0x7E,0x18,0x18,0x18,0x18,0x18,0x18,0x18],
  'U': [0x66,0x66,0x66,0x66,0x66,0x66,0x66,0x3C],
  'V': [0x66,0x66,0x66,0x66,0x66,0x3C,0x18,0x18],
  'W': [0x63,0x63,0x63,0x6B,0x7F,0x77,0x63,0x63],
  'X': [0x66,0x66,0x3C,0x18,0x3C,0x66,0x66,0x66],
  'Y': [0x66,0x66,0x66,0x3C,0x18,0x18,0x18,0x18],
  'Z': [0x7E,0x06,0x0C,0x18,0x30,0x60,0xC0,0x7E],
};

Object.entries(fontMap).forEach(([char, bitmap]) => {
  writeTile(BASE_CHR_TILES, char.charCodeAt(0), bitmap);
});

export interface CustomTiles {
  player?: Uint8Array; // Tile 3
  ground?: Uint8Array; // Tile 4
  item?: Uint8Array;   // Tile 2
  enemy?: Uint8Array;  // Tile 5
}

export const assembleNES = (source: string, customTiles?: CustomTiles): Uint8Array => {
  const lines = source.split('\n');
  const labels: Record<string, number> = {};

  // NROM Defaults
  const prgSize = 32768;
  let pc = 0x8000;

  // Pass 1: Address resolution
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.includes(';')) line = line.substring(0, line.indexOf(';')).trim();
    if (!line) continue;

    if (line.startsWith('.org') || line.startsWith('ORG')) {
      const parts = line.split(/\s+/);
      pc = parseNumber(parts[1]);
      continue;
    }
    if (line.startsWith('.db') || line.startsWith('.byte') || line.startsWith('DB') || line.startsWith('BYTE')) {
      const parts = line.substring(line.indexOf(' ')).split(',');
      pc += parts.length;
      continue;
    }
     if (line.startsWith('.dw') || line.startsWith('.word') || line.startsWith('DW') || line.startsWith('WORD')) {
      const parts = line.substring(line.indexOf(' ')).split(',');
      pc += parts.length * 2;
      continue;
    }

    if (line.includes('=') && !line.startsWith('.')) {
        const parts = line.split('=');
        const name = parts[0].trim();
        const value = parseNumber(parts[1].trim());
        if (!isNaN(value)) {
          labels[name] = value;
          continue;
        }
    }
    if (line.toUpperCase().includes(' EQU ')) {
        const parts = line.split(/\s+EQU\s+/i);
        const name = parts[0].trim();
        const value = parseNumber(parts[1].trim());
        if (!isNaN(value)) {
          labels[name] = value;
          continue;
        }
    }

    if (line.endsWith(':')) {
      labels[line.slice(0, -1)] = pc;
      continue;
    }

    const spaceIdx = line.indexOf(' ');
    let op = '', arg = '';
    if (spaceIdx === -1) {
      op = line.toUpperCase();
    } else {
      op = line.substring(0, spaceIdx).toUpperCase();
      arg = line.substring(spaceIdx + 1).trim();
    }

    if (OPCODES[op]) {
        const mode = getMode(arg, labels, true);
        const size = getLength(mode, op);
        pc += size;
    }
  }

  // Pass 2: Code Generation
  const prg = new Uint8Array(prgSize).fill(0xEA); // Fill with NOP
  const baseAddress = 0x8000;
  let currentPc = 0x8000;

  lines.forEach(rawLine => {
    let line = rawLine.trim();
    if (line.includes(';')) line = line.substring(0, line.indexOf(';')).trim();
    if (!line) return;

    if (line.startsWith('.org') || line.startsWith('ORG')) {
      currentPc = parseNumber(line.split(/\s+/)[1]);
      return;
    }

    if (line.includes('=') && !line.startsWith('.')) return;
    if (line.toUpperCase().includes(' EQU ')) return;

    if (line.startsWith('.db') || line.startsWith('.byte') || line.startsWith('DB') || line.startsWith('BYTE')) {
      const parts = line.substring(line.indexOf(' ')).split(',');
      parts.forEach(p => {
        const val = parseValue(p.trim(), labels);
        writeByte(prg, currentPc, baseAddress, val);
        currentPc++;
      });
      return;
    }

    if (line.startsWith('.dw') || line.startsWith('.word') || line.startsWith('DW') || line.startsWith('WORD')) {
      const parts = line.substring(line.indexOf(' ')).split(',');
      parts.forEach(p => {
        const val = parseValue(p.trim(), labels);
        writeByte(prg, currentPc, baseAddress, val & 0xFF);
        writeByte(prg, currentPc + 1, baseAddress, (val >> 8) & 0xFF);
        currentPc += 2;
      });
      return;
    }

    if (line.endsWith(':')) return;

    const spaceIdx = line.indexOf(' ');
    let op = '', arg = '';
    if (spaceIdx === -1) {
      op = line.toUpperCase();
    } else {
      op = line.substring(0, spaceIdx).toUpperCase();
      arg = line.substring(spaceIdx + 1).trim();
    }

    if (!OPCODES[op]) return;

    const mode = getMode(arg, labels, false);
    let opcodeVal = OPCODES[op][mode];

    if (opcodeVal === undefined) {
       if (mode === 'zp') opcodeVal = OPCODES[op]['abs'];
       if (mode === 'zpx') opcodeVal = OPCODES[op]['absx'];
       if (mode === 'zpy') opcodeVal = OPCODES[op]['absy'];
    }

    if (opcodeVal === undefined) return;

    writeByte(prg, currentPc, baseAddress, opcodeVal);
    currentPc++;

    if (mode !== 'impl' && mode !== 'acc') {
      let val = 0;
      if (mode === 'rel') {
        const target = parseValue(arg, labels);
        val = target - (currentPc + 1);
      } else {
        val = parseValue(arg.replace(/[#$()X,Y]/g, ''), labels);
      }

      const len = getLength(mode, op);
      if (len === 2) {
         writeByte(prg, currentPc, baseAddress, val & 0xFF);
         currentPc++;
      } else if (len === 3) {
         writeByte(prg, currentPc, baseAddress, val & 0xFF);
         writeByte(prg, currentPc + 1, baseAddress, (val >> 8) & 0xFF);
         currentPc += 2;
      }
    }
  });

  // PREPARE CHR
  const finalChr = new Uint8Array(BASE_CHR_TILES);
  if (customTiles) {
    if (customTiles.player) finalChr.set(customTiles.player, 3 * 16);
    if (customTiles.ground) finalChr.set(customTiles.ground, 4 * 16);
    if (customTiles.item) finalChr.set(customTiles.item, 2 * 16);
    if (customTiles.enemy) finalChr.set(customTiles.enemy, 5 * 16);
  }

  // Construct iNES Header
  const header = new Uint8Array(16);
  header[0] = 0x4E; // N
  header[1] = 0x45; // E
  header[2] = 0x53; // S
  header[3] = 0x1A; // EOF
  header[4] = 2;    // 32KB PRG
  header[5] = 1;    // 8KB CHR
  header[6] = 1;    // Vertical mirroring
  header[7] = 0;

  const file = new Uint8Array(header.length + prgSize + finalChr.length);
  file.set(header, 0);
  file.set(prg, 16);
  file.set(finalChr, 16 + prgSize);

  return file;
};

function writeByte(buffer: Uint8Array, address: number, base: number, value: number) {
    const index = address - base;
    if (index >= 0 && index < buffer.length) {
        buffer[index] = value & 0xFF;
    }
}

function parseNumber(str: string): number {
  if (!str) return NaN;
  str = str.trim();
  if (str.startsWith('#')) str = str.substring(1);
  if (str.startsWith('$')) return parseInt(str.substring(1), 16);
  if (str.startsWith('0x')) return parseInt(str.substring(2), 16);
  return parseInt(str, 10);
}

function parseValue(str: string, labels: Record<string, number>): number {
    const clean = str.trim();
    if (labels[clean] !== undefined) return labels[clean];
    const val = parseNumber(clean);
    return isNaN(val) ? 0 : val;
}

function getMode(arg: string, labels: Record<string, number>, isPass1: boolean): string {
  if (!arg) return 'impl';
  if (arg === 'A') return 'acc';
  if (arg.startsWith('#')) return 'imm';

  const cleanArg = arg.replace(/[$,X,Y()]/g, '').trim();
  const val = parseValue(cleanArg, labels);
  const isNumeric = !isNaN(parseNumber(cleanArg));

  if (arg.startsWith('(') && arg.endsWith(',X)')) return 'indx';
  if (arg.startsWith('(') && arg.endsWith('),Y')) return 'indy';
  if (arg.endsWith(')')) return 'ind';

  if (arg.endsWith(',X')) {
    if (isNumeric && val < 256) return 'zpx';
    if (!isNumeric && labels[cleanArg] !== undefined && labels[cleanArg] < 256) return 'zpx';
    return 'absx';
  }
  if (arg.endsWith(',Y')) {
    if (isNumeric && val < 256) return 'zpy';
    if (!isNumeric && labels[cleanArg] !== undefined && labels[cleanArg] < 256) return 'zpy';
    return 'absy';
  }

  if (isNumeric && val < 256) return 'zp';
  if (!isNumeric && labels[cleanArg] !== undefined && labels[cleanArg] < 256) return 'zp';
  return 'abs';
}

function getLength(mode: string, op: string): number {
  if (mode === 'impl' || mode === 'acc') return 1;
  if (['BCC','BCS','BEQ','BMI','BNE','BPL','BVC','BVS'].includes(op)) return 2;
  if (mode === 'imm' || mode === 'zp' || mode === 'zpx' || mode === 'zpy' || mode === 'indx' || mode === 'indy') return 2;
  return 3;
}
