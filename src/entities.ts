import * as THREE from 'three';
import {
  HIT_Z,
  SPAWN_Z,
  LANE_X,
  HIT_HALF,
  CHARGE_LOCK_Z,
  CHARGE_LOCK_T,
  GOBLIN_SPEED,
  GOBLIN_RADIUS,
  GOBLIN_SHOT_COOLDOWN,
  goblinSpawnChance,
  WISP_HOME_T,
  PASS_Z,
  type Lane,
  type MonsterKind,
  type PickupKind,
  type RouteId,
  type ShotKind,
  type StageId,
} from './types';
import { cloneFitted, disposeObject3D, type ModelId } from './models';

export interface Monster {
  id: number;
  kind: MonsterKind;
  hp: number;
  maxHp: number;
  radius: number;
  pos: THREE.Vector3;
  mesh: THREE.Group;
  alive: boolean;
  hitFlash: number;
  t: number;
  phase: number;
  telegraph: number;
  isBoss: boolean;
  seed: number;
  lane: number;
  stunned: number;
  untargetable: boolean;
  spawnedMinis: boolean;
  chargeDmg: number;
  isMiniBoss: boolean;
  homeX: number;
  committed: boolean;
  lockT: number;
  shootCd: number;
  missed: boolean;
  slowT: number;
}

export interface Pickup {
  id: number;
  kind: PickupKind;
  pos: THREE.Vector3;
  mesh: THREE.Group;
  alive: boolean;
  t: number;
  lane: Lane;
}

export interface Shot {
  id: number;
  kind: ShotKind;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  mesh: THREE.Object3D;
  alive: boolean;
  radius: number;
  allLanes: boolean;
  lane: Lane;
  homing: boolean;
  life: number;
  hp: number;
  color: number;
  t: number;
}

let nextId = 1;
const loader = new THREE.TextureLoader();
const texCache = new Map<string, THREE.Texture>();
let preloadOnce: Promise<void> | null = null;
let toonRamp: THREE.DataTexture | null = null;

const BOSS_SRC: Record<string, string> = {
  bossSlime: './art/boss-slime-king.webp',
  bossWraith: './art/boss-wraith-lord-cut.webp',
  bossDemon: './art/boss-demon-lord-cut.webp',
};
const PICK_SRC = {
  heart: './art/pickup-heart-cut.webp',
  chest: './art/pickup-chest-cut.webp',
};

export function preloadSprites(): Promise<void> {
  if (preloadOnce) return preloadOnce;
  const urls = [...Object.values(BOSS_SRC), PICK_SRC.heart, PICK_SRC.chest];
  preloadOnce = Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          loader.load(
            url,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.minFilter = THREE.LinearFilter;
              tex.magFilter = THREE.LinearFilter;
              tex.generateMipmaps = false;
              texCache.set(url, tex);
              resolve();
            },
            undefined,
            () => resolve(),
          );
        }),
    ),
  ).then(() => undefined);
  return preloadOnce;
}

function getTex(url: string): THREE.Texture {
  const hit = texCache.get(url);
  if (hit) return hit;
  const tex = loader.load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set(url, tex);
  return tex;
}

function ramp(): THREE.DataTexture {
  if (toonRamp) return toonRamp;
  const data = new Uint8Array([92, 150, 210, 255]);
  toonRamp = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  toonRamp.minFilter = THREE.NearestFilter;
  toonRamp.magFilter = THREE.NearestFilter;
  toonRamp.needsUpdate = true;
  return toonRamp;
}

function toon(color: number): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: ramp() });
}
function gold(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xe0c25a,
    roughness: 0.3,
    metalness: 0.82,
    emissive: 0x4a3408,
    emissiveIntensity: 0.2,
  });
}

function blob(r: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 10),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  return m;
}

