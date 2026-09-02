/** CHANGE-005 original BGM cues. Charts: design/scores/*.md */

export type CueWave = OscillatorType | 'noise';

export type CueVoice = 'lead' | 'bass' | 'ice' | 'muzzle' | 'drone' | 'pad_a' | 'pad_e' | 'echo' | 'air' | 'pedal' | 'stack' | 'hit';

export type CueEv = {
  t: number;
  f: number;
  d?: number;
  ds?: number;
  w: CueWave;
  g: number;
  a?: number;
  dr?: boolean;
  gl?: boolean;
  v?: CueVoice;
};

export type Cue = {
  id: string;
  bpm: number;
  loop: number;
  events: CueEv[];
};

function n(t: number, f: number, d: number, w: CueWave, g: number, extra?: Partial<CueEv>): CueEv {
  return extra ? { t, f, d, w, g, ...extra } : { t, f, d, w, g };
}

function ns(t: number, f: number, ds: number, w: CueWave, g: number, extra?: Partial<CueEv>): CueEv {
  return extra ? { t, f, ds, w, g, ...extra } : { t, f, ds, w, g };
}

function tile(pat: CueEv[], times: number, period: number): CueEv[] {
  const out: CueEv[] = [];
  for (let i = 0; i < times; i++) {
    const off = i * period;
    for (const e of pat) out.push({ ...e, t: e.t + off });
  }
  return out;
}

function place(rows: [number, number, number][], off: number, w: CueWave, g: number, extra?: Partial<CueEv>): CueEv[] {
  return rows.map(([t, f, d]) => n(t + off, f, d, w, g, extra));
}

function sortEv(events: CueEv[]): CueEv[] {
  events.sort((a, b) => a.t - b.t);
  return events;
}

function buildStorm(): Cue {
  const bassPat = [
    n(0, 73, 2, 'sine', 0.2),
    n(2, 110, 2, 'sine', 0.2),
    n(4, 131, 2, 'sine', 0.2),
    n(6, 98, 2, 'sine', 0.2),
  ];
  const ostPat = [
    n(0.0, 147, 0.5, 'triangle', 0.1),
    n(0.5, 220, 0.5, 'triangle', 0.1),
    n(1.0, 185, 0.5, 'triangle', 0.1),
    n(1.5, 220, 0.5, 'triangle', 0.1),
    n(2.0, 147, 0.5, 'triangle', 0.1),
    n(2.5, 262, 0.5, 'triangle', 0.1),
    n(3.0, 220, 0.5, 'triangle', 0.1),
    n(3.5, 196, 0.5, 'triangle', 0.1),
    n(4.0, 147, 0.5, 'triangle', 0.1),
    n(4.5, 220, 0.5, 'triangle', 0.1),
    n(5.0, 185, 0.5, 'triangle', 0.1),
    n(5.5, 196, 0.5, 'triangle', 0.1),
    n(6.0, 165, 0.5, 'triangle', 0.1),
    n(6.5, 185, 0.5, 'triangle', 0.1),
    n(7.0, 147, 0.5, 'triangle', 0.1),
  ];
  const hat: CueEv[] = [];
  for (let bar = 0; bar < 18; bar++) {
    hat.push(ns(bar * 4 + 1, 2400, 0.04, 'noise', 0.04));
    hat.push(ns(bar * 4 + 3, 2400, 0.04, 'noise', 0.04));
  }
  const A: [number, number, number][] = [
    [0, 294, 1], [1, 370, 1], [2, 440, 0.5], [2.5, 392, 0.5], [3, 370, 1],
    [4, 262, 1.5], [5.5, 220, 0.5], [6, 294, 1],
    [8, 294, 0.5], [8.5, 330, 0.5], [9, 370, 1], [10, 440, 1],
    [11, 392, 0.5], [11.5, 370, 0.5], [12, 330, 1], [13, 262, 1], [14, 294, 1.5],
  ];
  const lead: CueEv[] = [
    ...place(A, 0, 'triangle', 0.14),
    ...place(A, 16, 'triangle', 0.14),
    n(23, 262, 0.5, 'triangle', 0.14),
    ...place(A, 32, 'triangle', 0.14),
    ...place(A.map(([t, f, d]) => [t, t === 14 ? 588 : f, d] as [number, number, number]), 48, 'triangle', 0.14),
    n(64, 294, 2, 'triangle', 0.14),
    n(66, 370, 2, 'triangle', 0.14),
    n(68, 494, 2, 'triangle', 0.14),
    n(70, 440, 2, 'triangle', 0.14),
  ];
  return {
    id: 'bgm_storm',
    bpm: 108,
    loop: 72,
    events: sortEv([...tile(bassPat, 9, 8), ...tile(ostPat, 9, 8), ...hat, ...lead]),
  };
}

