# bgm_king_wraith 幽靈王

原創。刃細胞 E3–G3–C4–B3（165–196–262–247）。法律綠。禁止著名遊戲鉤子（禁寶可夢紫苑鎮、路易吉洋館主題、常見聖詠小調分解）。

空靈追魂。常省略三音。lead 每音 80ms `linearRamp` 滑入；echo 為同音高第二 sine，延遲 0.25s（0.5 拍）、gain 一半。

## 元資料

| 欄 | 值 |
|---|---|
| cue | king_wraith |
| 畫面 | 幽靈王擂台（關2 終王） |
| 調性 | E Aeolian（E F# G A B C D），常省略 G |
| BPM | 120 |
| 拍號 | 4/4 |
| 小節 | 16 |
| 一拍秒 | 0.5 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 32.00s（16×4×0.5） |
| 總音量 | 0.16 |
| 迴圈 | 是 |
| bus | bgmBus |
| 滑音 | lead／echo：目標音開始時從低 1 大二（×0.8909）ramp 80ms 到 freq |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| drone | sine | 0.10 | E2=82 全曲，每 4 小節重觸 dur 16 拍 |
| lead | sine | 0.14 | 滑入 |
| echo | sine | 0.07 | 同 lead 音高，t_beat + 0.5 |
| air | noise | 0.03 | BP 1600，dur_sec 0.3，每 2 小節拍 3 |

## drone

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 82 | 40 | 16 | sine | 0.10 | drone |
| 16 | 82 | 40 | 16 | sine | 0.10 | drone |
| 32 | 82 | 40 | 16 | sine | 0.10 | drone |
| 48 | 82 | 40 | 16 | sine | 0.10 | drone |

## air

| t_beat | freq_hz（BP） | dur_sec | wave | gain | voice |
|---:|---:|---:|---|---:|---|
| 2 | 1600 | 0.3 | noise | 0.03 | air |
| 10 | 1600 | 0.3 | noise | 0.03 | air |
| 18 | 1600 | 0.3 | noise | 0.03 | air |
| 26 | 1600 | 0.3 | noise | 0.03 | air |
| 34 | 1600 | 0.3 | noise | 0.03 | air |
| 42 | 1600 | 0.3 | noise | 0.03 | air |
| 50 | 1600 | 0.3 | noise | 0.03 | air |
| 58 | 1600 | 0.3 | noise | 0.03 | air |

（bars 1,3,5,7,9,11,13,15 的拍 3 = t 2,10,…）

## lead（8 小節 ×2）

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice | glide |
|---:|---:|---:|---:|---|---:|---|---|
| 0 | 165 | 52 | 2 | sine | 0.14 | lead | 是 |
| 2 | 196 | 55 | 2 | sine | 0.14 | lead | 是 |
| 4 | 262 | 60 | 2 | sine | 0.14 | lead | 是 |
| 6 | 247 | 59 | 4 | sine | 0.14 | lead | 是 |
| 12 | 330 | 64 | 0.5 | sine | 0.14 | lead | 是 |
| 12.5 | 294 | 62 | 0.5 | sine | 0.14 | lead | 是 |
| 13 | 247 | 59 | 1 | sine | 0.14 | lead | 是 |
| 14 | 196 | 55 | 2 | sine | 0.14 | lead | 是 |
| 20 | 330 | 64 | 2 | sine | 0.14 | lead | 是 |
| 22 | 392 | 67 | 2 | sine | 0.14 | lead | 是 |
| 24 | 494 | 71 | 2 | sine | 0.14 | lead | 是 |
| 26 | 440 | 69 | 4 | sine | 0.14 | lead | 是 |
| 32 | 262 | 60 | 2 | sine | 0.14 | lead | 是 |
| 34 | 247 | 59 | 2 | sine | 0.14 | lead | 是 |
| 36 | 165 | 52 | 4 | sine | 0.14 | lead | 是 |
| 40 | 165 | 52 | 2 | sine | 0.14 | lead | 是 |
| 42 | 196 | 55 | 2 | sine | 0.14 | lead | 是 |
| 44 | 262 | 60 | 2 | sine | 0.14 | lead | 是 |
| 46 | 247 | 59 | 4 | sine | 0.14 | lead | 是 |
| 52 | 330 | 64 | 0.5 | sine | 0.14 | lead | 是 |
| 52.5 | 294 | 62 | 0.5 | sine | 0.14 | lead | 是 |
| 53 | 247 | 59 | 1 | sine | 0.14 | lead | 是 |
| 54 | 196 | 55 | 2 | sine | 0.14 | lead | 是 |
| 60 | 330 | 64 | 2 | sine | 0.14 | lead | 是 |
| 62 | 392 | 67 | 2 | sine | 0.14 | lead | 是 |
| 64 | 262 | 60 | 2 | sine | 0.14 | lead | 是 |
| 66 | 247 | 59 | 2 | sine | 0.14 | lead | 是 |
| 68 | 165 | 52 | 4 | sine | 0.14 | lead | 是 |

t 16–19、48–51 rest（只留 drone+air）。第二遍 64 起不衝 494，改回刃細胞落地接 loop。

## echo

把上表每一列再播一次：`t_beat + 0.5`、`gain 0.07`、`voice=echo`、同樣 glide。rest 不播。
