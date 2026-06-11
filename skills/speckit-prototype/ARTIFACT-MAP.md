# Artifact Map — where a prototype's answer goes

A prototype is input; the **answer** is the artifact. Route it back into the spec-kit files below. Do
not invent new file types (no `CONTEXT.md`, no `docs/adr/`) — `NOTES.md` next to the prototype is the
only exception, and it is a stopgap that dies with the prototype. For the exact section structure of
each file, defer to the canonical templates in `.specify/templates/`.

| What the prototype answered | Where it goes | Notes |
|---|---|---|
| A `[NEEDS CLARIFICATION]` marker the prototype was anchored to | `spec.md`, **in place** | Replace the marker exactly where it sat, with the WHAT-level conclusion only. Mirror `/speckit-clarify`'s inline-encoding. |
| A requirement-level conclusion ("the system must support X") | `spec.md` → **Functional Requirements** (`FR-###`) or **Acceptance Scenarios** | Testable, technology-agnostic. Next sequential `FR` number; Given/When/Then for scenarios. |
| The validated **decision** + the rejected variants (logic: the reducer/state-machine shape that held up; UI: which variant won and why, losers as rejected alternatives) | `research.md` | The native home for "we chose X over Y because Z". **Create lazily** — only once `plan.md` exists. |
| Validated **entities, fields, state transitions** | `data-model.md` | Update or extend the existing model; don't restructure it. |
| Anything contradicting the constitution | Surface it — do not write it | Either drop the approach or propose a Governance exception / amendment as `/speckit-grill` would. |

## Phase gate

- **Spec-only** (no `plan.md`): only `spec.md` is a valid write target. Implementation-level answers
  go in a `NOTES.md` next to the prototype **as a stopgap**, with an instruction to fold it into
  `research.md` when `/speckit-plan` runs.
- **Planned** (`plan.md` exists): all of the above are in play.

## No active feature

Ask which feature in `specs/` the prototype belongs to. If none fits, fall back to a commit message
or `NOTES.md`, and suggest `/speckit-specify` if the answer is load-bearing enough to deserve a
feature of its own.

## Keep `spec.md` clean

`spec.md` describes **WHAT** the product must do, not **HOW**. The reducer shape, the winning
layout's component structure, the library choice — those route to `research.md`/`data-model.md`,
never the spec.
