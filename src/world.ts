import * as THREE from 'three';
import { LANE_X, ROUTES, SWORD_RANGE, type RouteId, type StageDef } from './types';
import { disposeObject3D, fitHeight, hasModel, makeInstancedMesh } from './models';

interface Prop {
  mesh: THREE.Object3D;
  z: number;
  baseX: number;
  kind: 'tree' | 'lantern' | 'rock' | 'flower' | 'crystal' | 'gate' | 'sigil' | 'mist';
  light?: THREE.PointLight;
  inst?: number;
  visScale?: number;
  rotY?: number;
}

export class World {
  readonly group = new THREE.Group();
  fogColor = new THREE.Color(0x9ecfff);
  private walk = 0;
  private groundTex!: THREE.Texture;
  private legacyGroundTex!: THREE.CanvasTexture;
  private stormGroundTex!: THREE.Texture;
  private stormHeightTex!: THREE.Texture;
  private grassTex!: THREE.CanvasTexture;
  private ground!: THREE.Mesh;
  private grassL!: THREE.Mesh;
  private grassR!: THREE.Mesh;
  private skyMat!: THREE.ShaderMaterial;
  private backdrop!: THREE.Mesh;
  private legacyBackdropTex!: THREE.Texture;
  private stormBackdropTex!: THREE.Texture;
  private sunOrb!: THREE.Mesh;
  private hemi!: THREE.HemisphereLight;
  private sun!: THREE.DirectionalLight;
  private fill!: THREE.DirectionalLight;
  private props: Prop[] = [];
  private forkGroup = new THREE.Group();
  private laneMarks: THREE.Mesh[] = [];
  private glowMarks: THREE.Mesh[] = [];
  private rng = 1;
  private phone = false;
  private bendDir = 0;
  private bendEnv = 0;
  private turning = false;
  private rangeAssist = new THREE.Group();
  private rangeFill!: THREE.Mesh;
  private rangeEdge!: THREE.Mesh;
  private rangePulse = 0;
  private groundRestX = 0;
  private grassLRestX = -13.5;
  private grassRRestX = 13.5;
  private treeInst: THREE.InstancedMesh | null = null;
  private lampInst: THREE.InstancedMesh | null = null;
  private instDummy = new THREE.Object3D();
  private stageId = 0;
  private stormFlash = 0;
  private stormClock = 3.4;
  private sunBase = 1.25;
  private fillBase = 0.28;
  private mistCards: THREE.Sprite[] = [];
  private curbMats: THREE.MeshStandardMaterial[] = [];
  private rain!: THREE.LineSegments;
  private rainPos!: Float32Array;

  constructor(private scene: THREE.Scene, phone: boolean) {
    this.phone = phone;
    this.scene.add(this.group);
    this.buildSky();
    this.buildGround();
    this.buildLights();
    this.buildProps();
    this.buildStormWeather();
    this.buildForkVisual();
    this.buildRangeAssist();
    this.scene.fog = new THREE.Fog(this.fogColor, 14, 54);
  }

  applyStage(stage: StageDef): void {
    this.stageId = stage.id;
    const storm = stage.id === 0;
    this.fogColor.setHex(stage.fog);
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(this.fogColor);
      this.scene.fog.near = storm ? 10 : 14;
      this.scene.fog.far = storm ? 49 : 54;
    }
    this.scene.background = this.fogColor.clone();
    this.skyMat.uniforms.top.value.setHex(stage.skyTop);
    this.skyMat.uniforms.bot.value.setHex(stage.skyBot);
    this.skyMat.uniforms.mid.value.copy(this.fogColor);
    this.skyMat.uniforms.storm.value = storm ? 1 : 0;
    this.hemi.color.setHex(storm ? 0x9ed7ef : stage.id === 2 ? stage.moon : 0xfff4ea);
    this.hemi.groundColor.setHex(storm ? 0x07151a : stage.ground);
    this.hemi.intensity = storm ? 0.58 : 0.95;
    this.sun.color.setHex(storm ? 0x92dfff : stage.id === 2 ? 0xffb080 : 0xfff2e4);
    this.sunBase = storm ? 1.65 : stage.id === 2 ? 1.55 : 1.25;
    this.sun.intensity = this.sunBase;
    this.fill.color.setHex(storm ? 0xe3b96b : 0x88c8ff);
    this.fillBase = storm ? 0.42 : 0.28;
    this.fill.intensity = this.fillBase;
    this.sunOrb.visible = !storm;
    this.rain.visible = storm;

    const backdropMat = this.backdrop.material as THREE.MeshBasicMaterial;
    backdropMat.map = storm ? this.stormBackdropTex : this.legacyBackdropTex;
    backdropMat.fog = !storm;
    backdropMat.color.setHex(stage.id === 1 ? 0xc8e8d4 : stage.id === 2 ? 0xffd0a0 : 0xffffff);
    backdropMat.opacity = storm ? 0.86 : 0.72;
    backdropMat.needsUpdate = true;

