import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
let preloadOnce: Promise<void> | null = null;
const _box = new THREE.Box3();

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
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      if (mat.normalMap) wantsTangent = true;
      if (id === 'slime' && mat.emissive) {
        mat.emissive.set(0, 0, 0);
        mat.emissiveIntensity = 0;
      }
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

export function preloadModels(): Promise<void> {
  if (preloadOnce) return preloadOnce;
  const loader = new GLTFLoader();
  const ids = Object.keys(MODEL_URLS) as ModelId[];
  preloadOnce = Promise.resolve(MeshoptDecoder.ready as Promise<unknown>)
    .catch(() => undefined)
    .then(() => {
      try {
        loader.setMeshoptDecoder(MeshoptDecoder);
      } catch (err) {
        console.warn('meshopt decoder unavailable', err);
      }
      return Promise.all(
        ids.map(
          (id) =>
            new Promise<void>((resolve) => {
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
                  console.warn('GLB load failed', id, err);
                  resolve();
                },
              );
            }),
        ),
      ).then(() => undefined);
    });
  return preloadOnce;
}
