# scripts

The `ai-app-factory` CLI: turns the manual repo-bootstrap steps this repo's
own `docs/journal.md` M0 entry did by hand into two commands.

```
factory-new.sh        Scaffold templates/<type>/ into a new GitHub repo, apply
                       labels, register it in projects.json
factory-secrets.sh    Set CLAUDE_CODE_OAUTH_TOKEN / GH_PAT on a repo from a
                       local, untracked secrets store
```

Both require `gh` (authenticated) and `jq` on `PATH`.

## factory-new.sh

```
scripts/factory-new.sh custom-script my-new-tool \
  --ask "A CLI that syncs X to Y" \
  --set ENTRY_POINT=run.py \
  --set TEST_COMMAND="pytest"
```

- `<type>` is one of `nautobot-app`, `netbox-plugin`, `custom-script`.
- Creates `mmorrow24work/<repo-name>` (pass `--owner` to use a different
  owner/org, `--private` for a private repo).
- Copies `templates/<type>/` into the new repo, stripping `.tmpl` extensions
  and substituting `{{PROJECT_NAME}}`-style placeholders. Placeholders with
  an obvious default (`PROJECT_NAME`, `BASE_BRANCH`, `OWNER_GITHUB_HANDLE`,
  `APP_NAME`, `PYTHON_PACKAGE`, `AUTHOR_NAME`, `ADDITIONAL_CONVENTIONS`) are
  filled in automatically; anything template-specific with no safe default
  (e.g. `NAUTOBOT_VERSION`, `ENTRY_POINT`, `TEST_COMMAND`) needs
  `--set KEY=VALUE`, or is prompted for interactively if the script is run
  at a terminal without it.
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

Reads `CLAUDE_CODE_OAUTH_TOKEN` and `GH_PAT` from
`~/.config/ai-app-factory/.env` and sets them as Actions secrets on
`mmorrow24work/<repo-name>` (`--owner` to override, `--env-file` to read from
elsewhere). Errors clearly if the file or either variable is missing —
it does not prompt or fall back silently, since a wrong secret would fail
silently later inside a GitHub Actions run instead.

### `~/.config/ai-app-factory/.env`

Not created by this script — create it yourself, `chmod 600`, and never
commit it (it lives outside this repo, under your home directory). Shape:

```sh
CLAUDE_CODE_OAUTH_TOKEN=   # from `claude setup-token`
GH_PAT=                    # fine-grained GitHub PAT: contents + actions + secrets write on target repos
```
