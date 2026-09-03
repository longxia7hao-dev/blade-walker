using System.Collections.Generic;
using UnityEngine;

namespace BladeWalker.Remake.Combat
{
    public sealed class HeroCombat : MonoBehaviour
    {
        [SerializeField] private float cooldown = 0.34f;
        [SerializeField] private float reach = 7.2f;
        [SerializeField] private float halfAngle = 58f;
        [SerializeField] private float damage = 24f;

        private MobileInput _input;
        private float _readyAt;
        private Transform _weapon;

        public float CooldownRatio => cooldown <= 0f ? 0f : Mathf.Clamp01((_readyAt - Time.time) / cooldown);

        public void Initialize(MobileInput input, Transform weapon)
        {
            _input = input;
            _weapon = weapon;
        }

        public void RequestAttack()
        {
            _input?.QueueAttack();
        }

        private void Update()
        {
            if (_input != null && _input.ConsumeAttack()) Attack();
        }

        private void Attack()
        {
            if (Time.time < _readyAt) return;
            _readyAt = Time.time + cooldown;

            Vector3 origin = transform.position + Vector3.up * 1.25f;
            Vector3 forward = transform.forward;
            Collider[] hits = Physics.OverlapSphere(origin + forward * (reach * 0.42f), reach * 0.72f);
            HashSet<EnemyMotor> struck = new HashSet<EnemyMotor>();
            foreach (Collider hit in hits)
            {
                EnemyMotor enemy = hit.GetComponentInParent<EnemyMotor>();
                if (enemy == null || !enemy.IsAlive || struck.Contains(enemy)) continue;
                Vector3 delta = enemy.transform.position - origin;
                Vector3 planar = Vector3.ProjectOnPlane(delta, Vector3.up);
                if (delta.magnitude > reach || Vector3.Angle(forward, planar) > halfAngle) continue;
                struck.Add(enemy);
                Vector3 impulse = (planar.normalized + Vector3.up * 0.16f) * 4.5f;
                enemy.TakeDamage(damage, impulse);
            }

            Presentation.CombatVfx.SpawnSlash(origin + forward * 1.4f, transform.rotation);
            if (_weapon != null) StartCoroutine(AnimateWeapon());
        }

        private System.Collections.IEnumerator AnimateWeapon()
        {
            Quaternion start = _weapon.localRotation;
            Quaternion windup = start * Quaternion.Euler(-20f, -35f, -18f);
            Quaternion strike = start * Quaternion.Euler(15f, 85f, 48f);
            float duration = 0.2f;
            for (float t = 0f; t < duration; t += Time.deltaTime)
            {
                float p = t / duration;
                _weapon.localRotation = p < 0.25f
                    ? Quaternion.Slerp(start, windup, p / 0.25f)
                    : Quaternion.Slerp(windup, strike, (p - 0.25f) / 0.75f);
                yield return null;
            }
            _weapon.localRotation = start;
        }
    }
}
