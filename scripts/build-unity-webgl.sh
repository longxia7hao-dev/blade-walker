#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_path="$repo_root/unity/BladeWalkerRemake"
project_version="$(sed -n 's/^m_EditorVersion: //p' "$project_path/ProjectSettings/ProjectVersion.txt")"

if [[ -z "$project_version" ]]; then
  echo "Cannot read the Unity version from ProjectSettings/ProjectVersion.txt." >&2
  exit 1
fi

editor_candidates=(
  "${UNITY_EDITOR:-}"
  "/Users/longxia7hao/Applications/Unity/Hub/Editor/$project_version/Unity.app/Contents/MacOS/Unity"
  "/Applications/Unity/Hub/Editor/$project_version/Unity.app/Contents/MacOS/Unity"
)

unity_editor=""
for candidate in "${editor_candidates[@]}"; do
  if [[ -n "$candidate" && -x "$candidate" ]]; then
    unity_editor="$candidate"
    break
  fi
done

if [[ -z "$unity_editor" ]]; then
  echo "Unity $project_version was not found. Set UNITY_EDITOR to its executable." >&2
  exit 1
fi

log_path="$project_path/Logs/WebGLBuild.log"
mkdir -p "$(dirname "$log_path")"

echo "Building Blade Walker with Unity $project_version..."
set +e
"$unity_editor" \
  -batchmode \
  -nographics \
  -quit \
  -buildTarget WebGL \
  -projectPath "$project_path" \
  -executeMethod BladeWalker.Remake.Editor.WebGLBuild.BuildPhonePreview \
  -logFile "$log_path"
status=$?
set -e

if [[ $status -ne 0 ]]; then
  echo "Unity build failed (exit $status). Last log lines:" >&2
  tail -n 120 "$log_path" >&2 || true
  exit "$status"
fi

output_path="$project_path/Builds/WebGL"
if [[ ! -f "$output_path/index.html" ]]; then
  echo "Unity exited successfully but did not create $output_path/index.html." >&2
  exit 1
fi

echo "WebGL preview built at $output_path"
