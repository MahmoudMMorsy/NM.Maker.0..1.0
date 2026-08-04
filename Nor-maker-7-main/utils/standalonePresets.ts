import { SpriteAsset, GameObject, RoomData, BackgroundAsset } from '../types';

// ==========================================
//   GORGEOUS RETRO PIXEL ART BASE64 ASSETS
// ==========================================

// P1 Blue Knight Hero (16x16)
const PLAYER_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAbUlEQVR4nGNgQAP/rzP8B2F0caLA+Rt3/qNjijSTZAhM8f8ze+AYmwE4vQhTrKioCNYMotENwOkyfM7H5goMbylO+/yfECZoANj5WDTCxLG5lnouIGQItgCnyACsgKKEhC+6iDIEnyL6GEAJAABRpGD9+ObqpQAAAABJRU5ErkJggg==';

// P2 Red-Orange Knight Hero (16x16)
const COOP_PLAYER_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAbElEQVR4nGNgQAP/rzP8B2F0caLA+Rt3/qNjijSTZAhM8f8ze+AYmwE4vQhTrKioCNYMotENwOkyfM7H5goMb31xNvtPCBM0ACSITSNMHJtrqecCQoZgC3CKDMAKKEpI+KKLKEPwKaKPAZQAADusV7J/nJhVAAAAAElFTkSuQmCC';

// Medieval Dark Stone Brick with highlight lines (16x16)
const GROUND_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAUUlEQVR4nGOYsGTdf3IxCDCAGObu/mRhkF64AaTajtUAUmzGaQCxNuM1gBibCRpAyGaiDIABsg2gyAUUhQFFsUBROqAoJVKUFyjBDLB4JhcDAIoMdy2sj3XwAAAAAElFTkSuQmCC';

// Glowing Red Lava/Demon Block (16x16)
const LAVA_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAbElEQVR4nGNQVFT8TwlmABFfnM3geLuMDF6MrBbFABAgZAhMHqYWqwtwGYJNDdwAXArwaQaJoxiATeH/6wxgjMtgDANQ/AnVjG4IslqsBoAwumYYRldHGwMo8gJFgUhRNFKckKialMnKTJRgAE17Fn+R6i1aAAAAAElFTkSuQmCC';

// Green Slime Monster / Ghost (16x16)
const ENEMY_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAATUlEQVR4nGNgwAF81gf8R8a41BHUSJJBhDTjNYRYzVgNQZYAAUVFRQwN2MSpYwCpTsfwyqgBmAYgByx6LGFN4tgSBrbUhk0NNnVDEAAA/9hxeJHgBMUAAAAASUVORK5CYII=';

// Shimmering Golden Coin (16x16)
const ITEM_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAaUlEQVR4nK2TwQ0AIQgEaYUC7P9rFxbjw/sZNcsuXtyEnzMJAmYg7j5QobcQHM1gUdEGrglEHAZQryWWTIGAV8kUsJ4jeJMwAYOlQMFUkIFDQRaGH6lgOIVzEhlYL9Mt/OQWkOj6Gv/kAzKr6gsocwHRAAAAAElFTkSuQmCC';

// Shiny Red Heart for Health Powerup (16x16)
const HEART_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAVUlEQVR4nGNgoBb44mz2H4ZJlkeWxKYIrzxMAAbQFWHTjGIILs3EYBQDSNWMYgC5GG8gEa2ZKgaQaghRiYlkzcQYQlAzPkOI1ozNEJI1IxtCtmZiAQBVb1OsWzwjsQAAAABJRU5ErkJggg==';

// Dungeon Gold Key (16x16)
const KEY_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAUklEQVR4nGNgwAIUFRX/I2NsanACkIb/1xlQMNGGoGiGAVIMgRuApBHGJs0Acl2AYQipmrEZQrJmGIAZQJbmwWUA2WFBNQNI0kQTF1CUmIjJ0gDOhLtfkdUJQwAAAABJRU5ErkJggg==';

// Iron-bound Oakwood Prison Door (16x16)
const DOOR_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASUlEQVR4nGPozUv+TwlmABF26spkYRQDSLUZqwHnb9whCuM1ANl56DaCMO0NoMgLo4GI6oX/1xnAmOxAhBlAdCBSlBcozo2UYABKg1x5AJKZkwAAAABJRU5ErkJggg==';

