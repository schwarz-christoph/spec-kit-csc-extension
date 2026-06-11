#!/usr/bin/env bash
# Manual installer for the spec-kit-csc-extension skills.
# Use this when your spec-kit version does not support `specify extension add`.
#
# Usage: ./install.sh /path/to/your/spec-kit-project
set -euo pipefail

EXT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?Usage: ./install.sh /path/to/your/spec-kit-project}"

if [[ ! -d "$TARGET/.specify" ]]; then
  echo "error: $TARGET does not look like a spec-kit project (no .specify/ directory)" >&2
  exit 1
fi

# Claude Code: install each command as a slash command and each skill as an
# auto-triggering skill.
if [[ -d "$TARGET/.claude" ]]; then
  mkdir -p "$TARGET/.claude/commands"
  for cmd in "$EXT_DIR"/commands/*.md; do
    cp "$cmd" "$TARGET/.claude/commands/$(basename "$cmd")"
    echo "installed: .claude/commands/$(basename "$cmd")"
  done
  for skill in "$EXT_DIR"/skills/*/; do
    name="$(basename "$skill")"
    mkdir -p "$TARGET/.claude/skills/$name"
    cp "$skill"*.md "$TARGET/.claude/skills/$name/"
    echo "installed: .claude/skills/$name/"
  done
fi

# GitHub Copilot prompts, if the project uses them.
if [[ -d "$TARGET/.github/prompts" ]]; then
  for cmd in "$EXT_DIR"/commands/*.md; do
    base="$(basename "$cmd" .md)"
    cp "$cmd" "$TARGET/.github/prompts/$base.prompt.md"
    echo "installed: .github/prompts/$base.prompt.md"
  done
fi

echo "done — 7 /speckit-* commands available in $TARGET"
