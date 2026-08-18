# scripts

The `ai-app-factory` CLI: turns the manual repo-bootstrap steps this repo's
own `docs/journal.md` M0 entry did by hand into two commands.

```
factory-new.sh        Scaffold templates/<type>/ into a new GitHub repo, apply
                       labels, register it in projects.json
factory-secrets.sh    Set CLAUDE_CODE_OAUTH_TOKEN (from .env) and GH_PAT
                       (prompted fresh, never stored) on a repo
```

Both require `gh` (authenticated) and `jq` on `PATH`.

## factory-new.sh

```
scripts/factory-new.sh custom-script my-new-tool \
  --ask "A CLI that syncs X to Y" \
  --set ENTRY_POINT=run.py \
  --set REQUESTER_NAME="Jane Doe" \
  --set REQUESTER_EMAIL=jane@example.com \
  --set REQUESTER_PHONE="+1 555 0100"
```

- `<type>` is one of `nautobot-app`, `netbox-plugin`, `custom-script`.
- Creates `mmorrow24work/<repo-name>` (pass `--owner` to use a different
  owner/org, `--private` for a private repo).
- Copies `templates/<type>/` into the new repo, stripping `.tmpl` extensions
  and substituting `{{PROJECT_NAME}}`-style placeholders. Placeholders with
  an obvious default (`PROJECT_NAME`, `BASE_BRANCH`, `OWNER_GITHUB_HANDLE`,
  `APP_NAME`, `PYTHON_PACKAGE`, `AUTHOR_NAME`, `ADDITIONAL_CONVENTIONS`,
  `TEST_COMMAND` → `pytest`, `NAUTOBOT_VERSION` → `^3.0.0`, `NETBOX_VERSION`
  → `v4.5.0`) are filled in automatically, overridable with `--set`.
  `ENTRY_POINT` (custom-script) has no default and always needs
  `--set KEY=VALUE` — there is no defensible guess for a script's main file
  — or is prompted for interactively if the script is run at a terminal
  without it. `REQUESTER_NAME`/`REQUESTER_EMAIL`/`REQUESTER_PHONE` likewise
  have no default, for every project type — they're rendered into the new
  repo's `README.md` (`templates/_shared/REQUESTED_BY.md.tmpl`) so it's
  always clear who asked for it.
- Applies `templates/_shared/labels.json` to the new repo via
  `gh label create --force`.
- Appends `{repo, type, createdAt, status: "active", ask}` to this repo's own
  `projects.json`.
- `--dry-run` builds the scaffold under a temp directory and prints its path
  without touching GitHub or `projects.json` — useful for checking template
  rendering before creating anything.

Run `scripts/factory-secrets.sh` on the new repo next — a fresh repo has no
`claude-go` pipeline until its secrets are set.

## factory-secrets.sh

```
scripts/factory-secrets.sh my-new-tool
```

Reads `CLAUDE_CODE_OAUTH_TOKEN` from `.env` at this repo's root and prompts
for `GH_PAT` interactively (input hidden) every run — sets both as Actions
secrets on `mmorrow24work/<repo-name>` (`--owner` to override, `--env-file`
for a different `.env` location). Errors clearly if `.env` or
`CLAUDE_CODE_OAUTH_TOKEN` is missing.

The two secrets are handled differently on purpose. `CLAUDE_CODE_OAUTH_TOKEN`
is a Claude subscription credential (not GitHub), safely reusable across
every project — a leak costs quota, not repo access. `GH_PAT` is deliberately
**never** read from `.env` or written to disk anywhere: mint a fresh
fine-grained PAT scoped to "Only select repositories: `<that one repo>`"
(works because the repo already exists by the time this script runs — run
`factory-new.sh` first) with `Contents`, `Issues`, `Pull requests`, `Actions`,
`Secrets` (Read and write), and paste it at the prompt. See `DESIGN.md`'s
"GH_PAT: token strategy" for why a shared, `.env`-stored `GH_PAT` was tried
twice and rejected both times — the same value copied into every project's
own secret means one leak reaches all of them, not just one.

### `.env`

Copy `.env.example` (this repo's root) to `.env` and fill in
`CLAUDE_CODE_OAUTH_TOKEN` — gitignored, never committed, structurally can't
be `git add -A`-ed by accident since it lives inside the checkout but outside
anything git ever considers tracking. `GH_PAT` is intentionally not part of
this file — see above.