// Mystic Swirling Portal/Trophy Goal (16x16)
const GOAL_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWUlEQVR4nGNgQANz1Df8x4fR1WNoZHj6Hy/GahC6Rpy2o6nBMICQK5Dl4QagCOBxBYbtMBrdAIKBSIwB+LxAtAHogP4GUOQFigKR5GikOCFRJSlTnJkoyc4AmLRcU1vGu94AAAAASUVORK5CYII=';

// Glowing Magic Cyan Bullet (16x16)
const BULLET_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAATElEQVR4nGNgoBl4+v8/CiZVIzogzqCnWDSgGYjbkKcEbEIyCLsheCUJqSFGM161w8AAYg0hOhbIikYkQ8hLSFhsIj0pYzGIdI0kAgAIVjhQDWeiEgAAAABJRU5ErkJggg==';

// Medieval Epic Blue Castle (32x32)
const CASTLE_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA9UlEQVR4nNWWsQ0CMQxFs0qWgAEoKFmNIahZhRIKxqC/E4eCgrFj++PcHZEsIf7/9pMTIVICzmO3GRAt5DwHlPJo4RCIFnYut7s4pKWZGteleVCN7U0NnLGle7WP3vWXOeepqJF6pKatrNT7y0CNkocbbsmKAIttYPE3sAqA4+k8cKV5UI32nkzb/eEt1p/rkjxaltPZDaAQSE68grk2Yb4CDcILA11B1CaaG/gVIgxgjk2oAOjj8mRMP0TWht0AvOvtAuAZ3A3AOjgUgP5BKaUNl3IQAD0FoFVSDge4plcJjdDcHwEoq0Rz8CO0AIQ8wt61CoARGDVrj/OPdWIAAAAASUVORK5CYII=';

// Spiky Dark Obsidian Enemy Castle (32x32)
const ENEMY_CASTLE_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA80lEQVR4nNWWzQ2DMAyFMwiXLNEO0EOPHbejsEjvqUCKFIJ/Xx2gkSxVvGf7k2NRUgLOe5oKooWcpUENjxYOgWhhJ+fMNpE0U+E2NA+qkbV7A2WUdK+2qd0+rEvUG3sPV1TK5WrvDL2R81DNLbkswGkTOH0HLgFwf74KFZoH1fraq2m5nyq2v9vgPFoupZMTQCGQPPYKjpqE+Qo0CC8MdAVRkxAn8CtEGMARk1AB0OXy5JheRNaCwwC84x0C4Gk8DMDaOBRA+s+XmnN5EMDncdsE9eVEfUlReTBAmdMaXCE0738AtFGiefASWgBClnB0XALgCxQMWGZr1c0aAAAAAElFTkSuQmCC';

// Chibi Allied Soldier with spear (16x16)
const SOLDIER_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAa0lEQVR4nGNgIBH8v87wH6+C8zfu/IdhUuQwFOAzBK/m/2f2wDE2QwgaoKioCNYMotENwOkybE7H5RWsLlCc9vk/IUzQALDzsWiEiVPFBXijkRjn440Fig0gJgZwGoBPMVHRiC99U90AqgMAYjZmhp8n9uUAAAAASUVORK5CYII=';

// Angry Green Enemy Orc (16x16)
const ORC_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAXElEQVR4nGNgoDY4f+POf2RMkWaSDQEp9lkfgIJJMgCmSVFREYUm2QB0TJRm6TiF//gwQc0gm7BphIlTZDtBAwgZQnEYEGWAubv/f1yYJM3EiOM0gFQ56hlACQAA6p+zyZDnHK0AAAAASUVORK5CYII=';

// High-tech Glowing Cyan Paddle (32x8)
const PADDLE_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAICAYAAACYhf2vAAAAMElEQVR4nGNgePr//4BiEDFQAMUB9PY5VgcoKirSHKNaDgKDyQEDGgUDAeAOGEgMAOpm3Mu5/u5UAAAAAElFTkSuQmCC';

// Bright Neon White Energy Ball (8x8)
const BALL_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAI0lEQVR4nGNggIGn//+jYBQAFEAHCEVYJFEV0UEBQUcS8CYAaqO5PSmAubcAAAAASUVORK5CYII=';

