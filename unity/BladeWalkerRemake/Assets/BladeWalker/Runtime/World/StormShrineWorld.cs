using System.Collections.Generic;
using BladeWalker.Remake.Presentation;
using UnityEngine;

namespace BladeWalker.Remake.World
{
    public static class StormShrineWorld
    {
        private static Material _stone;
        private static Material _path;
        private static Material _wood;
        private static Material _gold;
        private static Material _crystal;
        private static Material _ground;

        public static GameObject Build(RouteNetwork network)
        {
            CreateMaterials();
            GameObject root = new GameObject("StormShrineWorld");

            CreateGround(root.transform);
            foreach (RouteSpline segment in network.Segments.Values)
                CreateRouteMesh(root.transform, segment);

            CreateJunctionLandmarks(root.transform, network);
            CreateArena(root.transform, network["left_arena"].SampleDistance(network["left_arena"].Length));
            CreateArena(root.transform, network["right_arena"].SampleDistance(network["right_arena"].Length));
            ScatterSetPieces(root.transform, network);
            CreateRain(root.transform);
            return root;
        }

        private static void CreateMaterials()
        {
            _stone = MaterialFactory.Create("ShrineStone", new Color(0.055f, 0.085f, 0.105f), 0.05f, 0.32f);
            _wood = MaterialFactory.Create("LacqueredWood", new Color(0.18f, 0.025f, 0.035f), 0.08f, 0.58f);
            _gold = MaterialFactory.Create("AgedGold", new Color(0.56f, 0.34f, 0.07f), 0.82f, 0.68f);
            _crystal = MaterialFactory.Create(
                "StormCrystal",
                new Color(0.08f, 0.72f, 0.82f),
                0.36f,
                0.92f,
                new Color(0.02f, 0.8f, 1.35f));
            _ground = MaterialFactory.Create("ValleyGround", new Color(0.018f, 0.034f, 0.038f), 0f, 0.18f);

            _path = MaterialFactory.CreatePath("WetStormPath");
        }

        private static void CreateGround(Transform parent)
        {
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "MountainValleyGround";
            ground.transform.SetParent(parent, false);
            ground.transform.position = new Vector3(0f, -0.32f, 68f);
            ground.transform.localScale = new Vector3(24f, 1f, 22f);
            MaterialFactory.Apply(ground, _ground);

            for (int i = 0; i < 24; i++)
            {
                float side = i % 2 == 0 ? -1f : 1f;
                float z = 4f + i * 5.8f;
                float x = side * (52f + Mathf.Sin(i * 1.73f) * 7f);
                GameObject cliff = MaterialFactory.Primitive(
                    "CliffMass",
                    PrimitiveType.Sphere,
                    parent,
                    new Vector3(x, 2f + (i % 3), z),
                    new Vector3(8f + i % 4, 6f + i % 5, 10f + i % 3),
                    _stone);
                cliff.transform.rotation = Quaternion.Euler(i * 17f, i * 31f, i * 9f);
            }
        }

        private static void CreateRouteMesh(Transform parent, RouteSpline segment)
        {
            const int samples = 72;
            const int crossSections = 6;
            List<Vector3> vertices = new List<Vector3>((samples + 1) * crossSections);
            List<Vector3> normals = new List<Vector3>((samples + 1) * crossSections);
            List<Vector2> uvs = new List<Vector2>((samples + 1) * crossSections);
            List<int> triangles = new List<int>(samples * (crossSections - 1) * 6);

            for (int i = 0; i <= samples; i++)
            {
                float distance = segment.Length * i / samples;
                RouteFrame frame = segment.SampleDistance(distance);
                float irregular = Mathf.Sin(i * 2.173f) * 0.16f + Mathf.Sin(i * 0.71f) * 0.09f;
                for (int x = 0; x < crossSections; x++)
                {
                    float across = x / (float)(crossSections - 1);
                    float lateral = Mathf.Lerp(-frame.Width * 0.5f, frame.Width * 0.5f, across);
                    float crown = Mathf.Sin(across * Mathf.PI) * 0.12f;
                    Vector3 position = frame.Offset(lateral, crown + irregular * (0.25f + Mathf.Abs(across - 0.5f)));
                    vertices.Add(position);
                    normals.Add(Vector3.up);
                    uvs.Add(new Vector2(across * 2.2f, distance * 0.17f));
                }
            }

            for (int z = 0; z < samples; z++)
            {
                for (int x = 0; x < crossSections - 1; x++)
                {
                    int a = z * crossSections + x;
                    int b = a + crossSections;
                    triangles.Add(a);
                    triangles.Add(b);
                    triangles.Add(a + 1);
                    triangles.Add(a + 1);
                    triangles.Add(b);
                    triangles.Add(b + 1);
                }
            }

            Mesh mesh = new Mesh { name = "Route_" + segment.Id };
            mesh.SetVertices(vertices);
            mesh.SetNormals(normals);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(triangles, 0);
            mesh.RecalculateTangents();
            mesh.RecalculateBounds();

            GameObject route = new GameObject("Route_" + segment.Id);
            route.transform.SetParent(parent, false);
            MeshFilter filter = route.AddComponent<MeshFilter>();
            filter.sharedMesh = mesh;
            MeshRenderer rendererComponent = route.AddComponent<MeshRenderer>();
            rendererComponent.sharedMaterial = _path;
            rendererComponent.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
            rendererComponent.receiveShadows = true;
            MeshCollider colliderComponent = route.AddComponent<MeshCollider>();
            colliderComponent.sharedMesh = mesh;

            AddRouteEdgeStones(route.transform, segment);
        }

