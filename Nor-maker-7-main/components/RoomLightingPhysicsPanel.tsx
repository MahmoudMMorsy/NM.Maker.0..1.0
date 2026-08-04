import * as React from 'react';
import { useState } from 'react';
import { Sun, Moon, Lightbulb, Cloud, Plus, Trash2, Zap, Layers, Cog, Sparkles, Power } from 'lucide-react';
import {
  RoomSettings, RoomLighting, RoomPhysics, RoomPostProcess, RoomLight,
  DEFAULT_ROOM_LIGHTING, DEFAULT_ROOM_PHYSICS, DEFAULT_ROOM_POSTPROCESS
} from '../types';

interface Props {
  roomSettings: RoomSettings;
  onUpdate: (s: RoomSettings) => void;
}

const newId = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <fieldset className="border border-[#BFBFBF] p-2 mb-2 mx-1">
    <legend className="text-[10px] ml-1 px-1 -mt-2 bg-[#ECE9D8] flex items-center gap-1 font-bold">
      {icon} {title}
    </legend>
    {children}
  </fieldset>
);

const Row: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <div className="grid grid-cols-12 gap-1 items-center mb-1">
    <label className="col-span-5 text-[10px] text-right pr-1" title={hint}>{label}</label>
    <div className="col-span-7">{children}</div>
  </div>
);

