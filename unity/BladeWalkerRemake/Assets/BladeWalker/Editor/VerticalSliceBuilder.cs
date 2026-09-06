using System.IO;
using BladeWalker.Remake;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

namespace BladeWalker.Remake.Editor
{
    [InitializeOnLoad]
    public static class VerticalSliceBuilder
    {
        private const string SceneDirectory = "Assets/Scenes";
        private const string ScenePath = SceneDirectory + "/StormShrineVerticalSlice.unity";
        private const string SettingsDirectory = "Assets/BladeWalker/Settings";
        private const string PipelinePath = SettingsDirectory + "/BladeWalkerMobileURP.asset";
        private const string RendererPath = SettingsDirectory + "/BladeWalkerForwardRenderer.asset";
        private const string BuiltinRendererPath = "Assets/UniversalRenderer.asset";
        private const string ResourcesDirectory = "Assets/BladeWalker/Resources";
        private const string RuntimeMaterialsDirectory = ResourcesDirectory + "/RuntimeMaterials";
        private const string SurfaceMaterialPath = RuntimeMaterialsDirectory + "/SurfaceBase.mat";
        private const string ParticleMaterialPath = RuntimeMaterialsDirectory + "/ParticleBase.mat";
        private const string PathMaterialPath = RuntimeMaterialsDirectory + "/PathBase.mat";
        private const string SkyboxMaterialPath = RuntimeMaterialsDirectory + "/SkyboxBase.mat";

        static VerticalSliceBuilder()
        {
            EditorApplication.delayCall += EnsureProjectReady;
        }

        [MenuItem("Blade Walker/Rebuild Storm Shrine Vertical Slice")]
        public static void RebuildVerticalSlice()
        {
            EnsureFolders();
            EnsurePipeline();
            EnsureRuntimeMaterials();

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject bootstrap = new GameObject("BladeWalkerBootstrap");
            bootstrap.AddComponent<GameBootstrap>();
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };

            PlayerSettings.companyName = "Long Studio";
            PlayerSettings.productName = "Blade Walker Remake";
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.colorSpace = ColorSpace.Linear;
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Selection.activeGameObject = bootstrap;
            Debug.Log("Blade Walker: Storm Shrine vertical slice rebuilt. Press Play to run it.");
        }