        private static void AddRouteEdgeStones(Transform parent, RouteSpline segment)
        {
            int count = Mathf.CeilToInt(segment.Length / 4.2f);
            for (int i = 1; i < count; i++)
            {
                RouteFrame frame = segment.SampleDistance(i * segment.Length / count);
                float side = i % 2 == 0 ? -1f : 1f;
                float offset = frame.Width * 0.52f + Mathf.Sin(i * 1.31f) * 0.28f;
                GameObject stone = MaterialFactory.Primitive(
                    "EdgeStone",
                    PrimitiveType.Sphere,
                    parent,
                    frame.Offset(offset * side, 0.05f),
                    new Vector3(0.9f + i % 3 * 0.16f, 0.45f, 0.68f),
                    _stone);
                stone.transform.rotation = Quaternion.Euler(i * 13f, i * 29f, i * 7f);
            }
        }

        private static void CreateJunctionLandmarks(Transform parent, RouteNetwork network)
        {
            RouteFrame fork = network["approach"].SampleDistance(network["approach"].Length);
            CreateTorii(parent, fork.Offset(-5.3f, 0f), Quaternion.LookRotation(network["left_shrine"].SampleDistance(2f).Forward), 0.92f);
            CreateTorii(parent, fork.Offset(5.3f, 0f), Quaternion.LookRotation(network["right_ruins"].SampleDistance(2f).Forward), 0.92f);

            GameObject beaconL = MaterialFactory.Primitive("LeftBeacon", PrimitiveType.Cylinder, parent, fork.Offset(-3.6f, 1.1f), new Vector3(0.28f, 2.2f, 0.28f), _crystal);
            beaconL.transform.rotation = Quaternion.Euler(0f, 0f, 9f);
            GameObject beaconR = MaterialFactory.Primitive("RightBeacon", PrimitiveType.Cylinder, parent, fork.Offset(3.6f, 1.1f), new Vector3(0.28f, 2.2f, 0.28f), _crystal);
            beaconR.transform.rotation = Quaternion.Euler(0f, 0f, -9f);
        }

        private static void ScatterSetPieces(Transform parent, RouteNetwork network)
        {
            int seed = 7319;
            Random.State previous = Random.state;
            Random.InitState(seed);
            foreach (RouteSpline segment in network.Segments.Values)
            {
                int count = Mathf.CeilToInt(segment.Length / 12f);
                for (int i = 1; i < count; i++)
                {
                    RouteFrame frame = segment.SampleDistance(i * segment.Length / count);
                    float side = i % 2 == 0 ? -1f : 1f;
                    Vector3 position = frame.Offset(side * Random.Range(7f, 11f), 0f);
                    if ((i + segment.Id.Length) % 3 == 0)
                        CreateTorii(parent, position, Quaternion.LookRotation(frame.Forward), Random.Range(0.72f, 1.05f));
                    else
                        CreateCrystalCluster(parent, position, Random.Range(0.7f, 1.25f), i % 5 == 0);
                }
            }
            Random.state = previous;
        }

