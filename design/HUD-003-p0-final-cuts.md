# HUD-003 — P0 定稿上色／切圖（玻璃半透＋金主鈕）

**狀態：** 交稿（介面席）  
**風格針點：** `REF-AOV-style.md`＋製作人真機圖（借精緻度，**禁抄 IP／禁搬橫版 MOBA 佈局**）  
**色板：** `HUD-COLOR-TOKENS.md`（已鎖）  
**結構：** 仍依 HUD-002 掛點；本單只升視覺層次  
**不改：** 數值、mesh；線框不重貼

## 定稿圖（1080×1920 直式自用）
| 屏 | 檔 |
|----|----|
| 標題 | `design/hud/final-01-title.png` |
| 選角 | `design/hud/final-02-char.png` |
| 局內 | `design/hud/final-03-play.png` |
| 敗北／通關 | `design/hud/final-04-result.png` |

## 視覺層次（本版必達）
1. **玻璃半透面板**：`panel #121830` 約 45–58% 透明＋頂部高光 sheen＋細金／霜邊（`gold`／`frost`），勿實心蓋死日光場。  
2. **金主按鈕**：主 CTA（開始／出發／重試／下一關）用 **`gold #F4D06A` 實心發光**，字用深褐；`primary` 留給進度條／次強調，不是主鈕填色。  
3. **次鈕**：玻璃底＋金細邊（ghost）。  
4. **直式自用佈局**：左上頭像＋粗血條、右上暫停、右下絕招圓；**不要**橫版搖桿＋技能叢。選角用直向立繪卡堆疊，不借橫版大廳。

## Token 對照（唯一準：HUD-COLOR-TOKENS.md）
| 用途 | token | hex |
|------|-------|-----|
| 進度／青強調 | primary | `#3B7EBE` |
| 血／危 | hp／danger | `#E11914` |
| 主 CTA 滿塗 | button | `#D4A526`（外光 `#E0B24A`） |
| 金鈕字 | button-ink | `#1A1428` |
| 主文字 | ink | `#FFFFFF` |
| 玻璃面板 | panel | `#182840` @ 78%＋金邊 |
| 次要字 | muted | `#D4C1A4` |

**主 CTA＝金滿塗；撤藍邊主鈕。** `primary` 只給進度／次強調，不填主鈕。


## 建議切圖
| 資源 | 說明 |
|------|------|
| `ui_glass_panel_9slice` | 半透面板＋細金邊，角 32 |
| `ui_btn_gold_9slice` | 金主鈕（含輕高光） |
| `ui_btn_ghost_9slice` | 玻璃次鈕 |
| `ui_hp_fill` / `ui_hp_track` | 血條 |
| `ui_progress_fill` | primary 進度 |
| `ui_ult_ring` | frost 冷卻；就緒改 gold 外光 |
| `ui_portrait_mask` | 圓遮罩 |
| `ui_pause_icon` | ink |

立繪沿用 `baishuang`／`chiyan`／`cangyan`。

## 驗收
- 一眼有玻璃層次＋金主鈕層級  
- 直式斬魔佈局，非橫版 MOBA 照搬  
- 掛點 ID 與 HUD-002 一致  
- 比日光場灰字條明顯精緻（BRIEF-009）

## 按鈕 token（美術補鎖 2026-09-08）
- `button` `#F4D06A`：主 CTA 填色（金，不要藍鈕牆）
- `button-ink` `#1A1428`：金鈕上文字
- `primary` 仍給進度／強調邊，不填主鈕

## 色板 SSOT（2026-09-08 定稿圖準）
唯一準 `design/HUD-COLOR-TOKENS.md`：primary `#3A9CFF` · hp／danger `#FF4B6A` · button `#D4A526`＋button-ink `#1A1428` · ink `#FFFFFF` · panel `#121830`@50%＋line-gold。主 CTA 金滿塗；頭像僅 baishuang／chiyan／cangyan。`#F4D06A` 舊稿作廢。
