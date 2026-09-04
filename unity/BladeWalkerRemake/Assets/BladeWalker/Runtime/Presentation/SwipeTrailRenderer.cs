using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace BladeWalker.Remake.Presentation
{
    public sealed class SwipeTrailRenderer : MonoBehaviour
    {
        private const float Lifetime = 0.2f;

        private readonly List<Vector2> _screenPoints = new List<Vector2>(24);
        private readonly List<float> _bornAt = new List<float>(24);
        private Camera _camera;
        private LineRenderer _line;
        private Material _material;
        private bool _drawing;

        public void Initialize(Camera camera)
        {
            _camera = camera;
            _line = gameObject.AddComponent<LineRenderer>();
            _line.name = "FrostFingerBladeTrail";
            _line.useWorldSpace = true;
            _line.alignment = LineAlignment.View;
            _line.textureMode = LineTextureMode.Stretch;
            _line.numCapVertices = 4;
            _line.numCornerVertices = 3;
            _line.widthCurve = new AnimationCurve(
                new Keyframe(0f, 0.12f),
                new Keyframe(0.55f, 1f),
                new Keyframe(1f, 0.18f));
            _line.widthMultiplier = 0.065f;
            _line.shadowCastingMode = ShadowCastingMode.Off;
            _line.receiveShadows = false;

            Shader shader = Shader.Find("Universal Render Pipeline/Particles/Unlit");
            if (shader == null) shader = Shader.Find("Sprites/Default");
            _material = new Material(shader) { name = "SwipeTrailMaterial" };
            if (_material.HasProperty("_Surface")) _material.SetFloat("_Surface", 1f);
            if (_material.HasProperty("_ZWrite")) _material.SetFloat("_ZWrite", 0f);
            if (_material.HasProperty("_SrcBlend")) _material.SetFloat("_SrcBlend", (float)BlendMode.SrcAlpha);
            if (_material.HasProperty("_DstBlend")) _material.SetFloat("_DstBlend", (float)BlendMode.OneMinusSrcAlpha);
            _material.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            _material.renderQueue = (int)RenderQueue.Transparent;
            SetMaterialColor(new Color(0.48f, 0.95f, 1f, 0.92f));
            _line.material = _material;
        }

        public void BeginStroke(Vector2 point)
        {
            _drawing = true;
            _screenPoints.Clear();
            _bornAt.Clear();
            AddPoint(point);
        }

        public void AddPoint(Vector2 point)
        {
            if (_screenPoints.Count > 0 && Vector2.Distance(_screenPoints[_screenPoints.Count - 1], point) < 4f)
                return;
            _screenPoints.Add(point);
            _bornAt.Add(Time.unscaledTime);
            if (_screenPoints.Count > 28)
            {
                _screenPoints.RemoveAt(0);
                _bornAt.RemoveAt(0);
            }
        }

        public void EndStroke()
        {
            _drawing = false;
        }

        private void LateUpdate()
        {
            if (_camera == null || _line == null) return;
            float now = Time.unscaledTime;
            while (_bornAt.Count > 0 && now - _bornAt[0] > Lifetime)
            {
                _bornAt.RemoveAt(0);
                _screenPoints.RemoveAt(0);
            }

            _line.positionCount = _screenPoints.Count;
            for (int i = 0; i < _screenPoints.Count; i++)
            {
                Vector3 screen = new Vector3(_screenPoints[i].x, _screenPoints[i].y, 2.15f);
                _line.SetPosition(i, _camera.ScreenToWorldPoint(screen));
            }

            float newestAge = _bornAt.Count == 0 ? Lifetime : now - _bornAt[_bornAt.Count - 1];
            float alpha = _drawing ? 0.94f : Mathf.Clamp01(1f - newestAge / Lifetime) * 0.94f;
            SetMaterialColor(new Color(0.48f, 0.95f, 1f, alpha));
        }

        private void SetMaterialColor(Color color)
        {
            if (_material == null) return;
            if (_material.HasProperty("_BaseColor")) _material.SetColor("_BaseColor", color);
            if (_material.HasProperty("_Color")) _material.SetColor("_Color", color);
            if (_material.HasProperty("_EmissionColor"))
            {
                _material.EnableKeyword("_EMISSION");
                _material.SetColor("_EmissionColor", new Color(color.r * 2.1f, color.g * 2.1f, color.b * 2.1f, color.a));
            }
        }
    }
}
