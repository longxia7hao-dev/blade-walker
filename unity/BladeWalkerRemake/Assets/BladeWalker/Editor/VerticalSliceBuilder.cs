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

        static VerticalSliceBuilder()
        {
            EditorApplication.delayCall += EnsureProjectReady;
        }

        [MenuItem("Blade Walker/Rebuild Storm Shrine Vertical Slice")]
        public static void RebuildVerticalSlice()
        {
            EnsureFolders();
            EnsurePipeline();

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
                    AssetDatabase.AddObjectToAsset(rendererData, pipeline);
                }
                EditorUtility.SetDirty(pipeline);
            }

            if (GraphicsSettings.defaultRenderPipeline != pipeline)
                GraphicsSettings.defaultRenderPipeline = pipeline;
            if (QualitySettings.renderPipeline != pipeline)
                QualitySettings.renderPipeline = pipeline;
        }
    }
}
