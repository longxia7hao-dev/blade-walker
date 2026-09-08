using BladeWalker.Remake.Combat;
using BladeWalker.Remake.World;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    /// <summary>
    /// HUD-002 P0 runtime IMGUI: Title / Char / Play / Pause / Result.
    /// Colors FROZEN from design/HUD-COLOR-TOKENS.md. CTA gold #D4A526 solid + button-ink; primary #3A9CFF accent only.
    /// Hang-point IDs noted in comments.
    /// </summary>
    public sealed class MobileHud : MonoBehaviour
    {
        private GameBootstrap _flow;
        private PlayerRouteMotor _runner;
        private HeroVitals _vitals;
        private HeroCombat _combat;
        private EncounterDirector _encounters;
        private bool _playBound;

        private GUIStyle _panel;
        private GUIStyle _title;
        private GUIStyle _headline;
        private GUIStyle _small;
        private GUIStyle _muted;
        private GUIStyle _button;
        private GUIStyle _ctaButton;
        private GUIStyle _ghostButton;
        private GUIStyle _comboStyle;
        private Font _hudFont;

        private Texture2D _texPanel;
        private Texture2D _texPanelDeep;
        private Texture2D _texCta;
        private Texture2D _texCtaHover;
        private Texture2D _texGhost;
        private Texture2D _texGhostHover;
        private Texture2D _texWhite;
        private Texture2D _circleSoft;

        private readonly Texture2D[] _portraits = new Texture2D[3];
        private readonly bool[] _portraitTried = new bool[3];

        private float _tipShownAt = -1f;
        private const float TipDuration = 4.2f;
        private const float TipFade = 1.1f;

        public void InitializeShell(GameBootstrap flow) { _flow = flow; }

        public void BindPlay(PlayerRouteMotor runner, HeroVitals vitals, HeroCombat combat, EncounterDirector encounters)
        {
            UnbindPlay();
            _runner = runner;
            _vitals = vitals;
            _combat = combat;
            _encounters = encounters;
            _playBound = true;
            _tipShownAt = Time.unscaledTime;
            encounters.BossDefeated += HandleVictory;
            vitals.Defeated += HandleDefeat;
        }

        public void UnbindPlay()
        {
            if (_encounters != null) _encounters.BossDefeated -= HandleVictory;
            if (_vitals != null) _vitals.Defeated -= HandleDefeat;
            _runner = null;
            _vitals = null;
            _combat = null;
            _encounters = null;
            _playBound = false;
        }

        private void OnDestroy() { UnbindPlay(); }

        private void OnGUI()
        {
            if (_flow == null) return;
            EnsureStyles();
            float scale = Mathf.Min(Screen.width / 1080f, Screen.height / 1920f);
            float offsetX = (Screen.width - 1080f * scale) * 0.5f;
            float offsetY = (Screen.height - 1920f * scale) * 0.5f;
            Matrix4x4 previous = GUI.matrix;
            GUI.matrix = Matrix4x4.TRS(new Vector3(offsetX, offsetY, 0f), Quaternion.identity, Vector3.one * scale);
            switch (_flow.ActiveScreen)
            {
                case UiScreen.Title: DrawTitleScreen(); break;
                case UiScreen.CharSelect: DrawCharScreen(); break;
                case UiScreen.Play: DrawPlayHud(); break;
                case UiScreen.Pause: DrawPlayHud(); DrawPauseOverlay(); break;
                case UiScreen.Result: DrawPlayHud(); DrawResultOverlay(); break;
            }
            GUI.matrix = previous;
        }

        private void DrawTitleScreen()
        {
            DrawVignette();
            GUI.Label(new Rect(140f, 120f, 800f, 36f), "幻史斷章", Style(_muted, 26, TextAnchor.MiddleCenter));
            DrawUnderline(new Rect(430f, 156f, 220f, 2f), HudTokens.LineGold);
            GUI.Label(new Rect(90f, 180f, 900f, 96f), "魔刃行者", Style(_headline, 72, TextAnchor.MiddleCenter));
            GUI.Label(new Rect(140f, 278f, 800f, 40f), "自動行走 · 斬魔冒險", Style(_small, 28, TextAnchor.MiddleCenter));
            Rect sliceRect = new Rect(260f, 340f, 560f, 56f);
            DrawRoundedBox(sliceRect, _texPanel, HudTokens.LineCyan);
            GUI.Label(sliceRect, "暴風神社切片", Style(_title, 30, TextAnchor.MiddleCenter));
            Rect logo = new Rect(340f, 460f, 400f, 400f);
            DrawCircleFrame(logo, HudTokens.LineGold);
            GUI.Label(new Rect(340f, 620f, 400f, 80f), "刃影", Style(_muted, 36, TextAnchor.MiddleCenter));
            GUI.Label(new Rect(340f, 880f, 400f, 36f), "Logo / 刃影", Style(_muted, 22, TextAnchor.MiddleCenter));
            DrawRoundedBox(new Rect(90f, 1080f, 900f, 620f), _texPanelDeep, HudTokens.LineCyan);
            // TitleStartBtn
            if (DrawCtaButton(new Rect(160f, 1180f, 760f, 120f), "開始獵魔")) _flow.TitleStart();
            // TitleMuteSfx / TitleMuteBgm
            if (DrawGhostButton(new Rect(160f, 1340f, 360f, 88f), _flow.MuteSfx ? "音效：關" : "音效：開")) _flow.ToggleMuteSfx();
            if (DrawGhostButton(new Rect(560f, 1340f, 360f, 88f), _flow.MuteBgm ? "音樂：關" : "音樂：開")) _flow.ToggleMuteBgm();
        }

        private void DrawCharScreen()
        {
            DrawVignette();
            GUI.Label(new Rect(90f, 110f, 900f, 64f), "選擇獵魔者", Style(_headline, 44, TextAnchor.MiddleCenter));
            DrawCharCard(SliceHeroId.Sword, new Rect(48f, 240f, 312f, 880f));
            DrawCharCard(SliceHeroId.Gun, new Rect(384f, 240f, 312f, 880f));
            DrawCharCard(SliceHeroId.Mage, new Rect(720f, 240f, 312f, 880f));
            GUI.Label(new Rect(90f, 1140f, 900f, 40f), "頭像用立繪，非場上膠囊", Style(_muted, 24, TextAnchor.MiddleCenter));
            // CharDepartBtn / CharBackBtn
            if (DrawCtaButton(new Rect(120f, 1240f, 840f, 120f), "出發", _flow.HasSelectedHero)) _flow.CharDepart();
            if (DrawGhostButton(new Rect(120f, 1400f, 840f, 100f), "返回")) _flow.CharBack();
        }

        private void DrawCharCard(SliceHeroId id, Rect rect)
        {
            bool selected = _flow.HasSelectedHero && _flow.SelectedHero == id;
            Color accent = GameBootstrap.HeroAccent(id);
            DrawRoundedBox(rect, selected ? _texPanel : _texPanelDeep, selected ? accent : HudTokens.LineCyan, selected ? 4f : 2f);
            DrawPortrait(new Rect(rect.x + 28f, rect.y + 36f, rect.width - 56f, 360f), id, accent);
            GUI.Label(new Rect(rect.x + 16f, rect.y + 420f, rect.width - 32f, 48f), GameBootstrap.HeroDisplayName(id), Style(_title, 34, TextAnchor.MiddleCenter));
            Rect role = new Rect(rect.x + 70f, rect.y + 480f, rect.width - 140f, 48f);
            DrawPill(role, accent);
            GUI.Label(role, GameBootstrap.HeroRoleName(id), Style(_small, 24, TextAnchor.MiddleCenter));
            if (selected)
                GUI.Label(new Rect(rect.x + 16f, rect.y + rect.height - 90f, rect.width - 32f, 48f), "已選", Style(_title, 28, TextAnchor.MiddleCenter));
            if (GUI.Button(rect, GUIContent.none, GUIStyle.none)) _flow.SelectHero(id);
        }

        private void DrawPlayHud()
        {
            if (!_playBound || _vitals == null || _runner == null) return;
            DrawRoundedBox(new Rect(36f, 56f, 1008f, 150f), _texPanel, HudTokens.LineCyan);
            // HudPortrait
            DrawPortraitCircle(new Rect(56f, 74f, 112f, 112f), _flow.SelectedHero, GameBootstrap.HeroAccent(_flow.SelectedHero));
            GUI.Label(new Rect(184f, 72f, 280f, 36f), _flow.SelectedHeroDisplayName, _title);
            // HudHpBar / HudHpText
            float healthRatio = _vitals.MaxHealth <= 0 ? 0f : _vitals.Health / (float)_vitals.MaxHealth;
            Color hpFill = healthRatio <= 0.30f ? HudTokens.Danger : HudTokens.Hp;
            DrawBar(new Rect(184f, 114f, 420f, 28f), healthRatio, hpFill, HudTokens.PanelDeep);
            GUI.Label(new Rect(184f, 148f, 420f, 28f), string.Format("HP {0}/{1}", _vitals.Health, _vitals.MaxHealth), _small);
            // HudStageLabel / HudProgress
            int pct = Mathf.RoundToInt(_runner.Progress * 100f);
            GUI.Label(new Rect(620f, 72f, 300f, 36f), "暴風神社 · 切片", _title);
            DrawBar(new Rect(620f, 114f, 300f, 18f), _runner.Progress, HudTokens.Primary, HudTokens.PanelDeep);
            GUI.Label(new Rect(620f, 138f, 300f, 28f), pct + "%", _muted);
            // HudPauseBtn
            if (DrawCircleButton(new Rect(940f, 78f, 80f, 80f), "II") && _flow.ActiveScreen == UiScreen.Play)
                _flow.OpenPause();
            if (!string.IsNullOrEmpty(_flow.SliceCombatNote))
                GUI.Label(new Rect(56f, 220f, 700f, 32f), _flow.SliceCombatNote, _muted);
            EnemyMotor boss = _encounters != null ? _encounters.ActiveBoss : null;
            if (boss != null)
            {
                DrawRoundedBox(new Rect(120f, 230f, 840f, 90f), _texPanel, HudTokens.LineGold);
                GUI.Label(new Rect(150f, 242f, 780f, 34f), "晶黏帝 · SLIME KING", _title);
                DrawBar(new Rect(150f, 284f, 780f, 18f), boss.HealthRatio, HudTokens.Ember, HudTokens.PanelDeep);
            }
            DrawComboFeedback();
            DrawBranchDecision();
            DrawUltPlaceholder(new Rect(860f, 1580f, 160f, 160f));
            DrawTip();
        }

        private void DrawTip()
        {
            if (_tipShownAt < 0f) return;
            float age = Time.unscaledTime - _tipShownAt;
            if (age > TipDuration + TipFade) return;
            float alpha = age <= TipDuration ? 1f : 1f - Mathf.Clamp01((age - TipDuration) / TipFade);
            Color prev = GUI.color;
            GUI.color = new Color(1f, 1f, 1f, alpha);
            Rect tip = new Rect(200f, 1688f, 520f, 64f);
            DrawRoundedBox(tip, _texPanel, HudTokens.LineGold);
            GUI.Label(tip, "輕點斬擊 · 自動前進", Style(_small, 26, TextAnchor.MiddleCenter));
            GUI.color = prev;
        }

        private void DrawUltPlaceholder(Rect rect)
        {
            DrawCircleFrame(rect, HudTokens.LineGold);
            Color prev = GUI.color;
            GUI.color = new Color(HudTokens.Button.r, HudTokens.Button.g, HudTokens.Button.b, 0.35f);
            GUI.DrawTexture(Inset(rect, 18f), _circleSoft);
            GUI.color = prev;
            GUI.Label(rect, "絕", Style(_headline, 48, TextAnchor.MiddleCenter));
        }

        private void DrawBranchDecision()
        {
            if (_runner == null || !_runner.BranchDecisionOpen) return;
            if (_flow.ActiveScreen != UiScreen.Play) return;
            DrawRoundedBox(new Rect(90f, 610f, 900f, 320f), _texPanel, HudTokens.LineGold);
            GUI.Label(new Rect(130f, 640f, 820f, 52f), "前方岔路 — 選擇真正的行進方向", _title);
            GUI.Label(new Rect(130f, 698f, 820f, 36f), "也可直接向左／向右滑動選路", _small);
            if (DrawCtaButton(new Rect(130f, 770f, 376f, 112f), "← 左轉 · 神社道"))
                _runner.CommitBranch(BranchChoice.Left);
            if (DrawGhostButton(new Rect(574f, 770f, 376f, 112f), "右轉 · 遺跡道 →"))
                _runner.CommitBranch(BranchChoice.Right);
        }

        private void DrawComboFeedback()
        {
            if (_combat == null || _combat.Combo <= 0) return;
            Color previous = _comboStyle.normal.textColor;
            _comboStyle.normal.textColor = _combat.LastSliceWasCritical ? HudTokens.Button : HudTokens.Frost;
            string label = _combat.LastSliceWasCritical ? ("疾斬 ×" + _combat.Combo) : ("COMBO ×" + _combat.Combo);
            GUI.Label(new Rect(642f, 320f, 370f, 88f), label, _comboStyle);
            _comboStyle.normal.textColor = previous;
        }

        private void DrawPauseOverlay()
        {
            DrawDim();
            DrawRoundedBox(new Rect(140f, 520f, 800f, 760f), _texPanelDeep, HudTokens.LineGold);
            GUI.Label(new Rect(180f, 560f, 720f, 70f), "暫停", Style(_headline, 52, TextAnchor.MiddleCenter));
            if (DrawCtaButton(new Rect(220f, 680f, 640f, 110f), "繼續")) _flow.PauseResume();
            if (DrawGhostButton(new Rect(220f, 820f, 640f, 100f), "重試")) _flow.PauseRetry();
            if (DrawGhostButton(new Rect(220f, 950f, 640f, 100f), "回選角")) _flow.PauseQuit();
            if (DrawGhostButton(new Rect(220f, 1100f, 300f, 80f), _flow.MuteSfx ? "音效：關" : "音效：開")) _flow.ToggleMuteSfx();
            if (DrawGhostButton(new Rect(560f, 1100f, 300f, 80f), _flow.MuteBgm ? "音樂：關" : "音樂：開")) _flow.ToggleMuteBgm();
        }

        private void DrawResultOverlay()
        {
            DrawDim();
            bool win = _flow.ResultIsVictory;
            DrawRoundedBox(new Rect(120f, 520f, 840f, 700f), _texPanelDeep, win ? HudTokens.LineGold : HudTokens.Danger);
            GUI.Label(new Rect(160f, 560f, 760f, 80f), win ? "關卡通關" : "獵魔失敗", Style(_headline, 52, TextAnchor.MiddleCenter));
            if (win)
            {
                DrawCircleFrame(new Rect(460f, 660f, 160f, 160f), HudTokens.Button);
                GUI.Label(new Rect(460f, 660f, 160f, 160f), "OK", Style(_headline, 48, TextAnchor.MiddleCenter));
            }
            else
            {
                Rect stats = new Rect(200f, 680f, 680f, 120f);
                DrawRoundedBox(stats, _texPanel, HudTokens.LineCyan);
                int pct = _runner != null ? Mathf.RoundToInt(_runner.Progress * 100f) : 0;
                GUI.Label(stats, "進度 " + pct + "% · 暴風神社切片", Style(_small, 28, TextAnchor.MiddleCenter));
            }
            if (win)
            {
                if (DrawCtaButton(new Rect(200f, 880f, 320f, 110f), "下一關")) _flow.ResultNext();
                if (DrawGhostButton(new Rect(560f, 880f, 320f, 110f), "回獵場")) _flow.ResultHome();
                GUI.Label(new Rect(160f, 1020f, 760f, 40f), "（目前僅暴風神社切片）", Style(_muted, 22, TextAnchor.MiddleCenter));
            }
            else
            {
                if (DrawCtaButton(new Rect(200f, 880f, 320f, 110f), "重試")) _flow.ResultRetry();
                if (DrawGhostButton(new Rect(560f, 880f, 320f, 110f), "換角色")) _flow.ResultChar();
            }
        }

        private void DrawVignette()
        {
            Color prev = GUI.color;
            GUI.color = new Color(0.05f, 0.07f, 0.11f, 1f);
            GUI.DrawTexture(new Rect(0f, 0f, 1080f, 1920f), _texWhite);
            GUI.color = prev;
        }

        private void DrawDim()
        {
            Color prev = GUI.color;
            GUI.color = HudTokens.OverlayDim;
            GUI.DrawTexture(new Rect(0f, 0f, 1080f, 1920f), _texWhite);
            GUI.color = prev;
        }

        private bool DrawCtaButton(Rect rect, string label, bool enabled = true)
        {
            Color prev = GUI.color;
            if (!enabled) GUI.color = new Color(1f, 1f, 1f, 0.35f);
            DrawBorder(rect, HudTokens.LineGold, 3f);
            bool clicked = enabled && GUI.Button(Inset(rect, 3f), label, _ctaButton);
            GUI.color = prev;
            return clicked;
        }

        private bool DrawGhostButton(Rect rect, string label)
        {
            DrawBorder(rect, HudTokens.LineCyan, 2f);
            return GUI.Button(Inset(rect, 2f), label, _ghostButton);
        }

        private bool DrawCircleButton(Rect rect, string label)
        {
            DrawCircleFrame(rect, HudTokens.LineGold);
            return GUI.Button(rect, label, Style(_title, 28, TextAnchor.MiddleCenter));
        }

        private void DrawRoundedBox(Rect rect, Texture2D fill, Color border, float borderW = 2f)
        {
            GUI.DrawTexture(rect, fill);
            DrawBorder(rect, border, borderW);
        }

        private void DrawBorder(Rect rect, Color color, float thickness)
        {
            Color prev = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(new Rect(rect.x, rect.y, rect.width, thickness), _texWhite);
            GUI.DrawTexture(new Rect(rect.x, rect.yMax - thickness, rect.width, thickness), _texWhite);
            GUI.DrawTexture(new Rect(rect.x, rect.y, thickness, rect.height), _texWhite);
            GUI.DrawTexture(new Rect(rect.xMax - thickness, rect.y, thickness, rect.height), _texWhite);
            GUI.color = prev;
        }

        private void DrawUnderline(Rect rect, Color color)
        {
            Color prev = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(rect, _texWhite);
            GUI.color = prev;
        }

        private void DrawPill(Rect rect, Color fill)
        {
            Color prev = GUI.color;
            GUI.color = new Color(fill.r, fill.g, fill.b, 0.35f);
            GUI.DrawTexture(rect, _texWhite);
            GUI.color = prev;
            DrawBorder(rect, fill, 2f);
        }

        private void DrawBar(Rect rect, float value, Color fill, Color background)
        {
            Color previous = GUI.color;
            GUI.color = background;
            GUI.DrawTexture(rect, _texWhite);
            GUI.color = fill;
            GUI.DrawTexture(new Rect(rect.x, rect.y, rect.width * Mathf.Clamp01(value), rect.height), _texWhite);
            GUI.color = previous;
            DrawBorder(rect, HudTokens.LineGold, 1f);
        }

        private void DrawCircleFrame(Rect rect, Color border)
        {
            Color prev = GUI.color;
            GUI.color = new Color(HudTokens.Panel.r, HudTokens.Panel.g, HudTokens.Panel.b, 0.9f);
            GUI.DrawTexture(rect, _circleSoft);
            GUI.color = border;
            GUI.DrawTexture(rect, _circleSoft);
            GUI.color = new Color(HudTokens.PanelDeep.r, HudTokens.PanelDeep.g, HudTokens.PanelDeep.b, 0.92f);
            GUI.DrawTexture(Inset(rect, 4f), _circleSoft);
            GUI.color = prev;
        }

        private void DrawPortrait(Rect rect, SliceHeroId id, Color accent)
        {
            Texture2D tex = GetPortrait(id);
            DrawBorder(rect, accent, 2f);
            Rect inner = Inset(rect, 2f);
            if (tex != null)
            {
                GUI.DrawTexture(inner, tex, ScaleMode.ScaleAndCrop);
            }
            else
            {
                Color prev = GUI.color;
                GUI.color = new Color(0.2f, 0.24f, 0.3f, 1f);
                GUI.DrawTexture(inner, _texWhite);
                GUI.color = prev;
                GUI.Label(inner, "立繪", Style(_muted, 28, TextAnchor.MiddleCenter));
            }
        }

        private void DrawPortraitCircle(Rect rect, SliceHeroId id, Color accent)
        {
            DrawCircleFrame(rect, accent);
            Texture2D tex = GetPortrait(id);
            Rect inner = Inset(rect, 8f);
            if (tex != null) GUI.DrawTexture(inner, tex, ScaleMode.ScaleAndCrop);
            else GUI.Label(inner, "頭", Style(_muted, 22, TextAnchor.MiddleCenter));
        }

        private Texture2D GetPortrait(SliceHeroId id)
        {
            int index = (int)id;
            if (index < 0 || index > 2) return null;
            if (_portraitTried[index]) return _portraits[index];
            _portraitTried[index] = true;
            _portraits[index] = Resources.Load<Texture2D>(GameBootstrap.HeroPortraitResource(id));
            return _portraits[index];
        }

        private static Rect Inset(Rect rect, float pad)
        {
            return new Rect(rect.x + pad, rect.y + pad, rect.width - pad * 2f, rect.height - pad * 2f);
        }

        private GUIStyle Style(GUIStyle basis, int size, TextAnchor align)
        {
            return new GUIStyle(basis) { fontSize = size, alignment = align };
        }

        private void EnsureStyles()
        {
            if (_panel != null) return;
            _texWhite = Texture2D.whiteTexture;
            _texPanel = MakeTexture(HudTokens.Panel);
            _texPanelDeep = MakeTexture(HudTokens.PanelDeep);
            _texCta = MakeTexture(HudTokens.Button);
            _texCtaHover = MakeTexture(new Color(0.90f, 0.72f, 0.22f, 1f));
            _texGhost = MakeTexture(new Color(HudTokens.Panel.r, HudTokens.Panel.g, HudTokens.Panel.b, 0.92f));
            _texGhostHover = MakeTexture(new Color(HudTokens.Primary.r, HudTokens.Primary.g, HudTokens.Primary.b, 0.55f));
            _circleSoft = MakeCircleTexture(128, Color.white);
            _hudFont = Resources.Load<Font>("Fonts/NotoSansTC-Subset");
            _panel = new GUIStyle(GUI.skin.box) { normal = { background = _texPanel } };
            _title = new GUIStyle(GUI.skin.label)
            {
                font = _hudFont, fontSize = 32, fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleLeft, normal = { textColor = HudTokens.Ink },
            };
            _headline = new GUIStyle(_title) { fontSize = 56, alignment = TextAnchor.MiddleCenter };
            _small = new GUIStyle(GUI.skin.label)
            {
                font = _hudFont, fontSize = 26, alignment = TextAnchor.MiddleLeft,
                normal = { textColor = HudTokens.Ink },
            };
            _muted = new GUIStyle(_small) { fontSize = 24, normal = { textColor = HudTokens.Muted } };
            _button = new GUIStyle(GUI.skin.button)
            {
                font = _hudFont, fontSize = 32, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter,
                normal = { background = _texGhost, textColor = HudTokens.Ink },
                hover = { background = _texGhostHover, textColor = HudTokens.Ink },
                active = { background = _texGhostHover, textColor = HudTokens.Ink },
            };
            _ctaButton = new GUIStyle(_button)
            {
                fontSize = 36,
                normal = { background = _texCta, textColor = HudTokens.ButtonInk },
                hover = { background = _texCtaHover, textColor = HudTokens.ButtonInk },
                active = { background = _texCtaHover, textColor = HudTokens.ButtonInk },
            };
            _ghostButton = new GUIStyle(_button) { fontSize = 30 };
            _comboStyle = new GUIStyle(_title)
            {
                fontSize = 52, alignment = TextAnchor.MiddleRight, normal = { textColor = HudTokens.Frost },
            };
        }

        private static Texture2D MakeTexture(Color color)
        {
            Texture2D texture = new Texture2D(1, 1, TextureFormat.RGBA32, false);
            texture.wrapMode = TextureWrapMode.Clamp;
            texture.filterMode = FilterMode.Bilinear;
            texture.SetPixel(0, 0, color);
            texture.Apply();
            return texture;
        }

        private static Texture2D MakeCircleTexture(int size, Color color)
        {
            Texture2D texture = new Texture2D(size, size, TextureFormat.RGBA32, false);
            texture.wrapMode = TextureWrapMode.Clamp;
            texture.filterMode = FilterMode.Bilinear;
            float r = (size - 1) * 0.5f;
            Vector2 c = new Vector2(r, r);
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float d = Vector2.Distance(new Vector2(x, y), c);
                    float a = Mathf.Clamp01(r - d + 0.5f);
                    texture.SetPixel(x, y, new Color(color.r, color.g, color.b, color.a * a));
                }
            }
            texture.Apply();
            return texture;
        }

        private void HandleVictory() { if (_flow != null) _flow.NotifyVictory(); }
        private void HandleDefeat() { if (_flow != null) _flow.NotifyDefeat(); }
    }
}
