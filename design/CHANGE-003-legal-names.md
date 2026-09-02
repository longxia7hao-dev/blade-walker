# 變更單 CHANGE-003：法律名稱與 PWA 短名

提出：主策劃
給：主程式（總監調度）
狀態：待改。造型 BRIEF-003 另給建模，過 TA 再換 mesh。

## 不改戰鬥數字
types.ts 的 SWORD_RANGE、GUN_COOLDOWN、MAGE_FULL、MAGE_FIZZLE、DODGE_IFRAME、ULT_CD、ENCOUNTERS[].at／kind／mini、血量與招式相位全部維持。
只改玩家看得到的名字與商店文案。

## 顯示名
| 位置 | 舊值 | 新值 | 理由 |
|---|---|---|---|
| ENCOUNTERS 關1 終王 `name` | 史萊姆王 | 晶黏帝 | 法律黃燈：減少史萊姆王通稱 |
| ENCOUNTERS 關1 小魔王 `name` | 史萊姆騎士 | 膠盾騎 | 同上 |
| HUD／教學／README 若寫死上列舊名 | 同上 | 同上 | 全文對齊 |
| 招式提示可寫 | 史萊姆王衝擊波 | 晶黏帝衝擊波／晶簇 | 不改招式本身 |

kind 仍是 `bossSlime`／`miniSlime`／`slime`，不要改程式識別字。

## PWA／對外
| 位置 | 舊值 | 新值 | 理由 |
|---|---|---|---|
| `manifest.webmanifest` `name` | 魔刃行者 | 魔刃行者 | 維持 |
| `manifest.webmanifest` `short_name` | 魔刃 | 魔刃行者 | 短名不要單獨「魔刃」 |
| 商店／對外主打英文 | Blade Walker 當主標 | 主標用中文「魔刃行者」；Blade Walker 只當內部／副標 | 法律黃燈 |

`index.html` `<title>` 維持 魔刃行者。CHANGE-002 的 kicker「幻史斷章」維持。
