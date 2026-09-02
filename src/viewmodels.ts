import * as THREE from 'three';
import { CHARACTERS, type CharId } from './types';
import { cloneModel, findMesh, hasModel } from './models';

export class Viewmodels {
  readonly group = new THREE.Group();
  private sword = new THREE.Group();
  private gun = new THREE.Group();
  private staff = new THREE.Group();
  private swordProc = new THREE.Group();
  private gunProc = new THREE.Group();
  private staffProc = new THREE.Group();
  private swordGlb: THREE.Group | null = null;
  private gunGlb: THREE.Group | null = null;
  private staffGlb: THREE.Group | null = null;
  private active: CharId = 'sword';
  private swing = 0;
  private kick = 0;
  private charge = 0;
  private bobT = 0;
  private layer: HTMLElement | null;
  private wrap: HTMLElement | null;
  private img: HTMLImageElement | null;
  private flash: HTMLElement | null;
  private glow: HTMLElement | null;
  private portrait: HTMLImageElement | null;
  private gemLight: THREE.PointLight;
  private gem: THREE.Mesh | null = null;
  private gemBaseEi = 0.8;
  private after: THREE.Group;
  private iframe = 0;
  private powerGlow = 0;
  private powerAtk = 0;

  constructor(camera: THREE.Camera) {
    this.layer = document.getElementById('weapon-layer');
    this.wrap = document.getElementById('weapon-wrap');
    this.img = document.getElementById('weapon-art') as HTMLImageElement | null;
    this.flash = document.getElementById('muzzle-flash');
    this.glow = document.getElementById('staff-glow');
    this.portrait = document.getElementById('party-portrait') as HTMLImageElement | null;
    this.buildSword();
    this.buildGun();
    this.buildStaff();
    this.sword.add(this.swordProc);
    this.gun.add(this.gunProc);
    this.staff.add(this.staffProc);
    this.group.add(this.sword, this.gun, this.staff);
    this.after = new THREE.Group();
    this.after.visible = false;
    this.group.add(this.after);
    this.rebuildAfter();
    this.gemLight = new THREE.PointLight(0x88e0ff, 0, 2.4, 2);
    this.group.add(this.gemLight);
    this.gem = (this.staffProc.userData.gem as THREE.Mesh) ?? null;
    camera.add(this.group);
    this.group.position.set(0.28, -0.28, -0.62);
    this.show('sword');
    this.attachLoaded();
  }

  attachLoaded(): void {
    let changed = false;
    // QA: frost_blade cut punches through title/char FP view. Keep procedural until modeler recuts.
    if (this.swordGlb) {
      this.sword.remove(this.swordGlb);
      this.swordGlb = null;
      this.swordProc.visible = true;
      changed = true;
    }
    if (!this.gunGlb && hasModel('flame_pistol')) {
      const model = cloneModel('flame_pistol');
      if (model) {
        const wrap = new THREE.Group();
        // origin at grip, barrel +Z. Camera looks -Z: yaw PI, pitch up so body+barrel sit in view.
        wrap.rotation.set(-0.38, Math.PI, 0.1);
        wrap.scale.setScalar(1.55);
        wrap.position.set(0.04, 0.24, -0.02);
        wrap.add(model);
        this.gunGlb = wrap;
        this.gun.add(wrap);
        this.gunProc.visible = false;
        changed = true;
      }
    }
    if (!this.staffGlb && hasModel('azure_staff')) {
      const model = cloneModel('azure_staff');
      if (model) {
        const wrap = new THREE.Group();
        wrap.scale.setScalar(0.46);
        wrap.position.y = -0.06;
        wrap.add(model);
        this.staffGlb = wrap;
        this.staff.add(wrap);
        this.staffProc.visible = false;
        const crystal = findMesh(model, 'Crystal');
        if (crystal) {
          this.gem = crystal;
          const mat = crystal.material as THREE.MeshStandardMaterial;
          if (mat && 'emissiveIntensity' in mat) this.gemBaseEi = mat.emissiveIntensity;
        }
        changed = true;
      }
    }
    if (changed) this.rebuildAfter();
  }

  show(id: CharId): void {
    this.active = id;
    this.sword.visible = id === 'sword';
    this.gun.visible = id === 'gun';
    this.staff.visible = id === 'mage';
    if (this.wrap) {
      this.wrap.dataset.char = id;
      this.wrap.classList.remove('sword', 'gun', 'mage');
      this.wrap.classList.add(id === 'mage' ? 'mage' : id);
    }
    if (this.img) {
      this.img.removeAttribute('src');
      this.img.alt = '';
      this.img.style.display = 'none';
    }
    const def = CHARACTERS.find((c) => c.id === id);
    if (this.portrait && def) this.portrait.src = def.art;
  }