    const road = this.ground.material as THREE.MeshPhysicalMaterial;
    road.map = storm ? this.stormGroundTex : this.legacyGroundTex;
    road.bumpMap = storm ? this.stormHeightTex : null;
    road.bumpScale = storm ? 0.13 : 0;
    road.color.setHex(storm ? 0x91a9ad : stage.id === 2 ? 0xc4a078 : 0xd8c4a0);
    road.roughness = storm ? 0.46 : 0.82;
    road.metalness = storm ? 0.12 : 0.04;
    road.clearcoat = storm ? 0.34 : 0;
    road.clearcoatRoughness = storm ? 0.32 : 0.6;
    road.needsUpdate = true;
    this.groundTex = storm ? this.stormGroundTex : this.legacyGroundTex;

    const shoulder = this.grassL.material as THREE.MeshStandardMaterial;
    shoulder.color.setHex(storm ? 0x183b3c : stage.id === 2 ? 0x6f6e32 : 0x6aaa48);
    shoulder.roughness = storm ? 0.78 : 0.9;
    for (const p of this.props) {
      const stormOnly = p.kind === 'crystal' || p.kind === 'gate' || p.kind === 'sigil' || p.kind === 'mist';
      p.mesh.visible = stormOnly ? storm : !(storm && p.kind === 'flower');
    }
    for (const mat of this.curbMats) {
      mat.color.setHex(storm ? 0x8f7841 : 0xc9a44a);
      mat.emissive.setHex(storm ? 0x43330b : 0x3a2a08);
      mat.emissiveIntensity = storm ? 0.7 : 0.25;
    }
    this.scene.environmentIntensity = storm ? 0.86 : 0.65;
    this.styleLoadedProps();
  }

  flashStorm(power = 1): void {
    if (this.stageId !== 0) return;
    this.stormFlash = Math.max(this.stormFlash, THREE.MathUtils.clamp(power, 0, 1.4));
  }

  update(dt: number, walking: boolean, speed = 1): void {
    const sp = walking ? speed : 0.38;
    this.walk += sp * dt;
    this.skyMat.uniforms.time.value += dt;
    if (this.stageId === 0) {
      this.stormClock -= dt;
      if (this.stormClock <= 0) {
        this.flashStorm(0.72 + (this.seed() % 30) / 100);
        this.stormClock = 4.2 + (this.seed() % 45) / 10;
      }
      this.stormFlash = Math.max(0, this.stormFlash - dt * 3.7);
      const flash = this.stormFlash * this.stormFlash;
      this.skyMat.uniforms.flash.value = flash;
      this.sun.intensity = this.sunBase + flash * 4.8;
      this.fill.intensity = this.fillBase + flash * 1.5;
      (this.backdrop.material as THREE.MeshBasicMaterial).opacity = 0.84 + flash * 0.1;
    } else {
      this.stormFlash = 0;
      this.skyMat.uniforms.flash.value = 0;
      this.sun.intensity = this.sunBase;
      this.fill.intensity = this.fillBase;
    }
    if (this.groundTex) this.groundTex.offset.y = (this.walk * 0.22) % 1;
    if (this.stageId === 0 && this.stormHeightTex) this.stormHeightTex.offset.y = this.stormGroundTex.offset.y;
    if (this.grassTex) this.grassTex.offset.y = (this.walk * 0.18) % 1;
    const dz = sp * 7.4 * dt;
    const bend = this.bendDir * this.bendEnv;
    this.group.rotation.y = -bend * 0.18;
    this.group.position.x = bend * 0.45;
    this.ground.position.x = this.groundRestX + bend * 1.35;
    this.grassL.position.x = this.grassLRestX + bend * 1.35;
    this.grassR.position.x = this.grassRRestX + bend * 1.35;
    if (!this.treeInst || !this.lampInst) this.attachLoaded();
    for (const p of this.props) {
      p.z += dz;
      if (p.z > 8) p.z -= 72;
      p.mesh.position.z = p.z;
      p.mesh.position.x = p.baseX + bend * Math.max(0, -p.z) * 0.11;
      if (p.kind === 'lantern' && p.inst === undefined) {
        const lamp = p.mesh.userData.lamp as THREE.Mesh | undefined;
        if (lamp) {
          const m = lamp.material as THREE.MeshStandardMaterial;
          m.emissiveIntensity = 1.35 + Math.sin(this.walk * 4 + p.z) * 0.25;
        }
      }
      if (p.light) {
        const d = Math.abs(p.z);
        p.light.intensity = d < 18 ? THREE.MathUtils.lerp(p.light.intensity, 0.32, 0.08) : THREE.MathUtils.lerp(p.light.intensity, 0, 0.12);
      }
    }
    for (let i = 0; i < this.mistCards.length; i++) {
      const mist = this.mistCards[i];
      const mat = mist.material;
      mat.opacity = this.stageId === 0 ? 0.075 + Math.sin(this.walk * 0.7 + i * 1.8) * 0.025 : 0;
      mist.position.x += Math.sin(this.walk * 0.09 + i) * 0.24;
    }
    if (this.stageId === 0 && this.rain) {
      for (let i = 0; i < this.rainPos.length; i += 6) {
        this.rainPos[i + 1] -= dt * 17;
        this.rainPos[i + 2] += dt * 3.2;
        this.rainPos[i + 4] -= dt * 17;
        this.rainPos[i + 5] += dt * 3.2;
        if (this.rainPos[i + 1] < -0.3 || this.rainPos[i + 2] > 4) {
          const x = ((this.seed() % 2000) / 1000 - 1) * 14;
          const y = 10 + (this.seed() % 900) / 100;
          const z = -3 - (this.seed() % 4200) / 100;
          this.rainPos[i] = x;
          this.rainPos[i + 1] = y;
          this.rainPos[i + 2] = z;
          this.rainPos[i + 3] = x - 0.1;
          this.rainPos[i + 4] = y - 0.85;
          this.rainPos[i + 5] = z + 0.18;
        }
      }
      const attr = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }
    if (this.lampInst) {
      const m = this.lampInst.material as THREE.MeshStandardMaterial;
      if (m && 'emissiveIntensity' in m) m.emissiveIntensity = 1.35 + Math.sin(this.walk * 4) * 0.25;
    }
    this.syncInstances();
    if (this.turning) this.forkGroup.position.z = THREE.MathUtils.damp(this.forkGroup.position.z, -6.5, 3.2, dt);
    else this.forkGroup.position.z += dz * 0.15;
    this.pulseRange(dt);
  }

  showFork(routes: RouteId[] | null): void {
    this.forkGroup.visible = !!routes;
    if (!routes) return;
    this.forkGroup.position.set(0, 0.02, -12);
    const n = routes.length;
    for (let i = 0; i < 3; i++) {
      const on = i < n;
      this.glowMarks[i].visible = on;
      if (!on) continue;
      const x = n === 2 ? (i === 0 ? -LANE_X : LANE_X) : (i - 1) * LANE_X;
      this.glowMarks[i].position.set(x, 0.04, 0);
      const col = colorFor(routes[i]);
      const mat = this.glowMarks[i].material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(col);
      mat.color.setHex(col);
      mat.emissiveIntensity = 0.85;
      mat.opacity = 0.92;
      this.glowMarks[i].scale.set(1, 1, 1);
    }
  }

  setChosenLane(index: number, n: number): void {
    const x = n === 2 ? (index === 0 ? -LANE_X : LANE_X) : (index - 1) * LANE_X;
    this.forkGroup.position.x = THREE.MathUtils.lerp(this.forkGroup.position.x, x * 0.15, 0.2);
  }

  beginTurn(dir: number, chosen: number, n: number): void {
    this.turning = true;
    this.bendDir = dir;
    this.forkGroup.visible = true;
    this.forkGroup.position.set(0, 0.02, -9);
    for (let i = 0; i < 3; i++) {
      const on = i < n;
      this.glowMarks[i].visible = on;
      if (!on) continue;
      const x = n === 2 ? (i === 0 ? -LANE_X : LANE_X) : (i - 1) * LANE_X;
      this.glowMarks[i].position.set(x, 0.04, 0);
      const mat = this.glowMarks[i].material as THREE.MeshStandardMaterial;
      const picked = i === chosen;
      mat.emissiveIntensity = picked ? 2.6 : 0.22;
      mat.opacity = picked ? 1 : 0.35;
      this.glowMarks[i].scale.set(picked ? 1.22 : 0.82, picked ? 1.8 : 1, picked ? 1.05 : 0.9);
    }
  }

  setBend(env: number): void {
    this.bendEnv = env;
    if (this.turning) {
      for (let i = 0; i < 3; i++) {
        const mat = this.glowMarks[i].material as THREE.MeshStandardMaterial;
        if (!this.glowMarks[i].visible) continue;
        if (mat.emissiveIntensity > 1) mat.emissiveIntensity = 1.4 + env * 1.4;
      }
    }
    if (env <= 0.001 && this.turning) {
      this.turning = false;
      this.bendDir = 0;
      this.group.rotation.y = 0;
      this.group.position.x = 0;
      this.ground.position.x = this.groundRestX;
      this.grassL.position.x = this.grassLRestX;
      this.grassR.position.x = this.grassRRestX;
      for (const p of this.props) p.mesh.position.x = p.baseX;
      this.showFork(null);
    }
  }

  setRangeAssist(on: boolean): void {
    this.rangeAssist.visible = on;
  }

  followRange(camX: number): void {
    this.rangeAssist.position.x = camX;
  }

  dustAt(x: number): THREE.Vector3 {
    return new THREE.Vector3(x, 0.2, -6);
  }

  private buildLights(): void {
    this.hemi = new THREE.HemisphereLight(0xfff4ea, 0x2a4a22, 0.95);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2e4, 1.25);
    this.sun.position.set(10, 18, 6);
    this.sun.castShadow = !this.phone;
    if (!this.phone) {
      this.sun.shadow.mapSize.set(1024, 1024);
      this.sun.shadow.camera.near = 2;
      this.sun.shadow.camera.far = 70;
      this.sun.shadow.camera.left = -18;
      this.sun.shadow.camera.right = 18;
      this.sun.shadow.camera.top = 18;
      this.sun.shadow.camera.bottom = -8;
      this.sun.shadow.bias = -0.0008;
    }
    this.scene.add(this.sun);
    this.fill = new THREE.DirectionalLight(0x88c8ff, 0.28);
    this.fill.position.set(-8, 6, 4);
    this.scene.add(this.fill);
  }

  private buildSky(): void {
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color(0x5ab0ff) },
        mid: { value: new THREE.Color(0xc8e8ff) },
        bot: { value: new THREE.Color(0xffe2b0) },
        time: { value: 0 },
        storm: { value: 1 },
        flash: { value: 0 },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
        uniform float time; uniform float storm; uniform float flash;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
        }
        void main(){
          float h = vP.y;
          vec3 c = mix(bot, mid, smoothstep(-0.28, 0.1, h));
          c = mix(c, top, smoothstep(0.08, 0.82, h));
          vec2 uv = vP.xz * 2.4 + vec2(time * 0.014, -time * 0.009);
          float cloud = noise(uv) * 0.65 + noise(uv * 2.08 + 3.7) * 0.35;
          float shelf = smoothstep(-0.18, 0.65, h);
          vec3 stormC = mix(vec3(0.015,0.035,0.075), vec3(0.13,0.28,0.38), cloud * shelf);
          stormC += vec3(0.04,0.16,0.2) * pow(max(0.0, cloud - 0.58), 2.0) * 2.2;
          c = mix(c, stormC, storm);
          c += vec3(0.58,0.86,1.0) * flash * (0.38 + shelf * 0.62);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 16), this.skyMat);
    this.group.add(sky);

    this.sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff0c0, fog: false, toneMapped: false }),
    );
    this.sunOrb.position.set(18, 22, -40);
    this.group.add(this.sunOrb);

    const loader = new THREE.TextureLoader();
    this.legacyBackdropTex = loader.load('./art/world-path.jpg');
    this.legacyBackdropTex.colorSpace = THREE.SRGBColorSpace;
    this.stormBackdropTex = loader.load('./art/storm-shrine-horizon.webp');
    this.stormBackdropTex.colorSpace = THREE.SRGBColorSpace;
    const bd = new THREE.Mesh(
      new THREE.PlaneGeometry(72, 40.5),
      new THREE.MeshBasicMaterial({
        map: this.stormBackdropTex,
        fog: false,
        transparent: true,
        opacity: 0.86,
        toneMapped: false,
      }),
    );
    bd.position.set(0, 12.4, -48);
    this.backdrop = bd;
    this.group.add(bd);
  }

  private buildGround(): void {
    this.legacyGroundTex = cobbleTexture();
    this.legacyGroundTex.wrapS = this.legacyGroundTex.wrapT = THREE.RepeatWrapping;
    this.legacyGroundTex.repeat.set(3.2, 22);
    this.legacyGroundTex.colorSpace = THREE.SRGBColorSpace;

    const loader = new THREE.TextureLoader();
    this.stormGroundTex = loader.load('./art/storm-path-albedo.webp');
    this.stormGroundTex.wrapS = this.stormGroundTex.wrapT = THREE.MirroredRepeatWrapping;
    this.stormGroundTex.repeat.set(2.5, 18);
    this.stormGroundTex.colorSpace = THREE.SRGBColorSpace;
    this.stormGroundTex.anisotropy = 4;
    this.stormHeightTex = loader.load('./art/storm-path-height.webp');
    this.stormHeightTex.wrapS = this.stormHeightTex.wrapT = THREE.MirroredRepeatWrapping;
    this.stormHeightTex.repeat.copy(this.stormGroundTex.repeat);
    this.stormHeightTex.colorSpace = THREE.NoColorSpace;
    this.stormHeightTex.anisotropy = 4;
    this.groundTex = this.stormGroundTex;

    const gmat = new THREE.MeshPhysicalMaterial({
      map: this.stormGroundTex,
      bumpMap: this.stormHeightTex,
      bumpScale: 0.13,
      roughness: 0.46,
      metalness: 0.12,
      clearcoat: 0.34,
      clearcoatRoughness: 0.32,
      color: 0x91a9ad,
    });
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 96), gmat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, 0, -36);
    this.ground.receiveShadow = true;
    this.group.add(this.ground);

    this.grassTex = grassTexture();
    this.grassTex.wrapS = this.grassTex.wrapT = THREE.RepeatWrapping;
    this.grassTex.repeat.set(3, 18);
    this.grassTex.colorSpace = THREE.SRGBColorSpace;
    const grassMat = new THREE.MeshStandardMaterial({
      map: this.grassTex,
      roughness: 0.78,
      metalness: 0.04,
      color: 0x183b3c,
    });
    this.grassL = new THREE.Mesh(new THREE.PlaneGeometry(18, 96), grassMat);
    this.grassL.rotation.x = -Math.PI / 2;
    this.grassL.position.set(-13.5, -0.04, -36);
    this.grassL.receiveShadow = true;
    this.grassR = this.grassL.clone();
    this.grassR.position.x = 13.5;
    this.group.add(this.grassL, this.grassR);

    for (const x of [-5.5, 5.5]) {
      const curbMat = new THREE.MeshStandardMaterial({
        color: 0x8f7841,
        roughness: 0.34,
        metalness: 0.66,
        emissive: 0x43330b,
        emissiveIntensity: 0.7,
      });
      this.curbMats.push(curbMat);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 96), curbMat);
      curb.position.set(x, 0.06, -36);
      this.group.add(curb);
    }
  }

  private buildProps(): void {
    for (let i = 0; i < 16; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const tree = makeTree(this.seed());
      const z = -6 - i * 4.2;
      tree.position.set(side * (7.2 + (this.seed() % 18) * 0.12), 0, z);
      tree.rotation.y = this.seed() * 0.2;
      this.group.add(tree);
      this.props.push({ mesh: tree, z, baseX: tree.position.x, kind: 'tree' });
    }
    for (let i = 0; i < 8; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const lantern = makeLantern();
      const z = -8 - i * 8.5;
      lantern.position.set(side * 5.35, 0, z);
      this.group.add(lantern);
      const light = new THREE.PointLight(0xffe8c8, 0, 10, 2);
      light.position.set(0, 2.15, 0);
      lantern.add(light);
      this.props.push({ mesh: lantern, z, baseX: lantern.position.x, kind: 'lantern', light });
    }
    for (let i = 0; i < 10; i++) {
      const rock = makeRock(this.seed());
      const z = -10 - i * 6.4;
      const side = i % 2 === 0 ? -1 : 1;
      rock.position.set(side * (6.1 + (this.seed() % 10) * 0.15), 0.08, z);
      this.group.add(rock);
      this.props.push({ mesh: rock, z, baseX: rock.position.x, kind: 'rock' });
    }
    for (let i = 0; i < 12; i++) {
      const fl = makeFlower(this.seed());
      const z = -5 - i * 5.5;
      const side = i % 2 === 0 ? -1 : 1;
      fl.position.set(side * (5.7 + (this.seed() % 8) * 0.1), 0, z);
      this.group.add(fl);
      this.props.push({ mesh: fl, z, baseX: fl.position.x, kind: 'flower' });
    }
    const crystalCount = this.phone ? 6 : 10;
    for (let i = 0; i < crystalCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const crystal = makeStormCrystal(this.seed());
      const z = -11 - i * (this.phone ? 10.5 : 7.2);
      crystal.position.set(side * (6.3 + (this.seed() % 9) * 0.16), 0, z);
      crystal.rotation.y = this.seed() * 0.17;
      this.group.add(crystal);
      this.props.push({ mesh: crystal, z, baseX: crystal.position.x, kind: 'crystal' });
    }
    const gateCount = this.phone ? 3 : 4;
    for (let i = 0; i < gateCount; i++) {
      const gate = makeStormGate(i);
      const z = -24 - i * 21;
      gate.position.set(0, 0, z);
      this.group.add(gate);
      this.props.push({ mesh: gate, z, baseX: 0, kind: 'gate' });
    }
    const sigilCount = this.phone ? 5 : 7;
    for (let i = 0; i < sigilCount; i++) {
      const sigil = makeRoadSigil(i);
      const z = -10 - i * 10.6;
      const x = ((i % 3) - 1) * 1.5;
      sigil.position.set(x, 0.035, z);
      this.group.add(sigil);
      this.props.push({ mesh: sigil, z, baseX: x, kind: 'sigil' });
    }
    const mistCount = this.phone ? 4 : 7;
    for (let i = 0; i < mistCount; i++) {
      const mist = makeMistCard();
      const z = -9 - i * 10.4;
      const x = (i % 2 === 0 ? -1 : 1) * (1.4 + (i % 3));
      mist.position.set(x, 0.72 + (i % 2) * 0.22, z);
      mist.scale.set(8 + (i % 3), 2.2 + (i % 2) * 0.5, 1);
      this.group.add(mist);
      this.mistCards.push(mist);
      this.props.push({ mesh: mist, z, baseX: x, kind: 'mist' });
    }
    this.attachLoaded();
  }

  private buildStormWeather(): void {
    const count = this.phone ? 140 : 320;
    this.rainPos = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const at = i * 6;
      const x = ((this.seed() % 2000) / 1000 - 1) * 14;
      const y = (this.seed() % 1800) / 100;
      const z = -3 - (this.seed() % 4200) / 100;
      this.rainPos[at] = x;
      this.rainPos[at + 1] = y;
      this.rainPos[at + 2] = z;
      this.rainPos[at + 3] = x - 0.1;
      this.rainPos[at + 4] = y - 0.85;
      this.rainPos[at + 5] = z + 0.18;
    }
    const geometry = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(this.rainPos, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', attr);
    this.rain = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: 0xa8eaff,
        transparent: true,
        opacity: this.phone ? 0.12 : 0.18,
        depthWrite: false,
        fog: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    this.rain.frustumCulled = false;
    this.group.add(this.rain);
  }

  attachLoaded(): void {
    if (this.treeInst && this.treeInst.parent !== this.group) this.group.add(this.treeInst);
    if (this.lampInst && this.lampInst.parent !== this.group) this.group.add(this.lampInst);
    if (!this.treeInst && hasModel('pine_tree')) {
      const trees = this.props.filter((p) => p.kind === 'tree');
      const inst = makeInstancedMesh('pine_tree', trees.length);
      if (inst) {
        trees.forEach((p, i) => {
          const h = 4 + (i % 7) * 0.5;
          p.visScale = fitHeight('pine_tree', h);
          p.rotY = p.mesh.rotation.y;
          p.inst = i;
          this.group.remove(p.mesh);
          disposeObject3D(p.mesh);
        });
        this.group.add(inst);
        this.treeInst = inst;
      }
    }
    if (!this.lampInst && hasModel('lamp')) {
      const lamps = this.props.filter((p) => p.kind === 'lantern');
      const inst = makeInstancedMesh('lamp', lamps.length);
      if (inst) {
        lamps.forEach((p, i) => {
          p.visScale = fitHeight('lamp', 2.5);
          p.rotY = 0;
          p.inst = i;
          const dummy = new THREE.Object3D();
          dummy.position.copy(p.mesh.position);
          if (p.light) dummy.add(p.light);
          this.group.remove(p.mesh);
          disposeObject3D(p.mesh);
          this.group.add(dummy);
          p.mesh = dummy;
        });
        this.group.add(inst);
        this.lampInst = inst;
      }
    }
    this.syncInstances();
    this.styleLoadedProps();
  }

  private styleLoadedProps(): void {
    const storm = this.stageId === 0;
    const apply = (inst: THREE.InstancedMesh | null, tint: number, roughness: number) => {
      if (!inst) return;
      const mats = Array.isArray(inst.material) ? inst.material : [inst.material];
      for (const raw of mats) {
        const mat = raw as THREE.MeshStandardMaterial;
        if (!mat?.isMeshStandardMaterial) continue;
        if (!mat.userData.baseColor) mat.userData.baseColor = mat.color.clone();
        mat.color.copy(mat.userData.baseColor as THREE.Color);
        if (storm) mat.color.multiply(new THREE.Color(tint));
        mat.roughness = roughness;
        mat.envMapIntensity = storm ? 1.25 : 0.8;
        mat.needsUpdate = true;
      }
    };
    apply(this.treeInst, 0x426b72, storm ? 0.72 : 0.84);
    apply(this.lampInst, 0xbca777, storm ? 0.38 : 0.52);
  }

  private syncInstances(): void {
    const dummy = this.instDummy;
    if (this.treeInst) {
      for (const p of this.props) {
        if (p.kind !== 'tree' || p.inst === undefined) continue;
        dummy.position.set(p.mesh.position.x, 0, p.z);
        dummy.rotation.set(0, p.rotY ?? 0, 0);
        dummy.scale.setScalar(p.visScale ?? 1);
        dummy.updateMatrix();
        this.treeInst.setMatrixAt(p.inst, dummy.matrix);
      }
      this.treeInst.instanceMatrix.needsUpdate = true;
    }
    if (this.lampInst) {
      for (const p of this.props) {
        if (p.kind !== 'lantern' || p.inst === undefined) continue;
        dummy.position.set(p.mesh.position.x, 0, p.z);
        dummy.rotation.set(0, p.rotY ?? 0, 0);
        dummy.scale.setScalar(p.visScale ?? 1);
        dummy.updateMatrix();
        this.lampInst.setMatrixAt(p.inst, dummy.matrix);
      }
      this.lampInst.instanceMatrix.needsUpdate = true;
    }
  }

  private buildForkVisual(): void {
    this.forkGroup.visible = false;
    this.group.add(this.forkGroup);
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf4d06a,
        emissive: 0xf4d06a,
        emissiveIntensity: 0.85,
        roughness: 0.35,
        metalness: 0.4,
        transparent: true,
        opacity: 0.92,
      });
      const strip = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.06, 16), mat);
      strip.position.set((i - 1) * LANE_X, 0.05, -4);
      this.forkGroup.add(strip);
      this.glowMarks.push(strip);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 4), mat);
      arrow.rotation.x = -Math.PI / 2;
      arrow.position.set(0, 0.2, 6.4);
      strip.add(arrow);
    }
  }

  private buildRangeAssist(): void {
    const a0 = Math.PI / 2 - 0.95;
    const aLen = 1.9;
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x7ee8ff,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const edgeMat = fillMat.clone();
    edgeMat.opacity = 0.55;
    this.rangeFill = new THREE.Mesh(
      new THREE.RingGeometry(1.05, SWORD_RANGE, 48, 1, a0, aLen),
      fillMat,
    );
    this.rangeFill.rotation.x = -Math.PI / 2;
    this.rangeFill.position.y = 0.05;
    this.rangeEdge = new THREE.Mesh(
      new THREE.RingGeometry(SWORD_RANGE - 0.1, SWORD_RANGE + 0.07, 48, 1, a0, aLen),
      edgeMat,
    );
    this.rangeEdge.rotation.x = -Math.PI / 2;
    this.rangeEdge.position.y = 0.052;
    const tickMat = fillMat.clone();
    tickMat.opacity = 0.42;
    for (const ang of [-0.72, 0, 0.72]) {
      const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.045, SWORD_RANGE - 1.2), tickMat);
      tick.rotation.x = -Math.PI / 2;
      tick.rotation.z = ang;
      const mid = (1.05 + SWORD_RANGE) * 0.5;
      tick.position.set(Math.sin(ang) * mid, 0.051, -Math.cos(ang) * mid);
      this.rangeAssist.add(tick);
    }
    this.rangeAssist.add(this.rangeFill, this.rangeEdge);
    this.rangeAssist.visible = false;
    this.rangeAssist.position.set(0, 0, 0.35);
    this.scene.add(this.rangeAssist);
  }

  private pulseRange(dt: number): void {
    if (!this.rangeAssist.visible) return;
    this.rangePulse += dt;
    const u = 0.5 + 0.5 * Math.sin(this.rangePulse * 4.1);
    const fill = this.rangeFill.material as THREE.MeshBasicMaterial;
    const edge = this.rangeEdge.material as THREE.MeshBasicMaterial;
    fill.opacity = 0.14 + u * 0.12;
    edge.opacity = 0.38 + u * 0.28;
    this.rangeAssist.scale.setScalar(1 + u * 0.035);
  }

  private seed(): number {
    this.rng = (this.rng * 16807) % 2147483647;
    return this.rng;
  }
}

