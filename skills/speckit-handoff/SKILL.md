---
name: speckit-handoff
description: Compact the current conversation into a handoff document for another agent to pick up. In a spec-kit project, anchors the handoff to the active feature (branch, FEATURE_DIR, phase, open tasks) and references spec-kit artifacts by path instead of duplicating them.
argument-hint: "What will the next session be used for?"
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

In a spec-kit project, open the handoff with the active-feature pointer: the branch, the `FEATURE_DIR`, the current phase (spec-only / planned / tasked — detect by which of `spec.md`, `plan.md`, `tasks.md` exist), and which `tasks.md` items are done vs pending. Locate the feature via `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` (fallback: `.specify/feature.json`).

Include a "suggested skills" section in the document, which suggests skills that the agent should invoke. In a spec-kit project this may include `/speckit-*` commands (e.g. `/speckit-plan` if the feature is spec-only, `/speckit-tasks` if planned but untasked, `/speckit-grill` if open contradictions remain).

Do not duplicate content already captured in other artifacts (the constitution, `spec.md`, `plan.md`, `research.md`, `data-model.md`, `tasks.md`, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