  setVisible(on: boolean): void {
    this.group.visible = on;
    this.layer?.classList.toggle('hidden', !on);
  }

  slash(dx: number, dy: number, crit: boolean): void {
    this.swing = crit ? 1 : 0.72;
    this.wrap?.style.setProperty('--sx', String(dx >= 0 ? 1 : -1));
    this.wrap?.style.setProperty('--sy', String(dy >= 0 ? 1 : -1));
    this.restart('swing');
  }

  shoot(): void {
    this.kick = 1;
    this.restart('kick');
  }

  setCharge(t: number): void {
    const was = this.charge;
    this.charge = t;
    this.wrap?.classList.toggle('charging', t > 0.02);
    this.glow?.classList.toggle('charged', t >= 1);
    if (this.glow) {
      this.glow.style.opacity = t > 0.02 ? String(0.28 + t * 0.72) : '0';
      this.glow.style.transform = `scale(${0.5 + t * 1.05})`;
    }
    this.gemLight.intensity = t * 2.2;
    if (this.gem) {
      const mat = this.gem.material as THREE.MeshStandardMaterial;
      if (mat && 'emissiveIntensity' in mat) {
        if (t > 0.02) {
          mat.emissive.setHex(0x7ee0ff);
          mat.emissiveIntensity = this.gemBaseEi + t * 2.4;
        } else {
          mat.emissiveIntensity = this.gemBaseEi;
        }
      }
    }
    if (was > 0.15 && t <= 0) this.restart('cast');
  }

  setIframe(t: number): void {
    this.iframe = t;
  }

  setPowerGlow(atk: number, speed: number): void {
    this.powerAtk = atk;
    this.powerGlow = 1;
    this.wrap?.classList.toggle('powered', atk > 0 || speed > 0);
    this.wrap?.style.setProperty('--atk', String(atk));
  }

  flashUlt(): void {
    this.restart('ult');
    this.powerGlow = 1.2;
  }

  update(dt: number, bob: number): void {
    if ((!this.swordGlb && hasModel('frost_blade')) ||
        (!this.gunGlb && hasModel('flame_pistol')) ||
        (!this.staffGlb && hasModel('azure_staff'))) {
      this.attachLoaded();
    }
    this.bobT += dt;
    this.swing = Math.max(0, this.swing - dt * 4.6);
    this.kick = Math.max(0, this.kick - dt * 8);
    this.iframe = Math.max(0, this.iframe - dt);
    this.powerGlow = Math.max(0, this.powerGlow - dt * 1.6);
    if (this.swing <= 0) this.wrap?.classList.remove('swing');
    if (this.kick <= 0) this.wrap?.classList.remove('kick');
    const idleY = Math.sin(this.bobT * 2.2) * 0.012 + bob * 0.01;
    const idleR = Math.sin(this.bobT * 1.6) * 0.03;
    this.group.position.y = -0.28 + idleY;
    this.group.rotation.z = idleR * 0.4;
    if (this.powerGlow > 0.05) {
      this.gemLight.intensity = Math.max(this.gemLight.intensity, this.powerGlow * (0.6 + this.powerAtk * 0.5));
      this.gemLight.color.setHex(this.powerAtk >= 3 ? 0xffe08a : this.powerAtk >= 1 ? 0xff6a6a : 0x88e0ff);
    }

    this.sword.rotation.set(0, 0, 0);
    this.sword.position.set(0.12, -0.02, 0);
    if (this.swing > 0) {
      const u = 1 - this.swing;
      this.sword.rotation.z = Math.sin(u * Math.PI) * -1.35;
      this.sword.rotation.y = Math.sin(u * Math.PI) * 0.55;
      this.sword.position.x = 0.12 + Math.sin(u * Math.PI) * -0.22;
      this.sword.position.y = -0.02 + Math.sin(u * Math.PI) * 0.18;
    }

    this.gun.rotation.set(0, 0.12, 0);
    this.gun.position.set(0.08, -0.06, 0.04);
    if (this.kick > 0) {
      this.gun.position.z += this.kick * 0.12;
      this.gun.rotation.x = -this.kick * 0.22;
    }

    this.staff.rotation.set(0.15, -0.08, 0.12);
    this.staff.position.set(0.1, -0.04, 0);
    if (this.charge > 0) {
      this.staff.rotation.x = 0.15 - this.charge * 0.2;
      this.staff.position.z = -this.charge * 0.08;
    }

    this.after.visible = this.iframe > 0;
    if (this.after.visible) {
      this.after.position.set(-0.08, 0.02, 0.04);
    }
  }

