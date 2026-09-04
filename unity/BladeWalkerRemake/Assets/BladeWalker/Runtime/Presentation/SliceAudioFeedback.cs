using BladeWalker.Remake.Combat;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    /// <summary>
    /// Lightweight generated whoosh and crystal-hit sounds. They ship without external
    /// audio files and provide immediate speed/combo feedback for the slicing gesture.
    /// </summary>
    public sealed class SliceAudioFeedback : MonoBehaviour
    {
        private const int SampleRate = 24000;

        private HeroCombat _combat;
        private AudioSource _whooshSource;
        private AudioSource _hitSource;
        private AudioClip _whoosh;
        private AudioClip _hit;

        public void Initialize(HeroCombat combat)
        {
            _combat = combat;
            _whooshSource = gameObject.AddComponent<AudioSource>();
            _hitSource = gameObject.AddComponent<AudioSource>();
            Configure(_whooshSource, 0.42f);
            Configure(_hitSource, 0.54f);
            _whoosh = BuildWhoosh();
            _hit = BuildCrystalHit();
            combat.SwipeCommitted += OnSwipe;
            combat.ComboChanged += OnCombo;
        }

        private void OnDestroy()
        {
            if (_combat == null) return;
            _combat.SwipeCommitted -= OnSwipe;
            _combat.ComboChanged -= OnCombo;
        }

        private void OnSwipe(float speed)
        {
            _whooshSource.pitch = Mathf.Lerp(0.88f, 1.28f, Mathf.InverseLerp(0.2f, 1.8f, speed));
            _whooshSource.PlayOneShot(_whoosh);
        }

        private void OnCombo(int combo, bool critical)
        {
            if (combo <= 0) return;
            _hitSource.pitch = Mathf.Clamp(0.92f + combo * 0.035f + (critical ? 0.18f : 0f), 0.92f, 1.5f);
            _hitSource.PlayOneShot(_hit, critical ? 1f : 0.74f);
        }

        private static void Configure(AudioSource source, float volume)
        {
            source.playOnAwake = false;
            source.loop = false;
            source.spatialBlend = 0f;
            source.volume = volume;
        }

        private static AudioClip BuildWhoosh()
        {
            const float duration = 0.16f;
            int count = Mathf.CeilToInt(SampleRate * duration);
            float[] samples = new float[count];
            uint noise = 0x6d2b79f5u;
            for (int i = 0; i < count; i++)
            {
                float t = i / (float)count;
                noise = noise * 1664525u + 1013904223u;
                float random = ((noise >> 8) / 16777215f) * 2f - 1f;
                float envelope = Mathf.Sin(t * Mathf.PI) * (1f - t * 0.35f);
                float tone = Mathf.Sin(2f * Mathf.PI * (780f - 430f * t) * t * duration);
                samples[i] = (random * 0.34f + tone * 0.14f) * envelope;
            }
            AudioClip clip = AudioClip.Create("GeneratedFrostWhoosh", count, 1, SampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private static AudioClip BuildCrystalHit()
        {
            const float duration = 0.12f;
            int count = Mathf.CeilToInt(SampleRate * duration);
            float[] samples = new float[count];
            uint noise = 0x9e3779b9u;
            for (int i = 0; i < count; i++)
            {
                float seconds = i / (float)SampleRate;
                float t = i / (float)count;
                noise = noise * 1103515245u + 12345u;
                float random = ((noise >> 8) / 16777215f) * 2f - 1f;
                float ring = Mathf.Sin(2f * Mathf.PI * 1320f * seconds)
                    + Mathf.Sin(2f * Mathf.PI * 1980f * seconds) * 0.44f;
                float envelope = Mathf.Exp(-t * 7.5f);
                samples[i] = (ring * 0.34f + random * 0.12f) * envelope;
            }
            AudioClip clip = AudioClip.Create("GeneratedCrystalSlice", count, 1, SampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }
    }
}
