#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
ARCH="${ARCH:-}"
if [ -z "$ARCH" ]; then
  UNAME_ARCH="$(uname -m)"
  if [ "$UNAME_ARCH" = "arm64" ]; then
    ARCH="arm64"
  else
    ARCH="x64"
  fi
fi
if command -v npm >/dev/null 2>&1; then
  if [ -f "package-lock.json" ]; then
    npm ci
  else
    npm install
  fi
else
  echo "npm 未找到"
  exit 1
fi
npm run build
npx electron-builder --mac --$ARCH
DMG_FILE="$(ls -t release/*.dmg 2>/dev/null | head -n1 || true)"
if [ -n "$DMG_FILE" ]; then
  echo "DMG 生成成功: $DMG_FILE"
else
  echo "未找到 DMG 文件，查看 release 目录"
  ls -la release || true
fi
