import type { CharId, StageId } from './types';

const KEY = 'blade-walker-save-v1';

export interface SaveData {
  unlockedStage: number;
  best: Record<string, number>;
  seenTutorial: Record<CharId, boolean>;
  muteSfx: boolean;
  muteBgm: boolean;
  seenUltHint: boolean;
}

const empty = (): SaveData => ({
  unlockedStage: 0,
  best: {},
  seenTutorial: { sword: false, gun: false, mage: false },
  muteSfx: false,
  muteBgm: false,
  seenUltHint: false,
});

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return empty();
    const seen = isRecord(parsed.seenTutorial) ? parsed.seenTutorial : {};
    const unlocked = typeof parsed.unlockedStage === 'number' && Number.isFinite(parsed.unlockedStage)
      ? Math.min(2, Math.max(0, Math.floor(parsed.unlockedStage)))
      : 0;
    return {
      unlockedStage: unlocked,
      best: cleanBest(parsed.best),
      seenTutorial: {
        sword: seen.sword === true,
        gun: seen.gun === true,
        mage: seen.mage === true,
      },
      muteSfx: parsed.muteSfx === true,
      muteBgm: parsed.muteBgm === true,
      seenUltHint: parsed.seenUltHint === true,
    };
  } catch {
    return empty();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function scoreKey(char: CharId, stage: StageId): string {
  return `${char}:${stage}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanBest(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const result: Record<string, number> = {};
  for (const [key, score] of Object.entries(value)) {
    if (!/^(sword|gun|mage):[0-2]$/.test(key)) continue;
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0) continue;
    result[key] = Math.floor(score);
  }
  return result;
}