function buildMist(): Cue {
  const pad: CueEv[] = [];
  for (let i = 0; i < 8; i++) {
    const t = i * 8;
    pad.push(n(t, 220, 8, 'sine', 0.05, { a: 1.2 }));
    pad.push(n(t, 330, 8, 'sine', 0.05, { a: 1.2 }));
  }
  const bassHz = [110, 110, 110, 92];
  const bass: CueEv[] = [];
  for (let i = 0; i < 16; i++) bass.push(n(i * 4, bassHz[i % 4], 4, 'sine', 0.18));
  const phrase: [number, number, number][] = [
    [0, 220, 2], [2, 262, 2], [4, 349, 2], [6, 330, 2],
    [8, 294, 1], [9, 196, 1], [10, 220, 2], [14, 165, 2],
    [16, 440, 2], [18, 523, 2], [20, 698, 2], [22, 659, 2],
    [24, 587, 0.5], [24.5, 523, 0.5], [25, 440, 2],
  ];
  const lead = [...place(phrase, 0, 'triangle', 0.12), ...place(phrase, 32, 'triangle', 0.12)];
  return {
    id: 'bgm_mist',
    bpm: 88,
    loop: 64,
    events: sortEv([...pad, ...bass, ...lead]),
  };
}

function buildAltar(): Cue {
  const ostA = [
    n(0.0, 69, 0.5, 'sawtooth', 0.14),
    n(0.5, 69, 0.5, 'sawtooth', 0.14),
    n(1.0, 69, 0.5, 'sawtooth', 0.14),
    n(2.0, 69, 0.5, 'sawtooth', 0.14),
    n(2.5, 69, 0.5, 'sawtooth', 0.14),
    n(3.0, 82, 0.5, 'sawtooth', 0.14),
    n(3.5, 73, 0.5, 'sawtooth', 0.14),
  ];
  const ostB = [
    n(0.0, 69, 0.5, 'sawtooth', 0.14),
    n(0.5, 69, 0.5, 'sawtooth', 0.14),
    n(1.0, 69, 0.5, 'sawtooth', 0.14),
    n(1.5, 69, 0.5, 'sawtooth', 0.14),
    n(2.0, 69, 0.5, 'sawtooth', 0.14),
    n(2.5, 69, 0.5, 'sawtooth', 0.14),
    n(3.0, 82, 0.5, 'sawtooth', 0.14),
    n(3.5, 73, 0.5, 'sawtooth', 0.14),
  ];
  const ost = [...tile(ostA, 8, 4), ...tile(ostB, 16, 4).map((e) => ({ ...e, t: e.t + 32 }))];
  const stomp: CueEv[] = [];
  for (let bar = 16; bar < 24; bar++) {
    for (let b = 0; b < 4; b++) stomp.push(n(bar * 4 + b, 35, 1, 'sawtooth', 0.12));
  }
  const kick: CueEv[] = [];
  for (let bar = 0; bar < 16; bar++) kick.push(ns(bar * 4, 180, 0.08, 'noise', 0.08));
  const head: [number, number, number][] = [
    [0, 277, 2], [2, 330, 1], [3, 277, 1], [4, 440, 2], [6, 415, 2],
  ];
  const tail: [number, number, number][] = [
    [8, 370, 0.5], [8.5, 330, 0.5], [9, 277, 1], [10, 247, 2],
  ];
  const lead: CueEv[] = [
    ...place(head, 32, 'square', 0.1), ...place(tail, 32, 'square', 0.1), n(44, 208, 4, 'square', 0.1),
    ...place(head, 48, 'square', 0.1), ...place(tail, 48, 'square', 0.1), n(60, 277, 4, 'square', 0.1),
    ...place(head, 64, 'square', 0.1), ...place(tail, 64, 'square', 0.1), n(76, 208, 4, 'square', 0.1),
    ...place(head, 80, 'square', 0.1), n(88, 277, 7, 'square', 0.1),
  ];
  const lead8 = lead.filter((e) => e.t >= 64).map((e) => ({
    ...e,
    f: e.f * 2,
    w: 'triangle' as CueWave,
    g: 0.08,
  }));
  return {
    id: 'bgm_altar',
    bpm: 120,
    loop: 96,
    events: sortEv([...ost, ...stomp, ...kick, ...lead, ...lead8]),
  };
}

