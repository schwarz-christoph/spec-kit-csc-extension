# Workflow

How the **csc** extension changes the way you work in a spec-kit project. This is the
end-to-end picture: the stock spec-kit phases, the seven extension commands that slot into
them, and the one-command `csc` bootstrapper that sets the whole thing up.

If you just want the command reference, see the [README](README.md). This file is about
*when* you reach for each piece and *why*.

---

## 0. Bootstrap — `csc init`

Before any of the workflow below exists, you need a spec-kit project with the extensions and
MCP servers wired in. The `csc` CLI collapses the old manual dance (`specify init` → install
each extension → hand-edit MCP config per agent) into one command:

```bash
csc init my-project --ai both
```

This does, in order:

1. **`specify init`** for the first agent, then layers the second agent on top with
   `--here --force` (so `--ai both` gives you a project both Claude Code and Codex understand).
2. **Installs the configured extensions** — by default `csc` (this repo, the seven commands
   in §3) plus three third-party extensions that each add their own sub-workflow:
   [`brownfield`](https://github.com/Quratulain-bilal/spec-kit-brownfield) (onboard existing
   codebases), [`superspec`](https://github.com/WangX0111/superspec) (enhanced clarify / tasks /
   implement / review), and [`spec-kit-agent-assign`](https://github.com/xymelon/spec-kit-agent-assign)
   (route tasks to specialized agents). See §4 for what each contributes. Commands land in
   `.claude/commands/` and skills in `.claude/skills/` for Claude Code; for Codex everything
   is written into the cross-agent `.agents/skills/<name>/SKILL.md` layout (plain commands are
   auto-wrapped into SKILL.md entries).
3. **Writes your MCP servers** into the right place per agent — `.mcp.json` for Claude Code,
   `~/.codex/config.toml` for Codex.
4. **Runs your post-init hooks** (configurable shell commands).

Everything is overridable per-run (`--ai`, `--ext`, `--no-ext`, `--no-mcp`, …) or persistently
via `~/.config/csc/config.json`. To add a single extension to a project that already exists:

```bash
csc add <name|url|zip|path>      # install one extension into the current project
csc ext add|remove|list          # manage the default extension set
csc mcp add|apply|list           # manage MCP servers (stdio + remote)
csc config set|get|edit          # tweak defaults, hooks, sources
```

Once `csc init` finishes you have a normal spec-kit project — the rest of this workflow
applies whether you bootstrapped with `csc` or `specify` directly.

---

## 1. The spec-kit phases (unchanged)

The extension does **not** replace the core spec-kit loop. Stock spec-kit still owns the
backbone:

| Phase | Command | Produces |
|---|---|---|
| Principles | `/speckit-constitution` | `.specify/memory/constitution.md` |
| Specify | `/speckit-specify` | `specs/<feature>/spec.md` |
| Clarify | `/speckit-clarify` | resolves `[NEEDS CLARIFICATION]` (≤5 Qs) |
| Plan | `/speckit-plan` | `plan.md`, `research.md`, `data-model.md` |
| Tasks | `/speckit-tasks` | `tasks.md` |
| Analyze | `/speckit-analyze` | read-only consistency report |
| Implement | `/speckit-implement` | the code |

The csc commands are **never** substitutes for these. Nothing in the extension generates
`tasks.md` or emits the `/speckit-analyze` audit — the extension fills the *gaps between*
these phases with deeper, less-bounded tooling.

---

## 2. The workflow, end to end

The core spec-kit loop is a straight line: **constitution → specify → clarify → plan → tasks →
implement**. What the extensions add is *choice at each step* — most steps have more than one way
to do them, so the diagram below models them as **decision diamonds** (orange ◆) rather than a
single fixed path. Pick the approach that fits the feature; the unchosen ones are just skipped.

Two things are worth saying up front because they shape the whole picture:

- **Existing codebase?** Onboarding a project that already has code is a *separate* up-front
  workflow — the **brownfield** extension — with its own four-step flow and gates. It's drawn as
  its own diagram in §2.2; it ends by feeding a generated constitution + reverse-engineered specs
  into the main loop.
- **superspec is not a separate track.** It does **not** run end-to-end alongside the loop —
  it *augments individual steps* (a richer clarify, an enhanced tasks, a TDD/subagent execute, and
  a review gate), wired in via optional hooks that prompt "use the enhanced version?" at the
  matching boundary. So it shows up inside the decision diamonds, not as a parallel lane.

### 2.1 Main flow — the loop with its decision points

Blue = core spec-kit · purple = csc commands · gold = superspec · orange = agent-assign ·
green = the brownfield hand-off · ◆ = a point where you choose between approaches. Renders on GitHub.

```mermaid
flowchart TD
    START([★ START]):::entry --> Q0{"new or existing<br/>codebase?"}:::branch
    Q0 -->|green-field| C
    Q0 -->|existing code| BREF["▶ Brownfield onboarding<br/>(separate flow, §2.2)"]:::bf
    BREF -->|generated constitution + migrated specs| C

    C["/speckit-constitution"]:::core --> S["/speckit-specify<br/>► spec.md"]:::core

    %% ---- decision: how to clarify / harden the spec ----
    S --> Q1{"clarify and harden<br/>the spec — how?"}:::branch
    Q1 -->|"quick, bounded · ≤5 Qs"| CL["/speckit-clarify"]:::core
    Q1 -->|"deep edge-case sweep · iterates"| BR["/speckit.superspec.brainstorm"]:::ss
    Q1 -->|"adversarial stress-test"| GR1["/speckit-grill"]:::csc
    Q1 -->|"build a throwaway to answer it"| PR["/speckit-prototype"]:::csc
    BR -. loop until the spec is solid .-> S
    CL --> P
    BR --> P
    GR1 --> P
    PR --> P

    P["/speckit-plan<br/>► plan.md · research.md · data-model.md"]:::core --> Q2{"pressure-test<br/>the plan? (optional)"}:::branch
    Q2 -->|"challenge vs constitution + code"| GR2["/speckit-grill"]:::csc --> Q3
    Q2 -->|"deepening / shallow-module review"| AR["/speckit-architecture"]:::csc --> Q3
    Q2 -->|skip| Q3

    %% ---- decision: how to generate tasks ----
    Q3{"generate tasks —<br/>how?"}:::branch
    Q3 -->|standard| T1["/speckit-tasks"]:::core
    Q3 -->|"enhanced markers [P] [TDD] [REVIEW] [SUBAGENT]"| T2["/speckit.superspec.tasks"]:::ss
    T1 --> TM["tasks.md"]:::core
    T2 --> TM

    %% ---- decision: how to implement ----
    TM --> Q4{"implement —<br/>which approach?"}:::branch
    Q4 -->|"standard, inline"| I1["/speckit-implement"]:::core
    Q4 -->|"test-first · RED-GREEN-REFACTOR"| I2["/speckit-tdd  or  /speckit.superspec.execute"]:::csc
    Q4 -->|"route tasks to specialized agents"| AA1
    subgraph AA["agent-assign · specialized execution"]
        direction LR
        AA1["assign<br/>► agent-assignments.yml"]:::aa --> AA2["validate"]:::aa --> AA3["execute<br/>(specialized + default/inline tasks)"]:::aa
    end

    I1 --> Q5
    I2 --> Q5
    AA3 --> Q5
    Q5{"review against<br/>spec? (optional)"}:::branch
    Q5 -->|"compliance review gate"| RV["/speckit.superspec.review"]:::ss --> DONE
    Q5 -->|skip| DONE
    DONE([✓ feature shipped]):::entry

    %% ---- always available, off the path ----
    START -. any time .-> UTIL["/speckit-caveman · /speckit-handoff · /speckit-teach"]:::util

    classDef entry fill:#0b3d91,stroke:#06214d,color:#fff;
    classDef core fill:#1f6feb,stroke:#0b3d91,color:#fff;
    classDef csc fill:#8957e5,stroke:#4c2889,color:#fff;
    classDef bf fill:#1a7f37,stroke:#0d4f22,color:#fff;
    classDef aa fill:#bf4b00,stroke:#7a3000,color:#fff;
    classDef ss fill:#9a6700,stroke:#5c3d00,color:#fff;
    classDef branch fill:#d29922,stroke:#7a5800,color:#000;
    classDef util fill:#444c56,stroke:#22272e,color:#fff;
```

**Reading the decisions:**

| ◆ Decision | Options | Pick when |
|---|---|---|
| clarify the spec | `/speckit-clarify` · `superspec.brainstorm` · `/speckit-grill` · `/speckit-prototype` | bounded cleanup / deep iterative edge-case sweep / adversarial stress-test / an open question needs a runnable answer |
| pressure-test the plan | `/speckit-grill` · `/speckit-architecture` · skip | challenge the plan vs constitution+code / hunt shallow modules / the plan is already solid |
| generate tasks | `/speckit-tasks` · `superspec.tasks` | plain task list / you want execution markers (`[P]`,`[TDD]`,`[REVIEW]`,`[SUBAGENT]`) to drive execute |
| implement | `/speckit-implement` · `/speckit-tdd` or `superspec.execute` · **agent-assign** | one inline context / test-first discipline / route tasks to specialized agents (larger projects) |
| review | `superspec.review` · skip | you want a scored spec/constitution-compliance gate before shipping |

`/speckit-caveman`, `/speckit-handoff`, and `/speckit-teach` sit off the path — invoke them at any
point. superspec's `/speckit.superspec.status` is also callable any time to report progress and
the recommended next step (it's resumable across sessions).

### 2.2 Brownfield onboarding — a separate up-front flow

This is the "whole other approach": for a codebase that already exists, you don't start at
`/speckit-constitution` — you run the **brownfield** extension first. It analyses the real code,
generates a tailored constitution + templates, validates them against reality, and
reverse-engineers specs for features that were built before SDD. Only then do you enter the main
loop (at `/speckit-specify`) for new work.

```mermaid
flowchart TD
    B0([★ existing codebase · after `specify init`]):::entry --> B1
    B1["/speckit.brownfield.scan<br/>read-only · profiles stack, architecture, conventions"]:::bf --> B2
    B2["/speckit.brownfield.bootstrap<br/>► constitution.md · spec/plan/tasks templates · AGENTS.md<br/>shows a diff, merges, asks approval — never blind-overwrites"]:::bf --> B3
    B3["/speckit.brownfield.validate<br/>read-only · config vs real code, reports drift"]:::bf --> QB{"drift or gaps?"}:::branch
    QB -->|"yes — re-bootstrap"| B2
    QB -->|no| B4
    B4["/speckit.brownfield.migrate<br/>► specs/&lt;feature&gt;/{spec,plan,tasks}.md  ·  status: migrated<br/>reverse-engineers existing features, one at a time"]:::bf --> OUT([▶ enter the main flow at /speckit-specify])

    classDef entry fill:#0b3d91,stroke:#06214d,color:#fff;
    classDef bf fill:#1a7f37,stroke:#0d4f22,color:#fff;
    classDef branch fill:#d29922,stroke:#7a5800,color:#000;
```

`scan` and `validate` are read-only; `bootstrap` and `migrate` write files but always show a
plan/diff and wait for approval. The loop back from *validate* to *bootstrap* is the drift gate —
re-bootstrap until the generated config matches the actual codebase, then migrate.

### Clarification: `/speckit-clarify` vs `/speckit-grill`

These two look similar but sit at opposite ends of the spectrum — pick by how much rigor the
spec needs:

| Command | Scope | Mode |
|---|---|---|
| `/speckit-clarify` | ≤5 structured questions resolving `[NEEDS CLARIFICATION]` | bounded, editing |
| `/speckit-analyze` | consistency report across artifacts | read-only audit |
| **`/speckit-grill`** | every branch of the design tree, challenged against constitution + code | **unbounded, adversarial, editing** |

Use `/speckit-clarify` to mop up the obvious gaps quickly. Use `/speckit-grill` when the
feature is high-stakes and you want every assumption attacked until the design holds.

---

## 3. The seven csc commands in detail

| Command | When you reach for it | Reads | Writes |
|---|---|---|---|
| **`/speckit-grill`** | The spec or plan feels under-examined; you want it attacked branch by branch. | constitution, `spec.md`, `plan.md`, `research.md`, code | `spec.md`, `plan.md`, `research.md` (decisions written back inline as they crystallise) |
| **`/speckit-architecture`** | You suspect shallow modules / missed abstractions across the codebase. | constitution, Key Entities across `specs/*/spec.md`, `specs/*/research.md`, code | owning feature's `spec.md` Key Entities / `research.md`; offers `/speckit-specify` for accepted refactors |
| **`/speckit-tdd`** | Implementing a feature test-first, with each test tracing back to a requirement. | constitution, `spec.md`, `plan.md`, `research.md`, `tasks.md` | `tasks.md` ticks, new `FR-###`/Edge Cases, `research.md` decisions |
| **`/speckit-prototype`** | An open question (`[NEEDS CLARIFICATION]`) needs a runnable answer, not more discussion. | `spec.md` markers, `plan.md`, `data-model.md` | resolves the marker in place; `research.md`, `data-model.md` |
| **`/speckit-teach`** | You want a stateful, multi-session teaching workspace (mission, lessons, glossary). | constitution + Key Entities when teaching the project's own domain | its own workspace files only |
| **`/speckit-caveman`** | You want ~75% fewer tokens without losing technical accuracy. | — | — |
| **`/speckit-handoff`** | Ending a session; you want a handoff doc anchored to the active feature. | feature state (`spec.md`/`plan.md`/`tasks.md` presence) | a handoff file in the OS temp dir |

You can invoke each as a slash command, or just describe the intent in natural language
("grill me on this spec", "find deepening opportunities", "TDD this task", "prototype this",
"caveman mode", "write a handoff") — the matching skill auto-triggers.

---

## 4. The other bundled extensions

`csc init` installs three more extensions alongside the csc commands. Unlike the seven csc
commands — which are deliberately *spec-kit-native* and route every writeback into existing
artifacts (§5) — these are independent third-party tools, each with its own command namespace
(note the `.` separators) and its own sub-workflow. Use them when the situation calls for it;
they are not required on every feature.

### brownfield — adopt SDD in an existing codebase

For when you're bringing spec-kit to a project that *already has code*, rather than starting
green-field. A four-command sequence run **before** the normal loop:

| Command | Does | Produces |
|---|---|---|
| `/speckit.brownfield.scan` | Auto-discovers tech stack, frameworks, architecture, naming conventions | project profile (read-only) |
| `/speckit.brownfield.bootstrap` | Generates spec-kit config derived from the actual codebase | constitution, spec/plan templates, `AGENTS.md` |
| `/speckit.brownfield.validate` | Confirms bootstrap output matches reality; detects drift | validation report (read-only) |
| `/speckit.brownfield.migrate` | Reverse-engineers specs from existing code + tests | reconstructed `spec.md`, `plan.md`, `tasks.md` |

Flow: **scan → bootstrap → validate → migrate**, then you're in the normal §1 loop with a
constitution and specs that reflect the code you already have.

### superspec — per-step enhancement of clarify / tasks / implement / review

The "Superpowers Bridge". It does **not** run as a parallel end-to-end workflow — it reuses core
`constitution`/`specify`/`plan` unchanged and *augments four specific steps*, each offered as a
yes/no prompt via an optional hook at the matching boundary. So in §2.1 superspec appears inside
the decision diamonds, never as its own lane.

| Command | Augments | Does |
|---|---|---|
| `/speckit.superspec.status` | (any time) | Reports progress + recommended next step; resumable across sessions. Writes `.specify/superpowers.yml` |
| `/speckit.superspec.brainstorm` | the *clarify* step | Deep, iterative edge-case sweep; loops back to *specify* until the spec is solid. Edits `spec.md` in place + appends a Brainstorm Log |
| `/speckit.superspec.tasks` | `/speckit-tasks` (`after_tasks` hook) | Phased breakdown with execution markers `[P] [TDD] [REVIEW] [SUBAGENT]` |
| `/speckit.superspec.execute` | `/speckit-implement` (`before_implement` hook) | TDD (RED-GREEN-REFACTOR) + subagent dispatch + checkpoint gates; ticks `tasks.md`, tracks `progress.yml` |
| `/speckit.superspec.review` | post-implement (`after_implement` hook) | Scores the result against spec + constitution (reports if ≥80); optional `checklist-review.md` |

The mechanism underneath: each command detects whether the matching [obra/superpowers](https://github.com/obra/superpowers)
skill is installed (`.agents/skills/<skill>/SKILL.md`); if present it follows that skill's
methodology but redirects I/O to spec-kit artifacts, and if absent it falls back to a lighter
built-in protocol — superpowers is an optional enhancer, never a hard dependency. Its
`brainstorm` overlaps with `/speckit-grill` and its `execute` with `/speckit-tdd`; pick one per
step rather than running both.

### spec-kit-agent-assign — route tasks to specialized agents

Slots in **after `/speckit-tasks`** as the *implement*-step alternative: instead of one generalist
context building everything, each task is routed to the best-fit specialized agent. Requires a
roster of agent definitions in `.claude/agents/*.md` (project) or `~/.claude/agents/*.md` (user);
if none exist, `assign` bails and recommends plain `/speckit-implement`.

| Command | Produces |
|---|---|
| `/speckit.agent-assign.assign` | `agent-assignments.yml` — `agents_scanned` + per-task `{agent, reason}`, mapping each task → best-fit agent (by file path, action keywords, story/phase) or `default` |
| `/speckit.agent-assign.validate` | read-only report — coverage, agent existence, name conflicts, drift, frontmatter validity; PASS/FAIL |
| `/speckit.agent-assign.execute` | runs the list phase-by-phase: specialized tasks dispatched to their agent, `default` tasks run inline exactly like `/speckit-implement`; `[P]` tasks on different agents run in parallel, same-file tasks serialized |

Flow: **tasks → assign → validate → execute** (an optional `after_tasks` hook offers `assign`
right after task generation). Reach for it on larger projects where per-task specialization and
cross-agent parallelism pay off.

---

## 5. The discipline every csc command follows

This is what makes the extension *spec-kit-native* rather than a bolt-on. Every editing
command obeys the same rules, so writebacks always land in the right artifact and never
sprawl into invented files:

- **Locate the active feature** via
  `.specify/scripts/bash/check-prerequisites.sh --json --paths-only`
  (fallback: `.specify/feature.json`), and always read `.specify/memory/constitution.md`.
- **Phase gate** — a spec-only feature (no `plan.md`) only ever writes to `spec.md`;
  `research.md` is created lazily, never fabricated.
- **Artifact Map** — each editing skill carries an `ARTIFACT-MAP.md` routing every kind of
  resolution to the correct artifact. No skill invents new file types (no `CONTEXT.md`,
  no `docs/adr/`). This is the key adaptation from the upstream skills, which *did* write
  to `CONTEXT.md`/ADRs.
- **Template preservation** — artifacts keep the headings from `.specify/templates/`; skills
  add to sections rather than restructuring them.
- **No sibling duplication** — nothing generates `tasks.md` (that's `/speckit-tasks`) or
  emits the read-only audit (that's `/speckit-analyze`).

---

## 6. A typical end-to-end run

A representative session for a non-trivial feature:

1. `csc init payments --ai both` — bootstrap the project with extensions + MCP.
   *(Existing codebase instead of green-field? Run the brownfield sequence first —
   `/speckit.brownfield.scan → bootstrap → validate → migrate` — to reverse-engineer a
   constitution and specs from the code you already have.)*
2. `/speckit-constitution` — set the project's principles (once per project).
3. `/speckit-specify` — write the feature spec.
4. `/speckit-grill` — attack the spec; resolved decisions land back in `spec.md`.
5. `/speckit-prototype` — for the one open question that needs a runnable answer; the result
   resolves the `[NEEDS CLARIFICATION]` and lands in `research.md`/`data-model.md`.
6. `/speckit-plan` — produce `plan.md`, `research.md`, `data-model.md`.
7. `/speckit-architecture` — sanity-check for shallow modules before committing to the design.
8. **Tasks** — `/speckit-tasks` for a plain list, or `/speckit.superspec.tasks` if you want
   execution markers (`[P]`,`[TDD]`,`[REVIEW]`,`[SUBAGENT]`) to drive a later `superspec.execute`.
9. **Implement** — pick one approach: `/speckit-implement` (inline), `/speckit-tdd` /
   `/speckit.superspec.execute` (test-first), or — on a larger project with a roster of
   specialized agents — `/speckit.agent-assign.assign → validate → execute`.
10. `/speckit.superspec.review` *(optional)* — score the result against spec + constitution
    before shipping.
11. `/speckit-handoff` — when the session ends, compact it into a handoff doc for the next agent.

Not every feature needs every step — the deepening commands (`/speckit-grill`,
`/speckit-architecture`, `/speckit-prototype`) and the superspec / agent-assign alternatives come
in only when the stakes, the uncertainty, or the project size justify them. Each ◆ decision in
§2.1 is independent: you can take the enhanced path at one step and the plain one at the next.
