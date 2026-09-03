import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CharId, StageId } from './types';

export type ModelId =
  | 'frost_blade'
  | 'flame_pistol'
  | 'azure_staff'
  | 'slime_king'
  | 'ghost_king'
  | 'demon_king'
  | 'slime'
  | 'ghost'
  | 'beetle'
  | 'pumpkin'
  | 'pine_tree'
  | 'lamp'
  | 'chest'
  | 'heart_crystal'
  | 'gel_shield'
  | 'demon_lieutenant'
  | 'goblin';

export const MODEL_URLS: Record<ModelId, string> = {
  frost_blade: './models/frost_blade.glb',
  flame_pistol: './models/flame_pistol.glb',
  azure_staff: './models/azure_staff.glb',
  slime_king: './models/slime_king.glb',
  ghost_king: './models/ghost_king.glb',
  demon_king: './models/demon_king.glb',
  slime: './models/slime.glb',
  ghost: './models/ghost.glb',
  beetle: './models/beetle.glb',
  pumpkin: './models/pumpkin.glb',
  pine_tree: './models/pine_tree.glb',
  lamp: './models/lamp.glb',
  chest: './models/chest.glb',
  heart_crystal: './models/heart_crystal.glb',
  gel_shield: './models/gel_shield.glb',
  demon_lieutenant: './models/demon_lieutenant.glb',
  goblin: './models/goblin.glb',
};

export const MODEL_HEIGHTS: Partial<Record<ModelId, number>> = {
  slime_king: 2.4,
  ghost_king: 2.8,
  demon_king: 3.2,
  slime: 0.9,
  ghost: 1.2,
  beetle: 0.8,
  pumpkin: 0.9,
  lamp: 2.5,
  chest: 0.5,
  heart_crystal: 0.35,
  gel_shield: 1.7,
  demon_lieutenant: 2.0,
  goblin: 1.25,
};

const cache = new Map<ModelId, THREE.Group>();
const heightCache = new Map<ModelId, number>();
const modelLoads = new Map<ModelId, Promise<void>>();
const loader = new GLTFLoader();
const loaderReady = Promise.resolve(MeshoptDecoder.ready as Promise<unknown>)
  .catch(() => undefined)
  .then(() => {
    try {
      loader.setMeshoptDecoder(MeshoptDecoder);
    } catch (err) {
      console.warn('meshopt decoder unavailable', err);
    }
  });
const _box = new THREE.Box3();

const CHARACTER_MODELS: Record<CharId, ModelId[]> = {
  sword: ['frost_blade'],
  gun: ['flame_pistol'],
  mage: ['azure_staff'],
};

const STAGE_MODELS: Record<StageId, ModelId[]> = {
  0: ['slime', 'ghost', 'beetle', 'pumpkin', 'gel_shield', 'slime_king', 'goblin', 'heart_crystal', 'chest'],
  1: ['slime', 'ghost', 'beetle', 'pumpkin', 'ghost_king', 'goblin', 'heart_crystal', 'chest'],
  2: ['slime', 'ghost', 'beetle', 'pumpkin', 'demon_lieutenant', 'demon_king', 'goblin', 'heart_crystal', 'chest'],
};

function prepare(root: THREE.Object3D, id?: ModelId): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geo = mesh.geometry;
    if (geo && !geo.getAttribute('normal')) geo.computeVertexNormals();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    let wantsTangent = false;
    for (const raw of mats) {
      const mat = raw as THREE.MeshStandardMaterial;
      if (!mat) continue;
      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.anisotropy = 4;
      }
      if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      if (mat.normalMap) wantsTangent = true;
      if (!mat.isMeshStandardMaterial) continue;

      const materialName = `${mesh.name} ${mat.name}`.toLowerCase();
      mat.envMapIntensity = 1.15;

      if (materialName.includes('metal')) {
        mat.metalness = 0.84;
        mat.roughness = 0.26;
        mat.envMapIntensity = 1.65;
      } else if (materialName.includes('glow')) {
        mat.metalness = 0.22;
        mat.roughness = 0.18;
        mat.emissive.setHex(id === 'frost_blade' ? 0x63dfff : 0x52d6d0);
        mat.emissiveIntensity = id === 'frost_blade' ? 2.35 : 1.35;
        mat.toneMapped = false;
      } else if (id === 'slime' || id === 'slime_king' || id === 'gel_shield') {
        mat.metalness = 0.06;
        mat.roughness = 0.3;
        mat.envMapIntensity = 1.4;
        mat.emissive.setHex(id === 'slime_king' ? 0x123b45 : 0x082f30);
        mat.emissiveIntensity = id === 'slime_king' ? 0.42 : 0.22;
      } else if (id === 'goblin') {
        mat.metalness = Math.min(mat.metalness, 0.16);
        mat.roughness = 0.58;
        mat.envMapIntensity = 1.05;
      } else {
        mat.roughness = THREE.MathUtils.clamp(mat.roughness, 0.32, 0.78);
      }
      mat.needsUpdate = true;
    }
    if (
      wantsTangent &&
      geo &&
      !geo.getAttribute('tangent') &&
      geo.getAttribute('uv') &&
      geo.index
    ) {
      try {
        geo.computeTangents();
      } catch {
        /* missing uv/index */
      }
    }
    mesh.castShadow = true;
    mesh.frustumCulled = true;
    if (geo) {
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
    }
  });
}

