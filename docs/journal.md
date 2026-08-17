# Build Journal

Per-issue record of the unattended (Lane B) build of `ai-app-factory`. One entry per Claude run, appended automatically by `.github/workflows/claude.yml` via `.github/scripts/journal-entry.sh`.

## How this file is written

**Entries are appended by the workflow, not by Claude inside its PR.** This is deliberate: in the `uk-wealth-tracker` build, having Claude append a journal entry within each PR meant every open PR touched the same file, so almost every one went `CONFLICTING` the moment any other PR merged — leaving green, auto-merge-enabled PRs sitting unmerged indefinitely. Patching from the workflow after the run sidesteps that entirely: Claude's branches never touch `docs/journal.md`.

## What "Estimated Cost" means

This pipeline authenticates via a **Claude subscription** (OAuth), not pay-per-token API billing. The cost figure is notional — what the run *would* cost at standard list rates — useful as a consistent yardstick for comparing runs, not an actual charge.

---

## Build velocity

Recomputed by `.github/scripts/journal-entry.sh` on every run.

<!-- VELOCITY_START -->
| Metric | Value |
|---|---|
| Issues with recorded metrics | 8 |
| Successful runs | 5 |
| Mean time per issue | 4m 02s |
| Mean turns per issue | 72 |
| Mean output tokens per issue | 21,665 |
| Mean estimated cost per issue | $0.3256 |
<!-- VELOCITY_END -->

---

## Entries

<!-- ENTRIES_START -->
<!-- New entries are appended below this marker, newest last. -->

## 2026-08-16 — Issue #1: M1: Scaffold custom-script template

- **Result:** failure
- **PR:** —
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 24 seconds
- **Turns:** 1
- **Input Tokens:** 0
- **Output Tokens:** 0
- **Estimated Cost:** $0.0000 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31973992916

## 2026-08-16 — Issue #1: M1: Scaffold custom-script template

- **Result:** failure
- **PR:** —
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 17 seconds
- **Turns:** 1
- **Input Tokens:** 0
- **Output Tokens:** 0
- **Estimated Cost:** $0.0000 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31974620081

## 2026-08-17 — Issue #1: M1: Scaffold custom-script template

- **Result:** failure
- **PR:** —
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 17 seconds
- **Turns:** 1
- **Input Tokens:** 0
- **Output Tokens:** 0
- **Estimated Cost:** $0.0000 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31988042935

## 2026-08-17 — Issue #1: M1: Scaffold custom-script template

- **Result:** success
- **PR:** #11
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 276 seconds
- **Turns:** 76
- **Input Tokens:** 226
- **Output Tokens:** 26492
- **Estimated Cost:** $0.3981 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31988813715

## 2026-08-17 — Issue #2: M1: Scaffold nautobot-app and netbox-plugin templates

- **Result:** success
- **PR:** —
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 536 seconds
- **Turns:** 188
- **Input Tokens:** 574
- **Output Tokens:** 48891
- **Estimated Cost:** $0.7351 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31990445787

## 2026-08-17 — Issue #4: M3: SvelteKit dashboard shell with grouped sidebar

- **Result:** success
- **PR:** —
- **Milestone:** M3: Dashboard shell
- **Model:** claude-sonnet-5
- **Execution Duration:** 622 seconds
- **Turns:** 185
- **Input Tokens:** 550
- **Output Tokens:** 58236
- **Estimated Cost:** $0.8752 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31990447244

## 2026-08-17 — Issue #12: M1: Bake Support & Handoff policy into every template's README

- **Result:** success
- **PR:** —
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 165 seconds
- **Turns:** 38
- **Input Tokens:** 108
- **Output Tokens:** 15614
- **Estimated Cost:** $0.2345 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31991555175

## 2026-08-17 — Issue #10: M3: Claude status widget (status.claude.com) in site header/sidebar

- **Result:** success
- **PR:** —
- **Milestone:** M3: Dashboard shell
- **Model:** claude-sonnet-5
- **Execution Duration:** 286 seconds
- **Turns:** 88
- **Input Tokens:** 268
- **Output Tokens:** 24088
- **Estimated Cost:** $0.3621 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31991556852