  private restart(cls: string): void {
    if (!this.wrap) return;
    this.wrap.classList.remove(cls);
    void this.wrap.offsetWidth;
    this.wrap.classList.add(cls);
  }

  private rebuildAfter(): void {
    this.group.remove(this.after);
    const ghost = new THREE.Group();
    for (const part of [this.sword, this.gun, this.staff]) {
      const c = part.clone(true);
      ghost.add(c);
    }
    ghost.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        });
      }
    });
    ghost.visible = false;
    this.after = ghost;
    this.group.add(this.after);
  }

  private buildSword(): void {
    const steel = new THREE.MeshStandardMaterial({
      color: 0xd8e8f8,
      roughness: 0.22,
      metalness: 0.92,
      emissive: 0x102030,
      emissiveIntensity: 0.15,
    });
    const gold = metalGold();
    const wrap = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.7, metalness: 0.1 });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.065, 1.18, 0.016), steel);
    blade.position.set(0, 0.62, 0);
    const taper = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.22, 4), steel);
    taper.position.set(0, 1.28, 0);
    const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.9, 0.018), gold);
    fuller.position.set(0, 0.58, 0);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.08), gold);
    guard.position.y = 0.06;
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), gold);
    wingL.position.set(-0.22, 0.08, 0);
    wingL.rotation.z = 0.4;
    const wingR = wingL.clone();
    wingR.position.x = 0.22;
    wingR.rotation.z = -0.4;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.28, 8), wrap);
    grip.position.y = -0.1;
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), gold);
    pommel.position.y = -0.26;
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.032),
      new THREE.MeshStandardMaterial({ color: 0x7ee0ff, emissive: 0x3aa0ff, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.3 }),
    );
    gem.position.y = -0.26;
    this.swordProc.add(blade, taper, fuller, guard, wingL, wingR, grip, pommel, gem);
    this.sword.rotation.z = -0.35;
  }

  private buildGun(): void {
    const iron = new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.35, metalness: 0.75 });
    const gold = metalGold();
    const wood = new THREE.MeshStandardMaterial({ color: 0x5a2a18, roughness: 0.7, metalness: 0.08 });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.72, 10), iron);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.06, -0.22);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.22, 10), gold);
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.set(0, 0.06, -0.08);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.28), iron);
    body.position.set(0, 0.02, 0.12);
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(0.102, 0.04, 0.22), gold);
    inlay.position.set(0, 0.05, 0.12);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.1), wood);
    grip.position.set(0, -0.14, 0.18);
    grip.rotation.x = 0.25;
    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.06), gold);
    hammer.position.set(0, 0.12, 0.2);
    const muzzle = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.012, 6, 10),
      gold,
    );
    muzzle.position.set(0, 0.06, -0.58);
    this.gunProc.add(barrel, sleeve, body, inlay, grip, hammer, muzzle);
  }

  private buildStaff(): void {
    const wood = new THREE.MeshStandardMaterial({ color: 0x3a2450, roughness: 0.55, metalness: 0.15 });
    const gold = metalGold();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 1.35, 8), wood);
    shaft.position.y = 0.35;
    this.staffProc.add(shaft);
    for (const y of [0.1, 0.55, 0.95]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 10), gold);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      this.staffProc.add(ring);
    }
    const cup = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 6), gold);
    cup.position.y = 1.08;
    cup.rotation.x = Math.PI;
    this.staffProc.add(cup);
    const gem = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1, 0),
      new THREE.MeshStandardMaterial({
        color: 0xb8f0ff,
        emissive: 0x7ee0ff,
        emissiveIntensity: 0.8,
        roughness: 0.18,
        metalness: 0.35,
        transparent: true,
        opacity: 0.95,
      }),
    );
    gem.position.y = 1.2;
    this.staffProc.add(gem);
    this.staffProc.userData.gem = gem;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 16), gold);
    halo.position.y = 1.2;
    this.staffProc.add(halo);
  }
}

function metalGold(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xe0c25a,
    roughness: 0.28,
    metalness: 0.85,
    emissive: 0x4a3408,
    emissiveIntensity: 0.22,
  });
}
