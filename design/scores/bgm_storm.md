# bgm_storm 暴風小徑

原創。刃細胞移調 D4–F#4–B4–A4（294–370–494–440）。法律綠。禁止著名遊戲鉤子。

## 元資料

| 欄 | 值 |
|---|---|
| cue | bgm_storm |
| 畫面 | 暴風小徑前行（68s 關） |
| 調性 | D Mixolydian（D E F# G A B C） |
| BPM | 108 |
| 拍號 | 4/4 |
| 小節 | 18 |
| 一拍秒 | 60/108 = 0.555556 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 40.00s（18×4×60/108） |
| 總音量 | 0.18（再乘 bgmBus 0.22） |
| 迴圈 | 是 |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| bass | sine | 0.20 | 2 小節型 ×9 |
| ost | triangle | 0.10 | 2 小節八分型 ×9 |
| lead | triangle | 0.14 | 見展開 |
| hat | noise | 0.04 | BP 2400，dur_sec 0.04，每小節拍 2 與 4 |

## bass 2 小節型（從 bar 1,3,5…17 各播一次）

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 73 | 38 | 2 | sine | 0.20 | bass |
| 2 | 110 | 45 | 2 | sine | 0.20 | bass |
| 4 | 131 | 48 | 2 | sine | 0.20 | bass |
| 6 | 98 | 43 | 2 | sine | 0.20 | bass |

展開：`for i in 0..8: play at t_beat = i*8`。

## ost 2 小節型（同上展開）

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0.0 | 147 | 50 | 0.5 | triangle | 0.10 | ost |
| 0.5 | 220 | 57 | 0.5 | triangle | 0.10 | ost |
| 1.0 | 185 | 54 | 0.5 | triangle | 0.10 | ost |
| 1.5 | 220 | 57 | 0.5 | triangle | 0.10 | ost |
| 2.0 | 147 | 50 | 0.5 | triangle | 0.10 | ost |
| 2.5 | 262 | 60 | 0.5 | triangle | 0.10 | ost |
| 3.0 | 220 | 57 | 0.5 | triangle | 0.10 | ost |
| 3.5 | 196 | 55 | 0.5 | triangle | 0.10 | ost |
| 4.0 | 147 | 50 | 0.5 | triangle | 0.10 | ost |
| 4.5 | 220 | 57 | 0.5 | triangle | 0.10 | ost |
| 5.0 | 185 | 54 | 0.5 | triangle | 0.10 | ost |
| 5.5 | 196 | 55 | 0.5 | triangle | 0.10 | ost |
| 6.0 | 165 | 52 | 0.5 | triangle | 0.10 | ost |
| 6.5 | 185 | 54 | 0.5 | triangle | 0.10 | ost |
| 7.0 | 147 | 50 | 0.5 | triangle | 0.10 | ost |
| 7.5 | — | — | 0.5 | rest | 0 | ost |

## hat（每小節）

| t_beat_in_bar | freq_hz（BP） | dur_sec | wave | gain | voice |
|---:|---:|---:|---|---:|---|
| 1 | 2400 | 0.04 | noise | 0.04 | hat |
| 3 | 2400 | 0.04 | noise | 0.04 | hat |

展開：`for bar in 0..17: play at t_beat = bar*4 + t_beat_in_bar`。

## lead 全迴圈（t_beat 從 0）

