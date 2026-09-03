using BladeWalker.Remake.Combat;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    /// <summary>
    /// Art-replaceable proxy assembly. The gameplay root, collider, scale, and sockets
    /// match the production asset contract so rigged FBX characters can replace these
    /// objects without rewriting gameplay.
    /// </summary>
    public static class StylizedProxyFactory
    {
        public static GameObject CreateBaishuang(out Transform weaponSocket)
        {
            if (ProductionAssetLoader.TryCreateBaishuang(out GameObject productionHero, out weaponSocket))
                return productionHero;

            GameObject root = new GameObject("Hero_Baishuang_Proxy");
            Material cloth = MaterialFactory.Create("BaishuangCloth", new Color(0.05f, 0.09f, 0.16f), 0.05f, 0.42f);
            Material armour = MaterialFactory.Create("BaishuangArmour", new Color(0.12f, 0.28f, 0.36f), 0.72f, 0.76f);
            Material pale = MaterialFactory.Create("BaishuangSkin", new Color(0.78f, 0.83f, 0.86f), 0f, 0.38f);
            Material frost = MaterialFactory.Create(
                "FrostEdge",
                new Color(0.36f, 0.86f, 1f),
                0.7f,
                0.92f,
                new Color(0.08f, 0.62f, 1.4f));

            Transform body = new GameObject("Visual").transform;
            body.SetParent(root.transform, false);
            MaterialFactory.Primitive("Torso", PrimitiveType.Capsule, body, new Vector3(0f, 1.15f, 0f), new Vector3(0.74f, 1.12f, 0.58f), cloth);
            MaterialFactory.Primitive("ChestPlate", PrimitiveType.Cube, body, new Vector3(0f, 1.52f, 0.12f), new Vector3(0.88f, 0.62f, 0.2f), armour, new Vector3(8f, 0f, 0f));
            MaterialFactory.Primitive("Head", PrimitiveType.Sphere, body, new Vector3(0f, 2.38f, 0.02f), new Vector3(0.56f, 0.68f, 0.54f), pale);
            MaterialFactory.Primitive("HairBack", PrimitiveType.Capsule, body, new Vector3(0f, 2.2f, -0.2f), new Vector3(0.58f, 0.9f, 0.42f), cloth, new Vector3(12f, 0f, 0f));
            MaterialFactory.Primitive("ShoulderL", PrimitiveType.Sphere, body, new Vector3(-0.52f, 1.72f, 0f), new Vector3(0.38f, 0.28f, 0.42f), armour);
            MaterialFactory.Primitive("ShoulderR", PrimitiveType.Sphere, body, new Vector3(0.52f, 1.72f, 0f), new Vector3(0.38f, 0.28f, 0.42f), armour);
            MaterialFactory.Primitive("LegL", PrimitiveType.Capsule, body, new Vector3(-0.22f, 0.5f, 0f), new Vector3(0.3f, 0.72f, 0.32f), cloth);
            MaterialFactory.Primitive("LegR", PrimitiveType.Capsule, body, new Vector3(0.22f, 0.5f, 0f), new Vector3(0.3f, 0.72f, 0.32f), cloth);

            Transform socket = new GameObject("WeaponSocket_R").transform;
            socket.SetParent(body, false);
            socket.localPosition = new Vector3(0.56f, 1.34f, 0.18f);
            socket.localRotation = Quaternion.Euler(8f, 0f, -18f);
            MaterialFactory.Primitive("Blade", PrimitiveType.Cube, socket, new Vector3(0f, 0.18f, 1.1f), new Vector3(0.1f, 0.06f, 2.25f), frost, new Vector3(0f, 0f, 3f));
            MaterialFactory.Primitive("Guard", PrimitiveType.Cube, socket, new Vector3(0f, 0.18f, 0.05f), new Vector3(0.65f, 0.12f, 0.16f), armour);
            MaterialFactory.Primitive("Grip", PrimitiveType.Cylinder, socket, new Vector3(0f, 0.18f, -0.28f), new Vector3(0.1f, 0.36f, 0.1f), cloth, new Vector3(90f, 0f, 0f));

            CapsuleCollider colliderComponent = root.AddComponent<CapsuleCollider>();
            colliderComponent.center = new Vector3(0f, 1.1f, 0f);
            colliderComponent.height = 2.2f;
            colliderComponent.radius = 0.42f;
            weaponSocket = socket;
            return root;
        }

        public static GameObject CreateEnemy(EnemyLocomotion locomotion)
        {
            if (ProductionAssetLoader.TryCreateEnemy(locomotion, out GameObject productionEnemy))
                return productionEnemy;

            switch (locomotion)
            {
                case EnemyLocomotion.Flyer:
                    return CreateWraith();
                case EnemyLocomotion.Hopper:
                    return CreateHopper();
                case EnemyLocomotion.Flanker:
                    return CreateFlanker();
                case EnemyLocomotion.Artillery:
                    return CreateArtillery();
                case EnemyLocomotion.SlimeKing:
                    return CreateSlimeKing();
                default:
                    return CreateStalker();
            }
        }

        private static GameObject CreateStalker()
        {
            GameObject root = EnemyRoot("GroundStalker", 0.62f, 1.45f);
            Material shell = MaterialFactory.Create("StalkerShell", new Color(0.11f, 0.28f, 0.24f), 0.35f, 0.54f);
            Material glow = MaterialFactory.Create("StalkerGlow", new Color(0.25f, 0.95f, 0.78f), 0.15f, 0.85f, new Color(0.05f, 0.9f, 0.62f));
            MaterialFactory.Primitive("Body", PrimitiveType.Capsule, root.transform, new Vector3(0f, 0.72f, 0f), new Vector3(1f, 0.78f, 0.92f), shell);
            MaterialFactory.Primitive("Core", PrimitiveType.Sphere, root.transform, new Vector3(0f, 0.85f, 0.5f), new Vector3(0.28f, 0.36f, 0.18f), glow);
            AddCrystalPair(root.transform, glow, 0.85f);
            return root;
        }

        private static GameObject CreateHopper()
        {
            GameObject root = EnemyRoot("Hopper", 0.72f, 1.35f);
            Material gel = MaterialFactory.Create("HopperGel", new Color(0.62f, 0.24f, 0.08f), 0.05f, 0.72f, new Color(0.18f, 0.025f, 0f));
            Material crystal = MaterialFactory.Create("HopperCrystal", new Color(0.18f, 0.9f, 1f), 0.42f, 0.86f, new Color(0.05f, 0.75f, 1.2f));
            MaterialFactory.Primitive("GelBody", PrimitiveType.Sphere, root.transform, new Vector3(0f, 0.62f, 0f), new Vector3(1.35f, 0.92f, 1.12f), gel);
            MaterialFactory.Primitive("FootL", PrimitiveType.Sphere, root.transform, new Vector3(-0.5f, 0.18f, 0.05f), new Vector3(0.48f, 0.3f, 0.62f), gel);
            MaterialFactory.Primitive("FootR", PrimitiveType.Sphere, root.transform, new Vector3(0.5f, 0.18f, 0.05f), new Vector3(0.48f, 0.3f, 0.62f), gel);
            AddCrystalPair(root.transform, crystal, 0.95f);
            return root;
        }

        private static GameObject CreateWraith()
        {
            GameObject root = EnemyRoot("AerialWraith", 0.66f, 1.8f);
            Material mist = MaterialFactory.Create("WraithMist", new Color(0.08f, 0.18f, 0.3f), 0f, 0.55f);
            Material eye = MaterialFactory.Create("WraithEye", new Color(0.26f, 0.94f, 1f), 0.2f, 0.9f, new Color(0.08f, 1.1f, 1.9f));
            MaterialFactory.Primitive("Head", PrimitiveType.Sphere, root.transform, new Vector3(0f, 0.7f, 0f), new Vector3(0.9f, 0.82f, 0.72f), mist);
            MaterialFactory.Primitive("Tail", PrimitiveType.Capsule, root.transform, new Vector3(0f, -0.12f, -0.05f), new Vector3(0.58f, 0.82f, 0.55f), mist);
            MaterialFactory.Primitive("WingL", PrimitiveType.Cube, root.transform, new Vector3(-0.72f, 0.48f, 0f), new Vector3(1.05f, 0.08f, 0.55f), mist, new Vector3(0f, 0f, -22f));
            MaterialFactory.Primitive("WingR", PrimitiveType.Cube, root.transform, new Vector3(0.72f, 0.48f, 0f), new Vector3(1.05f, 0.08f, 0.55f), mist, new Vector3(0f, 0f, 22f));
            MaterialFactory.Primitive("EyeL", PrimitiveType.Sphere, root.transform, new Vector3(-0.22f, 0.78f, 0.57f), Vector3.one * 0.16f, eye);
            MaterialFactory.Primitive("EyeR", PrimitiveType.Sphere, root.transform, new Vector3(0.22f, 0.78f, 0.57f), Vector3.one * 0.16f, eye);
            return root;
        }

        private static GameObject CreateFlanker()
        {
            GameObject root = EnemyRoot("SideFlanker", 0.54f, 1.7f);
            Material armour = MaterialFactory.Create("FlankerArmour", new Color(0.22f, 0.08f, 0.12f), 0.58f, 0.46f);
            Material ember = MaterialFactory.Create("FlankerEmber", new Color(1f, 0.26f, 0.08f), 0.2f, 0.82f, new Color(1.4f, 0.11f, 0.02f));
            MaterialFactory.Primitive("Body", PrimitiveType.Capsule, root.transform, new Vector3(0f, 0.84f, 0f), new Vector3(0.76f, 0.95f, 0.68f), armour);
            MaterialFactory.Primitive("HornL", PrimitiveType.Cylinder, root.transform, new Vector3(-0.28f, 1.66f, 0f), new Vector3(0.11f, 0.4f, 0.11f), ember, new Vector3(0f, 0f, -28f));
            MaterialFactory.Primitive("HornR", PrimitiveType.Cylinder, root.transform, new Vector3(0.28f, 1.66f, 0f), new Vector3(0.11f, 0.4f, 0.11f), ember, new Vector3(0f, 0f, 28f));
            MaterialFactory.Primitive("BladeL", PrimitiveType.Cube, root.transform, new Vector3(-0.72f, 0.78f, 0.24f), new Vector3(0.1f, 0.12f, 1.05f), ember, new Vector3(0f, -18f, 0f));
            MaterialFactory.Primitive("BladeR", PrimitiveType.Cube, root.transform, new Vector3(0.72f, 0.78f, 0.24f), new Vector3(0.1f, 0.12f, 1.05f), ember, new Vector3(0f, 18f, 0f));
            return root;
        }

        private static GameObject CreateArtillery()
        {
            GameObject root = EnemyRoot("CrystalArtillery", 0.62f, 1.65f);
            Material stone = MaterialFactory.Create("ArtilleryStone", new Color(0.12f, 0.12f, 0.2f), 0.35f, 0.38f);
            Material crystal = MaterialFactory.Create("ArtilleryCrystal", new Color(0.18f, 0.64f, 1f), 0.45f, 0.9f, new Color(0.02f, 0.55f, 1.6f));
            MaterialFactory.Primitive("Body", PrimitiveType.Capsule, root.transform, new Vector3(0f, 0.82f, 0f), new Vector3(0.9f, 0.94f, 0.82f), stone);
            MaterialFactory.Primitive("Cannon", PrimitiveType.Cylinder, root.transform, new Vector3(0f, 1.12f, 0.72f), new Vector3(0.22f, 0.75f, 0.22f), crystal, new Vector3(90f, 0f, 0f));
            AddCrystalPair(root.transform, crystal, 1.42f);
            return root;
        }

        private static GameObject CreateSlimeKing()
        {
            GameObject root = EnemyRoot("CrystalSlimeKing", 1.9f, 4.2f);
            Material gel = MaterialFactory.Create("KingAmberGel", new Color(0.42f, 0.15f, 0.025f), 0.05f, 0.78f, new Color(0.14f, 0.025f, 0f));
            Material gold = MaterialFactory.Create("KingGold", new Color(0.62f, 0.38f, 0.08f), 0.85f, 0.78f);
            Material crystal = MaterialFactory.Create("KingJadeCrystal", new Color(0.12f, 0.82f, 0.88f), 0.4f, 0.92f, new Color(0.04f, 0.9f, 1.5f));
            MaterialFactory.Primitive("RoyalGel", PrimitiveType.Sphere, root.transform, new Vector3(0f, 1.75f, 0f), new Vector3(3.5f, 2.75f, 3.15f), gel);
            MaterialFactory.Primitive("GoldBand", PrimitiveType.Cylinder, root.transform, new Vector3(0f, 2.7f, 0f), new Vector3(2.2f, 0.18f, 2.2f), gold);
            MaterialFactory.Primitive("CrownCrystal", PrimitiveType.Cylinder, root.transform, new Vector3(0f, 4.05f, 0f), new Vector3(0.72f, 1.6f, 0.72f), crystal);
            MaterialFactory.Primitive("CrownL", PrimitiveType.Cylinder, root.transform, new Vector3(-1.05f, 3.65f, 0f), new Vector3(0.5f, 1.15f, 0.5f), crystal, new Vector3(0f, 0f, 20f));
            MaterialFactory.Primitive("CrownR", PrimitiveType.Cylinder, root.transform, new Vector3(1.05f, 3.65f, 0f), new Vector3(0.5f, 1.15f, 0.5f), crystal, new Vector3(0f, 0f, -20f));
            MaterialFactory.Primitive("EyeL", PrimitiveType.Sphere, root.transform, new Vector3(-0.68f, 2.12f, 2.62f), Vector3.one * 0.32f, crystal);
            MaterialFactory.Primitive("EyeR", PrimitiveType.Sphere, root.transform, new Vector3(0.68f, 2.12f, 2.62f), Vector3.one * 0.32f, crystal);
            return root;
        }

        private static GameObject EnemyRoot(string name, float radius, float height)
        {
            GameObject root = new GameObject(name);
            CapsuleCollider colliderComponent = root.AddComponent<CapsuleCollider>();
            colliderComponent.center = new Vector3(0f, height * 0.5f, 0f);
            colliderComponent.height = height;
            colliderComponent.radius = radius;
            return root;
        }

        private static void AddCrystalPair(Transform root, Material material, float y)
        {
            MaterialFactory.Primitive("CrystalL", PrimitiveType.Cylinder, root, new Vector3(-0.34f, y, -0.12f), new Vector3(0.16f, 0.58f, 0.16f), material, new Vector3(0f, 0f, 22f));
            MaterialFactory.Primitive("CrystalR", PrimitiveType.Cylinder, root, new Vector3(0.34f, y + 0.08f, -0.08f), new Vector3(0.18f, 0.72f, 0.18f), material, new Vector3(0f, 0f, -18f));
        }
    }
}