function makeSlime(mini = false): THREE.Group {
  const g = new THREE.Group();
  const s = mini ? 0.55 : 1;
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * s, 1), toon(0x3ecf6a));
  (body.material as THREE.MeshToonMaterial).transparent = true;
  (body.material as THREE.MeshToonMaterial).opacity = 0.92;
  body.position.y = 0.5 * s;
  body.castShadow = true;
  g.add(body);
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16 * s),
    new THREE.MeshStandardMaterial({ color: 0xa8ffd0, emissive: 0x44ffaa, emissiveIntensity: 0.9, roughness: 0.25 }),
  );
  core.position.y = 0.42 * s;
  g.add(core);
  const eyeW = new THREE.MeshStandardMaterial({ color: 0xf8fff8, roughness: 0.4 });
  const eyeB = new THREE.MeshStandardMaterial({ color: 0x102010, roughness: 0.5 });
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.11 * s, 8, 8), eyeW);
    w.position.set(sx * 0.18 * s, 0.62 * s, 0.38 * s);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 6, 6), eyeB);
    p.position.set(sx * 0.18 * s, 0.62 * s, 0.47 * s);
    g.add(w, p);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42 * s, 0.035 * s, 6, 16), gold());
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.32 * s;
  g.add(ring);
  g.add(blob(0.4 * s));
  g.userData.body = body;
  return g;
}

function makeWraith(): THREE.Group {
  const g = new THREE.Group();
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.15, 7, 1, true), toon(0x3a2468));
  (hood.material as THREE.MeshToonMaterial).transparent = true;
  (hood.material as THREE.MeshToonMaterial).opacity = 0.88;
  (hood.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
  hood.position.y = 1.05;
  g.add(hood);
  const cowl = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 6, 12), gold());
  cowl.rotation.x = Math.PI / 2;
  cowl.position.y = 0.72;
  g.add(cowl);
  const eyeM = new THREE.MeshStandardMaterial({ color: 0xccaaff, emissive: 0xaa66ff, emissiveIntensity: 1.2 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeM);
    e.position.set(sx * 0.12, 1.12, 0.22);
    g.add(e);
  }
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.7, 6, 1, true), toon(0x241838));
  (skirt.material as THREE.MeshToonMaterial).transparent = true;
  (skirt.material as THREE.MeshToonMaterial).opacity = 0.7;
  (skirt.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
  skirt.position.y = 0.38;
  skirt.rotation.x = Math.PI;
  g.add(skirt);
  g.add(blob(0.35));
  g.userData.body = hood;
  return g;
}

function makeBeetle(): THREE.Group {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), toon(0x2a3a28));
  shell.scale.set(1.15, 0.7, 1.35);
  shell.position.y = 0.32;
  shell.castShadow = true;
  g.add(shell);
  const plate = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI), gold());
  plate.scale.set(1.05, 0.45, 1.1);
  plate.position.set(0, 0.42, 0.05);
  plate.rotation.x = -0.4;
  g.add(plate);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.42, 5), gold());
  horn.position.set(0, 0.48, 0.48);
  horn.rotation.x = 1.1;
  g.add(horn);
  const legM = new THREE.MeshStandardMaterial({ color: 0x1a1a14, roughness: 0.7 });
  for (let i = 0; i < 3; i++) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.32, 4), legM);
      leg.position.set(s * 0.38, 0.12, -0.18 + i * 0.2);
      leg.rotation.z = s * 0.7;
      g.add(leg);
    }
  }
  const eyeM = new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffaa22, emissiveIntensity: 0.8 });
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeM);
    e.position.set(s * 0.14, 0.38, 0.48);
    g.add(e);
  }
  g.add(blob(0.42));
  g.userData.body = shell;
  return g;
}

function makePumpkin(mini = false): THREE.Group {
  const g = new THREE.Group();
  const s = mini ? 0.55 : 1;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.48 * s, 10, 8), toon(0xe07020));
  body.scale.set(1.1, 0.9, 1);
  body.position.y = 0.42 * s;
  body.castShadow = true;
  g.add(body);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05 * s, 0.07 * s, 0.22 * s, 5),
    new THREE.MeshStandardMaterial({ color: 0x3a7a28, roughness: 0.8 }),
  );
  stem.position.y = 0.82 * s;
  g.add(stem);
  const face = new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xff8800, emissiveIntensity: 0.85 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 6, 6), face);
    e.position.set(sx * 0.16 * s, 0.48 * s, 0.4 * s);
    g.add(e);
  }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.06 * s, 0.04 * s), face);
  mouth.position.set(0, 0.32 * s, 0.42 * s);
  g.add(mouth);
  const vine = new THREE.Mesh(new THREE.TorusGeometry(0.28 * s, 0.025 * s, 5, 10, Math.PI), gold());
  vine.position.y = 0.55 * s;
  vine.rotation.y = 0.4;
  g.add(vine);
  g.add(blob(0.38 * s));
  g.userData.body = body;
  return g;
}

