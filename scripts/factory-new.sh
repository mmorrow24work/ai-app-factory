#!/usr/bin/env bash
#
# factory-new.sh — scaffold a new project from an ai-app-factory template,
# create its GitHub repo, apply the shared label taxonomy, and register it
# in this repo's projects.json.
#
# See scripts/README.md for a usage example and the .env shape expected by
# the companion factory-secrets.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATES_DIR="$REPO_ROOT/templates"
SHARED_DIR="$TEMPLATES_DIR/_shared"
PROJECTS_JSON="$REPO_ROOT/projects.json"
TYPES=(nautobot-app netbox-plugin custom-script)

DEFAULT_OWNER="mmorrow24work"

usage() {
  cat <<'EOF'
Usage: factory-new.sh <type> <repo-name> [options]

Scaffold a new project from a template, create its GitHub repo, apply the
shared label taxonomy, and append it to this repo's projects.json.

Arguments:
  <type>          One of: nautobot-app | netbox-plugin | custom-script
  <repo-name>     Name of the new repository (no owner prefix)

Options:
  --owner NAME          GitHub owner/org to create the repo under (default: mmorrow24work)
  --private             Create a private repo (default: public)
  --ask TEXT            Original ask, recorded in projects.json. Prompted for
                         interactively if omitted and this is a terminal;
                         required otherwise.
  --description TEXT    Sets the {{PROJECT_DESCRIPTION}} placeholder
                         (defaults to --ask if omitted)
  --branch NAME         Sets {{BASE_BRANCH}} (default: main)
  --author NAME         Sets {{AUTHOR_NAME}} (default: git config user.name, else owner)
  --set KEY=VALUE       Set an arbitrary template placeholder (repeatable),
                         e.g. --set NAUTOBOT_VERSION=^3.0.0
  --dry-run             Build the local scaffold only; skip repo creation,
                         label application, and the projects.json update.
                         Prints the scaffold directory and leaves it in place.
  -h, --help            Show this help

Placeholders with a built-in default (override with --set if needed):
  TEST_COMMAND       pytest
  NAUTOBOT_VERSION   ^3.0.0
  NETBOX_VERSION     v4.5.0

custom-script's ENTRY_POINT has no default and always needs --set — there is
no defensible guess for a script's main file.

Every project, of every type, also needs this one (logged in the new repo's
README.md so it's clear who requested it -- the requester's GitHub account,
not a self-reported name/email/phone):
  --set REQUESTER_GITHUB=...

Example:
  factory-new.sh custom-script my-new-tool \
    --ask "A CLI that syncs X to Y" \
    --set ENTRY_POINT=run.py \
    --set REQUESTER_GITHUB=janedoe
EOF
}

die() {
  echo "factory-new.sh: error: $*" >&2
  exit 1
}

if [ $# -eq 0 ]; then
  usage
  exit 1
fi

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
esac

TYPE="${1:-}"
REPO_NAME="${2:-}"
[ -n "$TYPE" ] || die "missing <type>"
[ -n "$REPO_NAME" ] || die "missing <repo-name>"
shift 2

case "$REPO_NAME" in
  -*) die "repo-name '$REPO_NAME' looks like a flag — did you forget <type>?" ;;
esac
[[ "$REPO_NAME" =~ ^[A-Za-z0-9._-]+$ ]] || die "repo-name '$REPO_NAME' must match [A-Za-z0-9._-]+"

type_ok=false
for t in "${TYPES[@]}"; do
  [ "$t" = "$TYPE" ] && type_ok=true
done
$type_ok || die "<type> must be one of: ${TYPES[*]} (got '$TYPE')"

SRC_DIR="$TEMPLATES_DIR/$TYPE"
[ -d "$SRC_DIR" ] || die "template directory not found: $SRC_DIR"

OWNER="$DEFAULT_OWNER"
VISIBILITY="--public"
ASK=""
DESCRIPTION=""
BRANCH="main"
AUTHOR=""
DRY_RUN=false
declare -A OVERRIDES

while [ $# -gt 0 ]; do
  case "$1" in
    --owner) OWNER="${2:?--owner requires a value}"; shift 2 ;;
    --private) VISIBILITY="--private"; shift ;;
    --ask) ASK="${2:?--ask requires a value}"; shift 2 ;;
    --description) DESCRIPTION="${2:?--description requires a value}"; shift 2 ;;
    --branch) BRANCH="${2:?--branch requires a value}"; shift 2 ;;
    --author) AUTHOR="${2:?--author requires a value}"; shift 2 ;;
    --set)
      kv="${2:?--set requires KEY=VALUE}"
      key="${kv%%=*}"
      val="${kv#*=}"
      [ "$key" != "$kv" ] || die "--set value '$kv' is not KEY=VALUE"
      OVERRIDES["$key"]="$val"
      shift 2
      ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done

