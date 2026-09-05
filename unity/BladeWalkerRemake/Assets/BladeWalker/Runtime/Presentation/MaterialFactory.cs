using System;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    public static class MaterialFactory
    {
        private const string SurfaceTemplatePath = "RuntimeMaterials/SurfaceBase";
        private const string ParticleTemplatePath = "RuntimeMaterials/ParticleBase";
        private const string PathTemplatePath = "RuntimeMaterials/PathBase";
        private const string SkyboxTemplatePath = "RuntimeMaterials/SkyboxBase";

        public static Material Create(
            string name,
            Color color,
            float metallic = 0f,
            float smoothness = 0.45f,
            Color? emission = null)
        {
            Material material = CloneTemplate(
                SurfaceTemplatePath,
                name,
                "Universal Render Pipeline/Lit",
                "Standard");

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

        public static Material CreateParticle(string name)
        {
            return CloneTemplate(
                ParticleTemplatePath,
                name,
                "Universal Render Pipeline/Particles/Unlit",
                "Particles/Standard Unlit",
                "Sprites/Default");
        }

        public static Material CreatePath(string name)
        {
            return CloneTemplate(
                PathTemplatePath,
                name,
                "BladeWalker/StormSurface",
                "Universal Render Pipeline/Lit",
                "Standard");
        }

        public static Material CreateSkybox(string name)
        {
            return CloneTemplate(SkyboxTemplatePath, name, "Skybox/Procedural");
        }

        public static Shader RequireShader(params string[] candidates)
        {
            foreach (string candidate in candidates)
            {
                Shader shader = Shader.Find(candidate);
                if (shader != null) return shader;
            }

            throw new InvalidOperationException(
                "None of the required shaders are available: " + string.Join(", ", candidates));
        }

        private static Material CloneTemplate(
            string resourcePath,
            string name,
            params string[] fallbackShaders)
        {
            Material template = Resources.Load<Material>(resourcePath);
            Material material = template != null
                ? new Material(template)
                : new Material(RequireShader(fallbackShaders));
            material.name = name;
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
            if (colliderComponent != null) UnityEngine.Object.Destroy(colliderComponent);
            return part;
        }
    }
}
