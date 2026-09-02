import { DODGE_STRIP_Y } from './types';

type Ptr = {
  x: number;
  y: number;
  sx: number;
  sy: number;
  t: number;
  dodge: boolean;
  used: boolean;
};

export class Input {
  x = 0.5;
  y = 0.5;
  px = 0.5;
  py = 0.5;
  down = false;
  pressed = false;
  released = false;
  clientX = 0;
  clientY = 0;
  prevClientX = 0;
  prevClientY = 0;
  vx = 0;
  vy = 0;
  keys = new Set<string>();
  keyPressed = new Set<string>();
  /** -1 left, 1 right, 0 none. Consumed by game. */
  dodgeQueued: -1 | 0 | 1 = 0;
  /** During fork: -1 / 0 / 1 path pick from swipe, 99 = none */
  forkPick: -1 | 0 | 1 | 99 = 99;
  private w = 1;
  private h = 1;
  private lastT = 0;
  private pointerId: number | null = null;
  private el: HTMLElement | null = null;
  private pointers = new Map<number, Ptr>();
  private attackActive = false;
  private twoFingerUsed = false;

  attach(el: HTMLElement): void {
    this.el = el;
    const bind = (type: string, fn: (e: PointerEvent) => void) => {
      el.addEventListener(type, fn as EventListener, { passive: false });
    };
    bind('pointerdown', (e) => {
      e.preventDefault();
      this.syncSize(el);
      const dodge = this.inDodgeStrip(e);
      this.pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        sx: e.clientX,
        sy: e.clientY,
        t: performance.now(),
        dodge,
        used: false,
      });
      if (this.pointers.size >= 2) {
        this.twoFingerUsed = true;
        this.attackActive = false;
        this.down = false;
        return;
      }
      if (dodge) {
        try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        this.pointerId = e.pointerId;
        this.updatePos(e, true);
        this.attackActive = false;
        this.down = false;
        return;
      }
      if (this.pointerId !== null && this.pointerId !== e.pointerId) return;
      this.pointerId = e.pointerId;
      this.attackActive = true;
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      this.down = true;
      this.pressed = true;
      this.updatePos(e, true);
    });
    bind('pointermove', (e) => {
      const rec = this.pointers.get(e.pointerId);
      if (rec) {
        rec.x = e.clientX;
        rec.y = e.clientY;
        if (rec.dodge && !this.twoFingerUsed) this.checkDodgeFlick(rec, false);
      }
      if (this.pointers.size >= 2) {
        this.checkTwoFinger();
        return;
      }
      if (this.pointerId !== null && e.pointerId !== this.pointerId) return;
      e.preventDefault();
      if (rec?.dodge) return;
      this.updatePos(e, false);
    });
    const up = (e: PointerEvent) => {
      const rec = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (rec && rec.dodge && !this.twoFingerUsed) {
        rec.x = e.clientX;
        rec.y = e.clientY;
        this.checkDodgeFlick(rec, true);
      }
      if (this.pointers.size < 2) this.twoFingerUsed = false;
      if (this.pointerId !== null && e.pointerId !== this.pointerId) return;
      e.preventDefault();
      this.updatePos(e, false);
      if (this.down && this.attackActive) this.released = true;
      this.down = false;
      this.attackActive = false;
      this.pointerId = null;
    };
    bind('pointerup', up);
    bind('pointercancel', up);
    window.addEventListener('keydown', (e) => {
      if (['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || e.code === 'Space') {
        e.preventDefault();
      }
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.keyPressed.add(k);
      this.keys.add(k);
      if (e.code === 'Space') {
        if (!this.keys.has(' ')) this.keyPressed.add(' ');
        this.keys.add(' ');
      }
      if (k === 'a' || k === 'arrowleft') this.queueDodge(-1);
      if (k === 'd' || k === 'arrowright') this.queueDodge(1);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
      if (e.code === 'Space') this.keys.delete(' ');
    });
  }

  consumeDodge(): -1 | 0 | 1 {
    const d = this.dodgeQueued;
    this.dodgeQueued = 0;
    return d;
  }

  consumeForkPick(): -1 | 0 | 1 | 99 {
    const p = this.forkPick;
    this.forkPick = 99;
    return p;
  }

  endFrame(): void {
    this.pressed = false;
    this.released = false;
    this.keyPressed.clear();
    this.px = this.x;
    this.py = this.y;
    this.prevClientX = this.clientX;
    this.prevClientY = this.clientY;
  }

  consume(key: string): boolean {
    if (this.keyPressed.has(key)) {
      this.keyPressed.delete(key);
      return true;
    }
    return false;
  }

  private queueDodge(dir: -1 | 1): void {
    this.dodgeQueued = dir;
  }

  private inDodgeStrip(e: PointerEvent): boolean {
    const host = this.el;
    const r = host ? host.getBoundingClientRect() : { top: 0, height: this.h };
    const v = (e.clientY - r.top) / Math.max(1, r.height || this.h);
    return v >= DODGE_STRIP_Y;
  }

  private checkDodgeFlick(rec: Ptr, isUp: boolean): void {
    if (rec.used) return;
    const dx = rec.x - rec.sx;
    const dy = rec.y - rec.sy;
    const min = isUp ? 18 : 24;
    if (Math.abs(dx) > min && Math.abs(dx) > Math.abs(dy) * 0.75) {
      this.queueDodge(dx < 0 ? -1 : 1);
      rec.used = true;
      rec.sx = rec.x;
      rec.sy = rec.y;
    }
  }

  private checkTwoFinger(): void {
    if (this.pointers.size < 2) return;
    const pts = [...this.pointers.values()];
    let dx = 0;
    let dy = 0;
    for (const p of pts) {
      dx += p.x - p.sx;
      dy += p.y - p.sy;
    }
    dx /= pts.length;
    dy /= pts.length;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 0.85) {
      this.queueDodge(dx < 0 ? -1 : 1);
      for (const p of pts) {
        p.sx = p.x;
        p.sy = p.y;
        p.used = true;
      }
    }
  }

  private syncSize(el: HTMLElement): void {
    const r = el.getBoundingClientRect();
    this.w = r.width || 1;
    this.h = r.height || 1;
  }

  private updatePos(e: PointerEvent, resetVel: boolean): void {
    const host = this.el;
    if (host) this.syncSize(host);
    const r = host ? host.getBoundingClientRect() : { left: 0, top: 0 };
    this.clientX = e.clientX - r.left;
    this.clientY = e.clientY - r.top;
    this.x = this.clientX / this.w;
    this.y = this.clientY / this.h;
    const now = performance.now();
    const dt = Math.max(0.008, (now - this.lastT) / 1000);
    if (resetVel || this.lastT === 0) {
      this.vx = 0;
      this.vy = 0;
    } else {
      this.vx = (this.clientX - this.prevClientX) / dt;
      this.vy = (this.clientY - this.prevClientY) / dt;
    }
    this.lastT = now;
    if (resetVel) {
      this.prevClientX = this.clientX;
      this.prevClientY = this.clientY;
    }
  }
}
