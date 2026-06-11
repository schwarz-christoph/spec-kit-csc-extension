#!/usr/bin/env bash
# One-line installer for the csc CLI:
#   curl -fsSL https://raw.githubusercontent.com/schwarz-christoph/spec-kit-csc-extension/main/install-cli.sh | bash
set -euo pipefail

REPO="${CSC_REPO:-github:schwarz-christoph/spec-kit-csc-extension}"

if ! command -v npm >/dev/null 2>&1; then
  echo "error: npm not found — install Node.js >= 18 first (https://nodejs.org)" >&2
  exit 1
fi

echo "installing csc from ${REPO} ..."
npm install -g "${REPO}"

echo
echo "done — try: csc --help"
echo "bootstrap a project with: csc init my-project"