function buildKing(): Cue {
  const bassHz = [87, 87, 87, 87, 87, 87, 78, 73, 87, 87, 87, 87, 87, 87, 87, 82, 78, 87];
  const bass = bassHz.map((f, i) => n(i * 4, f, 4, 'sine', 0.2));
  const L: [number, number, number][] = [
    [0, 349, 2], [2, 440, 2], [4, 587, 1], [5, 523, 1], [6, 440, 2], [8, 349, 4], [14, 262, 2],
    [16, 349, 2], [18, 440, 2], [20, 587, 1], [21, 523, 1], [22, 440, 2], [24, 349, 4], [30, 262, 2],
    [32, 349, 2], [34, 440, 2], [36, 587, 1], [37, 523, 1], [38, 440, 2], [40, 175, 4],
    [48, 349, 2], [50, 440, 2], [52, 175, 4],
    [56, 349, 4], [60, 415, 4], [64, 554, 4], [68, 523, 4],
  ];
  const lead = place(L, 0, 'triangle', 0.12, { dr: true });
  const sub = [56, 60, 64, 68].map((t) => ns(t, 44, 0.5, 'sawtooth', 0.12));
  const hat: CueEv[] = [];
  for (let bar = 0; bar < 18; bar++) hat.push(ns(bar * 4 + 2, 1800, 0.03, 'noise', 0.03));
  return {
    id: 'bgm_king_slime',
    bpm: 132,
    loop: 72,
    events: sortEv([...bass, ...lead, ...sub, ...hat]),
  };
}

function buildTitle(): Cue {
  const pad: CueEv[] = [];
  for (let i = 0; i < 4; i++) {
    const t = i * 8;
    pad.push(n(t, 110, 8, 'sine', 0.05, { a: 1.2, v: 'pad_a' }));
    pad.push(n(t, 165, 8, 'sine', 0.04, { a: 1.2, v: 'pad_e' }));
  }
  const bassHz = [110, 110, 110, 82, 110, 110, 110, 82];
  const bass = bassHz.map((f, i) => n(i * 4, f, 4, 'sine', 0.12, { v: 'bass' }));
  const leadRows: [number, number, number][] = [
    [0, 220, 2], [2, 262, 2], [4, 349, 2], [6, 330, 2],
    [8, 294, 1], [9, 220, 1], [10, 262, 2], [14, 165, 2],
  ];
  const lead = place(leadRows, 0, 'triangle', 0.1, { v: 'lead' });
  return { id: 'bgm_title', bpm: 72, loop: 32, events: sortEv([...pad, ...bass, ...lead]) };
}

function buildKingWraith(): Cue {
  const drone = [0, 16, 32, 48].map((t) => n(t, 82, 16, 'sine', 0.1, { v: 'drone' }));
  const air = [2, 10, 18, 26, 34, 42, 50, 58].map((t) => ns(t, 1600, 0.3, 'noise', 0.03, { v: 'air' }));
  const leadRows: [number, number, number][] = [
    [0, 165, 2], [2, 196, 2], [4, 262, 2], [6, 247, 4],
    [12, 330, 0.5], [12.5, 294, 0.5], [13, 247, 1], [14, 196, 2],
    [20, 330, 2], [22, 392, 2], [24, 494, 2], [26, 440, 4],
    [32, 262, 2], [34, 247, 2], [36, 165, 4],
    [40, 165, 2], [42, 196, 2], [44, 262, 2], [46, 247, 4],
    [52, 330, 0.5], [52.5, 294, 0.5], [53, 247, 1], [54, 196, 2],
    [60, 330, 2], [62, 392, 2],
  ];
  const lead = place(leadRows, 0, 'sine', 0.14, { gl: true, v: 'lead' }).filter((e) => e.t < 64);
  const echo = lead.map((e) => ({ ...e, t: e.t + 0.5, g: 0.07, v: 'echo' as const, gl: true })).filter((e) => e.t < 64);
  return { id: 'bgm_king_wraith', bpm: 120, loop: 64, events: sortEv([...drone, ...lead, ...echo, ...air]) };
}

