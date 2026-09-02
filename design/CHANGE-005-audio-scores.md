# CHANGE-005 譜面接入 audio.ts

## 目標
把已過法律綠燈的 12 條原創可合成譜，接到現有 `AudioEngine.setMode`／`update`，取代現在三模式（title／battle／boss）共用音階的佔位旋律。

## 不變
- 不改 types.ts 戰鬥數字
- 不改畫面
- 第一次點擊才 `unlock`
- `bgm_king_slime` 用修正條（全音符踏步＋音尾下垂），禁用票２原彈跳版
- 作曲不改 `audio.ts`；主程式才改

## 模式對應（先這層，角色主題／絕招 stip 可第二刀）
- title → 標題／選角（可先用 storm 慢版或獨立 title cue）
- battle → 依關卡：暴風小徑 `bgm_storm`、迷霧深林 `bgm_mist`、魔王祭壇 `bgm_altar`
- boss → 晶黏帝 `bgm_king_slime`（修正條）、其餘王後續

## DoD
- 進戰鬥聽得到對應關 BGM，進王戰切到王曲
- 靜音開關仍有效
- SW 可 bump 一版；法律維持綠
