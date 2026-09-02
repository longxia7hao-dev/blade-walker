import { CHARACTERS, STAGES, MAX_HP, ROUTES, ENCOUNTERS, dirLabel, type CharId, type StageId, type ScreenId, type RouteId, type EncounterDef } from './types';
import type { SaveData } from './save';
import { scoreKey } from './save';

export class UI {
  private screens: Record<string, HTMLElement>;
  readonly charGrid: HTMLElement;
  readonly stageList: HTMLElement;
  private previewRafs: number[] = [];
  private forkHandler: ((i: number) => void) | null = null;

  constructor() {
    this.screens = {
      title: el('screen-title'),
      char: el('screen-char'),
      stage: el('screen-stage'),
      tutorial: el('screen-tutorial'),
      play: el('hud'),
      pause: el('screen-pause'),
      win: el('screen-win'),
      lose: el('screen-lose'),
    };
    this.charGrid = el('char-grid');
    this.stageList = el('stage-list');
  }

  show(id: ScreenId): void {
    for (const [k, node] of Object.entries(this.screens)) {
      node.classList.toggle('hidden', k !== id);
    }
    const play = id === 'play';
    document.getElementById('dodge-strip')?.classList.toggle('hidden', !play);
    document.getElementById('pickup-hint')?.classList.toggle('hidden', !play);
    document.getElementById('btn-ult')?.classList.toggle('hidden', !play);
    document.getElementById('power-hud')?.classList.toggle('hidden', !play);
    for (const n of ['dodge-left', 'dodge-right']) {
      const edge = document.getElementById(n);
      if (!edge) continue;
      edge.classList.remove('hidden');
      if (!play) edge.classList.remove('kick');
    }
  }

  overlay(id: 'pause' | 'win' | 'lose' | 'tutorial' | null): void {
    for (const k of ['pause', 'win', 'lose', 'tutorial'] as const) {
      this.screens[k].classList.toggle('hidden', k !== id);
    }
    const play = !this.screens.play.classList.contains('hidden');
    const showUlt = play && id === null;
    document.getElementById('btn-ult')?.classList.toggle('hidden', !showUlt);
    if (!showUlt) document.getElementById('ult-hint')?.classList.add('hidden');
  }

  hideOverlays(): void {
    this.overlay(null);
  }

