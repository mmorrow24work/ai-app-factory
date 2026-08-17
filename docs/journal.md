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
| Issues with recorded metrics | 17 |
| Successful runs | 14 |
| Mean time per issue | 6m 09s |
| Mean turns per issue | 102 |
| Mean output tokens per issue | 32,858 |
| Mean estimated cost per issue | $0.5051 |
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

## 2026-08-17 — Issue #9: M3: Architecture diagram + GitHub CLI command reference page

- **Result:** success
- **PR:** #17
- **Milestone:** M3: Dashboard shell
- **Model:** claude-sonnet-5
- **Execution Duration:** 375 seconds
- **Turns:** 68
- **Input Tokens:** 216
- **Output Tokens:** 33570
- **Estimated Cost:** $0.5042 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31992320697

## 2026-08-17 — Issue #3: M2: factory-new.sh and factory-secrets.sh CLI

- **Result:** success
- **PR:** #18
- **Milestone:** M2: factory CLI
- **Model:** claude-sonnet-5
- **Execution Duration:** 547 seconds
- **Turns:** 137
- **Input Tokens:** 20381
- **Output Tokens:** 51769
- **Estimated Cost:** $0.8377 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31993587814

## 2026-08-17 — Issue #5: M4: Token-burn chart, session status, and commit heatmap widgets

- **Result:** success
- **PR:** #19
- **Milestone:** M4: Usage widgets
- **Model:** claude-sonnet-5
- **Execution Duration:** 523 seconds
- **Turns:** 135
- **Input Tokens:** 15084
- **Output Tokens:** 47838
- **Estimated Cost:** $0.7628 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31998258696

## 2026-08-17 — Issue #6: M5: Intake page and design-doc drafting workflow

- **Result:** success
- **PR:** #22
- **Milestone:** M5: Intake to design doc
- **Model:** claude-sonnet-5
- **Execution Duration:** 665 seconds
- **Turns:** 180
- **Input Tokens:** 544
- **Output Tokens:** 56481
- **Estimated Cost:** $0.8488 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/32004954282

## 2026-08-17 — Issue #7: M6: Generate milestones and labeled issues from an approved design doc

- **Result:** success
- **PR:** —
- **Milestone:** M6: Approve to milestones/issues
- **Model:** claude-sonnet-5
- **Execution Duration:** 496 seconds
- **Turns:** 105
- **Input Tokens:** 12555
- **Output Tokens:** 41617
- **Estimated Cost:** $0.6619 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/32007259219

## 2026-08-17 — Issue #25: generate-issues.yml's factory-new.sh command omits required --set placeholders for all three types

- **Result:** success
- **PR:** —
- **Milestone:** M7: Polish
- **Model:** claude-sonnet-5
- **Execution Duration:** 257 seconds
- **Turns:** 87
- **Input Tokens:** 266
- **Output Tokens:** 19997
- **Estimated Cost:** $0.3008 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/32011776162

## 2026-08-17 — Issue #29: Adopt uk-wealth-tracker's design system: Appearance, Colour palette, Typography, buttons

- **Result:** success
- **PR:** —
- **Milestone:** M3: Dashboard shell
- **Model:** claude-sonnet-5
- **Execution Duration:** 476 seconds
- **Turns:** 177
- **Input Tokens:** 3884
- **Output Tokens:** 46266
- **Estimated Cost:** $0.7056 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/32056727057

## 2026-08-17 — Issue #29: Adopt uk-wealth-tracker's design system: Appearance, Colour palette, Typography, buttons

- **Result:** success
- **PR:** #33
- **Milestone:** M3: Dashboard shell
- **Model:** claude-sonnet-5
- **Execution Duration:** 600 seconds
- **Turns:** 175
- **Input Tokens:** 536
- **Output Tokens:** 54733
- **Estimated Cost:** $0.8226 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/32058696824

## 2026-08-17 — Issue #32: /how-it-works is stale: M2/M5/M6 are marked planned but shipped

- **Result:** success
- **PR:** #34
- **Milestone:** M3: Dashboard shell
- **Model:** claude-sonnet-5
- **Execution Duration:** 401 seconds
- **Turns:** 94
- **Input Tokens:** 14265
- **Output Tokens:** 32988
- **Estimated Cost:** $0.5376 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/32060612024