        private static void CreateTorii(Transform parent, Vector3 position, Quaternion rotation, float scale)
        {
            GameObject root = new GameObject("StormTorii");
            root.transform.SetParent(parent, false);
            root.transform.position = position;
            root.transform.rotation = rotation;
            root.transform.localScale = Vector3.one * scale;
            MaterialFactory.Primitive("PostL", PrimitiveType.Cylinder, root.transform, new Vector3(-2f, 2f, 0f), new Vector3(0.27f, 2f, 0.27f), _wood);
            MaterialFactory.Primitive("PostR", PrimitiveType.Cylinder, root.transform, new Vector3(2f, 2f, 0f), new Vector3(0.27f, 2f, 0.27f), _wood);
            MaterialFactory.Primitive("Lintel", PrimitiveType.Cube, root.transform, new Vector3(0f, 3.9f, 0f), new Vector3(5.2f, 0.3f, 0.4f), _wood);
            MaterialFactory.Primitive("GoldTrim", PrimitiveType.Cube, root.transform, new Vector3(0f, 4.22f, 0f), new Vector3(5.7f, 0.08f, 0.48f), _gold);
        }

        private static void CreateCrystalCluster(Transform parent, Vector3 position, float scale, bool addLight = false)
        {
            GameObject root = new GameObject("StormCrystalCluster");
            root.transform.SetParent(parent, false);
            root.transform.position = position;
            root.transform.localScale = Vector3.one * scale;
            for (int i = 0; i < 4; i++)
            {
                GameObject crystal = MaterialFactory.Primitive(
                    "Crystal",
                    PrimitiveType.Cylinder,
                    root.transform,
                    new Vector3((i - 1.5f) * 0.42f, 0.55f + i * 0.18f, (i % 2) * 0.25f),
                    new Vector3(0.24f + i * 0.03f, 1.1f + i * 0.28f, 0.24f + i * 0.03f),
                    _crystal,
                    new Vector3(0f, i * 37f, (i - 1.5f) * 9f));
                crystal.transform.localRotation *= Quaternion.Euler(0f, 0f, i * 5f);
            }

            if (addLight)
            {
                Light lightComponent = root.AddComponent<Light>();
                lightComponent.type = LightType.Point;
                lightComponent.color = new Color(0.12f, 0.76f, 1f);
                lightComponent.intensity = 2.2f;
                lightComponent.range = 7f;
                lightComponent.shadows = LightShadows.None;
            }
        }

        private static void CreateArena(Transform parent, RouteFrame frame)
        {
            GameObject arena = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            arena.name = "SlimeKingArena";
            arena.transform.SetParent(parent, false);
            arena.transform.position = frame.Position - Vector3.up * 0.18f;
            arena.transform.localScale = new Vector3(8f, 0.18f, 8f);
            MaterialFactory.Apply(arena, _stone);

            for (int i = 0; i < 10; i++)
            {
                float angle = i / 10f * Mathf.PI * 2f;
                Vector3 offset = new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle)) * 7.2f;
                CreateCrystalCluster(parent, frame.Position + offset, 0.62f + (i % 3) * 0.14f, i % 5 == 0);
            }
        }

        private static void CreateRain(Transform parent)
        {
            GameObject rainObject = new GameObject("StormRain");
            rainObject.transform.SetParent(parent, false);
            rainObject.transform.position = new Vector3(0f, 18f, 70f);
            ParticleSystem rain = rainObject.AddComponent<ParticleSystem>();
            ParticleSystem.MainModule main = rain.main;
            main.loop = true;
            main.startLifetime = 2.2f;
            main.startSpeed = 22f;
            main.startSize = new ParticleSystem.MinMaxCurve(0.025f, 0.055f);
            main.maxParticles = 1300;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.startColor = new Color(0.38f, 0.68f, 0.82f, 0.46f);
            ParticleSystem.EmissionModule emission = rain.emission;
            emission.rateOverTime = 480f;
            ParticleSystem.ShapeModule shape = rain.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(120f, 2f, 160f);
            ParticleSystem.VelocityOverLifetimeModule velocity = rain.velocityOverLifetime;
            velocity.enabled = true;
            velocity.y = -18f;
            velocity.x = -2.4f;

            ParticleSystemRenderer rendererComponent = rain.GetComponent<ParticleSystemRenderer>();
            rendererComponent.material = MaterialFactory.CreateParticle("StormRainMaterial");
            rendererComponent.renderMode = ParticleSystemRenderMode.Stretch;
            rendererComponent.lengthScale = 7f;
            rendererComponent.velocityScale = 0.18f;
        }
    }
}