  buildChars(selected: CharId | null, onPick: (id: CharId) => void): void {
    this.stopPreviews();
    this.charGrid.innerHTML = '';
    for (const c of CHARACTERS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `char-card ${c.palette}${selected === c.id ? ' selected' : ''}`;
      btn.innerHTML = `
        <div class="char-frame">
          <img class="char-art" src="${c.art}" alt="${c.name}" />
          <span class="char-badge">${c.role}</span>
          <div class="char-plate">
            <h3 class="char-name">${c.name}</h3>
            <p class="char-desc">${c.desc}</p>
            <p class="char-hint">${c.hint}</p>
          </div>
        </div>`;
      const img = btn.querySelector('img')!;
      img.addEventListener('error', () => {
        img.style.display = 'none';
        let canvas = btn.querySelector('canvas');
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.className = 'char-preview-canvas';
          canvas.style.display = 'block';
          canvas.style.position = 'absolute';
          canvas.style.inset = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          btn.querySelector('.char-frame')!.prepend(canvas);
          this.previewRafs.push(animatePreview(canvas, c.id));
        }
      });
      btn.addEventListener('click', () => onPick(c.id));
      this.charGrid.appendChild(btn);
    }
  }

  markChar(id: CharId): void {
    this.charGrid.querySelectorAll('.char-card').forEach((n, i) => {
      n.classList.toggle('selected', CHARACTERS[i].id === id);
    });
    const sel = this.charGrid.querySelector('.char-card.selected') as HTMLElement | null;
    sel?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  buildStages(save: SaveData, char: CharId, selected: StageId | null, onPick: (id: StageId, locked: boolean) => void): void {
    this.stageList.innerHTML = '';
    el('stage-char-label').textContent = `${CHARACTERS.find((c) => c.id === char)?.name} · ${CHARACTERS.find((c) => c.id === char)?.role}`;
    for (const s of STAGES) {
      const locked = s.id > save.unlockedStage;
      const best = save.best[scoreKey(char, s.id)] ?? 0;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `stage-card${selected === s.id ? ' selected' : ''}${locked ? ' locked' : ''}`;
      btn.innerHTML = `
        <div>
          <p class="stage-title">${locked ? '未解鎖' : s.name}</p>
          <p class="stage-meta">${locked ? '先通關前一獵場' : stageMeta(s.id, s.duration)}</p>
        </div>
        <div class="stage-best">${locked ? '🔒' : best ? `最佳 ${best}` : '尚無紀錄'}</div>`;
      btn.addEventListener('click', () => onPick(s.id, locked));
      this.stageList.appendChild(btn);
    }
  }

  markStage(id: StageId): void {
    this.stageList.querySelectorAll('.stage-card').forEach((n, i) => {
      n.classList.toggle('selected', i === id && !n.classList.contains('locked'));
    });
  }

  setMuteLabels(sfx: boolean, bgm: boolean): void {
    const s = sfx ? '關' : '開';
    const b = bgm ? '關' : '開';
    for (const id of ['btn-mute-sfx', 'btn-pause-sfx']) {
      const n = document.getElementById(id);
      if (n) n.textContent = `音效：${s}`;
    }
    for (const id of ['btn-mute-bgm', 'btn-pause-bgm']) {
      const n = document.getElementById(id);
      if (n) n.textContent = `音樂：${b}`;
    }
  }

  setHud(hp: number, combo: number, score: number, progress: number, stageName: string, hint: string, paused = false): void {
    const hearts = el('hp-hearts');
    if (hearts.childElementCount !== MAX_HP) {
      hearts.innerHTML = '';
      for (let i = 0; i < MAX_HP; i++) {
        const d = document.createElement('div');
        d.className = 'heart';
        hearts.appendChild(d);
      }
    }
    hearts.querySelectorAll('.heart').forEach((n, i) => n.classList.toggle('empty', i >= hp));
    const comboEl = el('combo-display');
    comboEl.innerHTML = `COMBO <span>x${combo}</span>`;
    comboEl.classList.toggle('hot', combo >= 3);
    el('score-display').textContent = String(score);
    const fill = el('progress-fill');
    fill.style.width = `${Math.min(100, progress * 100)}%`;
    fill.classList.toggle('paused', paused);
    el('distance-label').textContent = `${stageName} · ${Math.floor(Math.min(100, progress * 100))}%`;
    el('weapon-hint').textContent = hint;
  }

  setArena(kind: 'mini' | 'boss' | null, name = ''): void {
    const n = document.getElementById('arena-banner');
    if (!n) return;
    if (!kind) {
      n.classList.add('hidden');
      n.textContent = '';
      return;
    }
    n.classList.remove('hidden');
    n.innerHTML = kind === 'mini'
      ? `<span class="arena-kicker">小魔王</span>${name ? `<span class="arena-name">${name}</span>` : ''}`
      : `<span class="arena-kicker">魔王戰</span>${name ? `<span class="arena-name">${name}</span>` : ''}`;
  }

  setProgressMarks(enc: EncounterDef[]): void {
    const track = document.querySelector('.progress-track');
    if (!track) return;
    track.querySelectorAll('.enc-mark').forEach((n) => n.remove());
    for (const e of enc) {
      const d = document.createElement('div');
      d.className = e.mini ? 'enc-mark mini-mark' : 'enc-mark boss-mark';
      d.style.left = `${e.at * 100}%`;
      d.textContent = e.mini ? '小' : '魔';
      track.appendChild(d);
    }
  }

  float(text: string, x: number, y: number, kind: 'ok' | 'crit' | 'combo' | 'head' | 'gold' | 'heal' | 'power'): void {
    const n = document.createElement('div');
    n.className = `floater ${kind}`;
    n.textContent = text;
    n.style.left = `${x * 100}%`;
    n.style.top = `${y * 100}%`;
    el('float-layer').appendChild(n);
    setTimeout(() => n.remove(), 720);
  }

  hurt(on: boolean): void {
    el('hurt-flash').classList.toggle('on', on);
  }

  tutorial(char: CharId): void {
    const c = CHARACTERS.find((x) => x.id === char)!;
    el('tut-title').textContent = `${c.role}「${c.name}」`;
    const body =
      char === 'sword'
        ? '在螢幕上滑動出刀。地上霜圈為近身距離，圈外會顯示距離不足。揮砍越快越容易暴擊。'
        : char === 'gun'
          ? '點擊或點觸螢幕射擊。準星對準上半部可打中頭顱。連續射擊受射速限制，落空會中斷連擊。'
          : '長按蓄力，放開射出蒼焰法球。短按為弱彈；蓄滿可貫穿並爆炸。蓄力過久法球會潰散。';
    el('tut-body').textContent = body + ' 單路前行，魔物會朝你衝來。畫面下方左右滑動閃避。岔路可選緩坡、獵道或死鬥。走近撿起紅心、寶箱與膠囊。右側「絕」為絕招，冷卻十秒。途中小魔王與終點魔王會迫使你停下決戰。';
    const art = el('tut-art');
    art.innerHTML = `<img alt="${c.name}" src="${c.art}" />`;
  }

  setTutTime(s: number): void {
    el('tut-timer').textContent = `可略過 · ${Math.max(0, Math.ceil(s))} 秒後自動開始`;
  }

  win(score: number, combo: number, best: number, isBest: boolean, hasNext: boolean): void {
    el('win-stats').textContent = `得分 ${score} · 最高連擊 x${combo}`;
    el('win-best').textContent = isBest ? `新紀錄！最佳 ${best}` : `本關最佳 ${best}`;
    el('btn-next').style.display = hasNext ? '' : 'none';
  }

  lose(score: number, combo: number): void {
    el('lose-stats').textContent = `得分 ${score} · 最高連擊 x${combo}`;
  }


  showFork(routes: RouteId[]): void {
    const box = el('fork-choice');
    box.classList.remove('hidden');
    const n = routes.length;
    box.innerHTML = '<p class="fork-title">岔路</p><div class="fork-row"></div><p class="fork-timer" id="fork-timer">選擇路徑</p>';
    const row = box.querySelector('.fork-row')!;
    document.getElementById('weapon-hint')?.classList.add('hidden');
    document.getElementById('dodge-hint')?.classList.add('hidden');
    document.getElementById('dodge-strip')?.classList.add('hidden');
    document.getElementById('pickup-hint')?.classList.add('hidden');
    document.getElementById('btn-ult')?.classList.add('hidden');
    document.getElementById('ult-hint')?.classList.add('hidden');
    routes.forEach((id, i) => {
      const r = ROUTES[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `fork-btn route-${id}`;
      btn.innerHTML = `<span class="fork-dir">${dirLabel(i, n)}</span><span class="fork-name">「${r.name}」${r.stars}</span><span class="fork-blurb">${r.blurb}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.forkHandler?.(i);
      });
      row.appendChild(btn);
    });
  }

  hideFork(): void {
    const box = document.getElementById('fork-choice');
    if (box) box.classList.add('hidden');
    document.getElementById('weapon-hint')?.classList.remove('hidden');
    document.getElementById('dodge-hint')?.classList.add('hidden');
    document.getElementById('dodge-strip')?.classList.remove('hidden');
    if (!this.screens.play.classList.contains('hidden')) {
      document.getElementById('btn-ult')?.classList.remove('hidden');
    }
  }

  setForkTime(s: number): void {
    const n = document.getElementById('fork-timer');
    if (n) n.textContent = s <= 0 ? '自動選擇緩坡' : `${s.toFixed(1)} 秒後選緩坡`;
  }

  onForkPick(fn: (i: number) => void): void {
    this.forkHandler = fn;
  }

  setDodgePulse(left: boolean, right: boolean): void {
    const strip = document.getElementById('dodge-strip');
    strip?.classList.toggle('pulse-left', left);
    strip?.classList.toggle('pulse-right', right);
  }

  dodgeKick(dir: -1 | 1): void {
    if (document.getElementById('hurt-flash')?.classList.contains('on')) return;
    const side = dir < 0 ? 'left' : 'right';
    const edge = document.getElementById(dir < 0 ? 'dodge-left' : 'dodge-right');
    if (edge) {
      edge.classList.remove('kick');
      void edge.offsetWidth;
      edge.classList.add('kick');
    }
    const flash = document.getElementById('dodge-flash');
    if (flash) {
      flash.classList.remove('kick-left', 'kick-right');
      void flash.offsetWidth;
      flash.classList.add(dir < 0 ? 'kick-left' : 'kick-right');
    }
    void side;
  }

  setWarn(text: string): void {
    const n = document.getElementById('warn-banner');
    if (!n) return;
    n.textContent = text;
    n.classList.toggle('hidden', !text);
  }

  setPowers(atk: number, shield: number, speed: number): void {
    const a = document.getElementById('pip-atk');
    const s = document.getElementById('pip-shield');
    const d = document.getElementById('pip-spd');
    if (a) { a.textContent = `攻x${atk}`; a.classList.toggle('on', atk > 0); }
    if (s) { s.textContent = `盾x${shield}`; s.classList.toggle('on', shield > 0); }
    if (d) { d.textContent = `速x${speed}`; d.classList.toggle('on', speed > 0); }
  }

  setUlt(cd: number, casting: boolean, hint: boolean): void {
    const btn = document.getElementById('btn-ult');
    if (!btn) return;
    const ready = cd <= 0.02 && !casting;
    btn.classList.toggle('ready', ready);
    btn.classList.toggle('cooling', cd > 0.02);
    btn.classList.toggle('casting', casting);
    btn.style.setProperty('--cd', `${Math.min(1, cd / 10) * 360}deg`);
    const lab = btn.querySelector('.ult-cd');
    if (lab) lab.textContent = cd > 0.05 ? String(Math.ceil(cd)) : '';
    document.getElementById('ult-hint')?.classList.toggle('hidden', !hint);
  }

  levelFlash(): void {
    const n = document.getElementById('level-flash');
    if (!n) return;
    n.classList.remove('on');
    void n.offsetWidth;
    n.classList.add('on');
    window.setTimeout(() => n.classList.remove('on'), 560);
  }

  stopPreviews(): void {
    for (const id of this.previewRafs) cancelAnimationFrame(id);
    this.previewRafs = [];
  }
}

function stageMeta(id: StageId, duration: number): string {
  const n = ENCOUNTERS[id].filter((e) => e.mini).length;
  const mini = n > 1 ? '兩名小魔王' : '途中小魔王';
  return `約 ${duration} 秒 · ${mini} · 魔王於 85%`;
}

function el(id: string): HTMLElement {
  const n = document.getElementById(id);
  if (!n) throw new Error(`#${id} missing`);
  return n;
}

function animatePreview(canvas: HTMLCanvasElement, id: CharId): number {
  const ctx = canvas.getContext('2d')!;
  let raf = 0;
  const loop = () => {
    const p = canvas.parentElement;
    const w = (canvas.width = p ? p.clientWidth : 160);
    const h = (canvas.height = p ? p.clientHeight : 54);
    ctx.clearRect(0, 0, w, h);
    const t = performance.now() / 1000;
    if (id === 'sword') {
      ctx.strokeStyle = '#c9e7ff';
      ctx.shadowColor = '#7eb6ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const p0 = (t * 1.6) % 1;
      for (let i = 0; i < 18; i++) {
        const u = p0 + i * 0.02;
        const x = w * (0.1 + (u % 1) * 0.8);
        const y = h * (0.7 - Math.sin(u * Math.PI) * 0.5);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (id === 'gun') {
      const flash = Math.sin(t * 8) > 0.55;
      ctx.strokeStyle = '#ff8a6a';
      ctx.lineWidth = 1.5;
      const cx = w * 0.5, cy = h * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
      ctx.stroke();
      if (flash) {
        ctx.fillStyle = '#ffd2a0';
        ctx.beginPath();
        ctx.arc(cx + 18, cy - 6, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const ch = (t % 1.6) / 1.45;
      const r = 8 + Math.min(1, ch) * 16;
      ctx.strokeStyle = ch > 1 ? '#664' : '#7ee0ff';
      ctx.shadowColor = '#7ee0ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2 * Math.min(1, ch));
      ctx.stroke();
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return raf;
}
