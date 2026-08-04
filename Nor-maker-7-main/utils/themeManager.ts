
import { Theme } from '../types';

export const THEME_PRESETS: Theme[] = [
    {
        id: 'gm8',
        name: 'Classic (GameMaker 8)',
        colors: {
            face: '#ece9d8',
            highlight: '#ffffff',
            shadow: '#aca899',
            darkshadow: '#716f64',
            text: '#000000',
            blue: '#315db9',
            blueGrad: '#214698',
            inactive: '#7a96df',
            inactiveGrad: '#6375d6',
            select: '#316ac5',
            workspace: '#5d7ea3'
        }
    },
    {
        id: 'win95',
        name: 'Windows 95',
        colors: {
            face: '#c0c0c0',
            highlight: '#ffffff',
            shadow: '#808080',
            darkshadow: '#000000',
            text: '#000000',
            blue: '#000080',
            blueGrad: '#000080',
            inactive: '#808080',
            inactiveGrad: '#808080',
            select: '#000080',
            workspace: '#008080'
        }
    },
    {
        id: 'winxp',
        name: 'Windows XP (Luna)',
        colors: {
            face: '#ece9d8',
            highlight: '#ffffff',
            shadow: '#aca899',
            darkshadow: '#716f64',
            text: '#000000',
            blue: '#0054e3',
            blueGrad: '#27c1ff',
            inactive: '#7a96df',
            inactiveGrad: '#6375d6',
            select: '#316ac5',
            workspace: '#5d7ea3'
        }
    },
    {
        id: 'mac',
        name: 'Classic Mac (System 7)',
        colors: {
            face: '#ffffff',
            highlight: '#ffffff',
            shadow: '#888888',
            darkshadow: '#000000',
            text: '#000000',
            blue: '#000000',
            blueGrad: '#000000',
            inactive: '#aaaaaa',
            inactiveGrad: '#aaaaaa',
            select: '#000000',
            workspace: '#666666'
        }
    },
    {
        id: 'amiga',
        name: 'Amiga Workbench',
        colors: {
            face: '#aaaaaa',
            highlight: '#ffffff',
            shadow: '#555555',
            darkshadow: '#000000',
            text: '#000000',
            blue: '#0055aa',
            blueGrad: '#0055aa',
            inactive: '#555555',
            inactiveGrad: '#555555',
            select: '#ffffff',
            workspace: '#0055aa'
        }
    },
    {
        id: 'gm82',
        name: 'Modern Classic (GM 8.2)',
        colors: {
            face: '#f0f0f0',
            highlight: '#ffffff',
            shadow: '#c0c0c0',
            darkshadow: '#808080',
            text: '#222222',
            blue: '#4a6ea9',
            blueGrad: '#3b5998',
            inactive: '#a0a0a0',
            inactiveGrad: '#909090',
            select: '#5a7ebf',
            workspace: '#6a8caf'
        }
    },
    {
        id: 'dark',
        name: 'Dark Mode',
        colors: {
            face: '#2d2d2d',
            highlight: '#404040',
            shadow: '#1a1a1a',
            darkshadow: '#000000',
            text: '#e0e0e0',
            blue: '#444444',
            blueGrad: '#333333',
            inactive: '#3a3a3a',
            inactiveGrad: '#2a2a2a',
            select: '#505050',
            workspace: '#1e1e1e'
        }
    },
    {
        id: 'gms2',
        name: 'Studio Obsidian (GMS2)',
        colors: {
            face: '#282b30',
            highlight: '#3c3f45',
            shadow: '#1e2023',
            darkshadow: '#141618',
            text: '#a4a8ad',
            blue: '#1e2023', // Flat look
            blueGrad: '#1e2023',
            inactive: '#2f3136',
            inactiveGrad: '#2f3136',
            select: '#484b52',
            workspace: '#181a1d'
        }
    },
    {
        id: 'unity',
        name: 'Engine Gray (Unity)',
        colors: {
            face: '#383838',
            highlight: '#505050',
            shadow: '#252525',
            darkshadow: '#151515',
            text: '#b0b0b0',
            blue: '#2a2a2a',
            blueGrad: '#222222',
            inactive: '#303030',
            inactiveGrad: '#303030',
            select: '#4285f4',
            workspace: '#202020'
        }
    },
    {
        id: 'unreal',
        name: 'Slate Black (Unreal)',
        colors: {
            face: '#151515',
            highlight: '#2a2a2a',
            shadow: '#0a0a0a',
            darkshadow: '#000000',
            text: '#cccccc',
            blue: '#f5a623', // Orange accent
            blueGrad: '#d08b1b',
            inactive: '#333333',
            inactiveGrad: '#222222',
            select: '#202020',
            workspace: '#050505'
        }
    },
    {
        id: 'gm8_green',
        name: 'GM8 Classic Green',
        colors: {
            face: '#d4d0c8',      // Authentic Win98/XP Silver
            highlight: '#ffffff',
            shadow: '#808080',
            darkshadow: '#404040',
            text: '#000000',
            blue: '#1c5e1c',      // GM8 dark green title bar
            blueGrad: '#2d7a2d',  // GM8 lighter green gradient
            inactive: '#7b9e7b',  // GM8 inactive greyed-green
            inactiveGrad: '#699669',
            select: '#236623',    // Selection green
            workspace: '#4a774a'  // GM8 workspace green background
        }
    },
    {
        id: 'gms14_dark',
        name: 'GMS 1.4 Dark',
        colors: {
            face: '#2c3550',       // GMS 1.4 dark navy panel
            highlight: '#3d4f72',
            shadow: '#1a2035',
            darkshadow: '#0d1120',
            text: '#d0d8ee',
            blue: '#2a3a60',       // GMS 1.4 title bar dark blue
            blueGrad: '#1e2b4a',
            inactive: '#3a4a68',
            inactiveGrad: '#2f3d58',
            select: '#4a6aaa',     // GMS 1.4 selection blue
            workspace: '#151c30'   // Deep navy workspace
        }
    },
    {
        id: 'ghibli',
        name: '🌿 Ghibli Forest (غابة جيبلي)',
        colors: {
            face: '#e8dfc8',       // Warm parchment
            highlight: '#f5edd5',
            shadow: '#c4b89a',
            darkshadow: '#8b7355',
            text: '#3d2b1f',       // Dark brown text
            blue: '#4a7c59',       // Forest green title bar
            blueGrad: '#3a6347',
            inactive: '#8aab7a',
            inactiveGrad: '#749968',
            select: '#5a9e6f',     // Leaf green selection
            workspace: '#7aab6a'   // Meadow green workspace
        }
    },
    {
        id: 'neon_night',
        name: '🌙 Neon Night (ليل نيون)',
        colors: {
            face: '#1a1a2e',
            highlight: '#16213e',
            shadow: '#0f0f23',
            darkshadow: '#070715',
            text: '#e0e0ff',
            blue: '#7b2ff7',       // Purple neon title bar
            blueGrad: '#5a1fd4',
            inactive: '#3a1a6e',
            inactiveGrad: '#2a1050',
            select: '#9d4edd',     // Bright purple
            workspace: '#0d0d1a'
        }
    },
    {
        id: 'retro_handheld',
        name: '🎮 Retro Handheld (جيم بوي)',
        colors: {
            face: '#8bac0f',       // Game Boy green
            highlight: '#9bbc0f',
            shadow: '#306230',
            darkshadow: '#0f380f',
            text: '#0f380f',
            blue: '#0f380f',
            blueGrad: '#0f380f',
            inactive: '#306230',
            inactiveGrad: '#306230',
            select: '#0f380f',
            workspace: '#0f380f'
        }
    },
    {
        id: 'cyberpunk',
        name: 'Cyber-Pixel Dark',
        colors: {
            face: '#0d0221',      // Deep space black
            highlight: '#00f2ff',  // Neon Cyan
            shadow: '#540d6e',     // Electric Purple
            darkshadow: '#000000',
            text: '#00f2ff',       // Cyan text
            blue: '#ff0055',       // Neon Pink title bar
            blueGrad: '#2d0a4e',   // Deep purple gradient
            inactive: '#3a015c',
            inactiveGrad: '#0d0221',
            select: '#ff0055',     // Pink selection
            workspace: '#050110'   // Darkest background
        }
    }
];

export const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--win-face', theme.colors.face);
    root.style.setProperty('--win-highlight', theme.colors.highlight);
    root.style.setProperty('--win-shadow', theme.colors.shadow);
    root.style.setProperty('--win-darkshadow', theme.colors.darkshadow);
    root.style.setProperty('--win-text', theme.colors.text);
    root.style.setProperty('--win-blue', theme.colors.blue);
    root.style.setProperty('--win-blueGrad', theme.colors.blueGrad);
    root.style.setProperty('--win-inactive', theme.colors.inactive);
    root.style.setProperty('--win-inactiveGrad', theme.colors.inactiveGrad);
    root.style.setProperty('--win-select', theme.colors.select);
    root.style.setProperty('--win-workspace', theme.colors.workspace);
};
