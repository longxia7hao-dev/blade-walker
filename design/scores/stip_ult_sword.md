# stip_ult_sword 白霜絕招

原創一發。對齊 ULT_SWORD 0.9，凍尾到 0.95s。走 sfxBus。BGM 不停。取代 `ultSword()`。禁止他人拔劍採樣。

## 元資料

| 欄 | 值 |
|---|---|
| cue | stip_ult_sword |
| 畫面 | 白霜旋斬凍結 |
| BPM | —（絕對秒） |
| 拍號 | — |
| 長度 | 0.95s |
| loop | 否（觸發一次） |
| bus | sfxBus |
| 總音量 | 相對 0–1 如下，再乘 sfxBus 0.9 |

## 事件（t_sec 從觸發 0）

| t_sec | freq_hz | midi | dur_sec | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0.00 | 3200 | — | 0.12 | noise | 0.16 | ice（BP 中心） |
| 0.00 | 247 | 59 | 0.18 | triangle | 0.12 | arp |
| 0.10 | 370 | 66 | 0.16 | triangle | 0.12 | arp |
| 0.22 | 494 | 71 | 0.16 | triangle | 0.12 | arp |
| 0.34 | 587 | 74 | 0.20 | triangle | 0.14 | arp |
| 0.48 | 740 | 78 | 0.22 | triangle | 0.12 | arp |
| 0.55 | 123 | 47 | 0.40 | sine | 0.10 | freeze |

末音 0.55+0.40=0.95。上行琶音再凍低音，不是金屬「鏘」採樣。
