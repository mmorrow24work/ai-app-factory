# Design: ai-app-factory

## Problem

Every recent project (`nautobot-app-pytest-compliance-rule-engine`, `uk-wealth-tracker`, `cloud-netbox-eval`, `cloud-nautobot-eval`, `PLC`, ...) has re-derived the same unattended Claude Code build pipeline from scratch in conversation: create a repo, set `CLAUDE_CODE_OAUTH_TOKEN`/`GH_PAT` secrets, write a `.env`, add a `claude-go`/`model:opus`/`lane:*` label taxonomy, a `.github/workflows/claude.yml` that runs `claude-code-action` per labeled issue, a `docs/journal.md` metrics log, and milestones. The pattern is proven; only the re-deriving is wasted effort.

## Goal

`ai-app-factory` is two things:

1. **Templates + CLI** — package the repo-scaffolding boilerplate above as reusable templates (`nautobot-app`, `netbox-plugin`, `custom-script`) plus a small CLI that creates a new repo, sets its secrets from a local store, and wires labels/milestones in one step.
2. **The factory site** — a static SvelteKit dashboard (GitHub Pages) that (a) turns a vague ask into a drafted design doc for approval, (b) turns an approved design doc into GitHub milestones/labeled issues, and (c) shows every tracked project in one place: grouped sidebar, original ask, start date, elapsed time, token-burn history, latest Actions run status, commit heatmap.

## Non-goals

- Scraping the claude.ai usage page. It's an authenticated interactive UI with no public API; automating a login to get at it is fragile and out of scope. Token burn instead comes from `docs/journal.md` (which `claude-code-action` already populates with real per-issue duration/turns/tokens/cost), and "session status" comes from the GitHub Actions run state.
- A custom rich-text editor for design docs. Drafting produces a PR; approval/editing happens in GitHub's own PR review UI.
- A separate hosting account. Everything — frontend and the write-side actions that need secrets — runs on GitHub (Pages + Actions).

## Architecture

**Read path (dashboard):** 100% static. The SvelteKit site, deployed to GitHub Pages, reads `projects.json` (this repo, the project registry) plus each tracked repo's public GitHub REST/GraphQL API (issues, milestones, Actions runs, `stats/commit_activity`) and raw `docs/journal.md` — all directly from the browser, no server needed.

**Write path (drafting, generating issues):** GitHub Actions `workflow_dispatch`, triggered from the browser using a fine-grained GitHub PAT the user pastes once into a Settings page and that lives only in `localStorage` (sent solely to `api.github.com`, same trust level as a local `gh auth login`). A workflow drafts the design doc via Opus and opens it as a PR; on merge, a second workflow turns the approved doc into milestones + labeled issues (creating the target repo from the right template first, if new). The full loop, step by step, is documented in `docs/adr/0001-design-to-issues-loop.md`.

**Repo-scaffolding boilerplate:** codified once in `templates/_shared/labels.json` and per-type templates under `templates/`, applied by `scripts/factory-new.sh` / `scripts/factory-secrets.sh`, which read known values (`CLAUDE_CODE_OAUTH_TOKEN`, `GH_PAT`, default cloud NetBox/Nautobot URLs and API keys) from `~/.config/ai-app-factory/.env` so they're set once, not re-typed per project.

**Journal convention:** the *workflow* appends metrics to `docs/journal.md` after each run (`.github/scripts/journal-entry.sh`, `if: always()`), never Claude's own branch. Adopted deliberately: `nautobot-app-pytest-compliance-rule-engine`'s journal documents that having Claude append its own entry inside each PR (as `uk-wealth-tracker` does) makes every open PR touch the same file, so almost every PR goes conflicting the moment any other PR merges.

## Support & handoff

Every generated project should be explicit, in its own README, about two things:

**Getting help while it's still under active build.** The support channel *is* the pipeline's own comment/label mechanism, not a separate system: open an issue or comment on one, and either apply `claude-go` (or comment `@claude`) to have the unattended pipeline attempt a fix itself, or mention the human owner (`@mmorrow24work`) for anything Claude can't resolve or shouldn't attempt unattended (design decisions, ambiguous requirements, anything `lane:manual`).

**Taking ownership once it's done.** When a project's milestones are complete, the recipient forks the repo to their own GitHub account. This is a real, structural handoff, not just a suggestion: GitHub forks do **not** inherit the parent repo's Actions secrets, so `claude-go` on the fork simply has no `CLAUDE_CODE_OAUTH_TOKEN`/`GH_PAT` to run with — the pipeline stops working on the fork automatically the moment it's created, with no separate revoke step needed on the original owner's side. If the new owner wants to keep using the unattended pipeline going forward, they set up their own secrets on their fork (same `claude setup-token` / `gh secret set` steps documented in this repo's own `README.md`) and it becomes entirely theirs from there.

## Milestones

- **M0 — Bootstrap.** This repo, its labels/milestones, `docs/journal.md`, `.github/workflows/claude.yml`. Done directly (no pipeline exists yet to dogfood).
- **M1 — Template library.** `nautobot-app`, `netbox-plugin`, `custom-script` templates, extracted from the reference repos.
- **M2 — `factory` CLI.** `factory-new.sh`, `factory-secrets.sh`, `.env` templating from the local secrets store.
- **M3 — Dashboard shell.** Static SvelteKit site, grouped sidebar driven by `projects.json`, per-project page (original ask, design doc, elapsed time).
- **M4 — Usage widgets.** `docs/journal.md` parser → token-burn chart, Actions run status → session status, `stats/commit_activity` → heatmap.
- **M5 — Intake → design doc.** `/new` page, PAT-authenticated `workflow_dispatch`, Opus drafts `DESIGN.md` as a PR.
- **M6 — Approve → milestones/issues.** On merge, Opus turns the approved doc into milestones + labeled issues (and the target repo, if new).
- **M7 — Polish.** README, end-to-end dry run on a real throwaway project.
