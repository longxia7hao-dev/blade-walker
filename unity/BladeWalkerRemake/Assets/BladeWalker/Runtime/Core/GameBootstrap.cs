using BladeWalker.Remake.Combat;
using BladeWalker.Remake.Presentation;
using BladeWalker.Remake.World;
using UnityEngine;

namespace BladeWalker.Remake
{
    public enum UiScreen
    {
        Title,
        CharSelect,
        Play,
        Pause,
        Result,
    }

    [DefaultExecutionOrder(-1000)]
    public sealed class GameBootstrap : MonoBehaviour
    {
        private static bool _bootstrapped;

        public static GameBootstrap Instance { get; private set; }

        public UiScreen ActiveScreen { get; private set; } = UiScreen.Title;
        public SliceHeroId SelectedHero { get; private set; } = SliceHeroId.Sword;
        public bool HasSelectedHero { get; private set; }
        public bool ResultIsVictory { get; private set; }
        public bool MuteSfx { get; private set; }
        public bool MuteBgm { get; private set; }

        /// <summary>True when only Play HUD should accept world gestures (swipe / move).</summary>
        public bool AllowsGameplayInput => ActiveScreen == UiScreen.Play;

        /// <summary>
        /// Non-sword picks still enter the sword combat slice; HUD shows this note.
        /// </summary>
        public string SliceCombatNote
        {
            get
            {
                if (SelectedHero == SliceHeroId.Sword) return string.Empty;
                return "本切片暫以白霜出戰";
            }
        }

        public string SelectedHeroDisplayName => HeroDisplayName(SelectedHero);
        public string SelectedHeroRoleName => HeroRoleName(SelectedHero);
        public string SelectedPortraitResource => HeroPortraitResource(SelectedHero);

        private MobileHud _hud;
        private GameObject _menuCamera;
        private Transform _sliceRoot;
        private PlayerRouteMotor _runner;
        private bool _sliceBuilt;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void EnsureBootstrap()
        {
            if (FindFirstObjectByType<GameBootstrap>() != null) return;
            new GameObject("BladeWalkerBootstrap").AddComponent<GameBootstrap>();
        }

        private void Awake()
        {
            if (_bootstrapped && Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            _bootstrapped = true;
            Instance = this;
            DontDestroyOnLoad(gameObject);

            ActiveScreen = UiScreen.Title;
            EnsureMenuCamera();
            EnsureHud();
            ConfigureSkybox();
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
                _bootstrapped = false;
                Time.timeScale = 1f;
            }
        }

        public static string HeroDisplayName(SliceHeroId id)
        {
            switch (id)
            {
                case SliceHeroId.Gun: return "赤煙";
                case SliceHeroId.Mage: return "蒼焰";
                default: return "白霜";
            }
        }

        public static string HeroRoleName(SliceHeroId id)
        {
            switch (id)
            {
                case SliceHeroId.Gun: return "槍手";
                case SliceHeroId.Mage: return "法師";
                default: return "劍士";
            }
        }

        public static string HeroPortraitResource(SliceHeroId id)
        {
            switch (id)
            {
                case SliceHeroId.Gun: return "UI/Portraits/chiyan";
                case SliceHeroId.Mage: return "UI/Portraits/cangyan";
                default: return "UI/Portraits/baishuang";
            }
        }

        public static Color HeroAccent(SliceHeroId id)
        {
            switch (id)
            {
                case SliceHeroId.Gun: return HudTokens.Ember;
                case SliceHeroId.Mage: return HudTokens.Azure;
                default: return HudTokens.Frost;
            }
        }

        // --- UIEventRouter-style flow (HUD-002) ---

        public void TitleStart()
        {
            // TitleStartBtn
            HasSelectedHero = false;
            ActiveScreen = UiScreen.CharSelect;
        }

        public void ToggleMuteSfx()
        {
            // TitleMuteSfx / PauseMuteSfx
            MuteSfx = !MuteSfx;
        }

        public void ToggleMuteBgm()
        {
            // TitleMuteBgm / PauseMuteBgm
            MuteBgm = !MuteBgm;
        }

        public void SelectHero(SliceHeroId id)
        {
            // CharCard_sword / CharCard_gun / CharCard_mage
            SelectedHero = id;
            HasSelectedHero = true;
        }

        public void CharBack()
        {
            // CharBackBtn
            HasSelectedHero = false;
            ActiveScreen = UiScreen.Title;
        }

        public void CharDepart()
        {
            // CharDepartBtn — enabled only when selected
            if (!HasSelectedHero) return;
            StartOrRebuildSlice();
            ActiveScreen = UiScreen.Play;
        }

        public void OpenPause()
        {
            // HudPauseBtn
            if (ActiveScreen != UiScreen.Play || !_sliceBuilt) return;
            ActiveScreen = UiScreen.Pause;
            if (_runner != null) _runner.SetRunning(false);
            Time.timeScale = 0f;
        }

        public void PauseResume()
        {
            // PauseResumeBtn
            if (ActiveScreen != UiScreen.Pause) return;
            ActiveScreen = UiScreen.Play;
            Time.timeScale = 1f;
            if (_runner != null) _runner.SetRunning(true);
        }

        public void PauseRetry()
        {
            // PauseRetryBtn
            Time.timeScale = 1f;
            StartOrRebuildSlice();
            ActiveScreen = UiScreen.Play;
        }

        public void PauseQuit()
        {
            // PauseQuitBtn → char select
            Time.timeScale = 1f;
            TearDownSlice();
            EnsureMenuCamera();
            ActiveScreen = UiScreen.CharSelect;
        }

