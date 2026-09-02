# theme_mage 蒼焰

原創。刃細胞 E4–G#4–C#5–B4（330–415–554–494）。法律綠。禁止著名遊戲鉤子。長音交疊，無噪音。

選角高亮蒼焰時播。關內可 1 聲 gain 0.06 微疊。

## 元資料

| 欄 | 值 |
|---|---|
| cue | theme_mage |
| 畫面 | 選角高亮蒼焰 |
| 調性 | E Lydian（E F# G# A# B C# D#） |
| BPM | 72 |
| 拍號 | 4/4 |
| 小節 | 3 |
| 一拍秒 | 60/72 = 0.833333 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 10.00s（3×4×60/72） |
| 總音量 | 0.14 |
| 迴圈 | 是 |
| bus | bgmBus |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| drone | sine | 0.08 | E3=165，幾乎全曲，最後一拍只留它 |
| lead | sine | 0.14 | 交疊；attack 0.08s；前四音 dur_sec 2.2 |

## drone

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 165 | 52 | 12 | sine | 0.08 | drone |

## lead（前四音用 dur_sec；bar 3 用拍）

| t_beat | freq_hz | midi | dur | wave | gain | voice | attack_sec |
|---:|---:|---:|---|---|---:|---|---:|
| 0 | 330 | 64 | dur_sec 2.2 | sine | 0.14 | lead | 0.08 |
| 2 | 415 | 68 | dur_sec 2.2 | sine | 0.14 | lead | 0.08 |
| 4 | 554 | 73 | dur_sec 2.2 | sine | 0.14 | lead | 0.08 |
| 6 | 494 | 71 | dur_sec 2.2 | sine | 0.14 | lead | 0.08 |
| 8 | 330 | 64 | dur_beats 3 | sine | 0.14 | lead | 0.08 |
| 8 | 494 | 71 | dur_beats 3 | sine | 0.14 | lead | 0.08 |

t_beat 11（bar 3 拍 4）lead 休，只留 drone 165 接 loop。
