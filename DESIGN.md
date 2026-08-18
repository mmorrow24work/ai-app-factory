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

**Write path (drafting, generating issues):** GitHub Actions `workflow_dispatch`, triggered from the browser using a fine-grained GitHub PAT the user pastes once into a Settings page and that lives only in `localStorage` (sent solely to `api.github.com`, same trust level as a local `gh auth login`). A workflow drafts the design doc via Opus and opens it as a PR; on merge, a second workflow reads the approved doc and opens a **provisioning issue in `ai-app-factory` itself** — it does not create the target repo or touch any other repo. A human runs `scripts/factory-new.sh` + `scripts/factory-secrets.sh` locally (their own `gh auth`, no stored credential involved) to actually create it, then manually fires that new repo's own `seed-milestones.yml` (`workflow_dispatch`, no inputs) to turn the design doc into milestones and `claude-go`-labeled issues, using *that repo's own* narrowly-scoped secrets rather than reaching back across from `ai-app-factory`. The full loop, step by step, is documented in `docs/adr/0001-design-to-issues-loop.md`.

This puts two human approval gates between "someone had an idea" and "tokens start getting spent on it": merging the design-doc PR, then separately choosing to provision the repo. The second gate is deliberate, not just a security boundary — it's the point where you see who's asking for what and can decide whether it's worth building before any Opus run against the new repo (milestone/issue generation, then every `claude-go` issue after it) starts burning tokens.

**Repo-scaffolding boilerplate:** codified once in `templates/_shared/labels.json` and per-type templates under `templates/`, applied by `scripts/factory-new.sh` / `scripts/factory-secrets.sh`, which read known values (`CLAUDE_CODE_OAUTH_TOKEN`, `GH_PAT`, default cloud NetBox/Nautobot URLs and API keys) from `~/.config/ai-app-factory/.env` so they're set once, not re-typed per project.

**Journal convention:** the *workflow* appends metrics to `docs/journal.md` after each run (`.github/scripts/journal-entry.sh`, `if: always()`), never Claude's own branch. Adopted deliberately: `nautobot-app-pytest-compliance-rule-engine`'s journal documents that having Claude append its own entry inside each PR (as `uk-wealth-tracker` does) makes every open PR touch the same file, so almost every PR goes conflicting the moment any other PR merges.

## GH_PAT: token strategy

Earlier design had `generate-issues.yml` call `scripts/factory-new.sh` itself, which meant `GH_PAT` had to create repositories under `mmorrow24work` — and a fine-grained PAT scoped to "Only select repositories" **cannot** cover a repo that doesn't exist yet, so repo creation forced "All repositories" coverage (plus `Administration`) regardless of token type. That requirement is gone now: `ai-app-factory`'s own automation never creates or touches another repo at all (see the Write path paragraph above — provisioning is a human step, and milestone/issue seeding runs *inside* the new repo using *its own* secrets). `GH_PAT` on `ai-app-factory` only ever needs to operate on `ai-app-factory` itself.

**Decision: fine-grained PAT, scoped to "Only select repositories: `ai-app-factory`"**, with `Contents`, `Issues`, `Pull requests`, `Actions`, `Secrets` (Read and write) — not `Administration` (no repo creation needed here anymore), not `Workflows` (keeps `.github/workflows/*` changes behind human review, same reasoning as before). This is strictly narrower than either option the earlier "forced to All repositories" analysis compared — single-repo coverage *and* granular capability — because removing the repo-creation requirement removed the actual constraint that forced broad coverage in the first place.

**`GH_PAT` for generated projects is never stored anywhere — corrected twice on 2026-08-17 before landing here.** First attempt: a `.env`-stored value scoped to `Secrets: Read and write` only, reasoning that `factory-secrets.sh` itself just calls `gh secret set`. Wrong — that call authenticates with the *local* `gh` session, not this value; this value is the payload written into the new repo's own `GH_PAT` secret, which *that* repo's `claude.yml`/`seed-milestones.yml` then use for real Contents/Issues/Pull requests/Actions work. Found the hard way when `seed-milestones.yml` could create issues but 403'd on every milestone/label/comment/edit call during the M7 smoke test. Second attempt: broaden the same `.env` value to the full capability set, scoped to "All repositories" (unavoidable, since it's minted before the target repo exists). That fixed the immediate failure but reintroduced exactly the problem the `ai-app-factory`-own-token narrowing existed to solve, just relocated: one shared value copied into every generated project's secret means a leak from *any one* of them exposes a token that can act on *all* of them.

**Decision: `factory-secrets.sh` prompts for `GH_PAT` interactively (input hidden) on every run, and never persists it.** Mint a fresh fine-grained PAT scoped to "Only select repositories: `<that one repo>`" — which now works, since the repo already exists by the time `factory-secrets.sh` runs — with `Contents`, `Issues`, `Pull requests`, `Actions`, `Secrets` (Read and write), not `Administration`, not `Workflows`. More manual friction per project (a token to mint each time, not a one-time `.env` fill-in), but a leak from one generated project's secret can now never reach another's — true single-repo blast radius, not just single-repo *by convention*.

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
- **M5 — Intake → design doc.** `/new` page, PAT-authenticated `workflow_dispatch`, Opus drafts `DESIGN.md` as a PR. The form requires name/email/phone alongside the project ask; `draft-design-doc.yml` stamps a `**Requested by:**` line onto both the design doc and the PR description directly from those raw inputs (not left to the LLM step) so the approver can see who's asking before merging. That line travels forward into M6, which turns it into `factory-new.sh --set REQUESTER_NAME=...` etc., landing it in the new repo's own `README.md`. Added 2026-08-18.
- **M6 — Approve → provision → seed.** On merge, Opus drafts a provisioning plan and opens an issue in `ai-app-factory` telling a human what to run. The human provisions the repo locally (`factory-new.sh` + `factory-secrets.sh`) and fires its `seed-milestones.yml`, which turns the design doc into milestones + `claude-go`-labeled issues using the new repo's own secrets. Redesigned 2026-08-17 to keep `ai-app-factory`'s own `GH_PAT` scoped to itself — see "GH_PAT: token strategy" — and to add a second human approval gate before any tokens are spent on a new project.
- **M7 — Polish.** README, end-to-end dry run on a real throwaway project.
