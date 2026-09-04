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
        private bool _mouseSteerTracked;

        public const float MovementZoneHeight = 0.24f;

        public float ReadSteer()
        {
            float keyboard = 0f;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) keyboard -= 1f;
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) keyboard += 1f;
            if (Mathf.Abs(keyboard) > 0.01f) return keyboard;

            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch touch = Input.GetTouch(i);
                if (touch.position.y <= Screen.height * MovementZoneHeight
                    && touch.phase == TouchPhase.Moved)
                {
                    return Mathf.Clamp(touch.deltaPosition.x / Mathf.Max(12f, Screen.width * 0.028f), -1f, 1f);
                }
            }

            if (Input.touchCount == 0 && Input.GetMouseButtonDown(0)
                && Input.mousePosition.y <= Screen.height * MovementZoneHeight)
            {
                _mousePrevious = Input.mousePosition;
                _mouseSteerTracked = true;
            }

            if (Input.touchCount == 0 && Input.GetMouseButton(0) && _mouseSteerTracked)
            {
                Vector2 current = Input.mousePosition;
                float delta = current.x - _mousePrevious.x;
                _mousePrevious = current;
                return Mathf.Clamp(delta / Mathf.Max(10f, Screen.width * 0.018f), -1f, 1f);
            }

            if (Input.GetMouseButtonUp(0)) _mouseSteerTracked = false;
            return 0f;
        }
    }
}
