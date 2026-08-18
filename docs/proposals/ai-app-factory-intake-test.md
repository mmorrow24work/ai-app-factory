# Design: ai-app-factory-intake-test

## Problem

`draft-design-doc.yml` was redesigned on 2026-08-18 (see `DESIGN.md`, "Write path" and "Requester PII is deliberately minimized"). The trigger changed from a PAT-authenticated `workflow_dispatch` — fired from the site with a credential the requester supplied — to `issues: opened`, filtered to the `new-project-ask` label, with the site reduced to building a pre-filled `issues/new?...&labels=new-project-ask` deep link. That removed the credential from the requester's browser entirely and replaced the self-reported identity fields with the issue author's authenticated GitHub login.

The redesign has never actually fired. Every design doc in `docs/proposals/` predates it or was produced through the old `workflow_dispatch` path, so the new trigger is unproven in exactly the way that matters: the `if:` gate, the issue-resolution step, the dedupe search, the branch/PR the LLM step is expected to produce, and the follow-up step that stamps requester identity and closes the intake issue. Each of those is a place where a wrong expression or a wrong token scope produces a silent no-op — the workflow that never ran and the workflow that ran and did nothing look identical from the issue list.

The factory's two previous dogfood runs (`ai-app-factory-smoke-test`, `ai-app-factory-hello-world`) each used a small real project as the pretext for testing a pipeline stage. Neither is the right instrument here. Both start *downstream* of the intake trigger — they assume a design doc already exists — and both cost a repo, a scoped `GH_PAT`, and a full unattended build to run. Testing one trigger should not cost a project.

## Goal

Verify, once and end to end against the real workflow, that opening a GitHub issue labelled `new-project-ask` in `ai-app-factory` causes `draft-design-doc.yml` to run to completion and produce a reviewable design-doc PR.

There is no application here, and no repo will be created. **This document is the artifact under test.** Its existence on a branch, inside a PR, with a `**Requested by:**` line stamped beneath its title, is itself the evidence that every step of the path worked — which is why the test does not need a project to hang itself on. Intake issue #36 is the input; this file is the output; the PR is the verdict.

The run stops at gate #1. The PR is closed without merging, so `generate-issues.yml` never fires, no provisioning issue is opened, no repo is created, no `GH_PAT` is minted, and no tokens are spent past this single drafting run.

## Non-goals

- **Being a real project.** Nothing gets built, deployed, or maintained. There is no `custom-script`/`nautobot-app`/`netbox-plugin` type to pick, no `factory-new.sh` invocation to infer, no entry point, no test suite. Any reviewer instinct to make this "actually do something useful" defeats the point — the whole value of this run is that the pipeline is the only variable and there is no project to blame a failure on.
- **Testing anything downstream of the design-doc PR.** `generate-issues.yml`, provisioning, `seed-milestones.yml`, and per-project `claude.yml` runs are all out of scope by construction, because merging is what triggers them and this PR will not be merged. Those stages were covered by the `hello-world` run and are unchanged by the intake redesign.
- **Testing the site's `/new` page as a user journey.** Intake issue #36 was opened directly against the repo. `site/src/routes/new/+page.svelte` building the correct deep link is a separate, client-side, statically-verifiable concern; conflating it with the workflow test would make a failure ambiguous. See "What this run does not prove" for the one gap this leaves that genuinely matters.
- **Load, concurrency, or abuse testing.** One issue, one run. Whether two simultaneous intake issues race on branch names or on the dedupe search is a real question and a separate one.
- **Producing a reusable test harness.** This is a single manual verification, not the beginning of an integration-test suite for the factory. If the intake path needs regression coverage later, that is an issue against `ai-app-factory` and probably wants a different mechanism than a throwaway design doc.

## Architecture

There is no system to design. What follows is the path under test — the sequence `draft-design-doc.yml` is expected to execute, enumerated so that a partial failure can be attributed to a specific step rather than to "intake is broken".

**Input.** Issue #36 in `mmorrow24work/ai-app-factory`, titled `ai-app-factory-intake-test`, carrying the `new-project-ask` label at the moment it is opened, authored by an authenticated GitHub account.

**Step 1 — trigger and gate.** `issues: opened` fires. The job's `if:` evaluates `contains(github.event.issue.labels.*.name, 'new-project-ask')`. An unlabelled issue must produce no run at all; a labelled one must produce exactly one.

**Step 2 — resolve.** `gh issue view` reads `number`, `title`, `body`, `author`. The title is slugified to `ai-app-factory-intake-test`, which fixes both the branch name (`design/<slug>`) and the doc path (`docs/proposals/<slug>.md`). This title is already lowercase and hyphenated, so it exercises the slug path's identity case rather than its transformation case — noted as a limit, not a defect.

**Step 3 — dedupe.** `gh pr list --search "\"Design: <title>\" in:title"` must find nothing, and the run must proceed. This step's value shows up *after* the test rather than during it: see "Re-runnability" below.

