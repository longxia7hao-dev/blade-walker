# bgm_king_slime 晶黏帝（修正條）

**本檔取代票２原條。票２跳八度 Bass／十六分彈跳版禁用，接 setMode 只用這份。**

原創。刃細胞 F4–A4–D5–C5（349–440–587–523）；末 4 小節改 F–Ab–Db–C（349–415–554–523）。法律複掃綠。禁止 DQ 圓舞彈跳、禁止著名遊戲鉤子。

拿掉：F2↔F3 跳八度、16 分斷音彈跳、3/4 或強弱弱圓舞感。

## 元資料

| 欄 | 值 |
|---|---|
| cue | bgm_king_slime |
| 畫面 | 晶黏帝擂台（關1 終王） |
| 調性 | 前 14 小節 F Mixolydian（F G A Bb C D Eb）；15–18 F 小調色彩（F Ab Bb C Db Eb） |
| BPM | 132 |
| 拍號 | 4/4（不是 3/4） |
| 小節 | 18 |
| 一拍秒 | 60/132 = 0.454545 |
| loop 點 | t_beat 0（硬切） |
| loop 長 | 32.727s（18×4×60/132） |
| 總音量 | 0.18 |
| 迴圈 | 是 |
| 音尾 | 每個 lead 音結束前 80ms，`frequency.linearRampToValueAtTime(freq * 0.9828, end)`（-30 cent 下垂）。Bass／sub／hat 不垂。 |

## 聲部

| voice | wave | gain | 備註 |
|---|---|---|---|
| bass | sine | 0.20 | 全音符踏步，黏重不是彈 |
| lead | triangle | 0.12 | 長音＋音尾下垂 |
| sub | sawtooth | 0.12 | 僅 bars 15–18 拍 1，F1，加壓不踩蹦 |
| hat | noise | 0.03 | BP 1800，dur_sec 0.03，**只在拍 3**（弱拍輕擦） |

## bass 全迴圈（全音符）

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 0 | 87 | 41 | 4 | sine | 0.20 | bass |
| 4 | 87 | 41 | 4 | sine | 0.20 | bass |
| 8 | 87 | 41 | 4 | sine | 0.20 | bass |
| 12 | 87 | 41 | 4 | sine | 0.20 | bass |
| 16 | 87 | 41 | 4 | sine | 0.20 | bass |
| 20 | 87 | 41 | 4 | sine | 0.20 | bass |
| 24 | 78 | 39 | 4 | sine | 0.20 | bass |
| 28 | 73 | 38 | 4 | sine | 0.20 | bass |
| 32 | 87 | 41 | 4 | sine | 0.20 | bass |
| 36 | 87 | 41 | 4 | sine | 0.20 | bass |
| 40 | 87 | 41 | 4 | sine | 0.20 | bass |
| 44 | 87 | 41 | 4 | sine | 0.20 | bass |
| 48 | 87 | 41 | 4 | sine | 0.20 | bass |
| 52 | 87 | 41 | 4 | sine | 0.20 | bass |
| 56 | 87 | 41 | 4 | sine | 0.20 | bass |
| 60 | 82 | 40 | 4 | sine | 0.20 | bass |
| 64 | 78 | 39 | 4 | sine | 0.20 | bass |
| 68 | 87 | 41 | 4 | sine | 0.20 | bass |

bars 1–4（t 0–15）：F2。5–8（16–31）：F F Eb D。9–14（32–55）：F。15–18（56–71）：F E Eb F。

## lead 全迴圈（音尾 -30 cent／80ms）

| t_beat | freq_hz | midi | dur_beats | wave | gain | voice | droop |
|---:|---:|---:|---:|---|---:|---|---|
| 0 | 349 | 65 | 2 | triangle | 0.12 | lead | 是 |
| 2 | 440 | 69 | 2 | triangle | 0.12 | lead | 是 |
| 4 | 587 | 74 | 1 | triangle | 0.12 | lead | 是 |
| 5 | 523 | 72 | 1 | triangle | 0.12 | lead | 是 |
| 6 | 440 | 69 | 2 | triangle | 0.12 | lead | 是 |
| 8 | 349 | 65 | 4 | triangle | 0.12 | lead | 是 |
| 14 | 262 | 60 | 2 | triangle | 0.12 | lead | 是 |
| 16 | 349 | 65 | 2 | triangle | 0.12 | lead | 是 |
| 18 | 440 | 69 | 2 | triangle | 0.12 | lead | 是 |
| 20 | 587 | 74 | 1 | triangle | 0.12 | lead | 是 |
| 21 | 523 | 72 | 1 | triangle | 0.12 | lead | 是 |
| 22 | 440 | 69 | 2 | triangle | 0.12 | lead | 是 |
| 24 | 349 | 65 | 4 | triangle | 0.12 | lead | 是 |
| 30 | 262 | 60 | 2 | triangle | 0.12 | lead | 是 |
| 32 | 349 | 65 | 2 | triangle | 0.12 | lead | 是 |
| 34 | 440 | 69 | 2 | triangle | 0.12 | lead | 是 |
| 36 | 587 | 74 | 1 | triangle | 0.12 | lead | 是 |
| 37 | 523 | 72 | 1 | triangle | 0.12 | lead | 是 |
| 38 | 440 | 69 | 2 | triangle | 0.12 | lead | 是 |
| 40 | 175 | 53 | 4 | triangle | 0.12 | lead | 是 |
| 48 | 349 | 65 | 2 | triangle | 0.12 | lead | 是 |
| 50 | 440 | 69 | 2 | triangle | 0.12 | lead | 是 |
| 52 | 175 | 53 | 4 | triangle | 0.12 | lead | 是 |
| 56 | 349 | 65 | 4 | triangle | 0.12 | lead | 是 |
| 60 | 415 | 68 | 4 | triangle | 0.12 | lead | 是 |
| 64 | 554 | 73 | 4 | triangle | 0.12 | lead | 是 |
| 68 | 523 | 72 | 4 | triangle | 0.12 | lead | 是 |

t 8–11 與 24–27 為全音符 F4。t 40–43 與 52–55 為低 F3 長音（不是跳八度 ostinato）。t 56–71 小調細胞各全音符，無斷音。

## sub（僅 15–18）

| t_beat | freq_hz | midi | dur_sec | wave | gain | voice |
|---:|---:|---:|---:|---|---:|---|
| 56 | 44 | 29 | 0.50 | sawtooth | 0.12 | sub |
| 60 | 44 | 29 | 0.50 | sawtooth | 0.12 | sub |
| 64 | 44 | 29 | 0.50 | sawtooth | 0.12 | sub |
| 68 | 44 | 29 | 0.50 | sawtooth | 0.12 | sub |

F1≈43.65 → 44。只在該小節拍 1，不連續蹦。

## hat

`for bar in 0..17: noise BP 1800，t_beat = bar*4 + 2（拍 3），dur_sec 0.03，gain 0.03`。

## 禁

- 不要 F2↔F3 每拍跳
- 不要 16 分 staccato 彈跳
- 不要 3/4 圓舞
- 不要 DQ 史萊姆蹦跳節奏
