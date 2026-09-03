import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const unityRoot = path.join(root, 'unity', 'BladeWalkerRemake');
const runtimeRoot = path.join(unityRoot, 'Assets', 'BladeWalker', 'Runtime');
const failures = [];
const ok = (condition, message) => {
  if (!condition) failures.push(message);
};

async function walk(directory, suffix) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(target, suffix));
    else if (!suffix || target.endsWith(suffix)) result.push(target);
  }
  return result;
}

function stripCommentsAndStrings(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/@?"(?:""|\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])'/g, "''");
}

function balanced(source, open, close) {
  let depth = 0;
  for (const character of stripCommentsAndStrings(source)) {
    if (character === open) depth++;
    else if (character === close) depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

const csFiles = await walk(runtimeRoot, '.cs');
const sources = new Map(await Promise.all(csFiles.map(async (file) => [file, await readFile(file, 'utf8')])));
const allSource = [...sources.values()].join('\n');

ok(csFiles.length >= 12, `Unity runtime scripts are incomplete (${csFiles.length})`);
for (const [file, source] of sources) {
  ok(balanced(source, '{', '}'), `Unbalanced braces: ${path.relative(root, file)}`);
  ok(balanced(source, '(', ')'), `Unbalanced parentheses: ${path.relative(root, file)}`);
  ok(source.includes('namespace BladeWalker.Remake'), `Unexpected namespace: ${path.relative(root, file)}`);
}

const routeSource = await readFile(path.join(runtimeRoot, 'World', 'RouteSpline.cs'), 'utf8');
const motorSource = await readFile(path.join(runtimeRoot, 'World', 'PlayerRouteMotor.cs'), 'utf8');
const encounterSource = await readFile(path.join(runtimeRoot, 'Combat', 'EncounterDirector.cs'), 'utf8');
const enemySource = await readFile(path.join(runtimeRoot, 'Combat', 'EnemyMotor.cs'), 'utf8');
const qualitySource = await readFile(path.join(runtimeRoot, 'Presentation', 'QualityDirector.cs'), 'utf8');
const packageManifest = JSON.parse(await readFile(path.join(unityRoot, 'Packages', 'manifest.json'), 'utf8'));

function segmentPoints(segmentId) {
  const match = routeSource.match(new RegExp(`new RouteSpline\\(\\s*"${segmentId}",([\\s\\S]*?)\\)\\);`));
  if (!match) return [];
  return [...match[1].matchAll(/new Vector3\((-?[\d.]+)f,\s*(-?[\d.]+)f,\s*(-?[\d.]+)f\)/g)]
    .map((point) => point.slice(1).map(Number));
}

function exitYaw(points) {
  if (points.length < 4) return 0;
  const previous = points[points.length - 2];
  const end = points[points.length - 1];
  return Math.atan2(end[0] - previous[0], end[2] - previous[2]) * 180 / Math.PI;
}

ok(routeSource.includes('DistanceToT') && routeSource.includes('_arcLengths'), 'Route movement must use arc-length lookup');
ok(routeSource.includes('left_shrine') && routeSource.includes('right_ruins'), 'Route graph must include distinct left/right world paths');
ok(routeSource.includes('new Vector3(-18f') && routeSource.includes('new Vector3(18f'), 'Branches must diverge spatially, not just shake the camera');
ok(routeSource.includes('new Vector3(-44f') && routeSource.includes('new Vector3(44f'), 'Branches must execute a clearly visible world-space turn');
const leftYaw = exitYaw(segmentPoints('left_shrine'));
const rightYaw = exitYaw(segmentPoints('right_ruins'));
ok(leftYaw < -55 && rightYaw > 55, `Branch heading change is too subtle (${leftYaw.toFixed(1)}°, ${rightYaw.toFixed(1)}°)`);
ok(motorSource.includes('_lateral + steer * lateralSpeed'), 'Player must use continuous lateral movement');
ok(!/Mathf\.(Round|RoundToInt)\s*\(\s*_lateral/.test(motorSource), 'Player lateral position must not snap to lanes');
ok(motorSource.includes('Quaternion.LookRotation(_frame.Forward'), 'Player heading must follow the actual route tangent');

for (const locomotion of ['GroundStalker', 'Hopper', 'Flyer', 'Flanker', 'Artillery', 'SlimeKing']) {
  ok(enemySource.includes(locomotion), `Missing enemy locomotion: ${locomotion}`);
}
ok(enemySource.includes('Mathf.Sin(hop * Mathf.PI) * 3.2f'), 'Hopper must have an actual vertical arc');
ok(enemySource.includes('Vector3.up * (4.4f - dive'), 'Flyer must occupy and change altitude');
ok(encounterSource.includes('Aerial wing') && encounterSource.includes('Pincer'), 'Encounter director must mix aerial and flanking formations');
ok((encounterSource.match(/SpawnAhead\(/g) ?? []).length >= 12, 'Encounter formations need staggered multi-position spawns');

ok(packageManifest.dependencies['com.unity.render-pipelines.universal']?.startsWith('17.'), 'Unity 6 project must use URP 17');
ok(qualitySource.includes('Bloom') && qualitySource.includes('TonemappingMode.ACES'), 'URP presentation must include bloom and ACES tonemapping');
ok(allSource.includes('Boss_CrystalSlimeKing'), 'Vertical slice must include the Crystal Slime King arena');
ok(allSource.includes('Resources.Load<GameObject>("Production/Heroes/Baishuang")'), 'Production hero must replace its proxy without gameplay rewrites');
ok(allSource.includes('Production/Enemies/'), 'Production enemies must replace proxies through stable resource paths');

if (failures.length) {
  console.error(`Unity remake verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Unity remake verification passed: ${csFiles.length} runtime scripts, continuous route, true branches, 6 locomotion modes, URP post FX.`);
}
