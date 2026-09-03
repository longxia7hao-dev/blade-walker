using System.Collections;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    public sealed class CombatVfx : MonoBehaviour
    {
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
    }
}
