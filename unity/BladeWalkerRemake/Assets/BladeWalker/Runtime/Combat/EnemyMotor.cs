using System;
using UnityEngine;

namespace BladeWalker.Remake.Combat
{
    public enum EnemyLocomotion
    {
        GroundStalker,
        Hopper,
        Flyer,
        Flanker,
        Artillery,
        SlimeKing,
    }

    /// <summary>
    /// World-space enemy locomotion. Each archetype owns a distinct trajectory so
    /// encounters occupy depth, lateral space, and altitude instead of a single queue.
    /// </summary>
    public sealed class EnemyMotor : MonoBehaviour
    {
        public event Action<EnemyMotor> Defeated;

        private Transform _hero;
        private HeroVitals _heroVitals;
        private EnemyLocomotion _locomotion;
        private Vector3 _spawn;
        private Vector3 _velocity;
        private Vector3 _groundPosition;
        private Vector3 _flankControl;
        private float _speed;
        private float _age;
        private float _phase;
        private float _attackAt;
        private float _health;
        private float _maxHealth;
        private float _hitFlash;
        private bool _dead;
        private Renderer[] _renderers;
        private Transform _wingLeft;
        private Transform _wingRight;
        private Transform _cannon;
        private Transform _crystalLeft;
        private Transform _crystalRight;

        public EnemyLocomotion Locomotion => _locomotion;
        public bool IsBoss => _locomotion == EnemyLocomotion.SlimeKing;
        public bool IsAlive => !_dead;
        public float HealthRatio => _maxHealth <= 0f ? 0f : Mathf.Clamp01(_health / _maxHealth);

        public void Initialize(
            EnemyLocomotion locomotion,
            Transform hero,
            HeroVitals heroVitals,
            Vector3 spawnPosition,
            float phase)
        {
            _locomotion = locomotion;
            _hero = hero;
            _heroVitals = heroVitals;
            _spawn = spawnPosition;
            _groundPosition = spawnPosition;
            _phase = phase;
            _age = 0f;
            _attackAt = Time.time + UnityEngine.Random.Range(0.45f, 1.1f);

            switch (locomotion)
            {
                case EnemyLocomotion.GroundStalker:
                    _speed = 4.4f;
                    _maxHealth = 22f;
                    break;
                case EnemyLocomotion.Hopper:
                    _speed = 5.2f;
                    _maxHealth = 26f;
                    break;
                case EnemyLocomotion.Flyer:
                    _speed = 5.8f;
                    _maxHealth = 20f;
                    break;
                case EnemyLocomotion.Flanker:
                    _speed = 6.2f;
                    _maxHealth = 28f;
                    break;
                case EnemyLocomotion.Artillery:
                    _speed = 3.2f;
                    _maxHealth = 34f;
                    break;
                default:
                    _speed = 2.15f;
                    _maxHealth = 180f;
                    break;
            }

            _health = _maxHealth;
            transform.position = spawnPosition;
            Vector3 side = Vector3.Cross(Vector3.up, (_hero.position - spawnPosition).normalized);
            _flankControl = (_hero.position + spawnPosition) * 0.5f + side * Mathf.Sign(phase) * 7f;
            _renderers = GetComponentsInChildren<Renderer>();
            _wingLeft = transform.Find("WingL");
            _wingRight = transform.Find("WingR");
            _cannon = transform.Find("Cannon");
            _crystalLeft = transform.Find("CrystalL");
            _crystalRight = transform.Find("CrystalR");
        }

        public void TakeDamage(float damage, Vector3 impulse)
        {
            if (_dead) return;
            _health -= Mathf.Max(0f, damage);
            _velocity += impulse;
            _hitFlash = 0.12f;
            if (_health <= 0f) Die();
        }