// Classic Arcade Wall Brick with yellow highlight lines (16x16)
const BRICK_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAPElEQVR4nGP44mz2n1wMAgwwBjkApBduADm2YxigqKhIFMZrACGbRw0YEgZQlA4oSokU5QVKMAM5zkfGADcKmgtmxtvrAAAAAElFTkSuQmCC';

// Deep Starry Galactic Sky (32x32)
const SKY_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAh0lEQVR4nGNQVFT8P5CYAUSAALEa5qhvoL4DiLUYhkm1BJ8HiXYALXyP1wGkRAtdooCaGNlzNHEAKVFFtgNwRRGpiXXwhAAtUjjRDqAkj1PFAYRCgJZZkqppgByHDkg5MOqAweeA0fbAQPkerwNG2wOU4NH2wGh7gGQHEAqB0fYAXaJgxDoAAKKbzJjSLgZ3AAAAAElFTkSuQmCC';

// Endless Runner Player Dino/Fox (32x32)
const RUNNER_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAnElEQVR4nO2WwQ2AIAxFWaUjuZ1befXg2TVQY2IIoGlpKZXQ5F9o4L1ADzj3h/Kz829pCq8ugYFXk3gOPwsAUmhmXR5OFBCToFy9qsA+3VGZhRw4jtogYgTEoSU3wBb5elsMnCXBmXy2hDScLBFu4AKbPkURcAiYEyiVEIObEKBKiMNNCmB7/Qgs6+bDYHt9CFy/3TiYXj8CozTrAPlRnoQU4M3pAAAAAElFTkSuQmCC';

// Desert Spikey Cactus Obstacle (16x32)
const CACTUS_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAgCAYAAAAbifjMAAAAYUlEQVR4nGNgwAF81gf8R8a41BGlmWRDQIql4xTgGmFs2rkAXRE+F2AYiM0WfC7AEEO3jVgXwMUG3gX4bCSE8UYdNheQHKVkp0b6p8RRF4y6YNQFg9UFIIDuApI0D60wAABl1RJv4+flzQAAAABJRU5ErkJggg==';

// Cave Flying Winged Bat Obstacle (32x16)
const BAT_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAAbElEQVR4nGNgGAVQoKio+B8Z09VsdAXUdARBs3EpoIYjiDKbkCJyHUK0ucQqRHcIPj7J5pHqCGphsoKMJpbT2xFUSTw0sZxYh4AAMWJkWUyMI0h1AFmWExMSVA1ychzxxdkMjGlqOSFHUGo5AAo4g0pJ6yIEAAAAAElFTkSuQmCC';


export const getStandaloneAssets = () => ({
  player: PLAYER_B64,
  playerCoop: COOP_PLAYER_B64,
  ground: GROUND_B64,
  lava: LAVA_B64,
  enemy: ENEMY_B64,
  item: ITEM_B64,
  runner: RUNNER_B64,
  cactus: CACTUS_B64,
  bat: BAT_B64,
  coin_gold: ITEM_B64,
  heart: HEART_B64,
  sky: SKY_B64,
  key: KEY_B64,
  door: DOOR_B64,
  goal: GOAL_B64,
  bullet: BULLET_B64,
  soldier: SOLDIER_B64,
  orc: ORC_B64,
  castle: CASTLE_B64,
  enemy_castle: ENEMY_CASTLE_B64,
  paddle: PADDLE_B64,
  ball: BALL_B64,
  brick: BRICK_B64
});

export const getStarterLevel = (): RoomData => ({
  id: 'rm_starter',
  width: 16,
  height: 15,
  map: [
    ...new Array(16 * 10).fill(0), // empty top
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
  ],
  settings: {
    name: 'rm_starter',
    caption: 'Starter Room',
    speed: 30,
    lives: 3,
    persistent: false,
    clearView: true,
    creationCode: '',
    tileAnimSpeed: 250,
    enableViews: false,
    snapX: 16,
    snapY: 16,
    bgColor: '#111122',
    drawBgColor: true
  },
  backgrounds: Array(8).fill(null).map(() => ({ visible: false, foreground: false, source: null, tileH: true, tileV: true, stretch: false, x: 0, y: 0, hspeed: 0, vspeed: 0 })),
  views: Array(8).fill(null).map(() => ({ visible: false, viewX: 0, viewY: 0, viewW: 256, viewH: 240, portX: 0, portY: 0, portW: 256, portH: 240, followObj: null, hBorder: 32, vBorder: 32, hSpeed: -1, vSpeed: -1 }))
});
