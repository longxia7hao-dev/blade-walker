using BladeWalker.Remake.Combat;
using BladeWalker.Remake.World;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    public sealed class MobileHud : MonoBehaviour
    {
        private PlayerRouteMotor _runner;
        private HeroVitals _vitals;
        private HeroCombat _combat;
        private EncounterDirector _encounters;
        private GUIStyle _panel;
        private GUIStyle _title;
        private GUIStyle _small;
        private GUIStyle _button;
        private GUIStyle _comboStyle;
        private Font _hudFont;
        private bool _victory;
        private bool _defeat;

        public void Initialize(
            PlayerRouteMotor runner,
            HeroVitals vitals,
            HeroCombat combat,
            EncounterDirector encounters)
        {
            _runner = runner;
            _vitals = vitals;
            _combat = combat;
            _encounters = encounters;
            encounters.BossDefeated += HandleVictory;
            vitals.Defeated += HandleDefeat;
        }

        private void OnDestroy()
        {
            if (_encounters != null) _encounters.BossDefeated -= HandleVictory;
            if (_vitals != null) _vitals.Defeated -= HandleDefeat;
        }

        private void OnGUI()
        {
            EnsureStyles();
            float scale = Mathf.Min(Screen.width / 1080f, Screen.height / 1920f);
            float offsetX = (Screen.width - 1080f * scale) * 0.5f;
            float offsetY = (Screen.height - 1920f * scale) * 0.5f;
            Matrix4x4 previous = GUI.matrix;
            GUI.matrix = Matrix4x4.TRS(new Vector3(offsetX, offsetY, 0f), Quaternion.identity, Vector3.one * scale);

            DrawTopStatus();
            DrawComboFeedback();
            DrawBranchDecision();
            DrawControls();
            DrawEndState();

            GUI.matrix = previous;
        }

        private void DrawTopStatus()
        {
            GUI.Box(new Rect(38f, 46f, 1004f, 118f), GUIContent.none, _panel);
            GUI.Label(new Rect(72f, 64f, 420f, 42f), "白霜 · 暴風神社", _title);
            GUI.Label(new Rect(72f, 112f, 360f, 30f), "自由移動 · 非三線跑道", _small);

            float healthRatio = _vitals.MaxHealth <= 0 ? 0f : _vitals.Health / (float)_vitals.MaxHealth;
            DrawBar(new Rect(524f, 75f, 470f, 26f), healthRatio, new Color(0.14f, 0.86f, 0.95f), new Color(0.04f, 0.1f, 0.14f));
            GUI.Label(new Rect(524f, 108f, 470f, 30f), $"HP {_vitals.Health}/{_vitals.MaxHealth}   路程 {Mathf.RoundToInt(_runner.Progress * 100f)}%", _small);

            EnemyMotor boss = _encounters.ActiveBoss;
            if (boss != null)
            {
                GUI.Box(new Rect(142f, 184f, 796f, 86f), GUIContent.none, _panel);
                GUI.Label(new Rect(178f, 197f, 724f, 34f), "晶黏帝 · SLIME KING", _title);
                DrawBar(new Rect(178f, 237f, 724f, 16f), boss.HealthRatio, new Color(0.96f, 0.58f, 0.12f), new Color(0.14f, 0.06f, 0.02f));
            }
        }

        private void DrawBranchDecision()
        {
            if (!_runner.BranchDecisionOpen) return;
            GUI.Box(new Rect(90f, 610f, 900f, 314f), GUIContent.none, _panel);
            GUI.Label(new Rect(130f, 644f, 820f, 52f), "前方岔路 — 選擇真正的行進方向", _title);
            GUI.Label(new Rect(130f, 702f, 820f, 36f), "也可直接向左／向右滑動選路", _small);

            if (GUI.Button(new Rect(130f, 768f, 376f, 112f), "← 左轉 · 神社道", _button))
                _runner.CommitBranch(BranchChoice.Left);
            if (GUI.Button(new Rect(574f, 768f, 376f, 112f), "右轉 · 遺跡道 →", _button))
                _runner.CommitBranch(BranchChoice.Right);
        }

        private void DrawControls()
        {
            GUI.Box(new Rect(42f, 1662f, 996f, 192f), GUIContent.none, _panel);
            GUI.Label(new Rect(76f, 1681f, 928f, 38f), "↑ 上方 76%：手指劃過怪物斬擊", _title);
            GUI.Label(new Rect(76f, 1732f, 928f, 30f), "一筆可連斬多隻 · 快速揮斬觸發暴擊", _small);
            GUI.Label(new Rect(76f, 1772f, 928f, 30f), "↔ 下方 24%：自由左右移動（可雙指同時操作）", _small);
            GUI.Label(new Rect(76f, 1811f, 928f, 26f), "電腦：拖曳滑斬 · A/D 移動 · SPACE 疾斬", _small);
        }

        private void DrawComboFeedback()
        {
            int combo = _combat.Combo;
            if (combo <= 0) return;
            Color previous = _comboStyle.normal.textColor;
            _comboStyle.normal.textColor = _combat.LastSliceWasCritical
                ? new Color(1f, 0.76f, 0.2f)
                : new Color(0.3f, 0.94f, 1f);
            string label = _combat.LastSliceWasCritical ? $"疾斬 ×{combo}" : $"COMBO ×{combo}";
            GUI.Label(new Rect(642f, 294f, 370f, 88f), label, _comboStyle);
            _comboStyle.normal.textColor = previous;
        }

        private void DrawEndState()
        {
            if (!_victory && !_defeat) return;
            GUI.Box(new Rect(140f, 620f, 800f, 360f), GUIContent.none, _panel);
            GUI.Label(new Rect(200f, 685f, 680f, 80f), _victory ? "垂直切片完成" : "白霜敗北", _title);
            GUI.Label(
                new Rect(200f, 790f, 680f, 110f),
                _victory ? "你已通過真實岔路並擊敗晶黏帝。" : "重新進入播放模式即可再試。",
                _small);
        }

        private static void DrawBar(Rect rect, float value, Color fill, Color background)
        {
            Color previous = GUI.color;
            GUI.color = background;
            GUI.DrawTexture(rect, Texture2D.whiteTexture);
            GUI.color = fill;
            GUI.DrawTexture(new Rect(rect.x, rect.y, rect.width * Mathf.Clamp01(value), rect.height), Texture2D.whiteTexture);
            GUI.color = previous;
        }

        private void EnsureStyles()
        {
            if (_panel != null) return;
            Texture2D panelTexture = MakeTexture(new Color(0.015f, 0.04f, 0.065f, 0.9f));
            Texture2D buttonTexture = MakeTexture(new Color(0.05f, 0.18f, 0.23f, 0.96f));
            Texture2D attackTexture = MakeTexture(new Color(0.08f, 0.52f, 0.62f, 0.96f));
            _hudFont = Resources.Load<Font>("Fonts/NotoSansTC-Subset");

            _panel = new GUIStyle(GUI.skin.box) { normal = { background = panelTexture } };
            _title = new GUIStyle(GUI.skin.label)
            {
                font = _hudFont,
                fontSize = 34,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleLeft,
                normal = { textColor = new Color(0.82f, 0.96f, 1f) },
            };
            _small = new GUIStyle(GUI.skin.label)
            {
                font = _hudFont,
                fontSize = 26,
                alignment = TextAnchor.MiddleLeft,
                normal = { textColor = new Color(0.58f, 0.74f, 0.82f) },
            };
            _button = new GUIStyle(GUI.skin.button)
            {
                font = _hudFont,
                fontSize = 34,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { background = buttonTexture, textColor = new Color(0.86f, 0.98f, 1f) },
                hover = { background = attackTexture, textColor = Color.white },
                active = { background = attackTexture, textColor = Color.white },
            };
            _comboStyle = new GUIStyle(_title)
            {
                fontSize = 52,
                alignment = TextAnchor.MiddleRight,
                normal = { textColor = new Color(0.3f, 0.94f, 1f) },
            };
        }

        private static Texture2D MakeTexture(Color color)
        {
            Texture2D texture = new Texture2D(1, 1, TextureFormat.RGBA32, false);
            texture.SetPixel(0, 0, color);
            texture.Apply();
            return texture;
        }

        private void HandleVictory()
        {
            _victory = true;
        }

        private void HandleDefeat()
        {
            _defeat = true;
            _runner.SetRunning(false);
        }
    }
}
