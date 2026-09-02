# 變更單 CHANGE-009：射擊哥布林當雜兵

提出：主策劃（製作人令）
給：主程式（等 TA 過閘再掛）
狀態：待掛。不改 src 直到 goblin.glb 過閘。禁止第四關。不是小魔王、不是王。
取代：原誤編 CHANGE-007-goblin-fodder.md（007 已是燈光、008 已是清 emissive）。

## 不改
現有四種雜兵與所有王／小魔王的血量、傷害、ENCOUNTERS.at。SWORD_RANGE、GUN_COOLDOWN、MAGE_FULL、DODGE_IFRAME、ULT_CD、CHARGE_LOCK_Z、CHANGE-006 衝速表。

## 新 kind
| 欄 | 值 | 對齊理由 |
|---|---|---|
| MonsterKind | `goblin` | 新雜兵，不加 miniGoblin／bossGoblin |
| 顯示名 | 射擊哥布林 | 製作人指定 |
| hp | 1 | 與 slime／wraith／pumpkin 同檔，一刀／一槍死 |
| 接觸傷害 | 1 | 全雜兵同 |
| 衝速 | 4.2 | 比 pumpkin 5.0 慢、比 slime 3.8 快；要邊衝邊射，給底滑窗口 |
| radius | 0.55 | 1:1 約 1.25m 高，比 beetle 0.7 瘦 |
| 射擊 | 鎖定後每 1.4s 一發 | 發射當下瞄準玩家 X 後直線鎖死（與閃避鎖定同一規則），不追蹤。複用 `shard`，傷害 1。未鎖定前不射 |

## 刷哪裡（同一層 pickSpawn，不另開遭遇）
緩坡 `easy` **不刷**（補血路維持膠塊）。
其餘路線從現有權重裡抽一截，不提高 density。

| 關 | 段 | 條件 | goblin 機率 | 手感 |
|---|---|---|---:|---|
| 0 暴風小徑 | 岔路後 progress>0.35 | hard／未選前的預設路 | 0.12 | 教學關後半才出現射手 |
| 1 迷霧深林 | 全程 | normal／hard | 0.14 | 主場：霧林裡被冷槍 |
| 2 魔王祭壇 | 全程 | normal／hard／treasure | 0.16 | 祭壇雜兵最密的一檔射手 |

treasure 關2：0.08（寶箱路少量冷槍）。
不進 ENCOUNTERS 表。擂台期間仍不刷雜兵。

## 資產
runtime `goblin.glb`（與 slime.glb／beetle.glb 同套命名，不是 mob_goblin.glb）。
預算跟 BRIEF-006 雜兵：raw ≤700KB、≤8k 三角、≤1 材質。
1:1 進場。過閘前不要掛、不要 primitive 冒充。
