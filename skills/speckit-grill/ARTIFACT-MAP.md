# Artifact Map — where each resolved decision goes

When grilling crystallises a decision, write it back **inline** to the spec-kit artifact below. Do
not invent new file types (no `CONTEXT.md`, no `docs/adr/`). For the exact section structure of each
file, defer to the canonical templates in `.specify/templates/` rather than reinventing it.

| What got resolved | Where it goes | Notes |
|---|---|---|
| A sharpened or conflicting **term** | `spec.md` → **Key Entities** | Bold term name + a 1–2 sentence definition of what it *is*. Pick one canonical word; note the rejected aliases. |
| A new or refined **requirement** | `spec.md` → **Functional Requirements** (`FR-###`) | Testable, unambiguous, technology-agnostic. Use the next sequential `FR` number; group under the right subsystem heading. |
| A new or refined **success criterion** | `spec.md` → **Success Criteria** (`SC-###`) | Measurable and technology-agnostic. Next sequential `SC` number. |
| A resolved `[NEEDS CLARIFICATION]` | `spec.md`, **in place** | Replace the marker exactly where it sat. Mirror `/speckit-clarify`'s inline-encoding so the two skills stay compatible. |
| A confirmed **edge case / scenario** | `spec.md` → **Edge Cases** or the relevant **Acceptance Scenarios** | Use the Given/When/Then form already in the spec for acceptance scenarios. |
| A confirmed **assumption** or **dependency** | `spec.md` → **Assumptions** / **Dependencies** | |
| A **technical decision** (engine, base, tooling) + rationale + rejected alternatives | `research.md` | The native home for "we chose X over Y because Z". **Create lazily** — only once planning has started (`plan.md` exists). Never fabricate a `research.md` for a spec-only feature. |
| A **constitution finding** or an accepted **Governance exception** | `plan.md` → **Constitution Check** | Cite the principle number(s). An exception records scope, expiry, and approver per the constitution's Governance section. |
| A needed change to a **governing principle** | Propose an amendment to `.specify/memory/constitution.md` | Do not edit the constitution silently — surface it as a proposed amendment (motivation, principles affected, version bump) per its Governance procedure. |

## Phase gate

- **Spec-only** (no `plan.md`): only `spec.md` is a valid write target. Defer technical decisions —
  note them for the planning phase rather than writing a `research.md`.
- **Planned** (`plan.md` exists): all of the above are in play.

## Keep `spec.md` clean

`spec.md` describes **WHAT** the product must do, not **HOW**. Implementation choices belong in
`plan.md` / `research.md`. If a grilling answer is an implementation decision, route it there — do
not pollute the spec with it.
