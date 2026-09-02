# VFX-002　閃避邊光／閃白（品管：左右閃避反饋弱）

提出：遊戲特效師
給：主程式（掛 CSS／一次 kick）／遊戲總監（過審）
狀態：INTEGRATED（總監 2026-08-30：已進 dist，對上規格。SW v13 硬刷新回歸左右邊光。）
不改戰鬥數字（`DODGE_IFRAME`／`DODGE_CD`／`DODGE_MOVE`／`DODGE_STRIP_Y`）。不改 mesh、不追加 draw call。
對照圖：`design/VFX-002-dodge-edge.png`

## 問題

左右閃看起來一樣、而且幾乎看不到。

| 位置 | 現況 | 判定 |
|---|---|---|
| `#dodge-flash` | 中心微白 `opacity` 70ms，每幀綁 `iframe > 0` | FAIL：太淡、太短、不分左右、絕招 iframe 也會亮 |
| `.dodge-edge` | `display: none !important` | FAIL：左右邊光根本沒畫 |
| `ui.ts` 切畫面 | `#dodge-left`／`#dodge-right` 一律加 `hidden` | FAIL：就算拿掉 none 也看不見 |
| `.dodge-strip` 箭頭 pulse | 來彈預警 | 保留；**不要**拿來當閃避成功回饋 |
| 武器殘影 `view.setIframe` | 既有 | 保留，不加第二個殘影 mesh |

## 可讀規則

一眼要分得出「往左」還是「往右」。主訊號是**出場側邊光**，全螢閃白只是陪襯。

| 角色 | 值 | 何時 |
|---|---|---|
| 邊光核 | `rgba(255, 248, 232, 0.88)` | 成功閃避的出場側（左閃＝左、右閃＝右） |
| 邊光金 | `rgba(244, 208, 106, 0.42)` | 邊光外緣，對齊 `--gold` |
| 陪襯微白 | 峰值 opacity `0.18` | 偏出場側的短洗，不是正中全白 |
| 時長 | 邊光 **240ms**、微白 **180ms** | 純 CSS animation，**不是**改 `DODGE_IFRAME=0.38` |
| 撞牆 | 不播 kick | 既有 `shake` 就夠，避免假成功 |

三角色共用這套金白，不要跟白霜／赤煙／蒼焰角色色綁死。

## 掛點（主程式）

### 1. 打開既有左右條

拿掉 `.dodge-edge { display: none !important; }`。
play 畫面不要再對 `#dodge-left`／`#dodge-right` 強制 `hidden`。
平時 `opacity: 0`；只有 kick 那一下才亮。

建議形狀（既有 DOM，不算新層）：

```css
.dodge-edge {
  position: absolute;
  top: 0;
  bottom: 20%; /* 閃避帶上方，避免蓋住操作區 */
  width: 12vw;
  max-width: 72px;
  pointer-events: none;
  z-index: 6;
  opacity: 0;
}
.dodge-edge.left  { left: 0;  background: linear-gradient(to right,  rgba(255,248,232,0.88), rgba(244,208,106,0.42) 38%, transparent); }
.dodge-edge.right { right: 0; background: linear-gradient(to left,   rgba(255,248,232,0.88), rgba(244,208,106,0.42) 38%, transparent); }
```

kick 動畫（重啟 class，比對 `weapon-wrap` 的 restart）：

```css
@keyframes dodgeEdgeKick {
  0%   { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(1.35); }
}
.dodge-edge.kick { animation: dodgeEdgeKick 240ms ease-out forwards; }
.dodge-edge.left.kick  { transform-origin: left center; }
.dodge-edge.right.kick { transform-origin: right center; }
```

### 2. `#dodge-flash` 改成「閃一下」，不要綁 iframe

刪 `transition: opacity 70ms`。不要每幀 `dodgeFlash(iframe > 0)`（絕招 iframe 會誤亮）。

成功閃避呼叫一次：

```ts
ui.dodgeKick(dir) // dir = -1 | 1
```

- 左：`#dodge-left` restart `kick`；`#dodge-flash` 加 `kick-left`（`radial-gradient(circle at 18% 68%, rgba(220,240,255,0.18), transparent 62%)`，180ms 淡出）
- 右：對稱 `82% 68%`
- `#hurt-flash.on` 期間不播（受傷蓋過閃避回饋）
- 撞牆（`next < -1 \|\| next > 1`）不呼叫

### 3. 不要動的

- `DODGE_IFRAME`／`DODGE_CD`／`DODGE_MOVE`
- 來彈時 strip 箭頭 pulse
- 武器殘影、`afterimage` 陣列壽命
- 不准為閃避加 PointLight、additive mesh、或第二張全螢幕 canvas

## TA 門檻

- 全螢幕加色仍 ≤2：`#dodge-flash` 是既有 DOM 層，hurt 與 dodge 互斥，不疊。
- `.dodge-edge` 寬約 12vw，不是全螢幕 additive。
- 不追加 draw call。fillrate：禁止把邊光拉成 inset:0 第二張閃白。

## 完成定義

成功左閃：左邊金白條清楚掃過約 240ms。右閃對稱。70ms 中心微白不再是唯一回饋。iframe 秒數不變。絕招不會誤亮閃避邊光。
