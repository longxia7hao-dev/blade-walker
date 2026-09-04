using System;
using System.Collections.Generic;
using BladeWalker.Remake.Presentation;
using UnityEngine;

namespace BladeWalker.Remake.Combat
{
    /// <summary>
    /// Screen-space slicing: a monster is hit when the finger's line segment crosses
    /// its projected target circle. One stroke can cut several ground or aerial enemies.
    /// </summary>
    public sealed class HeroCombat : MonoBehaviour
    {
        public event Action<int, bool> ComboChanged;
        public event Action<float> SwipeCommitted;

        [SerializeField] private float minimumSwipeSpeed = 0.2f;
        [SerializeField] private float criticalSwipeSpeed = 1.35f;
        [SerializeField] private float comboWindow = 1.15f;
        [SerializeField] private float baseDamage = 19f;
        [SerializeField] private float fastDamage = 35f;

        private readonly HashSet<EnemyMotor> _hitThisSwipe = new HashSet<EnemyMotor>();
        private Transform _weapon;
        private Camera _camera;
        private float _comboExpiresAt;
        private int _combo;
        private bool _swipeActive;
        private bool _weaponAnimatedThisSwipe;
        private Quaternion _weaponRestRotation;
        private Coroutine _weaponRoutine;

        public int Combo => Time.unscaledTime <= _comboExpiresAt ? _combo : 0;
        public bool LastSliceWasCritical { get; private set; }
        public float ComboTimeRemaining => Mathf.Max(0f, _comboExpiresAt - Time.unscaledTime);

        public void Initialize(Transform weapon)
        {
            _weapon = weapon;
            if (_weapon != null) _weaponRestRotation = _weapon.localRotation;
        }

        public void BindCamera(Camera camera)
        {
            _camera = camera;
        }

        public void BeginSwipe()
        {
            _swipeActive = true;
            _weaponAnimatedThisSwipe = false;
            _hitThisSwipe.Clear();
        }

        public void SliceSegment(Vector2 from, Vector2 to, float elapsed)
        {
            if (!_swipeActive || _camera == null) return;
            Vector2 delta = to - from;
            float length = delta.magnitude;
            if (length < 6f) return;

            float normalizedSpeed = (length / Mathf.Max(0.001f, elapsed)) / Mathf.Max(1f, Screen.height);
            if (normalizedSpeed < minimumSwipeSpeed) return;

            bool critical = normalizedSpeed >= criticalSwipeSpeed;
            float speed01 = Mathf.InverseLerp(minimumSwipeSpeed, criticalSwipeSpeed * 1.35f, normalizedSpeed);
            float damage = Mathf.Lerp(baseDamage, fastDamage, speed01) * (critical ? 1.28f : 1f);

            if (!_weaponAnimatedThisSwipe)
            {
                _weaponAnimatedThisSwipe = true;
                SwipeCommitted?.Invoke(normalizedSpeed);
                if (_weapon != null)
                {
                    if (_weaponRoutine != null) StopCoroutine(_weaponRoutine);
                    _weapon.localRotation = _weaponRestRotation;
                    _weaponRoutine = StartCoroutine(AnimateWeapon(delta.normalized));
                }
            }

            IReadOnlyList<EnemyMotor> enemies = EnemyMotor.Active;
            for (int i = enemies.Count - 1; i >= 0; i--)
            {
                EnemyMotor enemy = enemies[i];
                if (enemy == null || !enemy.IsAlive || _hitThisSwipe.Contains(enemy)) continue;
                Vector3 screenTarget = _camera.WorldToScreenPoint(enemy.SliceTargetWorld);
                if (screenTarget.z <= 0f) continue;

                float pixelsPerWorld = Screen.height
                    / (2f * Mathf.Tan(_camera.fieldOfView * 0.5f * Mathf.Deg2Rad) * screenTarget.z);
                float targetRadius = Mathf.Clamp(
                    enemy.SliceRadiusWorld * pixelsPerWorld,
                    enemy.IsBoss ? 58f : 28f,
                    enemy.IsBoss ? 190f : 94f);
                float distance = DistanceToSegment(new Vector2(screenTarget.x, screenTarget.y), from, to);
                if (distance > targetRadius) continue;

                _hitThisSwipe.Add(enemy);
                float directionSign = Mathf.Abs(delta.x) < 0.01f ? 1f : Mathf.Sign(delta.x);
                Vector3 impulse = (_camera.transform.right * directionSign
                    + Vector3.up * Mathf.Clamp(delta.y / Mathf.Max(1f, length), -0.1f, 0.55f)
                    + _camera.transform.forward * 0.22f).normalized * (critical ? 6.4f : 4.6f);
                enemy.TakeDamage(damage, impulse);
                RegisterHit(critical);
                CombatVfx.SpawnSliceImpact(enemy.SliceTargetWorld, delta.normalized, critical);
            }
        }

        public void EndSwipe()
        {
            _swipeActive = false;
            _hitThisSwipe.Clear();
        }

        public void RequestAttack()
        {
            PerformKeyboardSlash();
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.J))
                PerformKeyboardSlash();

            if (_combo > 0 && Time.unscaledTime > _comboExpiresAt)
            {
                _combo = 0;
                ComboChanged?.Invoke(0, false);
            }
        }

        private void PerformKeyboardSlash()
        {
            if (_camera == null) return;
            BeginSwipe();
            Vector2 from = new Vector2(Screen.width * 0.25f, Screen.height * 0.36f);
            Vector2 to = new Vector2(Screen.width * 0.75f, Screen.height * 0.76f);
            SliceSegment(from, to, 0.12f);
            EndSwipe();
        }

        private void RegisterHit(bool critical)
        {
            if (Time.unscaledTime > _comboExpiresAt) _combo = 0;
            _combo++;
            _comboExpiresAt = Time.unscaledTime + comboWindow;
            LastSliceWasCritical = critical;
            ComboChanged?.Invoke(_combo, critical);
        }

        private static float DistanceToSegment(Vector2 point, Vector2 start, Vector2 end)
        {
            Vector2 segment = end - start;
            float lengthSquared = segment.sqrMagnitude;
            if (lengthSquared < 0.001f) return Vector2.Distance(point, start);
            float t = Mathf.Clamp01(Vector2.Dot(point - start, segment) / lengthSquared);
            return Vector2.Distance(point, start + segment * t);
        }

        private System.Collections.IEnumerator AnimateWeapon(Vector2 direction)
        {
            Quaternion start = _weaponRestRotation;
            float horizontal = Mathf.Clamp(direction.x, -1f, 1f);
            float vertical = Mathf.Clamp(direction.y, -1f, 1f);
            Quaternion windup = start * Quaternion.Euler(-18f * vertical, -42f * horizontal, -24f * horizontal);
            Quaternion strike = start * Quaternion.Euler(22f * vertical, 92f * horizontal, 54f * horizontal);
            const float duration = 0.19f;
            for (float time = 0f; time < duration; time += Time.deltaTime)
            {
                float p = time / duration;
                _weapon.localRotation = p < 0.22f
                    ? Quaternion.Slerp(start, windup, p / 0.22f)
                    : Quaternion.Slerp(windup, strike, (p - 0.22f) / 0.78f);
                yield return null;
            }
            _weapon.localRotation = start;
            _weaponRoutine = null;
        }
    }
}
