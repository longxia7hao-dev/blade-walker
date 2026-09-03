using System;
using System.Collections.Generic;
using UnityEngine;

namespace BladeWalker.Remake.World
{
    public readonly struct RouteFrame
    {
        public readonly Vector3 Position;
        public readonly Vector3 Forward;
        public readonly Vector3 Right;
        public readonly Vector3 Up;
        public readonly float Width;

        public RouteFrame(Vector3 position, Vector3 forward, float width)
        {
            Position = position;
            Forward = forward.sqrMagnitude > 0.0001f ? forward.normalized : Vector3.forward;
            Up = Vector3.up;
            Right = Vector3.Cross(Up, Forward).normalized;
            Width = width;
        }

        public Vector3 Offset(float lateral, float vertical = 0f)
        {
            return Position + Right * lateral + Up * vertical;
        }
    }

    /// <summary>
    /// Cubic Bezier route with an arc-length lookup. Movement uses metres, not lanes.
    /// </summary>
    [Serializable]
    public sealed class RouteSpline
    {
        private const int ArcSamples = 96;
        private readonly float[] _arcLengths = new float[ArcSamples + 1];

        public string Id { get; }
        public Vector3 P0 { get; }
        public Vector3 P1 { get; }
        public Vector3 P2 { get; }
        public Vector3 P3 { get; }
        public float Width { get; }
        public float Length { get; private set; }

        public RouteSpline(string id, Vector3 p0, Vector3 p1, Vector3 p2, Vector3 p3, float width)
        {
            Id = id;
            P0 = p0;
            P1 = p1;
            P2 = p2;
            P3 = p3;
            Width = Mathf.Max(3.5f, width);
            BuildArcTable();
        }

        public Vector3 Evaluate(float t)
        {
            t = Mathf.Clamp01(t);
            float u = 1f - t;
            return u * u * u * P0
                + 3f * u * u * t * P1
                + 3f * u * t * t * P2
                + t * t * t * P3;
        }

        public Vector3 Tangent(float t)
        {
            t = Mathf.Clamp01(t);
            float u = 1f - t;
            return 3f * u * u * (P1 - P0)
                + 6f * u * t * (P2 - P1)
                + 3f * t * t * (P3 - P2);
        }

        public RouteFrame SampleDistance(float distance)
        {
            float t = DistanceToT(Mathf.Clamp(distance, 0f, Length));
            float organicWidth = Width * (1f + Mathf.Sin(t * Mathf.PI * 5f) * 0.035f);
            return new RouteFrame(Evaluate(t), Tangent(t), organicWidth);
        }

        public RouteFrame SampleNormalized(float normalized)
        {
            return SampleDistance(Mathf.Clamp01(normalized) * Length);
        }

        private void BuildArcTable()
        {
            _arcLengths[0] = 0f;
            Vector3 previous = Evaluate(0f);
            float total = 0f;
            for (int i = 1; i <= ArcSamples; i++)
            {
                float t = i / (float)ArcSamples;
                Vector3 current = Evaluate(t);
                total += Vector3.Distance(previous, current);
                _arcLengths[i] = total;
                previous = current;
            }

            Length = Mathf.Max(0.01f, total);
        }

        private float DistanceToT(float distance)
        {
            int low = 0;
            int high = ArcSamples;
            while (low < high)
            {
                int mid = (low + high) / 2;
                if (_arcLengths[mid] < distance) low = mid + 1;
                else high = mid;
            }

            int upper = Mathf.Clamp(low, 1, ArcSamples);
            int lower = upper - 1;
            float span = Mathf.Max(0.0001f, _arcLengths[upper] - _arcLengths[lower]);
            float local = (distance - _arcLengths[lower]) / span;
            return (lower + local) / ArcSamples;
        }
    }

    public enum BranchChoice
    {
        Unset = 0,
        Left = -1,
        Right = 1,
    }

    /// <summary>
    /// A compact route graph for the first vertical slice. Both exits occupy distinct
    /// world-space curves, so choosing a branch changes position and heading for real.
    /// </summary>
    public sealed class RouteNetwork
    {
        private readonly Dictionary<string, RouteSpline> _segments = new Dictionary<string, RouteSpline>();

        public IReadOnlyDictionary<string, RouteSpline> Segments => _segments;
        public string EntryId => "approach";

        public RouteSpline this[string id] => _segments[id];

        public static RouteNetwork CreateStormShrine()
        {
            RouteNetwork network = new RouteNetwork();
            network.Add(new RouteSpline(
                "approach",
                new Vector3(0f, 0f, 0f),
                new Vector3(-1.5f, 0.15f, 18f),
                new Vector3(3.5f, 0.35f, 39f),
                new Vector3(0f, 0.7f, 56f),
                8.6f));

            network.Add(new RouteSpline(
                "left_shrine",
                new Vector3(0f, 0.7f, 56f),
                new Vector3(-2f, 0.9f, 64f),
                new Vector3(-18f, 1.4f, 71f),
                new Vector3(-29f, 1.2f, 75f),
                7.8f));

            network.Add(new RouteSpline(
                "left_arena",
                new Vector3(-29f, 1.2f, 75f),
                new Vector3(-41f, 1.1f, 79f),
                new Vector3(-44f, 0.4f, 104f),
                new Vector3(-38f, 0f, 132f),
                9.4f));

            network.Add(new RouteSpline(
                "right_ruins",
                new Vector3(0f, 0.7f, 56f),
                new Vector3(2f, 0.9f, 64f),
                new Vector3(18f, 1.1f, 71f),
                new Vector3(29f, 0.8f, 75f),
                8.2f));

            network.Add(new RouteSpline(
                "right_arena",
                new Vector3(29f, 0.8f, 75f),
                new Vector3(41f, 0.6f, 79f),
                new Vector3(44f, 0.2f, 104f),
                new Vector3(38f, 0f, 132f),
                9.4f));

            return network;
        }

        public bool IsJunction(string segmentId)
        {
            return segmentId == EntryId;
        }

        public string Next(string segmentId, BranchChoice choice)
        {
            switch (segmentId)
            {
                case "approach":
                    return choice == BranchChoice.Left ? "left_shrine" : "right_ruins";
                case "left_shrine":
                    return "left_arena";
                case "right_ruins":
                    return "right_arena";
                default:
                    return null;
            }
        }

        public float TotalLength(BranchChoice choice)
        {
            string mid = choice == BranchChoice.Left ? "left_shrine" : "right_ruins";
            string end = choice == BranchChoice.Left ? "left_arena" : "right_arena";
            return _segments[EntryId].Length + _segments[mid].Length + _segments[end].Length;
        }

        private void Add(RouteSpline segment)
        {
            _segments.Add(segment.Id, segment);
        }
    }
}