function makeGoblinFallback(): THREE.Group {
  const g = new THREE.Group();
  const skin = toon(0x6d9b4c);
  const leather = new THREE.MeshStandardMaterial({ color: 0x5a3828, roughness: 0.82 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.48, 4, 7), leather);
  body.position.y = 0.58;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 6), skin);
  head.position.y = 1.03;
  head.castShadow = true;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34, 5), skin);
    ear.position.set(side * 0.3, 1.06, 0);
    ear.rotation.z = side * -Math.PI / 2;
    g.add(ear);
  }
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.025, 5, 12, Math.PI), gold());
  bow.position.set(0, 0.68, 0.25);
  bow.rotation.z = Math.PI / 2;
  g.add(body, head, bow, blob(0.35));
  g.userData.body = head;
  return g;
}

function makeBillboard(url: string, h: number): THREE.Group {
  const g = new THREE.Group();
  const tex = getTex(url);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.06,
    fog: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(mat);
  const apply = (t: THREE.Texture) => {
    const img = t.image as HTMLImageElement | undefined;
    const aspect = img && img.height ? img.width / img.height : 1;
    sprite.scale.set(h * aspect, h, 1);
    g.userData.baseW = h * aspect;
    g.userData.baseH = h;
  };
  if (tex.image && (tex.image as HTMLImageElement).height) apply(tex);
  else tex.image ? apply(tex) : loader.load(url, apply);
  sprite.center.set(0.5, 0.08);
  g.add(sprite);
  g.userData.body = sprite;
  g.userData.baseW = h;
  g.userData.baseH = h;

  const ptsGeo = new THREE.BufferGeometry();
  const n = 28;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    arr[i * 3] = Math.cos(a) * 1.1;
    arr[i * 3 + 1] = 0.8 + Math.sin(a * 2) * 0.5;
    arr[i * 3 + 2] = Math.sin(a) * 0.4;
  }
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const aura = new THREE.Points(
    ptsGeo,
    new THREE.PointsMaterial({
      color: 0xf4d06a,
      size: 0.18,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  g.add(aura);
  g.userData.aura = aura;
  g.add(blob(0.9));
  return g;
}

function makeEliteBeetle(): THREE.Group {
  const g = makeBeetle();
  g.scale.setScalar(1.72);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 5), gold());
  crest.position.set(0, 0.92, 0.12);
  g.add(crest);
  return g;
}


const BOSS_GLB: Partial<Record<MonsterKind, { id: ModelId; height: number; art: string; h: number }>> = {
  bossSlime: { id: 'slime_king', height: 2.4, art: BOSS_SRC.bossSlime, h: 3.6 },
  miniWraith: { id: 'ghost_king', height: 2.0, art: BOSS_SRC.bossWraith, h: 2.15 },
  bossWraith: { id: 'ghost_king', height: 2.8, art: BOSS_SRC.bossWraith, h: 3.5 },
  bossDemon: { id: 'demon_king', height: 3.2, art: BOSS_SRC.bossDemon, h: 3.9 },
};

const MINION_GLB: Partial<Record<MonsterKind, { id: ModelId; height: number; fallback: () => THREE.Group }>> = {
  slime: { id: 'slime', height: 0.9, fallback: () => makeSlime(false) },
  wraith: { id: 'ghost', height: 1.2, fallback: () => makeWraith() },
  beetle: { id: 'beetle', height: 0.8, fallback: () => makeBeetle() },
  pumpkin: { id: 'pumpkin', height: 0.9, fallback: () => makePumpkin(false) },
  pumpkinMini: { id: 'pumpkin', height: 0.5, fallback: () => makePumpkin(true) },
  goblin: { id: 'goblin', height: 1.25, fallback: () => makeGoblinFallback() },
  miniBeetle: { id: 'beetle', height: 1.38, fallback: () => makeEliteBeetle() },
};

