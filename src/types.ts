export type CharId = 'sword' | 'gun' | 'mage';
export type StageId = 0 | 1 | 2;
export type Lane = -1 | 0 | 1;
export type RouteId = 'easy' | 'normal' | 'hard' | 'treasure';
export type PickupKind = 'heart' | 'chest' | 'atk' | 'shield' | 'speed';
export type ScreenId =
  | 'title'
  | 'char'
  | 'stage'
  | 'tutorial'
  | 'play'
  | 'pause'
  | 'win'
  | 'lose';

export type MonsterKind =
  | 'slime'
  | 'wraith'
  | 'beetle'
  | 'pumpkin'
  | 'pumpkinMini'
  | 'goblin'
  | 'miniSlime'
  | 'miniWraith'
  | 'miniBeetle'
  | 'miniDemon'
  | 'bossSlime'
  | 'bossWraith'
  | 'bossDemon';

export type ShotKind =
  | 'ring'
  | 'shard'
  | 'soul'
  | 'wisp'
  | 'beam'
  | 'node'
  | 'fireball'
  | 'orb'
  | 'burst';

export interface CharacterDef {
  id: CharId;
  name: string;
  role: string;
  hint: string;
  desc: string;
  palette: 'frost' | 'ember' | 'azure';
  art: string;
}

export interface RouteDef {
  id: RouteId;
  name: string;
  stars: string;
  blurb: string;
  density: number;
  threat: number;
}

export interface ForkDef {
  at: number;
  routes: RouteId[];
}

export interface EncounterDef {
  at: number;
  kind: MonsterKind;
  mini: boolean;
  name: string;
}

export interface StageDef {
  id: StageId;
  name: string;
  duration: number;
  density: number;
  fog: number;
  ground: number;
  moon: number;
  skyTop: number;
  skyBot: number;
  forks: ForkDef[];
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'sword',
    name: '白霜',
    role: '劍士',
    hint: '滑動螢幕斬擊',
    desc: '霜刃如線。近身揮斬，圈外不中。疾斬可暴擊。',
    palette: 'frost',
    art: './art/baishuang.webp',
  },
  {
    id: 'gun',
    name: '赤煙',
    role: '槍手',
    hint: '點擊射擊',
    desc: '一擊一洞。瞄準頭顱可造成額外傷害。射速有限。',
    palette: 'ember',
    art: './art/chiyan.webp',
  },
  {
    id: 'mage',
    name: '蒼焰',
    role: '法師',
    hint: '長按蓄力，放開射擊',
    desc: '短按弱彈，蓄滿貫穿爆破。蓄力過久則法球潰散。',
    palette: 'azure',
    art: './art/cangyan.webp',
  },
];

export const ROUTES: Record<RouteId, RouteDef> = {
  easy: { id: 'easy', name: '緩坡', stars: '★☆☆', blurb: '補血多', density: 0.62, threat: 0 },
  normal: { id: 'normal', name: '獵道', stars: '★★☆', blurb: '均衡', density: 1, threat: 2 },
  hard: { id: 'hard', name: '死鬥', stars: '★★★', blurb: '寶箱多、敵人狠', density: 1.42, threat: 3 },
  treasure: { id: 'treasure', name: '寶庫', stars: '★★☆', blurb: '寶箱多', density: 0.95, threat: 1 },
};

export const STAGES: StageDef[] = [
  {
    id: 0,
    name: '暴風小徑',
    duration: 68,
    density: 1,
    fog: 0x9ecfff,
    ground: 0x4aaa48,
    moon: 0xffe8a8,
    skyTop: 0x5ab0ff,
    skyBot: 0xffe2b0,
    forks: [{ at: 0.35, routes: ['easy', 'hard'] }],
  },
  {
    id: 1,
    name: '迷霧深林',
    duration: 78,
    density: 1.25,
    fog: 0xb8e0c8,
    ground: 0x3a8a50,
    moon: 0xfff2c4,
    skyTop: 0x6a9aa8,
    skyBot: 0xc8e0c0,
    forks: [{ at: 0.32, routes: ['easy', 'normal', 'hard'] }],
  },
  {
    id: 2,
    name: '魔王祭壇',
    duration: 88,
    density: 1.5,
    fog: 0xffc090,
    ground: 0x6a8a38,
    moon: 0xffb060,
    skyTop: 0xc06040,
    skyBot: 0xffc090,
    forks: [
      { at: 0.28, routes: ['normal', 'treasure'] },
      { at: 0.55, routes: ['easy', 'normal', 'hard'] },
    ],
  },
];

