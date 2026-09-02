# 變更單 CHANGE-006：雜兵衝速約 0.7 倍

提出：主策劃（製作人令）
給：主程式
狀態：INTEGRATED（entities.ts 已接）

## 不改
傷害、血量、SWORD_RANGE、GUN_COOLDOWN、MAGE_FULL、DODGE_IFRAME、ULT_CD、ENCOUNTERS.at、鎖定距離 CHARGE_LOCK_Z。

## 衝速（entities.ts updateMonster）
| kind | 舊值 | 新值 | 手感理由 |
|---|---:|---:|---|
| 預設 | 7.2 | 5.0 | 全雜兵約 0.7 倍，手機底滑來得及閃 |
| slime | 5.4 | 3.8 | 最慢膠塊，讓近身劍還砍得到 |
| wraith | 11.6 | 8.1 | 仍是最快，但不再一幀擦臉 |
| beetle | 6.8 | 4.8 | 直線衝，降速後閃的窗口可讀 |
| pumpkin | 7.1 | 5.0 | 與預設齊，切半體仍跟得上視線 |
| pumpkinMini | 8.8 | 6.2 | 分裂體比本體快一檔，但可閃 |

玩家感知：衝過來的時間變長，閃避後擦身而過更明顯；打不死仍會挨打。