function wrapGlb(model: THREE.Group, scale: number, blobR: number, withAura: boolean): THREE.Group {
  const g = new THREE.Group();
  const visual = new THREE.Group();
  visual.add(model);
  let s = scale;
  if (!Number.isFinite(s)) s = 1;
  s = Math.min(4, Math.max(0.05, s));
  visual.scale.setScalar(s);
  g.add(visual);
  g.userData.glb = true;
  g.userData.glbVisual = visual;
  g.userData.glbScale = s;
  g.userData.body = visual;

  if (withAura) {
    const ptsGeo = new THREE.BufferGeometry();
    const n = 28;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * 1.1;
      arr[i * 3 + 1] = 0.8 + Math.sin(a * 2) * 0.5;
      arr[i * 3 + 2] = Math.sin(a) * 0.4;
    }
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const aura = new THREE.Points(
      ptsGeo,
      new THREE.PointsMaterial({
        color: 0xf4d06a,
        size: 0.18,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    g.add(aura);
    g.userData.aura = aura;
  }
  g.add(blob(blobR));
  return g;
}

export function createMonsterMesh(kind: MonsterKind): THREE.Group {
  if (kind === 'miniSlime') {
    const packed = cloneFitted('gel_shield', 1.7);
    if (packed) {
      const g = wrapGlb(packed.model, packed.scale, 0.9, true);
      (g.userData.glbVisual as THREE.Group).rotateY(Math.PI);
      return g;
    }
    return makeSlime(false);
  }
  if (kind === 'miniDemon') {
    const packed = cloneFitted('demon_lieutenant', 2.0);
    if (packed) return wrapGlb(packed.model, packed.scale, 0.9, true);
    return makeBillboard('./art/mini-demon-lieutenant.webp', 2.0);
  }
  const minion = MINION_GLB[kind];
  if (minion) {
    const packed = cloneFitted(minion.id, minion.height);
    if (packed) return wrapGlb(packed.model, packed.scale, 0.4, false);
    return minion.fallback();
  }
  const spec = BOSS_GLB[kind];
  if (spec) {
    const packed = cloneFitted(spec.id, spec.height);
    if (packed) return wrapGlb(packed.model, packed.scale, 0.9, true);
    if (kind === 'bossSlime') return makeSlime(false);
    return makeBillboard(spec.art, spec.h);
  }
  return makeSlime(false);
}

export function upgradeMonsterMesh(m: Monster): boolean {
  if (!m.alive || m.mesh.userData.glb) return false;
  const next = createMonsterMesh(m.kind);
  if (!next.userData.glb) return false;
  const parent = m.mesh.parent;
  if (parent) {
    parent.add(next);
    parent.remove(m.mesh);
  }
  disposeObject3D(m.mesh);
  next.position.copy(m.pos);
  m.mesh = next;
  return true;
}

export function spawnMonster(kind: MonsterKind, lane?: number, playerX = 0, spreadX?: number): Monster {
  const mesh = createMonsterMesh(kind);
  const isMiniBoss = kind.startsWith('mini');
  const isBoss = kind.startsWith('boss') || isMiniBoss;
  const hp =
    kind === 'slime' ? 1 :
    kind === 'wraith' ? 1 :
    kind === 'beetle' ? 2 + (Math.random() < 0.4 ? 1 : 0) :
    kind === 'pumpkin' ? 1 :
    kind === 'pumpkinMini' ? 1 :
    kind === 'goblin' ? 1 :
    kind === 'miniSlime' ? 4 :
    kind === 'miniWraith' ? 4 :
    kind === 'miniBeetle' ? 5 :
    kind === 'miniDemon' ? 5 :
    kind === 'bossSlime' ? 8 :
    kind === 'bossWraith' ? 8 :
    10;
  const radius =
    kind === 'bossSlime' ? 1.55 :
    kind === 'bossDemon' ? 1.4 :
    kind === 'bossWraith' ? 1.15 :
    kind === 'miniSlime' ? 1.05 :
    kind === 'miniWraith' ? 0.95 :
    kind === 'miniBeetle' ? 1.02 :
    kind === 'miniDemon' ? 1.12 :
    kind === 'pumpkinMini' ? 0.38 :
    kind === 'goblin' ? GOBLIN_RADIUS :
    kind === 'beetle' ? 0.7 :
    0.62;
  const ln = lane ?? 0;
  const spread = spreadX ?? (isBoss ? 0 : (Math.random() - 0.5) * 0.9);
  const homeX = isBoss ? 0 : playerX + spread;
  const pos = new THREE.Vector3(isBoss ? 0 : homeX, isBoss ? 0.2 : 0, SPAWN_Z - Math.random() * 3);
  if (kind === 'pumpkinMini') pos.z = Math.min(-8, pos.z + 18);
  if (isBoss) pos.set(0, 0.15, -16);
  mesh.position.copy(pos);
  return {
    id: nextId++,
    kind,
    hp,
    maxHp: hp,
    radius,
    pos,
    mesh,
    alive: true,
    hitFlash: 0,
    t: 0,
    phase: 0,
    telegraph: 0,
    isBoss,
    isMiniBoss,
    seed: Math.random() * Math.PI * 2,
    lane: ln,
    stunned: 0,
    untargetable: false,
    spawnedMinis: false,
    chargeDmg: 0,
    homeX,
    committed: false,
    lockT: 0,
    shootCd: GOBLIN_SHOT_COOLDOWN,
    missed: false,
    slowT: 0,
  };
}

function tintStd(mat: THREE.MeshStandardMaterial, m: Monster): void {
  if (!mat.userData.baseEm) {
    mat.userData.baseEm = mat.emissive.clone();
    mat.userData.baseEi = mat.emissiveIntensity;
    mat.userData.baseCol = mat.color.clone();
  }
  if (m.untargetable) {
    mat.color.setRGB(0.55, 0.55, 0.7);
  } else if (m.hitFlash > 0) {
    mat.color.copy(mat.userData.baseCol);
    mat.emissive.setRGB(0.9, 0.22, 0.18);
    mat.emissiveIntensity = 0.95;
  } else if (m.slowT > 0) {
    mat.color.copy(mat.userData.baseCol);
    mat.emissive.setRGB(0.12, 0.4, 0.85);
    mat.emissiveIntensity = 0.55;
  } else {
    mat.color.copy(mat.userData.baseCol);
    mat.emissive.copy(mat.userData.baseEm);
    mat.emissiveIntensity = mat.userData.baseEi;
  }
}

function flashBody(m: Monster): void {
  if (m.mesh.userData.glb) {
    m.mesh.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const raw of mats) {
        const mat = raw as THREE.MeshStandardMaterial;
        if (mat && 'emissive' in mat) tintStd(mat, m);
      }
    });
    if (m.untargetable) m.mesh.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).visible = Math.sin(m.t * 40) > 0; });
    else m.mesh.traverse((o) => { o.visible = true; });
    return;
  }
  const body = m.mesh.userData.body as THREE.Mesh | THREE.Sprite | undefined;
  if (!body) return;
  const mat = body.material as THREE.MeshToonMaterial | THREE.SpriteMaterial;
  if ('color' in mat) {
    if (m.untargetable) mat.color.setRGB(0.55, 0.55, 0.7);
    else if (m.hitFlash > 0) mat.color.setRGB(1, 0.55, 0.62);
    else if (m.slowT > 0) mat.color.setRGB(0.55, 0.86, 1);
    else mat.color.setRGB(1, 1, 1);
  }
  if (m.untargetable) m.mesh.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).visible = Math.sin(m.t * 40) > 0; });
  else m.mesh.traverse((o) => { o.visible = true; });
}

