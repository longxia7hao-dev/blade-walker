# HUD 可點流 — 源碼就緒（等 Unity 建置路徑）

**狀態：** 源碼整理就緒 · **未**打 WebGL（總監：未獲路徑前不假打）  
**範圍：** 暴風神社切片（標題／局內明標）  
**視覺：** `design/hud/final-01～04`＋`design/HUD-COLOR-TOKENS.md`（金滿塗 CTA `#D4A526`）

## 已落地檔
- `Runtime/Core/GameBootstrap.cs` — Title→Char→Play；TearDown＋Rebuild 重試
- `Runtime/Core/SliceHeroId.cs` — sword/gun/mage
- `Runtime/Presentation/MobileHud.cs` — 四屏＋Pause／Result 可點
- `Runtime/Presentation/HudTokens.cs` — 凍結色板
- `Runtime/Combat/SwipeBladeController.cs` — 非 Play 閘輸入
- `Resources/UI/Portraits/{baishuang,chiyan,cangyan}.png`

## 驗收（Editor Play）
開始獵魔 → 選角出發 → 局內 → 敗北／通關可點重試；無「重進播放模式」。

## 建置（有 `UNITY_EDITOR` 後）
```bash
./scripts/build-unity-webgl.sh
./scripts/deploy-unity-preview.sh   # 新目錄，不蓋舊日光場
```

膠囊場上仍在＝非美術過關。白霜 mid 等美術總監驗過再接。