function buildKingDemon(): Cue {
  const pedal: CueEv[] = [];
  for (let i = 0; i <= 34; i++) pedal.push(ns(i * 2, 39, 0.42, 'sawtooth', 0.16, { v: 'pedal' }));
  const stack: CueEv[] = [];
  const hit: CueEv[] = [];
  for (let bar = 0; bar <= 17; bar++) {
    stack.push(n(bar * 4, 156, 4, 'triangle', 0.08, { v: 'stack' }));
    hit.push(ns(bar * 4, 120, 0.12, 'noise', 0.1, { v: 'hit' }));
  }
  const phrase: [number, number, number][] = [
    [0, 156, 2], [2, 185, 1], [3, 156, 1], [4, 247, 2], [6, 233, 2],
    [8, 185, 0.5], [8.5, 208, 0.5], [9, 247, 1], [10, 311, 2], [12, 233, 4],
  ];
  const lead: CueEv[] = [
    ...place(phrase, 0, 'square', 0.11, { v: 'lead' }),
    ...place(phrase, 16, 'square', 0.11, { v: 'lead' }),
    ...place(phrase, 32, 'square', 0.11, { v: 'lead' }),
    n(48, 233, 8, 'square', 0.11, { v: 'lead' }),
    n(56, 156, 8, 'square', 0.11, { v: 'lead' }),
  ];
  return { id: 'bgm_king_demon', bpm: 132, loop: 72, events: sortEv([...pedal, ...stack, ...hit, ...lead]) };
}

export const CUES: Record<string, Cue> = {
  storm: buildStorm(),
  mist: buildMist(),
  altar: buildAltar(),
  king_slime: buildKing(),
  title: buildTitle(),
  king_wraith: buildKingWraith(),
  king_demon: buildKingDemon(),
};

function buildThemeSword(): Cue {
  const bass = [0, 4, 8, 12].map((t) => n(t, 123, 4, 'sine', 0.1, { v: 'bass' }));
  const ice = [
    ns(0, 1480, 0.05, 'square', 0.05, { v: 'ice' }),
    ns(10, 1480, 0.05, 'square', 0.05, { v: 'ice' }),
  ];
  const leadRows: [number, number, number][] = [
    [0, 370, 1], [1, 440, 1], [2, 587, 2], [4, 554, 2],
    [6, 494, 1], [7, 440, 1], [8, 370, 0.5], [8.5, 330, 0.5],
    [9, 247, 1], [10, 123, 2], [12, 370, 4],
  ];
  const lead = place(leadRows, 0, 'triangle', 0.16, { v: 'lead' });
  return { id: 'theme_sword', bpm: 90, loop: 16, events: sortEv([...bass, ...ice, ...lead]) };
}

function buildThemeGun(): Cue {
  const bassTs = [0, 2, 4, 6, 8, 10, 12, 14];
  const bass = bassTs.map((t) => n(t, 98, 1, 'sawtooth', 0.1, { v: 'bass' }));
  const muzzle = [0, 4, 8, 12].map((t) => ns(t, 1800, 0.05, 'noise', 0.1, { v: 'muzzle' }));
  const leadRows: [number, number, number][] = [
    [0.0, 196, 0.5], [0.5, 233, 0.5], [1.0, 196, 1],
    [2.0, 311, 0.5], [2.5, 294, 0.5], [3.0, 233, 1],
    [4.0, 196, 0.5], [4.5, 175, 0.5], [5.0, 196, 1],
    [7.0, 98, 1],
    [8.0, 196, 0.5], [8.5, 233, 0.5], [9.0, 196, 0.5], [9.5, 277, 0.5],
    [10.0, 294, 0.5], [10.5, 311, 0.5], [11.0, 294, 0.5], [11.5, 233, 0.5],
    [12.0, 196, 2],
    [14.0, 294, 0.5], [14.5, 233, 0.5], [15.0, 196, 1],
  ];
  const lead = place(leadRows, 0, 'square', 0.16, { v: 'lead' });
  return { id: 'theme_gun', bpm: 120, loop: 20, events: sortEv([...bass, ...muzzle, ...lead]) };
}

