---
description: "Relentless grilling session that stress-tests the active Spec Kit feature against the project constitution and its spec-kit artifacts (spec.md, plan.md, research.md), sharpens the ubiquitous language, and writes resolved decisions back into those artifacts inline as they crystallise. The unbounded, adversarial counterpart to /speckit-clarify."
---

<what-to-do>

Interview me relentlessly about every aspect of this spec/plan until we reach a shared
understanding. Walk down each branch of the design tree, resolving dependencies between decisions
one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

</what-to-do>

<supporting-info>

This is the spec-kit-native sibling of the `grill-with-docs` skill. The "docs" you challenge against
and write back to are **GitHub Spec Kit artifacts**, not a `CONTEXT.md`/`docs/adr/` pair. Do not
create `CONTEXT.md` or ADR files — everything lands in spec-kit artifacts (see the **Artifact Map**
at the end of this command).

This command complements `/speckit-clarify` (bounded, ≤5 structured questions resolving
`[NEEDS CLARIFICATION]`) and `/speckit-analyze` (read-only audit). It is the **unbounded,
adversarial, editing** counterpart: walk every branch and challenge against the constitution + code.

## Locate the active feature

Run, from the repo root:

```
.specify/scripts/bash/check-prerequisites.sh --json --paths-only
```

Use `--paths-only` so it does **not** hard-fail when `plan.md` is absent (a spec-only feature is
valid to grill). It returns `REPO_ROOT`, `BRANCH`, `FEATURE_DIR`, `FEATURE_SPEC`, `IMPL_PLAN`,
`TASKS`. If the script is unavailable, fall back to `.specify/feature.json` for the feature path.

Then read:

- `.specify/memory/constitution.md` — **always**. These are the governing principles.
- `${FEATURE_DIR}/spec.md` — the spec under grilling.
- `${FEATURE_DIR}/plan.md`, `research.md`, `data-model.md`, `contracts/` — **when they exist.**

**Detect the phase** and let it choose your writeback target:

- **Spec-only** (no `plan.md`): grill the spec; write to `spec.md` only. Do not fabricate a
  `research.md` or `plan.md`.
- **Planned** (`plan.md` exists): grill spec *and* plan; write to `spec.md`, `plan.md`,
  `research.md` as appropriate.

## Three grilling lenses

Walk the decision tree through all three. Mix them as the conversation demands.

### 1. Ubiquitous language

Challenge terms against `spec.md` **Key Entities** and the language used in `constitution.md`. When a
term is fuzzy, overloaded, or conflicts with an existing definition, call it out and force a
canonical choice. Examples for this repo: "portal" vs "allowed origin" vs "site"; "device" vs
"unit" vs "node"; "fleet management" vs "management service". When resolved, write the canonical
definition into **Key Entities**.

### 2. Constitution compliance (the hard lens)

Challenge the spec/plan against each of the five NON-NEGOTIABLE principles and the concrete Security
& Compliance Requirements. **Cite principle numbers** — the constitution's Governance section
requires reviewers to name the principles they verified. Examples:

- "Your plan would pin a snap to `latest/stable`, but **Principle II** (and `FR-015`) forbid
  unpinned revisions in release manifests — which pinned revision?"
- "This step checks 'did it run' but not completeness — **Principle III** requires a manifest
  comparison. What's the required-artifact manifest?"
- "A dev image with FDE disabled is described as the same artifact — **Principle I** requires it be a
  separately-named, separately-built artifact with an expiry plan."

On a genuine, deliberate deviation, do **not** silently accept it: either record a Governance
**exception** (scope, expiry, approver) in `plan.md`'s Constitution Check, or propose a constitution
amendment. Never write anything into the spec/plan that contradicts the constitution without one of
these.

### 3. Spec ↔ plan ↔ code coherence

Cross-reference the user's claims against `spec.md`, `plan.md`, and the **actual code** — including
submodules (e.g. the `isac` submodule). When you find a contradiction, surface it: "The plan says
ISAC runs strictly-confined, but the submodule's packaging requests classic confinement — which is
right?" Resolve `[NEEDS CLARIFICATION]` markers and pin down underspecified `FR-###` / `SC-###`.

## Discuss concrete scenarios

When boundaries are being discussed, stress-test them with specific scenarios that probe edge cases
(no network at boot, peripheral disconnect, power loss mid-update, physical-access attacker). Force
precise answers, then feed confirmed scenarios into `spec.md` Edge Cases or the relevant Acceptance
Scenarios.

## Writeback (inline, not batched)

Capture each resolution the moment it crystallises — do not save them up for the end. Where each
kind of resolution goes is defined in the **Artifact Map** below. In short: terms and
requirements → `spec.md`; technical decisions + rationale → `research.md`; constitution findings and
accepted exceptions → `plan.md` Constitution Check.

## Guardrails

- **`spec.md` stays free of implementation detail** (mirror spec-kit's own rule). Browser engine,
  snap base, gadget/kernel choices, build tooling — those are decisions for `plan.md`/`research.md`,
  not the spec.
- **Constitution is authoritative.** Never record a spec/plan decision that conflicts with it
  without a recorded exception or a proposed amendment.
- **Preserve each artifact's template headings and structure** (see `.specify/templates/`). Add to
  sections; don't restructure them.
- **Spell `CAPTRON` in uppercase**, always.
- **Don't duplicate sibling skills.** Don't generate `tasks.md` (that's `/speckit-tasks`) and don't
  emit the full read-only consistency report (that's `/speckit-analyze`).

</supporting-info>

<artifact-map>

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

</artifact-map>
