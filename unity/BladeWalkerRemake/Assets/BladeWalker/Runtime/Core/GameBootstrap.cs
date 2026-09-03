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
            Screen.orientation = ScreenOrientation.Portrait;
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
            combat.Initialize(input, weaponSocket);

            GameObject cameraObject = new GameObject("HeroCamera");
            cameraObject.tag = "MainCamera";
            cameraObject.transform.SetParent(transform, true);
            FollowCameraRig cameraRig = cameraObject.AddComponent<FollowCameraRig>();
            cameraRig.Initialize(runner);
            cameraObject.AddComponent<AudioListener>();
            QualityDirector.Configure(cameraRig.Camera, transform);
            ConfigureSkybox();

            EncounterDirector encounters = systems.AddComponent<EncounterDirector>();
            encounters.Initialize(runner, vitals);

            MobileHud hud = systems.AddComponent<MobileHud>();
            hud.Initialize(runner, vitals, combat, encounters, input);

            systems.AddComponent<StormPulse>();
        }

        private static void ConfigureSkybox()
        {
            Shader shader = Shader.Find("Skybox/Procedural");
            if (shader == null) return;
            Material sky = new Material(shader) { name = "StormSkyRuntime" };
            if (sky.HasProperty("_SkyTint")) sky.SetColor("_SkyTint", new Color(0.035f, 0.11f, 0.18f));
            if (sky.HasProperty("_GroundColor")) sky.SetColor("_GroundColor", new Color(0.008f, 0.018f, 0.025f));
            if (sky.HasProperty("_AtmosphereThickness")) sky.SetFloat("_AtmosphereThickness", 0.42f);
            if (sky.HasProperty("_Exposure")) sky.SetFloat("_Exposure", 0.56f);
            RenderSettings.skybox = sky;
        }
    }
}
