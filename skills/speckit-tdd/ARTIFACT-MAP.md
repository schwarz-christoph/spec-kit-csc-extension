# Artifact Map — how TDD reads and writes spec-kit artifacts

Do not invent new file types (no `CONTEXT.md`, no `docs/adr/`). For the exact section structure of
each file, defer to the canonical templates in `.specify/templates/`.

## Read side — where behaviors come from

| Source | What it supplies |
|---|---|
| `spec.md` → **Acceptance Scenarios** | Each Given/When/Then maps to roughly one integration test. |
| `spec.md` → **Functional Requirements** (`FR-###`) | Each FR is testable by spec-kit's own rule; each becomes one or more tests. |
| `spec.md` → **Success Criteria** (`SC-###`) | Measurable assertions (thresholds, counts, latencies) for the tests. |
| `spec.md` → **Key Entities** + `constitution.md` | The vocabulary for test names and interface design. |
| `plan.md`, `research.md` | Recorded decisions to respect — don't re-litigate a documented choice. |
| `tasks.md` | Session scope: one task per TDD session. |

## Write side — where results go

| What happened | Where it goes | Notes |
|---|---|---|
| A task's cycles are GREEN and refactored | `tasks.md` — mark the task `[X]` | Only then. **Never generate `tasks.md`** — that's `/speckit-tasks`. |
| A behavior the spec misses, discovered mid-cycle | `spec.md` → **Functional Requirements** (`FR-###`) or **Edge Cases** | Testable, technology-agnostic, next sequential number. Add to sections; don't restructure. |
| A non-obvious interface decision (deep-module shape, seam placement) + rationale | `research.md` | "We chose X over Y because Z." Create lazily — only once `plan.md` exists. |
| A deviation from a decision recorded in `plan.md`/`research.md` | Surface it to the user, then update `research.md` | Don't silently diverge from a documented choice. |
| A conflict with a constitution principle | Surface it — do not code around it | Record an exception in `plan.md`'s Constitution Check or propose an amendment, as `/speckit-grill` would. |

## Keep `spec.md` clean

`spec.md` describes **WHAT** the product must do, not **HOW**. Test names and FRs describe behavior;
the module shapes, mocking strategy, and seams you chose belong in `research.md`.