**Step 4 — draft.** `claude-code-action` runs Opus with `track_progress: false` and a tool allowlist covering `git`, `gh`, `Write`, and friends. It must create the branch, write this file with the mandated `# Design: <title>` first line and nothing else on it, and open a PR against `main` titled `Design: <title>`. Two of this system's known failure classes live here: the action reporting success while opening no PR (previously caused by `track_progress`), and a tool allowlist too narrow for the branch/PR steps.

**Step 5 — stamp and close.** The follow-up shell step checks out the branch, inserts `**Requested by:** @<login>` after line 1 of the doc, commits and pushes it, prepends the same line to the PR body, then comments on #36 with the PR number and closes it. This step is deliberately not the LLM's job, so that identity cannot be paraphrased or skipped — which also makes it the cleanest single indicator that the whole chain ran: the line is either there or it is not.

**Verdict.** The PR either exists with a correctly stamped doc, or it does not. There is no partial credit and nothing to interpret.

## What a successful run proves

1. `issues: opened` with the `new-project-ask` label starts exactly one `draft-design-doc.yml` run, with no `workflow_dispatch` and no PAT involved anywhere.
2. The resolve step read the issue's real title, body, and author, and derived a slug that matches the branch and doc path actually produced.
3. The dedupe search ran without matching, and did not skip a legitimate first submission.
4. `claude-code-action` authenticated on `CLAUDE_CODE_OAUTH_TOKEN`, had enough tool scope to branch and open a PR, and produced a doc whose first line is exactly `# Design: ai-app-factory-intake-test`.
5. The stamp step's `**Requested by:**` line is present in this file (immediately after the title) *and* at the top of the PR body — proving the token used had `contents: write` and `pull-requests: write` against this repo, and that the doc landed at the path the workflow expected rather than somewhere the LLM chose.
6. Issue #36 is closed, with a comment linking the PR — proving `issues: write` and closing the loop for the requester without anyone watching.
7. The PR is reviewable in GitHub's normal review UI, which is where `DESIGN.md`'s non-goal ("no custom rich-text editor for design docs") says all editing belongs.

Anything that needed a human to intervene mid-run is a finding, and findings belong as issues against `ai-app-factory`.

## What this run does not prove

Recorded explicitly so a green result is not over-read.

**The deep link's `labels=` parameter for a requester without write access.** This is the one gap that matters, and it is a plausible real failure. GitHub only honours `labels=` on an `issues/new` URL for users with permission to label issues in the target repo; for anyone else the parameter is silently dropped and the issue opens unlabelled. Since the job gates on the label, and `labeled` is not among the trigger's `types`, such a submission would open an issue that *never* fires the workflow and gives the requester no feedback at all. Issue #36 was opened by the repo owner, so this run cannot detect it. The whole point of the M5 redesign was to serve "an arbitrary requester", per `DESIGN.md`'s 2026-08-18 resolution — so this deserves its own verification with a non-collaborator account, or a design change (adding `labeled` to `types`, or dropping the label gate in favour of matching on issue-form template), filed as an issue against `ai-app-factory` regardless of how this run goes.

**Slug transformation.** A title with uppercase letters, spaces, or punctuation exercises `tr`/`sed` paths this title does not. A title that slugifies to empty is meant to fail loudly at step 2; unverified here.

**Collision with an existing branch or doc.** `docs/proposals/ai-app-factory-intake-test.md` did not previously exist. Re-submitting an ask whose PR was already merged — where dedupe finds no *open* PR but the branch or file already exists — is untested.

**Concurrency.** Two intake issues opened close together are untested, as above.

**Everything downstream of merge.** Untested by construction; this PR is not merged.

## Re-runnability

Closing this PR without merging leaves the intake path re-runnable, which is a property worth stating rather than assuming. The dedupe step searches with `gh pr list`, whose default state filter is `open`, so a closed PR does not match and a future ask with the same title would draft again rather than being silently skipped. If that turns out not to hold in practice, the fix is a change to `draft-design-doc.yml` — and discovering it is a legitimate secondary result of this run.

The branch `design/ai-app-factory-intake-test` should be deleted along with the PR, so a re-run's `git checkout -b` starts clean.

## Milestones

**None, deliberately.** Milestones exist to sequence `claude-go` issues in a generated repo, and there will be no generated repo — the run terminates at gate #1 by design. Recording an empty milestone list here is the honest outcome; inventing M1–M3 for a project that will never be provisioned would put fictional scope into the one document a reviewer uses to decide whether to merge.

## Disposal

1. Confirm the checks in "What a successful run proves" against this PR.
2. **Close this PR without merging.** Merging it would trigger `generate-issues.yml` and open a provisioning issue for a project that does not exist — the one outcome this test must not produce.
3. Delete the `design/ai-app-factory-intake-test` branch.
4. Issue #36 is closed automatically by the workflow's final step; leave it closed, as the record of the input.
5. File any findings — starting with the `labels=` permission gap above, which is worth filing whether or not this run is green — as issues against `ai-app-factory`.

Nothing else needs cleaning up: no repo, no secret, no `projects.json` entry, no dashboard row. That is the advantage of testing the trigger with a document instead of with a project.
