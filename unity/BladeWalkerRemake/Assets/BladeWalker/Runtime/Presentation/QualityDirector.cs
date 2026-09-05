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
            RenderSettings.fogColor = new Color(0.018f, 0.055f, 0.075f);
            RenderSettings.fogDensity = 0.012f;
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.08f, 0.16f, 0.24f);
            RenderSettings.ambientEquatorColor = new Color(0.035f, 0.075f, 0.09f);
            RenderSettings.ambientGroundColor = new Color(0.012f, 0.018f, 0.022f);

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
            bloom.intensity.Override(0.48f);
            bloom.threshold.Override(1.08f);
            bloom.scatter.Override(0.58f);
            bloom.highQualityFiltering.Override(false);

            Tonemapping tonemapping = volume.profile.Add<Tonemapping>();
            tonemapping.active = true;
            tonemapping.mode.Override(TonemappingMode.ACES);

            ColorAdjustments color = volume.profile.Add<ColorAdjustments>();
            color.active = true;
            color.postExposure.Override(-0.18f);
            color.contrast.Override(15f);
            color.saturation.Override(-8f);
            color.colorFilter.Override(new Color(0.88f, 0.96f, 1f));

            Vignette vignette = volume.profile.Add<Vignette>();
            vignette.active = true;
            vignette.color.Override(new Color(0.005f, 0.012f, 0.025f));
            vignette.intensity.Override(0.27f);
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
            GameObject moonObject = new GameObject("StormMoonKey");
            moonObject.transform.SetParent(parent, false);
            moonObject.transform.rotation = Quaternion.Euler(43f, -28f, 0f);
            Light moon = moonObject.AddComponent<Light>();
            moon.type = LightType.Directional;
            moon.color = new Color(0.46f, 0.72f, 1f);
            moon.intensity = 1.35f;
            moon.shadows = LightShadows.Soft;
            moon.shadowStrength = 0.78f;
            moon.shadowBias = 0.08f;

            GameObject rimObject = new GameObject("WarmShrineRim");
            rimObject.transform.SetParent(parent, false);
            rimObject.transform.position = new Vector3(0f, 11f, 55f);
            Light rim = rimObject.AddComponent<Light>();
            rim.type = LightType.Point;
            rim.color = new Color(1f, 0.52f, 0.17f);
            rim.intensity = 8f;
            rim.range = 34f;
            rim.shadows = LightShadows.None;
        }
    }
}
