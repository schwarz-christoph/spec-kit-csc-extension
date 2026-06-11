#!/usr/bin/env bash
# Manual installer for the speckit-grill extension.
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

# Claude Code: install as both a slash command and an auto-triggering skill.
if [[ -d "$TARGET/.claude" ]]; then
  mkdir -p "$TARGET/.claude/commands" "$TARGET/.claude/skills/speckit-grill"
  cp "$EXT_DIR/commands/speckit-grill.md" "$TARGET/.claude/commands/speckit-grill.md"
  cp "$EXT_DIR/skills/speckit-grill/SKILL.md" \
     "$EXT_DIR/skills/speckit-grill/ARTIFACT-MAP.md" \
     "$TARGET/.claude/skills/speckit-grill/"
  echo "installed: .claude/commands/speckit-grill.md"
  echo "installed: .claude/skills/speckit-grill/ (SKILL.md, ARTIFACT-MAP.md)"
fi

# GitHub Copilot prompts, if the project uses them.
if [[ -d "$TARGET/.github/prompts" ]]; then
  cp "$EXT_DIR/commands/speckit-grill.md" "$TARGET/.github/prompts/speckit-grill.prompt.md"
  echo "installed: .github/prompts/speckit-grill.prompt.md"
fi

echo "done — /speckit-grill is available in $TARGET"
