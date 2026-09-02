import * as THREE from 'three';
import { LANE_X, ROUTES, SWORD_RANGE, type RouteId, type StageDef } from './types';
import { fitHeight, hasModel, makeInstancedMesh } from './models';

interface Prop {
  mesh: THREE.Object3D;
  z: number;
  baseX: number;
  kind: 'tree' | 'lantern' | 'rock' | 'flower';
  light?: THREE.PointLight;
  inst?: number;
  visScale?: number;
  rotY?: number;
}

export class World {
  readonly group = new THREE.Group();
  fogColor = new THREE.Color(0x9ecfff);
  private walk = 0;
  private groundTex!: THREE.CanvasTexture;
  private grassTex!: THREE.CanvasTexture;
  private ground!: THREE.Mesh;
  private grassL!: THREE.Mesh;
  private grassR!: THREE.Mesh;
  private skyMat!: THREE.ShaderMaterial;
  private backdrop!: THREE.Mesh;
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

  constructor(private scene: THREE.Scene, phone: boolean) {
    this.phone = phone;
    this.scene.add(this.group);
    this.buildSky();
    this.buildGround();
    this.buildLights();
    this.buildProps();
    this.buildForkVisual();
    this.buildRangeAssist();
    this.scene.fog = new THREE.Fog(this.fogColor, 14, 54);
  }

  applyStage(stage: StageDef): void {
    this.fogColor.setHex(stage.fog);
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(this.fogColor);
      this.scene.fog.near = 14;
      this.scene.fog.far = 54;
    }
    this.scene.background = this.fogColor.clone();
    this.skyMat.uniforms.top.value.setHex(stage.skyTop);
    this.skyMat.uniforms.bot.value.setHex(stage.skyBot);
    this.skyMat.uniforms.mid.value.copy(this.fogColor);
    this.hemi.color.setHex(stage.id === 2 ? stage.moon : 0xfff4ea);
    this.hemi.groundColor.setHex(stage.ground);
    this.sun.color.setHex(stage.id === 2 ? 0xffb080 : 0xfff2e4);
    this.sun.intensity = stage.id === 2 ? 1.55 : 1.25;
    const tint = stage.id === 1 ? 0xc8e8d4 : stage.id === 2 ? 0xffd0a0 : 0xffffff;
    (this.backdrop.material as THREE.MeshBasicMaterial).color.setHex(tint);
    this.ground.material = this.ground.material as THREE.MeshStandardMaterial;
    (this.ground.material as THREE.MeshStandardMaterial).color.setHex(stage.id === 2 ? 0xc4a078 : 0xd8c4a0);
  }

  update(dt: number, walking: boolean, speed = 1): void {
    const sp = walking ? speed : 0.38;
    this.walk += sp * dt;
    if (this.groundTex) this.groundTex.offset.y = (this.walk * 0.22) % 1;
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
      },
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
        void main(){
          float h = vP.y;
          vec3 c = mix(bot, mid, smoothstep(-0.28, 0.1, h));
          c = mix(c, top, smoothstep(0.08, 0.82, h));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 16), this.skyMat);
    this.group.add(sky);

    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff0c0, fog: false, toneMapped: false }),
    );
    sunOrb.position.set(18, 22, -40);
    this.group.add(sunOrb);

    const loader = new THREE.TextureLoader();
    const tex = loader.load('./art/world-path.jpg');
    tex.colorSpace = THREE.SRGBColorSpace;
    const bd = new THREE.Mesh(
      new THREE.PlaneGeometry(78, 42),
      new THREE.MeshBasicMaterial({ map: tex, fog: true, transparent: true, opacity: 0.72 }),
    );
    bd.position.set(0, 11, -48);
    this.backdrop = bd;
    this.group.add(bd);
  }

  private buildGround(): void {
    this.groundTex = cobbleTexture();
    this.groundTex.wrapS = this.groundTex.wrapT = THREE.RepeatWrapping;
    this.groundTex.repeat.set(3.2, 22);
    this.groundTex.colorSpace = THREE.SRGBColorSpace;
    const gmat = new THREE.MeshStandardMaterial({
      map: this.groundTex,
      roughness: 0.82,
      metalness: 0.04,
      color: 0xd8c4a0,
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
      roughness: 0.9,
      metalness: 0,
      color: 0x6aaa48,
    });
    this.grassL = new THREE.Mesh(new THREE.PlaneGeometry(18, 96), grassMat);
    this.grassL.rotation.x = -Math.PI / 2;
    this.grassL.position.set(-13.5, -0.04, -36);
    this.grassL.receiveShadow = true;
    this.grassR = this.grassL.clone();
    this.grassR.position.x = 13.5;
    this.group.add(this.grassL, this.grassR);

    const curbMat = new THREE.MeshStandardMaterial({ color: 0xc9a44a, roughness: 0.45, metalness: 0.35, emissive: 0x3a2a08, emissiveIntensity: 0.25 });
    for (const x of [-5.5, 5.5]) {
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
    this.attachLoaded();
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
          this.group.add(dummy);
          p.mesh = dummy;
        });
        this.group.add(inst);
        this.lampInst = inst;
      }
    }
    this.syncInstances();
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

function blobShadow(r: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 10),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  return m;
}