        private void Update()
        {
            if (_dead || _hero == null || _heroVitals == null) return;
            float dt = Time.deltaTime;
            _age += dt;
            _velocity = Vector3.Lerp(_velocity, Vector3.zero, 1f - Mathf.Exp(-7f * dt));

            switch (_locomotion)
            {
                case EnemyLocomotion.GroundStalker:
                    UpdateGround(dt);
                    break;
                case EnemyLocomotion.Hopper:
                    UpdateHopper(dt);
                    break;
                case EnemyLocomotion.Flyer:
                    UpdateFlyer(dt);
                    break;
                case EnemyLocomotion.Flanker:
                    UpdateFlanker(dt);
                    break;
                case EnemyLocomotion.Artillery:
                    UpdateArtillery(dt);
                    break;
                case EnemyLocomotion.SlimeKing:
                    UpdateBoss(dt);
                    break;
            }

            transform.position += _velocity * dt;
            FaceHero(dt);
            TryContactAttack();
            AnimateVisuals();
            UpdateHitFlash(dt);
        }

        private void UpdateGround(float dt)
        {
            Vector3 target = _hero.position;
            target += _hero.right * Mathf.Sin(_age * 2.2f + _phase) * 1.15f;
            target.y = transform.position.y;
            transform.position = Vector3.MoveTowards(transform.position, target, _speed * dt);
        }

        private void UpdateHopper(float dt)
        {
            Vector3 targetGround = _hero.position + _hero.right * Mathf.Sin(_phase * 2.1f) * 1.8f;
            targetGround.y = _groundPosition.y;
            _groundPosition = Vector3.MoveTowards(_groundPosition, targetGround, _speed * dt);

            float hop = Mathf.Repeat(_age * 0.78f + Mathf.Abs(_phase), 1f);
            float height = Mathf.Sin(hop * Mathf.PI) * 3.2f;
            transform.position = _groundPosition + Vector3.up * height;
            transform.localScale = new Vector3(
                1f + Mathf.Sin(hop * Mathf.PI) * 0.08f,
                1f - Mathf.Sin(hop * Mathf.PI) * 0.12f,
                1f + Mathf.Sin(hop * Mathf.PI) * 0.08f);
        }

        private void UpdateFlyer(float dt)
        {
            Vector3 toHero = _hero.position - transform.position;
            float distance = new Vector2(toHero.x, toHero.z).magnitude;
            Vector3 side = Vector3.Cross(Vector3.up, toHero.normalized);
            float orbit = Mathf.Sin(_age * 1.7f + _phase) * 4.2f;
            float dive = distance < 9f ? Mathf.Clamp01((9f - distance) / 7f) * 2.5f : 0f;
            Vector3 target = _hero.position + side * orbit + Vector3.up * (4.4f - dive + Mathf.Sin(_age * 2.4f) * 0.7f);
            transform.position = Vector3.MoveTowards(transform.position, target, _speed * dt);
        }

        private void UpdateFlanker(float dt)
        {
            float duration = Mathf.Max(1.6f, Vector3.Distance(_spawn, _hero.position) / _speed);
            float t = Mathf.Clamp01(_age / duration);
            Vector3 target = _hero.position + _hero.forward * 0.6f;
            Vector3 a = Vector3.Lerp(_spawn, _flankControl, t);
            Vector3 b = Vector3.Lerp(_flankControl, target, t);
            transform.position = Vector3.Lerp(a, b, t);
        }

        private void UpdateArtillery(float dt)
        {
            Vector3 toHero = _hero.position - transform.position;
            Vector3 planar = Vector3.ProjectOnPlane(toHero, Vector3.up);
            float distance = planar.magnitude;
            Vector3 direction = planar.sqrMagnitude > 0.01f ? planar.normalized : Vector3.forward;
            Vector3 strafe = Vector3.Cross(Vector3.up, direction) * Mathf.Sin(_age * 1.2f + _phase);

            if (distance > 14f) transform.position += direction * (_speed * dt);
            else if (distance < 9f) transform.position -= direction * (_speed * dt);
            transform.position += strafe * (2.2f * dt);

            if (Time.time >= _attackAt)
            {
                _attackAt = Time.time + 2.2f;
                EnemyProjectile.Spawn(transform.position + Vector3.up * 1.1f, _hero, _heroVitals, 9f);
            }
        }

