#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RES_DIR="$ROOT_DIR/resources"
DEFAULT_SOURCE="$RES_DIR/icon.svg"

if [ -f "$RES_DIR/icon-source.png" ]; then
  DEFAULT_SOURCE="$RES_DIR/icon-source.png"
fi

ICON_SOURCE="${1:-${ICON_SOURCE:-$DEFAULT_SOURCE}}"

if [ ! -f "$ICON_SOURCE" ]; then
  echo "图标源文件不存在: $ICON_SOURCE"
  exit 1
fi

for tool in qlmanage sips iconutil; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "缺少依赖命令: $tool"
    exit 1
  fi
done

TMP_DIR="$(mktemp -d)"
ICONSET_DIR="$TMP_DIR/icon.iconset"
BASE_PNG="$TMP_DIR/icon-1024.png"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

mkdir -p "$ICONSET_DIR" "$RES_DIR"

case "${ICON_SOURCE##*.}" in
  png|PNG)
    cp "$ICON_SOURCE" "$BASE_PNG"
    ;;
  svg|SVG)
    qlmanage -t -s 1024 -o "$TMP_DIR" "$ICON_SOURCE" >/dev/null 2>&1
    RENDERED_PNG="$(find "$TMP_DIR" -maxdepth 1 -name '*.png' | head -n1 || true)"
    if [ -z "$RENDERED_PNG" ]; then
      echo "无法从 SVG 生成 PNG: $ICON_SOURCE"
      exit 1
    fi
    mv "$RENDERED_PNG" "$BASE_PNG"
    ;;
  *)
    echo "不支持的图标源格式: $ICON_SOURCE"
    exit 1
    ;;
esac

render_icon() {
  local size="$1"
  local name="$2"
  sips -s format png -z "$size" "$size" "$BASE_PNG" --out "$ICONSET_DIR/$name" >/dev/null
}

render_icon 16 icon_16x16.png
render_icon 32 icon_16x16@2x.png
render_icon 32 icon_32x32.png
render_icon 64 icon_32x32@2x.png
render_icon 128 icon_128x128.png
render_icon 256 icon_128x128@2x.png
render_icon 256 icon_256x256.png
render_icon 512 icon_256x256@2x.png
render_icon 512 icon_512x512.png
render_icon 1024 icon_512x512@2x.png

cp "$BASE_PNG" "$RES_DIR/icon.png"
iconutil -c icns "$ICONSET_DIR" -o "$RES_DIR/icon.icns"

echo "图标已生成:"
echo "  PNG:  $RES_DIR/icon.png"
echo "  ICNS: $RES_DIR/icon.icns"
