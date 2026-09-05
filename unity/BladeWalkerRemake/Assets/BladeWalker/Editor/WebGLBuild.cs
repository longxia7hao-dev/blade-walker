using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace BladeWalker.Remake.Editor
{
    /// <summary>
    /// Deterministic command-line build entry point for the phone Web preview.
    /// Invoke Unity with -buildTarget WebGL before -executeMethod; Unity cannot
    /// switch the active target while an Editor batch-mode method is running.
    /// </summary>
    public static class WebGLBuild
    {
        private const string ScenePath = "Assets/Scenes/StormShrineVerticalSlice.unity";
        private const string OutputDirectory = "Builds/WebGL";

        [MenuItem("Blade Walker/Build Phone Web Preview")]
        public static void BuildPhonePreview()
        {
            if (!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.WebGL, BuildTarget.WebGL))
            {
                throw new BuildFailedException(
                    "WebGL Build Support is not installed for this Unity editor.");
            }

            if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.WebGL)
            {
                throw new BuildFailedException(
                    "WebGL is not the active target. Run Unity with '-buildTarget WebGL' "
                    + "or switch the platform in Build Profiles first.");
            }

            VerticalSliceBuilder.RebuildVerticalSlice();
            ConfigurePlayer();

            string projectRoot = Path.GetFullPath(Path.Combine(Application.dataPath, ".."));
            string outputPath = Path.GetFullPath(Path.Combine(projectRoot, OutputDirectory));
            RecreateOutputDirectory(projectRoot, outputPath);

            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = outputPath,
                target = BuildTarget.WebGL,
                targetGroup = BuildTargetGroup.WebGL,
                options = BuildOptions.None,
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;
            if (summary.result != BuildResult.Succeeded)
            {
                throw new BuildFailedException(
                    $"Blade Walker WebGL build {summary.result}:\n{report.SummarizeErrors()}");
            }

            Debug.Log(
                $"Blade Walker WebGL build succeeded: {summary.totalSize} bytes in "
                + $"{summary.totalTime}. Output: {outputPath}");
        }

        private static void ConfigurePlayer()
        {
            PlayerSettings.companyName = "Long Studio";
            PlayerSettings.productName = "Blade Walker Remake";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.defaultWebScreenWidth = 540;
            PlayerSettings.defaultWebScreenHeight = 960;
            PlayerSettings.runInBackground = false;
            PlayerSettings.colorSpace = ColorSpace.Linear;

            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.nameFilesAsHashes = true;
            PlayerSettings.WebGL.dataCaching = false;
            PlayerSettings.WebGL.threadsSupport = false;
            PlayerSettings.WebGL.wasm2023 = false;
            PlayerSettings.WebGL.showDiagnostics = false;
            PlayerSettings.WebGL.template = "PROJECT:BladeWalkerMobile";

            AssetDatabase.SaveAssets();
        }

        private static void RecreateOutputDirectory(string projectRoot, string outputPath)
        {
            string allowedRoot = Path.GetFullPath(Path.Combine(projectRoot, "Builds"));
            string allowedPrefix = allowedRoot.TrimEnd(Path.DirectorySeparatorChar)
                + Path.DirectorySeparatorChar;
            if (!outputPath.StartsWith(allowedPrefix, StringComparison.Ordinal))
            {
                throw new BuildFailedException(
                    $"Refusing to clear WebGL output outside {allowedRoot}: {outputPath}");
            }

            if (Directory.Exists(outputPath)) Directory.Delete(outputPath, true);
            Directory.CreateDirectory(outputPath);
        }
    }
}
