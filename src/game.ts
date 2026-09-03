import * as THREE from 'three';
import {
  CHARACTERS,
  STAGES,
  MAX_HP,
  COMBO_WINDOW,
  BOSS_AT,
  GUN_COOLDOWN,
  MAGE_FULL,
  MAGE_FIZZLE,
  TUTORIAL_SEC,
  LANE_X,
  DODGE_MOVE,
  DODGE_IFRAME,
  DODGE_CD,
  FORK_HOLD,
  ROUTES,
  SWORD_RANGE,
  TURN_DUR,
  HIT_Z,
  HIT_HALF,
  PICKUP_ALIGN,
  PASS_Z,
  ARENA_Z,
  ENCOUNTERS,
  ATK_MAX,
  SHIELD_MAX,
  SPEED_MAX,
  ULT_CD,
  ULT_SWORD,
  ULT_GUN,
  ULT_MAGE,
  FREEZE_DUR,
  GOBLIN_SHOT_COOLDOWN,
  PICKUP_HINT,
  easiestRoute,
  dirLabel,
  overlapsLane,
  overlapsPlayer,
  type CharId,
  type StageId,
  type ScreenId,
  type RouteId,
  type Lane,
  type ForkDef,
  type EncounterDef,
  type PickupKind,
} from './types';
import { AudioEngine } from './audio';
import { Input } from './input';
import { UI } from './ui';
import { World } from './world';
import { Viewmodels } from './viewmodels';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  spawnMonster,
  upgradeMonsterMesh,
  updateMonster,
  pickSpawn,
  bossKind,
  spawnPickup,
  updatePickup,
  spawnShot,
  updateShot,
  type Monster,
  type Pickup,
  type Shot,
} from './entities';
import { loadSave, writeSave, scoreKey, type SaveData } from './save';
import {
  disposeObject3D,
  preloadCharacterModels,
  preloadStageModels,
  preloadWorldModels,
} from './models';
import { isPhone, pinRoot, bindViewport, unlockAudioOnGesture } from './mobile';
import { hideRuntimeIssue, showRuntimeIssue } from './runtime-ui';
import { PostFx } from './postfx';

interface SlashPt { x: number; y: number; life: number }
interface Tracer { x0: number; y0: number; x1: number; y1: number; life: number }
interface Orb {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  dmg: number;
  pierce: boolean;
  blast: number;
  life: number;
  maxLife: number;
  hit: Set<number>;
}
interface Spark {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string; size: number;
}
interface Wave {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  mesh: THREE.Object3D;
  life: number;
  dmg: number;
  hit: Set<number>;
  width: number;
}

export class Game {
  private renderer: THREE.WebGLRenderer;
  private post: PostFx | null = null;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private world: World;
  private view: Viewmodels;
  private audio = new AudioEngine();
  private input = new Input();
  private ui = new UI();
  private fx: HTMLCanvasElement;
  private fxCtx: CanvasRenderingContext2D;
  private save: SaveData;
  private screen: ScreenId = 'title';
  private char: CharId = 'sword';
  private stage: StageId = 0;
  private selectedChar: CharId | null = null;
  private selectedStage: StageId | null = null;
  private hp = MAX_HP;
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private comboT = 0;
  private time = 0;
  private spawnAcc = 0;
  private pickAcc = 0;
  private monsters: Monster[] = [];
  private pickups: Pickup[] = [];
  private shots: Shot[] = [];
  private orbs: Orb[] = [];
  private sparks: Spark[] = [];
  private slash: SlashPt[] = [];
  private tracers: Tracer[] = [];
  private gunCd = 0;
  private charge = 0;
  private charging = false;
  private slashHit = new Set<number>();
  private shotHit = new Set<number>();
  private pickHit = new Set<number>();
  private bossSpawned = false;
  private bossDead = false;
  private ended = false;
  private shake = 0;
  private hurtT = 0;
  private hitstop = 0;
  private walkT = 0;
  private tutT = 0;
  private clock = new THREE.Clock();
  private tmpV = new THREE.Vector3();
  private tmpV2 = new THREE.Vector3();
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private lastChargeSfx = 0;
  private vw = 1;
  private vh = 1;
  private pixelCap = 2;
  private lowQuality = false;
  private fpsFrames = 0;
  private fpsTime = 0;
  private root!: HTMLElement;
  private lane: Lane = 0;
  private camX = 0;
  private dodgeT = 0;
  private iframe = 0;
  private dodgeCd = 0;
  private shieldT = 0;
  private route: RouteId = 'normal';
  private forkT = 0;
  private forkDef: ForkDef | null = null;
  private forksUsed = 0;
  private qaSeek = false;
  private warnT = 0;
  private warnText = '';
  private beamLane: Lane = 0;
  private beamCharge = 0;
  private afterimage: { x: number; life: number }[] = [];
  private turnT = 0;
  private turnDir: -1 | 0 | 1 = 0;
  private baseFov = 48;
  private rangeMiss = false;
  private pickSparkT = 0;
  private arena = false;
  private arenaMini = false;
  private nextEncounter = 0;
  private victoryHitch = 0;
  private resumeWalk = false;
  private encounterName = '';
  private atkLv = 0;
  private shieldN = 0;
  private spdLv = 0;
  private ultT = 0;
  private ultCd = 0;
  private ultPulse = 0;
  private ultHintT = 0;
  private waveCd = 0;
  private waves: Wave[] = [];
  private railT = 0;
  private novaT = 0;
  private barrier!: THREE.Group;
  private frostFx!: THREE.Group;
  private novaMesh!: THREE.Mesh;
  private ultHit = new Set<number>();
  private capsuleBoost = 0;
  private pickupHintOn = false;
  private contextLost = false;
  private runtimeErrors = 0;

