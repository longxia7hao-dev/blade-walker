using System.Collections;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    public sealed class CombatVfx : MonoBehaviour
    {
        public static void SpawnSliceImpact(Vector3 position, Vector2 screenDirection, bool critical)
        {
            GameObject root = new GameObject(critical ? "CriticalSliceBurst" : "SliceBurst");
            root.transform.position = position;
            root.transform.rotation = Quaternion.Euler(0f, Mathf.Atan2(screenDirection.y, screenDirection.x) * Mathf.Rad2Deg, 0f);
            ParticleSystem particles = CreateParticles(
                root,
                critical ? new Color(1f, 0.78f, 0.24f, 1f) : new Color(0.22f, 0.9f, 1f, 1f),
                critical ? 18 : 10,
                critical ? 6.8f : 4.5f,
                critical ? 0.15f : 0.1f);
            particles.Play();
            Destroy(root, 1.2f);
        }

        public static void SpawnDefeatBurst(Vector3 position, float scale, bool boss)
        {
            GameObject root = new GameObject(boss ? "BossCrystalBreak" : "MonsterCrystalBreak");
            root.transform.position = position;
            ParticleSystem particles = CreateParticles(
                root,
                boss ? new Color(1f, 0.54f, 0.12f, 1f) : new Color(0.12f, 0.84f, 0.94f, 1f),
                boss ? 64 : 24,
                boss ? 10f : 6f,
                (boss ? 0.18f : 0.11f) * scale);
            particles.Play();

            int shardCount = boss ? 10 : 4;
            for (int i = 0; i < shardCount; i++)
            {
                GameObject shard = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                shard.name = "SlicedCrystalShard";
                shard.transform.SetParent(root.transform, false);
                shard.transform.localPosition = Random.insideUnitSphere * (0.2f * scale);
                shard.transform.localScale = new Vector3(0.08f, 0.3f, 0.08f) * scale;
                shard.transform.rotation = Random.rotation;
                Collider colliderComponent = shard.GetComponent<Collider>();
                if (colliderComponent != null) Destroy(colliderComponent);
                MaterialFactory.Apply(shard, MaterialFactory.Create(
                    "CutShard",
                    boss ? new Color(1f, 0.42f, 0.08f) : new Color(0.1f, 0.72f, 0.86f),
                    0.42f,
                    0.88f,
                    boss ? new Color(1.4f, 0.2f, 0.02f) : new Color(0.02f, 0.8f, 1.4f)));
                Rigidbody body = shard.AddComponent<Rigidbody>();
                Vector3 side = i % 2 == 0 ? Vector3.left : Vector3.right;
                body.linearVelocity = (side * Random.Range(2.5f, 5f) + Vector3.up * Random.Range(2.8f, 6f) + Random.insideUnitSphere) * scale;
                body.angularVelocity = Random.insideUnitSphere * 9f;
            }

            Destroy(root, boss ? 2.4f : 1.5f);
        }

        public static void SpawnSlash(Vector3 position, Quaternion rotation)
        {
            GameObject root = new GameObject("FrostSlashVFX");
            root.transform.position = position;
            root.transform.rotation = rotation * Quaternion.Euler(10f, 0f, 14f);
            CombatVfx effect = root.AddComponent<CombatVfx>();
            effect.StartCoroutine(effect.SlashRoutine());
        }

        private IEnumerator SlashRoutine()
        {
            GameObject arc = GameObject.CreatePrimitive(PrimitiveType.Cube);
            arc.name = "SlashArc";
            arc.transform.SetParent(transform, false);
            arc.transform.localPosition = new Vector3(0f, 0f, 2.2f);
            arc.transform.localScale = new Vector3(0.05f, 0.09f, 4.4f);
            Collider colliderComponent = arc.GetComponent<Collider>();
            if (colliderComponent != null) Destroy(colliderComponent);
            Renderer rendererComponent = arc.GetComponent<Renderer>();
            rendererComponent.material = MaterialFactory.Create(
                "FrostSlash",
                new Color(0.38f, 0.92f, 1f),
                0.3f,
                0.9f,
                new Color(0.2f, 2.3f, 3f));

            float duration = 0.2f;
            for (float time = 0f; time < duration; time += Time.deltaTime)
            {
                float p = time / duration;
                transform.localRotation = Quaternion.Euler(0f, Mathf.Lerp(-62f, 72f, p), Mathf.Sin(p * Mathf.PI) * 24f);
                arc.transform.localScale = new Vector3(0.05f, Mathf.Lerp(0.12f, 0.015f, p), 4.4f);
                yield return null;
            }
            Destroy(gameObject);
        }

        private static ParticleSystem CreateParticles(GameObject root, Color color, int count, float speed, float size)
        {
            ParticleSystem particles = root.AddComponent<ParticleSystem>();
            ParticleSystem.MainModule main = particles.main;
            main.loop = false;
            main.duration = 0.32f;
            main.startLifetime = new ParticleSystem.MinMaxCurve(0.22f, 0.55f);
            main.startSpeed = new ParticleSystem.MinMaxCurve(speed * 0.55f, speed);
            main.startSize = new ParticleSystem.MinMaxCurve(size * 0.45f, size);
            main.startColor = color;
            main.gravityModifier = 0.7f;
            main.simulationSpace = ParticleSystemSimulationSpace.World;

            ParticleSystem.EmissionModule emission = particles.emission;
            emission.rateOverTime = 0f;
            emission.SetBursts(new[] { new ParticleSystem.Burst(0f, (short)count) });
            ParticleSystem.ShapeModule shape = particles.shape;
            shape.shapeType = ParticleSystemShapeType.Sphere;
            shape.radius = 0.18f;

            ParticleSystemRenderer rendererComponent = particles.GetComponent<ParticleSystemRenderer>();
            Shader shader = Shader.Find("Universal Render Pipeline/Particles/Unlit");
            if (shader == null) shader = Shader.Find("Particles/Standard Unlit");
            Material material = new Material(shader) { name = "SliceParticle" };
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", color * 2.2f);
            }
            rendererComponent.material = material;
            rendererComponent.renderMode = ParticleSystemRenderMode.Stretch;
            rendererComponent.lengthScale = 2.4f;
            rendererComponent.velocityScale = 0.18f;
            return particles;
        }
    }
}
