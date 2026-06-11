---
description: "Build a throwaway prototype that answers an open question in the active Spec Kit feature — a runnable terminal app for state/business-logic questions, or several radically different UI variations toggleable from one route. The answer resolves [NEEDS CLARIFICATION] markers in spec.md in place and lands as a decision in research.md / data-model.md, phase-gated."
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

- **"Does this logic / state model feel right?"** → the **Logic Prototype** section below. Build a tiny interactive terminal app that pushes the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → the **UI Prototype** section below. Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.

The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious — but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
2. **One command to run.** Whatever the project's existing task runner supports — `pnpm <name>`, `python <path>`, `bun <path>`, etc. The user must be able to start it without thinking.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast and then delete it.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Delete or absorb when done.** When the prototype has answered its question, either delete it or fold the validated decision into the real code — don't leave it rotting in the repo.

## When done

The _answer_ is the only thing worth keeping from a prototype. Capture it durably by routing it into the spec-kit artifacts per the **Artifact Map** at the end of this command:

- A requirement-level conclusion resolves the `[NEEDS CLARIFICATION]` in `spec.md` **in place** (the WHAT only — implementation detail stays out of the spec).
- The validated decision plus the rejected variants go into `research.md`.
- Validated entities and state transitions are reflected in `data-model.md`.
- **Phase gate**: `research.md`/`data-model.md` are only valid targets once `plan.md` exists. For a spec-only feature, leave a `NOTES.md` next to the prototype as a stopgap and fold it into `research.md` when `/speckit-plan` runs.

If the user is around, that capture is a quick conversation; if not, leave the `NOTES.md` placeholder so they (or you, on the next pass) can fill in the verdict before deleting the prototype.

---

# Logic Prototype

A tiny interactive terminal app that lets the user drive a state model by hand. Use this when the question is about **business logic, state transitions, or data shape** — the kind of thing that looks reasonable on paper but only feels wrong once you push it through real cases.

## When this is the right shape

- "I'm not sure if this state machine handles the edge case where X then Y."
- "Does this data model actually let me represent the case where..."
- "I want to feel out what the API should look like before writing it."
- Anything where the user wants to **press buttons and watch state change**.

If the question is "what should this look like" — wrong branch. Use the **UI Prototype** section below.

## Process

### 1. State the question

Before writing code, write down what state model and what question you're prototyping. One paragraph, in the prototype's README or a comment at the top of the file. If the question comes from a `[NEEDS CLARIFICATION]` marker or an open decision in the active feature's `spec.md`/`plan.md`, quote that marker **verbatim** so the answer can be routed back to exactly where it sat. A logic prototype that answers the wrong question is pure waste — make the question explicit so it can be checked later, whether the user is watching now or returning to it AFK.

### 2. Pick the language

Use whatever the host project uses. If the project has no obvious runtime (e.g. a docs repo), ask.

Match the project's existing conventions for tooling — don't add a new package manager or runtime just for the prototype.

### 3. Isolate the logic in a portable module

Put the actual logic — the bit that's answering the question — behind a small, pure interface that could be lifted out and dropped into the real codebase later. The TUI around it is throwaway; the logic module shouldn't be.

The right shape depends on the question:

- **A pure reducer** — `(state, action) => state`. Good when actions are discrete events and state is a single value.
- **A state machine** — explicit states and transitions. Good when "which actions are even legal right now" is part of the question.
- **A small set of pure functions** over a plain data type. Good when there's no implicit current state — just transformations.
- **A class or module with a clear method surface** when the logic genuinely owns ongoing internal state.

Pick whichever shape best fits the question being asked, *not* whichever is easiest to wire to a TUI. Keep it pure: no I/O, no terminal code, no `console.log` for control flow. The TUI imports it and calls into it; nothing flows the other direction.

This is what makes the prototype useful past its own lifetime. When the question's been answered, the validated reducer / machine / function set can be lifted into the real module — the TUI shell gets deleted.

### 4. Build the smallest TUI that exposes the state

Build it as a **lightweight TUI** — on every tick, clear the screen (`console.clear()` / `print("\033[2J\033[H")` / equivalent) and re-render the whole frame. The user should always see one stable view, not an ever-growing scrollback.

Each frame has two parts, in this order:

1. **Current state**, pretty-printed and diff-friendly (one field per line, or formatted JSON). Use **bold** for field names or section headers and **dim** for less important context (timestamps, IDs, derived values). Native ANSI escape codes are fine — `\x1b[1m` bold, `\x1b[2m` dim, `\x1b[0m` reset. No need to pull in a styling library unless one is already in the project.
2. **Keyboard shortcuts**, listed at the bottom: `[a] add user  [d] delete user  [t] tick clock  [q] quit`. Bold the key, dim the description, or vice-versa — whatever reads cleanly.

Behaviour:

1. **Initialise state** — a single in-memory object/struct. Render the first frame on start.
2. **Read one keystroke (or one line)** at a time, dispatch to a handler that mutates state.
3. **Re-render** the full frame after every action — don't append, replace.
4. **Loop until quit.**

The whole frame should fit on one screen.

### 5. Make it runnable in one command

Add a script to the project's existing task runner (`package.json` scripts, `Makefile`, `justfile`, `pyproject.toml`). The user should run `pnpm run <prototype-name>` or equivalent — never need to remember a path.

If the host project has no task runner, just put the command at the top of the prototype's README.

### 6. Hand it over

Give the user the run command. They'll drive it themselves; the interesting moments are when they say "wait, that shouldn't be possible" or "huh, I assumed X would be different" — those are the bugs in the _idea_, which is the whole point. If they want new actions added, add them. Prototypes evolve.

### 7. Capture the answer