export function updateMonster(m: Monster, dt: number, hold = false, playerX = 0): 'hitPlayer' | 'lunge' | 'passed' | null {
  if (!m.alive) return null;
  m.t += dt;
  m.hitFlash = Math.max(0, m.hitFlash - dt * 6);
  m.stunned = Math.max(0, m.stunned - dt);
  m.slowT = Math.max(0, m.slowT - dt);
  flashBody(m);
  const aura = m.mesh.userData.aura as THREE.Points | undefined;
  if (aura) aura.rotation.y += dt * 0.7;
  const vis = m.mesh.userData.glbVisual as THREE.Group | undefined;
  if (vis) {
    const base = (m.mesh.userData.glbScale as number) || 1;
    const b = 1 + Math.sin(m.t * 2.1) * 0.03;
    const s = base * b;
    if (Number.isFinite(s)) vis.scale.setScalar(s);
    vis.position.y = Math.sin(m.t * 1.7) * 0.035;
    const y = Math.atan2(playerX - m.pos.x, 0.35 - m.pos.z) + Math.PI;
    if (Number.isFinite(y)) m.mesh.rotation.y = y;
  } else if (aura) {
    const breathe = 1 + Math.sin(m.t * 2.2) * 0.045;
    m.mesh.scale.set(breathe, breathe, breathe);
  }

  if (m.isBoss) {
    m.mesh.position.copy(m.pos);
    return null;
  }
  if (hold) {
    m.mesh.position.copy(m.pos);
    return null;
  }

  let speed = 5.0;
  if (m.kind === 'slime') speed = 3.8;
  if (m.kind === 'wraith') speed = 8.1;
  if (m.kind === 'beetle') speed = 4.8;
  if (m.kind === 'pumpkin') speed = 5.0;
  if (m.kind === 'pumpkinMini') speed = 6.2;
  if (m.kind === 'goblin') speed = GOBLIN_SPEED;
  if (m.stunned > 0) speed *= 0.15;
  if (m.slowT > 0) speed *= 0.28;

  if (!m.committed) {
    if (m.pos.z >= CHARGE_LOCK_Z) {
      m.lockT += dt;
      m.homeX = THREE.MathUtils.damp(m.homeX, playerX, 4.5, dt);
      if (m.lockT >= CHARGE_LOCK_T) m.committed = true;
    } else {
      m.homeX = THREE.MathUtils.damp(m.homeX, playerX, 0.55, dt);
    }
  }
  const targetX = m.homeX;
  const rush = m.committed ? 1.55 : THREE.MathUtils.lerp(0.82, 1.18, THREE.MathUtils.clamp((m.pos.z + 38) / 18, 0, 1));
  const xDamp = m.committed ? 0.35 : 1.05;
  const wobble = m.committed ? 0.02 : 0.08;

  if (m.kind === 'slime' || m.kind === 'pumpkinMini') {
    const hopT = (m.t * 1.2) % 1;
    const hopY = Math.abs(Math.sin(hopT * Math.PI)) * 0.85;
    m.pos.x = THREE.MathUtils.damp(m.pos.x, targetX, xDamp, dt);
    m.pos.y = hopY;
    m.pos.z += speed * dt * rush * (hopT > 0.12 && hopT < 0.88 ? 1 : 0.28);
    if (m.mesh.userData.glb) {
      if (vis) {
        const base = (m.mesh.userData.glbScale as number) || 1;
        const b = 1 + Math.sin(m.t * 2.1) * 0.03;
        const hop = 1 + Math.sin(hopT * Math.PI) * 0.08;
        const s = base * b * hop;
        if (Number.isFinite(s)) vis.scale.setScalar(s);
      }
    } else {
      m.mesh.scale.set(1 + Math.sin(hopT * Math.PI) * 0.08, 1 - Math.sin(hopT * Math.PI) * 0.14, 1);
    }
  } else if (m.kind === 'wraith') {
    m.pos.x = THREE.MathUtils.damp(m.pos.x, targetX, xDamp, dt) + Math.sin(m.t * 6 + m.seed) * wobble;
    m.pos.y = 0.35 + Math.sin(m.t * 5.2 + m.seed) * 0.35;
    m.pos.z += speed * dt * rush;
    m.mesh.rotation.z = Math.sin(m.t * 3.4 + m.seed) * 0.08;
  } else if (m.kind === 'beetle') {
    m.pos.x = THREE.MathUtils.damp(m.pos.x, targetX, xDamp, dt);
    m.pos.y = 0.02 + Math.sin(m.t * 10) * 0.04;
    m.pos.z += speed * dt * rush;
  } else {
    m.pos.x = THREE.MathUtils.damp(m.pos.x, targetX, xDamp, dt) + Math.sin(m.t * 2 + m.seed) * wobble;
    m.pos.y = Math.abs(Math.sin(m.t * 4)) * 0.28;
    m.pos.z += speed * dt * rush;
    m.mesh.rotation.y = m.t * 1.4;
  }

  if (m.missed) {
    const away = Math.sign(m.pos.x - playerX) || (m.homeX >= 0 ? 1 : -1);
    m.pos.x += away * 7.2 * dt;
    m.pos.z += speed * 1.7 * dt;
    m.mesh.position.copy(m.pos);
    if (m.pos.z > PASS_Z) return 'passed';
    return null;
  }

  m.mesh.position.copy(m.pos);
  if (m.pos.z >= HIT_Z) {
    const hitW = HIT_HALF + m.radius * 0.35;
    if (Math.abs(m.pos.x - playerX) <= hitW) return 'hitPlayer';
    m.missed = true;
  }
  return null;
}