function colorFor(id: RouteId): number {
  if (id === 'easy') return 0x6adf8a;
  if (id === 'hard') return 0xff6a5a;
  if (id === 'treasure') return 0xf0d27a;
  return 0x7ec8ff;
}

function cobbleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#4a3e32';
  ctx.fillRect(0, 0, 512, 512);
  let s = 1;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s % 1000) / 1000; };
  for (let row = 0; row < 14; row++) {
    const off = (row % 2) * 22;
    for (let col = -1; col < 12; col++) {
      const x = col * 46 + off + rnd() * 4;
      const y = row * 38 + rnd() * 3;
      const w = 38 + rnd() * 10;
      const h = 28 + rnd() * 8;
      const shade = 150 + rnd() * 50;
      ctx.fillStyle = `rgb(${shade + 12},${shade - 8},${shade - 28})`;
      roundRect(ctx, x, y, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,30,20,0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if (rnd() > 0.72) {
        ctx.fillStyle = 'rgba(70,120,50,0.22)';
        ctx.beginPath();
        ctx.arc(x + w * 0.4, y + h * 0.5, 5 + rnd() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function grassTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#3a8a38';
  ctx.fillRect(0, 0, 256, 256);
  let s = 9;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s % 1000) / 1000; };
  for (let i = 0; i < 900; i++) {
    ctx.strokeStyle = `rgba(${40 + rnd() * 40},${120 + rnd() * 80},${40 + rnd() * 30},${0.35 + rnd() * 0.4})`;
    ctx.lineWidth = 1;
    const x = rnd() * 256;
    const y = rnd() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 4, y - 6 - rnd() * 8);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function goldMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xd4b24a,
    roughness: 0.32,
    metalness: 0.78,
    emissive: 0x3a2808,
    emissiveIntensity: 0.2,
  });
}

