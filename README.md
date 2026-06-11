# spec-kit-csc-extension

[![Spec Kit Extension](https://img.shields.io/badge/Spec%20Kit-extension-blueviolet?logo=github)](https://github.github.com/spec-kit/reference/extensions.html)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](extension.yml)
[![Command](https://img.shields.io/badge/command-%2Fspeckit--grill-success)](commands/speckit-grill.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```bash
specify extension add grill --from https://github.com/schwarz-christoph/spec-kit-csc-extension.git
```

A [GitHub Spec Kit](https://github.com/github/spec-kit) extension that adds the
**`/speckit-grill`** command: a relentless, unbounded grilling session that stress-tests the active
feature against the project constitution and its spec-kit artifacts (`spec.md`, `plan.md`,
`research.md`), sharpens the ubiquitous language, and writes resolved decisions back into those
artifacts **inline as they crystallise**.

It is the adversarial counterpart to the built-in commands:

| Command | Scope | Mode |
|---|---|---|
| `/speckit-clarify` | ≤5 structured questions resolving `[NEEDS CLARIFICATION]` | bounded, editing |
| `/speckit-analyze` | consistency report across artifacts | read-only audit |
| **`/speckit-grill`** | every branch of the design tree, challenged against constitution + code | **unbounded, adversarial, editing** |

## What it does

- Asks questions **one at a time**, each with a recommended answer, until shared understanding is
  reached. Questions answerable from the codebase are answered by exploring the codebase instead.
- Grills through three lenses: **ubiquitous language**, **constitution compliance** (citing
  principle numbers), and **spec ↔ plan ↔ code coherence**.
- Writes each resolution back the moment it crystallises, routed by the
  [Artifact Map](skills/speckit-grill/ARTIFACT-MAP.md): terms and requirements → `spec.md`,
  technical decisions + rationale → `research.md`, constitution findings and Governance exceptions →
  `plan.md` Constitution Check. It never invents new file types (`CONTEXT.md`, ADRs).
- Respects the phase gate: a spec-only feature (no `plan.md`) only ever writes to `spec.md`.

## Layout

```
extension.yml                       # spec-kit extension manifest (schema 1.0)
commands/
  speckit-grill.md                  # self-contained command file (artifact map embedded)
skills/
  speckit-grill/
    SKILL.md                        # Claude Code skill (canonical instructions)
    ARTIFACT-MAP.md                 # where each kind of resolved decision is written back
install.sh                          # manual installer for projects without `specify extension`
NOTICE                              # upstream attribution (MIT, Matt Pocock)
```

`skills/speckit-grill/` is the canonical source; `commands/speckit-grill.md` is the same content
flattened into a single self-contained file (spec-kit copies command files into agent command
folders on their own, so the artifact map is embedded rather than linked). If you change one, keep
the other in sync.

## Install

### Via the specify CLI (spec-kit with extension support)

Use the one-liner at the top of this README. For local development from a checkout of this repo:

```bash
specify extension add grill --dev /path/to/spec-kit-csc-extension
```

### Manual

```bash
./install.sh /path/to/your/spec-kit-project
```

This copies the command into `.claude/commands/` (and the skill into `.claude/skills/`, so Claude
Code also triggers it on phrases like "grill me on this spec"), plus `.github/prompts/` if the
project uses Copilot prompts.

## Usage

From a spec-kit project with an active feature (after `/speckit-specify`, optionally after
`/speckit-plan`):

```
/speckit-grill
```

or just ask: *"grill me on this spec"*, *"stress-test the plan against the constitution"*.

## Requirements

- A spec-kit project (`.specify/` with `memory/constitution.md` and
  `scripts/bash/check-prerequisites.sh`; the command falls back to `.specify/feature.json` when the
  script is unavailable).
- An active feature with at least a `spec.md`.

## Notice

The `speckit-grill` skill is derived from the `grill-with-docs` skill in
[Matt Pocock's skills collection](https://github.com/mattpocock/skills), used under the
[MIT License](https://github.com/mattpocock/skills/blob/main/LICENSE). See [NOTICE](NOTICE) for the
full attribution and license text.
