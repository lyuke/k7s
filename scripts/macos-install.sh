#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DMG_PATH="${1:-}"
if [ -z "$DMG_PATH" ]; then
  DMG_PATH="$(ls -t "$ROOT_DIR"/release/*.dmg 2>/dev/null | head -n1 || true)"
fi
if [ -f "$DMG_PATH" ]; then
  MOUNT_OUT="$(hdiutil attach -nobrowse "$DMG_PATH")"
  MOUNT_POINT="$(echo "$MOUNT_OUT" | tail -n1 | awk '{print $3}')"
  APP_PATH="$(ls -d "$MOUNT_POINT"/*.app 2>/dev/null | head -n1 || true)"
  if [ -n "$APP_PATH" ]; then
    echo "复制到 /Applications: $APP_PATH"
    sudo cp -R "$APP_PATH" /Applications/
    hdiutil detach "$MOUNT_POINT"
    echo "安装完成: /Applications/$(basename "$APP_PATH")"
    exit 0
  else
    echo "未在 DMG 中找到 .app"
    hdiutil detach "$MOUNT_POINT"
  fi
fi
APP_FALLBACK="$(ls -d "$ROOT_DIR"/release/mac-*/k7s.app 2>/dev/null | head -n1 || true)"
if [ -n "$APP_FALLBACK" ]; then
  echo "复制到 /Applications: $APP_FALLBACK"
  sudo cp -R "$APP_FALLBACK" /Applications/
  echo "安装完成: /Applications/$(basename "$APP_FALLBACK")"
  exit 0
fi
echo "未找到可安装的 DMG 或 .app"
exit 1
