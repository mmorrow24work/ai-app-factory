#!/usr/bin/env bash
#
# factory-secrets.sh — set the CLAUDE_CODE_OAUTH_TOKEN and GH_PAT Actions
# secrets a factory-new.sh-created repo needs before its claude-go pipeline
# can run.
#
# The two secrets are handled differently on purpose:
#
#   CLAUDE_CODE_OAUTH_TOKEN comes from the local .env store and is safely
#   reusable across every project -- it's a Claude subscription credential,
#   not a GitHub one, so a leak costs quota, not repo access.
#
#   GH_PAT is never read from .env and never persisted anywhere. This repo's
#   own docs/journal.md and DESIGN.md record why: a single .env-stored GH_PAT
#   value copied into every project's own secret means a leak from any ONE
#   generated repo exposes a token that can act on ALL of them. Prompted
#   interactively (masked) every run instead, so it's minted fresh, scoped to
#   just this one already-existing repo, and lives only in this process.
#
# See scripts/README.md for the expected shape of the .env store.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DEFAULT_OWNER="mmorrow24work"
# Repo-root, not ~/.config: this file's whole job is to seed *other* repos'
# secrets, but it lives inside this checkout (gitignored, never git-add-able
# even by an -A) for convenience over a fresh clone in a new location.
DEFAULT_ENV_FILE="$REPO_ROOT/.env"
REQUIRED_ENV_VARS=(CLAUDE_CODE_OAUTH_TOKEN)

usage() {
  cat <<EOF
Usage: factory-secrets.sh <repo-name> [options]

Sets CLAUDE_CODE_OAUTH_TOKEN (from a local .env file) and GH_PAT (prompted
fresh, never stored) as GitHub Actions secrets on the target repo.

Arguments:
  <repo-name>       Name of the repository (no owner prefix)

Options:
  --owner NAME       GitHub owner/org the repo belongs to (default: mmorrow24work)
  --env-file PATH    Path to the .env file to read CLAUDE_CODE_OAUTH_TOKEN from
                      (default: $DEFAULT_ENV_FILE)
  -h, --help         Show this help

GH_PAT is read from the GH_PAT environment variable if already exported in
this shell (e.g. for scripting: 'GH_PAT=... factory-secrets.sh my-tool'),
otherwise prompted for interactively with input hidden -- mint a fresh
fine-grained PAT scoped to "Only select repositories: <repo-name>" (the repo
must already exist -- run factory-new.sh first) with Contents, Issues, Pull
requests, Actions, Secrets (Read and write). Never paste it on a bare command
line -- it'll land in shell history in plaintext.

Example:
  factory-secrets.sh my-new-tool
EOF
}

die() {
  echo "factory-secrets.sh: error: $*" >&2
  exit 1
}

if [ $# -eq 0 ]; then
  usage
  exit 1
fi

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
esac

REPO_NAME="${1:-}"
[ -n "$REPO_NAME" ] || die "missing <repo-name>"
shift

case "$REPO_NAME" in
  -*) die "repo-name '$REPO_NAME' looks like a flag" ;;
esac

OWNER="$DEFAULT_OWNER"
ENV_FILE="$DEFAULT_ENV_FILE"

while [ $# -gt 0 ]; do
  case "$1" in
    --owner) OWNER="${2:?--owner requires a value}"; shift 2 ;;
    --env-file) ENV_FILE="${2:?--env-file requires a value}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done

[ -f "$ENV_FILE" ] || die "env file not found: $ENV_FILE (see scripts/README.md for the expected shape — this file is local and untracked, factory-secrets.sh does not create it)"

# Preserve any GH_PAT the caller already exported (the documented scripting
# path, e.g. `GH_PAT=... factory-secrets.sh my-tool`) so sourcing .env can
# never introduce or override it. GH_PAT must never come from .env -- even a
# stale leftover line in an old .env, from before this script stopped
# reading it there, must be silently discarded rather than silently used.
GH_PAT_PRESET="${GH_PAT:-}"

# Source in a subshell first so a syntactically broken .env fails clearly
# rather than half-polluting this shell's environment.
( set -e; . "$ENV_FILE" ) || die "failed to source $ENV_FILE — check it's valid shell (VAR=value per line)"
# shellcheck disable=SC1090
. "$ENV_FILE"

GH_PAT="$GH_PAT_PRESET"

MISSING=()
for var in "${REQUIRED_ENV_VARS[@]}"; do
  [ -n "${!var:-}" ] || MISSING+=("$var")
done
if [ ${#MISSING[@]} -gt 0 ]; then
  die "$ENV_FILE is missing a value for: ${MISSING[*]} (see scripts/README.md for the expected shape — not prompting, this must be set in the file)"
fi

# GH_PAT deliberately does NOT come from .env -- see the file header. Take an
# already-exported value (scripting use), else prompt with input hidden.
if [ -z "${GH_PAT:-}" ]; then
  if [ -t 0 ]; then
    read -r -s -p "GH_PAT for $OWNER/$REPO_NAME (fine-grained, scoped to just this repo, never stored): " GH_PAT
    echo
  else
    die "GH_PAT is not set and there's no terminal to prompt on -- export GH_PAT=... for this invocation only (never write it to a file)"
  fi
fi
[ -n "$GH_PAT" ] || die "GH_PAT must not be empty"

# Feedback only -- masks everything but the last 3 characters so a paste error
# (wrong clipboard contents, truncated paste, stray whitespace) is catchable
# before it's written anywhere, without meaningfully exposing the secret. Found
# worth having the hard way earlier in this project: a corrupted interactive
# paste produced a silently-wrong token that only surfaced as an opaque 401
# several steps later.
pat_len=${#GH_PAT}
if [ "$pat_len" -gt 3 ]; then
  pat_suffix="${GH_PAT: -3}"
  pat_mask=$(printf '%*s' $((pat_len - 3)) '' | tr ' ' '*')
else
  pat_suffix=""
  pat_mask=$(printf '%*s' "$pat_len" '' | tr ' ' '*')
fi
echo "Read GH_PAT: ${pat_mask}${pat_suffix} ($pat_len chars) -- Ctrl-C now if that doesn't look right"

echo "Setting secrets on $OWNER/$REPO_NAME..."
gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo "$OWNER/$REPO_NAME" --body "$CLAUDE_CODE_OAUTH_TOKEN"
gh secret set GH_PAT --repo "$OWNER/$REPO_NAME" --body "$GH_PAT"
unset GH_PAT

echo "Done. $OWNER/$REPO_NAME has CLAUDE_CODE_OAUTH_TOKEN and GH_PAT set."
