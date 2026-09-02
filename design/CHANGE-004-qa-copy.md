# 變更單 CHANGE-004：品管文案三張

提出：主策劃
給：主程式
狀態：INTEGRATED
不改戰鬥數字（SWORD_RANGE／GUN_COOLDOWN／MAGE_FULL／DODGE_IFRAME／ULT_CD／ENCOUNTERS.at 等）。

| # | 位置 | 舊值 | 新值 | 手感／理由 |
|---|---|---|---|---|
| 11 | 暫停 `btn-pause-quit`、通關 `btn-win-home` | 回檔案 | 回獵場 | 實際 `toStage()`，回關卡選擇不是檔案櫃 |
| 12 | `DODGE_HINT`、`index.html` dodge-strip-label、dodge-hint | 下滑左右閃避 | 畫面下方左右滑動 | 與教學 tut-body「畫面下方左右滑動閃避」同一句，去掉易誤讀的「下滑」 |
| 15 | 岔路倒數 `ui.ts` | 自動選擇緩路／秒後選最緩 | 自動選擇緩坡／秒後選緩坡 | 對齊 `ROUTES.easy.name`＝緩坡 |

DODGE_HINT 是文案常數，可改；不要動閃避秒數。
