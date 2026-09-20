// utils/soundEngine.ts
// محرك صوت حقيقي يحل محل الـ placeholder WAVs الفارغة
// يدعم: تشغيل assets من base64/blob، procedural SFX، موسيقى looped
// مبني فوق Web Audio API بدون dependencies

export interface SoundEngineState {
  masterVolume: number;   // 0..1
  sfxVolume:    number;   // 0..1
  musicVolume:  number;   // 0..1
  muted:        boolean;
}

class NORSoundEngine {
  private ctx:          AudioContext | null = null;
  private masterGain:   GainNode | null     = null;
  private sfxGain:      GainNode | null     = null;
  private musicGain:    GainNode | null     = null;
  private musicSource:  AudioBufferSourceNode | null = null;
  private bufferCache:  Map<string, AudioBuffer>     = new Map();
  private state: SoundEngineState = {
    masterVolume: 1.0,
    sfxVolume:    0.8,
    musicVolume:  0.5,
    muted:        false,
  };

  // Lazy init — Web Audio API لا تُشغَّل إلا بعد user gesture
  private async getCtx(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx        = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.sfxGain    = this.ctx.createGain();
      this.musicGain  = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  private applyVolumes(): void {
    if (!this.masterGain || !this.sfxGain || !this.musicGain) return;
    const m = this.state.muted ? 0 : this.state.masterVolume;
    this.masterGain.gain.setTargetAtTime(m,                                  this.ctx!.currentTime, 0.01);
    this.sfxGain.gain.setTargetAtTime(this.state.sfxVolume,                  this.ctx!.currentTime, 0.01);
    this.musicGain.gain.setTargetAtTime(this.state.musicVolume,              this.ctx!.currentTime, 0.01);
  }

  // --- تحميل asset من data URL أو blob URL ---
  async loadSoundAsset(id: string, src: string): Promise<boolean> {
    if (!src || src.includes('AAAA') || src.length < 50) {
      // placeholder فارغ — نتجاهله
      return false;
    }
    try {
      const ctx = await this.getCtx();
      if (this.bufferCache.has(id)) return true;

      let arrayBuffer: ArrayBuffer;
      if (src.startsWith('data:')) {
        const base64 = src.split(',')[1];
        const binary  = atob(base64);
        arrayBuffer   = new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i)).buffer;
      } else if (src.startsWith('blob:')) {
        arrayBuffer = await fetch(src).then(r => r.arrayBuffer());
      } else {
        return false;
      }

      const buffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(id, buffer);
      return true;
    } catch (e) {
      console.warn(`[NOR Audio] فشل تحميل "${id}":`, e);
      return false;
    }
  }

  // --- تشغيل SFX (one-shot) ---
  async playSFX(id: string): Promise<void> {
    const buf = this.bufferCache.get(id);
    if (!buf) {
      // fallback: procedural beep
      await this.proceduralSFX(id);
      return;
    }
    const ctx = await this.getCtx();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.sfxGain!);
    src.start();
  }

  // --- Procedural SFX بديل للأصوات الفارغة ---
  private async proceduralSFX(hint: string): Promise<void> {
    const ctx = await this.getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(this.sfxGain!);

    // تحديد الصوت بناءً على اسم الـ asset
    const name = hint.toLowerCase();
    if (name.includes('jump')) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      env.gain.setValueAtTime(0.3, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (name.includes('hit') || name.includes('hurt')) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      env.gain.setValueAtTime(0.4, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (name.includes('coin') || name.includes('item') || name.includes('collect')) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.05);
      env.gain.setValueAtTime(0.25, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
    } else if (name.includes('shoot') || name.includes('bullet') || name.includes('fire')) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      env.gain.setValueAtTime(0.2, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (name.includes('death') || name.includes('die') || name.includes('dead')) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.5);
      env.gain.setValueAtTime(0.3, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (name.includes('win') || name.includes('goal') || name.includes('level')) {
      // fanfare صغير
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'square'; o2.frequency.value = freq;
        g2.gain.setValueAtTime(0.2, now + i * 0.1);
        g2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.18);
        o2.connect(g2); g2.connect(this.sfxGain!);
        o2.start(now + i * 0.1); o2.stop(now + i * 0.1 + 0.18);
      });
      return;
    } else {
      // beep افتراضي
      osc.type = 'square';
      osc.frequency.value = 440;
      env.gain.setValueAtTime(0.2, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    }
  }

  // --- تشغيل موسيقى (looped) ---
  async playMusic(id: string, loop: boolean = true): Promise<void> {
    this.stopMusic();
    const buf = this.bufferCache.get(id);
    if (!buf) return;
    const ctx = await this.getCtx();
    this.musicSource          = ctx.createBufferSource();
    this.musicSource.buffer   = buf;
    this.musicSource.loop     = loop;
    this.musicSource.connect(this.musicGain!);
    this.musicSource.start();
  }

  stopMusic(): void {
    if (this.musicSource) {
      try { this.musicSource.stop(); } catch {}
      this.musicSource.disconnect();
      this.musicSource = null;
    }
  }

  // --- تحكم في الصوت ---
  setMasterVolume(v: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }
  setSFXVolume(v: number): void {
    this.state.sfxVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }
  setMusicVolume(v: number): void {
    this.state.musicVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }
  toggleMute(): boolean {
    this.state.muted = !this.state.muted;
    this.applyVolumes();
    return this.state.muted;
  }
  getState(): Readonly<SoundEngineState> { return { ...this.state }; }

  // --- تنظيف الـ cache عند فتح مشروع جديد ---
  clearCache(): void {
    this.stopMusic();
    this.bufferCache.clear();
  }

  // --- batch load كل أصوات المشروع ---
  async loadProjectSounds(sounds: { id: string; src: string }[]): Promise<void> {
    await Promise.allSettled(sounds.map(s => this.loadSoundAsset(s.id, s.src)));
  }
}

