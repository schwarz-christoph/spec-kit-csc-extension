---
name: speckit-tdd
description: Red-green-refactor TDD where the behaviors under test come from the active Spec Kit feature — Acceptance Scenarios and FR-### in spec.md drive the test list, test names cite the FR/SC they verify, and completed cycles tick the matching tasks in tasks.md. Use when the user wants to build features or fix bugs test-first inside a spec-kit feature, mentions "red-green-refactor", wants integration tests, or asks for test-first development. Triggers on "TDD this task", "implement this test-first", "red-green-refactor".
---

# Test-Driven Development

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification - "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Locate the active feature

Run, from the repo root:

```
.specify/scripts/bash/check-prerequisites.sh --json --paths-only
```

(Fall back to `.specify/feature.json` if the script is unavailable.) Then read:

- `.specify/memory/constitution.md` — **always**. Principles may constrain testing and design choices.
- `${FEATURE_DIR}/spec.md` — the source of the behaviors under test.
- `${FEATURE_DIR}/plan.md`, `research.md`, `data-model.md`, `tasks.md` — **when they exist**.

TDD is most useful once `/speckit-tasks` has produced a `tasks.md` (each task scopes a session), but a planned feature without tasks is valid too — derive the behavior list straight from the spec.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" - treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes - they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

## Workflow

### 1. Planning

When exploring the codebase, use the ubiquitous language from `spec.md` **Key Entities** and the constitution so that test names and interface vocabulary match the project's language, and respect the decisions recorded in `plan.md` and `research.md` for the area you're touching — don't re-litigate a recorded choice. If you must deviate, surface it to the user and record the new decision in `research.md`.

Before writing any code:

- [ ] Confirm with user what interface changes are needed
- [ ] Derive the candidate behavior list from `spec.md` **Acceptance Scenarios** (each Given/When/Then maps to roughly one integration test) and **Functional Requirements** (`FR-###`); `SC-###` success criteria supply measurable assertions
- [ ] Confirm prioritization with the user (you can't test everything)
- [ ] Tag each planned test with the FR/SC it verifies — in the test name or a comment, e.g. `user can checkout with valid cart (FR-012)`
- [ ] Identify opportunities for [deep modules](deep-modules.md) (small interface, deep implementation)
- [ ] Design interfaces for [testability](interface-design.md)
- [ ] List the behaviors to test (not implementation steps)
- [ ] Get user approval on the plan

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Confirm with the user exactly which behaviors matter most. Focus testing effort on critical paths and complex logic, not every possible edge case.

### 2. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

```
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
```

This is your tracer bullet - proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules:

- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior

### 4. Refactor

After all tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

## tasks.md integration

When `tasks.md` exists:

- **Scope each session to one task.** Its cycles cover that task's behaviors; don't sprawl.
- **Tick the task** — mark it `[X]` in `tasks.md` — only when its cycles are GREEN *and* refactored.
- **Never generate `tasks.md`** — that's `/speckit-tasks`.

Writeback as you go (see [ARTIFACT-MAP.md](./ARTIFACT-MAP.md)):

- A behavior discovered mid-cycle that the spec misses → add it to `spec.md` as a new `FR-###` or Edge Case (preserve the template structure; don't restructure).
- A non-obvious interface decision (the deep-module shape you chose, a seam placement) → record it with rationale in `research.md`.

## Checklist Per Cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Test cites the FR/SC it verifies
[ ] Code is minimal for this test
[ ] No speculative features added
```
