using UnityEngine;

namespace BladeWalker.Remake
{
    /// <summary>
    /// Dependency-free mobile/desktop input. A drag changes continuous lateral
    /// velocity; it never selects a discrete lane.
    /// </summary>
    public sealed class MobileInput
    {
        private Vector2 _mousePrevious;
        private bool _mouseTracked;
        private bool _attackQueued;

        public float ReadSteer()
        {
            float keyboard = 0f;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) keyboard -= 1f;
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) keyboard += 1f;
            if (Mathf.Abs(keyboard) > 0.01f) return keyboard;

            if (Input.touchCount > 0)
            {
                Touch touch = Input.GetTouch(0);
                if (touch.phase == TouchPhase.Moved)
                    return Mathf.Clamp(touch.deltaPosition.x / Mathf.Max(12f, Screen.width * 0.028f), -1f, 1f);
            }

            if (Input.GetMouseButtonDown(0))
            {
                _mousePrevious = Input.mousePosition;
                _mouseTracked = true;
            }

            if (Input.GetMouseButton(0) && _mouseTracked)
            {
                Vector2 current = Input.mousePosition;
                float delta = current.x - _mousePrevious.x;
                _mousePrevious = current;
                return Mathf.Clamp(delta / Mathf.Max(10f, Screen.width * 0.018f), -1f, 1f);
            }

            if (Input.GetMouseButtonUp(0)) _mouseTracked = false;
            return 0f;
        }

        public bool ConsumeAttack()
        {
            bool keyboard = Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.J);
            bool touchTap = false;
            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch touch = Input.GetTouch(i);
                if (touch.phase == TouchPhase.Ended
                    && touch.deltaPosition.sqrMagnitude < 36f
                    && touch.position.y > Screen.height * 0.24f)
                {
                    touchTap = true;
                    break;
                }
            }

            bool queued = _attackQueued;
            _attackQueued = false;
            return keyboard || touchTap || queued;
        }

        public void QueueAttack()
        {
            _attackQueued = true;
        }
    }
}
