# bgm_altar 魔王祭壇

原創。刃細胞 C#4–E4–A4–G#4（277–330–440–415）。法律綠。禁止著名遊戲鉤子。

## 元資料

| 欄 | 值 |
|---|---|
| cue | bgm_altar |
| 畫面 | 魔王祭壇前行（88s 關） |
| 調性 | C# Phrygian（C# D E F# G# A B） |
| BPM | 120 |
| 拍號 | 4/4 |
| 小節 | 24 |
| 一拍秒 | 0.5 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 48.00s（24×4×0.5） |
| 總音量 | 0.20 |
| 迴圈 | 是 |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| ost | sawtooth | 0.14 | 2 小節八分。1–8 含 rest；9–16 填滿；17–24 同填滿 |
| stomp | sawtooth | 0.12 | 僅 bars 17–24，C#1 四分（ost 根音低八度，不是彈跳） |
| lead | square | 0.10 | 從 bar 9 |
| lead8 | triangle | 0.08 | 僅 bars 17–24，lead 高八度 |
| kick | noise | 0.08 | BP 180，dur_sec 0.08，每小節拍 1 |

## ost 2 小節型 A（bars 1–8，rest 留空）

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0.0 | 69 | 37 | 0.5 | sawtooth | 0.14 | ost |
| 0.5 | 69 | 37 | 0.5 | sawtooth | 0.14 | ost |
| 1.0 | 69 | 37 | 0.5 | sawtooth | 0.14 | ost |
| 2.0 | 69 | 37 | 0.5 | sawtooth | 0.14 | ost |
| 2.5 | 69 | 37 | 0.5 | sawtooth | 0.14 | ost |
| 3.0 | 82 | 40 | 0.5 | sawtooth | 0.14 | ost |
| 3.5 | 73 | 38 | 0.5 | sawtooth | 0.14 | ost |

展開：`for i in 0..3: play at t_beat = i*8`（涵蓋 bars 1–8）。t_beat 1.5 為 rest。

## ost 2 小節型 B（bars 9–24，rest 改 69）

同型 A，另加 `| 1.5 | 69 | 37 | 0.5 | sawtooth | 0.14 | ost |`。

展開：`for i in 4..11: play at t_beat = i*8`。

## stomp（bars 17–24）

| t_beat_in_bar | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 35 | 25 | 1 | sawtooth | 0.12 | stomp |
| 1 | 35 | 25 | 1 | sawtooth | 0.12 | stomp |
| 2 | 35 | 25 | 1 | sawtooth | 0.12 | stomp |
| 3 | 35 | 25 | 1 | sawtooth | 0.12 | stomp |

展開：`for bar in 16..23: play at t_beat = bar*4 + t_beat_in_bar`。C#1=35 是 ost 根 69 的低八度。

## kick

每小節拍 1：`for bar in 0..23: noise BP 180，t_beat=bar*4，dur_sec 0.08，gain 0.08`。

## lead（square，t_beat 從 bar 9 = 32）

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 32 | 277 | 61 | 2 | square | 0.10 | lead |
| 34 | 330 | 64 | 1 | square | 0.10 | lead |
| 35 | 277 | 61 | 1 | square | 0.10 | lead |
| 36 | 440 | 69 | 2 | square | 0.10 | lead |
| 38 | 415 | 68 | 2 | square | 0.10 | lead |
| 40 | 370 | 66 | 0.5 | square | 0.10 | lead |
| 40.5 | 330 | 64 | 0.5 | square | 0.10 | lead |
| 41 | 277 | 61 | 1 | square | 0.10 | lead |
| 42 | 247 | 59 | 2 | square | 0.10 | lead |
| 44 | 208 | 56 | 4 | square | 0.10 | lead |
| 48 | 277 | 61 | 2 | square | 0.10 | lead |
| 50 | 330 | 64 | 1 | square | 0.10 | lead |
| 51 | 277 | 61 | 1 | square | 0.10 | lead |
| 52 | 440 | 69 | 2 | square | 0.10 | lead |
| 54 | 415 | 68 | 2 | square | 0.10 | lead |
| 56 | 370 | 66 | 0.5 | square | 0.10 | lead |
| 56.5 | 330 | 64 | 0.5 | square | 0.10 | lead |
| 57 | 277 | 61 | 1 | square | 0.10 | lead |
| 58 | 247 | 59 | 2 | square | 0.10 | lead |
| 60 | 277 | 61 | 4 | square | 0.10 | lead |
| 64 | 277 | 61 | 2 | square | 0.10 | lead |
| 66 | 330 | 64 | 1 | square | 0.10 | lead |
| 67 | 277 | 61 | 1 | square | 0.10 | lead |
| 68 | 440 | 69 | 2 | square | 0.10 | lead |
| 70 | 415 | 68 | 2 | square | 0.10 | lead |
| 72 | 370 | 66 | 0.5 | square | 0.10 | lead |
| 72.5 | 330 | 64 | 0.5 | square | 0.10 | lead |
| 73 | 277 | 61 | 1 | square | 0.10 | lead |
| 74 | 247 | 59 | 2 | square | 0.10 | lead |
| 76 | 208 | 56 | 4 | square | 0.10 | lead |
| 80 | 277 | 61 | 2 | square | 0.10 | lead |
| 82 | 330 | 64 | 1 | square | 0.10 | lead |
| 83 | 277 | 61 | 1 | square | 0.10 | lead |
| 84 | 440 | 69 | 2 | square | 0.10 | lead |
| 86 | 415 | 68 | 2 | square | 0.10 | lead |
| 88 | 277 | 61 | 7 | square | 0.10 | lead | 長音到拍 95 |
| 95 | — | — | 1 | rest | 0 | lead | bar 24 拍 4 靜音接 loop |

## lead8（triangle，bars 17–24，頻率 ×2，gain 0.08）

把上表 t_beat ≥ 64 且非 rest 的列再播一次：`freq_hz*2`、`midi+12`、`wave=triangle`、`gain=0.08`、`voice=lead8`。最後 rest 不播。
