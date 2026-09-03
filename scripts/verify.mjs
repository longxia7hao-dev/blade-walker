import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const index = await readFile(path.join(root, 'index.html'), 'utf8');
const styles = await readFile(path.join(root, 'src', 'style.css'), 'utf8');

const failures = [];
const ok = (condition, message) => {
  if (!condition) failures.push(message);
};

async function walk(dir, suffix) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(target, suffix));
    else if (!suffix || target.endsWith(suffix)) result.push(target);
  }
  return result;
}

const sourceFiles = await walk(path.join(root, 'src'), '.ts');
const sourceText = (await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))).join('\n');

const rules = await import(pathToFileURL(path.join(root, 'src', 'types.ts')).href);
ok(rules.CHARACTERS.length === 3, '可玩角色定義應維持三名');
ok(rules.STAGES.length === 3, '可玩關卡定義應維持三關');
ok(rules.laneOf(-0.87) === -1 && rules.laneOf(0) === 0 && rules.laneOf(0.87) === 1, 'laneOf 邊界判定異常');
ok(rules.easiestRoute(['hard', 'normal', 'easy']) === 'easy', '岔路逾時未選到最低威脅路線');
ok(rules.goblinSpawnChance(0, 0.2, 'hard') === 0, '哥布林不應出現在第一關前段');
ok(rules.goblinSpawnChance(0, 0.5, 'hard') === 0.12, '第一關死鬥路哥布林機率異常');
ok(rules.goblinSpawnChance(1, 0.1, 'normal') === 0.14, '第二關哥布林機率異常');
ok(rules.goblinSpawnChance(2, 0.1, 'treasure') === 0.08, '第三關寶庫哥布林機率異常');
ok(rules.goblinSpawnChance(2, 0.1, 'easy') === 0, '緩坡不應生成哥布林');
ok(rules.CHARGE_LOCK_Z < rules.HIT_Z, '敵人鎖定距離必須早於受擊平面');
ok(rules.STAGES[0].fog < 0x304050, '暴風小徑應維持低明度風暴霧色');
ok(sourceText.includes('UnrealBloomPass'), '電影感後製應包含 bloom pass');
ok(sourceText.includes('storm-path-albedo.webp'), '暴風小徑應使用重製石徑材質');

let storedSave = JSON.stringify({
  unlockedStage: 99,
  best: { 'sword:0': 123.9, 'bad:key': 500, 'gun:1': -2 },
  seenTutorial: { sword: true, gun: 'yes' },
  muteSfx: true,
  muteBgm: 'true',
});
global.localStorage = {
  getItem: () => storedSave,
  setItem: (_key, value) => { storedSave = value; },
};
const saveModule = await import(pathToFileURL(path.join(root, 'src', 'save.ts')).href);
const cleanedSave = saveModule.loadSave();
ok(cleanedSave.unlockedStage === 2, '存檔關卡解鎖值未正確限制');
ok(cleanedSave.best['sword:0'] === 123 && Object.keys(cleanedSave.best).length === 1, '存檔最佳成績未正確清理');
ok(cleanedSave.seenTutorial.sword === true && cleanedSave.seenTutorial.gun === false, '教學存檔布林值未正確清理');
ok(cleanedSave.muteSfx === true && cleanedSave.muteBgm === false, '音訊存檔布林值未正確清理');

const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const generatedIds = [...sourceText.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
const availableIds = new Set([...ids, ...generatedIds]);
const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
ok(duplicateIds.length === 0, `index.html 有重複 id：${[...new Set(duplicateIds)].join(', ')}`);

const requiredIds = new Set();
for (const expression of [
  /\b(?:getElementById|el)\(['"]([^'"]+)['"]\)/g,
  /\bclick\(['"]([^'"]+)['"]/g,
]) {
  for (const match of sourceText.matchAll(expression)) requiredIds.add(match[1]);
}
for (const id of requiredIds) ok(availableIds.has(id), `程式引用了不存在的 DOM id：${id}`);

const assetRefs = new Set();
for (const match of sourceText.matchAll(/['"]\.\/(art|models)\/([^'"]+)['"]/g)) {
  assetRefs.add(path.join(match[1], match[2]));
}
for (const match of index.matchAll(/(?:src|href)="\.\/(art|models)\/([^"]+)"/g)) {
  assetRefs.add(path.join(match[1], match[2]));
}
for (const match of styles.matchAll(/url\(["']?\/(art|models)\/([^"')]+)["']?\)/g)) {
  assetRefs.add(path.join(match[1], match[2]));
}
for (const ref of assetRefs) {
  try {
    await access(path.join(publicDir, ref));
  } catch {
    failures.push(`缺少被引用的公開資產：${ref}`);
  }
}

const manifest = JSON.parse(await readFile(path.join(publicDir, 'manifest.webmanifest'), 'utf8'));
ok(manifest.display === 'standalone', 'PWA manifest display 必須為 standalone');
ok(manifest.orientation === 'portrait', 'PWA manifest orientation 必須為 portrait');
for (const icon of manifest.icons ?? []) {
  try {
    await access(path.join(publicDir, icon.src));
  } catch {
    failures.push(`PWA icon 不存在：${icon.src}`);
  }
}

const characterArt = ['baishuang.webp', 'chiyan.webp', 'cangyan.webp'];
let characterBytes = 0;
for (const file of characterArt) characterBytes += (await stat(path.join(publicDir, 'art', file))).size;
ok(characterBytes <= 700 * 1024, `角色選單圖像合計過大：${characterBytes} bytes`);

const runtimeArtFiles = await walk(path.join(publicDir, 'art'));
let runtimeArtBytes = 0;
for (const file of runtimeArtFiles) runtimeArtBytes += (await stat(file)).size;
ok(runtimeArtBytes <= 2 * 1024 * 1024, `執行時 2D 美術合計超過 2 MiB：${runtimeArtBytes} bytes`);

const modelFiles = (await readdir(path.join(publicDir, 'models'))).filter((file) => file.endsWith('.glb'));
for (const file of modelFiles) {
  const bytes = (await stat(path.join(publicDir, 'models', file))).size;
  ok(bytes <= 1024 * 1024, `手機 runtime 模型超過 1 MiB：${file} (${bytes} bytes)`);
}
const goblinBytes = (await stat(path.join(publicDir, 'models', 'goblin.glb'))).size;
ok(goblinBytes <= 700 * 1024, `goblin.glb 超過設計門檻：${goblinBytes} bytes`);

const worker = await readFile(path.join(publicDir, 'sw.js'), 'utf8');
ok(/blade-walker-v\d+/.test(worker), 'Service worker 缺少可辨識的 cache 版本');

if (failures.length) {
  console.error(`驗證失敗（${failures.length}）：`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`驗證通過：${ids.length} 個 DOM id、${assetRefs.size} 個公開資產、${modelFiles.length} 個手機模型。`);
  console.log(`角色選單圖像合計 ${(characterBytes / 1024).toFixed(1)} KiB。`);
  console.log(`執行時 2D 美術合計 ${(runtimeArtBytes / 1024 / 1024).toFixed(2)} MiB。`);
}
