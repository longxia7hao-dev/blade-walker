import './style.css';
import { preventBrowserChrome, registerPwa, setupInstallHint } from './mobile';
import { bindRuntimeIssueControls, showRuntimeIssue } from './runtime-ui';

preventBrowserChrome();
setupInstallHint();
registerPwa();
bindRuntimeIssueControls();

// Let the title shell paint before parsing Three.js and the combat runtime.
requestAnimationFrame(() => {
  void import('./game')
    .then(({ Game }) => new Game())
    .catch((error: unknown) => {
      console.error('Game startup failed', error);
      showRuntimeIssue(
        '無法啟用 3D 畫面',
        '請關閉其他分頁後重新載入；若仍無法開啟，請確認瀏覽器已啟用硬體加速與 WebGL。',
      );
    });
});