When the prototype has done its job, the answer to the question is the only thing worth keeping. Route it into the spec-kit artifacts per the **Artifact Map** below: resolve the `[NEEDS CLARIFICATION]` in `spec.md` in place, record the validated reducer/machine shape and the rejected alternatives in `research.md`, and reflect validated entities and transitions in `data-model.md` (the latter two only once `plan.md` exists). If the user is around, ask what it taught them. If not — or the feature is still spec-only — leave a `NOTES.md` next to the prototype so the answer can be filled in (or filled in by you, if you've watched the session) and folded into the artifacts before the prototype gets deleted.

## Anti-patterns

- **Don't add tests.** A prototype that needs tests is no longer a prototype.
- **Don't wire it to the real database.** Use an in-memory store unless the question is specifically about persistence.
- **Don't generalise.** No "what if we wanted to support X later." The prototype answers one question.
- **Don't blur the logic and the TUI together.** If the reducer / state machine references `console.log`, prompts, or terminal escape codes, it's no longer portable. Keep the TUI as a thin shell over a pure module.
- **Don't ship the TUI shell into production.** The shell is optimised for being driven by hand from a terminal. The logic module behind it is the bit worth keeping.

---

# UI Prototype

Generate **several radically different UI variations** on a single route, switchable from a floating bottom bar. The user flips between variants in the browser, picks one (or steals bits from each), then throws the rest away.

If the question is about logic/state rather than what something looks like — wrong branch. Use the **Logic Prototype** section above.

## When this is the right shape

- "What should this page look like?"
- "I want to see a few options for this dashboard before committing."
- "Try a different layout for the settings screen."
- Any time the user would otherwise spend a day picking between three vague mockups in their head.

## Two sub-shapes — strongly prefer sub-shape A

A UI prototype is much easier to judge when it's **butting up against the rest of the app** — real header, real sidebar, real data, real density. A throwaway route on its own is a vacuum: every variant looks fine in isolation. Default to sub-shape A whenever there's a plausible existing page to host the variants. Only reach for sub-shape B if the prototype genuinely has no nearby home.

### Sub-shape A — adjustment to an existing page (preferred)

The route already exists. Variants are rendered **on the same route**, gated by a `?variant=` URL search param. The existing data fetching, params, and auth all stay — only the rendering swaps. This is the default; pick it unless there's a specific reason not to.

If the prototype is for something that doesn't yet have a page but *would naturally live inside one* (a new section of the dashboard, a new card on the settings screen, a new step in an existing flow) — that's still sub-shape A. Mount the variants inside the host page.

### Sub-shape B — a new page (last resort)

Only use this when the thing being prototyped genuinely has no existing page to live inside — e.g. an entirely new top-level surface, or a flow that can't be embedded anywhere sensible.

Create a **throwaway route** following whatever routing convention the project already uses — don't invent a new top-level structure. Name it so it's obviously a prototype (e.g. include the word `prototype` in the path or filename). Same `?variant=` pattern.

Before committing to sub-shape B, sanity-check: is there really no existing page this could be embedded in? An empty route hides design problems that a populated one would expose.

In both sub-shapes the floating bottom bar is identical.

## Process

### 1. State the question and pick N

Default to **3 variants**. More than 5 stops being radically different and starts being noise — cap there.

Write down the plan in one line, in the prototype's location or a top-of-file comment:

> "Three variants of the settings page, switchable via `?variant=`, on the existing `/settings` route."

This works whether the user is here to push back or not.

### 2. Generate radically different variants

Draft each variant. Hold each one to:

- The page's purpose and the data it has access to.
- The project's component library / styling system (TailwindCSS, shadcn, MUI, plain CSS, whatever).
- A clear exported component name, e.g. `VariantA`, `VariantB`, `VariantC`.

Variants must be **structurally different** — different layout, different information hierarchy, different primary affordance, not just different colours. Three slightly-tweaked card grids isn't a UI prototype, it's wallpaper. If two drafts come out too similar, redo one with explicit "do not use a card grid" guidance.

### 3. Wire them together

Create a single switcher component on the route:

```tsx
// pseudo-code — adapt to the project's framework
const variant = searchParams.get('variant') ?? 'A';
return (
  <>
    {variant === 'A' && <VariantA {...data} />}
    {variant === 'B' && <VariantB {...data} />}
    {variant === 'C' && <VariantC {...data} />}
    <PrototypeSwitcher variants={['A','B','C']} current={variant} />
  </>
);
```

For sub-shape A (existing page): keep all the existing data fetching above the switcher; only the rendered subtree changes per variant.

For sub-shape B (new page): the throwaway route under `/prototype/<name>` mounts the same switcher.

### 4. Build the floating switcher

A small fixed-position bar at the bottom-centre of the screen with three pieces:

- **Left arrow** — cycles to the previous variant (wraps around).
- **Variant label** — shows the current variant key and, if the variant exports a name, that name too. e.g. `B — Sidebar layout`.
- **Right arrow** — cycles forward (wraps around).

Behaviour:

- Clicking an arrow updates the URL search param (use the framework's router — `router.replace` on Next, `navigate` on React Router, etc) so the variant is shareable and reload-stable.
- Keyboard: `←` and `→` arrow keys also cycle. Don't intercept arrow keys when an `<input>`, `<textarea>`, or `[contenteditable]` is focused.
- Visually distinct from the page (e.g. high-contrast pill, subtle shadow) so it's obviously not part of the design being evaluated.
- Hidden in production builds — gate on `process.env.NODE_ENV !== 'production'` or an equivalent check, so a stray prototype merge can't ship the bar to users.

Put the switcher in a single shared component so both sub-shapes can reuse it. Locate it wherever shared UI lives in the project.

### 5. Hand it over

Surface the URL (and the `?variant=` keys). The user will flip through whenever they get to it. The interesting feedback is usually **"I want the header from B with the sidebar from C"** — that's the actual design they want.

### 6. Capture the answer and clean up

Once a variant has won, route the answer into the spec-kit artifacts per the **Artifact Map** below: record **which variant won and why** in `research.md`, with the losing variants as rejected alternatives; if the winner crystallises a structural requirement ("the dashboard must surface pending approvals above the fold"), write it into `spec.md` as an `FR-###` or Acceptance Scenario. A `NOTES.md` next to the prototype is only the AFK stopgap (running unattended, spec-only feature, or the user hasn't responded yet) — fold it into the artifacts before deleting the prototype. Then:

- **Sub-shape A** — delete the losing variants and the switcher; fold the winner into the existing page.
- **Sub-shape B** — promote the winning variant to a real route, delete the throwaway route and the switcher.

Don't leave variant components or the switcher lying around. They rot fast and confuse the next reader.

## Anti-patterns

- **Variants that differ only in colour or copy.** That's a tweak, not a prototype. Real variants disagree about structure.
- **Sharing too much code between variants.** A shared `<Header>` is fine; a shared `<Layout>` defeats the point. Each variant should be free to throw out the layout.
- **Wiring variants to real mutations.** Read-only prototypes are fine. If a variant needs to mutate, point it at a stub — the question is "what should this look like", not "does the backend work".
- **Promoting the prototype directly to production.** The variant code was written under prototype constraints (no tests, minimal error handling). Rewrite it properly when you fold it in.

---

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