function makeTree(seed: number): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.22, 1.35, 6),
    new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9, metalness: 0.02 }),
  );
  trunk.position.y = 0.67;
  trunk.castShadow = true;
  g.add(trunk);
  const greens = [0x2d8a44, 0x3e9a38, 0x247a3a, 0x4aaa48];
  const col = greens[seed % greens.length];
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.05 - i * 0.22, 1.35 - i * 0.12, 7),
      new THREE.MeshToonMaterial({ color: col }),
    );
    cone.position.y = 1.45 + i * 0.72;
    cone.castShadow = true;
    g.add(cone);
  }
  const gem = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), goldMat());
  gem.position.set(0.35, 2.1, 0.2);
  g.add(gem);
  const sh = blobShadow(1.1);
  g.add(sh);
  return g;
}

function makeLantern(): THREE.Group {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.85, metalness: 0.08 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.1, 6), wood);
  post.position.y = 1.05;
  g.add(post);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.07), goldMat());
  arm.position.set(0.28, 2.05, 0);
  g.add(arm);
  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.38, 0.32),
    new THREE.MeshStandardMaterial({
      color: 0xffe08a,
      emissive: 0xffb040,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
    }),
  );
  lamp.position.set(0.55, 1.78, 0);
  g.add(lamp);
  g.userData.lamp = lamp;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 4), goldMat());
  cap.position.copy(lamp.position);
  cap.position.y += 0.26;
  g.add(cap);
  g.add(blobShadow(0.35));
  return g;
}