// Singleton — instance واحدة للتطبيق كله
export const SoundEngine = new NORSoundEngine();

// --- الـ script الـ inline اللي يُحقن داخل الـ iframe اللعبة ---
// بيتكلم مع المحرر عبر postMessage أو يستخدم Web Audio مباشرةً
export const GAME_AUDIO_SCRIPT = `
(function() {
  const _audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
  const _masterGain = _audioCtx.createGain(); _masterGain.connect(_audioCtx.destination);
  const _sfxGain   = _audioCtx.createGain(); _sfxGain.connect(_masterGain);
  const _musGain   = _audioCtx.createGain(); _musGain.connect(_masterGain);
  _sfxGain.gain.value = 0.8; _musGain.gain.value = 0.5;
  let _musSource = null;
  const _buffers  = {};
  let _musicInterval = null;
  let _musicStep = 0;

  function _playProceduralMusic(id) {
    if (_musicInterval) { clearInterval(_musicInterval); _musicInterval = null; }
    _musicStep = 0;
    const n = (id || '').toLowerCase();
    let melody = [261, 329, 392, 523, 392, 329, 261, 392];
    let bass = [130, 130, 164, 164, 196, 196, 130, 196];
    let tempo = 150;
    if (n.includes('battle') || n.includes('fight') || n.includes('boss')) {
      melody = [220, 220, 261, 220, 293, 220, 329, 293];
      bass = [110, 110, 130, 110, 146, 110, 164, 146];
      tempo = 120;
    } else if (n.includes('rpg') || n.includes('adventure') || n.includes('theme') || n.includes('music') || n.includes('classic')) {
      melody = [261, 293, 329, 392, 440, 392, 329, 293, 329, 392, 440, 523, 440, 392, 329, 293];
      bass = [130, 130, 146, 146, 164, 164, 196, 196, 130, 130, 146, 146, 164, 164, 196, 196];
      tempo = 180;
    } else if (n.includes('runner') || n.includes('racing') || n.includes('speed')) {
      melody = [293, 349, 440, 587, 523, 440, 349, 293];
      bass = [146, 146, 174, 174, 220, 220, 146, 220];
      tempo = 110;
    }
    _musicInterval = setInterval(() => {
      if (_audioCtx.state === 'suspended') return;
      const t = _audioCtx.currentTime;
      const oB = _audioCtx.createOscillator();
      const gB = _audioCtx.createGain();
      oB.type = 'triangle';
      oB.frequency.setValueAtTime(bass[_musicStep % bass.length], t);
      gB.gain.setValueAtTime(0.06, t);
      gB.gain.exponentialRampToValueAtTime(0.001, t + tempo/1000 * 0.9);
      oB.connect(gB); gB.connect(_musGain);
      oB.start(t); oB.stop(t + tempo/1000 * 0.9);
      if (_musicStep % 2 === 0) {
        const oM = _audioCtx.createOscillator();
        const gM = _audioCtx.createGain();
        oM.type = 'square';
        oM.frequency.setValueAtTime(melody[Math.floor(_musicStep / 2) % melody.length], t);
        gM.gain.setValueAtTime(0.03, t);
        gM.gain.exponentialRampToValueAtTime(0.001, t + tempo/1000 * 1.8);
        oM.connect(gM); gM.connect(_musGain);
        oM.start(t); oM.stop(t + tempo/1000 * 1.8);
      }
      _musicStep++;
    }, tempo);
  }

  async function _decode(src) {
    if (!src || src.length < 50) return null;
    try {
      if (_audioCtx.state === 'suspended') await _audioCtx.resume();
      let ab;
      if (src.startsWith('data:')) {
        const b64 = src.split(',')[1];
        const bin = atob(b64);
        ab = new Uint8Array(bin.length).map((_,i)=>bin.charCodeAt(i)).buffer;
      } else if (src.startsWith('blob:')) {
        ab = await fetch(src).then(r=>r.arrayBuffer());
      } else return null;
      return await _audioCtx.decodeAudioData(ab);
    } catch { return null; }
  }

  function _beep(freq=440, type='square', dur=0.1, vol=0.2) {
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    const o = _audioCtx.createOscillator();
    const g = _audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, _audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + dur);
    o.connect(g); g.connect(_sfxGain);
    o.start(); o.stop(_audioCtx.currentTime + dur);
  }

  window.NOR_Audio = {
    load: async function(id, src) { _buffers[id] = await _decode(src); },
    play: function(id, loop) {
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      if (loop) {
        if (_musSource) { try{_musSource.stop()}catch{} }
        if (_musicInterval) { clearInterval(_musicInterval); _musicInterval = null; }
        const buf = _buffers[id];
        if (!buf) {
          _playProceduralMusic(id);
          return;
        }
        _musSource = _audioCtx.createBufferSource();
        _musSource.buffer = buf; _musSource.loop = true;
        _musSource.connect(_musGain); _musSource.start();
      } else {
        const buf = _buffers[id];
        if (buf) {
          const s = _audioCtx.createBufferSource();
          s.buffer = buf; s.connect(_sfxGain); s.start();
        } else {
          const n = (id||'').toLowerCase();
          if (n.includes('jump'))   _beep(400,'square',0.15,0.25);
          else if (n.includes('hit') || n.includes('hurt')) _beep(150,'sawtooth',0.2,0.3);
          else if (n.includes('coin') || n.includes('item')) _beep(880,'sine',0.1,0.2);
          else if (n.includes('shoot')) _beep(600,'square',0.08,0.15);
          else if (n.includes('death') || n.includes('die')) _beep(200,'sawtooth',0.4,0.25);
          else _beep(440,'square',0.05,0.15);
        }
      }
    },
    stop: function() {
      if(_musSource){try{_musSource.stop()}catch{}; _musSource=null;}
      if(_musicInterval){clearInterval(_musicInterval); _musicInterval=null;}
    },
    setVol: function(m,s,mu) {
      _masterGain.gain.value = m ?? _masterGain.gain.value;
      _sfxGain.gain.value   = s  ?? _sfxGain.gain.value;
      _musGain.gain.value   = mu ?? _musGain.gain.value;
    }
  };

  // ربط بـ GML functions الموجودة
  window.audio_play_sound = function(snd, pri, loop) {
    const id = typeof snd === 'object' ? snd?.id : snd;
    window.NOR_Audio.play(id, !!loop);
  };
  window.audio_stop_sound = function() { window.NOR_Audio.stop(); };
  window.audio_set_master_volume = function(v) { window.NOR_Audio.setVol(v,null,null); };
})();
`;