  constructor() {
    this.save = loadSave();
    this.audio.muteSfx = this.save.muteSfx;
    this.audio.muteBgm = this.save.muteBgm;
    const canvas = document.getElementById('scene') as HTMLCanvasElement;
    this.fx = document.getElementById('fx') as HTMLCanvasElement;
    this.fxCtx = this.fx.getContext('2d')!;
    this.root = document.getElementById('game-root')!;
    const phone = isPhone();
    this.lowQuality = phone;
    this.pixelCap = phone ? Math.min(devicePixelRatio || 1, 1.5) : Math.min(devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !phone,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setPixelRatio(this.pixelCap);
    this.renderer.setClearColor(0x9ecfff, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    const r = this.renderer as THREE.WebGLRenderer & {
      useLegacyLights?: boolean;
      physicallyCorrectLights?: boolean;
    };
    if ('useLegacyLights' in r) r.useLegacyLights = false;
    if ('physicallyCorrectLights' in r) r.physicallyCorrectLights = true;
    this.renderer.shadowMap.enabled = !phone;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
      if (this.screen === 'play') this.pause(true);
      showRuntimeIssue('3D 畫面暫時中斷', '遊戲已自動暫停，系統正在嘗試恢復；若畫面沒有恢復，請重新載入。');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      try {
        this.contextLost = false;
        this.mountScene();
        hideRuntimeIssue();
      } catch (error) {
        console.error('WebGL restore failed', error);
        showRuntimeIssue('3D 畫面恢復失敗', '本局進度已暫停，請重新載入後再試。');
      }
    });
    this.camera = new THREE.PerspectiveCamera(this.baseFov, 1, 0.08, 90);
    this.camera.position.set(0, 1.48, 0.35);
    this.scene.add(this.camera);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environmentIntensity = 0.65;
    const viewFill = new THREE.HemisphereLight(0xfff2d8, 0x223318, 0.35);
    this.camera.add(viewFill);
    this.buildCombatFx();
    this.world = new World(this.scene, phone);
    this.world.applyStage(STAGES[0]);
    this.view = new Viewmodels(this.camera);
    this.view.show('sword');
    this.rebuildPostFx();
    this.bootAssets();
    this.input.attach(canvas);
    this.bindUi();
    this.resize();
    bindViewport(() => this.resize());
    unlockAudioOnGesture(() => this.audio.unlock());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.screen === 'play') this.pause(true);
    });
    window.addEventListener('pagehide', () => {
      if (this.screen === 'play') this.pause(true);
    });
    this.ui.setMuteLabels(this.save.muteSfx, this.save.muteBgm);
    this.ui.show('title');
    this.audio.setMode('title');
    this.loop();
  }

  private bootAssets(): void {
    const el = document.getElementById('model-loading');
    // Procedural meshes make the title and combat immediately usable. Heavy
    // GLBs stream in behind the title instead of blocking the whole UI.
    requestAnimationFrame(() => {
      el?.classList.add('hidden');
      if (this.seekAt() > 0 && this.screen !== 'play') {
        this.applyQaSeekStage();
        this.beginFight();
      }
    });
    void preloadWorldModels().then(() => this.attachLoadedAssets());
    window.setTimeout(() => this.warmAssets(), 300);
  }

  private warmAssets(char = this.selectedChar ?? this.char, stage = this.selectedStage ?? this.stage): void {
    void preloadCharacterModels(char).then(() => this.attachLoadedAssets());
    void preloadStageModels(stage).then(() => this.attachLoadedAssets());
  }

  private attachLoadedAssets(): void {
    this.view.attachLoaded();
    this.world.attachLoaded();
    this.upgradeLiveMeshes();
  }

  private applyQaSeekStage(): void {
    const at = this.seekAt();
    if (at <= 0) return;
    this.stage = (at >= 0.52 && at < 0.78 ? 2 : 0) as StageId;
    this.selectedStage = this.stage;
  }

  private upgradeLiveMeshes(): void {
    for (const m of this.monsters) upgradeMonsterMesh(m);
  }

  private bindUi(): void {
    const click = (id: string, fn: () => void) => {
      document.getElementById(id)!.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audio.unlock();
        this.audio.ui();
        fn();
      });
    };
    click('btn-start', () => this.toChar());
    click('btn-back-title', () => {
      this.ui.show('title');
      this.screen = 'title';
      this.audio.setMode('title');
    });
    click('btn-depart', () => {
      if (!this.selectedChar) return;
      this.char = this.selectedChar;
      this.toStage();
    });
    click('btn-back-char', () => this.toChar());
    click('btn-enter-stage', () => {
      if (this.selectedStage === null) return;
      this.stage = this.selectedStage;
      this.tryTutorial();
    });
    click('btn-skip-tut', () => this.beginFight());
    click('btn-pause', () => this.pause(true));
    click('btn-resume', () => this.pause(false));
    click('btn-pause-retry', () => this.beginFight());
    click('btn-pause-quit', () => this.toStage());
    click('btn-next', () => this.nextStage());
    click('btn-win-home', () => this.toStage());
    click('btn-retry', () => this.beginFight());
    click('btn-lose-char', () => this.toChar());
    click('btn-mute-sfx', () => this.toggleMute('sfx'));
    click('btn-mute-bgm', () => this.toggleMute('bgm'));
    click('btn-pause-sfx', () => this.toggleMute('sfx'));
    click('btn-pause-bgm', () => this.toggleMute('bgm'));
    this.ui.onForkPick((i) => this.resolveFork(i));
    const ult = document.getElementById('btn-ult');
    if (ult) {
      const fire = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.audio.unlock();
        this.tryUlt();
      };
      ult.addEventListener('pointerdown', fire);
      ult.addEventListener('click', (e) => e.stopPropagation());
    }
  }

  private toggleMute(which: 'sfx' | 'bgm'): void {
    if (which === 'sfx') this.save.muteSfx = !this.save.muteSfx;
    else this.save.muteBgm = !this.save.muteBgm;
    this.audio.muteSfx = this.save.muteSfx;
    this.audio.muteBgm = this.save.muteBgm;
    this.audio.applyMute();
    writeSave(this.save);
    this.ui.setMuteLabels(this.save.muteSfx, this.save.muteBgm);
  }

  private toChar(): void {
    this.clearCombat();
    this.screen = 'char';
    this.audio.setMode('title');
    this.audio.setTheme(this.selectedChar, 'full');
    this.ui.show('char');
    this.ui.buildChars(this.selectedChar, (id) => {
      this.audio.unlock();
      this.audio.ui();
      this.audio.setTheme(id, 'full');
      this.selectedChar = id;
      this.char = id;
      this.view.show(id);
      this.warmAssets(id, this.selectedStage ?? this.stage);
      this.ui.markChar(id);
      (document.getElementById('btn-depart') as HTMLButtonElement).disabled = false;
    });
    (document.getElementById('btn-depart') as HTMLButtonElement).disabled = !this.selectedChar;
  }

  private toStage(): void {
    this.clearCombat();
    this.screen = 'stage';
    this.audio.setMode('title');
    this.audio.setTheme(this.char, 'full');
    this.ui.show('stage');
    this.selectedStage = this.selectedStage ?? (Math.min(this.save.unlockedStage, 2) as StageId);
    this.warmAssets(this.char, this.selectedStage);
    this.ui.buildStages(this.save, this.char, this.selectedStage, (id, locked) => {
      this.audio.unlock();
      this.audio.ui();
      if (locked) return;
      this.selectedStage = id;
      this.warmAssets(this.char, id);
      this.ui.markStage(id);
      (document.getElementById('btn-enter-stage') as HTMLButtonElement).disabled = false;
    });
    (document.getElementById('btn-enter-stage') as HTMLButtonElement).disabled = this.selectedStage === null;
  }

  private tryTutorial(): void {
    if (this.save.seenTutorial[this.char] || this.seekAt() > 0) {
      this.beginFight();
      return;
    }
    this.screen = 'tutorial';
    this.tutT = TUTORIAL_SEC;
    this.ui.show('tutorial');
    this.ui.tutorial(this.char);
    this.ui.setTutTime(this.tutT);
  }


  private seekAt(): number {
    const raw = new URLSearchParams(location.search).get('at');
    if (raw == null || raw === '') return 0;
    const n = Number(raw);
    if (!Number.isFinite(n)) return 0;
    return Math.min(1, Math.max(0, n));
  }

  private beginFight(): void {
    this.applyQaSeekStage();
    this.warmAssets(this.char, this.stage);
    this.save.seenTutorial[this.char] = true;
    writeSave(this.save);
    this.clearCombat();
    this.mountScene();
    this.ui.stopPreviews();
    this.screen = 'play';
    this.ui.show('play');
    this.ui.hideOverlays();
    this.hp = MAX_HP;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboT = 0;
    this.time = 0;
    this.spawnAcc = 0.4;
    this.pickAcc = 1.2;
    this.bossSpawned = false;
    this.bossDead = false;
    this.ended = false;
    this.arena = false;
    this.arenaMini = false;
    this.nextEncounter = 0;
    this.victoryHitch = 0;
    this.resumeWalk = false;
    this.encounterName = '';
    this.ui.setArena(null);
    this.ui.setProgressMarks(ENCOUNTERS[this.stage]);
    this.charge = 0;
    this.charging = false;
    this.gunCd = 0;
    this.lane = 0;
    this.camX = 0;
    this.dodgeT = 0;
    this.iframe = 0;
    this.dodgeCd = 0;
    this.shieldT = 0;
    this.route = 'normal';
    this.forkT = 0;
    this.forkDef = null;
    this.forksUsed = 0;
    this.warnT = 0;
    this.turnT = 0;
    this.turnDir = 0;
    this.rangeMiss = false;
    this.atkLv = 0;
    this.shieldN = 0;
    this.spdLv = 0;
    this.ultT = 0;
    this.ultCd = 0;
    this.ultPulse = 0;
    this.ultHintT = this.save.seenUltHint ? 0 : 5.5;
    this.waveCd = 0;
    this.railT = 0;
    this.novaT = 0;
    this.capsuleBoost = 0;
    this.pickupHintOn = true;
    this.ultHit.clear();
    this.view.setPowerGlow(0, 0);
    if (this.frostFx) this.frostFx.visible = false;
    if (this.novaMesh) this.novaMesh.visible = false;
    if (this.barrier) this.barrier.visible = false;
    const ph = document.getElementById('pickup-hint');
    if (ph) {
      ph.textContent = PICKUP_HINT;
      ph.classList.remove('hidden');
    }
    const at = this.seekAt();
    this.qaSeek = at > 0;
    this.time = at * STAGES[this.stage].duration;
    this.forksUsed = STAGES[this.stage].forks.filter((f) => f.at <= at).length;
    this.nextEncounter = ENCOUNTERS[this.stage].filter((e) => e.at < at).length;
    if (this.qaSeek) {
      this.spawnAcc = 1e9;
      this.iframe = 2.5;
      this.pickupHintOn = false;
      document.getElementById('pickup-hint')?.classList.add('hidden');
      const list = ENCOUNTERS[this.stage];
      const nxt = list[this.nextEncounter];
      if (nxt && nxt.at - at <= 0.12) {
        this.time = nxt.at * STAGES[this.stage].duration;
      }
    }
    this.world.applyStage(STAGES[this.stage]);
    this.root.dataset.stage = String(this.stage);
    this.world.showFork(null);
    this.view.show(this.char);
    this.audio.setMode('battle', this.stage);
    this.audio.setTheme(this.char, 'thin');
    this.audio.unlock();
    this.syncHud();
  }

  private nextStage(): void {
    if (this.stage < 2) {
      this.stage = (this.stage + 1) as StageId;
      this.selectedStage = this.stage;
      this.tryTutorial();
    } else this.toStage();
  }

  private pause(on: boolean): void {
    if (this.screen !== 'play' && this.screen !== 'pause') return;
    if (on) {
      this.screen = 'pause';
      this.ui.overlay('pause');
      this.audio.setMode('title');
      this.audio.setTheme(null);
    } else {
      this.screen = 'play';
      this.ui.hideOverlays();
      this.audio.setMode(this.arena && !this.bossDead ? 'boss' : 'battle');
      this.audio.setTheme(this.char, 'thin');
    }
  }

  private clearCombat(): void {
    for (const m of this.monsters) this.removeObject(m.mesh);
    for (const p of this.pickups) this.removeObject(p.mesh);
    for (const s of this.shots) this.removeObject(s.mesh);
    for (const w of this.waves) this.removeObject(w.mesh);
    this.monsters = [];
    this.pickups = [];
    this.shots = [];
    this.orbs = [];
    this.waves = [];
    this.sparks = [];
    this.slash = [];
    this.tracers = [];
    this.slashHit.clear();
    this.shotHit.clear();
    this.pickHit.clear();
    this.forkT = 0;
    this.turnT = 0;
    this.turnDir = 0;
    this.ui.hideFork();
    this.world.showFork(null);
    this.world.setBend(0);
    this.world.setRangeAssist(false);
    this.ui.setWarn('');
    this.ui.setArena(null);
    this.arena = false;
    this.arenaMini = false;
    this.victoryHitch = 0;
    this.resumeWalk = false;
    this.frostFx.visible = false;
    this.novaMesh.visible = false;
    this.barrier.visible = false;
  }

  private removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
    disposeObject3D(object);
  }

  private resize(): void {
    const { w, h } = pinRoot(this.root);
    this.vw = w;
    this.vh = h;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.pixelCap);
    this.renderer.setSize(w, h, true);
    this.post?.resize(w, h, this.pixelCap, this.lowQuality);
    const dpr = this.pixelCap;
    this.fx.width = Math.floor(w * dpr);
    this.fx.height = Math.floor(h * dpr);
    this.fx.style.width = `${w}px`;
    this.fx.style.height = `${h}px`;
  }

  private mountScene(): void {
    const canvas = document.getElementById('scene') as HTMLCanvasElement;
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try { gl = this.renderer.getContext(); } catch { gl = null; }
    const lost = !gl || gl.isContextLost() || this.renderer.domElement !== canvas;
    if (lost) {
      try { this.renderer.dispose(); } catch { /* ignore */ }
      try { this.post?.dispose(); } catch { /* ignore */ }
      this.post = null;
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !this.lowQuality,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      });
      this.renderer.setPixelRatio(this.pixelCap);
      this.renderer.setClearColor(0x9ecfff, 1);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.92;
      const r = this.renderer as THREE.WebGLRenderer & {
        useLegacyLights?: boolean;
        physicallyCorrectLights?: boolean;
      };
      if ('useLegacyLights' in r) r.useLegacyLights = false;
      if ('physicallyCorrectLights' in r) r.physicallyCorrectLights = true;
      this.renderer.shadowMap.enabled = !this.lowQuality;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      try {
        const oldEnv = this.scene.environment;
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        this.scene.environmentIntensity = 0.65;
        pmrem.dispose();
        oldEnv?.dispose();
      } catch { /* ignore */ }
      this.rebuildPostFx();
      this.resize();
    }
    if (!this.world || !this.view) return;
    if (this.world.group.parent !== this.scene) this.scene.add(this.world.group);
    if (this.camera.parent !== this.scene) this.scene.add(this.camera);
    if (this.view.group.parent !== this.camera) this.camera.add(this.view.group);
    this.world.group.visible = true;
    this.view.setVisible(true);
    this.camera.position.set(0, 1.48, 0.35);
    this.camera.rotation.set(-0.02, 0, 0);
    this.camera.fov = this.baseFov;
    this.camera.near = 0.08;
    this.camera.far = 90;
    this.camera.updateProjectionMatrix();
    this.walkT = 0;
    this.shake = 0;
    this.hurtT = 0;
    this.camX = 0;
    this.lane = 0;
    this.world.setBend(0);
    this.world.attachLoaded();
  }

  private remountNext = false;

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    if (this.contextLost) {
      this.input.endFrame();
      return;
    }
    if (this.remountNext) {
      this.remountNext = false;
      try { this.mountScene(); } catch { /* ignore */ }
    }
    try {
    const dtRaw = Math.min(0.05, this.clock.getDelta());
    this.fpsFrames += 1;
    this.fpsTime += dtRaw;
    if (this.fpsTime > 1.6) {
      const fps = this.fpsFrames / this.fpsTime;
      if (fps < 40 && this.pixelCap > 1) {
        this.pixelCap = Math.max(1, this.pixelCap - 0.25);
        this.lowQuality = true;
        this.resize();
      }
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }
    this.audio.update(dtRaw);
    if (this.input.consume(' ') || this.input.consume('escape')) {
      if (this.screen === 'play') this.pause(true);
      else if (this.screen === 'pause') this.pause(false);
    }
    if (this.input.consume('r')) {
      if (this.screen === 'win' || this.screen === 'lose' || this.screen === 'pause') this.beginFight();
    }
    if (this.screen === 'play') {
      if (this.input.consume('q') || this.input.consume('e') || this.input.consume('shift')) this.tryUlt();
    }
    if (this.screen === 'tutorial') {
      this.tutT -= dtRaw;
      this.ui.setTutTime(this.tutT);
      if (this.tutT <= 0) this.beginFight();
    }
    const playing = this.screen === 'play' || this.screen === 'title' || this.screen === 'char' || this.screen === 'stage' || this.screen === 'tutorial';
    const combat = this.screen === 'play';
    this.hitstop = Math.max(0, this.hitstop - dtRaw);
    this.victoryHitch = Math.max(0, this.victoryHitch - dtRaw);
    const frozen = combat && this.forkT > 0;
    const arenaHold = combat && this.arena && this.forkT <= 0;
    const dt = combat && this.hitstop > 0 ? dtRaw * 0.12 : frozen ? 0 : dtRaw;
    const visDt = frozen ? dtRaw : dt;
    if (this.turnT > 0) this.turnT = Math.max(0, this.turnT - visDt);
    const turnEnv = this.turnEnvelope();
    this.world.setBend(turnEnv);
    this.walkT += visDt * (arenaHold ? 0.18 : 1);
    const walkSpd = arenaHold ? 0 : frozen ? 0.12 : combat ? 1 + turnEnv * 0.7 : 0.55;
    this.world.update(visDt, playing, walkSpd);

    if (combat) this.updateDodge(dtRaw);

    const bob = Math.sin(this.walkT * 9.5) * (combat ? 1 : 0.55);
    this.shake = Math.max(0, this.shake - visDt * 4);
    this.hurtT = Math.max(0, this.hurtT - visDt);
    this.iframe = Math.max(0, this.iframe - dtRaw);
    this.shieldT = Math.max(0, this.shieldT - dtRaw);
    this.warnT = Math.max(0, this.warnT - dtRaw);
    this.dodgeCd = Math.max(0, this.dodgeCd - dtRaw);
    this.dodgeT = Math.max(0, this.dodgeT - dtRaw);
    this.pickSparkT = Math.max(0, this.pickSparkT - visDt);
    this.waveCd = Math.max(0, this.waveCd - dtRaw);
    this.railT = Math.max(0, this.railT - visDt);
    this.novaT = Math.max(0, this.novaT - visDt);
    this.ultHintT = Math.max(0, this.ultHintT - dtRaw);
    this.capsuleBoost = Math.max(0, this.capsuleBoost - dtRaw);
    if (combat && this.pickupHintOn && this.time > 7.5) {
      this.pickupHintOn = false;
      document.getElementById('pickup-hint')?.classList.add('hidden');
    }
    this.barrier.visible = combat && this.shieldN > 0;
    if (this.barrier.visible) {
      const u = 1 + this.shieldN * 0.12 + Math.sin(this.walkT * 6) * 0.04;
      this.barrier.scale.setScalar(u);
      this.barrier.rotation.y += visDt * 1.4;
    }
    this.frostFx.visible = combat && this.ultT > 0 && this.char === 'sword';
    if (this.frostFx.visible) this.frostFx.rotation.y += visDt * 14;
    this.novaMesh.visible = combat && this.novaT > 0;
    if (this.novaMesh.visible) {
      const u = 1 - this.novaT / 0.45;
      this.novaMesh.scale.setScalar(0.4 + u * 18);
      const mat = this.novaMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 * (1 - u);
      this.novaMesh.position.set(this.camX, 1.1, -3.2);
    }
    this.ui.hurt(this.hurtT > 0);
    this.view.setIframe(this.iframe);

    const targetX = this.lane * LANE_X;
    const lerp = this.dodgeT > 0 ? 14 : 7;
    this.camX = THREE.MathUtils.damp(this.camX, targetX, lerp, visDt);
    const yaw = this.turnDir * -THREE.MathUtils.degToRad(34) * turnEnv;
    const roll = this.turnDir * 0.14 * turnEnv;
    const dip = this.turnDir === 0 ? turnEnv : 0;
    const fovPunch = turnEnv * (this.turnDir === 0 ? 7 : 10);
    const nextFov = this.baseFov + fovPunch;
    if (Math.abs(this.camera.fov - nextFov) > 0.04) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.set(
      this.camX + Math.sin(this.walkT * 3.4) * 0.012 + (Math.random() - 0.5) * this.shake * 0.14,
      1.48 + bob * 0.028 - dip * 0.16 + (Math.random() - 0.5) * this.shake * 0.08,
      0.35 + dip * 0.18,
    );
    this.camera.rotation.set(
      -0.02 + Math.sin(this.walkT * 8.2) * 0.008 - dip * 0.1,
      yaw,
      Math.sin(this.walkT * 3.4) * 0.005 + (targetX - this.camX) * 0.05 + roll,
    );
    if (combat && turnEnv > 0.12 && Math.random() < 0.45) {
      const dx = this.turnDir === 0 ? (Math.random() - 0.5) * 1.6 : this.turnDir * (0.4 + Math.random());
      this.burst(this.world.dustAt(this.camX + dx), 0xe8d4a8, 3);
    }
    this.world.setRangeAssist(combat && this.char === 'sword');
    this.world.followRange(this.camX);
    this.view.update(visDt, bob);
    this.view.setVisible(this.screen === 'play' || this.screen === 'tutorial');

    if (combat) this.updateCombat(dt, dtRaw);
    else if (playing) this.view.show(this.selectedChar ?? this.char);

    this.updateSparks(visDt);
    this.drawFx(visDt);
    this.renderer.setClearColor(this.world.fogColor, 1);
    if (this.post) this.post.render();
    else this.renderer.render(this.scene, this.camera);
    this.runtimeErrors = 0;
    } catch (err) {
      console.error(err);
      this.runtimeErrors += 1;
      try {
        const gl = this.renderer.getContext();
        if (!gl || gl.isContextLost()) this.remountNext = true;
      } catch {
        this.remountNext = true;
      }
      if (this.runtimeErrors >= 3) {
        if (this.screen === 'play') this.pause(true);
        showRuntimeIssue('遊戲執行發生異常', '遊戲已自動暫停。請重新載入後再試，既有最佳紀錄不會受到影響。');
      }
    } finally {
      try { this.input.endFrame(); } catch { /* ignore */ }
    }
  };

  private rebuildPostFx(): void {
    try {
      this.post?.dispose();
      this.post = new PostFx(this.renderer, this.scene, this.camera, this.lowQuality);
      if (this.vw > 1 && this.vh > 1) this.post.resize(this.vw, this.vh, this.pixelCap, this.lowQuality);
    } catch (error) {
      console.warn('Cinematic post-processing unavailable; using direct render.', error);
      this.post = null;
    }
  }

  private updateDodge(dtRaw: number): void {
    if (this.forkT > 0) {
      this.input.consumeDodge();
      this.input.consumeForkPick();
      this.ui.setDodgePulse(false, false);
      return;
    }
    const dir = this.input.consumeDodge();
    if (dir !== 0 && this.dodgeCd <= 0 && this.screen === 'play') {
      const next = (this.lane + dir) as number;
      if (next < -1 || next > 1) {
        this.shake = Math.max(this.shake, 0.35);
      } else {
        this.afterimage.push({ x: this.camX, life: 0.22 });
        this.lane = next as Lane;
        this.dodgeT = DODGE_MOVE;
        this.iframe = DODGE_IFRAME;
        this.dodgeCd = DODGE_CD;
        this.ui.dodgeKick(dir);
        this.audio.dodge();
      }
    }
    void dtRaw;
    let nearL = false;
    let nearR = false;
    for (const s of this.shots) {
      if (!s.alive || s.pos.z > -3.5 || s.pos.z < -18) continue;
      if (s.allLanes || overlapsLane(s.pos.x, s.radius, -1)) nearL = true;
      if (s.allLanes || overlapsLane(s.pos.x, s.radius, 1)) nearR = true;
    }
    this.ui.setDodgePulse(nearL && this.lane !== -1, nearR && this.lane !== 1);
  }

  private updateGoblin(m: Monster, dt: number): void {
    if (!m.committed || m.missed || m.stunned > 0 || m.pos.z >= HIT_Z - 1.2) return;
    m.shootCd -= dt;
    if (m.shootCd > 0) return;
    m.shootCd += GOBLIN_SHOT_COOLDOWN;
    const pos = m.pos.clone().setY(1.05);
    const vz = 9.2;
    const travel = Math.max(0.2, (HIT_Z - pos.z) / vz);
    const shot = spawnShot('shard', pos, {
      vel: new THREE.Vector3((this.camX - pos.x) / travel, 0, vz),
      allLanes: false,
      homing: false,
    });
    this.scene.add(shot.mesh);
    this.shots.push(shot);
    this.burst(pos, 0xffd06a, 6);
    this.audio.warn();
  }

  private handleForkInput(): void {
    this.input.consumeDodge();
    this.input.consumeForkPick();
  }

  private updateCombat(dt: number, dtRaw: number): void {
    const st = STAGES[this.stage];
    const wasUlt = this.ultT > 0;
    if (this.ultT > 0) {
      this.ultT = Math.max(0, this.ultT - dtRaw);
      if (this.char === 'sword' && this.ultT > 0) {
        this.iframe = Math.max(this.iframe, this.ultT);
        this.ultPulse -= dtRaw;
        if (this.ultPulse <= 0) {
          this.ultPulse = 0.14;
          this.frostPulse();
        }
      }
      if (wasUlt && this.ultT <= 0) {
        this.ultCd = ULT_CD;
        this.frostFx.visible = false;
      }
    } else {
      this.ultCd = Math.max(0, this.ultCd - dtRaw);
    }

    if (this.forkT > 0) {
      this.forkT -= dtRaw;
      this.ui.setForkTime(this.forkT);
      if (this.forkT <= 0) this.resolveFork(-1);
      this.syncHud();
      return;
    }

    if (!this.arena) this.time += dt;
    const progress = this.time / st.duration;
    this.comboT -= dt;
    if (this.comboT <= 0 && this.combo > 0) this.combo = 0;
    this.gunCd = Math.max(0, this.gunCd - dt);

    if (this.resumeWalk && this.victoryHitch <= 0) {
      this.resumeWalk = false;
      this.arena = false;
      this.arenaMini = false;
      this.encounterName = '';
      this.ui.setArena(null);
      this.audio.setMode('battle', this.stage);
      this.audio.setTheme(this.char, 'thin');
    }

    const forks = st.forks;
    if (!this.arena && this.forksUsed < forks.length) {
      const fk = forks[this.forksUsed];
      if (progress >= fk.at) this.beginFork(fk);
    }

    if (!this.arena) {
      const list = ENCOUNTERS[this.stage];
      if (this.nextEncounter < list.length && progress >= list[this.nextEncounter].at) {
        this.beginArena(list[this.nextEncounter]);
        this.nextEncounter += 1;
      }
    }

    if (!this.arena && this.forkT <= 0 && !this.qaSeek) {
      const route = ROUTES[this.route];
      this.spawnAcc -= dt;
      const interval = Math.max(0.34, (1.35 - progress * 0.7) / (st.density * route.density));
      if (this.spawnAcc <= 0) {
        this.spawnAcc = interval;
        const n = progress > 0.55 && Math.random() < 0.32 * route.density ? 2 : 1;
        const span = n <= 1 ? 0 : 1.15;
        for (let i = 0; i < n; i++) {
          const spread = n <= 1
            ? (Math.random() - 0.5) * 0.9
            : ((i / (n - 1)) - 0.5) * span + (Math.random() - 0.5) * 0.12;
          this.addMonster(pickSpawn(this.stage, progress, this.route), undefined, undefined, spread);
        }
      }
      this.pickAcc -= dt;
      if (this.pickAcc <= 0) {
        this.spawnRoutePickup();
      }
    }

    if (this.ultT <= 0) {
      if (this.char === 'sword') this.handleSword();
      else if (this.char === 'gun') this.handleGun();
      else this.handleMage(dt);
    }
    this.updateWaves(dt);

    const px = this.camX;
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (!m.alive) {
        this.removeObject(m.mesh);
        this.monsters.splice(i, 1);
        continue;
      }
      if (m.isBoss && m.slowT <= 0) this.updateBoss(m, dt);
      const ev = updateMonster(m, dt, false, px);
      if (!ev && m.kind === 'goblin') this.updateGoblin(m, dt);
      if (ev === 'passed') {
        this.removeObject(m.mesh);
        this.monsters.splice(i, 1);
        continue;
      }
      if (ev === 'hitPlayer' || ev === 'lunge') {
        if (this.canBeHit() && (ev === 'lunge' || overlapsPlayer(m.pos.x, m.radius, px))) {
          this.playerHurt(ev === 'lunge' ? 2 : 1);
        }
        if (!m.isBoss) this.killMonster(m, false);
      }
    }

    this.updateOrbs(dt);
    this.updateShots(dt);
    this.updatePickups(dt);

    if (!this.ended) {
      if (this.hp <= 0) this.finish(false);
      else if (this.bossDead && this.victoryHitch <= 0) this.finish(true);
    }
    this.syncHud();
    this.ui.setWarn(this.warnT > 0 ? this.warnText : '');
  }

  private beginFork(fk: ForkDef): void {
    this.forkDef = fk;
    this.forkT = FORK_HOLD;
    this.input.consumeDodge();
    this.input.consumeForkPick();
    this.world.showFork(fk.routes);
    this.ui.showFork(fk.routes);
    this.audio.ui();
    this.charging = false;
    this.charge = 0;
    this.view.setCharge(0);
  }

  private resolveFork(index: number): void {
    if (!this.forkDef || this.forkT <= 0 && index !== -1 && this.forksUsed >= STAGES[this.stage].forks.length) {
      /* still resolve if timer just expired */
    }
    if (!this.forkDef) {
      this.forkT = 0;
      this.ui.hideFork();
      this.world.showFork(null);
      return;
    }
    const routes = this.forkDef.routes;
    let i = index;
    if (i < 0 || i >= routes.length) {
      const easy = easiestRoute(routes);
      i = routes.indexOf(easy);
    }
    this.route = routes[i];
    this.forksUsed += 1;
    this.forkT = 0;
    this.forkDef = null;
    this.ui.hideFork();
    if (this.pickupHintOn) document.getElementById('pickup-hint')?.classList.remove('hidden');
    const n = routes.length;
    const dir: -1 | 0 | 1 = n === 2 ? (i === 0 ? -1 : 1) : ((i - 1) as -1 | 0 | 1);
    this.turnDir = dir;
    this.turnT = TURN_DUR;
    this.world.beginTurn(dir, i, n);
    const x = (i - (n === 2 ? 0.5 : 1)) * LANE_X;
    this.burst(this.world.dustAt(x), 0xf4d06a, 26);
    this.burst(this.world.dustAt(x * 0.45), 0xffe8b0, 14);
    this.burst(new THREE.Vector3(x, 0.35, -3.4), 0xfff6d0, 10);
    this.audio.ui();
    this.ui.float(`${ROUTES[this.route].name}`, 0.5, 0.62, 'gold');
  }

  private spawnRoutePickup(): void {
    const r = this.route;
    const afterMini = this.nextEncounter > 0;
    if (r === 'easy') this.pickAcc = 2.6 + Math.random() * 0.8;
    else if (r === 'hard') this.pickAcc = 2.8 + Math.random();
    else if (r === 'treasure') this.pickAcc = 2.1 + Math.random() * 0.6;
    else this.pickAcc = 3.6 + Math.random();
    this.addPickup(this.pickPickupKind(afterMini));
  }

  private pickPickupKind(afterMini: boolean): PickupKind {
    const r = this.route;
    let atk = 0.16;
    let shield = 0.14;
    let speed = 0.12;
    let heart = 0.32;
    let chest = 0.26;
    if (r === 'hard') { atk += 0.12; shield += 0.1; heart -= 0.1; chest -= 0.04; }
    else if (r === 'easy') { heart += 0.18; atk -= 0.04; shield -= 0.02; }
    else if (r === 'treasure') { chest += 0.12; atk += 0.04; }
    if (afterMini || this.capsuleBoost > 0) { atk += 0.12; shield += 0.12; heart -= 0.1; chest -= 0.04; }
    const tot = atk + shield + speed + heart + chest;
    let u = Math.random() * tot;
    if ((u -= atk) <= 0) return 'atk';
    if ((u -= shield) <= 0) return 'shield';
    if ((u -= speed) <= 0) return 'speed';
    if ((u -= heart) <= 0) return 'heart';
    return 'chest';
  }

  private addPickup(kind: PickupKind, x?: number, z?: number): void {
    const p = spawnPickup(kind);
    if (x !== undefined) p.pos.x = x;
    if (z !== undefined) p.pos.z = z;
    p.mesh.position.copy(p.pos);
    this.scene.add(p.mesh);
    this.pickups.push(p);
  }

  private addMonster(kind: Parameters<typeof spawnMonster>[0], at?: THREE.Vector3, lane?: number, spreadX?: number): Monster {
    const m = spawnMonster(kind, lane, this.camX, spreadX);
    if (at) {
      m.pos.copy(at);
      if (!m.isBoss) m.homeX = at.x;
    }
    if (kind === 'pumpkinMini') m.pos.z = Math.min(m.pos.z, -8);
    if (!m.isBoss && !at) m.pos.x = m.homeX;
    m.mesh.position.copy(m.pos);
    this.scene.add(m.mesh);
    this.monsters.push(m);
    return m;
  }

  private beginArena(enc: EncounterDef): void {
    this.arena = true;
    this.arenaMini = enc.mini;
    this.encounterName = enc.name;
    if (!enc.mini) this.bossSpawned = true;
    for (const fodder of this.monsters) {
      if (!fodder.isBoss) fodder.alive = false;
    }
    const m = this.addMonster(enc.kind, undefined, 0);
    m.pos.set(0, 0.2, -16);
    m.mesh.position.copy(m.pos);
    m.phase = 0;
    m.t = 0;
    this.audio.setMode('boss', enc.kind);
    this.audio.setTheme(this.char, 'thin');
    this.audio.boss();
    this.world.flashStorm(enc.mini ? 0.82 : 1.3);
    this.ui.setArena(enc.mini ? 'mini' : 'boss', enc.name);
    this.ui.float(enc.mini ? '小魔王' : '魔王戰', 0.5, 0.36, 'gold');
  }

  private warn(text: string, dur = 0.85): void {
    this.warnText = text;
    this.warnT = dur;
    this.audio.warn();
  }

  private updateBoss(m: Monster, dt: number): void {
    if (m.stunned > 0) return;
    if (m.kind === 'miniSlime') this.miniSlime(m, dt);
    else if (m.kind === 'miniWraith') this.miniWraith(m, dt);
    else if (m.kind === 'miniBeetle') this.miniBeetle(m, dt);
    else if (m.kind === 'miniDemon') this.miniDemon(m, dt);
    else if (m.kind === 'bossSlime') this.bossSlime(m, dt);
    else if (m.kind === 'bossWraith') this.bossWraith(m, dt);
    else this.bossDemon(m, dt);
  }

  private miniSlime(m: Monster, dt: number): void {
    m.pos.x = Math.sin(m.t * 0.7) * 0.55;
    m.pos.z = THREE.MathUtils.damp(m.pos.z, ARENA_Z, 1.8, dt);
    m.pos.y = 0.12 + Math.sin(m.t * 2.4) * 0.08;
    if (m.telegraph > 0) {
      m.telegraph -= dt;
      m.mesh.scale.set(1.14, 0.78, 1.14);
      if (m.telegraph <= 0) {
        this.spawnRing(m.pos);
        m.t = 0;
        m.phase = (m.phase + 1) % 2;
        m.mesh.scale.setScalar(1);
      }
      return;
    }
    if (m.t > 1.7) {
      if (m.phase === 0) {
        this.warn('衝擊波');
        m.telegraph = 0.5;
        m.t = 0;
      } else {
        this.warn('衝撞');
        this.spawnAimed(m.pos, 'shard', 3, 0.9);
        m.phase = 0;
        m.t = 0;
      }
    }
  }

  private miniWraith(m: Monster, dt: number): void {
    m.pos.z = THREE.MathUtils.damp(m.pos.z, ARENA_Z, 1.6, dt);
    m.pos.y = 0.22 + Math.sin(m.t * 2.6) * 0.1;
    if (m.t > 1.55) {
      m.t = 0;
      if (m.phase % 2 === 0) {
        this.warn('魂扇');
        this.spawnFan(m.pos, 5, 0xcc66ff);
      } else {
        const dest = this.camX >= 0 ? -LANE_X * 0.85 : LANE_X * 0.85;
        this.afterimage.push({ x: m.pos.x, life: 0.24 });
        m.pos.x = dest;
        this.warn('側移');
        this.spawnAimed(m.pos, 'soul', 3, 0.7);
      }
      m.phase += 1;
    }
  }

  private miniBeetle(m: Monster, dt: number): void {
    m.pos.y = 0.08 + Math.sin(m.t * 8) * 0.04;
    if (m.phase === 11) {
      m.telegraph -= dt;
      m.pos.z = THREE.MathUtils.damp(m.pos.z, -5.4, 6.2, dt);
      m.pos.x = THREE.MathUtils.damp(m.pos.x, m.homeX, 3.4, dt);
      if (m.telegraph <= 0) {
        if (this.canBeHit() && overlapsPlayer(m.pos.x, m.radius, this.camX)) this.playerHurt(1);
        m.phase = 12;
        m.telegraph = 0.55;
      }
      return;
    }
    if (m.phase === 12) {
      m.telegraph -= dt;
      m.pos.z = THREE.MathUtils.damp(m.pos.z, ARENA_Z + 1.2, 4.2, dt);
      if (m.telegraph <= 0) {
        m.phase = 0;
        m.t = 0;
      }
      return;
    }
    m.pos.z = THREE.MathUtils.damp(m.pos.z, ARENA_Z + 1.2, 1.5, dt);
    if (m.t > 1.65) {
      m.t = 0;
      if (m.phase % 2 === 0) {
        this.warn('突進');
        m.homeX = this.camX;
        m.phase = 11;
        m.telegraph = 0.62;
      } else {
        this.warn('炎涎');
        this.spawnAimed(m.pos, 'fireball', 3, 1.05);
        m.phase = 1;
      }
    }
  }

  private miniDemon(m: Monster, dt: number): void {
    m.pos.z = THREE.MathUtils.damp(m.pos.z, ARENA_Z - 0.4, 1.5, dt);
    m.pos.y = 0.16 + Math.sin(m.t * 1.8) * 0.07;
    if (m.phase === 10) {
      m.telegraph -= dt;
      m.mesh.scale.setScalar(1.04 + Math.sin(m.t * 18) * 0.06);
      this.beamCharge = m.telegraph;
      if (m.telegraph <= 0) {
        this.spawnBeam(m.pos, this.beamLane);
        m.phase = 0;
        m.t = 0;
        m.mesh.scale.setScalar(1);
      }
      return;
    }
    if (m.t > 1.75) {
      m.t = 0;
      if (m.phase % 2 === 0) {
        this.warn('獄炎');
        this.spawnAimed(m.pos, 'fireball', 4, 1.2);
        m.phase = 1;
      } else {
        this.beamLane = this.lane;
        m.phase = 10;
        m.telegraph = 0.95;
        this.warn('炮杖蓄力');
      }
    }
  }

  private bossSlime(m: Monster, dt: number): void {
    m.pos.x = Math.sin(m.t * 0.55) * 0.45;
    m.pos.z = THREE.MathUtils.damp(m.pos.z, -14.5, 1.8, dt);
    m.pos.y = 0.12 + Math.sin(m.t * 2.1) * 0.06;
    if (m.hp <= m.maxHp * 0.5 && !m.spawnedMinis) {
      m.spawnedMinis = true;
      const a = this.addMonster('slime', m.pos.clone().add(new THREE.Vector3(-1.4, 0, 1.2)), -1);
      a.pos.z = -10;
      const b = this.addMonster('slime', m.pos.clone().add(new THREE.Vector3(1.4, 0, 1.2)), 1);
      b.pos.z = -10;
      this.ui.float('分身', 0.5, 0.4, 'combo');
    }
    if (m.telegraph > 0) {
      m.telegraph -= dt;
      m.mesh.scale.set(1.18, 0.72, 1.18);
      if (m.telegraph <= 0) {
        this.spawnRing(m.pos);
        m.phase = (m.phase + 1) % 2;
        m.t = 0;
        m.mesh.scale.setScalar(1);
      }
      return;
    }
    if (m.t > 1.55) {
      if (m.phase === 0) {
        this.warn('衝擊波');
        m.telegraph = 0.55;
        m.t = 0;
      } else {
        this.warn('晶簇');
        this.spawnVolley(m.pos, 5, 0x66ddff, 'shard');
        m.phase = 0;
        m.t = 0;
      }
    }
  }

  private bossWraith(m: Monster, dt: number): void {
    m.pos.z = THREE.MathUtils.damp(m.pos.z, -14.2, 1.6, dt);
    if (m.untargetable) {
      m.telegraph -= dt;
      if (m.telegraph <= 0) {
        m.untargetable = false;
        m.mesh.visible = true;
        this.spawnBurst(m.pos);
        this.warn('魂爆');
        m.t = 0;
        m.phase = (m.phase + 1) % 4;
      }
      return;
    }
    m.pos.y = 0.25 + Math.sin(m.t * 2.4) * 0.12;
    if (m.t > 1.45) {
      m.t = 0;
      const p = m.phase % 4;
      if (p === 0) {
        const dest = ([-1, 1] as Lane[])[Math.random() < 0.5 ? 0 : 1];
        this.afterimage.push({ x: m.pos.x, life: 0.28 });
        m.lane = dest;
        m.pos.x = dest * LANE_X * 0.9;
        this.warn('瞬移');
      } else if (p === 1) {
        this.warn('魂扇');
        this.spawnFan(m.pos, 7, 0xcc66ff);
      } else if (p === 2) {
        this.warn('追魂');
        this.spawnWisps(m.pos, 3);
      } else {
        m.untargetable = true;
        m.telegraph = 0.6;
        this.warn('消散');
      }
      m.phase += 1;
    }
  }

  private bossDemon(m: Monster, dt: number): void {
    m.pos.z = THREE.MathUtils.damp(m.pos.z, -15, 1.5, dt);
    m.pos.y = 0.18 + Math.sin(m.t * 1.6) * 0.08;
    if (m.phase === 10) {
      m.telegraph -= dt;
      m.mesh.scale.setScalar(1.05 + Math.sin(m.t * 22) * 0.08);
      this.beamCharge = m.telegraph;
      if (m.telegraph <= 0) {
        this.spawnBeam(m.pos, this.beamLane);
        m.phase = 0;
        m.t = 0;
        m.mesh.scale.setScalar(1);
        m.chargeDmg = 0;
      }
      return;
    }
    if (m.phase === 11) {
      m.telegraph -= dt;
      const u = 1 - m.telegraph / 0.7;
      m.mesh.scale.setScalar(1 + u * 0.55);
      m.pos.z = THREE.MathUtils.damp(m.pos.z, -7, 4, dt);
      if (m.telegraph <= 0) {
        if (this.canBeHit()) this.playerHurt(1);
        m.phase = 0;
        m.t = 0;
        m.mesh.scale.setScalar(1);
      }
      return;
    }
    if (m.t > 1.7) {
      m.t = 0;
      const p = m.phase % 4;
      if (p === 0) {
        this.beamLane = this.lane;
        m.phase = 10;
        m.telegraph = 1.15;
        m.chargeDmg = 0;
        this.warn('炮杖蓄力');
      } else if (p === 1) {
        this.warn('獄炎');
        this.spawnFireballs(m.pos);
        m.phase = 1;
      } else if (p === 2) {
        this.warn('螺旋彈幕');
        this.spawnSpiral(m.pos);
        m.phase = 2;
      } else {
        this.warn('突進');
        m.phase = 11;
        m.telegraph = 0.7;
        return;
      }
      if (p !== 0) m.phase = (p + 1) % 4;
    }
  }

  private spawnAimed(origin: THREE.Vector3, kind: 'shard' | 'soul' | 'fireball', n: number, spread: number): void {
    const px = this.camX;
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      const pos = origin.clone();
      pos.y = 1.2;
      const tx = px + u * spread;
      const s = spawnShot(kind, pos, {
        vel: new THREE.Vector3((tx - pos.x) * 0.7, 0, 9.2),
        allLanes: false,
      });
      this.scene.add(s.mesh);
      this.shots.push(s);
    }
  }

  private spawnRing(origin: THREE.Vector3): void {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * 1.55;
      const y = 1.1 + Math.sin(a) * 0.45;
      const pos = origin.clone();
      pos.x += x * 0.2;
      pos.y = y;
      const s = spawnShot('ring', pos, {
        vel: new THREE.Vector3(Math.cos(a) * 1.1, 0, 8.2),
        allLanes: true,
        hp: 1,
      });
      s.pos.copy(pos);
      this.scene.add(s.mesh);
      this.shots.push(s);
    }
  }

  private spawnVolley(origin: THREE.Vector3, n: number, _c: number, kind: 'shard' | 'soul'): void {
    this.spawnAimed(origin, kind, n, n >= 5 ? 1.35 : 1.05);
  }

  private spawnFan(origin: THREE.Vector3, n: number, _c: number): void {
    const px = this.camX;
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      const pos = origin.clone();
      pos.y = 1.3;
      const tx = px + u * 1.55;
      const s = spawnShot('soul', pos, {
        vel: new THREE.Vector3((tx - pos.x) * 0.85 + u * 1.6, 0, 8.6),
        allLanes: false,
      });
      this.scene.add(s.mesh);
      this.shots.push(s);
    }
  }

  private spawnWisps(origin: THREE.Vector3, n: number): void {
    for (let i = 0; i < n; i++) {
      const pos = origin.clone();
      pos.x += (i - (n - 1) * 0.5) * 0.8;
      pos.y = 1.4;
      const s = spawnShot('wisp', pos, {
        vel: new THREE.Vector3(0, 0, 3.6),
        homing: true,
        allLanes: false,
        life: 5.5,
      });
      this.scene.add(s.mesh);
      this.shots.push(s);
    }
  }

  private spawnBurst(origin: THREE.Vector3): void {
    const px = this.camX;
    for (let i = 0; i < 3; i++) {
      const u = (i / 2) * 2 - 1;
      const pos = origin.clone();
      pos.y = 1.2;
      const tx = px + u * 1.15;
      const s = spawnShot('burst', pos, {
        vel: new THREE.Vector3((tx - pos.x) * 0.7, 0, 10),
        allLanes: false,
      });
      this.scene.add(s.mesh);
      this.shots.push(s);
    }
  }

  private spawnBeam(origin: THREE.Vector3, lane: Lane): void {
    const pos = origin.clone();
    pos.x = this.camX * 0.15 + lane * LANE_X * 0.85;
    pos.y = 1.15;
    pos.z = -8;
    const beam = spawnShot('beam', pos, {
      vel: new THREE.Vector3(0, 0, 11),
      lane,
      allLanes: false,
      life: 1.1,
      hp: 3,
    });
    this.scene.add(beam.mesh);
    this.shots.push(beam);
    for (let i = 0; i < 3; i++) {
      const np = pos.clone();
      np.z = -4 - i * 3.2;
      const node = spawnShot('node', np, {
        vel: new THREE.Vector3(0, 0, 11),
        lane,
        allLanes: false,
        hp: 1,
        life: 1.1,
      });
      this.scene.add(node.mesh);
      this.shots.push(node);
    }
  }

  private spawnFireballs(origin: THREE.Vector3): void {
    this.spawnAimed(origin, 'fireball', 5, 1.4);
  }

  private spawnSpiral(origin: THREE.Vector3): void {
    for (let i = 0; i < 14; i++) {
      const a = i * 0.48;
      const lane = (Math.round(Math.sin(a)) as Lane);
      const pos = origin.clone();
      pos.y = 1.15;
      const s = spawnShot('orb', pos, {
        vel: new THREE.Vector3(0, 0, 6.4),
        lane,
        allLanes: false,
        life: 3.4,
      });
      s.t = i * 0.12;
      s.pos.z -= i * 0.35;
      this.scene.add(s.mesh);
      this.shots.push(s);
    }
  }

  private updateShots(dt: number): void {
    const px = this.camX;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      if (!s.alive) {
        this.removeObject(s.mesh);
        this.shots.splice(i, 1);
        continue;
      }
      const ev = updateShot(s, dt, px, false);
      if (ev === 'hitPlayer') {
        const hits = s.allLanes || overlapsPlayer(s.pos.x, s.radius, px);
        if (hits && this.canBeHit()) this.playerHurt(1);
        s.alive = false;
        this.removeObject(s.mesh);
        this.shots.splice(i, 1);
      }
    }
  }

  private pickupColor(kind: PickupKind): number {
    if (kind === 'heart') return 0xff8ab0;
    if (kind === 'chest') return 0xf4d06a;
    if (kind === 'atk') return 0xff4a5a;
    if (kind === 'shield') return 0x4a88ff;
    return 0xffd24a;
  }

  private updatePickups(dt: number): void {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (!p.alive) {
        this.removeObject(p.mesh);
        this.pickups.splice(i, 1);
        continue;
      }
      updatePickup(p, dt, this.arena);
      const close = Math.abs(p.pos.x - this.camX) <= PICKUP_ALIGN;
      if (close && p.pos.z > -12) {
        p.pos.x = THREE.MathUtils.damp(p.pos.x, this.camX, 8, dt);
        p.pos.y = THREE.MathUtils.damp(p.pos.y, 0.9, 5, dt);
        p.pos.z += dt * 4.2;
        const u = THREE.MathUtils.clamp((p.pos.z + 12) / 10, 0, 1);
        p.mesh.scale.setScalar(1.16 - u * 0.5);
        p.mesh.position.copy(p.pos);
        if (this.pickSparkT <= 0) {
          this.pickSparkT = 0.07;
          this.burst(p.pos, this.pickupColor(p.kind), 3);
        }
      }
      if (close && p.pos.z >= HIT_Z - 0.4) {
        this.collectPickup(p);
        this.removeObject(p.mesh);
        this.pickups.splice(i, 1);
        continue;
      }
      if (p.pos.z > PASS_Z) {
        p.alive = false;
        this.removeObject(p.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }

  private collectPickup(p: Pickup): void {
    if (!p.alive) return;
    p.alive = false;
    if (p.kind === 'heart') this.collectHeart(p);
    else if (p.kind === 'chest') this.openChest(p);
    else this.collectPower(p);
  }

  private collectHeart(p: Pickup): void {
    this.hp = Math.min(MAX_HP, this.hp + 1);
    this.audio.heal();
    const scr = this.project(p.pos);
    this.ui.float('生命+1', scr ? scr.x / this.vw : 0.5, scr ? scr.y / this.vh : 0.5, 'heal');
    this.burst(p.pos, 0xff6a8a, 18);
    this.burst(new THREE.Vector3(this.camX, 1.1, -1.4), 0xffc0d4, 10);
  }

  private openChest(p: Pickup): void {
    const pts = 420 * Math.max(1, this.combo);
    this.score += pts;
    this.iframe = Math.max(this.iframe, 0.22);
    this.audio.chest();
    const scr = this.project(p.pos);
    this.ui.float(`寶箱 +${pts}`, scr ? scr.x / this.vw : 0.5, scr ? scr.y / this.vh : 0.5, 'gold');
    this.burst(p.pos, 0xf4d06a, 26);
    this.burst(new THREE.Vector3(this.camX, 1.1, -1.4), 0xffe9a0, 12);
  }

  private canBeHit(): boolean {
    return this.iframe <= 0 && !this.ended && this.forkT <= 0;
  }

  private handleSword(): void {
    if (this.forkT > 0) return;
    if (this.input.pressed) {
      this.slashHit.clear();
      this.shotHit.clear();
      this.pickHit.clear();
      this.rangeMiss = false;
      this.slash.push({ x: this.input.clientX, y: this.input.clientY, life: 0.28 });
    }
    if (this.input.down) {
      const last = this.slash[this.slash.length - 1];
      const dx = this.input.clientX - (last ? last.x : this.input.prevClientX);
      const dy = this.input.clientY - (last ? last.y : this.input.prevClientY);
      if (!last || Math.hypot(dx, dy) > 6) {
        this.slash.push({ x: this.input.clientX, y: this.input.clientY, life: 0.28 });
      }
      const speed = Math.hypot(this.input.vx, this.input.vy);
      const crit = speed > 1700;
      const x0 = this.input.prevClientX;
      const y0 = this.input.prevClientY;
      const x1 = this.input.clientX;
      const y1 = this.input.clientY;
      if (Math.hypot(x1 - x0, y1 - y0) > 4) {
        this.trySlashHits(x0, y0, x1, y1, crit);
        this.view.slash(this.input.vx, -this.input.vy, crit);
        if (this.atkLv >= 2 && this.waveCd <= 0) {
          this.spawnSlashWaves();
          this.waveCd = (this.spdLv >= 2 ? 0.32 : this.spdLv >= 1 ? 0.42 : 0.55);
        }
      }
    }
    if (this.input.released) {
      if (this.slashHit.size === 0 && this.shotHit.size === 0 && this.slash.length > 3) this.breakCombo();
      this.rangeMiss = false;
    }
  }

  private trySlashHits(x0: number, y0: number, x1: number, y1: number, crit: boolean): void {
    let taggedFar: THREE.Vector3 | null = null;
    for (const m of this.monsters) {
      if (!m.alive || m.untargetable || this.slashHit.has(m.id)) continue;
      const p = this.project(m.pos);
      if (!p) continue;
      const wide = this.atkLv >= 3 ? 1.55 : this.atkLv >= 2 ? 1.32 : 1;
      const r = this.screenRadius(m.pos, m.radius) * wide;
      if (distSeg(x0, y0, x1, y1, p.x, p.y) <= r) {
        if (!m.isBoss && !this.inMelee(m.pos, m.radius)) {
          taggedFar = m.pos;
          continue;
        }
        this.slashHit.add(m.id);
        if (this.slashHit.size === 1) this.audio.slash(crit);
        this.hitMonster(m, crit ? 2 : 1, crit ? 'crit' : 'ok', p);
      }
    }
    for (const s of this.shots) {
      if (!s.alive || this.shotHit.has(s.id)) continue;
      const p = this.project(s.pos);
      if (!p) continue;
      if (distSeg(x0, y0, x1, y1, p.x, p.y) <= this.screenRadius(s.pos, s.radius)) {
        if (!this.inMelee(s.pos, s.radius)) {
          taggedFar = taggedFar ?? s.pos;
          continue;
        }
        this.shotHit.add(s.id);
        this.breakShot(s);
      }
    }
    if (taggedFar && this.slashHit.size === 0 && this.shotHit.size === 0 && !this.rangeMiss) {
      this.rangeMiss = true;
      const scr = this.project(taggedFar);
      this.ui.float('距離不足', scr ? scr.x / this.vw : 0.5, scr ? scr.y / this.vh : 0.46, 'ok');
      this.burst(taggedFar, 0xaad8ff, 7);
    }
  }

  private handleGun(): void {
    if (this.forkT > 0) return;
    if (this.input.pressed) {
      if (this.gunCd > 0) return;
      this.gunCd = GUN_COOLDOWN * (this.spdLv >= 2 ? 0.55 : this.spdLv >= 1 ? 0.72 : 1);
      this.audio.shot();
      this.view.shoot();
      const ways = this.atkLv >= 3 ? 3 : this.atkLv >= 2 ? 2 : 1;
      const originX = this.input.clientX;
      const originY = this.input.clientY;
      const offs = ways === 1 ? [0] : ways === 2 ? [-0.1, 0.1] : [-0.16, 0, 0.16];
      let any = false;
      const volley = new Set<number>();
      for (const o of offs) {
        const x = originX + o * this.vw;
        const y = originY;
        this.tracers.push({
          x0: this.vw * (0.58 + this.lane * 0.04),
          y0: this.vh * 0.62,
          x1: x,
          y1: y,
          life: 0.12,
        });
        if (this.hitscanAt(x, y, 1, volley)) any = true;
      }
      if (any) return;
      this.breakCombo();
      const aim = this.hitPlanePoint();
      if (aim) this.burst(aim, 0xffaa66, 4);
    }
  }

  private tryTapTarget(): boolean {
    let bestZ = 1e9;
    let kind: 'm' | 's' = 'm';
    let bestM: Monster | null = null;
    let bestS: Shot | null = null;
    let bestP: Pickup | null = null;
    let head = false;
    for (const m of this.monsters) {
      if (!m.alive || m.untargetable) continue;
      const p = this.project(m.pos);
      if (!p) continue;
      const r = this.screenRadius(m.pos, m.radius);
      const d = Math.hypot(this.input.clientX - p.x, this.input.clientY - p.y);
      if (d <= r && m.pos.z < bestZ) {
        bestM = m; bestZ = m.pos.z; kind = 'm';
        head = this.input.clientY < p.y - r * 0.18;
      }
    }
    for (const s of this.shots) {
      if (!s.alive) continue;
      const p = this.project(s.pos);
      if (!p) continue;
      const r = this.screenRadius(s.pos, s.radius);
      if (Math.hypot(this.input.clientX - p.x, this.input.clientY - p.y) <= r && s.pos.z < bestZ) {
        bestS = s; bestZ = s.pos.z; kind = 's';
      }
    }
    void bestP;
    if (kind === 'm' && bestM) {
      this.hitMonster(bestM, head ? 2 : 1, head ? 'head' : 'ok', this.project(bestM.pos)!);
      return true;
    }
    if (kind === 's' && bestS) { this.breakShot(bestS); return true; }
    return false;
  }

  private hitscanAt(cx: number, cy: number, dmg: number, skip: Set<number>): boolean {
    let bestZ = 1e9;
    let kind: 'm' | 's' = 'm';
    let bestM: Monster | null = null;
    let bestS: Shot | null = null;
    let head = false;
    for (const m of this.monsters) {
      if (!m.alive || m.untargetable || skip.has(m.id)) continue;
      const p = this.project(m.pos);
      if (!p) continue;
      const r = this.screenRadius(m.pos, m.radius);
      const d = Math.hypot(cx - p.x, cy - p.y);
      if (d <= r && m.pos.z < bestZ) {
        bestM = m; bestZ = m.pos.z; kind = 'm';
        head = cy < p.y - r * 0.18;
      }
    }
    for (const s of this.shots) {
      if (!s.alive || skip.has(s.id + 90000)) continue;
      const p = this.project(s.pos);
      if (!p) continue;
      const r = this.screenRadius(s.pos, s.radius);
      if (Math.hypot(cx - p.x, cy - p.y) <= r && s.pos.z < bestZ) {
        bestS = s; bestZ = s.pos.z; kind = 's';
      }
    }
    if (kind === 'm' && bestM) {
      skip.add(bestM.id);
      this.hitMonster(bestM, head ? dmg + 1 : dmg, head ? 'head' : 'ok', this.project(bestM.pos)!);
      return true;
    }
    if (kind === 's' && bestS) {
      skip.add(bestS.id + 90000);
      this.breakShot(bestS);
      return true;
    }
    return false;
  }

  private handleMage(dt: number): void {
    if (this.forkT > 0) return;
    const fullNeed = this.atkLv >= 2 ? MAGE_FULL * 0.62 : MAGE_FULL;
    const fizzleNeed = this.atkLv >= 2 ? MAGE_FIZZLE * 0.78 : MAGE_FIZZLE;
    const rate = this.spdLv >= 2 ? 1.45 : this.spdLv >= 1 ? 1.22 : 1;
    if (this.input.pressed) {
      this.charging = true;
      this.charge = 0;
      this.lastChargeSfx = 0;
    }
    if (this.charging && this.input.down) {
      this.charge += dt * rate;
      this.view.setCharge(Math.min(1, this.charge / fullNeed));
      if (this.charge - this.lastChargeSfx > 0.12 && this.charge < fizzleNeed) {
        this.audio.charge(Math.min(1, this.charge / fullNeed));
        this.lastChargeSfx = this.charge;
      }
      if (this.charge >= fizzleNeed) {
        this.charging = false;
        this.charge = 0;
        this.view.setCharge(0);
        this.audio.fizzle();
        this.breakCombo();
        this.ui.float('潰散', this.input.x, this.input.y, 'ok');
      }
    }
    if (this.input.released && this.charging) {
      this.charging = false;
      const full = this.charge >= fullNeed;
      const dmg = full ? 3 : this.charge > 0.35 ? 2 : 1;
      const pierce = this.atkLv >= 3 || full;
      const blast = this.atkLv >= 3 ? (full ? 2.6 : 1.6) : full ? 1.8 : 0;
      this.fireOrb(dmg, pierce, blast);
      this.audio.magic(full || this.atkLv >= 3);
      this.view.setCharge(0);
      this.charge = 0;
    }
    if (!this.input.down) this.view.setCharge(this.charging ? Math.min(1, this.charge / fullNeed) : 0);
  }

  private fireOrb(dmg: number, pierce: boolean, blast: number): void {
    const dir = this.hitPlanePoint() ?? new THREE.Vector3(0, 1.2, -12);
    dir.sub(this.camera.position).normalize();
    const pos = this.camera.position.clone().add(new THREE.Vector3(0.25, -0.1, -0.6));
    this.orbs.push({ pos, dir, dmg, pierce, blast, life: 1.6, maxLife: 1.6, hit: new Set() });
  }

  private updateOrbs(dt: number): void {
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const o = this.orbs[i];
      o.life -= dt;
      o.pos.addScaledVector(o.dir, dt * 28);
      for (const m of this.monsters) {
        if (!m.alive || m.untargetable || o.hit.has(m.id)) continue;
        if (o.pos.distanceTo(m.pos) < m.radius + (o.pierce ? 0.55 : 0.32)) {
          o.hit.add(m.id);
          const p = this.project(m.pos);
          this.hitMonster(m, o.dmg, o.pierce ? 'crit' : 'ok', p ?? { x: 0, y: 0 });
          if (o.blast > 0) {
            this.audio.explode();
            this.burst(m.pos, 0xf0d27a, 18);
            for (const n of this.monsters) {
              if (n.alive && n.id !== m.id && n.pos.distanceTo(m.pos) < o.blast) {
                const q = this.project(n.pos);
                this.hitMonster(n, 2, 'ok', q ?? { x: 0, y: 0 });
              }
            }
          } else this.burst(m.pos, 0xff4ec8, 8);
          if (!o.pierce) o.life = 0;
        }
      }
      for (const s of this.shots) {
        if (!s.alive || o.hit.has(s.id + 90000)) continue;
        if (o.pos.distanceTo(s.pos) < s.radius + 0.3) {
          o.hit.add(s.id + 90000);
          this.breakShot(s);
          if (!o.pierce) o.life = 0;
        }
      }
      if (o.life <= 0 || o.pos.z < -50) this.orbs.splice(i, 1);
    }
  }

  private breakShot(s: Shot): void {
    s.hp -= 1;
    this.burst(s.pos, s.color, 8);
    this.audio.hit(false);
    if (s.kind === 'node' || s.kind === 'beam') {
      for (const o of this.shots) {
        if (o.alive && (o.kind === 'beam' || o.kind === 'node')) o.hp -= 1;
      }
    }
    if (s.hp <= 0) {
      s.alive = false;
      this.scene.remove(s.mesh);
      if (s.kind === 'node' || s.kind === 'beam') {
        for (const o of this.shots) {
          if (o.kind === 'beam' || o.kind === 'node') {
            o.alive = false;
            this.scene.remove(o.mesh);
          }
        }
        this.ui.float('斬斷', 0.5, 0.42, 'combo');
      }
    }
  }

  private hitMonster(m: Monster, dmg: number, kind: 'ok' | 'crit' | 'head', screen: { x: number; y: number }): void {
    if (!m.alive || m.untargetable) return;
    m.hp -= dmg;
    m.hitFlash = 1;
    if (this.stage === 0 && (m.isBoss || kind !== 'ok')) this.world.flashStorm(m.isBoss ? 0.42 : 0.24);
    if (m.kind === 'bossDemon' && (m.phase === 10 || m.phase === 11)) {
      m.chargeDmg += dmg;
      if (m.phase === 10 && m.chargeDmg >= 3) {
        m.telegraph = 0;
        m.phase = 0;
        m.stunned = 0.7;
        this.ui.float('中斷', screen.x / this.vw, screen.y / this.vh, 'combo');
      }
      if (m.phase === 11 && m.chargeDmg >= 2) {
        m.telegraph = 0;
        m.phase = 0;
        m.stunned = 0.55;
        m.mesh.scale.setScalar(1);
        this.ui.float('中斷', screen.x / this.vw, screen.y / this.vh, 'combo');
      }
    }
    this.audio.hit(kind !== 'ok');
    this.addCombo(screen);
    if (m.isBoss) this.hitstop = Math.max(this.hitstop, 0.09);
    const label = kind === 'crit' ? `暴擊 ${dmg}` : kind === 'head' ? `爆頭 ${dmg}` : `${dmg}`;
    this.ui.float(label, screen.x / this.vw, screen.y / this.vh, m.isBoss ? 'gold' : kind === 'ok' ? 'ok' : kind === 'head' ? 'head' : 'crit');
    this.burst(m.pos, kind === 'ok' ? 0xffffff : 0xffe08a, kind === 'ok' ? 8 : 14);
    if (m.hp <= 0) this.killMonster(m, true);
  }

  private killMonster(m: Monster, scored: boolean): void {
    if (!m.alive) return;
    m.alive = false;
    if (scored) {
      const pts = (m.isMiniBoss ? 450 : m.isBoss ? 800 : m.kind === 'beetle' ? 180 : m.kind === 'pumpkin' ? 140 : 100) * Math.max(1, this.combo);
      this.score += pts;
      if (m.kind === 'pumpkin') {
        const a = m.pos.clone(); a.x -= 0.7; a.z += 0.4;
        const b = m.pos.clone(); b.x += 0.7;
        const s1 = this.addMonster('pumpkinMini', a, -1);
        s1.lane = m.lane - 1;
        const s2 = this.addMonster('pumpkinMini', b, 1);
        s2.lane = m.lane + 1;
      }
      if (m.isMiniBoss) {
        this.hitstop = 0.32;
        this.victoryHitch = 0.7;
        this.resumeWalk = true;
        this.audio.explode();
        this.burst(m.pos, 0xffe08a, 28);
        this.ui.float('擊破', 0.5, 0.4, 'gold');
        this.capsuleBoost = 18;
        this.addPickup('atk', m.pos.x - 0.9, -9);
        this.addPickup('shield', m.pos.x + 0.9, -9);
        if (this.route === 'hard') this.addPickup('atk', m.pos.x, -11);
      } else if (m.isBoss) {
        this.bossDead = true;
        this.hitstop = 0.42;
        this.victoryHitch = 0.62;
        this.audio.explode();
        this.burst(m.pos, 0xffe08a, 36);
      }
    }
    this.burst(m.pos, 0xffc070, 12);
  }

  private addCombo(screen: { x: number; y: number }): void {
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboT = COMBO_WINDOW;
    if (this.combo >= 3 && this.combo % 5 === 0) {
      this.audio.combo(this.combo);
      this.ui.float(`COMBO x${this.combo}`, screen.x / this.vw, screen.y / this.vh - 0.06, 'combo');
    }
  }

  private breakCombo(): void {
    this.combo = 0;
    this.comboT = 0;
  }

  private playerHurt(dmg: number): void {
    if (this.shieldT > 0) return;
    if (this.shieldN > 0) {
      this.shieldN -= 1;
      this.iframe = 0.34;
      this.shake = 0.45;
      this.audio.shieldBreak();
      this.ui.float('護盾碎裂', 0.5, 0.52, 'ok');
      this.burst(new THREE.Vector3(this.camX, 1.1, -1.6), 0x66aaff, 16);
      this.ui.setPowers(this.atkLv, this.shieldN, this.spdLv);
      return;
    }
    this.hp = Math.max(0, this.hp - dmg);
    this.shake = 1;
    this.hurtT = 0.22;
    this.breakCombo();
    this.audio.hurt();
  }

  private finish(win: boolean): void {
    this.ended = true;
    this.charging = false;
    this.ui.hideFork();
    this.ui.setArena(null);
    if (win) {
      if (this.save.unlockedStage < this.stage + 1) this.save.unlockedStage = Math.min(2, this.stage + 1);
      const key = scoreKey(this.char, this.stage);
      const prev = this.save.best[key] ?? 0;
      const isBest = this.score > prev;
      if (isBest) this.save.best[key] = this.score;
      writeSave(this.save);
      this.screen = 'win';
      this.ui.show('play');
      this.ui.overlay('win');
      this.ui.win(this.score, this.maxCombo, this.save.best[key] ?? this.score, isBest, this.stage < 2);
      this.audio.win();
      this.audio.setMode('title');
      this.audio.setTheme(this.char, 'full');
    } else {
      this.screen = 'lose';
      this.ui.show('play');
      this.ui.overlay('lose');
      this.ui.lose(this.score, this.maxCombo);
      this.audio.lose();
      this.audio.setMode('title');
      this.audio.setTheme(this.char, 'full');
    }
  }

  private burst(pos: THREE.Vector3, color: number, n: number): void {
    const count = this.lowQuality ? Math.max(3, Math.ceil(n * 0.4)) : n;
    const scr = this.project(pos);
    const cx = scr ? scr.x : this.vw * 0.5;
    const cy = scr ? scr.y : this.vh * 0.45;
    const hex = '#' + color.toString(16).padStart(6, '0');
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 220;
      this.sparks.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 40,
        life: 0.35 + Math.random() * 0.28, max: 0.55, color: hex, size: 4 + Math.random() * 7,
      });
    }
  }

  private updateSparks(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      s.vy += 420 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }
    for (let i = this.afterimage.length - 1; i >= 0; i--) {
      this.afterimage[i].life -= dt;
      if (this.afterimage[i].life <= 0) this.afterimage.splice(i, 1);
    }
  }


  private collectPower(p: Pickup): void {
    const prevA = this.atkLv;
    const prevS = this.shieldN;
    const prevD = this.spdLv;
    if (p.kind === 'atk') this.atkLv = Math.min(ATK_MAX, this.atkLv + 1);
    else if (p.kind === 'shield') this.shieldN = Math.min(SHIELD_MAX, this.shieldN + 1);
    else if (p.kind === 'speed') this.spdLv = Math.min(SPEED_MAX, this.spdLv + 1);
    const leveled =
      (p.kind === 'atk' && this.atkLv > prevA) ||
      (p.kind === 'shield' && this.shieldN > prevS) ||
      (p.kind === 'speed' && this.spdLv > prevD);
    this.audio.powerup();
    this.view.setPowerGlow(this.atkLv, this.spdLv);
    const label =
      p.kind === 'atk' ? '攻擊強化' :
      p.kind === 'shield' ? '護盾' : '攻速';
    const scr = this.project(p.pos);
    this.ui.float(label, scr ? scr.x / this.vw : 0.5, scr ? scr.y / this.vh : 0.48, 'power');
    this.pickupHintOn = false;
    document.getElementById('pickup-hint')?.classList.add('hidden');
    this.burst(p.pos, this.pickupColor(p.kind), 22);
    this.burst(new THREE.Vector3(this.camX, 1.15, -1.5), this.pickupColor(p.kind), 12);
    if (leveled) this.ui.levelFlash();
    this.ui.setPowers(this.atkLv, this.shieldN, this.spdLv);
  }

  private tryUlt(): void {
    if (this.screen !== 'play' || this.ended || this.forkT > 0) return;
    if (this.ultT > 0) return;
    if (this.ultCd > 0) {
      this.audio.deny();
      return;
    }
    this.ultHintT = 0;
    if (!this.save.seenUltHint) {
      this.save.seenUltHint = true;
      writeSave(this.save);
    }
    this.view.flashUlt();
    if (this.char === 'sword') {
      this.ultT = ULT_SWORD;
      this.ultPulse = 0;
      this.ultHit.clear();
      this.iframe = ULT_SWORD;
      this.audio.ultSword();
      this.ui.float('霜華', 0.5, 0.36, 'combo');
      this.shake = Math.max(this.shake, 0.55);
    } else if (this.char === 'gun') {
      this.ultT = ULT_GUN;
      this.castGunUlt();
      this.ui.float('赤焰彈幕', 0.5, 0.36, 'crit');
    } else {
      this.ultT = ULT_MAGE;
      this.castMageUlt();
      this.ui.float('蒼穹崩', 0.5, 0.36, 'gold');
    }
  }

  private frostPulse(): void {
    const ring = 13.8;
    for (const m of this.monsters) {
      if (!m.alive || m.untargetable) continue;
      if (m.pos.z > 1.6 || m.pos.z < -40) continue;
      const d = Math.hypot(m.pos.x - this.camX, m.pos.z - 0.35);
      if (d > ring) continue;
      if (!this.ultHit.has(m.id)) {
        this.ultHit.add(m.id);
        const p = this.project(m.pos);
        this.hitMonster(m, 2, 'crit', p ?? { x: 0, y: 0 });
      }
      if (m.alive) m.slowT = Math.max(m.slowT, FREEZE_DUR);
    }
    for (const s of this.shots) {
      if (!s.alive) continue;
      if (s.pos.z < -30 || s.pos.z > 2) continue;
      const d = Math.hypot(s.pos.x - this.camX, s.pos.z - 0.35);
      if (d <= ring) this.breakShot(s);
    }
    this.burst(new THREE.Vector3(this.camX, 1.0, -3.2), 0xa8f0ff, 10);
  }

  private castGunUlt(): void {
    this.shake = 1.2;
    this.audio.ultGun();
    this.railT = 0.22;
    const volley = new Set<number>();
    const cy = this.vh * 0.4;
    for (let i = 0; i < 7; i++) {
      const u = (i / 6) * 2 - 1;
      const x = this.vw * 0.5 + u * this.vw * 0.4;
      const y = cy + Math.abs(u) * this.vh * 0.05;
      this.tracers.push({
        x0: this.vw * (0.58 + this.lane * 0.04),
        y0: this.vh * 0.62,
        x1: x,
        y1: y,
        life: 0.22,
      });
      this.hitscanAt(x, y, 2, volley);
    }
    for (const m of this.monsters) {
      if (!m.alive || m.untargetable) continue;
      if (Math.abs(m.pos.x - this.camX) < 1.08 && m.pos.z < -1 && m.pos.z > -42) {
        const p = this.project(m.pos);
        this.hitMonster(m, 2, 'crit', p ?? { x: 0, y: 0 });
      }
    }
    for (const s of this.shots) {
      if (!s.alive) continue;
      if (Math.abs(s.pos.x - this.camX) < 1.15) this.breakShot(s);
    }
  }

  private castMageUlt(): void {
    this.hitstop = Math.max(this.hitstop, 0.2);
    this.shake = 1.35;
    this.audio.ultMage();
    this.audio.explode();
    this.novaT = 0.45;
    const origin = new THREE.Vector3(this.camX, 1.1, -2.4);
    for (const s of this.shots) {
      if (!s.alive) continue;
      if (s.pos.distanceTo(origin) < 22) {
        this.burst(s.pos, 0xff66dd, 6);
        s.alive = false;
        this.scene.remove(s.mesh);
      }
    }
    for (const m of this.monsters) {
      if (!m.alive || m.untargetable) continue;
      const d = Math.hypot(m.pos.x - this.camX, m.pos.z);
      const dmg = Math.max(1, Math.round(THREE.MathUtils.lerp(5, 1, THREE.MathUtils.clamp(d / 36, 0, 1))));
      const p = this.project(m.pos);
      this.hitMonster(m, dmg, 'crit', p ?? { x: 0, y: 0 });
    }
    this.burst(origin, 0xff66dd, 42);
    this.burst(origin.clone().setZ(-8), 0xf0d27a, 26);
  }

  private spawnSlashWaves(): void {
    const n = this.atkLv >= 3 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const ox = n === 2 ? (i === 0 ? -0.7 : 0.7) : 0;
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.042, 8, 36, Math.PI * 1.16),
        new THREE.MeshBasicMaterial({
          color: 0xa8f4ff,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
        }),
      );
      mesh.rotation.z = -0.08 + (n === 2 ? (i === 0 ? -0.13 : 0.13) : 0);
      const pos = new THREE.Vector3(this.camX + ox, 0.85, -2.2);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.waves.push({
        pos,
        vel: new THREE.Vector3(0, 0, -22),
        mesh,
        life: 0.7,
        dmg: 1,
        hit: new Set(),
        width: this.atkLv >= 3 ? 1.7 : 1.45,
      });
    }
    this.audio.slash(true);
  }

  private updateWaves(dt: number): void {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.life -= dt;
      w.pos.addScaledVector(w.vel, dt);
      w.mesh.position.copy(w.pos);
      w.mesh.rotation.z += dt * 1.4;
      const mat = (w.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, w.life * 1.3);
      for (const m of this.monsters) {
        if (!m.alive || m.untargetable || w.hit.has(m.id)) continue;
        if (Math.abs(m.pos.x - w.pos.x) <= w.width + m.radius * 0.4 && Math.abs(m.pos.z - w.pos.z) < 1.2) {
          w.hit.add(m.id);
          const p = this.project(m.pos);
          this.hitMonster(m, w.dmg, 'ok', p ?? { x: 0, y: 0 });
        }
      }
      for (const s of this.shots) {
        if (!s.alive || w.hit.has(s.id + 90000)) continue;
        if (Math.abs(s.pos.x - w.pos.x) <= w.width && Math.abs(s.pos.z - w.pos.z) < 1.1) {
          w.hit.add(s.id + 90000);
          this.breakShot(s);
        }
      }
      if (w.life <= 0 || w.pos.z < -48) {
        this.removeObject(w.mesh);
        this.waves.splice(i, 1);
      }
    }
  }

  private buildCombatFx(): void {
    this.barrier = new THREE.Group();
    const sph = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0x66aaff,
        emissive: 0x2266ff,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.02, 6, 24),
      new THREE.MeshStandardMaterial({
        color: 0xa8d4ff,
        emissive: 0x4488ff,
        emissiveIntensity: 1.1,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );
    ring.rotation.x = 0.4;
    this.barrier.add(sph, ring);
    this.barrier.position.set(0, -0.04, -0.38);
    this.barrier.visible = false;
    this.camera.add(this.barrier);

    this.frostFx = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(0.7 + i * 0.22, 0.018, 6, 20),
        new THREE.MeshBasicMaterial({
          color: 0xb8f4ff,
          transparent: true,
          opacity: 0.55 - i * 0.1,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      r.rotation.x = Math.PI / 2 + i * 0.18;
      this.frostFx.add(r);
    }
    this.frostFx.position.set(0, 0.05, -0.5);
    this.frostFx.visible = false;
    this.camera.add(this.frostFx);

    this.novaMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 18, 12),
      new THREE.MeshBasicMaterial({
        color: 0xff66dd,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    this.novaMesh.visible = false;
    this.scene.add(this.novaMesh);
  }

  private turnEnvelope(): number {

    if (this.turnT <= 0) return 0;
    const u = 1 - this.turnT / TURN_DUR;
    const peakAt = 0.3;
    const raw = u < peakAt ? u / peakAt : 1 - (u - peakAt) / (1 - peakAt);
    return raw * raw * (3 - 2 * raw);
  }

  private inMelee(pos: THREE.Vector3, radius = 0): boolean {
    const dx = pos.x - this.camX;
    const dz = pos.z - 0.35;
    const dist = Math.hypot(dx, dz);
    const extra = this.atkLv >= 3 ? 1.8 : this.atkLv >= 2 ? 1.15 : 0;
    const reach = SWORD_RANGE + extra;
    return dist <= reach + radius * 0.2 && pos.z > -reach - 0.8 && pos.z < 1.2;
  }

  private project(pos: THREE.Vector3): { x: number; y: number } | null {
    this.tmpV.copy(pos).project(this.camera);
    if (this.tmpV.z > 1) return null;
    return {
      x: (this.tmpV.x * 0.5 + 0.5) * this.vw,
      y: (-this.tmpV.y * 0.5 + 0.5) * this.vh,
    };
  }

  private screenRadius(pos: THREE.Vector3, radius: number): number {
    const edge = this.tmpV2.copy(pos).add(new THREE.Vector3(radius, 0, 0)).project(this.camera);
    const c = this.tmpV.copy(pos).project(this.camera);
    const px = Math.abs(edge.x - c.x) * 0.5 * this.vw;
    return Math.max(28, px + 10);
  }

  private ndcPoint(): THREE.Vector2 {
    this.pointer.set((this.input.clientX / this.vw) * 2 - 1, -(this.input.clientY / this.vh) * 2 + 1);
    return this.pointer;
  }

  private hitPlanePoint(): THREE.Vector3 | null {
    this.ray.setFromCamera(this.ndcPoint(), this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 12);
    const hit = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(plane, hit)) return hit;
    return this.camera.position.clone().add(this.ray.ray.direction.multiplyScalar(12));
  }

  private syncHud(): void {
    const st = STAGES[this.stage];
    const c = CHARACTERS.find((x) => x.id === this.char)!;
    const route = ROUTES[this.route].name;
    const tag = this.arena ? (this.arenaMini ? '小魔王' : '魔王戰') : route;
    this.ui.setHud(
      this.hp,
      Math.max(1, this.combo),
      this.score,
      this.time / st.duration,
      `${st.name} · ${tag}`,
      c.hint,
      this.arena,
    );
    this.ui.setPowers(this.atkLv, this.shieldN, this.spdLv);
    this.ui.setUlt(this.ultCd, this.ultT > 0, this.screen === 'play' && this.ultHintT > 0);
  }

  private drawFx(dt: number): void {
    const ctx = this.fxCtx;
    const w = this.fx.width;
    const h = this.fx.height;
    const sx = w / this.vw;
    const sy = h / this.vh;
    ctx.clearRect(0, 0, w, h);

    if (this.screen === 'play' && this.turnT > 0) {
      const env = this.turnEnvelope();
      const vx = w * 0.5 + this.turnDir * -env * 0.1 * w;
      const vy = h * 0.36;
      ctx.lineCap = 'round';
      const n = this.lowQuality ? 8 : 16;
      for (let i = 0; i < n; i++) {
        const ang = -0.95 + (i / Math.max(1, n - 1)) * 1.9 + this.turnDir * 0.22 * env;
        const spin = ((i * 37 + this.walkT * 520) % 210) + 30;
        const len0 = spin * sx;
        const len1 = (spin + 46 + env * 50) * sx;
        ctx.strokeStyle = `rgba(255, 248, 220, ${0.07 + env * 0.28})`;
        ctx.lineWidth = (1.1 + env * 1.6) * sx;
        ctx.beginPath();
        ctx.moveTo(vx + Math.sin(ang) * len0, vy + Math.cos(ang) * len0 * 0.92);
        ctx.lineTo(vx + Math.sin(ang) * len1, vy + Math.cos(ang) * len1 * 0.92);
        ctx.stroke();
      }
    }

    if (this.screen === 'play' && this.ultT > 0 && this.char === 'sword') {
      const u = this.ultT / ULT_SWORD;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const n = this.lowQuality ? 8 : 14;
      for (let i = 0; i < n; i++) {
        const ang = this.walkT * 14 + i * (Math.PI * 2 / n);
        const rad = (70 + (i % 3) * 28) * sx * (0.7 + u * 0.5);
        ctx.strokeStyle = `rgba(170, 240, 255, ${0.18 + u * 0.35})`;
        ctx.lineWidth = (3 + u * 4) * sx;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.58, rad, ang, ang + 0.7);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (this.screen === 'play' && this.railT > 0) {
      const a = this.railT / 0.22;
      const p0 = this.project(new THREE.Vector3(this.camX, 1.15, -1.2));
      const p1 = this.project(new THREE.Vector3(this.camX, 1.2, -28));
      if (p0 && p1) {
        ctx.strokeStyle = `rgba(255, 140, 60, ${0.35 + a * 0.55})`;
        ctx.lineWidth = (8 + a * 10) * sx;
        ctx.shadowColor = '#ff6a2a';
        ctx.shadowBlur = 18 * sx;
        ctx.beginPath();
        ctx.moveTo(p0.x * sx, p0.y * sy);
        ctx.lineTo(p1.x * sx, p1.y * sy);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    if (this.screen === 'play' && this.warnT > 0 && this.warnText === '炮杖蓄力') {
      const p0 = this.project(new THREE.Vector3(this.beamLane * LANE_X, 1.2, -16));
      const p1 = this.project(new THREE.Vector3(this.beamLane * LANE_X, 1.1, -2.6));
      if (p0 && p1) {
        ctx.strokeStyle = `rgba(180,80,255,${0.35 + Math.sin(this.warnT * 20) * 0.25})`;
        ctx.lineWidth = 10 * sx;
        ctx.beginPath();
        ctx.moveTo(p0.x * sx, p0.y * sy);
        ctx.lineTo(p1.x * sx, p1.y * sy);
        ctx.stroke();
      }
    }

    for (let i = this.slash.length - 1; i >= 0; i--) {
      this.slash[i].life -= dt;
      if (this.slash[i].life <= 0) this.slash.splice(i, 1);
    }
    if (this.slash.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = this.char === 'sword' ? '#7ef8ff' : '#fff';
      ctx.shadowBlur = 22 * sx;
      for (let i = 1; i < this.slash.length; i++) {
        const a = this.slash[i - 1];
        const b = this.slash[i];
        ctx.strokeStyle = `rgba(180,255,255,${Math.min(a.life, b.life) * 4})`;
        ctx.lineWidth = 7 * sx * (0.4 + Math.min(a.life, b.life) * 3);
        ctx.beginPath();
        ctx.moveTo(a.x * sx, a.y * sy);
        ctx.lineTo(b.x * sx, b.y * sy);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) { this.tracers.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(255,170,60,${t.life * 7})`;
      ctx.lineWidth = 3 * sx;
      ctx.beginPath();
      ctx.moveTo(t.x0 * sx, t.y0 * sy);
      ctx.lineTo(t.x1 * sx, t.y1 * sy);
      ctx.stroke();
    }

    if (this.screen === 'play' && this.char === 'gun') {
      const x = this.input.clientX * sx;
      const y = this.input.clientY * sy;
      ctx.strokeStyle = 'rgba(255,140,90,0.85)';
      ctx.lineWidth = 1.5 * sx;
      ctx.beginPath();
      ctx.moveTo(x - 14 * sx, y); ctx.lineTo(x + 14 * sx, y);
      ctx.moveTo(x, y - 14 * sy); ctx.lineTo(x, y + 14 * sy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 16 * sx, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.screen === 'play' && this.char === 'mage' && this.charging) {
      const x = this.input.clientX * sx;
      const y = this.input.clientY * sy;
      const u = Math.min(1, this.charge / MAGE_FULL);
      ctx.strokeStyle = u >= 1 ? '#f0d27a' : '#7ee0ff';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 12 * sx;
      ctx.lineWidth = 3 * sx;
      ctx.beginPath();
      ctx.arc(x, y, (18 + u * 28) * sx, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    for (const o of this.orbs) {
      const p = this.project(o.pos);
      if (!p) continue;
      const depth = Math.max(0.35, Math.min(1.8, 18 / Math.max(4, -o.pos.z)));
      const rad = (o.pierce ? 26 : 14) * sx * depth;
      const x = p.x * sx;
      const y = p.y * sy;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      if (o.pierce) {
        g.addColorStop(0, 'rgba(255,255,240,0.95)');
        g.addColorStop(0.35, 'rgba(240,210,122,0.9)');
        g.addColorStop(1, 'rgba(240,180,60,0)');
      } else {
        g.addColorStop(0, 'rgba(255,240,255,0.95)');
        g.addColorStop(0.4, 'rgba(255,78,200,0.88)');
        g.addColorStop(1, 'rgba(126,224,255,0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const sp of this.sparks) {
      const a = Math.max(0, sp.life / sp.max);
      const x = sp.x * sx;
      const y = sp.y * sy;
      const r = sp.size * sx * (0.5 + a);
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.35, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.35, y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function distSeg(ax: number, ay: number, bx: number, by: number, px: number, py: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby || 1;
  let t = ((px - ax) * abx + (py - ay) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * abx), py - (ay + t * aby));
}

void dirLabel;
