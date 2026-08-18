# Design: ai-app-factory-intake-test-2

## Problem

The factory's intake path was verified end-to-end on 2026-08-18 (issue #36 → PR #37), and that test is precisely what surfaced the `labels=` permission bug now recorded under "Write path" in this repo's `DESIGN.md`: a `labels=` query param on an `issues/new` deep link is **silently dropped** for anyone who is not already a repo collaborator with label-write access. The trigger for `draft-design-doc.yml` was moved off the label and onto a `[new-project-ask] ` title prefix in commit `f4c57fa` as a result.

That fix has not yet been observed working under the conditions it exists for. The first test was opened by the repo owner, who *does* hold label-write access — so the issue arrived labelled, and the label-based trigger would have fired regardless of whether the title-prefix trigger worked at all. The owner structurally cannot reproduce a non-collaborator's experience by submitting normally, which is the same blind spot that let the original bug ship in the first place. Until an unlabelled `[new-project-ask] ` issue is seen to fire the workflow on its own, "fixed" is an inference from reading the workflow file, not an observation.

## Goal

Reproduce a non-collaborator requester's submission faithfully enough to prove the title-prefix trigger stands alone, by opening an intake issue **deliberately without** the `new-project-ask` label — the exact artifact an arbitrary requester's deep link would produce once their `labels=` param is dropped — and confirming that the full intake chain still runs to completion from the title alone.

The project name (`ai-app-factory-intake-test-2`) is a placeholder for a real ask. There is no application to build here; the subject under test is the factory's own front door.

## Non-goals

- **Building anything.** No repo is provisioned, no milestones are seeded, no `claude-go` issue is filed. This proposal is the terminal artifact of the run, not the start of one. See "Disposal" below.
- **Re-testing what #36 already covered.** Drafting quality, the `**Requested by:**` stamp, PR creation, the intake-issue comment-and-close — all of that was observed working on 2026-08-18 and is only re-exercised here incidentally. The single new variable is the absence of the label.
- **Testing gate #2 or anything downstream of it.** Provisioning (`factory-new.sh`, `factory-secrets.sh`, `seed-milestones.yml`) is out of scope; this PR is closed, not merged, so nothing downstream is ever reached.
- **Simulating a non-collaborator by proxy account.** Opening the issue from a genuinely non-collaborator GitHub account would be a stricter test, but it is not the one that matters: the label param is the *only* behaviour that differs between the two, and omitting the label reproduces its effect exactly. A second account would add setup cost and a second variable without adding coverage of the mechanism under test.
- **Verifying the identical bug in `review-approve`/`review-reject`.** `DESIGN.md` notes that the not-yet-built PR review/merge deep links have the same design flaw, already corrected on paper to a title prefix. Those workflows do not exist yet, so there is nothing to run; this test's result is nonetheless the evidence that the chosen fix works before they are implemented against it.

## Architecture

There is no software here. The "architecture" is the test procedure and its observation points.

**Submission.** One issue opened against `ai-app-factory` titled `[new-project-ask] ai-app-factory-intake-test-2`, with the requirements as its body, and **no labels applied at creation time**. This is issue #38.

**Trigger under test.** `draft-design-doc.yml` fires on `issues: opened`, filtered on the `[new-project-ask] ` title prefix. The critical property is negative: at the moment the workflow's condition is evaluated, the issue carries no `new-project-ask` label, so a run that starts at all can only have started because of the title. Any label the workflow applies afterward is bookkeeping and cannot have influenced the trigger — the ordering is what makes this test conclusive rather than merely suggestive.

**Identity.** The requester is `github.event.issue.user.login`, taken from the issue's authenticated author. This path is unaffected by the label change, but it is worth noting that it is also unaffected by *any* query-param dropping: unlike `labels=`, identity is never carried in the deep link and so cannot be silently lost. It is the property that makes the label's unreliability tolerable rather than fatal.

**Artifacts.** A branch `design/ai-app-factory-intake-test-2`, this file at `docs/proposals/ai-app-factory-intake-test-2.md`, and a PR against `main` titled `Design: ai-app-factory-intake-test-2` with the requester line prepended to its description.

## What a successful run proves

1. `draft-design-doc.yml` started on an issue that was unlabelled when it was opened — the title prefix alone is sufficient to trigger intake.
2. The requester is stamped correctly onto both this doc and the PR description, from the authenticated issue author.
3. This doc lands at `docs/proposals/ai-app-factory-intake-test-2.md` on its own branch, with `DESIGN.md` and every other tracked file untouched.
4. The PR opens against `main` and stops there — gate #1 holds, and nothing downstream of a merge is reached.
5. The intake issue is commented on with a link to the PR and closed.

Failure of step 1 is the finding this test exists to catch, and would mean the title-prefix fix is incomplete — a bug against `ai-app-factory` itself, not against this "project". Failures in steps 2–5 would be regressions in behaviour #36 already proved, and belong in the same place.

## Milestones

None. A test run does not accrue milestones; the acceptance criteria above are the whole of the work, and they are satisfied or not at the moment the PR appears.

## Disposal

**This PR is closed without merging once the checklist above is confirmed.** Merging it would open gate #1 on a project that does not exist and should not be provisioned — the run is complete the moment the PR is observed, and the close is part of the intended path rather than a cleanup after a failure.

Intake issue #38 is closed by the workflow. This file is disposable along with the PR; it is deliberately *not* merged into `main`, so unlike the smoke test's artifacts it leaves no trace in the repo beyond the closed PR itself, which is sufficient as the record that the check was run and what it showed. The finding it produces — confirmed or not — belongs in `DESIGN.md` alongside the M5 note that records the original `labels=` bug, so that the fix and its verification sit together.
