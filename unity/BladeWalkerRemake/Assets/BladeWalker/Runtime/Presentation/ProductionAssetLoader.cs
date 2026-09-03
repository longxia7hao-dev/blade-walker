using BladeWalker.Remake.Combat;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    /// <summary>
    /// Stable bridge between gameplay and formal art. Dropping a prefab at the
    /// documented Resources path replaces its proxy without changing combat code.
    /// </summary>
    public static class ProductionAssetLoader
    {
        public static bool TryCreateBaishuang(out GameObject hero, out Transform weaponSocket)
        {
            GameObject prefab = Resources.Load<GameObject>("Production/Heroes/Baishuang");
            if (prefab == null)
            {
                hero = null;
                weaponSocket = null;
                return false;
            }

            hero = Object.Instantiate(prefab);
            hero.name = "Hero_Baishuang";
            weaponSocket = FindDeep(hero.transform, "WeaponSocket_R");
            if (weaponSocket == null)
            {
                weaponSocket = new GameObject("WeaponSocket_R").transform;
                weaponSocket.SetParent(hero.transform, false);
                weaponSocket.localPosition = new Vector3(0.56f, 1.34f, 0.18f);
            }

            EnsureCapsule(hero, 0.42f, 2.2f, 1.1f);
            return true;
        }

        public static bool TryCreateEnemy(EnemyLocomotion locomotion, out GameObject enemy)
        {
            string resourceName;
            switch (locomotion)
            {
                case EnemyLocomotion.Flyer:
                    resourceName = "AerialWraith";
                    break;
                case EnemyLocomotion.Hopper:
                    resourceName = "Hopper";
                    break;
                case EnemyLocomotion.Flanker:
                    resourceName = "SideFlanker";
                    break;
                case EnemyLocomotion.Artillery:
                    resourceName = "CrystalArtillery";
                    break;
                case EnemyLocomotion.SlimeKing:
                    resourceName = "CrystalSlimeKing";
                    break;
                default:
                    resourceName = "GroundStalker";
                    break;
            }

            GameObject prefab = Resources.Load<GameObject>("Production/Enemies/" + resourceName);
            if (prefab == null)
            {
                enemy = null;
                return false;
            }

            enemy = Object.Instantiate(prefab);
            enemy.name = resourceName;
            float radius = locomotion == EnemyLocomotion.SlimeKing ? 1.9f : 0.65f;
            float height = locomotion == EnemyLocomotion.SlimeKing ? 4.2f : 1.6f;
            EnsureCapsule(enemy, radius, height, height * 0.5f);
            return true;
        }

        private static void EnsureCapsule(GameObject root, float radius, float height, float centreY)
        {
            if (root.GetComponentInChildren<Collider>() != null) return;
            CapsuleCollider colliderComponent = root.AddComponent<CapsuleCollider>();
            colliderComponent.radius = radius;
            colliderComponent.height = height;
            colliderComponent.center = new Vector3(0f, centreY, 0f);
        }

        private static Transform FindDeep(Transform root, string childName)
        {
            if (root.name == childName) return root;
            for (int i = 0; i < root.childCount; i++)
            {
                Transform match = FindDeep(root.GetChild(i), childName);
                if (match != null) return match;
            }
            return null;
        }
    }
}
