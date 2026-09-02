# stip_ult_mage 蒼焰絕招

原創一發。對齊 ULT_MAGE 0.28＋清場爆，樂句 0.90s。走 sfxBus。BGM 不停。取代 `ultMage()`。

## 元資料

| 欄 | 值 |
|---|---|
| cue | stip_ult_mage |
| 畫面 | 蒼焰全螢清彈 |
| BPM | —（絕對秒） |
| 拍號 | — |
| 長度 | 0.90s |
| loop | 否 |
| bus | sfxBus |
| 總音量 | 相對 0–1 如下，再乘 sfxBus 0.9 |

## 事件（t_sec 從觸發 0）

| t_sec | freq_hz | midi | dur_sec | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0.00 | 330 | 64 | 0.28 | sine | 0.12 | rise |
| 0.12 | 494 | 71 | 0.28 | sine | 0.12 | rise |
| 0.24 | 659 | 76 | 0.30 | sine | 0.14 | rise |
| 0.40 | 400 | — | 0.40 | noise | 0.20 | blast（BP 400） |
| 0.42 | 82 | 40 | 0.40 | sawtooth | 0.14 | body |
| 0.50 | 554 | 73 | 0.22 | triangle | 0.08 | ember |

0.42+0.40=0.82，ember 到 0.72，氣口到 0.90。上衝再低爆，無他人法術 stip。
