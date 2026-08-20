# Brief: make ai-app-factory builds genuinely unattended

**For:** Claude Code, working in the `ai-app-factory` repo
**Goal:** a factory-scaffolded project should run from first issue to final
milestone with **one** human interaction at the very start — approve the design
doc, provide the PAT — and no further input until it's finished or it fails.

Change this in the **factory templates**, so every future project inherits it.
`ai-app-factory-cov-pubs` is the worked example of what currently goes wrong.

---

## What actually happens today

The `cov-pubs` build stopped dead after one issue and sat idle for four hours.
Three separate reasons, none of them a bug — all of them design gaps:

1. **Nothing advances the queue.** `.github/workflows/claude.yml` triggers only
   on `issues: labeled` with `claude-go`, on an `@claude` comment, or on manual
   `workflow_dispatch`. One run produces one PR and stops. A human must label
   every single issue.
2. **Nothing merges the PR.** No auto-merge, so the branch sits there and every
   dependent issue is blocked behind it.
3. **No CI ran on the PR at all**, so there was nothing to gate a merge on
   anyway. The agent said in its own PR body that it couldn't execute `pytest`
   and asked a human to run it. It was right to say so — but that's a gate that
   should not exist.

Net effect: ~12 label-verify-merge cycles of human babysitting, plus 3
`lane:manual` issues. The README calls this "unattended". It isn't.

---

## The GitHub behaviour that breaks the obvious fix

Read this before writing any code, because it invalidates the naive approach.

**Events created using the default `GITHUB_TOKEN` do not start new workflow
runs.** GitHub does this deliberately to stop workflows triggering themselves
in an infinite loop. Two consequences:

- A workflow that labels the next issue with `GITHUB_TOKEN` will apply the
  label and **nothing will happen**. Silent no-op. This is the single most
  common way an "auto-advance" pipeline fails.
- A PR opened using `GITHUB_TOKEN` doesn't reliably fire `pull_request` CI.
  **This is why PR #17 had zero checks.**

`workflow_dispatch` and `repository_dispatch` are the documented exceptions —
they *do* start runs even when dispatched from inside Actions.

So there are two viable routes, and I'd take the first:

| Route | How | Trade-off |
|---|---|---|
| **A. `workflow_dispatch`** (preferred) | The advance step calls `gh workflow run claude.yml -f issue=<n>`. `claude.yml` already accepts this input. | No PAT needed for advancing. Needs `permissions: actions: write`. |
| **B. PAT or GitHub App token** | Store a PAT as `PIPELINE_PAT`; use it to label issues and open PRs. | Needed anyway so PRs trigger CI. App token is better than a PAT — scoped, auto-rotating, not tied to Mick's account. |

Realistically you need **B for opening PRs** (so CI runs on them) and can use
**A for advancing**. Don't skip B and wonder why checks never appear.

---

## Required changes

### 1. Add a real CI workflow — do this first

Nothing else is safe without it. Create `templates/workflows/test.yml`:

- Triggers on `pull_request`
- Detects project type and runs the right suite (`pytest`, `npm test`, both)
- Must run to completion at least once before its name can be selected as a
  required status check

Auto-merge without CI is just merging unreviewed AI output. CI is what makes
removing the human gate defensible rather than reckless.

### 2. Make the agent verify its own work before opening the PR

The root cause of the manual gate: the agent wrote tests it could not run. In
`claude.yml`, before the PR step:

- Install dependencies (`pip install -r requirements.txt`, `npm ci`)
- Run the test suite
- **If tests fail, do not open a PR.** Comment the failure on the issue,
  label it `pipeline:failed`, and stop.

An agent that can run its own tests doesn't need to ask permission.

### 3. Enable auto-merge, gated on those checks

One-time repo settings (script these in `factory-new.sh`, don't leave them to
be clicked):

- Settings → General → **Allow auto-merge**
- Branch protection or a ruleset on `main`: **Require status checks to pass**,
  with the `test.yml` check selected

Then in `claude.yml` after opening the PR:

```bash
gh pr merge "$PR" --auto --squash --delete-branch
```