function makeRock(seed: number): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.38 + (seed % 7) * 0.04, 0),
    new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 0.95, metalness: 0.05 }),
  );
  m.scale.set(1.2, 0.55 + (seed % 5) * 0.08, 0.9);
  m.castShadow = true;
  g.add(m);
  g.add(blobShadow(0.5));
  return g;
}

function makeFlower(seed: number): THREE.Group {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.025, 0.45, 4),
    new THREE.MeshStandardMaterial({ color: 0x3a8a38, roughness: 0.8 }),
  );
  stem.position.y = 0.22;
  g.add(stem);
  const cols = [0xffe08a, 0xff9ab0, 0xffffff, 0xf4d06a];
  const bloom = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 6, 6),
    new THREE.MeshStandardMaterial({ color: cols[seed % cols.length], emissive: cols[seed % cols.length], emissiveIntensity: 0.25, roughness: 0.5 }),
  );
  bloom.position.y = 0.48;
  g.add(bloom);
  return g;
}

function makeStormCrystal(seed: number): THREE.Group {
  const g = new THREE.Group();
  const h = 1.6 + (seed % 7) * 0.16;
  const outer = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.46, 0),
    new THREE.MeshPhysicalMaterial({
      color: 0x16485b,
      emissive: 0x0a708c,
      emissiveIntensity: 0.82,
      roughness: 0.2,
      metalness: 0.28,
      clearcoat: 0.72,
      clearcoatRoughness: 0.16,
      transparent: true,
      opacity: 0.9,
    }),
  );
  outer.scale.set(0.76 + (seed % 3) * 0.1, h, 0.72);
  outer.position.y = h * 0.44 + 0.22;
  outer.rotation.set((seed % 5) * 0.06, seed * 0.1, (seed % 4 - 2) * 0.06);
  outer.castShadow = true;
  g.add(outer);
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    new THREE.MeshBasicMaterial({
      color: seed % 3 === 0 ? 0xffd477 : 0x6fe8ff,
      transparent: true,
      opacity: 0.88,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  core.scale.y = h * 2.8;
  core.position.copy(outer.position);
  g.add(core);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.78, 0.24, 7),
    new THREE.MeshStandardMaterial({ color: 0x17232c, roughness: 0.82, metalness: 0.18 }),
  );
  base.position.y = 0.12;
  g.add(base);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.025, 6, 28),
    new THREE.MeshBasicMaterial({ color: 0xd5b35e, transparent: true, opacity: 0.58, toneMapped: false }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.25;
  g.add(halo, blobShadow(0.72));
  return g;
}

