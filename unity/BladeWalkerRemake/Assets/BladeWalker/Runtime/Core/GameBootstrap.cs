using BladeWalker.Remake.Combat;
using BladeWalker.Remake.Presentation;
using BladeWalker.Remake.World;
using UnityEngine;

namespace BladeWalker.Remake
{
    [DefaultExecutionOrder(-1000)]
    public sealed class GameBootstrap : MonoBehaviour
    {
        private static bool _bootstrapped;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void EnsureBootstrap()
        {
            if (FindFirstObjectByType<GameBootstrap>() != null) return;
            new GameObject("BladeWalkerBootstrap").AddComponent<GameBootstrap>();
        }

        private void Awake()
        {
            if (_bootstrapped)
            {
                Destroy(gameObject);
                return;
            }
            _bootstrapped = true;
            BuildVerticalSlice();
        }

        private void OnDestroy()
        {
            _bootstrapped = false;
        }

        private void BuildVerticalSlice()
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            Screen.orientation = ScreenOrientation.Portrait;
#endif
            RouteNetwork network = RouteNetwork.CreateStormShrine();
            MobileInput input = new MobileInput();

            GameObject systems = new GameObject("RuntimeSystems");
            systems.transform.SetParent(transform, false);

            StormShrineWorld.Build(network).transform.SetParent(transform, true);

            GameObject hero = StylizedProxyFactory.CreateBaishuang(out Transform weaponSocket);
            hero.transform.SetParent(transform, true);
            HeroVitals vitals = hero.AddComponent<HeroVitals>();
            PlayerRouteMotor runner = hero.AddComponent<PlayerRouteMotor>();
            runner.Initialize(network, input);
            hero.AddComponent<BaishuangProxyAnimator>().Initialize(runner);
            HeroCombat combat = hero.AddComponent<HeroCombat>();
            combat.Initialize(weaponSocket);

            GameObject cameraObject = new GameObject("HeroCamera");
            cameraObject.tag = "MainCamera";
            cameraObject.transform.SetParent(transform, true);
            FollowCameraRig cameraRig = cameraObject.AddComponent<FollowCameraRig>();
            cameraRig.Initialize(runner);
            cameraObject.AddComponent<AudioListener>();
            combat.BindCamera(cameraRig.Camera);
            combat.ComboChanged += (combo, critical) =>
            {
                if (combo > 0) cameraRig.Punch(critical ? 1f : 0.52f);
            };
            QualityDirector.Configure(cameraRig.Camera, transform);
            ConfigureSkybox();

            EncounterDirector encounters = systems.AddComponent<EncounterDirector>();
            encounters.Initialize(runner, vitals);

            SwipeBladeController swipeBlade = systems.AddComponent<SwipeBladeController>();
            swipeBlade.Initialize(cameraRig.Camera, combat, runner);
            systems.AddComponent<SliceAudioFeedback>().Initialize(combat);

            MobileHud hud = systems.AddComponent<MobileHud>();
            hud.Initialize(runner, vitals, combat, encounters);

            systems.AddComponent<StormPulse>();
        }

        private static void ConfigureSkybox()
        {
            Material sky = MaterialFactory.CreateSkybox("StormSkyRuntime");
            if (sky.HasProperty("_SkyTint")) sky.SetColor("_SkyTint", new Color(0.32f, 0.58f, 0.78f));
            if (sky.HasProperty("_GroundColor")) sky.SetColor("_GroundColor", new Color(0.14f, 0.21f, 0.18f));
            if (sky.HasProperty("_AtmosphereThickness")) sky.SetFloat("_AtmosphereThickness", 0.72f);
            if (sky.HasProperty("_SunSize")) sky.SetFloat("_SunSize", 0.04f);
            if (sky.HasProperty("_SunSizeConvergence")) sky.SetFloat("_SunSizeConvergence", 6f);
            if (sky.HasProperty("_Exposure")) sky.SetFloat("_Exposure", 1.15f);
            RenderSettings.skybox = sky;
        }
    }
}
