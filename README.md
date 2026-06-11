# spec-kit-csc-extension

[![Spec Kit Extension](https://img.shields.io/badge/Spec%20Kit-extension-blueviolet?logo=github)](https://github.github.com/spec-kit/reference/extensions.html)
[![Version](https://img.shields.io/badge/version-0.2.0-blue)](extension.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```bash
specify extension add csc --from https://github.com/schwarz-christoph/spec-kit-csc-extension.git
```

A [GitHub Spec Kit](https://github.com/github/spec-kit) extension that adds **seven spec-kit-native
skills**. Each one is an adaptation of a skill from
[Matt Pocock's skills collection](https://github.com/mattpocock/skills), rewired so that everything
it reads and writes is a **spec-kit artifact** (`spec.md`, `plan.md`, `research.md`, `data-model.md`,
`tasks.md`, `.specify/memory/constitution.md`) — never a `CONTEXT.md` or ADR file.

> **Upgrading from 0.1.x?** This extension was previously published with id `grill`. Remove the old
> extension and re-add it as `csc` (one-liner above).

## Commands

| Command | What it does | Reads | Writes |
|---|---|---|---|
| `/speckit-grill` | Unbounded, adversarial grilling of the active feature against the constitution and code | constitution, `spec.md`, `plan.md`, `research.md`, code | `spec.md`, `plan.md`, `research.md` |
| `/speckit-architecture` | Codebase-wide review for deepening opportunities (shallow modules → deep ones), rendered as a visual HTML report | constitution, Key Entities across `specs/*/spec.md`, `specs/*/research.md`, code | owning feature's `spec.md` Key Entities / `research.md`; offers `/speckit-specify` for accepted refactors |
| `/speckit-tdd` | Red-green-refactor where Acceptance Scenarios and `FR-###` drive the test list and tests cite the FR/SC they verify | constitution, `spec.md`, `plan.md`, `research.md`, `tasks.md` | `tasks.md` ticks, new `FR-###`/Edge Cases, `research.md` decisions |
| `/speckit-prototype` | Throwaway prototype answering an open question — interactive terminal app (logic) or multi-variant route (UI) | `spec.md` markers, `plan.md`, `data-model.md` | resolves `[NEEDS CLARIFICATION]` in place; `research.md`, `data-model.md` |
| `/speckit-teach` | Stateful multi-session teaching workspace (mission, resources, lessons, learning records, glossary) | constitution + Key Entities when teaching the project's own domain | its own workspace files only |
| `/speckit-caveman` | Ultra-compressed responses (~75% fewer tokens); spec-kit identifiers stay exact | — | — |
| `/speckit-handoff` | Compacts the conversation into a handoff doc anchored to the active feature, referencing artifacts by path | feature state (`spec.md`/`plan.md`/`tasks.md` presence) | a handoff file in the OS temp dir |

### `/speckit-grill` vs the built-ins

| Command | Scope | Mode |
|---|---|---|
| `/speckit-clarify` | ≤5 structured questions resolving `[NEEDS CLARIFICATION]` | bounded, editing |
| `/speckit-analyze` | consistency report across artifacts | read-only audit |
| **`/speckit-grill`** | every branch of the design tree, challenged against constitution + code | **unbounded, adversarial, editing** |

## Shared conventions

All skills follow the same spec-kit discipline:

- **Locate the active feature** via `.specify/scripts/bash/check-prerequisites.sh --json --paths-only`
  (fallback: `.specify/feature.json`); always read `.specify/memory/constitution.md`.
- **Phase gate**: a spec-only feature (no `plan.md`) only ever writes to `spec.md`; `research.md` is
  created lazily, never fabricated.
- **Artifact Map**: each editing skill carries an `ARTIFACT-MAP.md` routing every kind of resolution
  to the right artifact. No skill invents new file types (`CONTEXT.md`, `docs/adr/`).
- **Template preservation**: artifacts keep the headings from `.specify/templates/` — skills add to
  sections, they don't restructure.
- **No sibling duplication**: nothing here generates `tasks.md` (`/speckit-tasks`) or emits the
  read-only audit (`/speckit-analyze`).

## Layout

```
extension.yml                       # spec-kit extension manifest (schema 1.0)
commands/
  speckit-grill.md                  # self-contained command files
  speckit-architecture.md           #   (supporting docs + artifact map embedded)
  speckit-tdd.md
  speckit-prototype.md
  speckit-teach.md
  speckit-caveman.md
  speckit-handoff.md
skills/
  speckit-grill/                    # SKILL.md + ARTIFACT-MAP.md
  speckit-architecture/             # SKILL.md + LANGUAGE/DEEPENING/INTERFACE-DESIGN/HTML-REPORT + ARTIFACT-MAP.md
  speckit-tdd/                      # SKILL.md + tests/mocking/deep-modules/interface-design/refactoring + ARTIFACT-MAP.md
  speckit-prototype/                # SKILL.md + LOGIC.md + UI.md + ARTIFACT-MAP.md
  speckit-teach/                    # SKILL.md + four FORMAT templates
  speckit-caveman/                  # SKILL.md
  speckit-handoff/                  # SKILL.md
install.sh                          # manual installer for projects without `specify extension`
NOTICE                              # upstream attribution (MIT, Matt Pocock)
```

Each `skills/<name>/` directory is the canonical source; `commands/<name>.md` is the same content
flattened into a single self-contained file (spec-kit copies command files into agent command
folders on their own, so supporting docs and artifact maps are embedded rather than linked). If you
change one, keep the other in sync.

## Install

### Via the specify CLI (spec-kit with extension support)

Use the one-liner at the top of this README. For local development from a checkout of this repo:

```bash
specify extension add csc --dev /path/to/spec-kit-csc-extension
```

### Manual

```bash
./install.sh /path/to/your/spec-kit-project
```

This copies all seven commands into `.claude/commands/` (and the skill directories into
`.claude/skills/`, so Claude Code also auto-triggers them on phrases like "grill me on this spec" or
"prototype this"), plus `.github/prompts/` if the project uses Copilot prompts.

## Usage

From a spec-kit project with an active feature (after `/speckit-specify`, optionally after
`/speckit-plan`):

```
/speckit-grill
/speckit-architecture
/speckit-tdd
/speckit-prototype
/speckit-teach
/speckit-caveman
/speckit-handoff
```

or just ask: *"grill me on this spec"*, *"find deepening opportunities"*, *"TDD this task"*,
*"prototype this"*, *"caveman mode"*, *"write a handoff"*.

## Requirements

- A spec-kit project (`.specify/` with `memory/constitution.md` and
  `scripts/bash/check-prerequisites.sh`; the commands fall back to `.specify/feature.json` when the
  script is unavailable).
- An active feature with at least a `spec.md` (not needed for `/speckit-caveman` and
  `/speckit-teach`).

## Notice

The skills in this extension are derived from skills in
[Matt Pocock's skills collection](https://github.com/mattpocock/skills), used under the
[MIT License](https://github.com/mattpocock/skills/blob/main/LICENSE). See [NOTICE](NOTICE) for the
full attribution, the per-skill upstream mapping, and the license text.