export function pickSpawn(stage: StageId, progress: number, route: RouteId): MonsterKind {
  const roll = Math.random();
  const goblinChance = goblinSpawnChance(stage, progress, route);
  if (roll < goblinChance) return 'goblin';
  // Re-normalize the remainder so the existing enemy mix keeps its proportions.
  const r = goblinChance < 1 ? (roll - goblinChance) / (1 - goblinChance) : 0;
  if (route === 'easy') {
    if (r < 0.82) return 'slime';
    if (r < 0.94) return 'pumpkin';
    return 'wraith';
  }
  if (route === 'treasure') {
    if (r < 0.55) return 'pumpkin';
    if (r < 0.78) return 'slime';
    return 'wraith';
  }
  if (route === 'hard') {
    if (r < 0.42) return 'wraith';
    if (r < 0.78) return 'beetle';
    if (r < 0.9) return 'pumpkin';
    return 'slime';
  }
  if (stage === 0) {
    if (progress > 0.45 && r < 0.28) return 'beetle';
    if (r < 0.22) return 'wraith';
    return 'slime';
  }
  if (stage === 1) {
    if (r < 0.28) return 'pumpkin';
    if (r < 0.62) return 'wraith';
    if (r < 0.82) return 'slime';
    return 'beetle';
  }
  if (r < 0.22) return 'pumpkin';
  if (r < 0.5) return 'wraith';
  if (r < 0.75) return 'beetle';
  return 'slime';
}

