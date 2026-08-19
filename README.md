# ai-app-factory

Turns a vague project ask into a running unattended Claude Code build pipeline, and gives you one dashboard across every project built that way.

Two things live here:

1. **Templates + CLI** (`templates/`, `scripts/`) — the repo-scaffolding boilerplate every one of these projects has needed by hand: a `claude-go`/`model:opus`/`model:haiku`/`lane:*` label taxonomy, a `.github/workflows/claude.yml` that runs `claude-code-action` per labeled issue, a `docs/journal.md` metrics log, secrets (`CLAUDE_CODE_OAUTH_TOKEN`, `GH_PAT`), and a `.env`. Packaged as `nautobot-app`, `netbox-plugin`, and `custom-script` project types.
2. **The factory site** (`site/`) — a static SvelteKit dashboard (GitHub Pages) that takes a vague ask, drafts a design doc via Opus, and — once you approve it — generates the GitHub milestones/issues that drive the pipeline above. Every tracked project shows up in a grouped sidebar with its original ask, elapsed time, token-burn history (from `docs/journal.md`), latest Actions run status, and a commit heatmap.

Live dashboard: **https://mmorrow24work.github.io/ai-app-factory/**

See `DESIGN.md` for the full design, `docs/adr/0001-design-to-issues-loop.md` for the ask → design doc → milestones/issues → `claude-go` loop step by step, and `docs/journal.md` for the build log of this repo's own (dogfooded) construction.

## Setup

### 1. This repo's own secrets

The `claude-go` pipeline on *this* repo (and `draft-design-doc.yml` / `generate-issues.yml`, which run here too) needs two Actions secrets:

```sh
claude setup-token   # mint a Claude Code OAuth token, paste it at the prompt below
gh secret set CLAUDE_CODE_OAUTH_TOKEN -R mmorrow24work/ai-app-factory

gh secret set GH_PAT -R mmorrow24work/ai-app-factory   # fine-grained PAT, see scripts/README.md
```

`GH_PAT` here only ever needs to operate on `ai-app-factory` itself — `Contents`, `Issues`, `Pull requests`, `Actions`, `Secrets` (Read and write), scoped to "Only select repositories: `ai-app-factory`". Not `Administration`, not "All repositories": since M6's redesign (see `DESIGN.md`'s "GH_PAT: token strategy"), this repo's own automation never creates or touches another repo — provisioning a new project is a human step, run locally. GitHub also withholds `workflow` scope from fine-grained PATs used this way regardless: any change to a `.github/workflows/*.yml` file has to be pushed by a human, not the pipeline — see the `## Known limitations` section below.

### 2. The local secrets store (`factory-new.sh` / `factory-secrets.sh`)

```sh
cp .env.example .env
# fill in CLAUDE_CODE_OAUTH_TOKEN (a fresh token is fine, or reuse step 1's)
```

`GH_PAT` is deliberately **not** in `.env` — `factory-secrets.sh` prompts for it fresh (input hidden) every time it runs, scoped to just the one repo being provisioned, and never writes it to disk. See `.env.example` and `DESIGN.md`'s "GH_PAT: token strategy" for why a shared, stored `GH_PAT` was tried and rejected: the same value copied into every project's secret means one leak reaches all of them.

`.env` is gitignored — lives inside this checkout, but git can never touch it. See `scripts/README.md` for the full CLI reference.

### 3. Running the site locally

```sh
cd site
npm install
npm run dev       # http://localhost:5173
npm run build     # static output to site/build/, what pages-deploy.yml ships
npm run lint       # prettier + eslint
npm run check      # svelte-check
```

The site is 100% static — no `.env` needed to run it locally, and no GitHub credential of any kind touches the browser. `/settings` only holds display preferences (theme, palette, typography), stored in `localStorage`. `/new` doesn't call any authenticated API either: it builds a pre-filled GitHub "New issue" link and hands off to GitHub's own submit button there — see DESIGN.md's "Write path" and "Resolved 2026-08-18" notes for why the original PAT-in-`localStorage` design was superseded before it shipped.

## Using the factory

**Scaffold a new project by hand:**

```sh
scripts/factory-new.sh custom-script my-new-tool --ask "A CLI that syncs X to Y" \
  --set ENTRY_POINT=run.py --set TEST_COMMAND=pytest
scripts/factory-secrets.sh my-new-tool
```

**Or through the site:** open `/new`, describe the project in a sentence or two, submit. Review the drafted `docs/proposals/<slug>.md` PR it opens here, edit if needed, and merge — `generate-issues.yml` takes it from there (creates the repo if it doesn't exist, generates milestones and `claude-go`-labeled issues). See the ADR for the full loop.

## Known limitations

- **The pipeline's own `GH_PAT` can't write `.github/workflows/*.yml` files** — GitHub withholds `workflow` scope from PATs used this way as a deliberate guardrail (workflow files run with repo secrets). When a `claude-go` run needs to add or change one, it can't push it and posts the content in a PR description or issue comment instead, for a human to apply by hand. Hit and worked around three times building this repo itself (`pages-deploy.yml`, `draft-design-doc.yml`, `generate-issues.yml`).
- **`docs/journal.md`'s `Result: success/failure` reflects the Claude Code step's own execution outcome, not whether it achieved the issue's goal.** A run that correctly decides to post a blocking comment instead of opening a PR (e.g. genuine ambiguity, or the workflow-scope wall above) still records `Result: success` — "the agent completed its turn without erroring," not "a PR landed." Check the entry's `PR:` field (`—` vs an actual number) to tell the two apart.
- **Support & Handoff, and forking:** see `DESIGN.md`'s "Support & handoff" section — every generated project documents this itself too, via `templates/_shared/SUPPORT_HANDOFF.md.tmpl`.
