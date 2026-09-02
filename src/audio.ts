import { CUES, THEMES, STIPS, type Cue, type CueEv, type StipEv } from './bgm-cues';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  private bgmTimer = 0;
  private step = 0;
  private mode: 'title' | 'battle' | 'boss' | 'none' = 'none';
  private lastStage = 0;
  private lastBossKind = '';
  private cueId = '';
  private cue: Cue | null = null;
  private beatPos = 0;
  private evIdx = 0;
  private themeId = '';
  private themeCue: Cue | null = null;
  private themeMix: 'full' | 'thin' = 'full';
  private themeBeat = 0;
  private themeEvIdx = 0;
  private noiseBuf: AudioBuffer | null = null;
  muteSfx = false;
  muteBgm = false;

  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.9;
      this.sfxBus.connect(this.master);
      this.bgmBus = this.ctx.createGain();
      this.bgmBus.gain.value = 0.22;
      this.bgmBus.connect(this.master);
    }
    void this.ctx.resume();
    this.applyMute();
  }

  applyMute(): void {
    if (this.sfxBus) this.sfxBus.gain.value = this.muteSfx ? 0 : 0.9;
    if (this.bgmBus) this.bgmBus.gain.value = this.muteBgm ? 0 : 0.22;
  }

  setMode(mode: 'title' | 'battle' | 'boss' | 'none', tag?: number | string): void {
    this.mode = mode;
    if (mode === 'battle' && typeof tag === 'number') this.lastStage = tag;
    if (mode === 'boss' && tag !== undefined) this.lastBossKind = String(tag);
    const next = this.resolveCue(mode);
    if (next !== this.cueId) {
      this.cueId = next;
      this.cue = CUES[next] ?? null;
      this.beatPos = 0;
      this.evIdx = 0;
      this.step = 0;
      this.bgmTimer = 0;
    }
  }

  setTheme(char: 'sword' | 'gun' | 'mage' | null, mix: 'full' | 'thin' = 'full'): void {
    const nextId = char ?? '';
    if (nextId === this.themeId && mix === this.themeMix) return;
    this.themeId = nextId;
    this.themeMix = mix;
    this.themeCue = char ? THEMES[char] ?? null : null;
    this.themeBeat = 0;
    this.themeEvIdx = 0;
  }

  update(dt: number): void {
    if (!this.ctx || !this.bgmBus || this.mode === 'none') return;
    if (this.cue) this.seqUpdate(dt);
    if (this.themeCue) this.seqUpdateTheme(dt);
    if (this.cue) return;
    if (this.mode !== 'battle' && this.mode !== 'boss') return;
    if (this.themeCue && this.themeMix === 'full') return;
    this.bgmTimer -= dt;
    if (this.bgmTimer > 0) return;
    const bpm = this.mode === 'boss' ? 132 : 72;
    this.bgmTimer = 60 / bpm;
    const t = this.ctx.currentTime;
    const step = this.step++;
    const scale = [98, 117, 131, 147, 175, 196];
    const note = scale[step % scale.length];
    const oct = this.mode === 'boss' ? 2 : 1;
    this.tone(this.bgmBus, note * oct, t, 0.18, 'triangle', 0.18);
    if (step % 4 === 0) this.tone(this.bgmBus, note / 2, t, 0.28, 'sine', 0.28);
    if (step % 2 === 0) this.noise(this.bgmBus, t, 0.04, 0.05);
    if (this.mode === 'boss' && step % 8 === 0) this.tone(this.bgmBus, 55, t, 0.4, 'sawtooth', 0.12);
  }

  ui(): void {
    if (!this.ready()) return;
    this.tone(this.sfxBus!, 880, this.ctx!.currentTime, 0.08, 'square', 0.08);
  }

  slash(crit = false): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(this.sfxBus!, t, 0.12, crit ? 0.22 : 0.12);
    this.tone(this.sfxBus!, crit ? 1400 : 920, t, 0.1, 'sawtooth', 0.08);
    if (crit) this.tone(this.sfxBus!, 1860, t + 0.04, 0.08, 'square', 0.06);
  }

  shot(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(this.sfxBus!, t, 0.06, 0.2);
    this.tone(this.sfxBus!, 420, t, 0.07, 'square', 0.16);
    this.tone(this.sfxBus!, 180, t, 0.09, 'sawtooth', 0.12);
  }

  charge(level: number): void {
    if (!this.ready()) return;
    this.tone(this.sfxBus!, 220 + level * 520, this.ctx!.currentTime, 0.07, 'sine', 0.05);
  }

  magic(full: boolean): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(this.sfxBus!, full ? 520 : 340, t, 0.18, 'triangle', 0.16);
    this.tone(this.sfxBus!, full ? 780 : 500, t + 0.04, 0.2, 'sine', 0.12);
    if (full) this.noise(this.sfxBus!, t, 0.16, 0.14);
  }

  fizzle(): void {
    if (!this.ready()) return;
    this.noise(this.sfxBus!, this.ctx!.currentTime, 0.2, 0.12);
    this.tone(this.sfxBus!, 90, this.ctx!.currentTime, 0.22, 'sawtooth', 0.08);
  }

  hit(crit = false): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(this.sfxBus!, t, 0.08, crit ? 0.22 : 0.12);
    this.tone(this.sfxBus!, crit ? 660 : 240, t, 0.09, 'square', 0.1);
  }

  explode(): void {
    if (!this.ready()) return;
    this.noise(this.sfxBus!, this.ctx!.currentTime, 0.28, 0.22);
    this.tone(this.sfxBus!, 70, this.ctx!.currentTime, 0.3, 'sawtooth', 0.16);
  }

  hurt(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(this.sfxBus!, 140, t, 0.2, 'sawtooth', 0.18);
    this.tone(this.sfxBus!, 90, t, 0.25, 'square', 0.12);
  }

  combo(n: number): void {
    if (!this.ready()) return;
    this.tone(this.sfxBus!, 440 + Math.min(n, 12) * 40, this.ctx!.currentTime, 0.1, 'triangle', 0.1);
  }

  win(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => this.tone(this.sfxBus!, f, t + i * 0.12, 0.22, 'triangle', 0.14));
  }

  lose(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    [330, 247, 196, 130].forEach((f, i) => this.tone(this.sfxBus!, f, t + i * 0.16, 0.28, 'sawtooth', 0.12));
  }

  boss(): void {
    if (!this.ready()) return;
    this.tone(this.sfxBus!, 55, this.ctx!.currentTime, 0.6, 'sawtooth', 0.2);
    this.tone(this.sfxBus!, 110, this.ctx!.currentTime + 0.1, 0.4, 'triangle', 0.12);
  }


  dodge(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(this.sfxBus!, t, 0.08, 0.1);
    this.tone(this.sfxBus!, 720, t, 0.09, 'sine', 0.1);
    this.tone(this.sfxBus!, 1080, t + 0.04, 0.07, 'triangle', 0.06);
  }

  heal(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(this.sfxBus!, 523, t, 0.12, 'sine', 0.1);
    this.tone(this.sfxBus!, 784, t + 0.06, 0.14, 'triangle', 0.1);
  }

  chest(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(this.sfxBus!, 330, t, 0.08, 'square', 0.1);
    this.tone(this.sfxBus!, 494, t + 0.05, 0.1, 'triangle', 0.12);
    this.tone(this.sfxBus!, 660, t + 0.1, 0.14, 'sine', 0.1);
    this.noise(this.sfxBus!, t, 0.12, 0.08);
  }

  warn(): void {
    if (!this.ready()) return;
    this.tone(this.sfxBus!, 220, this.ctx!.currentTime, 0.18, 'sawtooth', 0.1);
  }


  powerup(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(this.sfxBus!, 660, t, 0.08, 'square', 0.1);
    this.tone(this.sfxBus!, 880, t + 0.05, 0.1, 'triangle', 0.12);
    this.tone(this.sfxBus!, 1320, t + 0.1, 0.12, 'sine', 0.1);
  }

  shieldBreak(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.noise(this.sfxBus!, t, 0.12, 0.14);
    this.tone(this.sfxBus!, 420, t, 0.1, 'triangle', 0.1);
    this.tone(this.sfxBus!, 180, t + 0.04, 0.14, 'sine', 0.08);
  }

  deny(): void {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.tone(this.sfxBus!, 160, t, 0.07, 'square', 0.1);
    this.tone(this.sfxBus!, 110, t + 0.04, 0.08, 'sawtooth', 0.08);
  }

  ultSword(): void {
    if (!this.ready()) return;
    this.playStip(STIPS.sword);
  }

  ultGun(): void {
    if (!this.ready()) return;
    this.playStip(STIPS.gun);
  }

  ultMage(): void {
    if (!this.ready()) return;
    this.playStip(STIPS.mage);
  }

  private resolveCue(mode: 'title' | 'battle' | 'boss' | 'none'): string {
    if (mode === 'none') return '';
    if (mode === 'title') return 'title';
    if (mode === 'battle') {
      const s = this.lastStage;
      return s === 1 ? 'mist' : s === 2 ? 'altar' : 'storm';
    }
    const k = this.lastBossKind;
    if (k === 'bossSlime' || k.includes('晶黏')) return 'king_slime';
    if (k === 'bossWraith') return 'king_wraith';
    if (k === 'bossDemon') return 'king_demon';
    return 'boss';
  }

  private seqUpdate(dt: number): void {
    if (!this.ctx || !this.bgmBus || !this.cue) return;
    const loop = this.cue.loop;
    const spb = 60 / this.cue.bpm;
    if (!(loop > 0) || !(spb > 0) || !(dt > 0)) return;
    this.beatPos = ((this.beatPos % loop) + loop) % loop;
    const dBeats = Math.min(dt / spb, loop);
    const start = this.beatPos;
    const end = start + dBeats;
    const now = this.ctx.currentTime;
    if (end < loop) {
      this.schedRange(start, end, now, start, spb);
      this.beatPos = end;
    } else {
      this.schedRange(start, loop, now, start, spb);
      this.evIdx = 0;
      let rem = end - loop;
      if (rem >= loop) rem %= loop;
      this.schedRange(0, rem, now, start - loop, spb);
      this.beatPos = rem;
    }
  }

  private schedRange(from: number, to: number, now: number, origin: number, spb: number): void {
    if (!(to > from)) return;
    const evs = this.cue!.events;
    while (this.evIdx < evs.length && evs[this.evIdx].t < from) this.evIdx++;
    while (this.evIdx < evs.length && evs[this.evIdx].t < to) {
      const ev = evs[this.evIdx++];
      try { this.playEv(ev, now + (ev.t - origin) * spb, spb); }
      catch { /* must never hang the while */ }
    }
  }

  private seqUpdateTheme(dt: number): void {
    if (!this.ctx || !this.bgmBus || !this.themeCue) return;
    const loop = this.themeCue.loop;
    const spb = 60 / this.themeCue.bpm;
    if (!(loop > 0) || !(spb > 0) || !(dt > 0)) return;
    this.themeBeat = ((this.themeBeat % loop) + loop) % loop;
    const dBeats = Math.min(dt / spb, loop);
    const start = this.themeBeat;
    const end = start + dBeats;
    const now = this.ctx.currentTime;
    if (end < loop) {
      this.schedThemeRange(start, end, now, start, spb);
      this.themeBeat = end;
    } else {
      this.schedThemeRange(start, loop, now, start, spb);
      this.themeEvIdx = 0;
      let rem = end - loop;
      if (rem >= loop) rem %= loop;
      this.schedThemeRange(0, rem, now, start - loop, spb);
      this.themeBeat = rem;
    }
  }

  private schedThemeRange(from: number, to: number, now: number, origin: number, spb: number): void {
    if (!(to > from)) return;
    const evs = this.themeCue!.events;
    while (this.themeEvIdx < evs.length && evs[this.themeEvIdx].t < from) this.themeEvIdx++;
    while (this.themeEvIdx < evs.length && evs[this.themeEvIdx].t < to) {
      const ev = evs[this.themeEvIdx++];
      try { this.playEv(ev, now + (ev.t - origin) * spb, spb, this.themeMix); }
      catch { /* must never hang the while */ }
    }
  }

  private playEv(e: CueEv, when: number, spb: number, mix: 'full' | 'thin' = 'full'): void {
    if (!this.ctx || !this.bgmBus) return;
    if (mix === 'thin' && e.v !== 'lead') return;
    const t = Math.max(when, this.ctx.currentTime);
    const attack = Math.max(0.004, e.a ?? 0.015);
    let dur = e.ds ?? (e.d ?? 0.25) * spb;
    if (!Number.isFinite(e.f) || !Number.isFinite(dur) || !Number.isFinite(t)) return;
    dur = Math.min(8, Math.max(0.02, dur));
    const g = mix === 'thin' ? 0.06 : e.g;
    if (e.w === 'noise') {
      this.noise(this.bgmBus, t, dur, g, e.f);
      return;
    }
    const decay = Math.min(spb, Math.max(0.02, dur - attack));
    this.tone(this.bgmBus, e.f, t, dur, e.w, g, attack, !!e.dr, decay, !!e.gl);
  }

  private playStip(evs: StipEv[]): void {
    if (!this.ctx || !this.sfxBus) return;
    const t0 = this.ctx.currentTime;
    for (const e of evs) {
      const when = t0 + e.t;
      if (e.w === 'noise') this.noise(this.sfxBus, when, e.ds, e.g, e.f);
      else this.tone(this.sfxBus, e.f, when, e.ds, e.w, e.g);
    }
  }

  private ready(): boolean {
    return !!(this.ctx && this.sfxBus);
  }

  private tone(
    dest: GainNode,
    freq: number,
    when: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    attackSec = 0.015,
    droop = false,
    decaySec?: number,
    glide = false,
  ): void {
    if (!this.ctx) return;
    if (!Number.isFinite(freq) || !Number.isFinite(dur) || !Number.isFinite(when)) return;
    const t0 = Math.max(when, this.ctx.currentTime);
    const d0 = Math.min(8, Math.max(0.02, dur));
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    if (glide) {
      osc.frequency.setValueAtTime(freq * 0.8909, t0);
      osc.frequency.linearRampToValueAtTime(freq, t0 + 0.08);
    } else {
      osc.frequency.setValueAtTime(freq, t0);
    }
    if (droop) {
      const end = t0 + d0;
      const droopAt = Math.max(t0, end - 0.08);
      osc.frequency.setValueAtTime(freq, droopAt);
      osc.frequency.linearRampToValueAtTime(freq * 0.9828, end);
    }
    const peak = Math.max(gain, 0.0001);
    const peakAt = t0 + Math.max(0.004, attackSec);
    const end = t0 + Math.max(d0, attackSec + 0.01);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, peakAt);
    if (decaySec !== undefined && decaySec > 0) {
      const decayStart = Math.max(peakAt, end - decaySec);
      g.gain.setValueAtTime(peak, decayStart);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, end);
    }
    osc.connect(g);
    g.connect(dest);
    osc.start(t0);
    osc.stop(end + 0.02);
  }

  private noise(dest: GainNode, when: number, dur: number, gain: number, bpHz = 1200): void {
    if (!this.ctx) return;
    const t = Math.max(when, this.ctx.currentTime);
    const d = Math.min(2, Math.max(0.01, dur));
    if (!this.noiseBuf) {
      const n = Math.max(1, Math.floor(0.5 * this.ctx.sampleRate));
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(bpHz, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + d + 0.02);
  }
}
