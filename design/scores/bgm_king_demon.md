# bgm_king_demon 魔王

原創。刃細胞 D#3–F#3–B3–A#3（156–185–247–233）。法律綠。禁止著名遊戲鉤子（禁一閃一閃、塞菲羅斯分解、DQ 魔王進行曲圓舞）。

低音儀式。Pedal 是 D#1 長踏，不是 55Hz 舊占位、也不是跳八度彈跳。

## 元資料

| 欄 | 值 |
|---|---|
| cue | king_demon |
| 畫面 | 魔王擂台（關3 終王） |
| 調性 | D# Phrygian（D# E F# G# A# B C#） |
| BPM | 132 |
| 拍號 | 4/4 |
| 小節 | 18 |
| 一拍秒 | 60/132 = 0.454545 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 32.727s（18×4×60/132） |
| 總音量 | 0.18 |
| 迴圈 | 是 |
| bus | bgmBus |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| pedal | sawtooth | 0.16 | D#1=39，每 2 拍、dur 0.42s |
| stack | triangle | 0.08 | 五度疊 156+233+311，全音符 |
| lead | square | 0.11 | 4 小節句 ×3，末 4 小節拉長，17–18 休 |
| hit | noise | 0.10 | BP 120，dur_sec 0.12，每小節拍 1 |

## pedal

`for i in 0..35: t_beat = i*2，freq 39，midi 27，dur_sec 0.42，sawtooth，gain 0.16`。  
bar 18 拍 4（t 71）不發，硬切 loop。即 i=0..34 共 35 下，最後一下 t 68。

## stack（每小節全音符三音）

| t_beat_in_bar | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 156 | 51 | 4 | triangle | 0.08 | stack |
| 0 | 233 | 58 | 4 | triangle | 0.08 | stack |
| 0 | 311 | 63 | 4 | triangle | 0.08 | stack |

展開：`for bar in 0..17: play at t_beat = bar*4`。bars 17–18 仍留 stack＋pedal，lead 休。

## hit

`for bar in 0..17: noise BP 120，t_beat = bar*4，dur_sec 0.12，gain 0.10`。

## lead

4 小節句（相對 t）：

| t | freq_hz | midi | dur_beats |
|---:|---:|---:|---:|
| 0 | 156 | 51 | 2 |
| 2 | 185 | 54 | 1 |
| 3 | 156 | 51 | 1 |
| 4 | 247 | 59 | 2 |
| 6 | 233 | 58 | 2 |
| 8 | 185 | 54 | 0.5 |
| 8.5 | 208 | 56 | 0.5 |
| 9 | 247 | 59 | 1 |
| 10 | 311 | 63 | 2 |
| 12 | 233 | 58 | 4 |

展開：off 0、16、32（bars 1–12）。

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 156 | 51 | 2 | square | 0.11 | lead |
| 2 | 185 | 54 | 1 | square | 0.11 | lead |
| 3 | 156 | 51 | 1 | square | 0.11 | lead |
| 4 | 247 | 59 | 2 | square | 0.11 | lead |
| 6 | 233 | 58 | 2 | square | 0.11 | lead |
| 8 | 185 | 54 | 0.5 | square | 0.11 | lead |
| 8.5 | 208 | 56 | 0.5 | square | 0.11 | lead |
| 9 | 247 | 59 | 1 | square | 0.11 | lead |
| 10 | 311 | 63 | 2 | square | 0.11 | lead |
| 12 | 233 | 58 | 4 | square | 0.11 | lead |
| 16 | 156 | 51 | 2 | square | 0.11 | lead |
| 18 | 185 | 54 | 1 | square | 0.11 | lead |
| 19 | 156 | 51 | 1 | square | 0.11 | lead |
| 20 | 247 | 59 | 2 | square | 0.11 | lead |
| 22 | 233 | 58 | 2 | square | 0.11 | lead |
| 24 | 185 | 54 | 0.5 | square | 0.11 | lead |
| 24.5 | 208 | 56 | 0.5 | square | 0.11 | lead |
| 25 | 247 | 59 | 1 | square | 0.11 | lead |
| 26 | 311 | 63 | 2 | square | 0.11 | lead |
| 28 | 233 | 58 | 4 | square | 0.11 | lead |
| 32 | 156 | 51 | 2 | square | 0.11 | lead |
| 34 | 185 | 54 | 1 | square | 0.11 | lead |
| 35 | 156 | 51 | 1 | square | 0.11 | lead |
| 36 | 247 | 59 | 2 | square | 0.11 | lead |
| 38 | 233 | 58 | 2 | square | 0.11 | lead |
| 40 | 185 | 54 | 0.5 | square | 0.11 | lead |
| 40.5 | 208 | 56 | 0.5 | square | 0.11 | lead |
| 41 | 247 | 59 | 1 | square | 0.11 | lead |
| 42 | 311 | 63 | 2 | square | 0.11 | lead |
| 44 | 233 | 58 | 4 | square | 0.11 | lead |
| 48 | 233 | 58 | 8 | square | 0.11 | lead |
| 56 | 156 | 51 | 8 | square | 0.11 | lead |

t 48–55（bars 13–14）長 233；56–63（15–16）長 156。t 64–71（17–18）lead 休，只留 pedal＋stack，18.4 rest 接 loop。
