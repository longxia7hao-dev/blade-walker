using BladeWalker.Remake.World;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    /// <summary>
    /// Temporary procedural motion for the gameplay proxy. Formal production replaces
    /// this component with the Mecanim controller and clips in ART_ASSET_CONTRACT.md.
    /// </summary>
    public sealed class BaishuangProxyAnimator : MonoBehaviour
    {
        private PlayerRouteMotor _runner;
        private Transform _visual;
        private Transform _leftLeg;
        private Transform _rightLeg;
        private Transform _hair;
        private float _previousLateral;
        private float _lean;

        public void Initialize(PlayerRouteMotor runner)
        {
            _runner = runner;
            _visual = transform.Find("Visual");
            if (_visual == null) return;
            _leftLeg = _visual.Find("LegL");
            _rightLeg = _visual.Find("LegR");
            _hair = _visual.Find("HairBack");
            _previousLateral = runner.LateralOffset;
        }

        private void LateUpdate()
        {
            if (_runner == null || _visual == null) return;
            float cycle = Time.time * (_runner.IsRunning ? 8.6f : 2.1f);
            float lateralVelocity = (_runner.LateralOffset - _previousLateral) / Mathf.Max(0.001f, Time.deltaTime);
            _previousLateral = _runner.LateralOffset;
            _lean = Mathf.Lerp(_lean, Mathf.Clamp(-lateralVelocity * 1.6f, -12f, 12f), 1f - Mathf.Exp(-8f * Time.deltaTime));

            float bob = _runner.IsRunning ? Mathf.Abs(Mathf.Sin(cycle)) * 0.055f : Mathf.Sin(cycle) * 0.018f;
            _visual.localPosition = new Vector3(0f, bob, 0f);
            _visual.localRotation = Quaternion.Euler(0f, 0f, _lean);

            if (_leftLeg != null)
                _leftLeg.localRotation = Quaternion.Euler(Mathf.Sin(cycle) * 24f, 0f, 0f);
            if (_rightLeg != null)
                _rightLeg.localRotation = Quaternion.Euler(-Mathf.Sin(cycle) * 24f, 0f, 0f);
            if (_hair != null)
                _hair.localRotation = Quaternion.Euler(12f + Mathf.Sin(cycle * 0.5f) * 5f, 0f, -_lean * 0.25f);
        }
    }
}