**Gotcha:** `--auto` now returns HTTP 422 if the PR doesn't yet meet its
requirements. Retry with backoff, or handle 422 as "not ready yet" rather than
letting the step fail the job.

### 4. Auto-advance to the next issue

New `templates/workflows/advance.yml`, triggered on `pull_request: [closed]`:

```
if: github.event.pull_request.merged == true
```

Steps:

1. Find the next open issue that has the pipeline label, does **not** have
   `lane:manual` or `lane:interactive`, and is next in milestone order.
   Order matters — M2 depends on M1. Sort by milestone then issue number.
2. If none remain → the build is done. Post a summary, label the milestone
   complete, stop.
3. If one exists → `gh workflow run claude.yml -f issue=<n>`
   (route A — works from `GITHUB_TOKEN`, unlike labelling).

### 5. One at a time

```yaml
concurrency:
  group: pipeline-${{ github.repository }}
  cancel-in-progress: false
```

The journal already notes that overlapping PRs cause conflicts. Serialise it.
Parallelism here buys minutes and costs merge hell.

### 6. Stop on failure — do not cascade

If a run fails, or CI fails, or auto-merge can't complete after N retries:

- Label the issue `pipeline:failed`
- Open one summary issue titled "Pipeline halted at #N" with the run log link
- **Do not advance.** A pipeline that keeps going after a failure produces a
  pile of broken PRs on top of a broken foundation.

### 7. Runaway guard

Unattended plus a paid API is exactly where cost accidents happen.

- A `pipeline:stop` label on any issue halts the chain at the next check
- Hard cap on consecutive runs per milestone (e.g. 25) — bail past it
- Budget ceiling read from the journal's running cost total; halt and notify
  when exceeded
- Every run appends to `docs/journal.md` as it already does

### 8. Get `lane:manual` off the critical path

Three of 16 issues were `lane:manual`, which means the "unattended" run stops
three times regardless of everything above. At **design-doc time**, the
generator should classify each manual step:

- **Automatable with a secret** → automate it. The ONS postcode extract (#8)
  is a scripted download and commit, not a human task.
- **Genuinely human** → moderation policy (#13) is a real judgement call.
  Put it **after** the pipeline completes, never in the middle. Ship with
  submissions queued and unpublished; Mick moderates when he's ready.
- **One-time setup** → custom domain, DNS (#16). Front-load into the approval
  step at the start, where the human already is.

Rule for the design generator: **no `lane:manual` issue may block a later
issue.** If it would, redesign it.

### 9. Front-load everything human into the approval step

At `factory-new.sh` time, collect once and store as repo secrets:

- `CLAUDE_CODE_OAUTH_TOKEN`
- `PIPELINE_PAT` (or install the GitHub App)
- Custom domain / DNS choices
- Cost ceiling

Then the human sees the design doc, approves, and walks away.

---

## Acceptance criteria

A scaffolded project is unattended when all of these hold:

- [ ] Scaffold → approve design doc → provide PAT → **zero further input**
- [ ] Merging a PR automatically starts the next issue within a minute
- [ ] Every PR shows CI checks that actually ran
- [ ] No PR ever waits on a human when its checks are green
- [ ] A failure halts the chain and files one clear issue
- [ ] `docs/journal.md` tells the whole story without opening Actions
- [ ] Killable mid-flight with a `pipeline:stop` label
- [ ] No `lane:manual` issue blocks a later one

Test it end to end by re-running the cov-pubs brief into a fresh repo and
walking away. If it needs one click after approval, it isn't done.

---

## Deliberately still manual

Worth stating in the README so "unattended" means something precise:

- Approving the design doc — the point of the whole product
- Content moderation of user submissions — judgement, and a legal question
- Anything spending money outside the API budget
- Production secrets and DNS

---

## One honest note

Tonight's manual gate caught something real: the agent shipped code it hadn't
executed and said so. When you remove the human, **CI has to inherit that
scepticism.** The goal isn't to delete the check — it's to move it from Mick's
evening into a workflow that runs in forty seconds. If change 1 and change 2
aren't solid, the rest of this is just merging unverified output faster.

