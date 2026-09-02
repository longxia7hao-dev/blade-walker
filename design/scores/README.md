# 譜表（CHANGE-005）

給主程式貼進 `src/audio.ts`／`src/bgm-cues.ts`。作曲不改 `audio.ts`。

## 第一刀（已進包 SW v19）

| 檔 | cue | 對應 |
|---|---|---|
| [bgm_storm.md](bgm_storm.md) | bgm_storm | battle／暴風小徑 |
| [bgm_mist.md](bgm_mist.md) | bgm_mist | battle／迷霧深林 |
| [bgm_altar.md](bgm_altar.md) | bgm_altar | battle／魔王祭壇 |
| [bgm_king_slime.md](bgm_king_slime.md) | bgm_king_slime | boss／晶黏帝（**修正條**，票２彈跳版禁用） |

## 第二刀（已進包 SW v20）

| 檔 | cue | 對應 |
|---|---|---|
| [theme_sword.md](theme_sword.md) | theme_sword | 選角高亮白霜；關內可 1 聲 gain 0.06 微疊 |
| [theme_gun.md](theme_gun.md) | theme_gun | 選角高亮赤煙 |
| [theme_mage.md](theme_mage.md) | theme_mage | 選角高亮蒼焰 |
| [stip_ult_sword.md](stip_ult_sword.md) | stip_ult_sword | 白霜絕招，sfxBus 一發 |
| [stip_ult_gun.md](stip_ult_gun.md) | stip_ult_gun | 赤煙絕招，sfxBus 一發 |
| [stip_ult_mage.md](stip_ult_mage.md) | stip_ult_mage | 蒼焰絕招，sfxBus 一發 |


## 第三刀（本批）

| 檔 | cue | 對應 |
|---|---|---|
| [bgm_title.md](bgm_title.md) | title | 標題＋選角／選關底床（`setMode('title')`）。選角時 theme_* full 疊在上面，故本曲中低、留空給主題 |
| [bgm_king_wraith.md](bgm_king_wraith.md) | king_wraith | boss／幽靈王 |
| [bgm_king_demon.md](bgm_king_demon.md) | king_demon | boss／魔王 |

## 貼碼契約

- 主題：`t_beat` 從迴圈 0。一拍 = `60/BPM` 秒。`t_sec = t_beat * (60/BPM)`。
- 絕招 stip：`t_sec` 從觸發 0。不迴圈。走 `sfxBus`（現 0.9），BGM 不停。取代現行 `ultSword`／`ultGun`／`ultMage`。
- `dur_beats`：時值（拍）。`dur_sec`／`ds` 若有則以秒為準。
- `wave`：`sine` / `triangle` / `square` / `sawtooth` / `noise`。`noise` 的 `freq_hz` 是帶通中心。
- `gain`：該聲部相對 0–1。主題再乘 `bgmBus` 0.22；stip 再乘 `sfxBus` 0.9。
- 主題／BGM `loop`：硬切回 `t_beat=0`。尾音 decay ≤ 一拍。
- `title`：標題單獨播；選角／選關與 theme_* full 並行，勿蓋主題中高音。
- 最多 4 聲部同時。無採樣、無他人旋律。實作勿排成著名遊戲鉤子。
- 第一次點擊才 `unlock`。靜音開關維持。

Hz 為 A4=440 四捨五入整數。MIDI 一併給。原創「刃」細胞 A3–C4–F4–E4（220–262–349–330）各曲移調。
