using System;
using UnityEngine;

namespace BladeWalker.Remake.World
{
    /// <summary>
    /// Moves over a continuous corridor. Horizontal input is measured in metres and
    /// never quantized to a left/centre/right lane.
    /// </summary>
    public sealed class PlayerRouteMotor : MonoBehaviour
    {
        public event Action<bool> BranchWindowChanged;
        public event Action<BranchChoice> BranchCommitted;
        public event Action ArenaReached;

        [SerializeField] private float forwardSpeed = 7.4f;
        [SerializeField] private float lateralSpeed = 8.5f;
        [SerializeField] private float turnSharpness = 9f;
        [SerializeField] private float edgePadding = 0.75f;

        private RouteNetwork _network;
        private MobileInput _input;
        private string _segmentId;
        private float _distance;
        private float _travelled;
        private float _lateral;
        private BranchChoice _branch = BranchChoice.Unset;
        private bool _branchWindow;
        private bool _running = true;
        private bool _arenaRaised;
        private RouteFrame _frame;

        public RouteFrame CurrentFrame => _frame;
        public RouteNetwork Network => _network;
        public string SegmentId => _segmentId;
        public float SegmentDistance => _distance;
        public float LateralOffset => _lateral;
        public BranchChoice ChosenBranch => _branch;
        public bool BranchDecisionOpen => _branchWindow && _branch == BranchChoice.Unset;
        public bool IsRunning => _running;
        public float Progress
        {
            get
            {
                BranchChoice route = _branch == BranchChoice.Unset ? BranchChoice.Right : _branch;
                return Mathf.Clamp01(_travelled / _network.TotalLength(route));
            }
        }

        public void Initialize(RouteNetwork network, MobileInput input)
        {
            _network = network;
            _input = input;
            _segmentId = network.EntryId;
            _distance = 0f;
            _travelled = 0f;
            _frame = network[_segmentId].SampleDistance(0f);
            SnapToFrame();
        }

        public void SetRunning(bool running)
        {
            _running = running;
        }

        public void CommitBranch(BranchChoice choice)
        {
            if (!BranchDecisionOpen || choice == BranchChoice.Unset) return;
            _branch = choice;
            SetBranchWindow(false);
            BranchCommitted?.Invoke(choice);
        }

        public bool TrySampleAhead(float metres, out RouteFrame frame)
        {
            if (_network == null)
            {
                frame = default;
                return false;
            }

            string id = _segmentId;
            float distance = _distance + Mathf.Max(0f, metres);
            BranchChoice branch = _branch;
            if (branch == BranchChoice.Unset)
                branch = _lateral < 0f ? BranchChoice.Left : BranchChoice.Right;

            for (int guard = 0; guard < 4; guard++)
            {
                RouteSpline segment = _network[id];
                if (distance <= segment.Length)
                {
                    frame = segment.SampleDistance(distance);
                    return true;
                }

                distance -= segment.Length;
                string next = _network.Next(id, branch);
                if (string.IsNullOrEmpty(next))
                {
                    frame = segment.SampleDistance(segment.Length);
                    return false;
                }
                id = next;
            }

            frame = default;
            return false;
        }

        private void Update()
        {
            if (_network == null || _input == null) return;

            float steer = _input.ReadSteer();
            float halfWidth = Mathf.Max(1f, _frame.Width * 0.5f - edgePadding);
            _lateral = Mathf.Clamp(_lateral + steer * lateralSpeed * Time.deltaTime, -halfWidth, halfWidth);

            RouteSpline current = _network[_segmentId];
            bool shouldOpen = _network.IsJunction(_segmentId)
                && _branch == BranchChoice.Unset
                && _distance >= current.Length - 15f;
            SetBranchWindow(shouldOpen);

            if (BranchDecisionOpen && Mathf.Abs(steer) > 0.72f)
                CommitBranch(steer < 0f ? BranchChoice.Left : BranchChoice.Right);

            if (_running)
                Advance(forwardSpeed * Time.deltaTime);

            _frame = _network[_segmentId].SampleDistance(_distance);
            SnapToFrame();
        }

        private void Advance(float metres)
        {
            float remainingMove = metres;
            while (remainingMove > 0f)
            {
                RouteSpline segment = _network[_segmentId];
                float available = segment.Length - _distance;
                float step = Mathf.Min(available, remainingMove);
                _distance += step;
                _travelled += step;
                remainingMove -= step;

                if (_distance < segment.Length - 0.001f) break;

                if (_network.IsJunction(_segmentId) && _branch == BranchChoice.Unset)
                    CommitBranch(_lateral < 0f ? BranchChoice.Left : BranchChoice.Right);

                string next = _network.Next(_segmentId, _branch);
                if (string.IsNullOrEmpty(next))
                {
                    _running = false;
                    if (!_arenaRaised)
                    {
                        _arenaRaised = true;
                        ArenaReached?.Invoke();
                    }
                    break;
                }

                _segmentId = next;
                _distance = 0f;
                SetBranchWindow(false);
            }
        }

        private void SnapToFrame()
        {
            Vector3 desiredPosition = _frame.Offset(_lateral, 0.05f);
            transform.position = desiredPosition;
            Quaternion desiredRotation = Quaternion.LookRotation(_frame.Forward, Vector3.up);
            transform.rotation = Quaternion.Slerp(
                transform.rotation,
                desiredRotation,
                1f - Mathf.Exp(-turnSharpness * Time.deltaTime));
        }

        private void SetBranchWindow(bool open)
        {
            if (_branchWindow == open) return;
            _branchWindow = open;
            BranchWindowChanged?.Invoke(open);
        }
    }
}
