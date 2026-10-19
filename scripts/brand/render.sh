#!/usr/bin/env bash
# 공유 이미지/앱 아이콘을 Chrome 헤드리스로 렌더링해 public/ 에 저장한다.
# 사용법: bash scripts/brand/render.sh   (CHROME 환경변수로 크롬 경로 지정 가능)
set -euo pipefail
cd "$(dirname "$0")/../.."

CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
DIR="$(pwd -W 2>/dev/null || pwd)/scripts/brand"

shot() { # <html> <out.png> <width> <height> [배율]
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor="${5:-1}" --virtual-time-budget=4000 \
    --window-size="$3,$4" --screenshot="$(pwd -W 2>/dev/null || pwd)/public/$2" "file:///$DIR/$1" 2>/dev/null
  echo "public/$2"
}

shot og.html og-image.png 1200 630
shot icon.html icon-512.png 512 512
shot icon.html icon-192.png 512 512 0.375
shot icon.html apple-touch-icon.png 512 512 0.3515625