export function bossKind(stage: StageId): MonsterKind {
  return stage === 0 ? 'bossSlime' : stage === 1 ? 'bossWraith' : 'bossDemon';
}

const glyphCache = new Map<string, THREE.CanvasTexture>();

function glyphTex(ch: string, fill: string): THREE.CanvasTexture {
  const key = ch + fill;
  const hit = glyphCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.font = '800 70px "Noto Serif TC", "Source Han Serif TC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20, 12, 8, 0.7)';
  ctx.lineWidth = 10;
  ctx.strokeText(ch, 64, 70);
  ctx.fillStyle = fill;
  ctx.fillText(ch, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  glyphCache.set(key, tex);
  return tex;
}

function makeCapsuleMesh(kind: 'atk' | 'shield' | 'speed'): THREE.Group {
  const g = new THREE.Group();
  const color = kind === 'atk' ? 0xff3a48 : kind === 'shield' ? 0x4a88ff : 0xffd24a;
  const em = kind === 'atk' ? 0xff2244 : kind === 'shield' ? 0x2266ff : 0xffc018;
  const gem = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.32, 0),
    new THREE.MeshStandardMaterial({
      color,
      emissive: em,
      emissiveIntensity: 1.2,
      roughness: 0.22,
      metalness: 0.38,
      transparent: true,
      opacity: 0.94,
    }),
  );
  gem.position.y = 0.4;
  gem.castShadow = true;
  g.add(gem);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.028, 6, 16),
    new THREE.MeshStandardMaterial({ color, emissive: em, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.5 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.4;
  g.add(ring);
  const light = new THREE.PointLight(color, 0.9, 4.8, 2);
  light.position.y = 0.45;
  g.add(light);
  const letter = kind === 'atk' ? '攻' : kind === 'shield' ? '盾' : '速';
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glyphTex(letter, '#fffef6'),
    transparent: true,
    depthWrite: false,
    fog: false,
  }));
  spr.scale.set(0.72, 0.72, 1);
  spr.position.y = 0.98;
  g.add(spr);
  g.add(blob(0.28));
  g.userData.body = gem;
  g.userData.ring = ring;
  return g;
}

function makePickupSprite(kind: 'heart' | 'chest'): THREE.Group {
  const mesh = new THREE.Group();
  const tex = getTex(PICK_SRC[kind]);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.06,
    fog: false,
  });
  const spr = new THREE.Sprite(mat);
  const h = kind === 'heart' ? 0.85 : 1.05;
  const img = tex.image as HTMLImageElement | undefined;
  const aspect = img && img.height ? img.width / img.height : 1;
  spr.scale.set(h * aspect, h, 1);
  spr.center.set(0.5, 0.0);
  mesh.add(spr);
  mesh.userData.body = spr;
  mesh.add(blob(0.28));
  return mesh;
}

export function spawnPickup(kind: PickupKind, lane?: Lane): Pickup {
  let mesh: THREE.Group;
  if (kind === 'atk' || kind === 'shield' || kind === 'speed') {
    mesh = makeCapsuleMesh(kind);
  } else {
    const id = kind === 'heart' ? 'heart_crystal' : 'chest';
    const h = kind === 'heart' ? 0.35 : 0.5;
    const packed = cloneFitted(id, h);
    mesh = packed ? wrapGlb(packed.model, packed.scale, 0.28, false) : makePickupSprite(kind);
  }
  const x = lane !== undefined ? lane * LANE_X : (Math.random() - 0.5) * 3.4;
  const ln = (lane ?? (x < -LANE_X * 0.4 ? -1 : x > LANE_X * 0.4 ? 1 : 0)) as Lane;
  const pos = new THREE.Vector3(x, 0.15, SPAWN_Z + 4);
  mesh.position.copy(pos);
  return { id: nextId++, kind, pos, mesh, alive: true, t: 0, lane: ln };
}

