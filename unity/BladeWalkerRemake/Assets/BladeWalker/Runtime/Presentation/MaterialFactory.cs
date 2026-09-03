using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    public static class MaterialFactory
    {
        public static Material Create(
            string name,
            Color color,
            float metallic = 0f,
            float smoothness = 0.45f,
            Color? emission = null)
        {
            Shader shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Standard");
            Material material = new Material(shader) { name = name };

            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", metallic);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);

            if (emission.HasValue && material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", emission.Value);
            }
            return material;
        }

        public static void Apply(GameObject gameObject, Material material)
        {
            Renderer rendererComponent = gameObject.GetComponent<Renderer>();
            if (rendererComponent != null) rendererComponent.sharedMaterial = material;
        }

        public static GameObject Primitive(
            string name,
            PrimitiveType type,
            Transform parent,
            Vector3 localPosition,
            Vector3 localScale,
            Material material,
            Vector3? localEuler = null)
        {
            GameObject part = GameObject.CreatePrimitive(type);
            part.name = name;
            part.transform.SetParent(parent, false);
            part.transform.localPosition = localPosition;
            part.transform.localScale = localScale;
            if (localEuler.HasValue) part.transform.localEulerAngles = localEuler.Value;
            Apply(part, material);
            Collider colliderComponent = part.GetComponent<Collider>();
            if (colliderComponent != null) Object.Destroy(colliderComponent);
            return part;
        }
    }
}