export const ENCOUNTERS: EncounterDef[][] = [
  [
    { at: 0.45, kind: 'miniSlime', mini: true, name: '膠盾騎' },
    { at: 0.85, kind: 'bossSlime', mini: false, name: '晶黏帝' },
  ],
  [
    { at: 0.4, kind: 'miniWraith', mini: true, name: '幽魂長' },
    { at: 0.85, kind: 'bossWraith', mini: false, name: '幽靈王' },
  ],
  [
    { at: 0.38, kind: 'miniBeetle', mini: true, name: '甲殼副官' },
    { at: 0.62, kind: 'miniDemon', mini: true, name: '魔軍尉' },
    { at: 0.85, kind: 'bossDemon', mini: false, name: '魔王' },
  ],
];

export const MAX_HP = 5;
export const COMBO_WINDOW = 1.2;
export const BOSS_AT = 0.85;
export const HIT_Z = -2.4;
export const SPAWN_Z = -38;
export const GUN_COOLDOWN = 0.28;
export const MAGE_FULL = 0.85;
export const MAGE_FIZZLE = 1.45;
export const TUTORIAL_SEC = 20;
export const LANE_X = 1.72;
export const LANE_HALF = 0.86;
export const DODGE_MOVE = 0.32;
export const DODGE_IFRAME = 0.38;
export const DODGE_CD = 0.55;
export const FORK_HOLD = 3.5;
export const DODGE_HINT = '畫面下方左右滑動';
export const PICKUP_HINT = '撿取膠囊強化攻擊與防禦';
export const ATK_MAX = 3;
export const SHIELD_MAX = 2;
export const SPEED_MAX = 2;
export const ULT_CD = 10;
export const ULT_SWORD = 0.9;
export const ULT_GUN = 0.18;
export const ULT_MAGE = 0.28;
export const FREEZE_DUR = 1.4;
export const HIT_HALF = 0.78;
export const PICKUP_ALIGN = 1.12;
export const CHARGE_LOCK_Z = -20;
export const CHARGE_LOCK_T = 0.35;
export const GOBLIN_SPEED = 4.2;
export const GOBLIN_RADIUS = 0.55;
export const GOBLIN_SHOT_COOLDOWN = 1.4;
export const WISP_HOME_T = 0.4;
export const PASS_Z = 5.2;
export const ARENA_Z = -14.2;
export const SWORD_RANGE = 8.4;
export const DODGE_STRIP_Y = 0.8;
export const TURN_DUR = 0.95;

export function laneOf(x: number): Lane {
  if (x < -LANE_HALF) return -1;
  if (x > LANE_HALF) return 1;
  return 0;
}

export function lanePos(lane: Lane | number): number {
  return lane * LANE_X;
}

export function overlapsLane(x: number, radius: number, lane: Lane): boolean {
  return Math.abs(x - lanePos(lane)) <= radius + LANE_HALF;
}

export function overlapsPlayer(x: number, radius: number, playerX: number, extra = HIT_HALF): boolean {
  return Math.abs(x - playerX) <= radius * 0.35 + extra;
}

export function easiestRoute(routes: RouteId[]): RouteId {
  let best = routes[0];
  for (const r of routes) if (ROUTES[r].threat < ROUTES[best].threat) best = r;
  return best;
}

export function goblinSpawnChance(stage: StageId, progress: number, route: RouteId): number {
  if (route === 'easy') return 0;
  if (stage === 0) return progress > 0.35 && (route === 'normal' || route === 'hard') ? 0.12 : 0;
  if (stage === 1) return route === 'normal' || route === 'hard' ? 0.14 : 0;
  if (route === 'treasure') return 0.08;
  return route === 'normal' || route === 'hard' ? 0.16 : 0;
}

export function dirLabel(i: number, n: number): string {
  if (n === 2) return i === 0 ? '左' : '右';
  return i === 0 ? '左' : i === 1 ? '中' : '右';
}