export function updatePickup(p: Pickup, dt: number, hold = false): 'near' | null {
  p.t += dt;
  const cap = p.kind === 'atk' || p.kind === 'shield' || p.kind === 'speed';
  p.pos.y = 0.2 + Math.sin(p.t * 3.2) * (cap ? 0.18 : 0.12);
  if (cap) {
    p.mesh.rotation.y += dt * 2.4;
    p.mesh.rotation.z = Math.sin(p.t * 2.1) * 0.18;
    const ring = p.mesh.userData.ring as THREE.Mesh | undefined;
    if (ring) ring.rotation.z += dt * 3.2;
  } else {
    p.mesh.rotation.y = Math.sin(p.t * 1.4) * 0.15;
  }
  if (!hold) p.pos.z += 6.2 * dt;
  p.mesh.position.copy(p.pos);
  if (p.pos.z >= HIT_Z) return 'near';
  return null;
}

function shotMat(color: number, emissive: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 1.4,
    roughness: 0.25,
    metalness: 0.2,
    transparent: true,
    opacity: 0.92,
  });
}

export function spawnShot(kind: ShotKind, pos: THREE.Vector3, opts?: Partial<Shot>): Shot {
  const color =
    kind === 'shard' || kind === 'ring' ? 0x66ddff :
    kind === 'soul' || kind === 'wisp' || kind === 'burst' ? 0xcc66ff :
    kind === 'beam' || kind === 'node' ? 0xaa44ff :
    kind === 'fireball' ? 0xff3344 :
    0xff88aa;
  const emissive = color;
  let mesh: THREE.Object3D;
  let radius = 0.28;
  if (kind === 'beam') {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 14, 8), shotMat(color, emissive));
    core.rotation.x = Math.PI / 2;
    g.add(core);
    mesh = g;
    radius = 0.45;
  } else if (kind === 'ring') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), shotMat(color, emissive));
    radius = 0.32;
  } else if (kind === 'fireball') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), shotMat(color, 0xff6622));
    radius = 0.36;
  } else if (kind === 'wisp') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), shotMat(color, emissive));
    radius = 0.3;
  } else {
    mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), shotMat(color, emissive));
    radius = 0.28;
  }
  mesh.position.copy(pos);
  const lane = opts?.lane ?? 0;
  return {
    id: nextId++,
    kind,
    pos: pos.clone(),
    vel: opts?.vel?.clone() ?? new THREE.Vector3(0, 0, 7.5),
    mesh,
    alive: true,
    radius: opts?.radius ?? radius,
    allLanes: opts?.allLanes ?? (kind === 'ring' || kind === 'beam'),
    lane,
    homing: opts?.homing ?? kind === 'wisp',
    life: opts?.life ?? 4,
    hp: opts?.hp ?? 1,
    color,
    t: 0,
  };
}

export function updateShot(s: Shot, dt: number, playerLaneX: number, hold = false): 'hitPlayer' | null {
  if (!s.alive) return null;
  s.t += dt;
  s.life -= dt;
  if (hold) {
    s.mesh.position.copy(s.pos);
    return null;
  }
  if (s.homing && s.t < WISP_HOME_T) {
    s.vel.x = THREE.MathUtils.damp(s.vel.x, (playerLaneX - s.pos.x) * 0.85, 0.7, dt);
    s.mesh.scale.setScalar(1 + Math.sin(s.t * 8) * 0.12);
  } else if (s.homing) {
    s.mesh.scale.setScalar(1 + Math.sin(s.t * 8) * 0.12);
  }
  if (s.kind === 'orb') {
    s.pos.x = Math.sin(s.t * 3.4 + s.lane) * LANE_X * 1.05;
  }
  s.pos.addScaledVector(s.vel, dt);
  s.mesh.position.copy(s.pos);
  s.mesh.rotation.y += dt * 4;
  if (s.life <= 0) {
    s.alive = false;
    return null;
  }
  if (s.pos.z >= HIT_Z) {
    if (s.allLanes || Math.abs(s.pos.x - playerLaneX) <= HIT_HALF + s.radius) return 'hitPlayer';
  }
  if (s.pos.z > PASS_Z) {
    s.alive = false;
    return null;
  }
  return null;
}
