using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace BladeWalker.Remake.Presentation
{
    public static class QualityDirector
    {
        public static void Configure(Camera camera, Transform parent)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            Application.targetFrameRate = 30;
#else
            Application.targetFrameRate = 60;
#endif
            QualitySettings.vSyncCount = 0;
            QualitySettings.shadowDistance = 62f;
            QualitySettings.lodBias = 1.35f;

            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = new Color(0.24f, 0.38f, 0.46f);
            RenderSettings.fogDensity = 0.0065f;
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.42f, 0.58f, 0.72f);
            RenderSettings.ambientEquatorColor = new Color(0.28f, 0.36f, 0.38f);
            RenderSettings.ambientGroundColor = new Color(0.13f, 0.17f, 0.15f);
            RenderSettings.reflectionIntensity = 0.85f;

            UniversalAdditionalCameraData cameraData = camera.GetUniversalAdditionalCameraData();
            cameraData.renderPostProcessing = true;
            cameraData.antialiasing = AntialiasingMode.FastApproximateAntialiasing;
            cameraData.dithering = true;
            cameraData.renderShadows = true;

            GameObject volumeObject = new GameObject("GlobalPostFX");
            volumeObject.transform.SetParent(parent, false);
            Volume volume = volumeObject.AddComponent<Volume>();
            volume.isGlobal = true;
            volume.priority = 20f;
            volume.profile = ScriptableObject.CreateInstance<VolumeProfile>();

            Bloom bloom = volume.profile.Add<Bloom>();
            bloom.active = true;
            bloom.intensity.Override(0.32f);
            bloom.threshold.Override(1.15f);
            bloom.scatter.Override(0.5f);
            bloom.highQualityFiltering.Override(false);

            Tonemapping tonemapping = volume.profile.Add<Tonemapping>();
            tonemapping.active = true;
            tonemapping.mode.Override(TonemappingMode.ACES);

            ColorAdjustments color = volume.profile.Add<ColorAdjustments>();
            color.active = true;
            color.postExposure.Override(0.55f);
            color.contrast.Override(6f);
            color.saturation.Override(-2f);
            color.colorFilter.Override(new Color(1f, 0.98f, 0.92f));

            Vignette vignette = volume.profile.Add<Vignette>();
            vignette.active = true;
            vignette.color.Override(new Color(0.03f, 0.06f, 0.07f));
            vignette.intensity.Override(0.12f);
            vignette.smoothness.Override(0.72f);

            UniversalRenderPipelineAsset pipeline = GraphicsSettings.currentRenderPipeline as UniversalRenderPipelineAsset;
            if (pipeline != null)
            {
                pipeline.renderScale = SystemInfo.systemMemorySize < 5000 ? 0.84f : 1f;
                pipeline.shadowDistance = 62f;
                pipeline.shadowCascadeCount = 2;
                pipeline.supportsCameraDepthTexture = true;
                pipeline.supportsCameraOpaqueTexture = false;
                pipeline.msaaSampleCount = 2;
            }

            CreateLighting(parent);
        }

        private static void CreateLighting(Transform parent)
        {
            GameObject sunObject = new GameObject("StormDaySun");
            sunObject.transform.SetParent(parent, false);
            sunObject.transform.rotation = Quaternion.Euler(50f, -35f, 0f);
            Light sun = sunObject.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1f, 0.93f, 0.8f);
            sun.intensity = 1.75f;
            sun.shadows = LightShadows.Soft;
            sun.shadowStrength = 0.58f;
            sun.shadowBias = 0.08f;
            RenderSettings.sun = sun;

            GameObject rimObject = new GameObject("WarmShrineRim");
            rimObject.transform.SetParent(parent, false);
            rimObject.transform.position = new Vector3(0f, 11f, 55f);
            Light rim = rimObject.AddComponent<Light>();
            rim.type = LightType.Point;
            rim.color = new Color(1f, 0.52f, 0.17f);
            rim.intensity = 6f;
            rim.range = 42f;
            rim.shadows = LightShadows.None;
        }
    }
}
