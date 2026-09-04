using BladeWalker.Remake.World;
using UnityEngine;

namespace BladeWalker.Remake.Presentation
{
    /// <summary>
    /// Camera heading derives from the route tangent. At a junction this produces an
    /// actual yaw and translated camera path, not a temporary screen shake.
    /// </summary>
    public sealed class FollowCameraRig : MonoBehaviour
    {
        private PlayerRouteMotor _target;
        private Camera _camera;
        private Vector3 _velocity;
        private float _hitPunch;

        public Camera Camera => _camera;

        public void Punch(float strength)
        {
            _hitPunch = Mathf.Max(_hitPunch, Mathf.Clamp01(strength));
        }

        public void Initialize(PlayerRouteMotor target)
        {
            _target = target;
            _camera = gameObject.AddComponent<Camera>();
            _camera.fieldOfView = 55f;
            _camera.nearClipPlane = 0.08f;
            _camera.farClipPlane = 180f;
            _camera.allowHDR = true;
            _camera.allowMSAA = true;
            _camera.clearFlags = CameraClearFlags.Skybox;
            Snap();
        }

        private void LateUpdate()
        {
            if (_target == null) return;
            RouteFrame frame = _target.CurrentFrame;
            Vector3 focus = _target.transform.position + Vector3.up * 1.25f + frame.Forward * 4.8f;
            Vector3 desired = _target.transform.position
                - frame.Forward * 7.4f
                + frame.Right * 0.55f
                + Vector3.up * 4.45f;
            desired += frame.Right * Mathf.Sin(Time.unscaledTime * 92f) * (0.07f * _hitPunch);
            desired += Vector3.up * Mathf.Sin(Time.unscaledTime * 71f) * (0.035f * _hitPunch);

            transform.position = Vector3.SmoothDamp(transform.position, desired, ref _velocity, 0.12f, 80f, Time.deltaTime);
            Quaternion desiredRotation = Quaternion.LookRotation(focus - transform.position, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, desiredRotation, 1f - Mathf.Exp(-8.5f * Time.deltaTime));
            _camera.fieldOfView = Mathf.Lerp(_camera.fieldOfView, 55f + _hitPunch * 2.2f, 1f - Mathf.Exp(-17f * Time.unscaledDeltaTime));
            _hitPunch = Mathf.MoveTowards(_hitPunch, 0f, Time.unscaledDeltaTime * 7.5f);
        }

        private void Snap()
        {
            RouteFrame frame = _target.CurrentFrame;
            transform.position = _target.transform.position - frame.Forward * 7.4f + frame.Right * 0.55f + Vector3.up * 4.45f;
            Vector3 focus = _target.transform.position + Vector3.up * 1.25f + frame.Forward * 4.8f;
            transform.rotation = Quaternion.LookRotation(focus - transform.position, Vector3.up);
        }
    }
}