const RoomLightingPhysicsPanel: React.FC<Props> = ({ roomSettings, onUpdate }) => {
  const [tab, setTab] = useState<'lighting' | 'physics' | 'post'>('lighting');

  const lighting: RoomLighting = roomSettings.lighting || DEFAULT_ROOM_LIGHTING;
  const physics: RoomPhysics = roomSettings.physics || DEFAULT_ROOM_PHYSICS;
  const post: RoomPostProcess = roomSettings.postProcess || DEFAULT_ROOM_POSTPROCESS;

  const updL = (patch: Partial<RoomLighting>) => onUpdate({ ...roomSettings, lighting: { ...lighting, ...patch } });
  const updP = (patch: Partial<RoomPhysics>) => onUpdate({ ...roomSettings, physics: { ...physics, ...patch } });
  const updPP = (patch: Partial<RoomPostProcess>) => onUpdate({ ...roomSettings, postProcess: { ...post, ...patch } });

  const addLight = (kind: RoomLight['kind']) => {
    const l: RoomLight = {
      id: newId('lt'),
      kind,
      color: '#ffffff',
      intensity: 1,
      enabled: true,
      castShadow: kind === 'directional' || kind === 'spot',
      ...(kind === 'point' || kind === 'spot' ? { position: [0, 100, 0], range: 300 } : {}),
      ...(kind === 'directional' ? { direction: [-0.5, -1, -0.3] } : {}),
      ...(kind === 'spot' ? { angle: Math.PI / 6, penumbra: 0.2 } : {}),
      ...(kind === 'hemisphere' ? { groundColor: '#444400' } : {}),
    };
    updL({ lights: [...lighting.lights, l] });
  };

  const updLight = (id: string, patch: Partial<RoomLight>) =>
    updL({ lights: lighting.lights.map(x => x.id === id ? { ...x, ...patch } : x) });
  const delLight = (id: string) =>
    updL({ lights: lighting.lights.filter(x => x.id !== id) });

  return (
    <div className="border border-gray-400 bg-white p-1">
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-300 mb-2">
        {([
          { k: 'lighting', l: 'Lighting', icon: <Sun size={11} /> },
          { k: 'physics', l: 'Physics', icon: <Zap size={11} /> },
          { k: 'post', l: 'Post-FX', icon: <Sparkles size={11} /> },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-2 py-1 text-[10px] font-bold flex items-center gap-1 border-r border-gray-300 ${tab === t.k ? 'bg-blue-100 text-blue-800 border-b-2 border-b-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t.icon}{t.l}
          </button>
        ))}
      </div>

      {/* ─────────── LIGHTING ─────────── */}
      {tab === 'lighting' && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <input type="checkbox" id="rs_lighting_en" checked={lighting.enabled}
              onChange={e => updL({ enabled: e.target.checked })} />
            <label htmlFor="rs_lighting_en" className="font-bold text-[11px] flex items-center gap-1">
              <Power size={11} className={lighting.enabled ? 'text-green-600' : 'text-gray-400'} />
              Enable Lighting (3D preview & runtime)
            </label>
          </div>

          <Section title="Sky & Ambient" icon={<Cloud size={10} className="text-blue-500" />}>
            <Row label="Sky Color"><input type="color" value={lighting.skyColor}
              onChange={e => updL({ skyColor: e.target.value })} className="w-full h-5 p-0 border border-gray-400" /></Row>
            <Row label="Ambient Color"><input type="color" value={lighting.ambientColor}
              onChange={e => updL({ ambientColor: e.target.value })} className="w-full h-5 p-0 border border-gray-400" /></Row>
            <Row label="Ambient Intensity">
              <div className="flex items-center gap-1">
                <input type="range" min="0" max="3" step="0.05" value={lighting.ambientIntensity}
                  onChange={e => updL({ ambientIntensity: parseFloat(e.target.value) })} className="flex-1" />
                <span className="text-[10px] font-mono w-8">{lighting.ambientIntensity.toFixed(2)}</span>
              </div>
            </Row>
            <Row label="Shadows">
              <input type="checkbox" checked={lighting.shadowsEnabled}
                onChange={e => updL({ shadowsEnabled: e.target.checked })} />
              <span className="text-[10px] ml-1 text-gray-600">Enable shadow rendering</span>
            </Row>
          </Section>

          <Section title="Sun (Time of Day)" icon={<Sun size={10} className="text-yellow-500" />}>
            <Row label="Sun Enabled">
              <input type="checkbox" checked={lighting.sunEnabled !== false}
                onChange={e => updL({ sunEnabled: e.target.checked })} />
            </Row>
            <Row label="Time of Day" hint="0=midnight, 6=sunrise, 12=noon, 18=sunset, 24=midnight">
              <div className="flex items-center gap-1">
                {((lighting.timeOfDay ?? 12) < 6 || (lighting.timeOfDay ?? 12) > 18)
                  ? <Moon size={10} className="text-indigo-500" />
                  : <Sun size={10} className="text-yellow-500" />}
                <input type="range" min="0" max="24" step="0.5" value={lighting.timeOfDay ?? 12}
                  onChange={e => updL({ timeOfDay: parseFloat(e.target.value) })} className="flex-1" />
                <span className="text-[10px] font-mono w-10">{(lighting.timeOfDay ?? 12).toFixed(1)}h</span>
              </div>
            </Row>
            <Row label="Sun Color"><input type="color" value={lighting.sunColor || '#fff4e0'}
              onChange={e => updL({ sunColor: e.target.value })} className="w-full h-5 p-0 border border-gray-400" /></Row>
            <Row label="Sun Intensity">
              <div className="flex items-center gap-1">
                <input type="range" min="0" max="5" step="0.05" value={lighting.sunIntensity ?? 1}
                  onChange={e => updL({ sunIntensity: parseFloat(e.target.value) })} className="flex-1" />
                <span className="text-[10px] font-mono w-8">{(lighting.sunIntensity ?? 1).toFixed(2)}</span>
              </div>
            </Row>
          </Section>

          <Section title="Atmospheric Fog" icon={<Cloud size={10} className="text-gray-500" />}>
            <Row label="Fog Enabled">
              <input type="checkbox" checked={lighting.fogEnabled}
                onChange={e => updL({ fogEnabled: e.target.checked })} />
            </Row>
            {lighting.fogEnabled && <>
              <Row label="Fog Color"><input type="color" value={lighting.fogColor}
                onChange={e => updL({ fogColor: e.target.value })} className="w-full h-5 p-0 border border-gray-400" /></Row>
              <Row label="Fog Near">
                <input type="number" min={0} value={lighting.fogNear}
                  onChange={e => updL({ fogNear: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-400 px-1 text-[11px]" />
              </Row>
              <Row label="Fog Far">
                <input type="number" min={1} value={lighting.fogFar}
                  onChange={e => updL({ fogFar: parseFloat(e.target.value) || 1000 })} className="w-full border border-gray-400 px-1 text-[11px]" />
              </Row>
            </>}
          </Section>

          <Section title={`Custom Lights (${lighting.lights.length})`} icon={<Lightbulb size={10} className="text-orange-500" />}>
            <div className="flex flex-wrap gap-1 mb-2">
              {(['ambient', 'directional', 'point', 'spot', 'hemisphere'] as const).map(k => (
                <button key={k} onClick={() => addLight(k)}
                  className="bg-blue-100 hover:bg-blue-200 border border-blue-400 px-2 py-0.5 text-[10px] flex items-center gap-1">
                  <Plus size={9} /> {k}
                </button>
              ))}
            </div>
            {lighting.lights.length === 0 && (
              <div className="text-[10px] text-gray-500 italic px-1">No custom lights. Sun + Ambient already provide basic illumination.</div>
            )}
            {lighting.lights.map(l => (
              <div key={l.id} className="border border-gray-300 rounded p-1 mb-1 bg-gray-50">
                <div className="flex items-center gap-1 mb-1">
                  <input type="checkbox" checked={l.enabled !== false} onChange={e => updLight(l.id, { enabled: e.target.checked })} />
                  <Lightbulb size={10} className="text-orange-600" />
                  <span className="font-bold text-[10px] flex-1 capitalize">{l.kind} light</span>
                  <input type="color" value={l.color} onChange={e => updLight(l.id, { color: e.target.value })}
                    className="w-6 h-4 p-0 border border-gray-400" />
                  <button onClick={() => delLight(l.id)} className="text-red-600 hover:bg-red-500 hover:text-white p-0.5 rounded">
                    <Trash2 size={10} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <label className="flex items-center gap-1">Intensity
                    <input type="number" step={0.1} min={0} max={10} value={l.intensity}
                      onChange={e => updLight(l.id, { intensity: parseFloat(e.target.value) || 0 })}
                      className="w-12 border border-gray-400 px-1" />
                  </label>
                  {(l.kind === 'point' || l.kind === 'spot') && (
                    <label className="flex items-center gap-1">Range
                      <input type="number" min={1} value={l.range || 300}
                        onChange={e => updLight(l.id, { range: parseFloat(e.target.value) || 300 })}
                        className="w-12 border border-gray-400 px-1" />
                    </label>
                  )}
                  {(l.kind !== 'ambient' && l.kind !== 'hemisphere') && (
                    <label className="flex items-center gap-1 col-span-2">Cast Shadow
                      <input type="checkbox" checked={!!l.castShadow}
                        onChange={e => updLight(l.id, { castShadow: e.target.checked })} />
                    </label>
                  )}
                </div>
                {l.position && (
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                      <label key={axis} className="text-[10px] flex items-center gap-1">{axis}
                        <input type="number" value={l.position![i]}
                          onChange={e => {
                            const np = [...l.position!] as [number, number, number];
                            np[i] = parseFloat(e.target.value) || 0;
                            updLight(l.id, { position: np });
                          }}
                          className="w-full border border-gray-400 px-1" />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Section>

          <div className="px-1 pt-1 text-[9px] text-gray-500 italic border-t border-gray-300 mt-1">
            ℹ️ These settings drive the 3D Camera Preview pane (📷 3D button)
            and the exported runtime's 3D scene.
          </div>
        </div>
      )}

      {/* ─────────── PHYSICS ─────────── */}
      {tab === 'physics' && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <input type="checkbox" id="rs_phys_en" checked={physics.enabled}
              onChange={e => updP({ enabled: e.target.checked })} />
            <label htmlFor="rs_phys_en" className="font-bold text-[11px] flex items-center gap-1">
              <Power size={11} className={physics.enabled ? 'text-green-600' : 'text-gray-400'} />
              Enable Physics World
            </label>
          </div>

          <Section title="Gravity" icon={<Zap size={10} className="text-purple-500" />}>
            <Row label="Gravity X">
              <input type="number" step={10} value={physics.gravityX}
                onChange={e => updP({ gravityX: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-400 px-1 text-[11px]" />
            </Row>
            <Row label="Gravity Y" hint="Positive = downward (px/s²). 980 ≈ Earth.">
              <input type="number" step={10} value={physics.gravityY}
                onChange={e => updP({ gravityY: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-400 px-1 text-[11px]" />
            </Row>
            <Row label="Gravity Z" hint="Used for 3D mode.">
              <input type="number" step={10} value={physics.gravityZ}
                onChange={e => updP({ gravityZ: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-400 px-1 text-[11px]" />
            </Row>
            <div className="flex flex-wrap gap-1 mt-1 px-1">
              <button onClick={() => updP({ gravityX: 0, gravityY: 980, gravityZ: 0 })}
                className="bg-blue-100 hover:bg-blue-200 border border-blue-400 px-2 py-0.5 text-[10px]">🌍 Earth</button>
              <button onClick={() => updP({ gravityX: 0, gravityY: 162, gravityZ: 0 })}
                className="bg-blue-100 hover:bg-blue-200 border border-blue-400 px-2 py-0.5 text-[10px]">🌙 Moon</button>
              <button onClick={() => updP({ gravityX: 0, gravityY: 0, gravityZ: 0 })}
                className="bg-blue-100 hover:bg-blue-200 border border-blue-400 px-2 py-0.5 text-[10px]">🚀 Zero-G</button>
              <button onClick={() => updP({ gravityX: 0, gravityY: 370, gravityZ: 0 })}
                className="bg-blue-100 hover:bg-blue-200 border border-blue-400 px-2 py-0.5 text-[10px]">🔴 Mars</button>
            </div>
          </Section>

          <Section title="Simulation" icon={<Cog size={10} className="text-gray-600" />}>
            <Row label="Pixels per Meter" hint="Scale used to convert world units to physics meters.">
              <input type="number" min={1} value={physics.pixelsPerMeter}
                onChange={e => updP({ pixelsPerMeter: parseFloat(e.target.value) || 32 })}
                className="w-full border border-gray-400 px-1 text-[11px]" />
            </Row>
            <Row label="Substeps" hint="More substeps = more stable (slower). 1..8.">
              <div className="flex items-center gap-1">
                <input type="range" min="1" max="8" value={physics.substeps}
                  onChange={e => updP({ substeps: parseInt(e.target.value) })} className="flex-1" />
                <span className="text-[10px] font-mono w-6">{physics.substeps}</span>
              </div>
            </Row>
            <Row label="Linear Damping">
              <div className="flex items-center gap-1">
                <input type="range" min="0" max="1" step="0.01" value={physics.linearDamping}
                  onChange={e => updP({ linearDamping: parseFloat(e.target.value) })} className="flex-1" />
                <span className="text-[10px] font-mono w-10">{physics.linearDamping.toFixed(2)}</span>
              </div>
            </Row>
            <Row label="Angular Damping">
              <div className="flex items-center gap-1">
                <input type="range" min="0" max="1" step="0.01" value={physics.angularDamping}
                  onChange={e => updP({ angularDamping: parseFloat(e.target.value) })} className="flex-1" />
                <span className="text-[10px] font-mono w-10">{physics.angularDamping.toFixed(2)}</span>
              </div>
            </Row>
            <Row label="Allow Sleep">
              <input type="checkbox" checked={physics.allowSleep}
                onChange={e => updP({ allowSleep: e.target.checked })} />
              <span className="text-[10px] ml-1 text-gray-600">Better perf for inactive bodies</span>
            </Row>
          </Section>

          <Section title="World Bounds" icon={<Layers size={10} className="text-red-500" />}>
            <Row label="Enabled">
              <input type="checkbox" checked={physics.worldBoundsEnabled !== false}
                onChange={e => updP({ worldBoundsEnabled: e.target.checked })} />
              <span className="text-[10px] ml-1 text-gray-600">Auto-destroy bodies outside</span>
            </Row>
            <Row label="Margin (px)">
              <input type="number" min={0} value={physics.worldBoundsMargin || 200}
                onChange={e => updP({ worldBoundsMargin: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-400 px-1 text-[11px]" />
            </Row>
          </Section>

          <div className="px-1 pt-1 text-[9px] text-gray-500 italic border-t border-gray-300 mt-1">
            ℹ️ Per-object physics bodies (static/kinematic/dynamic, mass, friction…)
            are configured on each Object via its Physics tab.
          </div>
        </div>
      )}

      {/* ─────────── POST-PROCESS ─────────── */}
      {tab === 'post' && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <input type="checkbox" id="rs_pp_en" checked={post.enabled}
              onChange={e => updPP({ enabled: e.target.checked })} />
            <label htmlFor="rs_pp_en" className="font-bold text-[11px] flex items-center gap-1">
              <Power size={11} className={post.enabled ? 'text-green-600' : 'text-gray-400'} />
              Enable Post-Processing
            </label>
          </div>

          <Section title="Tone Mapping" icon={<Sparkles size={10} className="text-yellow-500" />}>
            <Row label="Mode">
              <select value={post.toneMapping} onChange={e => updPP({ toneMapping: e.target.value as any })}
                className="w-full border border-gray-400 px-1 py-0.5 text-[11px] bg-white">
                <option value="none">None (linear)</option>
                <option value="reinhard">Reinhard</option>
                <option value="aces">ACES Filmic (default)</option>
                <option value="cineon">Cineon</option>
              </select>
            </Row>
            <Row label="Exposure">
              <div className="flex items-center gap-1">
                <input type="range" min="0" max="3" step="0.01" value={post.exposure}
                  onChange={e => updPP({ exposure: parseFloat(e.target.value) })} className="flex-1" />
                <span className="text-[10px] font-mono w-10">{post.exposure.toFixed(2)}</span>
              </div>
            </Row>
          </Section>

          <Section title="Effects" icon={<Sparkles size={10} className="text-pink-500" />}>
            <Row label="Bloom">
              <input type="checkbox" checked={post.bloom} onChange={e => updPP({ bloom: e.target.checked })} />
            </Row>
            {post.bloom && (
              <Row label="Bloom Strength">
                <div className="flex items-center gap-1">
                  <input type="range" min="0" max="3" step="0.05" value={post.bloomStrength}
                    onChange={e => updPP({ bloomStrength: parseFloat(e.target.value) })} className="flex-1" />
                  <span className="text-[10px] font-mono w-10">{post.bloomStrength.toFixed(2)}</span>
                </div>
              </Row>
            )}
            <Row label="Vignette">
              <input type="checkbox" checked={post.vignette} onChange={e => updPP({ vignette: e.target.checked })} />
            </Row>
            <Row label="Chromatic Aberration">
              <input type="checkbox" checked={post.chromaticAberration} onChange={e => updPP({ chromaticAberration: e.target.checked })} />
            </Row>
            <Row label="Pixelize (retro)">
              <input type="checkbox" checked={post.pixelize} onChange={e => updPP({ pixelize: e.target.checked })} />
            </Row>
            {post.pixelize && (
              <Row label="Pixel Size">
                <div className="flex items-center gap-1">
                  <input type="range" min="1" max="8" step="1" value={post.pixelSize}
                    onChange={e => updPP({ pixelSize: parseInt(e.target.value) })} className="flex-1" />
                  <span className="text-[10px] font-mono w-6">{post.pixelSize}</span>
                </div>
              </Row>
            )}
          </Section>
        </div>
      )}
    </div>
  );
};

export default RoomLightingPhysicsPanel;
