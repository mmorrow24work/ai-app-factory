# Design: test

> **Reviewer, read this first.** This proposal was drafted from an intake submission whose
> project name and requirements were both the literal string `test`. There is no product
> described in it, so this document does not invent one. It records what the submission
> actually exercised, what that proved, and what a reviewer should do with it — which, on the
> most likely reading, is **close this PR unmerged**. See "Recommendation".

## Problem

The factory's M5 path — `/new` intake → PAT-authenticated `workflow_dispatch` → Opus drafts a
design doc → PR opened against `main` — is the first gate in the pipeline described in
`DESIGN.md`. It is also the only gate that is fully automated: everything downstream of it
(merging the design PR, provisioning the repo, seeding milestones) requires a human.

That makes the intake path the one place where a submission containing nothing at all can still
consume a full Opus run and land a branch, a file, and a PR in this repo. This submission is
that case: name `test`, requirements `test`. Two readings are possible, and the drafting run
cannot distinguish them from the input alone:

1. **Someone was checking that the intake form works.** By far the more likely reading — `test`
   in both fields is the canonical shape of a form probe, and the factory has no `test` project
   in `projects.json` or in any milestone.
2. **Someone genuinely wants a project called `test` and submitted no requirements.** Possible,
   but then the submission is missing every input the pipeline needs, and no amount of drafting
   can supply them.

Under either reading the correct output is the same document: an honest record rather than a
fabricated design. Inventing a plausible product here would be actively harmful — a merged
design doc is what a human is asked to provision and spend Opus tokens against, and a design
doc invented from the word `test` would send them building something nobody asked for.

## Goal

Serve as the artifact of an intake-path validation run, and give the reviewer enough to act on:

- Confirm, by existing, that intake → draft → PR works end to end.
- Record the one genuine finding the run surfaced (below), so it can become an issue against
  `ai-app-factory` rather than being lost in a closed PR.
- Tell a submitter who did mean to propose a real project exactly what to put in the form on
  resubmission.

## Non-goals

- **Inventing requirements.** No feature set, no architecture, no milestones are proposed for a
  project named `test`, because none can be derived from the input. `DESIGN.md`'s Non-goals
  section exists to keep scope honest; the same discipline applies to a draft with no scope
  at all.
- **Becoming a second smoke test.** `docs/proposals/ai-app-factory-smoke-test.md` already covers
  deliberate end-to-end validation, with a real (if tiny) tool as its pretext and a defined
  pass condition. This submission is an accidental probe of one stage, not a replacement for
  that, and should not accrete scope until it resembles one.
- **Provisioning anything.** No repo, no `projects.json` entry, no milestones. Registration
  happens at provisioning time, not at draft time — consistent with `ai-app-factory-smoke-test`
  having been removed from `projects.json` when its provisioning was rolled back (`f7c0410`).
- **Changing the intake form.** The finding below belongs in an issue against this repo; fixing
  it is not in the scope of a proposal document.

## Architecture

There is no system to describe. What the submission exercised, and therefore what this document
can attest to, is the drafting path itself:

| Stage | Status |
| --- | --- |
| Intake form accepted the submission and dispatched the workflow | Exercised — the run happened |
| Workflow authenticated and checked out `ai-app-factory` | Exercised |
| Opus read `DESIGN.md` for structure and drafted a proposal | Exercised — this file |
| Branch `design/test` created, `docs/proposals/test.md` written | Exercised |
| PR opened against `main`, titled `Design: test`, left unmerged | Exercised |
| Merge → provisioning issue (M6) | **Not** exercised — and should not be, here |

The remaining stages of the loop in `DESIGN.md` ("Write path") are gated behind a human merging
this PR, which is exactly the behaviour the two-approval-gate design intends: a content-free ask
got as far as a document for review and no further, and no tokens have been spent against a
target repo because no target repo exists.

## Finding

**The intake form accepts a submission with no substantive requirements, and a full Opus drafting
run is spent before anything notices.** The cost of a probe is one drafting run plus a branch and
a PR to clean up. That is small, but it is not zero, and it is paid every time — including by
anyone idly testing the form.

This is a finding about `ai-app-factory`, not about a project named `test`. Per the smoke-test
proposal's convention ("Any step that needs a human to intervene is a finding, and the finding
belongs in this repo as an issue against `ai-app-factory`"), it should be filed as an issue here.
Two directions worth weighing in that issue, neither prejudged by this document:

- **Validate at intake.** A minimum length or content check on the requirements field, and/or a
  reserved-name check on the project name, rejecting in the browser before a `workflow_dispatch`
  is ever sent. Cheapest, and keeps the cost at zero — but the `/new` page is static, so this is
  client-side only and trivially bypassed by dispatching the workflow directly.
- **Validate in the workflow.** A cheap guard step before the Opus call. Robust regardless of how
  the dispatch was triggered, and costs a runner minute rather than a drafting run.

The tension is that the factory's stated premise is that a *vague* ask is legitimate input —
`projects.json`'s own entry for `ai-app-factory` began as one, and turning vagueness into a doc
is the point of M5. Any guard has to separate "vague" from "empty" without rejecting the former,
which is a real design question and the reason this document proposes an issue rather than a fix.

## Recommendation

**Close this PR without merging, and open an issue against `ai-app-factory` for the finding
above.** Merging it would place a contentless design doc in `docs/proposals/`, where M6 treats a
merged proposal as the trigger to draft a provisioning plan for a human — a plan that would, in
this case, ask someone to create a repo called `test` with nothing to build in it.

Deleting the `design/test` branch afterwards is sufficient cleanup; nothing else in the repo was
touched by this run.

If the second reading is the right one and a real project is wanted, the next section says what
the resubmission needs. There is no need to salvage this PR — a fresh intake submission is
cheaper for everyone than editing this document into a design for a project it knows nothing
about, and it keeps the drafted doc traceable to the ask that produced it.

## Resubmitting a real project

The drafting run needs enough to write the four sections `DESIGN.md` leads with. Roughly, the
intake form's requirements field should answer:

- **Problem** — what is currently painful, and who feels it. One or two sentences of the actual
  situation, not a solution.
- **Goal** — what should exist when this is done, in a sentence.
- **Shape** — which of `nautobot-app`, `netbox-plugin`, or `custom-script` it is, if that is
  already obvious; the drafting run will pick one if not, and picking wrong is a cheap thing for
  a reviewer to correct in the PR.
- **Boundaries** — anything explicitly out of scope, and any hard constraints (stdlib-only, no
  new services, must run in CI without network, must target a specific Nautobot/NetBox version).

Vagueness in any of these is fine and expected — the design PR is where it gets resolved, which
is why editing happens in GitHub's review UI rather than in a rich-text editor (`DESIGN.md`,
Non-goals). What the run cannot work around is a field with no information in it at all.

The project name should also be something distinguishable: `test` collides with the most common
throwaway name there is, which makes it a poor identifier for a repo, a `projects.json` key, and
a dashboard sidebar entry that a human has to pick out later.
