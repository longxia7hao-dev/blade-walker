# HUD-002 — P0 四屏線框／Unity UI 規格與掛點

**狀態：** 交稿（介面席）  
**適用：** Unity 主線日光場（BRIEF-007／009）  
**不改：** 戰鬥數值、mesh、玩法流程節點順序以外的設計權（選角→進場既有流程可掛）  
**標竿：** 直式 9:16、傳說對決清楚好認；精緻度不能比立繪／進化角色陽春；禁桌面級複雜選單  
**色板：** 已鎖（美術總監 2026-09-08）→ `design/HUD-COLOR-TOKENS.md`／`.png`  
- primary `#3A9CFF` · panel `#121830` @78% · hp／danger `#FF4B6A` · ink `#FFF8E8`  
- 輔 muted `#E8D7B0`／gold `#F4D06A`／frost `#8EE4FF`；選角邊 白霜 frost、赤煙 `#FF8A4A`、蒼焰 `#7EE0FF`  
- 線框可維持灰階；定稿切圖用上列 token

## 線框檔
| 屏 | 檔 |
|----|----|
| 標題 | `design/hud/wire-01-title.png` |
| 選角 | `design/hud/wire-02-char.png` |
| 局內 | `design/hud/wire-03-play.png` |
| 敗北／通關 | `design/hud/wire-04-result.png` |

參考解析度：**1080×1920**（Canvas Scaler：Scale With Screen Size，Reference 1080×1920，Match 0.5）

---

## Canvas 階層（建議）

```
UIRoot (Canvas · Screen Space Overlay · sorting 100)
├─ SafeArea (RectTransform 吃 safeArea)
│  ├─ Screen_Title
│  ├─ Screen_Char
│  ├─ Screen_Play (HUD，非全屏擋輸入)
│  ├─ Screen_Pause
│  └─ Screen_Result (Win/Lose 共用殼，換文案與鈕)
├─ Screen_Loading (可留 HTML 殼；若進 UGUI 則同級)
└─ Screen_RotateHint (可留 HTML 殼)
```

同一時間只開一個全屏 Screen；`Screen_Play` 可與 `Pause`／`Result` 疊加。

---

## 掛點清單（給 Unity 主程式）

### 共用
| ID | 類型 | 說明 |
|----|------|------|
| `UIRoot` | Canvas | 唯一 UI 根 |
| `SafeArea` | RectTransform | 頂底安全區；左右也縮 |
| `UIEventRouter` | 腳本掛點 | 把按鈕轉成既有流程事件（不改數值） |

### Screen_Title
| ID | 類型 | 事件／資料 |
|----|------|------------|
| `TitleStartBtn` | Button | → 開選角 |
| `TitleMuteSfx` | Toggle/Button | 音效開關（文案「音效：開／關」） |
| `TitleMuteBgm` | Toggle/Button | 音樂開關 |

### Screen_Char
| ID | 類型 | 事件／資料 |
|----|------|------------|
| `CharCard_sword` | Button+Image | 選白霜；立繪 `baishuang` |
| `CharCard_gun` | Button+Image | 選赤煙；立繪 `chiyan` |
| `CharCard_mage` | Button+Image | 選蒼焰；立繪 `cangyan` |
| `CharDepartBtn` | Button | 有選角才可按 → 進關／日光場 |
| `CharBackBtn` | Button | → 標題 |
| `CharSelectedRing` | Image | 高亮框 |

文案旁註（可 hidden debug 或首次）：頭像為立繪，場上 3D 進化中（BRIEF-009），勿暗示膠囊＝最終造型。

### Screen_Play（局內 HUD）
| ID | 類型 | 綁定 |
|----|------|------|
| `HudPortrait` | Image | 當前角色立繪裁圓 |
| `HudHpBar` | Image Filled / Slider | 0..1 ← 當前HP／最大HP |
| `HudHpText` | TMP | `n/max` |
| `HudStageLabel` | TMP | 關名 · 進度% |
| `HudProgress` | Image Filled | 關卡進度 0..1 |
| `HudPauseBtn` | Button | → Screen_Pause |
| `HudUltBtn` | Button | 絕招；不可用時灰 |
| `HudUltCdRing` | Image Filled 360 | 冷卻 1→0 |
| `HudUltGlyph` | TMP | 「絕」 |
| `HudTip` | TMP+CanvasGroup | 開局短顯後淡出；**勿常駐擋 SlashZone** |
| `SlashZone` | 邏輯區（可不畫） | 上 ~76% 斬擊 |
| `MoveStrip` | 邏輯區 | 下 ~24% 橫移 |

佈局：血條／頭像在**左上**大塊可讀；暫停**右上**小鈕；絕招**右下**大圓（拇指）。禁止把操作說明做成底緣大面板。

### Screen_Pause
| ID | 類型 | 事件 |
|----|------|------|
| `PauseResumeBtn` | Button | 繼續 |
| `PauseRetryBtn` | Button | 重試本關 |
| `PauseQuitBtn` | Button | 回選角或獵場 |
| `PauseMuteSfx` / `PauseMuteBgm` | Toggle | 同標題 |

面板最多 3 主鈕＋音訊，禁止設定頁迷宮。

### Screen_Result（敗北／通關）
| ID | 類型 | 敗北 | 通關 |
|----|------|------|------|
| `ResultKicker` | TMP | SLAIN／獵魔失敗 | CLEAR／關卡通關 |
| `ResultStats` | TMP | 可選進度%等（程式填，非改數值表） | 同左 |
| `ResultRetryBtn` | Button | 重試 | （可藏） |
| `ResultCharBtn` | Button | 換角色 | （可藏） |
| `ResultNextBtn` | Button | （藏） | 下一關 |
| `ResultHomeBtn` | Button | （可藏） | 回獵場 |

**必須取代**現況「重新進入播放模式即可再試」無鈕狀態。

---

## 互動契約（給程式，不改數值）
1. 標題 `TitleStartBtn` → Char  
2. Char 選一張 → `CharDepartBtn` enable → Play（或既有選關若已接）  
3. Play：`HudPauseBtn` → Pause；死亡／通關 → Result  
4. Result 鈕只觸發既有重開／換角／下一關／回流程，不新增數值欄位  
5. `HudHpBar`／`HudProgress`／`HudUltCdRing` 只讀戰鬥狀態顯示  

---

## 可讀性（BRIEF-009／美術針點）
- 主 CTA 高度 ≥ 96px（1080 寬基準），字重粗、對比高  
- 血條厚度 ≥ 28px；危險（≤30%）轉危險紅（色板 token）  
- 傷害數字（P1，本單可先留掛點 `FxDmgRoot`）：普攻白／暴擊黃，描邊，不進 P0 必交視覺  
- 精緻度：圓角、細描邊、立繪框金屬感輕描即可；**不要**堆桌面窗口裝飾  

## 驗收
- 四屏線框可對著實作  
- 掛點 ID 與上表一致  
- 日光場直式可點：開始→選角→進場→暫停／敗北有鈕可回  
- 色板已鎖；線框可灰階。定稿切圖必須用 token；結構與尺寸不得陽春到「比立繪還像測試 UI」

EOF

## 按鈕 token（美術補鎖 2026-09-08）
- `button` `#F4D06A`：主 CTA 填色（金，不要藍鈕牆）
- `button-ink` `#1A1428`：金鈕上文字
- `primary` 仍給進度／強調邊，不填主鈕

