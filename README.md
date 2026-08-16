# ai-app-factory

Turns a vague project ask into a running unattended Claude Code build pipeline, and gives you one dashboard across every project built that way.

Two things live here:

1. **Templates + CLI** (`templates/`, `scripts/`) — the repo-scaffolding boilerplate every one of these projects has needed by hand: a `claude-go`/`model:opus`/`lane:*` label taxonomy, a `.github/workflows/claude.yml` that runs `claude-code-action` per labeled issue, a `docs/journal.md` metrics log, secrets (`CLAUDE_CODE_OAUTH_TOKEN`, `GH_PAT`), and a `.env`. Packaged as `nautobot-app`, `netbox-plugin`, and `custom-script` project types.
2. **The factory site** (`site/`) — a static SvelteKit dashboard (GitHub Pages) that takes a vague ask, drafts a design doc via Opus, and — once you approve it — generates the GitHub milestones/issues that drive the pipeline above. Every tracked project shows up in a grouped sidebar with its original ask, elapsed time, token-burn history (from `docs/journal.md`), latest Actions run status, and a commit heatmap.

See `DESIGN.md` for the full design and `docs/journal.md` for the build log of this repo's own (dogfooded) construction.
