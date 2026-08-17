# netbox-plugin template

Scaffold for a NetBox plugin project type: a Django-based NetBox plugin managed with a standard `setuptools` `pyproject.toml`, developed against a real local NetBox install. Shaped after NetBox's own [plugin tutorial](https://github.com/netbox-community/netbox-plugin-tutorial) and [cookiecutter-netbox-plugin](https://github.com/netbox-community/cookiecutter-netbox-plugin) — NetBox's plugin conventions differ from Nautobot's App conventions (`filtersets.py` not `filters.py`, `netbox.plugins.PluginConfig`, `setuptools` rather than Poetry, no dedicated `nautobot-server`-style CLI), so this template does not just copy `templates/nautobot-app/`.

## What's in here

```
CLAUDE.md.tmpl                     Becomes the new repo's CLAUDE.md
README.md.tmpl                     Becomes the new repo's README.md
pyproject.toml.tmpl                Becomes the new repo's pyproject.toml
.pre-commit-config.yaml            Copied as-is — ruff lint/format pre-commit hooks
.env.example                       Copied as-is; consumer fills in real values locally
.github/workflows/claude.yml       Lane B driver — copied with placeholders filled in; clones NetBox and installs the plugin into the runner so API decisions are verifiable, not guessed
.github/scripts/journal-entry.sh   Metrics-append script — copied as-is, already generic
docs/journal.md                    Empty journal skeleton — copied as-is
```

`README.md` (this file), `.pre-commit-config.yaml`, and `.github/scripts/journal-entry.sh` are **not** templated — they describe/support the template itself and are either browsed directly on GitHub or copied verbatim.

## Placeholders a consumer needs to fill in

`factory-new.sh` (M2) will do this substitution automatically. Filling in by hand today means replacing these tokens across `CLAUDE.md.tmpl`, `README.md.tmpl`, `pyproject.toml.tmpl`, `.github/workflows/claude.yml`, `.env.example`, and the shared `templates/_shared/SUPPORT_HANDOFF.md.tmpl` that `README.md.tmpl` pulls in via `{{> _shared/SUPPORT_HANDOFF.md.tmpl}}`:

| Placeholder | Meaning |
|---|---|
| `{{PROJECT_NAME}}` | The new repo's name |
| `{{PROJECT_DESCRIPTION}}` | One-line description of what the plugin does |
| `{{APP_NAME}}` | The plugin's distribution name (e.g. `netbox-widget-tracker`) |
| `{{PYTHON_PACKAGE}}` | The Python package name (e.g. `netbox_widget_tracker`) |
| `{{AUTHOR_NAME}}` | Author name for `pyproject.toml` |
| `{{NETBOX_VERSION}}` | Git tag/branch of NetBox the Lane B driver installs to verify APIs against (e.g. `v4.5.0`) |
| `{{ADDITIONAL_CONVENTIONS}}` | Any project-specific conventions beyond the shared skeleton |
| `{{BASE_BRANCH}}` | Default branch the Lane B driver targets (usually `main`) |
| `{{OWNER_GITHUB_HANDLE}}` | GitHub username of the human owner mentioned in the Support & Handoff section (defaults to `mmorrow24work` if unset) |

After substitution, `CLAUDE.md.tmpl` → `CLAUDE.md`, `README.md.tmpl` → `README.md`, and `pyproject.toml.tmpl` → `pyproject.toml` at the root of the new repo. The new repo also needs `CLAUDE_CODE_OAUTH_TOKEN` and (optionally) `GH_PAT` set as GitHub Actions secrets, and labels applied from `templates/_shared/labels.json`, before the `claude-go` pipeline can run — both are `scripts/factory-secrets.sh` / `scripts/factory-new.sh` responsibilities (M2), not manual steps.
