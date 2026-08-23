#!/usr/bin/env bash
# Publish KangStudio English to https://kang998851.github.io
set -euo pipefail

SITE="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP_RELEASE="$(cd "$SITE/../apps/desktop/release" 2>/dev/null && pwd || true)"
DMG="$SITE/downloads/KangStudio-English-0.1.0-arm64.dmg"
TAG="v0.1.0-english"
REPO="Kang998851/kang998851.github.io"
DEPLOY_DIR="${DEPLOY_DIR:-/tmp/kang-pages-deploy}"

copy_dmg() {
  local src=""
  if [[ -f "$DMG" ]]; then
    return 0
  fi
  if [[ -n "$DESKTOP_RELEASE" ]]; then
    src=$(find "$DESKTOP_RELEASE" -maxdepth 1 -name 'KangStudio English-0.1.0-arm64.dmg' -print -quit)
  fi
  if [[ -z "$src" || ! -f "$src" ]]; then
    echo "Missing DMG. Build first: npm run build:desktop"
    echo "Or copy to: $DMG"
    exit 1
  fi
  cp "$src" "$DMG"
  echo "Copied DMG → $DMG"
}

ensure_deploy_clone() {
  if [[ -d "$DEPLOY_DIR/.git" ]]; then
    return 0
  fi
  echo "Cloning $REPO → $DEPLOY_DIR"
  git clone "https://github.com/${REPO}.git" "$DEPLOY_DIR"
}

sync_site_files() {
  rsync -a --delete \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '__pycache__' \
    --exclude 'Kang Data' \
    --exclude 'Kang Learn' \
    --exclude 'Kang Office' \
    "$SITE/" "$DEPLOY_DIR/"
}

commit_and_push() {
  cd "$DEPLOY_DIR"
  git add english.html index.html downloads/manifest.json logos/kang-english.svg site-config.json styles.css scripts/publish-english.sh
  git add -u
  if git diff --cached --quiet; then
    echo "No site changes to commit."
  else
    git commit -m "Publish KangStudio English product page and downloads."
  fi
  echo "Pushing to origin main…"
  git push origin main
}

create_release() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "gh CLI not found — skip release upload. Install: brew install gh"
    return 0
  fi
  if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
    echo "Release $TAG exists — uploading DMG asset"
  else
    gh release create "$TAG" --repo "$REPO" \
      --title "KangStudio English 0.1.0" \
      --notes "Mac Apple silicon DMG for KangStudio English v0.1.0."
  fi
  gh release upload "$TAG" --repo "$REPO" --clobber \
    "$DMG#KangStudio-English-0.1.0-arm64.dmg"
  echo "Release: https://github.com/${REPO}/releases/tag/${TAG}"
}

echo "==> KangStudio English → GitHub Pages"
copy_dmg
ensure_deploy_clone
sync_site_files
commit_and_push
create_release
echo ""
echo "Live: https://kang998851.github.io/english.html"
echo "Remember to set taobaoUrl in site-config.json before sharing purchase links."
