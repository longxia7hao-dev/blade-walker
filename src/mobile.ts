export function isPhone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.innerWidth < 820 ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export function viewportSize(): { w: number; h: number } {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.round(vv?.width ?? window.innerWidth)),
    h: Math.max(1, Math.round(vv?.height ?? window.innerHeight)),
  };
}

export function pinRoot(root: HTMLElement): { w: number; h: number } {
  const { w, h } = viewportSize();
  const vv = window.visualViewport;
  root.style.width = `${w}px`;
  root.style.height = `${h}px`;
  root.style.left = `${vv?.offsetLeft ?? 0}px`;
  root.style.top = `${vv?.offsetTop ?? 0}px`;
  document.documentElement.style.setProperty('--vvh', `${h}px`);
  document.documentElement.style.setProperty('--vvw', `${w}px`);
  return { w, h };
}

export function bindViewport(fn: () => void): void {
  window.addEventListener('resize', fn);
  window.addEventListener('orientationchange', () => {
    fn();
    setTimeout(fn, 60);
    setTimeout(fn, 300);
  });
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', fn);
    vv.addEventListener('scroll', fn);
  }
}

export function preventBrowserChrome(): void {
  const block = (e: Event) => e.preventDefault();
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(t, block, { passive: false });
  }
  document.addEventListener(
    'touchmove',
    (e) => {
      const el = e.target as HTMLElement | null;
      if (el && typeof el.closest === 'function' && el.closest('[data-scroll]')) return;
      e.preventDefault();
    },
    { passive: false },
  );
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      const el = e.target as HTMLElement | null;
      const onUi = !!(el && typeof el.closest === 'function' && el.closest('button, a, [data-scroll], .screen.overlay'));
      if (!onUi && now - lastTouchEnd < 320) e.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false },
  );
}

export function setupInstallHint(): void {
  const bar = document.getElementById('install-hint');
  if (!bar) return;
  const dismiss = document.getElementById('btn-dismiss-install');
  const hide = (): void => {
    bar.classList.add('hidden');
    try {
      sessionStorage.setItem('bw-install-dismissed', '1');
    } catch {
      /* ignore */
    }
  };
  dismiss?.addEventListener('click', hide);
  let dismissed = false;
  try {
    dismissed = sessionStorage.getItem('bw-install-dismissed') === '1';
  } catch {
    dismissed = false;
  }
  const show = isIOS() && !isStandalone() && !dismissed;
  bar.classList.toggle('hidden', !show);
}

export function registerPwa(): void {
  if (!('serviceWorker' in navigator)) return;
  const register = (): void => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}

export function unlockAudioOnGesture(unlock: () => void): void {
  const once = (): void => {
    unlock();
    window.removeEventListener('pointerdown', once);
    window.removeEventListener('touchstart', once);
    window.removeEventListener('keydown', once);
  };
  window.addEventListener('pointerdown', once, { passive: true });
  window.addEventListener('touchstart', once, { passive: true });
  window.addEventListener('keydown', once);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') unlock();
  });
}
