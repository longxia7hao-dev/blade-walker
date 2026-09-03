using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    public sealed class StormPulse : MonoBehaviour
    {
        private Light _flash;
        private float _nextFlash;
        private float _flashUntil;

        private void Awake()
        {
            GameObject flashObject = new GameObject("LightningFlash");
            flashObject.transform.SetParent(transform, false);
            flashObject.transform.rotation = Quaternion.Euler(58f, 18f, 0f);
            _flash = flashObject.AddComponent<Light>();
            _flash.type = LightType.Directional;
            _flash.color = new Color(0.55f, 0.8f, 1f);
            _flash.intensity = 0f;
            _flash.shadows = LightShadows.None;
            _nextFlash = Time.time + Random.Range(5f, 9f);
        }

        private void Update()
        {
            if (Time.time >= _nextFlash)
            {
                _flashUntil = Time.time + Random.Range(0.07f, 0.14f);
                _nextFlash = Time.time + Random.Range(5f, 10f);
            }

            float target = Time.time < _flashUntil ? 4.8f : 0f;
            _flash.intensity = Mathf.Lerp(_flash.intensity, target, 1f - Mathf.Exp(-24f * Time.deltaTime));
        }
    }
}
