---
name: speckit-prototype
description: Build a throwaway prototype that answers an open question in the active Spec Kit feature — a runnable terminal app for state/business-logic questions, or several radically different UI variations toggleable from one route. The answer resolves [NEEDS CLARIFICATION] markers in spec.md in place and lands as a decision in research.md / data-model.md, phase-gated. Use when the user wants to prototype, sanity-check a data model or state machine, mock up a UI, explore design options, or says "prototype this", "let me play with it", "try a few designs".
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Anchor the question in the active feature

Locate the active feature first. Run, from the repo root:

```
.specify/scripts/bash/check-prerequisites.sh --json --paths-only
```

(Fall back to `.specify/feature.json` if the script is unavailable.) Then read `${FEATURE_DIR}/spec.md` — and `plan.md`, `research.md`, `data-model.md` when they exist.

The question a prototype answers should ideally already exist as a `[NEEDS CLARIFICATION]` marker or an open decision in `spec.md`/`plan.md`. Quote it **verbatim** at the top of the prototype so the answer can later be routed back to exactly where the question came from. If the user's question isn't in the artifacts yet, write it down in the prototype anyway — it may become an `FR-###` or a `research.md` decision once answered.

If no spec-kit feature is active, ask which feature in `specs/` the prototype belongs to. If none fits, proceed without an anchor and capture the answer in a commit message or `NOTES.md` — and suggest `/speckit-specify` if the answer turns out to be load-bearing.

## Pick a branch

Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a tiny interactive terminal app that pushes the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → [UI.md](UI.md). Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.

The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious — but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
2. **One command to run.** Whatever the project's existing task runner supports — `pnpm <name>`, `python <path>`, `bun <path>`, etc. The user must be able to start it without thinking.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast and then delete it.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Delete or absorb when done.** When the prototype has answered its question, either delete it or fold the validated decision into the real code — don't leave it rotting in the repo.

## When done

The _answer_ is the only thing worth keeping from a prototype. Capture it durably by routing it into the spec-kit artifacts per [ARTIFACT-MAP.md](./ARTIFACT-MAP.md):

- A requirement-level conclusion resolves the `[NEEDS CLARIFICATION]` in `spec.md` **in place** (the WHAT only — implementation detail stays out of the spec).
- The validated decision plus the rejected variants go into `research.md`.
- Validated entities and state transitions are reflected in `data-model.md`.
- **Phase gate**: `research.md`/`data-model.md` are only valid targets once `plan.md` exists. For a spec-only feature, leave a `NOTES.md` next to the prototype as a stopgap and fold it into `research.md` when `/speckit-plan` runs.

If the user is around, that capture is a quick conversation; if not, leave the `NOTES.md` placeholder so they (or you, on the next pass) can fill in the verdict before deleting the prototype.
