---
description: "Codebase-wide architecture review for spec-kit projects — finds deepening opportunities (shallow modules into deep ones), informed by the constitution's principles and the domain language in Key Entities across specs/*/spec.md, and renders candidates as a visual HTML report. Resolved terms and load-bearing rejections are written back to the owning feature's spec.md / research.md or surfaced as constitution amendments."
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Glossary

Use these terms exactly in every suggestion. Consistent language is the point — don't drift into "component," "service," "API," or "boundary." Full definitions in the **Language** section below.

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see the **Language** section for the full list):

- **Deletion test**: imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical seam. Two adapters = real seam.**

This skill is _informed_ by the project's spec-kit corpus. The constitution and the Key Entities across `specs/*/spec.md` give names to good seams; the constitution's principles and the decisions in `specs/*/research.md` are decisions the skill must not re-litigate.

## Process

### 1. Explore

The review is **codebase-wide**, not scoped to the active feature. Read the spec-kit corpus first:

- `.specify/memory/constitution.md` — **always**. The principles are the codebase-level decisions not to re-litigate, and a vocabulary source.
- The **Key Entities** sections across all `specs/*/spec.md` — the union is the project's domain vocabulary.
- Prior technical decisions: every `specs/*/research.md` (Decision / Rationale / Rejected alternatives entries) and the **Constitution Check** sections of `specs/*/plan.md`.

Then use the Agent tool with `subagent_type=Explore` to walk the codebase. Don't follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates as an HTML report

