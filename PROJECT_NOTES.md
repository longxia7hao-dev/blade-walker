# 專案共享筆記（Claude Code × Codex）

## 專案是什麼

《魔刃行者》是手機優先的 3D 斬擊遊戲；根目錄為已上線的 Three.js/PWA 原型，`unity/BladeWalkerRemake/` 為 Unity 6 + URP 原生重製。近期交付目標是提供可由 iPhone Safari 直接開啟的 Unity WebGL 試玩版，同時保留既有網頁版。

## 目前狀態

- 最後更新：2026-09-06 10:42（Codex）
- 進度：Unity WebGL 手機試玩版已發布；睿哥回報目前環境太暗、人物與魔物難以辨識，正在調整為日間暴風神社並準備新版 WebGL。既有版本仍在 `https://longxia7hao-dev.github.io/blade-walker/unity-preview/20260905-e5bdec7/`。
- 進行中作業：Codex｜目標為日間環境、人物／魔物可讀性、WebGL 重建與版本化 Pages 發布；開始於 2026-09-06 10:42。

## 睿哥的指示與決策

- 先製作「Unity WebGL 手機試玩版」，讓 iPhone 可直接以網址測試。
- Unity 重製版需保留既有 Three.js/PWA 網頁遊戲，不可直接覆蓋舊版入口。
- 背景環境改為日間，提高人物與魔物的辨識度；由 Codex 完成後再交由睿哥以 iPhone 測試。

## 踩坑與注意事項

- 專案原先只有 GitHub 遠端副本；Codex 於 2026-09-04 複製到本機 `/Users/longxia7hao/blade-walker`。
- 正式 Unity 美術資產尚未匯入，目前重製版以可替換的 proxy 角色驗證玩法。
- Unity 安裝在 `/Users/longxia7hao/Applications/Unity/Hub/Editor/6000.0.42f1`，含 WebGL Support；Unity Personal 授權已可供批次建置。
- GitHub Pages 根站由 orphan `gh-pages` 分支提供。Unity 成品只可新增至版本化 `unity-preview/<build-id>/`，普通 fast-forward push，禁止覆蓋根站或 force-push。
- URP 17 的 `LoadBuiltinRendererData` 會先建立獨立 Renderer Asset；不可再對同一物件呼叫 `AddObjectToAsset`。
- WebGL 會裁剪僅由 `Shader.Find` 與 `GameObject.CreatePrimitive` 反射取得的資源；目前以 Resources 基底材質保留實用 shader 變體，並由 `link.xml` 精準保留 Box/Sphere Collider。
- HUD 使用 Google Fonts Noto Sans TC 的 90 KB 字形子集（SIL OFL 1.1），避免 iPhone WebGL 的內建字型顯示方框。

## 變更日誌（新的在上）

- 2026-09-06｜Codex｜發布版本化 Unity WebGL 試玩版（main `e5bdec7`、gh-pages `b9817f4`）；Pages 建置成功，線上所有 5 個成品檔與根頁皆回應 200，部署 tree 只新增 `.nojekyll` 與 `unity-preview/20260905-e5bdec7/`。以 393×852／852×393 驗證直式遊戲、拖曳操作、零 console warning/error 與橫式提示，舊站未變更。
- 2026-09-05｜Codex｜完成 Unity 登入／Personal 授權與三輪真實 WebGL 修正：解決 runtime shader 黑畫面、Collider stripping、繁中字型缺字及 WebGL 方向鎖定警告；手機直式與橫向提示測試均通過，最終 browser console 零錯誤。
- 2026-09-05｜Codex｜安裝 Unity 6000.0.42f1＋WebGL；新增批次建置、安全部署與 iPhone Web 模板；修正 URP Renderer 重複掛載；WebGL 改鎖 30 FPS。`npm run check` 通過，真實 Unity 建置因尚未接受 Hub 條款／無授權而在匯入前停止。
- 2026-09-04｜Codex｜建立非交易專案共享筆記並登記 Unity WebGL 手機試玩版接手作業。
