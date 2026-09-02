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
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return { ...empty(), ...parsed, seenTutorial: { ...empty().seenTutorial, ...parsed.seenTutorial } };
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