        public void ResultRetry()
        {
            // ResultRetryBtn
            Time.timeScale = 1f;
            StartOrRebuildSlice();
            ActiveScreen = UiScreen.Play;
        }

        public void ResultChar()
        {
            // ResultCharBtn
            Time.timeScale = 1f;
            TearDownSlice();
            EnsureMenuCamera();
            ActiveScreen = UiScreen.CharSelect;
        }

        public void ResultNext()
        {
            // ResultNextBtn — only one slice now; restart 暴風神社切片
            Time.timeScale = 1f;
            StartOrRebuildSlice();
            ActiveScreen = UiScreen.Play;
        }

        public void ResultHome()
        {
            // ResultHomeBtn → title / 回獵場
            Time.timeScale = 1f;
            TearDownSlice();
            EnsureMenuCamera();
            HasSelectedHero = false;
            ActiveScreen = UiScreen.Title;
        }

        public void NotifyVictory()
        {
            if (ActiveScreen == UiScreen.Result) return;
            ResultIsVictory = true;
            if (_runner != null) _runner.SetRunning(false);
            ActiveScreen = UiScreen.Result;
        }

        public void NotifyDefeat()
        {
            if (ActiveScreen == UiScreen.Result) return;
            ResultIsVictory = false;
            if (_runner != null) _runner.SetRunning(false);
            ActiveScreen = UiScreen.Result;
        }

        private void StartOrRebuildSlice()
        {
            TearDownSlice();
            BuildVerticalSlice();
            DestroyMenuCamera();
        }

        private void TearDownSlice()
        {
            Time.timeScale = 1f;
            if (_hud != null) _hud.UnbindPlay();
            _runner = null;

            // DestroyImmediate so Result/Pause Retry can rebuild the slice in the same frame.
            if (_sliceRoot != null)
            {
                DestroyImmediate(_sliceRoot.gameObject);
                _sliceRoot = null;
            }

            for (int i = transform.childCount - 1; i >= 0; i--)
            {
                Transform child = transform.GetChild(i);
                if (_hud != null && child == _hud.transform) continue;
                if (_menuCamera != null && child == _menuCamera.transform) continue;
                DestroyImmediate(child.gameObject);
            }

            _sliceBuilt = false;
        }

        private void EnsureHud()
        {
            if (_hud != null) return;
            GameObject hudObject = new GameObject("UIRoot");
            hudObject.transform.SetParent(transform, false);
            _hud = hudObject.AddComponent<MobileHud>();
            _hud.InitializeShell(this);
        }

        private void EnsureMenuCamera()
        {
            if (_menuCamera != null) return;
            _menuCamera = new GameObject("MenuCamera");
            _menuCamera.transform.SetParent(transform, false);
            Camera camera = _menuCamera.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.06f, 0.09f, 0.14f, 1f);
            camera.orthographic = true;
            camera.depth = -10f;
            if (_menuCamera.GetComponent<AudioListener>() == null)
                _menuCamera.AddComponent<AudioListener>();
        }

        private void DestroyMenuCamera()
        {
            if (_menuCamera == null) return;
            DestroyImmediate(_menuCamera);
            _menuCamera = null;
        }

        private void BuildVerticalSlice()
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            Screen.orientation = ScreenOrientation.Portrait;
#endif
            RouteNetwork network = RouteNetwork.CreateStormShrine();
            MobileInput input = new MobileInput();

            GameObject slice = new GameObject("StormShrineSlice");
            slice.transform.SetParent(transform, false);
            _sliceRoot = slice.transform;

            GameObject systems = new GameObject("RuntimeSystems");
            systems.transform.SetParent(_sliceRoot, false);

            StormShrineWorld.Build(network).transform.SetParent(_sliceRoot, true);

            // Combat slice is sword/白霜 only for now; selection still drives HUD portrait/label.
            GameObject hero = StylizedProxyFactory.CreateBaishuang(out Transform weaponSocket);
            hero.transform.SetParent(_sliceRoot, true);
            HeroVitals vitals = hero.AddComponent<HeroVitals>();
            PlayerRouteMotor runner = hero.AddComponent<PlayerRouteMotor>();
            runner.Initialize(network, input);
            hero.AddComponent<BaishuangProxyAnimator>().Initialize(runner);
            HeroCombat combat = hero.AddComponent<HeroCombat>();
            combat.Initialize(weaponSocket);
            _runner = runner;

            GameObject cameraObject = new GameObject("HeroCamera");
            cameraObject.tag = "MainCamera";
            cameraObject.transform.SetParent(_sliceRoot, true);
            FollowCameraRig cameraRig = cameraObject.AddComponent<FollowCameraRig>();
            cameraRig.Initialize(runner);
            cameraObject.AddComponent<AudioListener>();
            combat.BindCamera(cameraRig.Camera);
            combat.ComboChanged += (combo, critical) =>
            {
                if (combo > 0) cameraRig.Punch(critical ? 1f : 0.52f);
            };
            QualityDirector.Configure(cameraRig.Camera, _sliceRoot);
            ConfigureSkybox();

            EncounterDirector encounters = systems.AddComponent<EncounterDirector>();
            encounters.Initialize(runner, vitals);

            SwipeBladeController swipeBlade = systems.AddComponent<SwipeBladeController>();
            swipeBlade.Initialize(cameraRig.Camera, combat, runner);
            systems.AddComponent<SliceAudioFeedback>().Initialize(combat);

            systems.AddComponent<StormPulse>();

            EnsureHud();
            _hud.BindPlay(runner, vitals, combat, encounters);
            _sliceBuilt = true;
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