        private static void EnsureProjectReady()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode) return;
            EnsureFolders();
            EnsurePipeline();
            EnsureRuntimeMaterials();
            if (!File.Exists(ScenePath)) RebuildVerticalSlice();
        }

        private static void EnsureFolders()
        {
            if (!AssetDatabase.IsValidFolder(SceneDirectory)) AssetDatabase.CreateFolder("Assets", "Scenes");
            if (!AssetDatabase.IsValidFolder("Assets/BladeWalker/Settings"))
            {
                if (!AssetDatabase.IsValidFolder("Assets/BladeWalker")) AssetDatabase.CreateFolder("Assets", "BladeWalker");
                AssetDatabase.CreateFolder("Assets/BladeWalker", "Settings");
            }
            if (!AssetDatabase.IsValidFolder(ResourcesDirectory))
                AssetDatabase.CreateFolder("Assets/BladeWalker", "Resources");
            if (!AssetDatabase.IsValidFolder(RuntimeMaterialsDirectory))
                AssetDatabase.CreateFolder(ResourcesDirectory, "RuntimeMaterials");
        }

        private static void EnsurePipeline()
        {
            UniversalRenderPipelineAsset pipeline = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(PipelinePath);
            if (pipeline == null)
            {
                pipeline = UniversalRenderPipelineAsset.Create();
                ScriptableRendererData rendererData = pipeline.LoadBuiltinRendererData(RendererType.UniversalRenderer);
                pipeline.name = "BladeWalkerMobileURP";
                pipeline.supportsCameraDepthTexture = true;
                pipeline.supportsCameraOpaqueTexture = false;
                pipeline.renderScale = 1f;
                pipeline.msaaSampleCount = 2;
                pipeline.shadowDistance = 62f;
                pipeline.shadowCascadeCount = 2;
                AssetDatabase.CreateAsset(pipeline, PipelinePath);
                if (rendererData != null)
                {
                    rendererData.name = "BladeWalkerForwardRenderer";
                    string rendererAssetPath = AssetDatabase.GetAssetPath(rendererData);
                    if (rendererAssetPath == BuiltinRendererPath)
                    {
                        string moveError = AssetDatabase.MoveAsset(BuiltinRendererPath, RendererPath);
                        if (!string.IsNullOrEmpty(moveError))
                            throw new IOException("Could not place the URP renderer asset: " + moveError);
                    }
                    EditorUtility.SetDirty(rendererData);
                }
                EditorUtility.SetDirty(pipeline);
            }

            if (GraphicsSettings.defaultRenderPipeline != pipeline)
                GraphicsSettings.defaultRenderPipeline = pipeline;
            if (QualitySettings.renderPipeline != pipeline)
                QualitySettings.renderPipeline = pipeline;
        }

        private static void EnsureRuntimeMaterials()
        {
            Shader surfaceShader = RequireShader("Universal Render Pipeline/Lit");
            Shader particleShader = RequireShader("Universal Render Pipeline/Particles/Unlit");
            Shader skyboxShader = RequireShader("Skybox/Procedural");
            Shader pathShader = Shader.Find("BladeWalker/StormSurface");
            if (pathShader == null || !pathShader.isSupported) pathShader = surfaceShader;

            Material surface = EnsureMaterialAsset(SurfaceMaterialPath, surfaceShader);
            if (surface.HasProperty("_BaseColor")) surface.SetColor("_BaseColor", Color.white);
            if (surface.HasProperty("_Metallic")) surface.SetFloat("_Metallic", 0f);
            if (surface.HasProperty("_Smoothness")) surface.SetFloat("_Smoothness", 0.45f);
            if (surface.HasProperty("_EmissionColor"))
            {
                surface.EnableKeyword("_EMISSION");
                surface.SetColor("_EmissionColor", Color.black);
            }

            Material particle = EnsureMaterialAsset(ParticleMaterialPath, particleShader);
            if (particle.HasProperty("_Surface")) particle.SetFloat("_Surface", 1f);
            if (particle.HasProperty("_ZWrite")) particle.SetFloat("_ZWrite", 0f);
            if (particle.HasProperty("_SrcBlend"))
                particle.SetFloat("_SrcBlend", (float)BlendMode.SrcAlpha);
            if (particle.HasProperty("_DstBlend"))
                particle.SetFloat("_DstBlend", (float)BlendMode.OneMinusSrcAlpha);
            particle.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            particle.renderQueue = (int)RenderQueue.Transparent;

            Material path = EnsureMaterialAsset(PathMaterialPath, pathShader);
            if (path.HasProperty("_BaseColor"))
                path.SetColor("_BaseColor", new Color(0.12f, 0.18f, 0.19f));
            if (path.HasProperty("_EdgeColor"))
                path.SetColor("_EdgeColor", new Color(0.24f, 0.38f, 0.4f));
            if (path.HasProperty("_Wetness")) path.SetFloat("_Wetness", 0.88f);
            if (path.HasProperty("_Metallic")) path.SetFloat("_Metallic", 0.12f);
            if (path.HasProperty("_Smoothness")) path.SetFloat("_Smoothness", 0.86f);

            EnsureMaterialAsset(SkyboxMaterialPath, skyboxShader);
            AssetDatabase.SaveAssets();
        }

        private static Shader RequireShader(string shaderName)
        {
            Shader shader = Shader.Find(shaderName);
            if (shader == null)
                throw new IOException("Required runtime shader is unavailable: " + shaderName);
            return shader;
        }

        private static Material EnsureMaterialAsset(string path, Shader shader)
        {
            Material material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (material == null)
            {
                material = new Material(shader) { name = Path.GetFileNameWithoutExtension(path) };
                AssetDatabase.CreateAsset(material, path);
            }
            else if (material.shader != shader)
            {
                material.shader = shader;
            }

            EditorUtility.SetDirty(material);
            return material;
        }
    }
}
