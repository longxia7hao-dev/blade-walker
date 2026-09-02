# 變更單 CHANGE-001：接入過預算 GLB

提出：主策劃
給：主程式（由遊戲總監調度）
狀態：待接入（資產未進 public）

## 不改數值
SWORD_RANGE=8.4、GUN_COOLDOWN=0.28、MAGE_FULL=0.85、DODGE_IFRAME=0.38、ULT_CD=10 維持。

## 資產
來源 `/workspace/art/glb/`（Y-up、公尺）。武器 origin 握把；其餘腳底。
請複製壓縮後檔進 `public/models/`，載入失敗回退現有 mesh／立繪。

| 檔案 | 用途 | 建議尺度 |
|---|---|---|
| frost_blade.glb | 白霜 FP | 近景握把對鏡頭右下 |
| flame_pistol.glb | 赤煙 FP | 同上 |
| azure_staff.glb | 蒼焰 FP | 同上 |
| slime_king.glb | 關1 終王 | 高約 2.4m，ARENA_Z |
| ghost_king.glb | 關2 終王 | 高約 2.8m |
| demon_king.glb | 關3 終王 | 高約 3.2m |
| slime.glb | 雜兵史萊姆 | 高約 0.9m |
| ghost.glb | 雜兵幽靈 | 高約 1.2m |
| beetle.glb | 雜兵甲蟲 | 高約 0.8m |
| pumpkin.glb | 雜兵南瓜 | 高約 0.9m |
| pine_tree.glb | 路側實例 | 高 4–7m |
| lamp.glb | 路側實例 | 高約 2.5m |
| chest.glb | 走過去撿的寶箱 | 高約 0.5m |
| heart_crystal.glb | 走過去撿的紅心 | 高約 0.35m |

樹／寶箱剪影過簡，建模師加面中；接入時可用現檔，加面後替換同檔名。

## 手感
武器替換不得改攻擊判定。魔王／雜兵只換外觀，hit sphere 與衝刺鎖定維持。寶箱／紅心仍是同側走過去撿，不可砍到。
