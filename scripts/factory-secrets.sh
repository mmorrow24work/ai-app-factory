#!/usr/bin/env bash
#
# factory-secrets.sh — set the CLAUDE_CODE_OAUTH_TOKEN and GH_PAT Actions
# secrets a factory-new.sh-created repo needs before its claude-go pipeline
# can run, reading them from a local, untracked store.
#
# See scripts/README.md for the expected shape of that store.

set -euo pipefail

DEFAULT_OWNER="mmorrow24work"
DEFAULT_ENV_FILE="$HOME/.config/ai-app-factory/.env"
REQUIRED_VARS=(CLAUDE_CODE_OAUTH_TOKEN GH_PAT)

usage() {
  cat <<EOF
Usage: factory-secrets.sh <repo-name> [options]

Reads CLAUDE_CODE_OAUTH_TOKEN and GH_PAT from a local .env file and sets them
as GitHub Actions secrets on the target repo via 'gh secret set'.

Arguments:
  <repo-name>       Name of the repository (no owner prefix)

Options:
  --owner NAME       GitHub owner/org the repo belongs to (default: mmorrow24work)
  --env-file PATH    Path to the .env file to read (default: $DEFAULT_ENV_FILE)
  -h, --help         Show this help

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

# Source in a subshell first so a syntactically broken .env fails clearly
# rather than half-polluting this shell's environment.
( set -e; . "$ENV_FILE" ) || die "failed to source $ENV_FILE — check it's valid shell (VAR=value per line)"
# shellcheck disable=SC1090
. "$ENV_FILE"

MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  [ -n "${!var:-}" ] || MISSING+=("$var")
done

if [ ${#MISSING[@]} -gt 0 ]; then
  die "$ENV_FILE is missing a value for: ${MISSING[*]} (see scripts/README.md for the expected shape — not prompting, this must be set in the file)"
fi

echo "Setting secrets on $OWNER/$REPO_NAME..."
gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo "$OWNER/$REPO_NAME" --body "$CLAUDE_CODE_OAUTH_TOKEN"
gh secret set GH_PAT --repo "$OWNER/$REPO_NAME" --body "$GH_PAT"

echo "Done. $OWNER/$REPO_NAME has CLAUDE_CODE_OAUTH_TOKEN and GH_PAT set."
