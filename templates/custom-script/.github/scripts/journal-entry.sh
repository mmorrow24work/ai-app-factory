#!/usr/bin/env bash
#
# Append one metrics entry to docs/journal.md and recompute the velocity table.
#
# Runs with if: always() so a failed or turn-capped run is still recorded —
# those are the runs most worth measuring. Never fails the job: every parse is
# best-effort and falls back to a placeholder rather than exiting non-zero.
#
# Expects in the environment:
#   ISSUE_NUMBER, ISSUE_TITLE, MILESTONE, MODEL, RESULT, REASON,
#   DURATION, EXECUTION_FILE, RUN_URL, PR_REF

set -uo pipefail

cd "$GITHUB_WORKSPACE" || exit 0
JOURNAL="docs/journal.md"

# Isolate from whatever Claude left in the working tree. Claude commits its
# work onto the checked-out branch, so HEAD may carry the implementation
# commit; pushing that HEAD would publish unreviewed work straight to main,
# bypassing the PR entirely. Detach onto a pristine origin/main so the only
# thing this script can ever push is its own journal commit.
git fetch -q origin main || { echo "fetch failed — skipping"; exit 0; }
git checkout -q -B __journal origin/main || { echo "checkout failed — skipping"; exit 0; }

[ -f "$JOURNAL" ] || { echo "no $JOURNAL — skipping"; exit 0; }

turns=0
input_tokens=0
output_tokens=0

# Best-effort parse of the Claude Code transcript. The schema is not officially
# pinned, so fall back to 0 rather than failing the step if the shape differs.
if [ -n "${EXECUTION_FILE:-}" ] && [ -f "$EXECUTION_FILE" ]; then
  turns=$(jq '[.[] | select(.type=="assistant")] | length' "$EXECUTION_FILE" 2>/dev/null || echo 0)
  input_tokens=$(jq '[.. | .input_tokens? // empty] | add // 0' "$EXECUTION_FILE" 2>/dev/null || echo 0)
  output_tokens=$(jq '[.. | .output_tokens? // empty] | add // 0' "$EXECUTION_FILE" 2>/dev/null || echo 0)

  # The session-start "init" event carries its own .subtype, so a naive
  # `.. | .subtype?` picks that up instead of the outcome. The terminal result
  # is the LAST event with type=="result".
  subtype=$(jq -r '[.[] | select(.type=="result")] | last | .subtype // empty' "$EXECUTION_FILE" 2>/dev/null || echo "")
  [ -n "$subtype" ] && [ "$subtype" != "success" ] && REASON="$subtype"
else
  echo "WARNING: execution_file missing or unreadable — metrics will be 0"
fi

# Notional cost at list rates. Not a charge — subscription billing.
case "$MODEL" in
  claude-opus-5)   in_rate=5; out_rate=25 ;;
  claude-haiku-4-5) in_rate=1; out_rate=5 ;;
  *)               in_rate=3; out_rate=15 ;;
esac
cost=$(awk -v i="$input_tokens" -v o="$output_tokens" -v ir="$in_rate" -v orr="$out_rate" \
  'BEGIN { printf "%.4f", (i/1000000*ir) + (o/1000000*orr) }')

result_line="$RESULT"
[ -n "${REASON:-}" ] && result_line="$RESULT ($REASON)"

{
  echo ""
  echo "## $(date -u +%Y-%m-%d) — Issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}"
  echo ""
  echo "- **Result:** ${result_line}"
  echo "- **PR:** ${PR_REF:-—}"
  echo "- **Milestone:** ${MILESTONE:-—}"
  echo "- **Model:** ${MODEL}"
  echo "- **Execution Duration:** ${DURATION} seconds"
  echo "- **Turns:** ${turns}"
  echo "- **Input Tokens:** ${input_tokens}"
  echo "- **Output Tokens:** ${output_tokens}"
  echo "- **Estimated Cost:** \$${cost} (notional — see above)"
  echo "- **Run:** ${RUN_URL}"
} >> "$JOURNAL"

# Recompute the velocity table from real entries only. Slicing at
# ENTRIES_START keeps the format example in the header from being counted as
# a data point, which would silently skew every mean.
python3 - <<'PYEOF'
import re

with open("docs/journal.md") as f:
    text = f.read()

marker = "<!-- ENTRIES_START -->"
entries = text[text.index(marker):] if marker in text else ""

def nums(pattern, cast=int):
    return [cast(x) for x in re.findall(pattern, entries)]

durations = nums(r"\*\*Execution Duration:\*\* (\d+) seconds")
turns     = nums(r"\*\*Turns:\*\* (\d+)\b")
outputs   = nums(r"\*\*Output Tokens:\*\* (\d+)\b")
costs     = nums(r"\*\*Estimated Cost:\*\* \$([0-9.]+)", float)
successes = len(re.findall(r"\*\*Result:\*\* success", entries))

def mean(xs):
    return sum(xs) / len(xs) if xs else None

def fmt_dur(s):
    if s is None:
        return "n/a"
    return f"{int(s)//60}m {int(s)%60:02d}s"

def fmt(v, spec="{:.0f}"):
    return "n/a" if v is None else spec.format(v)

table = f"""<!-- VELOCITY_START -->
| Metric | Value |
|---|---|
| Issues with recorded metrics | {len(durations)} |
| Successful runs | {successes} |
| Mean time per issue | {fmt_dur(mean(durations))} |
| Mean turns per issue | {fmt(mean(turns))} |
| Mean output tokens per issue | {fmt(mean(outputs), "{:,.0f}")} |
| Mean estimated cost per issue | {"n/a" if mean(costs) is None else f"${mean(costs):.4f}"} |
<!-- VELOCITY_END -->"""

text = re.sub(
    r"<!-- VELOCITY_START -->.*?<!-- VELOCITY_END -->",
    lambda _: table,
    text,
    flags=re.DOTALL,
)

with open("docs/journal.md", "w") as f:
    f.write(text)
PYEOF

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add "$JOURNAL"
git diff --staged --quiet && { echo "no journal change"; exit 0; }
git commit -q -m "docs(journal): record issue #${ISSUE_NUMBER} run"

# HEAD is the pristine origin/main + exactly one journal commit, so pushing
# it can never publish anything else. Rebase to absorb concurrent journal
# pushes from other runs.
for attempt in 1 2 3; do
  git fetch -q origin main && git rebase -q origin/main && \
    git push --quiet origin HEAD:main && { echo "journal updated"; exit 0; }
  echo "push attempt $attempt failed; retrying"
  sleep 3
done
echo "WARNING: could not push journal entry (metrics preserved in artifact)"
exit 0
