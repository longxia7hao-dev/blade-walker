# title 標題／選角底床

原創。刃細胞原調 A3–C4–F4–E4（220–262–349–330），拉寬放慢。法律綠。禁止著名遊戲鉤子（禁 FF 前奏琶音、薩爾達五度號、瑪利歐跳低音）。

`setMode('title')` 用。標題畫面單獨播。選角／選關會同時 `setTheme(*, 'full')`，故本曲中低、後半樂句休止，把中高留給主題。

## 元資料

| 欄 | 值 |
|---|---|
| cue | title |
| 畫面 | 標題；選角／選關底床 |
| 調性 | A Dorian 偏柔（A B C D E F# G），常省略三音 |
| BPM | 72 |
| 拍號 | 4/4 |
| 小節 | 8 |
| 一拍秒 | 60/72 = 0.833333 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 26.667s（8×4×60/72） |
| 總音量 | 0.14 |
| 迴圈 | 是 |
| bus | bgmBus |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| pad_a | sine | 0.05 | A2=110，每 2 小節重觸、attack 1.2s、dur 8 拍 |
| pad_e | sine | 0.04 | E3=165，同上 |
| bass | sine | 0.12 | 全音符 A2；第 4、8 小節改 E2=82 |
| lead | triangle | 0.10 | 只 bars 1–4；5–8 休 |

## pad（bar 1,3,5,7）

| t_beat_in_group | freq_hz | midi | dur_beats | wave | gain | voice | attack_sec |
|---:|---:|---:|---:|---|---:|---|---:|
| 0 | 110 | 45 | 8 | sine | 0.05 | pad_a | 1.2 |
| 0 | 165 | 52 | 8 | sine | 0.04 | pad_e | 1.2 |

展開：`for i in 0..3: play at t_beat = i*8`。

## bass

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 110 | 45 | 4 | sine | 0.12 | bass |
| 4 | 110 | 45 | 4 | sine | 0.12 | bass |
| 8 | 110 | 45 | 4 | sine | 0.12 | bass |
| 12 | 82 | 40 | 4 | sine | 0.12 | bass |
| 16 | 110 | 45 | 4 | sine | 0.12 | bass |
| 20 | 110 | 45 | 4 | sine | 0.12 | bass |
| 24 | 110 | 45 | 4 | sine | 0.12 | bass |
| 28 | 82 | 40 | 4 | sine | 0.12 | bass |

## lead（bars 1–4，其後休）

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 220 | 57 | 2 | triangle | 0.10 | lead |
| 2 | 262 | 60 | 2 | triangle | 0.10 | lead |
| 4 | 349 | 65 | 2 | triangle | 0.10 | lead |
| 6 | 330 | 64 | 2 | triangle | 0.10 | lead |
| 8 | 294 | 62 | 1 | triangle | 0.10 | lead |
| 9 | 220 | 57 | 1 | triangle | 0.10 | lead |
| 10 | 262 | 60 | 2 | triangle | 0.10 | lead |
| 14 | 165 | 52 | 2 | triangle | 0.10 | lead |

t 16–31 rest。無噪音、無跳八度。
