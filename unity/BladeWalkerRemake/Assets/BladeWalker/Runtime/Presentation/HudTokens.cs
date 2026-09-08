using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    /// <summary>
    /// FROZEN HUD tokens from design/HUD-COLOR-TOKENS.md (director lock 2026-09-08).
    /// Main CTA = Button gold #D4A526 solid + ButtonInk. Primary is progress/accent only.
    /// </summary>
    public static class HudTokens
    {
        public static readonly Color Primary = Hex("3A9CFF");
        public static readonly Color Hp = Hex("FF4B6A");
        public static readonly Color Danger = Hex("FF4B6A");
        public static readonly Color Button = Hex("D4A526");
        public static readonly Color ButtonInk = Hex("1A1428");
        public static readonly Color Ink = Hex("FFFFFF");
        public static readonly Color Panel = Hex("121830", 0.50f);
        public static readonly Color PanelDeep = Hex("121830", 0.72f);
        public static readonly Color LineGold = Hex("D4A526", 0.70f);
        public static readonly Color LineCyan = Hex("3A9CFF", 0.55f);
        public static readonly Color Muted = Hex("E8D7B0");
        public static readonly Color Frost = Hex("8EE4FF");
        public static readonly Color Ember = Hex("FF8A4A");
        public static readonly Color Azure = Hex("7EE0FF");
        public static readonly Color OverlayDim = new Color(0.04f, 0.06f, 0.10f, 0.62f);

        public static Color Hex(string hex, float alpha = 1f)
        {
            if (ColorUtility.TryParseHtmlString("#" + hex, out Color color))
            {
                color.a = alpha;
                return color;
            }
            return new Color(1f, 0f, 1f, alpha);
        }
    }
}
