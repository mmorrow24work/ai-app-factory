# nautobot-app template

Scaffold for a Nautobot App project type: a Django-based Nautobot plugin managed with Poetry, developed against a real local Nautobot install. Extracted from `mmorrow24work/nautobot-app-pytest-compliance-rule-engine`, a working example of this shape.

## What's in here

```
CLAUDE.md.tmpl                     Becomes the new repo's CLAUDE.md
README.md.tmpl                     Becomes the new repo's README.md
pyproject.toml.tmpl                Becomes the new repo's pyproject.toml
.pre-commit-config.yaml            Copied as-is — black/ruff pre-commit hooks
.env.example                       Copied as-is; consumer fills in real values locally
.github/workflows/claude.yml       Lane B driver — copied with placeholders filled in; installs Poetry and a real Nautobot into the runner so API decisions are verifiable, not guessed
.github/scripts/journal-entry.sh   Metrics-append script — copied as-is, already generic
docs/journal.md                    Empty journal skeleton — copied as-is
```

`README.md` (this file), `.pre-commit-config.yaml`, and `.github/scripts/journal-entry.sh` are **not** templated — they describe/support the template itself and are either browsed directly on GitHub or copied verbatim.

## Placeholders a consumer needs to fill in

`factory-new.sh` (M2) will do this substitution automatically. Filling in by hand today means replacing these tokens across `CLAUDE.md.tmpl`, `README.md.tmpl`, `pyproject.toml.tmpl`, `.github/workflows/claude.yml`, and `.env.example`:

| Placeholder | Meaning |
|---|---|
| `{{PROJECT_NAME}}` | The new repo's name |
| `{{PROJECT_DESCRIPTION}}` | One-line description of what the app does |
| `{{APP_NAME}}` | The Nautobot App's distribution name (e.g. `nautobot-widget-tracker`) |
| `{{PYTHON_PACKAGE}}` | The Python package name (e.g. `nautobot_widget_tracker`) |
| `{{AUTHOR_NAME}}` | Author name for `pyproject.toml` |
| `{{NAUTOBOT_VERSION}}` | Poetry version constraint for the `nautobot` dependency (e.g. `^3.0.0`) |
| `{{ADDITIONAL_CONVENTIONS}}` | Any project-specific conventions beyond the shared skeleton |
| `{{BASE_BRANCH}}` | Default branch the Lane B driver targets (usually `main`) |

After substitution, `CLAUDE.md.tmpl` → `CLAUDE.md`, `README.md.tmpl` → `README.md`, and `pyproject.toml.tmpl` → `pyproject.toml` at the root of the new repo. The new repo also needs `CLAUDE_CODE_OAUTH_TOKEN` and (optionally) `GH_PAT` set as GitHub Actions secrets, and labels applied from `templates/_shared/labels.json`, before the `claude-go` pipeline can run — both are `scripts/factory-secrets.sh` / `scripts/factory-new.sh` responsibilities (M2), not manual steps.
