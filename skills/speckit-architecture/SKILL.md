---
name: speckit-architecture
description: Codebase-wide architecture review for spec-kit projects — finds deepening opportunities (shallow modules into deep ones), informed by the constitution's principles and the domain language in Key Entities across specs/*/spec.md, and renders candidates as a visual HTML report. Resolved terms and load-bearing rejections are written back to the owning feature's spec.md / research.md or surfaced as constitution amendments — never to CONTEXT.md or ADRs. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make the codebase more testable and AI-navigable. Triggers on "improve the architecture", "find deepening opportunities", "architecture review".
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Glossary

Use these terms exactly in every suggestion. Consistent language is the point — don't drift into "component," "service," "API," or "boundary." Full definitions in [LANGUAGE.md](LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see [LANGUAGE.md](LANGUAGE.md) for the full list):

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

For each candidate, the same template as before, but rendered as a card:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage, and how tests would improve
- **Before / After diagram** — side-by-side, custom-drawn, illustrating the shallowness and the deepening
- **Recommendation strength** — one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

**Use the constitution's and Key Entities' vocabulary for the domain, and [LANGUAGE.md](LANGUAGE.md) vocabulary for the architecture.** If a spec defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."

**Prior-decision conflicts**: if a candidate contradicts a constitution principle, mark it with a red callout citing the principle number — it is near-disqualified unless an amendment is proposed. If it contradicts a decision in a feature's `research.md`, only surface it when the friction is real enough to warrant reopening that decision; mark it clearly in the card (e.g. an amber callout: _"contradicts `specs/012-foo/research.md` — but worth reopening because…"_). Don't list every theoretical refactor a recorded decision forbids.

See [HTML-REPORT.md](HTML-REPORT.md) for the full HTML scaffold, diagram patterns, and styling guidance.

Do NOT propose interfaces yet. After the file is written, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallize — routed per [ARTIFACT-MAP.md](./ARTIFACT-MAP.md):

- **Naming a deepened module after a concept not yet in any spec's Key Entities?** Add the term to the **owning feature's** `spec.md` Key Entities — the feature whose spec covers the modules under discussion; ask if it's ambiguous. Same discipline as `/speckit-grill`. Never create a `CONTEXT.md`.
- **Sharpening a fuzzy term during the conversation?** Update that Key Entities definition right there.
- **The term is genuinely codebase-wide, with no owning feature?** If it's principle-level, propose a constitution amendment per its Governance procedure; otherwise note it in conversation and defer until a feature owns the area. Don't invent a `.specify/memory/glossary.md`.
- **User rejects the candidate with a load-bearing reason?** Offer to record it, framed as: _"Want me to record this so future architecture reviews don't re-suggest it?"_ Route it as a Decision entry (with rationale and the rejected refactor as the alternative) in the **owning feature's** `research.md` — created lazily, only if that feature has a `plan.md`. If the rejection expresses a codebase-wide principle, propose a constitution amendment instead. If neither applies, keep it in the HTML report and tell the user explicitly that it has no durable home yet. Only offer when the reason would actually be needed by a future explorer — skip ephemeral reasons ("not worth it right now") and self-evident ones.
- **User accepts a candidate?** Offer to kick off **`/speckit-specify`** so the refactor becomes a feature of its own — its terms then land in that feature's Key Entities and its design decisions in its `research.md`/`plan.md`, and the normal `/speckit-plan` → `/speckit-tasks` pipeline applies.
- **Want to explore alternative interfaces for the deepened module?** See [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).

## Guardrails

- **Never create `CONTEXT.md` or ADR files.** Everything lands in spec-kit artifacts per [ARTIFACT-MAP.md](./ARTIFACT-MAP.md).
- **The constitution is authoritative.** Never record a decision that conflicts with it without a proposed amendment.
- **Preserve each artifact's template headings and structure** (see `.specify/templates/`). Add to sections; don't restructure them.
- **This skill proposes; it doesn't implement.** The refactor itself goes through `/speckit-specify` → `/speckit-plan` → `/speckit-tasks`, not through this conversation.
