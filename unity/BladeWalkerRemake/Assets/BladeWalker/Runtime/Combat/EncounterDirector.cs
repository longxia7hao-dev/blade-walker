using System;
using System.Collections.Generic;
using BladeWalker.Remake.Presentation;
using BladeWalker.Remake.World;
using UnityEngine;

namespace BladeWalker.Remake.Combat
{
    public sealed class EncounterDirector : MonoBehaviour
    {
        public event Action<EnemyMotor> BossSpawned;
        public event Action BossDefeated;

        private readonly List<EnemyMotor> _living = new List<EnemyMotor>();
        private PlayerRouteMotor _runner;
        private HeroVitals _heroVitals;
        private Transform _hero;
        private float _spawnAt;
        private int _waveIndex;
        private bool _bossStarted;

        public EnemyMotor ActiveBoss { get; private set; }
        public int LivingCount => _living.Count;

        public void Initialize(PlayerRouteMotor runner, HeroVitals heroVitals)
        {
            _runner = runner;
            _hero = runner.transform;
            _heroVitals = heroVitals;
            _spawnAt = Time.time + 1.8f;
            runner.ArenaReached += BeginBossArena;
        }

        private void OnDestroy()
        {
            if (_runner != null) _runner.ArenaReached -= BeginBossArena;
        }

        private void Update()
        {
            _living.RemoveAll(enemy => enemy == null || !enemy.IsAlive);
            if (_runner == null || !_heroVitals.IsAlive || _bossStarted || !_runner.IsRunning) return;
            if (Time.time < _spawnAt) return;

            SpawnPattern(_waveIndex++ % 4);
            float density = Mathf.Lerp(3.25f, 2.1f, _runner.Progress);
            _spawnAt = Time.time + density + UnityEngine.Random.Range(-0.25f, 0.35f);
        }

        private void SpawnPattern(int pattern)
        {
            switch (pattern)
            {
                case 0:
                    // Aerial wing: different altitude, depth, and lateral offsets.
                    SpawnAhead(EnemyLocomotion.Flyer, 24f, -4.8f, 4.8f, -0.7f);
                    SpawnAhead(EnemyLocomotion.Flyer, 29f, 3.6f, 6.2f, 0.8f);
                    SpawnAhead(EnemyLocomotion.GroundStalker, 21f, 1.1f, 0.2f, 0.15f);
                    break;
                case 1:
                    // Crossing hoppers arrive on offset beats, never shoulder-to-shoulder.
                    SpawnAhead(EnemyLocomotion.Hopper, 20f, -3.4f, 0.2f, -1.1f);
                    SpawnAhead(EnemyLocomotion.Hopper, 27f, 2.6f, 0.2f, 1.2f);
                    SpawnAhead(EnemyLocomotion.Artillery, 34f, -0.8f, 0.2f, 0.5f);
                    break;
                case 2:
                    // Pincer: enemies begin outside the path and curve inward.
                    SpawnAhead(EnemyLocomotion.Flanker, 26f, -8.5f, 0.15f, -1.3f);
                    SpawnAhead(EnemyLocomotion.Flanker, 31f, 8.2f, 0.15f, 1.4f);
                    SpawnAhead(EnemyLocomotion.Flyer, 35f, 0.4f, 5.4f, 0.1f);
                    break;
                default:
                    // Uneven mixed pack with deliberate depth gaps.
                    SpawnAhead(EnemyLocomotion.GroundStalker, 18f, -2.1f, 0.2f, -0.3f);
                    SpawnAhead(EnemyLocomotion.Hopper, 25f, 3.7f, 0.2f, 1.7f);
                    SpawnAhead(EnemyLocomotion.Flyer, 32f, -4.1f, 5.8f, -1.8f);
                    SpawnAhead(EnemyLocomotion.Artillery, 38f, 1.3f, 0.2f, 0.6f);
                    break;
            }
        }

        private void SpawnAhead(
            EnemyLocomotion locomotion,
            float ahead,
            float lateral,
            float altitude,
            float phase)
        {
            if (!_runner.TrySampleAhead(ahead, out RouteFrame frame)) return;
            Vector3 position = frame.Offset(lateral, altitude);
            GameObject enemyObject = StylizedProxyFactory.CreateEnemy(locomotion);
            enemyObject.transform.SetParent(transform, true);
            EnemyMotor motor = enemyObject.AddComponent<EnemyMotor>();
            motor.Initialize(locomotion, _hero, _heroVitals, position, phase);
            motor.Defeated += OnEnemyDefeated;
            _living.Add(motor);
        }

        private void BeginBossArena()
        {
            if (_bossStarted) return;
            _bossStarted = true;

            for (int i = _living.Count - 1; i >= 0; i--)
            {
                if (_living[i] != null) Destroy(_living[i].gameObject);
            }
            _living.Clear();

            RouteFrame frame = _runner.CurrentFrame;
            Vector3 bossPosition = frame.Offset(0f, 0.3f) + frame.Forward * 11f;
            GameObject bossObject = StylizedProxyFactory.CreateEnemy(EnemyLocomotion.SlimeKing);
            bossObject.name = "Boss_CrystalSlimeKing";
            bossObject.transform.SetParent(transform, true);
            EnemyMotor boss = bossObject.AddComponent<EnemyMotor>();
            boss.Initialize(EnemyLocomotion.SlimeKing, _hero, _heroVitals, bossPosition, 0f);
            boss.Defeated += OnEnemyDefeated;
            ActiveBoss = boss;
            _living.Add(boss);
            BossSpawned?.Invoke(boss);
        }

        private void OnEnemyDefeated(EnemyMotor enemy)
        {
            enemy.Defeated -= OnEnemyDefeated;
            _living.Remove(enemy);
            if (enemy != ActiveBoss) return;
            ActiveBoss = null;
            BossDefeated?.Invoke();
        }
    }
}
