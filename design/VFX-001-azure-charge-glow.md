# VFX-001　蒼焰蓄力／杖光（品管 16）

提出：遊戲特效師
給：主程式（掛色）／遊戲總監（過審）
狀態：INTEGRATED（src／dist 對過：杖光青核、蓄滿金、寶石 0x7ee0ff；#ff6ad8 已不在戰鬥特效。）
不改戰鬥數字（`MAGE_FULL`／`MAGE_FIZZLE`／傷害／CD）。不改 mesh、材質預算、不追加 draw call。
對照圖：`design/VFX-001-azure-charge-glow.png`

## 問題

戰鬥中蒼焰讀成粉紅，不像「蒼」。現況：

| 位置 | 現值 | 判定 |
|---|---|---|
| `#staff-glow` 中圈／外圈 | `rgba(255, 106, 216, …)` | FAIL |
| 蓄力環 `game.ts` `u < 1` | `#ff6ad8` | FAIL |
| 蓄力環 `u >= 1` | `#f0d27a` | 保留（蓄滿可讀） |
| 寶石 emissive | `0x66e0ff` | 已接近，對齊即可 |
| `gemLight` | `0x88e0ff` | 可留 |

`--azure: #ff7ae8` 本身仍是粉，**本單不強制改 token 名**；戰鬥特效禁止再引用它。

## 色票（青金）

| 角色 | hex | 何時用 |
|---|---|---|
| 核 | `#e8fcff` | 杖光最亮心 |
| 本體 | `--azure-2` `#7ee0ff` | 蓄力中的環、杖光中圈、寶石 emissive |
| 蓄滿金 | `#f0d27a`（對齊 `--gold` `#f4d06a`） | **僅** `u >= 1`（蓄滿仍按住） |
| 禁止 | `#ff6ad8`、`rgba(255,106,216)`、`#ff7ae8`、`rgba(255,78,200)` | 蓄力／杖光路徑一律不准出現 |

## 掛點（主程式改色，特效不改數值）

### 1. `#staff-glow`（既有 DOM，不算新層）

蓄力中（`t < 1`）：

```css
background: radial-gradient(
  circle,
  rgba(232, 252, 255, 0.92) 0%,
  rgba(126, 224, 255, 0.50) 38%,
  rgba(126, 224, 255, 0.00) 70%
);
```

蓄滿可加 class `charged`（可選，不改 `MAGE_FULL`）：

```css
background: radial-gradient(
  circle,
  rgba(255, 248, 224, 0.95) 0%,
  rgba(126, 224, 255, 0.55) 34%,
  rgba(240, 210, 122, 0.22) 56%,
  rgba(240, 210, 122, 0.00) 72%
);
```

尺寸維持 110px，blur 2–3px，`opacity`／`scale` 曲線沿用 `viewmodels.setCharge`（`0.28+t*0.72`、`0.5+t*1.05`）。不要放大成全螢幕。

### 2. 手指蓄力環（既有 `#fx` canvas stroke）

`game.ts` 約 L2353：

- `u < 1`：`#7ee0ff`（取代 `#ff6ad8`）
- `u >= 1`：維持 `#f0d27a`
- `shadowBlur`、弧半徑公式不動

### 3. 杖頂寶石（既有 point light + emissive）

- emissive hex 對齊 `0x7ee0ff`
- intensity 曲線不動（`gemBaseEi + t * 2.4`，light `t * 2.2`）
- 不准為蓄力再加一個 light 或 additive mesh

## TA 門檻

- 全螢幕加色疊加仍 ≤2：`#fx` canvas 一層、hurt／ult 閃白共用既有層。`#staff-glow` 是 110px DOM，不是全螢幕 additive。
- 不為蓄力追加 draw call。
- 不爆 fillrate：禁止把杖光拉成全螢幕、禁止第二張 additive 法球光暈。

## 本單不做

弱彈法球 `rgba(255,78,200)`、選角卡 `.char-card.azure`、`ui.ts` 示意環 `#ff7ae8`。`--azure` token 由主程式另改，不在本單。蓄滿貫穿爆破維持現有金白，與本單「蓄滿上金」一致。

## 完成定義

蒼焰長按：環與杖光是青（`#7ee0ff`），畫面裡找不到 `#ff6ad8`／粉紅 rgba。蓄滿環變金。戰鬥數字不變。
