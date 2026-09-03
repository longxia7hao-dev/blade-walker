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

        public Camera Camera => _camera;

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

            transform.position = Vector3.SmoothDamp(transform.position, desired, ref _velocity, 0.12f, 80f, Time.deltaTime);
            Quaternion desiredRotation = Quaternion.LookRotation(focus - transform.position, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, desiredRotation, 1f - Mathf.Exp(-8.5f * Time.deltaTime));
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
