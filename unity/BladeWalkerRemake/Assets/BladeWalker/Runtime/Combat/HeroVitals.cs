using System;
using UnityEngine;

namespace BladeWalker.Remake.Combat
{
    public sealed class HeroVitals : MonoBehaviour
    {
        public event Action<int, int> HealthChanged;
        public event Action Defeated;

        [SerializeField] private int maxHealth = 8;
        [SerializeField] private float hitInvulnerability = 0.72f;

        private float _invulnerableUntil;

        public int MaxHealth => maxHealth;
        public int Health { get; private set; }
        public bool IsAlive => Health > 0;

        private void Awake()
        {
            Health = maxHealth;
        }

        public bool TryDamage(int amount)
        {
            if (!IsAlive || Time.time < _invulnerableUntil) return false;
            _invulnerableUntil = Time.time + hitInvulnerability;
            Health = Mathf.Max(0, Health - Mathf.Max(1, amount));
            HealthChanged?.Invoke(Health, maxHealth);
            if (Health == 0) Defeated?.Invoke();
            return true;
        }

        public void Heal(int amount)
        {
            if (!IsAlive) return;
            Health = Mathf.Min(maxHealth, Health + Mathf.Max(1, amount));
            HealthChanged?.Invoke(Health, maxHealth);
        }
    }
}