        private void UpdateBoss(float dt)
        {
            Vector3 forward = Vector3.ProjectOnPlane(_hero.forward, Vector3.up).normalized;
            Vector3 right = Vector3.Cross(Vector3.up, forward);
            Vector3 target = _hero.position + forward * 11f + right * Mathf.Sin(_age * 0.75f) * 3.6f;
            target.y = _spawn.y + Mathf.Abs(Mathf.Sin(_age * 1.25f)) * 0.7f;
            transform.position = Vector3.Lerp(transform.position, target, 1f - Mathf.Exp(-_speed * dt));
            float squash = Mathf.Abs(Mathf.Sin(_age * 1.25f));
            transform.localScale = new Vector3(1f + squash * 0.08f, 1f - squash * 0.1f, 1f + squash * 0.08f);

            if (Time.time >= _attackAt)
            {
                _attackAt = Time.time + 2.7f;
                for (int i = -2; i <= 2; i++)
                {
                    Vector3 origin = transform.position + Vector3.up * 1.4f + right * (i * 0.55f);
                    EnemyProjectile.Spawn(origin, _hero, _heroVitals, 7.5f, i * 0.11f);
                }
            }
        }

        private void TryContactAttack()
        {
            if (Time.time < _attackAt || !_heroVitals.IsAlive) return;
            Vector3 delta = _hero.position - transform.position;
            float verticalAllowance = _locomotion == EnemyLocomotion.Flyer ? 2.6f : 1.8f;
            if (new Vector2(delta.x, delta.z).magnitude > (IsBoss ? 3f : 1.35f)
                || Mathf.Abs(delta.y) > verticalAllowance)
                return;

            if (_heroVitals.TryDamage(IsBoss ? 2 : 1))
            {
                Vector3 away = Vector3.ProjectOnPlane(transform.position - _hero.position, Vector3.up).normalized;
                _velocity += away * 6f;
            }
            _attackAt = Time.time + (IsBoss ? 1.5f : 1.05f);
        }

        private void FaceHero(float dt)
        {
            Vector3 look = Vector3.ProjectOnPlane(_hero.position - transform.position, Vector3.up);
            if (look.sqrMagnitude < 0.01f) return;
            Quaternion desired = Quaternion.LookRotation(look.normalized, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, desired, 1f - Mathf.Exp(-8f * dt));
        }

        private void UpdateHitFlash(float dt)
        {
            if (_hitFlash <= 0f) return;
            _hitFlash -= dt;
            float emission = _hitFlash > 0f ? 1.8f : 0f;
            foreach (Renderer rendererComponent in _renderers)
            {
                if (rendererComponent.material.HasProperty("_EmissionColor"))
                {
                    rendererComponent.material.EnableKeyword("_EMISSION");
                    rendererComponent.material.SetColor("_EmissionColor", Color.white * emission);
                }
            }
        }

        private void AnimateVisuals()
        {
            float pulse = Mathf.Sin(_age * 8f + _phase);
            if (_wingLeft != null)
                _wingLeft.localRotation = Quaternion.Euler(0f, 0f, -22f - pulse * 34f);
            if (_wingRight != null)
                _wingRight.localRotation = Quaternion.Euler(0f, 0f, 22f + pulse * 34f);
            if (_cannon != null)
                _cannon.localRotation = Quaternion.Euler(90f + Mathf.Sin(_age * 1.7f) * 7f, 0f, 0f);
            if (_crystalLeft != null)
                _crystalLeft.localRotation = Quaternion.Euler(0f, _age * 52f, 22f);
            if (_crystalRight != null)
                _crystalRight.localRotation = Quaternion.Euler(0f, -_age * 44f, -18f);
        }

        private void Die()
        {
            _dead = true;
            Defeated?.Invoke(this);
            StartCoroutine(DeathRoutine());
        }

        private System.Collections.IEnumerator DeathRoutine()
        {
            float duration = 0.32f;
            Vector3 startScale = transform.localScale;
            for (float t = 0f; t < duration; t += Time.deltaTime)
            {
                float p = t / duration;
                transform.localScale = Vector3.Lerp(startScale, Vector3.zero, p * p);
                transform.position += Vector3.up * (Time.deltaTime * 1.8f);
                yield return null;
            }
            Destroy(gameObject);
        }
    }
}
