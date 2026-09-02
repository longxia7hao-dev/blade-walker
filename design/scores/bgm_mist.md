# bgm_mist 迷霧深林

原創。刃細胞原調 A3–C4–F4–E4（220–262–349–330）。法律綠。禁止著名遊戲鉤子。

## 元資料

| 欄 | 值 |
|---|---|
| cue | bgm_mist |
| 畫面 | 迷霧深林前行（78s 關） |
| 調性 | A Dorian（A B C D E F# G） |
| BPM | 88 |
| 拍號 | 4/4 |
| 小節 | 16 |
| 一拍秒 | 60/88 = 0.681818 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 43.636s（16×4×60/88） |
| 總音量 | 0.16 |
| 迴圈 | 是 |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| pad_a | sine | 0.05 | A3=220，每 2 小節重觸、attack 1.2s、dur 8 拍 |
| pad_e | sine | 0.05 | E4=330，同上 |
| bass | sine | 0.18 | 全音符；每 4 小節第 4 小節改 F#2 |
| lead | triangle | 0.12 | 8 小節 ×2 |
| wind | noise | 0.03 | BP 800，dur_sec 0.5，奇數小節拍 1 |

## pad（每 2 小節一組，bar 1,3,5,7,9,11,13,15）

| t_beat_in_group | freq_hz | midi | dur_beats | wave | gain | voice | attack_sec |
|---:|---:|---:|---:|---|---:|---|---:|
| 0 | 220 | 57 | 8 | sine | 0.05 | pad_a | 1.2 |
| 0 | 330 | 64 | 8 | sine | 0.05 | pad_e | 1.2 |

展開：`for i in 0..7: play at t_beat = i*8`。

## bass 全迴圈

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 110 | 45 | 4 | sine | 0.18 | bass |
| 4 | 110 | 45 | 4 | sine | 0.18 | bass |
| 8 | 110 | 45 | 4 | sine | 0.18 | bass |
| 12 | 92 | 42 | 4 | sine | 0.18 | bass |
| 16 | 110 | 45 | 4 | sine | 0.18 | bass |
| 20 | 110 | 45 | 4 | sine | 0.18 | bass |
| 24 | 110 | 45 | 4 | sine | 0.18 | bass |
| 28 | 92 | 42 | 4 | sine | 0.18 | bass |
| 32 | 110 | 45 | 4 | sine | 0.18 | bass |
| 36 | 110 | 45 | 4 | sine | 0.18 | bass |
| 40 | 110 | 45 | 4 | sine | 0.18 | bass |
| 44 | 92 | 42 | 4 | sine | 0.18 | bass |
| 48 | 110 | 45 | 4 | sine | 0.18 | bass |
| 52 | 110 | 45 | 4 | sine | 0.18 | bass |
| 56 | 110 | 45 | 4 | sine | 0.18 | bass |
| 60 | 92 | 42 | 4 | sine | 0.18 | bass |

## wind

| t_beat_in_bar | freq_hz（BP） | dur_sec | wave | gain | voice |
|---:|---:|---:|---|---:|---|
| 0 | 800 | 0.5 | noise | 0.03 | wind |

展開：`for bar in 0,2,4,6,8,10,12,14: play at t_beat = bar*4`。

## lead 全迴圈

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 220 | 57 | 2 | triangle | 0.12 | lead |
| 2 | 262 | 60 | 2 | triangle | 0.12 | lead |
| 4 | 349 | 65 | 2 | triangle | 0.12 | lead |
| 6 | 330 | 64 | 2 | triangle | 0.12 | lead |
| 8 | 294 | 62 | 1 | triangle | 0.12 | lead |
| 9 | 196 | 55 | 1 | triangle | 0.12 | lead |
| 10 | 220 | 57 | 2 | triangle | 0.12 | lead |
| 14 | 165 | 52 | 2 | triangle | 0.12 | lead |
| 16 | 440 | 69 | 2 | triangle | 0.12 | lead |
| 18 | 523 | 72 | 2 | triangle | 0.12 | lead |
| 20 | 698 | 77 | 2 | triangle | 0.12 | lead |
| 22 | 659 | 76 | 2 | triangle | 0.12 | lead |
| 24 | 587 | 74 | 0.5 | triangle | 0.12 | lead |
| 24.5 | 523 | 72 | 0.5 | triangle | 0.12 | lead |
| 25 | 440 | 69 | 2 | triangle | 0.12 | lead |
| 32 | 220 | 57 | 2 | triangle | 0.12 | lead |
| 34 | 262 | 60 | 2 | triangle | 0.12 | lead |
| 36 | 349 | 65 | 2 | triangle | 0.12 | lead |
| 38 | 330 | 64 | 2 | triangle | 0.12 | lead |
| 40 | 294 | 62 | 1 | triangle | 0.12 | lead |
| 41 | 196 | 55 | 1 | triangle | 0.12 | lead |
| 42 | 220 | 57 | 2 | triangle | 0.12 | lead |
| 46 | 165 | 52 | 2 | triangle | 0.12 | lead |
| 48 | 440 | 69 | 2 | triangle | 0.12 | lead |
| 50 | 523 | 72 | 2 | triangle | 0.12 | lead |
| 52 | 698 | 77 | 2 | triangle | 0.12 | lead |
| 54 | 659 | 76 | 2 | triangle | 0.12 | lead |
| 56 | 587 | 74 | 0.5 | triangle | 0.12 | lead |
| 56.5 | 523 | 72 | 0.5 | triangle | 0.12 | lead |
| 57 | 440 | 69 | 2 | triangle | 0.12 | lead |
