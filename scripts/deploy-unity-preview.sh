#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
build_root="$repo_root/unity/BladeWalkerRemake/Builds/WebGL"
build_id="${1:-$(date -u '+%Y%m%d-%H%M')-$(git -C "$repo_root" rev-parse --short HEAD)}"

if [[ ! "$build_id" =~ ^[0-9A-Za-z._-]+$ ]]; then
  echo "Build id may only contain letters, numbers, dots, underscores, and hyphens." >&2
  exit 1
fi

if [[ ! -f "$build_root/index.html" ]]; then
  echo "Missing $build_root/index.html. Run scripts/build-unity-webgl.sh first." >&2
  exit 1
fi

oversized="$(find "$build_root" -type f -size +99M -print -quit)"
if [[ -n "$oversized" ]]; then
  echo "GitHub rejects files at or above 100 MiB; build output is too large: $oversized" >&2
  exit 1
fi

git -C "$repo_root" fetch origin gh-pages
base_sha="$(git -C "$repo_root" rev-parse origin/gh-pages)"
pages_dir="$(mktemp -d "${TMPDIR:-/tmp}/blade-walker-pages.XXXXXX")"

cleanup() {
  git -C "$repo_root" worktree remove "$pages_dir" >/dev/null 2>&1 || true
}
trap cleanup EXIT

git -C "$repo_root" worktree add --detach "$pages_dir" "$base_sha" >/dev/null
target_dir="$pages_dir/unity-preview/$build_id"
if [[ -e "$target_dir" ]]; then
  echo "Refusing to replace an existing published build: unity-preview/$build_id" >&2
  exit 1
fi

mkdir -p "$target_dir"
cp -R "$build_root"/. "$target_dir"/
touch "$pages_dir/.nojekyll"

git -C "$pages_dir" add -- ".nojekyll" "unity-preview/$build_id"
while IFS= read -r changed_path; do
  if [[ "$changed_path" != ".nojekyll" && "$changed_path" != "unity-preview/$build_id/"* ]]; then
    echo "Deployment touched an unexpected path: $changed_path" >&2
    exit 1
  fi
done < <(git -C "$pages_dir" diff --cached --name-only)

git -C "$pages_dir" commit -m "deploy: add Unity preview $build_id" >/dev/null

git -C "$repo_root" fetch origin gh-pages
current_remote="$(git -C "$repo_root" rev-parse origin/gh-pages)"
if [[ "$current_remote" != "$base_sha" ]]; then
  echo "gh-pages changed during deployment; nothing was pushed. Run again from the new tip." >&2
  exit 1
fi

git -C "$pages_dir" push origin "HEAD:gh-pages"
echo "Published: https://longxia7hao-dev.github.io/blade-walker/unity-preview/$build_id/"