function buildThemeMage(): Cue {
  const drone = [n(0, 165, 12, 'sine', 0.08, { v: 'drone' })];
  const lead: CueEv[] = [
    n(0, 330, 1, 'sine', 0.14, { ds: 2.2, a: 0.08, v: 'lead' }),
    n(2, 415, 1, 'sine', 0.14, { ds: 2.2, a: 0.08, v: 'lead' }),
    n(4, 554, 1, 'sine', 0.14, { ds: 2.2, a: 0.08, v: 'lead' }),
    n(6, 494, 1, 'sine', 0.14, { ds: 2.2, a: 0.08, v: 'lead' }),
    n(8, 330, 3, 'sine', 0.14, { a: 0.08, v: 'lead' }),
    n(8, 494, 3, 'sine', 0.14, { a: 0.08, v: 'lead' }),
  ];
  return { id: 'theme_mage', bpm: 72, loop: 12, events: sortEv([...drone, ...lead]) };
}

export const THEMES: Record<'sword' | 'gun' | 'mage', Cue> = {
  sword: buildThemeSword(),
  gun: buildThemeGun(),
  mage: buildThemeMage(),
};

export type StipEv = { t: number; f: number; ds: number; w: CueWave; g: number };

export const STIPS: Record<'sword' | 'gun' | 'mage', StipEv[]> = {
  sword: [
    { t: 0.00, f: 3200, ds: 0.12, w: 'noise', g: 0.16 },
    { t: 0.00, f: 247, ds: 0.18, w: 'triangle', g: 0.12 },
    { t: 0.10, f: 370, ds: 0.16, w: 'triangle', g: 0.12 },
    { t: 0.22, f: 494, ds: 0.16, w: 'triangle', g: 0.12 },
    { t: 0.34, f: 587, ds: 0.20, w: 'triangle', g: 0.14 },
    { t: 0.48, f: 740, ds: 0.22, w: 'triangle', g: 0.12 },
    { t: 0.55, f: 123, ds: 0.40, w: 'sine', g: 0.10 },
  ],
  gun: [
    { t: 0.00, f: 2000, ds: 0.05, w: 'noise', g: 0.18 },
    { t: 0.00, f: 196, ds: 0.07, w: 'square', g: 0.12 },
    { t: 0.08, f: 2000, ds: 0.05, w: 'noise', g: 0.18 },
    { t: 0.08, f: 196, ds: 0.07, w: 'square', g: 0.12 },
    { t: 0.16, f: 2000, ds: 0.05, w: 'noise', g: 0.18 },
    { t: 0.16, f: 196, ds: 0.07, w: 'square', g: 0.12 },
    { t: 0.24, f: 2000, ds: 0.05, w: 'noise', g: 0.18 },
    { t: 0.24, f: 196, ds: 0.07, w: 'square', g: 0.12 },
    { t: 0.28, f: 311, ds: 0.08, w: 'square', g: 0.10 },
    { t: 0.36, f: 233, ds: 0.08, w: 'square', g: 0.10 },
    { t: 0.44, f: 98, ds: 0.22, w: 'sawtooth', g: 0.12 },
  ],
  mage: [
    { t: 0.00, f: 330, ds: 0.28, w: 'sine', g: 0.12 },
    { t: 0.12, f: 494, ds: 0.28, w: 'sine', g: 0.12 },
    { t: 0.24, f: 659, ds: 0.30, w: 'sine', g: 0.14 },
    { t: 0.40, f: 400, ds: 0.40, w: 'noise', g: 0.20 },
    { t: 0.42, f: 82, ds: 0.40, w: 'sawtooth', g: 0.14 },
    { t: 0.50, f: 554, ds: 0.22, w: 'triangle', g: 0.08 },
  ],
};
