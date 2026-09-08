using BladeWalker.Remake;
using BladeWalker.Remake.Presentation;
using BladeWalker.Remake.World;
using UnityEngine;

namespace BladeWalker.Remake.Combat
{
    /// <summary>
    /// Fruit-Ninja-style gesture reader. The upper 76% is a blade surface; the lower
    /// 24% remains an independent movement zone, including during multi-touch play.
    /// </summary>
    public sealed class SwipeBladeController : MonoBehaviour
    {
        private const float MinimumSegmentPixels = 11f;
        private const float MaximumSegmentGap = 0.09f;

        private Camera _camera;
        private HeroCombat _combat;
        private PlayerRouteMotor _runner;
        private SwipeTrailRenderer _trail;
        private int _fingerId = -1;
        private bool _mouseActive;
        private Vector2 _previous;
        private float _previousAt;

        public void Initialize(Camera camera, HeroCombat combat, PlayerRouteMotor runner)
        {
            _camera = camera;
            _combat = combat;
            _runner = runner;
            _trail = gameObject.AddComponent<SwipeTrailRenderer>();
            _trail.Initialize(camera);
        }

        private void Update()
        {
            if (_camera == null || _combat == null) return;

            if (GameBootstrap.Instance != null && !GameBootstrap.Instance.AllowsGameplayInput)
            {
                CancelStroke();
                return;
            }

            if (_runner != null && _runner.BranchDecisionOpen)
            {
                CancelStroke();
                return;
            }

            if (Input.touchCount > 0)
            {
                HandleTouches();
            }
            else
            {
                HandleMouse();
            }
        }

        private void HandleTouches()
        {
            if (_mouseActive) CancelStroke();

            if (_fingerId < 0)
            {
                for (int i = 0; i < Input.touchCount; i++)
                {
                    Touch candidate = Input.GetTouch(i);
                    if (candidate.phase == TouchPhase.Began && IsBladeZone(candidate.position))
                    {
                        _fingerId = candidate.fingerId;
                        BeginStroke(candidate.position);
                        break;
                    }
                }
            }

            if (_fingerId < 0) return;
            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch touch = Input.GetTouch(i);
                if (touch.fingerId != _fingerId) continue;
                if (touch.phase == TouchPhase.Moved || touch.phase == TouchPhase.Stationary)
                    ContinueStroke(touch.position);
                else if (touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled)
                    EndStroke();
                return;
            }

            EndStroke();
        }

        private void HandleMouse()
        {
            if (Input.GetMouseButtonDown(0) && IsBladeZone(Input.mousePosition))
            {
                _mouseActive = true;
                BeginStroke(Input.mousePosition);
            }

            if (_mouseActive && Input.GetMouseButton(0))
                ContinueStroke(Input.mousePosition);

            if (_mouseActive && Input.GetMouseButtonUp(0))
                EndStroke();
        }

        private void BeginStroke(Vector2 screenPosition)
        {
            _previous = screenPosition;
            _previousAt = Time.unscaledTime;
            _combat.BeginSwipe();
            _trail.BeginStroke(screenPosition);
        }

        private void ContinueStroke(Vector2 screenPosition)
        {
            float distance = Vector2.Distance(_previous, screenPosition);
            float elapsed = Mathf.Max(0.001f, Time.unscaledTime - _previousAt);
            if (distance < MinimumSegmentPixels && elapsed < MaximumSegmentGap) return;

            _combat.SliceSegment(_previous, screenPosition, elapsed);
            _trail.AddPoint(screenPosition);
            _previous = screenPosition;
            _previousAt = Time.unscaledTime;
        }

        private void EndStroke()
        {
            _combat.EndSwipe();
            _trail.EndStroke();
            _fingerId = -1;
            _mouseActive = false;
        }

        private void CancelStroke()
        {
            if (_fingerId < 0 && !_mouseActive) return;
            EndStroke();
        }

        private static bool IsBladeZone(Vector2 position)
        {
            return position.y > Screen.height * MobileInput.MovementZoneHeight;
        }
    }
}
