# CLAUDE.md

Conventions for unattended (Lane B) work on `ai-app-factory`. Read `DESIGN.md` for the full design and milestone list before starting any issue.

## Repo map

```
templates/_shared/labels.json   Label taxonomy applied to every generated project
templates/<type>/                Per-project-type scaffold (nautobot-app, netbox-plugin, custom-script) — M1
scripts/                         factory-new.sh, factory-secrets.sh CLI — M2
site/                             SvelteKit dashboard, adapter-static for GitHub Pages — M3+
projects.json                    Registry of tracked projects; sidebar source of truth
docs/journal.md                  Per-issue build metrics, appended by the workflow only (see below) — never edit by hand
docs/adr/                        Architecture decision records
.github/workflows/claude.yml     The Lane B driver itself
.github/scripts/journal-entry.sh Metrics-append script the workflow calls
```

Only `templates/`, `scripts/`, `site/`, `docs/adr/`, and root docs exist as directories you should create content in as milestones call for them — don't scaffold `site/` (a SvelteKit app) ahead of M3's issue, or `scripts/` ahead of M2's.

## Conventions

- **Never edit `docs/journal.md` by hand or from within a PR branch.** It's appended by `.github/workflows/claude.yml` *after* your PR merges, via `.github/scripts/journal-entry.sh`. Editing it in your branch reintroduces the PR-conflict problem this repo's design doc explicitly calls out as a solved lesson from `uk-wealth-tracker` — every open PR would touch the same file and go conflicting.
- **`templates/_shared/labels.json` is the single source of truth for the label taxonomy** (`claude-go`, `model:opus`, `lane:*`, plus the standard GitHub set). Per-type templates should reference it, not duplicate it.
- **The site is static.** No server-side code, no secrets committed anywhere in `site/`. Anything needing a secret (drafting a design doc, generating issues) is a GitHub Actions workflow triggered via `workflow_dispatch`, never a Svelte server route.
- **JS/TS in `site/`**: use plain `fetch` against the GitHub REST/GraphQL API and raw.githubusercontent.com for `docs/journal.md`/`projects.json` — no bespoke GitHub API client library.
- Keep commit and PR scope to the files named in the issue or in the repo map above.

## Definition of done

- The issue's acceptance criteria are met.
- If `package.json` exists (post-M3) and the issue touches `site/`: `npm run build` and `npm run lint` (or repo-equivalent) pass. If those scripts don't exist yet at the point your issue runs, say so in the PR description rather than inventing a workaround.
- Any shell script added is `bash -n`-clean and executable (`chmod +x`).
- Any JSON added is valid (`jq . <file>` succeeds).
- PR description explains what you implemented, what you verified, and anything you could not verify unattended (e.g. an actual GitHub Pages deploy, which only runs on merge to `main`).
