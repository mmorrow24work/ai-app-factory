# custom-script template

The lightest-weight of the three `ai-app-factory` project types: a single script plus tests, with no application framework. Use this when the project is a standalone script or small CLI tool rather than a Nautobot app, NetBox plugin, or web service.

## What's in here

```
CLAUDE.md.tmpl                       Becomes the new repo's CLAUDE.md
README.md.tmpl                       Becomes the new repo's README.md
theme.css, theme-toggle.js           Framework-free light/dark theme — copied as-is, no build step; CLAUDE.md.tmpl instructs the pipeline to link them into any HTML page it creates
.env.example                         Copied as-is; consumer fills in real values locally
.github/workflows/claude.yml         Lane B driver — copied with placeholders filled in
.github/workflows/seed-milestones.yml  Turns the approved design doc into milestones/issues — human-triggered once, see ADR 0001 in ai-app-factory
.github/workflows/review-decision.yml   Executes the requester's approve/reject decision on a claude.yml PR — see ai-app-factory DESIGN.md's "PR review & merge"
.github/scripts/journal-entry.sh     Metrics-append script — copied as-is, already generic
docs/journal.md                      Empty journal skeleton — copied as-is
```

`README.md` (this file) and `.github/scripts/journal-entry.sh` are **not** templated — they describe/support the template itself and are either browsed directly on GitHub or copied verbatim.

## Placeholders a consumer needs to fill in

`factory-new.sh` (M2) will do this substitution automatically. Filling in by hand today means replacing these tokens across `CLAUDE.md.tmpl`, `README.md.tmpl`, `.github/workflows/claude.yml`, `.env.example`, and the shared `templates/_shared/SUPPORT_HANDOFF.md.tmpl` that `README.md.tmpl` pulls in via `{{> _shared/SUPPORT_HANDOFF.md.tmpl}}`:

| Placeholder | Meaning |
|---|---|
| `{{PROJECT_NAME}}` | The new repo's name |
| `{{PROJECT_DESCRIPTION}}` | One-line description of what the script does |
| `{{ENTRY_POINT}}` | Path to the main script (e.g. `run.py`, `main.sh`) |
| `{{TEST_COMMAND}}` | Command that runs the test suite (default: `pytest`) |
| `{{ADDITIONAL_CONVENTIONS}}` | Any project-specific conventions beyond the shared skeleton |
| `{{BASE_BRANCH}}` | Default branch the Lane B driver targets (usually `main`) |
| `{{OWNER_GITHUB_HANDLE}}` | GitHub username of the human owner mentioned in the Support & Handoff section (defaults to `mmorrow24work` if unset) |

After substitution, `CLAUDE.md.tmpl` → `CLAUDE.md` and `README.md.tmpl` → `README.md` at the root of the new repo. The new repo also needs `CLAUDE_CODE_OAUTH_TOKEN` and (optionally) `GH_PAT` set as GitHub Actions secrets, and labels applied from `templates/_shared/labels.json`, before the `claude-go` pipeline can run — both are `scripts/factory-secrets.sh` / `scripts/factory-new.sh` responsibilities (M2), not manual steps.