Write a self-contained HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user — `xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows — and tell them the absolute path.

The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals — use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.

For each candidate, rendered as a card:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage, and how tests would improve
- **Before / After diagram** — side-by-side, custom-drawn, illustrating the shallowness and the deepening
- **Recommendation strength** — one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

**Use the constitution's and Key Entities' vocabulary for the domain, and the Language section's vocabulary for the architecture.** If a spec defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."

**Prior-decision conflicts**: if a candidate contradicts a constitution principle, mark it with a red callout citing the principle number — it is near-disqualified unless an amendment is proposed. If it contradicts a decision in a feature's `research.md`, only surface it when the friction is real enough to warrant reopening that decision; mark it clearly in the card (e.g. an amber callout: _"contradicts `specs/012-foo/research.md` — but worth reopening because…"_). Don't list every theoretical refactor a recorded decision forbids.

See the **HTML Report Format** section below for the scaffold and styling rules.

Do NOT propose interfaces yet. After the file is written, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallize — routed per the **Artifact Map** at the end of this command:

- **Naming a deepened module after a concept not yet in any spec's Key Entities?** Add the term to the **owning feature's** `spec.md` Key Entities — the feature whose spec covers the modules under discussion; ask if it's ambiguous. Same discipline as `/speckit-grill`. Never create a `CONTEXT.md`.
- **Sharpening a fuzzy term during the conversation?** Update that Key Entities definition right there.
- **The term is genuinely codebase-wide, with no owning feature?** If it's principle-level, propose a constitution amendment per its Governance procedure; otherwise note it in conversation and defer until a feature owns the area. Don't invent a `.specify/memory/glossary.md`.
- **User rejects the candidate with a load-bearing reason?** Offer to record it, framed as: _"Want me to record this so future architecture reviews don't re-suggest it?"_ Route it as a Decision entry (with rationale and the rejected refactor as the alternative) in the **owning feature's** `research.md` — created lazily, only if that feature has a `plan.md`. If the rejection expresses a codebase-wide principle, propose a constitution amendment instead. If neither applies, keep it in the HTML report and tell the user explicitly that it has no durable home yet. Only offer when the reason would actually be needed by a future explorer — skip ephemeral reasons ("not worth it right now") and self-evident ones.
- **User accepts a candidate?** Offer to kick off **`/speckit-specify`** so the refactor becomes a feature of its own — its terms then land in that feature's Key Entities and its design decisions in its `research.md`/`plan.md`, and the normal `/speckit-plan` → `/speckit-tasks` pipeline applies.
- **Want to explore alternative interfaces for the deepened module?** See the **Interface Design** section below.

## Guardrails

- **Never create `CONTEXT.md` or ADR files.** Everything lands in spec-kit artifacts per the **Artifact Map** below.
- **The constitution is authoritative.** Never record a decision that conflicts with it without a proposed amendment.
- **Preserve each artifact's template headings and structure** (see `.specify/templates/`). Add to sections; don't restructure them.
- **This skill proposes; it doesn't implement.** The refactor itself goes through `/speckit-specify` → `/speckit-plan` → `/speckit-tasks`, not through this conversation.

---

# Language

Shared vocabulary for every suggestion this skill makes. Use these terms exactly — don't substitute "component," "service," "API," or "boundary." Consistent language is the whole point.

## Terms

**Module**
Anything with an interface and an implementation. Deliberately scale-agnostic — applies equally to a function, class, package, or tier-spanning slice.
_Avoid_: unit, component, service.

**Interface**
Everything a caller must know to use the module correctly. Includes the type signature, but also invariants, ordering constraints, error modes, required configuration, and performance characteristics.
_Avoid_: API, signature (too narrow — those refer only to the type-level surface).

**Implementation**
What's inside a module — its body of code. Distinct from **Adapter**: a thing can be a small adapter with a large implementation (a Postgres repo) or a large adapter with a small implementation (an in-memory fake). Reach for "adapter" when the seam is the topic; "implementation" otherwise.

**Depth**
Leverage at the interface — the amount of behaviour a caller (or test) can exercise per unit of interface they have to learn. A module is **deep** when a large amount of behaviour sits behind a small interface. A module is **shallow** when the interface is nearly as complex as the implementation.

**Seam** _(from Michael Feathers)_
A place where you can alter behaviour without editing in that place. The *location* at which a module's interface lives. Choosing where to put the seam is its own design decision, distinct from what goes behind it.
_Avoid_: boundary (overloaded with DDD's bounded context).

**Adapter**
A concrete thing that satisfies an interface at a seam. Describes *role* (what slot it fills), not substance (what's inside).

**Leverage**
What callers get from depth. More capability per unit of interface they have to learn. One implementation pays back across N call sites and M tests.

**Locality**
What maintainers get from depth. Change, bugs, knowledge, and verification concentrate at one place rather than spreading across callers. Fix once, fixed everywhere.

## Principles

- **Depth is a property of the interface, not the implementation.** A deep module can be internally composed of small, mockable, swappable parts — they just aren't part of the interface. A module can have **internal seams** (private to its implementation, used by its own tests) as well as the **external seam** at its interface.
- **The deletion test.** Imagine deleting the module. If complexity vanishes, the module wasn't hiding anything (it was a pass-through). If complexity reappears across N callers, the module was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam. If you want to test *past* the interface, the module is probably the wrong shape.
- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a seam unless something actually varies across it.

## Relationships

- A **Module** has exactly one **Interface** (the surface it presents to callers and tests).
- **Depth** is a property of a **Module**, measured against its **Interface**.
- A **Seam** is where a **Module**'s **Interface** lives.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.
- **Depth** produces **Leverage** for callers and **Locality** for maintainers.

## Rejected framings

- **Depth as ratio of implementation-lines to interface-lines** (Ousterhout): rewards padding the implementation. We use depth-as-leverage instead.
- **"Interface" as the TypeScript `interface` keyword or a class's public methods**: too narrow — interface here includes every fact a caller must know.
- **"Boundary"**: overloaded with DDD's bounded context. Say **seam** or **interface**.

---

# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Assumes the vocabulary in the **Language** section — **module**, **interface**, **seam**, **adapter**.

## Dependency categories

When assessing a candidate for deepening, classify its dependencies. The category determines how the deepened module is tested across its seam.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable — merge the modules and test through the new interface directly. No adapter needed.

### 2. Local-substitutable

Dependencies that have local test stand-ins (PGLite for Postgres, in-memory filesystem). Deepenable if the stand-in exists. The deepened module is tested with the stand-in running in the test suite. The seam is internal; no port at the module's external interface.

### 3. Remote but owned (Ports & Adapters)

Your own services across a network boundary (microservices, internal APIs). Define a **port** (interface) at the seam. The deep module owns the logic; the transport is injected as an **adapter**. Tests use an in-memory adapter. Production uses an HTTP/gRPC/queue adapter.

Recommendation shape: *"Define a port at the seam, implement an HTTP adapter for production and an in-memory adapter for testing, so the logic sits in one deep module even though it's deployed across a network."*

### 4. True external (Mock)

Third-party services (Stripe, Twilio, etc.) you don't control. The deepened module takes the external dependency as an injected port; tests provide a mock adapter.

## Seam discipline

- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a port unless at least two adapters are justified (typically production + test). A single-adapter seam is just indirection.
- **Internal seams vs external seams.** A deep module can have internal seams (private to its implementation, used by its own tests) as well as the external seam at its interface. Don't expose internal seams through the interface just because tests use them.

## Testing strategy: replace, don't layer

- Old unit tests on shallow modules become waste once tests at the deepened module's interface exist — delete them.
- Write new tests at the deepened module's interface. The **interface is the test surface**.
- Tests assert on observable outcomes through the interface, not internal state.
- Tests should survive internal refactors — they describe behaviour, not implementation. If a test has to change when the implementation changes, it's testing past the interface.

---

# Interface Design

When the user wants to explore alternative interfaces for a chosen deepening candidate, use this parallel sub-agent pattern. Based on "Design It Twice" (Ousterhout) — your first idea is unlikely to be the best.

Uses the vocabulary in the **Language** section — **module**, **interface**, **seam**, **adapter**, **leverage**.

## Process

### 1. Frame the problem space

Before spawning sub-agents, write a user-facing explanation of the problem space for the chosen candidate:

- The constraints any new interface would need to satisfy
- The dependencies it would rely on, and which category they fall into (see the **Deepening** section above)
- A rough illustrative code sketch to ground the constraints — not a proposal, just a way to make the constraints concrete

Show this to the user, then immediately proceed to Step 2. The user reads and thinks while the sub-agents work in parallel.

### 2. Spawn sub-agents

Spawn 3+ sub-agents in parallel using the Agent tool. Each must produce a **radically different** interface for the deepened module.

Prompt each sub-agent with a separate technical brief (file paths, coupling details, dependency category from the **Deepening** section, what sits behind the seam). The brief is independent of the user-facing problem-space explanation in Step 1. Give each agent a different design constraint:

- Agent 1: "Minimize the interface — aim for 1–3 entry points max. Maximise leverage per entry point."
- Agent 2: "Maximise flexibility — support many use cases and extension."
- Agent 3: "Optimise for the most common caller — make the default case trivial."
- Agent 4 (if applicable): "Design around ports & adapters for cross-seam dependencies."

Include both the **Language** section's vocabulary and the owning feature's **Key Entities** vocabulary (from its `spec.md`, plus the constitution's language) in the brief so each sub-agent names things consistently with the architecture language and the project's domain language.

Each sub-agent outputs:

1. Interface (types, methods, params — plus invariants, ordering, error modes)
2. Usage example showing how callers use it
3. What the implementation hides behind the seam
4. Dependency strategy and adapters (see the **Deepening** section)
5. Trade-offs — where leverage is high, where it's thin

### 3. Present and compare

Present designs sequentially so the user can absorb each one, then compare them in prose. Contrast by **depth** (leverage at the interface), **locality** (where change concentrates), and **seam placement**.

After comparing, give your own recommendation: which design you think is strongest and why. If elements from different designs would combine well, propose a hybrid. Be opinionated — the user wants a strong read, not a menu.

---

# HTML Report Format (condensed)

One self-contained HTML file in the OS temp directory. Tailwind and Mermaid from CDNs; those are the only scripts — the report is otherwise static.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review — {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

**Header**: repo name, date, compact legend (solid box = module, dashed line = seam, red arrow = leakage, thick dark box = deep module). No introduction paragraph.

**Candidate card** — one `<article>` each; the diagrams carry the weight, prose is sparse:

- **Title** — short, names the deepening (e.g. "Collapse the Order intake pipeline").
- **Badge row** — recommendation strength (`Strong` = emerald, `Worth exploring` = amber, `Speculative` = slate) + dependency-category tag (`in-process`, `local-substitutable`, `ports & adapters`, `mock`).
- **Files** — monospaced list, `font-mono text-sm`.
- **Before / After diagram** — the centrepiece, two columns side by side. Mix patterns: Mermaid flowcharts for call/dependency mess, hand-built boxes-and-arrows, layer cross-sections, mass diagrams (interface rectangle vs implementation rectangle), call-graph collapse. Keep diagrams ~320px tall; module labels `text-xs uppercase tracking-wider`.
- **Problem** — one sentence. **Solution** — one sentence.
- **Wins** — bullets, ≤6 words each, named in glossary terms (*"locality: bugs concentrate in one module"*, *"leverage: one interface, N call sites"*). Never "easier to maintain" or "cleaner code".
- **Prior-decision callout** (if applicable) — one line: red-tinted box for a constitution-principle conflict (cite the principle number), amber-tinted box for a conflict with a `specs/*/research.md` decision.

If a diagram needs a paragraph to be understood, redraw the diagram.

**Style**: editorial, not corporate-dashboard. Generous whitespace; colour sparingly — one accent (emerald or indigo) plus red for leakage, amber for warnings.

**Top recommendation**: one larger card — candidate name, one sentence on why, anchor link to its card.

## Tone — vocabulary discipline

**Use exactly:** module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.

**Never substitute:** component, service, unit (for module) · API, signature (for interface) · boundary (for seam) · layer, wrapper (for module, when you mean module).

No hedging, no throat-clearing, no "it's worth noting that…". If a sentence could be a bullet, make it a bullet. If a bullet could be cut, cut it. If a term isn't in the **Language** section, reach for one that is before inventing a new one.

---

# Artifact Map — where architecture-review resolutions go

This review is codebase-wide, so unlike feature-scoped skills there is no single active feature to
write to. Route each resolution to the artifact below. Do not invent new file types (no
`CONTEXT.md`, no `docs/adr/`, no `.specify/memory/glossary.md`). For the exact section structure of
each file, defer to the canonical templates in `.specify/templates/`.

**The owning feature** of a resolution is the feature in `specs/` whose spec covers the modules
under discussion. If it's ambiguous which feature owns an area, ask the user — don't guess.

| What got resolved | Where it goes | Notes |
|---|---|---|
| A new term for a deepened module / concept | Owning feature's `spec.md` → **Key Entities** | Bold term name + a 1–2 sentence definition of what it *is*. Pick one canonical word; note the rejected aliases. Same discipline as `/speckit-grill`. |
| A sharpened fuzzy term | Owning feature's `spec.md` → **Key Entities**, in place | Update the existing definition; don't add a duplicate. |
| A genuinely codebase-wide term or naming rule (no owning feature) | Propose a **constitution amendment** if principle-level; otherwise defer | Surface the amendment per the constitution's Governance procedure (motivation, principles affected, version bump). If it's not principle-level, note it in conversation and wait until a feature owns the area. |
| A load-bearing **rejection** of a candidate | Owning feature's `research.md` — a Decision entry | Rationale + the rejected refactor as the alternative: "we keep X shallow because Z". **Create lazily** — only if that feature has a `plan.md`. This replaces the ADR an architecture review would otherwise write. |
| A rejection that expresses a codebase-wide principle | Propose a **constitution amendment** | E.g. "transport adapters stay thin by design". Never edit the constitution silently. |
| A rejection with no owning feature and no principle | Nowhere durable — say so | Keep it in the HTML report and tell the user explicitly it has no durable home yet. |
| An **accepted** candidate | Offer `/speckit-specify` | The refactor becomes a feature of its own; its terms and design decisions then land in that feature's `spec.md` / `research.md` / `plan.md` through the normal pipeline. This skill never edits code. |
| A candidate that conflicts with a constitution principle | Red callout in the report, citing the principle number | Near-disqualified unless the user wants to propose an amendment. |
| A candidate that conflicts with a `specs/*/research.md` decision | Amber callout in the report | Only surface it when the friction is real enough to warrant reopening the decision. |

## Keep `spec.md` clean

`spec.md` describes **WHAT** the product must do, not **HOW**. A Key Entities entry defines what a
concept *is* — the deepened module's interface shape, seam placement, and adapter strategy are
implementation decisions that belong in the owning feature's `research.md`/`plan.md` (or in the
refactor-feature created via `/speckit-specify`).