function measureHeight(root: THREE.Object3D): number {
  _box.setFromObject(root);
  const h = _box.max.y - _box.min.y;
  return h > 1e-4 ? h : 1;
}

export function hasModel(id: ModelId): boolean {
  return cache.has(id);
}

export function cloneModel(id: ModelId): THREE.Group | null {
  const src = cache.get(id);
  if (!src) return null;
  const g = src.clone(true) as THREE.Group;
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    // Geometry comes from the persistent model cache. Instance cleanup may
    // dispose cloned materials, but must leave this shared geometry intact.
    mesh.userData.sharedModelGeometry = true;
    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((m) => m.clone());
    else if (mesh.material) mesh.material = (mesh.material as THREE.Material).clone();
  });
  return g;
}

export function modelHeight(id: ModelId): number {
  const hit = heightCache.get(id);
  if (hit !== undefined) return hit;
  const src = cache.get(id);
  if (!src) return 1;
  const h = measureHeight(src);
  heightCache.set(id, h);
  return h;
}

export function fitHeight(id: ModelId, targetHeight: number): number {
  return targetHeight / modelHeight(id);
}

export function cloneFitted(id: ModelId, targetHeight: number): { model: THREE.Group; scale: number } | null {
  const model = cloneModel(id);
  if (!model) return null;
  let scale = fitHeight(id, targetHeight);
  if (!Number.isFinite(scale)) scale = 1;
  scale = Math.min(4, Math.max(0.05, scale));
  return { model, scale };
}

function findNamed(root: THREE.Object3D, name: string): THREE.Mesh | null {
  let hit: THREE.Mesh | null = null;
  root.traverse((o) => {
    if (hit) return;
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.name === name) hit = mesh;
  });
  return hit;
}

export function findMesh(root: THREE.Object3D, name: string): THREE.Mesh | null {
  return findNamed(root, name);
}

export function firstMesh(root: THREE.Object3D): THREE.Mesh | null {
  let hit: THREE.Mesh | null = null;
  root.traverse((o) => {
    if (hit) return;
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) hit = mesh;
  });
  return hit;
}

export function makeInstancedMesh(id: ModelId, count: number): THREE.InstancedMesh | null {
  const src = cache.get(id);
  if (!src || count < 1) return null;
  src.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  src.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) meshes.push(m);
  });
  if (meshes.length === 0) return null;
  const geos: THREE.BufferGeometry[] = [];
  for (const m of meshes) {
    const g = m.geometry.clone();
    m.updateWorldMatrix(true, false);
    g.applyMatrix4(m.matrixWorld);
    geos.push(g);
  }
  let geo: THREE.BufferGeometry = geos[0];
  if (geos.length > 1) {
    try {
      const merged = mergeGeometries(geos, false);
      if (merged) {
        for (const g of geos) g.dispose();
        geo = merged;
      }
    } catch {
      for (const g of geos.slice(1)) g.dispose();
    }
  }
  const raw = meshes[0].material;
  const matSrc = Array.isArray(raw) ? raw[0] : raw;
  const mat = (matSrc as THREE.Material).clone();
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.castShadow = true;
  inst.frustumCulled = false;
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return inst;
}

function loadModel(id: ModelId): Promise<void> {
  if (cache.has(id)) return Promise.resolve();
  const pending = modelLoads.get(id);
  if (pending) return pending;
  const job = loaderReady.then(
    () => new Promise<void>((resolve) => {
      loader.load(
        MODEL_URLS[id],
        (gltf) => {
          prepare(gltf.scene, id);
          cache.set(id, gltf.scene);
          heightCache.set(id, measureHeight(gltf.scene));
          resolve();
        },
        undefined,
        (err) => {
          // Permit a later stage selection or retry to attempt this asset again.
          modelLoads.delete(id);
          console.warn('GLB load failed', id, err);
          resolve();
        },
      );
    }),
  );
  modelLoads.set(id, job);
  return job;
}

export function preloadModels(ids: ModelId[] = Object.keys(MODEL_URLS) as ModelId[]): Promise<void> {
  return Promise.all(ids.map(loadModel)).then(() => undefined);
}

export function preloadWorldModels(): Promise<void> {
  return preloadModels(['pine_tree', 'lamp', 'slime', 'heart_crystal', 'chest']);
}

export function preloadCharacterModels(id: CharId): Promise<void> {
  return preloadModels(CHARACTER_MODELS[id]);
}

export function preloadStageModels(id: StageId): Promise<void> {
  return preloadModels(STAGE_MODELS[id]);
}

/** Release transient scene objects without invalidating geometry kept in the model cache. */
export function disposeObject3D(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((node) => {
    const renderable = node as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
      userData: Record<string, unknown>;
    };
    if (renderable.geometry && !renderable.userData.sharedModelGeometry && !geometries.has(renderable.geometry)) {
      geometries.add(renderable.geometry);
      renderable.geometry.dispose();
    }
    const list = Array.isArray(renderable.material) ? renderable.material : renderable.material ? [renderable.material] : [];
    for (const material of list) {
      if (materials.has(material)) continue;
      materials.add(material);
      // Textures are shared by the persistent GLB/sprite caches; material.dispose()
      // releases only the transient GPU program state and leaves those maps reusable.
      material.dispose();
    }
  });
}
