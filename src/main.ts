import './style.css';
import { Game } from './game';
import { preventBrowserChrome, registerPwa, setupInstallHint } from './mobile';

preventBrowserChrome();
setupInstallHint();
registerPwa();
new Game();
