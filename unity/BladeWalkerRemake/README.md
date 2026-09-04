# 魔刃行者 Unity 3D 重製版

這是《魔刃行者》的原生行動版垂直切片工程。既有的 Three.js/PWA 版本仍留在儲存庫根目錄，兩者不互相覆蓋。

## 已完成的可玩範圍

- 白霜第三人稱自動前進、自由橫向移動；移動量以公尺計算，沒有 lane snap。
- 水果忍者式螢幕滑斬：手指軌跡穿過怪物才命中，一筆可連斬多隻，速度越快傷害越高並可觸發疾斬暴擊。
- 霜藍刀光即時跟手，命中會出現碎晶噴濺、切裂碎片、鏡頭打擊感與 Combo 回饋。
- 單一路面在神社岔口分成兩條真實的世界座標曲線。選左或右後，角色、鏡頭、敵人生成方向與擂台位置都跟著轉向。
- 五種一般敵人運動：地面追擊、連續跳躍、空中盤旋俯衝、道路外側包抄、遠程射擊。
- 同一波敵人使用不同深度、橫向位置、高度與出手節拍，禁止排成一列。
- 終點停步進入晶黏帝擂台戰；白霜可攻擊地面或空中的敵人。
- Unity 6 + URP、Linear color、ACES、Bloom、色彩分級、霧、軟陰影、濕地表 shader、雨與雷光。
- 編輯器首次開啟會自動建立 URP Asset 與 `StormShrineVerticalSlice` 場景。

## 開啟與執行

1. 使用 Unity Hub，以 Unity `6000.0` 系列開啟本資料夾。
2. 等待 Package Manager 匯入 URP 17。
3. 若場景沒有自動開啟，執行選單 `Blade Walker > Rebuild Storm Shrine Vertical Slice`。
4. 開啟 `Assets/Scenes/StormShrineVerticalSlice.unity` 並按 Play。

目前程式庫只提供可替換的 proxy 角色，目的在先驗證移動、轉彎、鏡頭、遭遇與戰鬥。要達到商用品質，下一步必須匯入符合 `ART_ASSET_CONTRACT.md` 的綁骨 FBX、動畫與 PBR 貼圖；只調燈光不會讓 proxy 變成《傳說對決》級角色。

正式 prefab 放到下列 Resources 路徑後會自動取代 proxy，不必改 gameplay code：

- `Assets/Resources/Production/Heroes/Baishuang.prefab`
- `Assets/Resources/Production/Enemies/CrystalSlimeKing.prefab`
- 其餘敵人名稱：`GroundStalker`、`Hopper`、`AerialWraith`、`SideFlanker`、`CrystalArtillery`

## 操作

- 手機：上方 76% 滑過怪物斬擊；下方 24% 左右拖曳自由側移，支援雙指同時操作。岔路可按按鈕或朝該方向滑動。
- 電腦：上方區域按住滑鼠拖曳斬擊；`A/D` 或方向鍵移動，`Space/J` 疾斬。

## 主要程式

- `RouteSpline.cs`：弧長取樣的 Bezier 路徑與世界座標分支。
- `PlayerRouteMotor.cs`：非三線自由移動、真實轉向、後續路徑取樣。
- `EncounterDirector.cs`：多高度、多方向、錯開深度的遭遇編排。
- `EnemyMotor.cs`：飛行、跳躍、側襲、射擊與魔王行為。
- `StormShrineWorld.cs`：連續路面、岔路、擂台與場景生成。
- `QualityDirector.cs`：URP 行動畫質與後製設定。
