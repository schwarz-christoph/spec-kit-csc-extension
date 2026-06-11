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
