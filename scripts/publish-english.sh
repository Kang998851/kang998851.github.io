#!/usr/bin/env bash
# Publish KangStudio English to kang998851.github.io
set -euo pipefail
SITE="$(cd "$(dirname "$0")/.." && pwd)"
DMG="$SITE/downloads/KangStudio-English-0.1.0-arm64.dmg"
TAG="v0.1.0-english"
REPO="Kang998851/kang998851.github.io"

if [[ ! -f "$DMG" ]]; then
  echo "Missing $DMG — copy from apps/desktop/release first"
  exit 1
fi

cd "$SITE"
echo "==> Commit site changes"
git add english.html index.html downloads/manifest.json logos/kang-english.svg site-config.json styles.css 2>/dev/null || true
git add -u
git status -sb

echo ""
echo "==> Push site (pages)"
echo "    git remote add origin https://github.com/${REPO}.git  # if needed"
echo "    git push origin main"
echo ""
echo "==> Upload DMG to GitHub Release"
echo "    gh release create ${TAG} --repo ${REPO} --title 'KangStudio English 0.1.0' --notes 'Mac Apple silicon DMG'"
echo "    gh release upload ${TAG} --repo ${REPO} '$DMG#KangStudio-English-0.1.0-arm64.dmg'"
echo ""
echo "Done. Site: https://kang998851.github.io/english.html"
