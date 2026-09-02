# theme_sword 白霜

原創。刃細胞 F#4–A4–D5–C#5（370–440–587–554）。法律綠。禁止著名遊戲鉤子。禁止他人拔劍採樣。

選角高亮白霜時播。關內可 1 聲 gain 0.06 微疊，勿蓋關卡 BGM。

## 元資料

| 欄 | 值 |
|---|---|
| cue | theme_sword |
| 畫面 | 選角高亮白霜 |
| 調性 | B Dorian（B C# D E F# G# A） |
| BPM | 90 |
| 拍號 | 4/4 |
| 小節 | 4 |
| 一拍秒 | 60/90 = 0.666667 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 10.667s（4×4×60/90） |
| 總音量 | 0.16（關內微疊改 lead gain 0.06） |
| 迴圈 | 是 |
| bus | bgmBus |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| bass | sine | 0.10 | B2 全音符 ×4 |
| lead | triangle | 0.16 | 刃細胞 |
| ice | square | 0.05 | 1480Hz，dur_sec 0.05，bar 1 拍 1 與 bar 3 拍 3 |

## bass

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 123 | 47 | 4 | sine | 0.10 | bass |
| 4 | 123 | 47 | 4 | sine | 0.10 | bass |
| 8 | 123 | 47 | 4 | sine | 0.10 | bass |
| 12 | 123 | 47 | 4 | sine | 0.10 | bass |

## ice

| t_beat | freq_hz | midi | dur_sec | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 1480 | 90 | 0.05 | square | 0.05 | ice |
| 10 | 1480 | 90 | 0.05 | square | 0.05 | ice |

## lead

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 370 | 66 | 1 | triangle | 0.16 | lead |
| 1 | 440 | 69 | 1 | triangle | 0.16 | lead |
| 2 | 587 | 74 | 2 | triangle | 0.16 | lead |
| 4 | 554 | 73 | 2 | triangle | 0.16 | lead |
| 6 | 494 | 71 | 1 | triangle | 0.16 | lead |
| 7 | 440 | 69 | 1 | triangle | 0.16 | lead |
| 8 | 370 | 66 | 0.5 | triangle | 0.16 | lead |
| 8.5 | 330 | 64 | 0.5 | triangle | 0.16 | lead |
| 9 | 247 | 59 | 1 | triangle | 0.16 | lead |
| 10 | 123 | 47 | 2 | triangle | 0.16 | lead |
| 12 | 370 | 66 | 4 | triangle | 0.16 | lead |