function makeStormGate(index: number): THREE.Group {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({
    color: index % 2 ? 0x1b2932 : 0x21313b,
    roughness: 0.76,
    metalness: 0.18,
    emissive: 0x061923,
    emissiveIntensity: 0.3,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xb79a55,
    emissive: 0x6d4f10,
    emissiveIntensity: 0.82,
    roughness: 0.3,
    metalness: 0.78,
  });
  for (const x of [-6.05, 6.05]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.72, 0.42, 8), stone);
    foot.position.set(x, 0.21, 0);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.38, 4.25, 8), stone);
    pillar.position.set(x, 2.45, 0);
    pillar.castShadow = true;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 6, 16), gold);
    band.rotation.x = Math.PI / 2;
    band.position.set(x, 3.75, 0);
    g.add(foot, pillar, band);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(13.25, 0.3, 0.52), stone);
  lintel.position.y = 4.56;
  lintel.castShadow = true;
  const crown = new THREE.Mesh(new THREE.BoxGeometry(12.25, 0.12, 0.68), gold);
  crown.position.y = 4.82;
  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), gold);
  crest.scale.y = 1.8;
  crest.position.y = 4.92;
  g.add(lintel, crown, crest);
  return g;
}

function makeRoadSigil(seed: number): THREE.Group {
  const g = new THREE.Group();
  const color = seed % 3 === 0 ? 0x78e8ff : 0xe2bd61;
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.43, 28), mat);
  ring.rotation.x = -Math.PI / 2;
  g.add(ring);
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const cx = Math.sin(a) * 0.64;
    const cz = Math.cos(a) * 0.64;
    points.push(
      new THREE.Vector3(cx - Math.sin(a) * 0.13, 0.006, cz - Math.cos(a) * 0.13),
      new THREE.Vector3(cx + Math.sin(a) * 0.13, 0.006, cz + Math.cos(a) * 0.13),
    );
  }
  const dashes = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  g.add(dashes);
  return g;
}

let mistMap: THREE.CanvasTexture | null = null;
function makeMistCard(): THREE.Sprite {
  if (!mistMap) {
    const c = document.createElement('canvas');
    c.width = 192;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(96, 32, 3, 96, 32, 94);
    grad.addColorStop(0, 'rgba(205,242,255,0.95)');
    grad.addColorStop(0.45, 'rgba(104,174,202,0.42)');
    grad.addColorStop(1, 'rgba(30,74,98,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    mistMap = new THREE.CanvasTexture(c);
    mistMap.colorSpace = THREE.SRGBColorSpace;
  }
  return new THREE.Sprite(new THREE.SpriteMaterial({
    map: mistMap,
    color: 0xa7ddec,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    fog: true,
    blending: THREE.AdditiveBlending,
  }));
}

function blobShadow(r: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 10),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  return m;
}