phrase A = bars 1–4。bars 5–8 同 A，但 t_beat 7 的 rest 改 262／midi 60／dur 0.5。bars 9–12 同 A。bars 13–16 同 A，但最後長音 294 改 588／midi 74。bars 17–18 刃細胞二分。

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice | 備註 |
|---:|---:|---:|---:|---|---:|---|---|
| 0 | 294 | 62 | 1 | triangle | 0.14 | lead | A |
| 1 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 2 | 440 | 69 | 0.5 | triangle | 0.14 | lead | |
| 2.5 | 392 | 67 | 0.5 | triangle | 0.14 | lead | |
| 3 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 4 | 262 | 60 | 1.5 | triangle | 0.14 | lead | |
| 5.5 | 220 | 57 | 0.5 | triangle | 0.14 | lead | |
| 6 | 294 | 62 | 1 | triangle | 0.14 | lead | |
| 8 | 294 | 62 | 0.5 | triangle | 0.14 | lead | |
| 8.5 | 330 | 64 | 0.5 | triangle | 0.14 | lead | |
| 9 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 10 | 440 | 69 | 1 | triangle | 0.14 | lead | |
| 11 | 392 | 67 | 0.5 | triangle | 0.14 | lead | |
| 11.5 | 370 | 66 | 0.5 | triangle | 0.14 | lead | |
| 12 | 330 | 64 | 1 | triangle | 0.14 | lead | |
| 13 | 262 | 60 | 1 | triangle | 0.14 | lead | |
| 14 | 294 | 62 | 1.5 | triangle | 0.14 | lead | |
| 16 | 294 | 62 | 1 | triangle | 0.14 | lead | A+16＝bars 5–8 |
| 17 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 18 | 440 | 69 | 0.5 | triangle | 0.14 | lead | |
| 18.5 | 392 | 67 | 0.5 | triangle | 0.14 | lead | |
| 19 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 20 | 262 | 60 | 1.5 | triangle | 0.14 | lead | |
| 21.5 | 220 | 57 | 0.5 | triangle | 0.14 | lead | |
| 22 | 294 | 62 | 1 | triangle | 0.14 | lead | |
| 23 | 262 | 60 | 0.5 | triangle | 0.14 | lead | 原 rest 改短音 |
| 24 | 294 | 62 | 0.5 | triangle | 0.14 | lead | |
| 24.5 | 330 | 64 | 0.5 | triangle | 0.14 | lead | |
| 25 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 26 | 440 | 69 | 1 | triangle | 0.14 | lead | |
| 27 | 392 | 67 | 0.5 | triangle | 0.14 | lead | |
| 27.5 | 370 | 66 | 0.5 | triangle | 0.14 | lead | |
| 28 | 330 | 64 | 1 | triangle | 0.14 | lead | |
| 29 | 262 | 60 | 1 | triangle | 0.14 | lead | |
| 30 | 294 | 62 | 1.5 | triangle | 0.14 | lead | |
| 32 | 294 | 62 | 1 | triangle | 0.14 | lead | A+32＝bars 9–12 |
| 33 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 34 | 440 | 69 | 0.5 | triangle | 0.14 | lead | |
| 34.5 | 392 | 67 | 0.5 | triangle | 0.14 | lead | |
| 35 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 36 | 262 | 60 | 1.5 | triangle | 0.14 | lead | |
| 37.5 | 220 | 57 | 0.5 | triangle | 0.14 | lead | |
| 38 | 294 | 62 | 1 | triangle | 0.14 | lead | |
| 40 | 294 | 62 | 0.5 | triangle | 0.14 | lead | |
| 40.5 | 330 | 64 | 0.5 | triangle | 0.14 | lead | |
| 41 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 42 | 440 | 69 | 1 | triangle | 0.14 | lead | |
| 43 | 392 | 67 | 0.5 | triangle | 0.14 | lead | |
| 43.5 | 370 | 66 | 0.5 | triangle | 0.14 | lead | |
| 44 | 330 | 64 | 1 | triangle | 0.14 | lead | |
| 45 | 262 | 60 | 1 | triangle | 0.14 | lead | |
| 46 | 294 | 62 | 1.5 | triangle | 0.14 | lead | |
| 48 | 294 | 62 | 1 | triangle | 0.14 | lead | A+48＝bars 13–16 |
| 49 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 50 | 440 | 69 | 0.5 | triangle | 0.14 | lead | |
| 50.5 | 392 | 67 | 0.5 | triangle | 0.14 | lead | |
| 51 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 52 | 262 | 60 | 1.5 | triangle | 0.14 | lead | |
| 53.5 | 220 | 57 | 0.5 | triangle | 0.14 | lead | |
| 54 | 294 | 62 | 1 | triangle | 0.14 | lead | |
| 56 | 294 | 62 | 0.5 | triangle | 0.14 | lead | |
| 56.5 | 330 | 64 | 0.5 | triangle | 0.14 | lead | |
| 57 | 370 | 66 | 1 | triangle | 0.14 | lead | |
| 58 | 440 | 69 | 1 | triangle | 0.14 | lead | |
| 59 | 392 | 67 | 0.5 | triangle | 0.14 | lead | |
| 59.5 | 370 | 66 | 0.5 | triangle | 0.14 | lead | |
| 60 | 330 | 64 | 1 | triangle | 0.14 | lead | |
| 61 | 262 | 60 | 1 | triangle | 0.14 | lead | |
| 62 | 588 | 74 | 1.5 | triangle | 0.14 | lead | 尾音高八度 |
| 64 | 294 | 62 | 2 | triangle | 0.14 | lead | bars 17–18 刃 |
| 66 | 370 | 66 | 2 | triangle | 0.14 | lead | |
| 68 | 494 | 71 | 2 | triangle | 0.14 | lead | |
| 70 | 440 | 69 | 2 | triangle | 0.14 | lead | 拍 72 硬切 loop |
