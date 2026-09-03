# 白霜 × 晶黏帝：商用品質 3D 資產契約

這份契約是把目前 gameplay proxy 替換成正式角色的交付門檻。程式已固定 gameplay root、碰撞體與武器 socket；美術檔依本契約替換，不改路徑或戰鬥程式。

## 白霜

| 項目 | 交付規格 |
| --- | --- |
| 格式 | FBX，Y-up，公尺，角色腳底原點，面向 +Z |
| 網格 | LOD0 45–65k tris；LOD1 24–34k；LOD2 10–15k |
| 材質 | 身體、頭髮、武器最多 4 個 material slots |
| 貼圖 | 身體與頭髮各 2K；BaseColor、Normal、Mask(Metallic/AO/Roughness)；武器可共用 2K atlas |
| 骨架 | Humanoid；手指簡骨；頭髮/披風 secondary bones；右手 `WeaponSocket_R` |
| 動畫 | idle、run、strafe L/R、turn L/R、attack x4、air attack x2、dodge L/R、hit x3、knockdown、get up、victory、defeat，共至少 20 clips |
| 可讀性 | 深靛外輪廓、霜青刀光、銀甲亮面分區；手機畫面 180 px 高仍能一眼辨識 |

## 晶黏帝

| 項目 | 交付規格 |
| --- | --- |
| 格式 | FBX，腳底原點，面向 -Z；琥珀膠體＋青晶冠，不得改成人形 |
| 網格 | LOD0 55–80k tris；LOD1 28–42k；LOD2 12–18k |
| 材質 | 膠體、晶體、金屬最多 3 個 material slots |
| 貼圖 | 2K atlas；膠體厚度/透光以 shader 參數表達，不用多層透明殼 |
| 骨架 | 身體 squash bones、雙晶與王冠獨立骨、命中特效 sockets |
| 動畫 | idle、hop、turn、slam、crystal volley、ring wave、summon、hit x3、break、death，共至少 13 clips |
| 可讀性 | 先讀出王冠與雙晶，再讀出膠體；不靠全畫面 bloom 才看得見 |

## 行動裝置畫質門檻

- Premium 裝置目標 60 fps；中階 Android 目標穩定 30 fps。
- 同畫面一般怪建議 8–12 隻；使用 GPU instancing、材質合批與 LOD。
- 角色每個材質只用一組 PBR atlas；透明材質限眼睛、膠體與必要 VFX。
- 一般怪至少具備 idle、移動、攻擊、受擊、死亡；飛行與跳躍動畫不可只用整體 transform 位移。
- 正式驗收要在實機進行，包含 frame time、溫度、記憶體與 15 分鐘穩定性測試。

## 參考檔

- 白霜概念：儲存庫根目錄 `design/source-art/baishuang.png`
- 晶黏帝概念：儲存庫根目錄 `design/source-art/boss-slime-king.png`
- 目前低模只作比例參考：`public/models/frost_blade.glb`、`public/models/slime_king.glb`
