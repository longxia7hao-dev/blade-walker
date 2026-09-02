# theme_gun 赤煙

原創。刃細胞 G3–Bb3–Eb4–D4（196–233–311–294）。法律綠。禁止著名遊戲鉤子。不是進行曲軍鼓、不是 DQ 彈跳。

選角高亮赤煙時播。關內可 1 聲 gain 0.06 微疊。

## 元資料

| 欄 | 值 |
|---|---|
| cue | theme_gun |
| 畫面 | 選角高亮赤煙 |
| 調性 | G 小調五聲＋降五（G Bb C Db D F） |
| BPM | 120 |
| 拍號 | 4/4 |
| 小節 | 5 |
| 一拍秒 | 0.5 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 10.00s（5×4×0.5） |
| 總音量 | 0.16 |
| 迴圈 | 是 |
| bus | bgmBus |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| bass | sawtooth | 0.10 | G2，每小節拍 1 與 3（bars 1–4）；bar 5 休 |
| lead | square | 0.16 | 斷音 |
| muzzle | noise | 0.10 | BP 1800，dur_sec 0.05，每句頭（t_beat 0、4、8、12） |

## bass（bars 1–4）

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 98 | 43 | 1 | sawtooth | 0.10 | bass |
| 2 | 98 | 43 | 1 | sawtooth | 0.10 | bass |
| 4 | 98 | 43 | 1 | sawtooth | 0.10 | bass |
| 6 | 98 | 43 | 1 | sawtooth | 0.10 | bass |
| 8 | 98 | 43 | 1 | sawtooth | 0.10 | bass |
| 10 | 98 | 43 | 1 | sawtooth | 0.10 | bass |
| 12 | 98 | 43 | 1 | sawtooth | 0.10 | bass |
| 14 | 98 | 43 | 1 | sawtooth | 0.10 | bass |

bar 5（t 16–19）休。

## muzzle

| t_beat | freq_hz（BP） | dur_sec | wave | gain | voice |
|---:|---:|---:|---|---:|---|
| 0 | 1800 | 0.05 | noise | 0.10 | muzzle |
| 4 | 1800 | 0.05 | noise | 0.10 | muzzle |
| 8 | 1800 | 0.05 | noise | 0.10 | muzzle |
| 12 | 1800 | 0.05 | noise | 0.10 | muzzle |

## lead

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0.0 | 196 | 55 | 0.5 | square | 0.16 | lead |
| 0.5 | 233 | 58 | 0.5 | square | 0.16 | lead |
| 1.0 | 196 | 55 | 1 | square | 0.16 | lead |
| 2.0 | 311 | 63 | 0.5 | square | 0.16 | lead |
| 2.5 | 294 | 62 | 0.5 | square | 0.16 | lead |
| 3.0 | 233 | 58 | 1 | square | 0.16 | lead |
| 4.0 | 196 | 55 | 0.5 | square | 0.16 | lead |
| 4.5 | 175 | 53 | 0.5 | square | 0.16 | lead |
| 5.0 | 196 | 55 | 1 | square | 0.16 | lead |
| 7.0 | 98 | 43 | 1 | square | 0.16 | lead |
| 8.0 | 196 | 55 | 0.5 | square | 0.16 | lead |
| 8.5 | 233 | 58 | 0.5 | square | 0.16 | lead |
| 9.0 | 196 | 55 | 0.5 | square | 0.16 | lead |
| 9.5 | 277 | 61 | 0.5 | square | 0.16 | lead |
| 10.0 | 294 | 62 | 0.5 | square | 0.16 | lead |
| 10.5 | 311 | 63 | 0.5 | square | 0.16 | lead |
| 11.0 | 294 | 62 | 0.5 | square | 0.16 | lead |
| 11.5 | 233 | 58 | 0.5 | square | 0.16 | lead |
| 12.0 | 196 | 55 | 2 | square | 0.16 | lead |
| 14.0 | 294 | 62 | 0.5 | square | 0.16 | lead |
| 14.5 | 233 | 58 | 0.5 | square | 0.16 | lead |
| 15.0 | 196 | 55 | 1 | square | 0.16 | lead |

t 6 rest。t 16–19（bar 5）全 rest，換氣接 loop。八分／十六分是斷音句，不是彈跳 ostinato。
