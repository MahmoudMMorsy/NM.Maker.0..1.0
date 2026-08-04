import { useState, useCallback } from 'react';
import { SpriteAsset, BackgroundAsset, SoundAsset, FontAsset, ScriptAsset, GameObject, UIMenu, RoomData } from '../types';
import { CustomTiles } from '../utils/nesAssembler';
import { TileDefinition, DEFAULT_TILES } from '../components/TilesetEditor';

function useUniqueState<T extends { id: string }>(initial: T[]) {
  const [state, setState] = useState<T[]>(initial);

  const setUniqueState = useCallback((value: T[] | ((prev: T[]) => T[])) => {
    setState(prev => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;
      if (!Array.isArray(next)) return next;
      const seen = new Set<string>();
      return next.filter((item: T) => {
        if (!item || !item.id) return true;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    });
  }, []);

  return [state, setUniqueState] as const;
}

export const useAssetsManager = () => {
  const [sprites, setSprites] = useUniqueState<SpriteAsset>([]);
  const [backgroundAssets, setBackgroundAssets] = useUniqueState<BackgroundAsset>([]);
  const [soundAssets, setSoundAssets] = useUniqueState<SoundAsset>([]);
  const [fontAssets, setFontAssets] = useUniqueState<FontAsset>([]);
  const [scripts, setScripts] = useUniqueState<ScriptAsset>([]);
  const [customTiles, setCustomTiles] = useState<CustomTiles>({});
  const [customTileDefs, setCustomTileDefs] = useState<TileDefinition[]>(DEFAULT_TILES);
  const [gameObjects, setGameObjects] = useUniqueState<GameObject>([]);
  const [rooms, setRooms] = useUniqueState<RoomData>([]);
  const [uiMenus, setUiMenus] = useUniqueState<UIMenu>([]);

  return {
    sprites, setSprites,
    backgroundAssets, setBackgroundAssets,
    soundAssets, setSoundAssets,
    fontAssets, setFontAssets,
    scripts, setScripts,
    customTiles, setCustomTiles,
    customTileDefs, setCustomTileDefs,
    gameObjects, setGameObjects,
    rooms, setRooms,
    uiMenus, setUiMenus
  };
};