# --ask: prompt only if interactive; unattended callers must supply it.
if [ -z "$ASK" ]; then
  if [ -t 0 ]; then
    read -r -p "Ask (one-line description of what this project is for): " ASK
  else
    die "--ask is required (no terminal to prompt on)"
  fi
fi
[ -n "$ASK" ] || die "--ask must not be empty"

[ -n "$DESCRIPTION" ] || DESCRIPTION="$ASK"

if [ -z "$AUTHOR" ]; then
  AUTHOR="$(git config --get user.name 2>/dev/null || true)"
  [ -n "$AUTHOR" ] || AUTHOR="$OWNER"
fi

default_python_package() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/_/g; s/^_+//; s/_+$//'
}

# --- Build the list of files to copy (everything except the template's own
# meta README.md, which describes the template for browsing on GitHub and is
# not meant to land in the generated repo — see templates/<type>/README.md). ---
SRC_FILES=()
while IFS= read -r -d '' f; do
  [ "$f" = "$SRC_DIR/README.md" ] && continue
  SRC_FILES+=("$f")
done < <(find "$SRC_DIR" -type f -print0)

[ ${#SRC_FILES[@]} -gt 0 ] || die "no files found to copy under $SRC_DIR"

# --- Discover every {{PLACEHOLDER}} (including the {{> partial}} include
# syntax) referenced across the files that will actually be copied. ---
NEEDED=()
while IFS= read -r key; do
  [ -n "$key" ] && NEEDED+=("$key")
done < <(grep -hoE '\{\{[A-Za-z0-9_>][^}]*\}\}' "${SRC_FILES[@]}" 2>/dev/null \
           | sed -E 's/^\{\{//; s/\}\}$//' | sort -u)

declare -A VALUES
MISSING=()

# Seed every placeholder with a known default unconditionally — not just the
# ones found in the NEEDED scan — since that scan only covers
# templates/<type>/ and misses placeholders that live in templates/_shared/
# partials (e.g. OWNER_GITHUB_HANDLE, referenced only from
# SUPPORT_HANDOFF.md.tmpl, not from any file the NEEDED scan looked at).
set_default() {
  local key="$1" default_value="$2"
  if [ -n "${OVERRIDES[$key]+set}" ]; then
    VALUES["$key"]="${OVERRIDES[$key]}"
  else
    VALUES["$key"]="$default_value"
  fi
}
set_default PROJECT_NAME "$REPO_NAME"
set_default PROJECT_DESCRIPTION "$DESCRIPTION"
set_default BASE_BRANCH "$BRANCH"
set_default OWNER_GITHUB_HANDLE "$OWNER"
set_default AUTHOR_NAME "$AUTHOR"
set_default APP_NAME "$REPO_NAME"
set_default PYTHON_PACKAGE "$(default_python_package "$REPO_NAME")"
set_default ADDITIONAL_CONVENTIONS "(none yet — add project-specific conventions here as they come up)"
set_default TEST_COMMAND "pytest"
set_default NAUTOBOT_VERSION "^3.0.0"
set_default NETBOX_VERSION "v4.5.0"
# ENTRY_POINT intentionally has no default: there is no defensible guess for a
# custom-script project's main file, and silently picking one would produce a
# repo whose CLAUDE.md names a script that never gets written. Falls through
# to the MISSING/error path below like any other undefaulted placeholder.

for key in "${NEEDED[@]}"; do
  case "$key" in
    "> _shared/"*) continue ;; # shared partials are rendered separately below
  esac
  [ -n "${VALUES[$key]+set}" ] && continue
  if [ -n "${OVERRIDES[$key]+set}" ]; then
    VALUES["$key"]="${OVERRIDES[$key]}"
  else
    MISSING+=("$key")
  fi
done

# REQUESTER_GITHUB intentionally has no default either, for the same reason
# ENTRY_POINT doesn't: every generated repo's README.md must name a real
# requester, not a guess. It lives only inside
# templates/_shared/REQUESTED_BY.md.tmpl (a partial, not a file the NEEDED
# scan above reads directly), so it's checked here explicitly rather than
# relying on that scan to find it.
if [ -n "${OVERRIDES[REQUESTER_GITHUB]+set}" ]; then
  VALUES["REQUESTER_GITHUB"]="${OVERRIDES[REQUESTER_GITHUB]}"
else
  MISSING+=("REQUESTER_GITHUB")
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  if [ -t 0 ]; then
    for key in "${MISSING[@]}"; do
      read -r -p "Value for {{$key}}: " val
      VALUES["$key"]="$val"
    done
  else
    {
      echo "factory-new.sh: error: template '$TYPE' needs values for placeholders with no default:"
      for key in "${MISSING[@]}"; do echo "  --set $key=..."; done
    } >&2
    exit 1
  fi
fi

# --- Render: read a file whole, do literal {{KEY}} substring replacement for
# every known placeholder, and write it back preserving the trailing newline
# exactly ($()  strips trailing newlines, so a sentinel byte is appended and
# stripped back off). ---
render_content() {
  local content
  content="$(cat "$1"; printf 'x')"
  content="${content%x}"
  local key
  for key in "${!VALUES[@]}"; do
    content="${content//"{{$key}}"/${VALUES[$key]}}"
  done
  printf '%s' "$content"
}

# Render every shared partial (Support & Handoff, Requested by, ...) now that
# VALUES is fully resolved (including hard-required keys like REQUESTER_*),
# and register each as a pseudo-placeholder so the main pass below can splice
# it into any file's {{> _shared/<file>}} include.
for partial in "$SHARED_DIR"/*.md.tmpl; do
  [ -f "$partial" ] || continue
  VALUES["> _shared/$(basename "$partial")"]="$(render_content "$partial")"
done

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/factory-new.XXXXXX")"
cleanup() {
  if [ "$DRY_RUN" = false ] && [ -n "${WORK_DIR:-}" ]; then
    rm -rf "$WORK_DIR"
  fi
}
trap cleanup EXIT

SCAFFOLD_DIR="$WORK_DIR/$REPO_NAME"
mkdir -p "$SCAFFOLD_DIR"

for src in "${SRC_FILES[@]}"; do
  rel="${src#"$SRC_DIR"/}"
  dest_rel="${rel%.tmpl}"
  dest="$SCAFFOLD_DIR/$dest_rel"
  mkdir -p "$(dirname "$dest")"
  render_content "$src" > "$dest"
  chmod --reference="$src" "$dest"
done

echo "Scaffold built at: $SCAFFOLD_DIR"

if [ "$DRY_RUN" = true ]; then
  trap - EXIT
  echo "--dry-run: skipping repo creation, labels, and projects.json. Scaffold left in place."
  exit 0
fi

git -C "$SCAFFOLD_DIR" init -q -b "$BRANCH"
git -C "$SCAFFOLD_DIR" add -A
git -C "$SCAFFOLD_DIR" -c user.name="${AUTHOR}" -c user.email="noreply@users.noreply.github.com" \
  commit -q -m "Initial scaffold from ai-app-factory template: $TYPE"

echo "Creating $OWNER/$REPO_NAME on GitHub..."
gh repo create "$OWNER/$REPO_NAME" "$VISIBILITY" --source="$SCAFFOLD_DIR" --push

LABELS_JSON="$SHARED_DIR/labels.json"
if [ -f "$LABELS_JSON" ]; then
  echo "Applying labels from $LABELS_JSON..."
  jq -c '.[]' "$LABELS_JSON" | while IFS= read -r label; do
    name=$(jq -r '.name' <<<"$label")
    color=$(jq -r '.color' <<<"$label")
    desc=$(jq -r '.description' <<<"$label")
    gh label create "$name" --repo "$OWNER/$REPO_NAME" --color "$color" --description "$desc" --force
  done
else
  echo "WARNING: $LABELS_JSON not found — skipping label application" >&2
fi

echo "Registering $OWNER/$REPO_NAME in $PROJECTS_JSON..."
TMP_PROJECTS="$(mktemp "${TMPDIR:-/tmp}/projects.json.XXXXXX")"
jq --arg repo "$OWNER/$REPO_NAME" \
   --arg type "$TYPE" \
   --arg createdAt "$(date -u +%F)" \
   --arg status "active" \
   --arg ask "$ASK" \
   --arg requesterGithub "${VALUES[REQUESTER_GITHUB]}" \
   '. + [{repo: $repo, type: $type, createdAt: $createdAt, status: $status, ask: $ask, requesterGithub: $requesterGithub}]' \
   "$PROJECTS_JSON" > "$TMP_PROJECTS"
mv "$TMP_PROJECTS" "$PROJECTS_JSON"

cat <<EOF

Done. Next step:
  scripts/factory-secrets.sh $REPO_NAME --owner $OWNER
to set CLAUDE_CODE_OAUTH_TOKEN and GH_PAT on the new repo before the
claude-go pipeline can run.
EOF
