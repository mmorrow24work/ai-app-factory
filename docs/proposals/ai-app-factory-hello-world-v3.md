# Design: ai-app-factory-hello-world-v3

**Requested by:** @mmorrow2012

## Problem

The ask behind this doc is word-for-word the ask behind `ai-app-factory-hello-world` (issue #31 → PR #31, provisioned 2026-08-17): *"Create a simple hello-world site to test the ai-app-factory build process."* Drafting a third design for the same one-sentence ask is only defensible if the thing being tested has changed — and it has, twice, in the hours before this doc was drafted.

**What v1 already proved, and therefore what v3 must not re-prove.** `ai-app-factory-hello-world` was provisioned, seeded, and carried through two of its three milestones unattended: issues #1 (`index.html` + `style.css`) and #2 (the `pytest` suite) are closed and merged, #3 (`about.html` + README) is still open. Its Pages source is set to `build_type: workflow` with `pages-deploy.yml` committed at provisioning time, exactly as v1's design predicted the `Workflows`/`Pages` token exclusions would require. The deployed-artifact question and the per-project-token permission edges — v1's two stated reasons to exist — are answered.

**What v1 structurally could not prove.** Every step of it was driven by the repo owner. The intake issue, the merge of the design PR, the provisioning, and even the live test of `review-decision.yml` (`[review-approve] PR #7`, `[review-reject] PR #9`) were all opened by an account with write access to the repos involved. This repo's `DESIGN.md` records two separate bugs found *only* when a real outside account finally tried the same path — a `labels=` query param silently dropped for non-collaborators, and `claude-code-action` refusing to run at all for an actor without write access. Both were found the same way: by discovering that a passing owner-run test had structurally excluded the failure mode that mattered.

**v2 is the direct evidence that this is still unfinished.** Issue #40 (`[new-project-ask] ai-app-factory-hello-world-v2`, opened 2026-08-18 10:32 UTC by `mmorrow2012`, a non-collaborator) carried this identical ask and produced no design doc and no PR — only an `OK` comment. It was submitted roughly nine minutes before commit `884ba40` landed the `allowed_non_write_users: "*"` fix. Issue #41, which produced this doc, is the same ask resubmitted immediately after that fix.

So the subject of v3 is not the site, and not the build pipeline that v1 exercised. It is the **requester-facing half of the loop**: everything that happens when the person asking for a project is not the person who owns the factory.

## Goal

`ai-app-factory-hello-world-v3` is a deliberately trivial static site — a page that says hello, an "about" page describing the pipeline that built it, and nothing else — published to GitHub Pages at `https://mmorrow24work.github.io/ai-app-factory-hello-world-v3/`.

The site is the pretext. Its purpose is to be the factory's first run driven end-to-end by a **non-collaborator requester** (`mmorrow2012`), covering the three things v1 left untested because the owner did them:

1. **Zero-credential intake by a real outside account**, through the title-marker trigger and past the `claude-code-action` write-access check — the two fixes made on 2026-08-18, neither of which has yet carried a request all the way to a merged design doc. (Getting *this* doc drafted is the first half of that proof; it is not the whole of it.)
2. **Requester-driven review/merge autonomy**, per `DESIGN.md`'s "the requester gets full autonomy over their own project's review/merge decisions". `review-decision.yml` was verified live on v1, but v1's README predates the `Requested by` line, so its authorization check fell through to the owner-only branch every time. v3 will be the first repo provisioned with `--set REQUESTER_GITHUB=mmorrow2012`, and therefore the first where the requester-match branch of that check is exercised against a real, recorded, non-owner login.
3. **Cross-device operation with nothing to log into** — the requester acting on GitHub notifications from whatever device they have, never visiting the factory site to authenticate, because there is nothing there to authenticate against.

As with v1 and the original smoke test, the site stays small enough that any failure is unambiguously the pipeline's fault rather than the requirements'.

## Non-goals

- **Re-testing what v1 tested.** The deploy path, the `custom-script`-template-for-a-static-site mismatch, and the `Workflows`/`Pages` token exclusions are settled. v3 inherits v1's answers rather than re-deriving them; if any of them breaks, that is a regression finding, not the point of the run.
- **Being a real site, or a better site than v1.** Two pages, no framework, no router, no analytics, no forms, no theming system, no custom domain. "It would be more useful if it also…" defeats the purpose.
- **Third-party dependencies.** No npm packages, no build step, no lockfile — same reasoning as both predecessors: a red run must never be attributable to a registry outage or a version conflict. The node-toolchain path stays deliberately unproven here (see "Open questions").
- **Touching, fixing, or superseding v1.** `ai-app-factory-hello-world` keeps its open M3 issue and its own lifecycle. v3 does not migrate it, close it, or reuse its repo.
- **Testing the factory's own SvelteKit dashboard.** `site/` in this repo is unrelated to this project and untouched by it.
- **Long-term maintenance.** Disposable. See "Disposal".

## Architecture

**Type:** `custom-script` (per `templates/custom-script`), the same imperfect fit v1 documented — the template is shaped around a single entry-point script plus a `pytest` suite, and this project's main artifact is `index.html`. v1 already logged this as a finding for `ai-app-factory`; v3 reuses the same workaround (`--set ENTRY_POINT=index.html`) rather than reopening the question.

Provisioning invocation, for the M6 provisioning issue:

```
scripts/factory-new.sh custom-script ai-app-factory-hello-world-v3 \
  --ask "Create a simple hello-world site to test the ai-app-factory build process" \
  --set ENTRY_POINT=index.html \
  --set REQUESTER_GITHUB=mmorrow2012
```

`REQUESTER_GITHUB` is load-bearing here in a way it was not on v1. It renders `templates/_shared/REQUESTED_BY.md.tmpl` into the new repo's `README.md` as `[@mmorrow2012](https://github.com/mmorrow2012), via ai-app-factory`, which is the exact string `review-decision.yml` greps back out to decide whether an incoming `[review-approve] PR #<n>` issue is authorized. Get this wrong and the requester silently loses the ability to merge their own PRs, falling back to owner-only — which is precisely the v1 behaviour this run exists to move past.

**Shape:** hand-written static files at the repo root, no build step:

```
index.html          The hello page
about.html          What built this, and how
style.css           A few dozen lines, no framework
tests/              pytest suite, Python stdlib only
```

**Paths must be relative.** A GitHub Pages *project* site is served from `/ai-app-factory-hello-world-v3/`, not from the domain root, so `/style.css` resolves to `mmorrow24work.github.io/style.css` and 404s. This is invisible when previewing files locally and is the single genuine bug class a hello-world site has, so it is encoded as a test rather than as prose — same as v1.

**Testing:** `pytest`, Python stdlib only (`html.parser`, `pathlib`), no network access. The suite asserts each HTML file parses; that required elements are present (`<title>`, one `<h1>`, `<meta charset>`, `lang` on `<html>`); that every local `href`/`src` is relative and resolves to a file that exists; and that the two pages link to each other. Keeping the default `TEST_COMMAND=pytest` means no `--set` override and the generated `CLAUDE.md`'s definition of done works unmodified.

**Deployment:** `pages-deploy.yml` (`actions/upload-pages-artifact` → `actions/deploy-pages`), uploading the repo root with no build step. Committed by the human at provisioning time, because each project's `GH_PAT` deliberately excludes `Workflows` and `Pages`; Settings → Pages → Source set to "GitHub Actions" in the same sitting. Copy v1's file verbatim — it is known-good and this is not the variable under test.

### The path actually under test

The interesting part of v3 is not the repo's contents but who touches it, and when. The sequence, and which links in it have never run for a non-collaborator:

| Step | Actor | Status before v3 |
| --- | --- | --- |
| Intake issue via title-marker deep link | requester | Ran for real on #41 (this doc) |
| `draft-design-doc.yml` past the write-access check | pipeline | First run is the one that produced this doc |
| Merge the design PR — **gate #1** | owner | Proven on v1 |
| Provision + mint scoped `GH_PAT` — **gate #2** | owner | Proven on v1 |
| `seed-milestones.yml` → milestones + `claude-go` issues | pipeline | Proven on v1 |
| `claude.yml` implements each issue, opens a PR | pipeline | Proven on v1 (issues #1, #2) |
| A PR needing a decision surfaces as an approve/reject issue | *nothing* | **Does not exist** — see below |
| `review-decision.yml` merges/closes on the requester's say-so | pipeline | Ran on v1, but only ever via the owner-only branch |

**The known missing link:** `DESIGN.md` records that the `pull_request: opened` reviewer workflow — the thing that decides a PR needs a decision and opens the `[review-approve]`/`[review-reject]` issue — is still not built. Until it is, nothing opens those issues automatically, and the requester reaches the decision by hand-constructing an issue URL. v3 is runnable in that state (the requester is told the URL shape once), but it makes the run a test of the *execution* half of autonomy rather than the whole of it. Whether to build the reviewer workflow first is the main open question below.

## What a successful run proves

The pass condition is about the pipeline, not the site:

1. A non-collaborator's intake issue (#41) produced this design doc as a PR against `main`, with `**Requested by:** @mmorrow2012` stamped from the issue's authenticated author rather than self-reported — i.e. both 2026-08-18 intake fixes hold for a real outside account, not just for the owner.
2. Merging that PR opened a provisioning issue in *this* repo carrying the `factory-new.sh` invocation above, including `REQUESTER_GITHUB`, and touched no other repo.
3. The provisioned repo's `README.md` contains the rendered `Requested by` line, and `review-decision.yml`'s extraction finds `mmorrow2012` in it — verifiable before any PR exists, by reading the file.
4. `seed-milestones.yml`, fired by hand, turned this doc into milestones M1–M3 with `claude-go` issues, using only that repo's own secrets.
5. `claude.yml` implemented each issue unattended and opened a PR meeting its own definition of done.
6. **The requester — not the owner — approved each PR**, via a `[review-approve] PR #<n>` issue opened from their own account, and `review-decision.yml` merged it through the requester-match branch of its authorization check. This is the step v1 could not produce.
7. Each merge deployed, and the site was live and correct under the `/ai-app-factory-hello-world-v3/` subpath — where a relative-path mistake shows up.
8. `docs/journal.md` in the new repo accumulated one entry per merged run, appended by the workflow and never by a PR branch.
9. The project rendered on the dashboard with its ask, elapsed time, token burn, and commit heatmap, alongside v1 rather than replacing it.

Two things a successful run still will **not** prove, and should not be claimed as proven:

- **The authorization *deny* path.** Confirming that a third party's `[review-approve]` issue is refused needs a third GitHub account that is neither owner nor requester. `DESIGN.md` already flags this as code-review-only; v3 does not change that unless someone supplies the account.
- **Anything about the node/npm toolchain**, which this project deliberately avoids.

Any step needing unplanned human intervention is a finding, and findings belong as issues against `ai-app-factory` — never as scope added to this site.

## Milestones

- **M0 — Bootstrap.** Repo created from the `custom-script` template with `ENTRY_POINT` and `REQUESTER_GITHUB` set, label taxonomy applied, `docs/journal.md` seeded, `claude.yml` / `seed-milestones.yml` / `review-decision.yml` in place, registered in `projects.json` with `requesterGithub: mmorrow2012` — plus the two steps the pipeline cannot do for itself: `pages-deploy.yml` committed and Pages set to deploy from GitHub Actions. Human, at provisioning time; no `claude-go` issue. Verify the rendered `Requested by` line before moving on, since every later autonomy step depends on it.
- **M1 — The page.** `index.html` and `style.css`: a greeting, the project name, and a line naming the ask and the intake issue it came from. Valid HTML5 with `lang`, `<meta charset>`, `<title>`, viewport meta. All asset references relative. First deploy goes live.
- **M2 — Tests.** The `pytest` suite described above — parse, required elements, relative-only local references, every referenced file exists. No network access in CI.
- **M3 — About page and README.** `about.html`, linked from `index.html` and linking back, tracing the pipeline steps that produced the site — written for someone who has never seen this repo, and explicitly naming which steps were the requester's and which were the owner's, since that distinction is what this run exists to demonstrate. README with the project URL, how to view locally, and a statement that this is a factory test rather than a maintained project.

Three `claude-go` issues across M1–M3, sequenced so each PR merges before the next starts — three separate requester approve/reject decisions, which is the sample size that matters here, at roughly v1's token cost.

## Open questions for review

Answer these in this PR before merging; each is a real fork rather than a detail to defer.

1. **Build the `pull_request: opened` reviewer workflow first, or run v3 without it?** Without it, the requester reaches their approve/reject decision only by hand-constructing an issue URL, so v3 tests execution but not discovery — and "the requester never finds out a PR is waiting" is a plausible real failure this run would then miss entirely. Building it first delays v3 and makes the run a test of two new things at once. The recommendation is to run v3 as designed and treat the manual URL hand-off as an explicitly logged gap, on the grounds that the reviewer workflow is better designed against evidence from a real requester-driven run than before one.
2. **Is a third hello-world the right vehicle at all, versus finishing v1's open M3 issue as the test?** v1 is already provisioned with a live Pages deployment and one unstarted milestone. Reusing it would cost nothing to provision — but its README predates the `Requested by` line, so the requester-autonomy path, the entire point of v3, would still fall through to owner-only unless that README is edited first. Editing it is a one-line change and a legitimate alternative to a whole new repo; a fresh repo is proposed instead because it also exercises provisioning-with-`REQUESTER_GITHUB` end to end, which is where the value most plausibly gets dropped. Decide explicitly rather than by default.
3. **No build step, or exercise the npm path?** Carried forward unresolved from v1. Drafted dependency-free so a red run can only mean the pipeline broke; the cost is that `npm ci`, a lockfile, and a framework build stay untested even though the factory's own dashboard is SvelteKit. Recommendation unchanged: keep this run dependency-free and prove the node path with a separate later project, so the two variables stay separated.
4. **Should the provisioning issue carry an explicit M0 checklist?** The human-only steps (commit `pages-deploy.yml`, enable Pages, confirm the `Requested by` line rendered) are each easy to forget, and each fails quietly — a missed Pages setting gives a green Actions run with no live site, and a missed `Requested by` line gives working merges that silently required the owner. That is a change to `ai-app-factory`'s `generate-issues.yml`, not to this project, but v3 is the second consecutive run to want it.

## Disposal

When M3 closes, this project has served its purpose. Two live hello-world deployments is one more than the factory needs as a standing check that the deploy path still works, so v1 and v3 should not both stay `active`: keep whichever has the more complete history — likely v3, since it will be the one with the full requester-driven journal — and set the other's `projects.json` status to something non-active so it stops competing for attention on the dashboard alongside real work. If either repo is deleted outright, remove its `projects.json` entry in the same change, as was done for `ai-app-factory-smoke-test`.
