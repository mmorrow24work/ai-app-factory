# Design: ai-app-factory-hello-world-v4

## Problem

This is the fourth design doc drafted from the identical one-sentence ask — *"Create a simple hello-world site to test the ai-app-factory build process"* — after `ai-app-factory-hello-world` (#31), v2 (#40, which produced nothing), and v3 (#41). A fourth is only defensible if it tests something the first three structurally could not, so the first job of this doc is to establish, from live evidence rather than assumption, what is actually still unproven at the moment it was written.

**The timeline matters, and it is unusually tight.** Recorded as observed on 2026-08-18:

| Time (UTC) | Event |
| --- | --- |
| 10:42:58 | Issue #41 opened by `mmorrow2012` — the v3 ask |
| 10:56:35 | PR #43 merged — v3's design approved, gate #1 |
| 11:17:54 | `mmorrow24work/ai-app-factory-hello-world-v3` created — gate #2 |
| 11:38:22 | v3's `seed-milestones` run starts |
| 11:38:41 | **Issue #46 opened — this ask** |

The v4 request arrived **19 seconds after v3's seeding began**. At the time of drafting, `ai-app-factory-hello-world-v3` has zero issues, zero pull requests, and zero requester decisions; its seed run was still `in_progress`. So the honest position is:

**v4 cannot be justified by "v3 proved X, so now test Y."** v3 has so far demonstrated only what its own doc claimed as the first half of its proof — that a non-collaborator's intake reaches a merged design doc and a provisioned repo whose `README.md` carries `[@mmorrow2012](https://github.com/mmorrow2012), via ai-app-factory` (verified directly; the requester-match branch of `review-decision.yml` will find it). Everything downstream of that — the requester approving their own PRs, the deploy, the journal — is still pending on v3, not superseded by v4.

**What the timing does hand v4 is a genuinely new variable: two projects in flight at once.** `DESIGN.md`'s "Multiple concurrent projects & switching devices mid-build" asserts that "concurrency needs no design change… nothing in the pipeline assumes only one build is in flight, so running several at once already works today." That claim has never been tested. Every run to date has been strictly serial — v1 finished its active phase before v3 was provisioned, and v2 died at intake. v4 arriving mid-v3 is the first opportunity to test it, and it is an opportunity that disappears if v4 waits.

**A second, smaller finding surfaced while checking the above, and it is real rather than hypothetical.** v3's own design doc raised, as its open question #4, whether the provisioning issue should carry an explicit M0 checklist, on the grounds that the human-only steps "each fail quietly." As of drafting — ~22 minutes after v3's repo was created — `ai-app-factory-hello-world-v3` contains `claude.yml`, `review-decision.yml`, and `seed-milestones.yml` but **no `pages-deploy.yml`**, and `GET /repos/.../pages` returns 404, meaning Pages is not enabled. This may simply be pending; the human may be mid-sitting. But it is exactly the failure shape v3's doc predicted — seeding has started, tokens are being spent, and the deploy path is not yet wired — and it is worth confirming rather than assuming before v4 repeats the same provisioning.

## Goal

`ai-app-factory-hello-world-v4` is a deliberately trivial static site — a hello page, an about page, and nothing else — published to GitHub Pages at `https://mmorrow24work.github.io/ai-app-factory-hello-world-v4/`.

Its content is **intentionally near-identical to v3's**, because content is not the variable under test. The variable is that it runs *at the same time as v3*, driven by *the same requester account*, against *the same Claude Code subscription*. Specifically, v4 exists to answer:

1. **Does the pipeline actually tolerate two concurrent unattended builds?** Not by inspection of the design, but by running them.
2. **Can one requester tell two near-identical in-flight projects apart well enough to act on them correctly?** Approve/reject is currently reached by hand-constructing an issue URL (`DESIGN.md`: the `pull_request: opened` reviewer workflow is still not built). Two live repos named `…-hello-world-v3` and `…-hello-world-v4`, each with its own PR #1, is the first time a wrong-repo mistake is even possible.
3. **Does the second provisioning get the M0 human steps right**, given that the first one — 20 minutes earlier, same day, same operator — appears not to have (yet).

As with all three predecessors, the site stays small enough that any red run is unambiguously the pipeline's fault rather than the requirements'.

## Non-goals

- **Re-proving v1's or v3's ground.** The deploy path, the `custom-script`-template-for-a-static-site mismatch, the `Workflows`/`Pages` token exclusions, the intake fixes of 2026-08-18, and the requester-stamp mechanism are all either settled or already under test on v3. v4 inherits their answers; a break in any of them is a regression finding, not v4's purpose.
- **Superseding, migrating, or cleaning up v3 or v1.** v4 must not touch either repo. Both keep their own lifecycles — that is a precondition of the concurrency test, not an oversight.
- **Being a better site than v3.** Two pages, no framework, no router, no analytics, no forms. "It would be more useful if it also…" reintroduces content as a variable and destroys the comparison.
- **Third-party dependencies.** No npm packages, no build step, no lockfile — same reasoning as all three predecessors, and doubly so here: with concurrency as the variable under test, a registry outage or version conflict would be indistinguishable from a concurrency failure. See "Open questions" for why the node path still deserves its own project.
- **Testing the factory's own SvelteKit dashboard.** `site/` in this repo is unrelated and untouched, beyond v4 appearing in `projects.json` like any other project.
- **Long-term maintenance.** Disposable. See "Disposal".

## Architecture

**Type:** `custom-script` (per `templates/custom-script`) — the same imperfect fit v1 and v3 both documented, reused deliberately rather than reopened. Issue #27 already tracks the template question against `ai-app-factory` itself.

Provisioning invocation, for the M6 provisioning issue:

```
scripts/factory-new.sh custom-script ai-app-factory-hello-world-v4 \
  --ask "Create a simple hello-world site to test the ai-app-factory build process" \
  --set ENTRY_POINT=index.html \
  --set REQUESTER_GITHUB=mmorrow2012
```

`REQUESTER_GITHUB=mmorrow2012` is mandatory for the same reason it was on v3: it renders `templates/_shared/REQUESTED_BY.md.tmpl` into the new repo's `README.md`, and that rendered line is the exact string `review-decision.yml` greps back out to authorize an incoming `[review-approve] PR #<n>` issue. Omit it and the requester silently loses the ability to merge their own PRs, falling back to owner-only — and on v4 that failure would also be indistinguishable from a concurrency problem, which is worse than it was on v3.

`factory-secrets.sh` mints v4 a **fresh, separate** fine-grained `GH_PAT` scoped to `ai-app-factory-hello-world-v4` alone. Reusing v3's would collapse the per-project blast radius that `DESIGN.md`'s "GH_PAT: token strategy" spent two corrections arriving at, and would also make the concurrency test dishonest — two projects sharing one credential is not the configuration the design claims works.

**Shape:** hand-written static files at the repo root, no build step:

```
index.html          The hello page
about.html          What built this, and how
style.css           A few dozen lines, no framework
tests/              pytest suite, Python stdlib only
```

**Paths must be relative.** A GitHub Pages *project* site is served from `/ai-app-factory-hello-world-v4/`, not the domain root, so `/style.css` resolves to `mmorrow24work.github.io/style.css` and 404s. Invisible when previewing locally; encoded as a test rather than prose, same as v1 and v3.

**Every page states which project it is, visibly.** `index.html` and `about.html` each name `ai-app-factory-hello-world-v4` and intake issue #46 in rendered text, not just in a `<title>` or a comment. This is a concurrency-specific requirement rather than decoration: with a near-identical v3 deployed at an adjacent URL, a screenshot, a tab, or a Pages preview must be self-identifying, or "I checked the site and it was fine" becomes an unverifiable claim.

**Testing:** `pytest`, Python stdlib only (`html.parser`, `pathlib`), no network access. The suite asserts each HTML file parses; that required elements are present (`<title>`, one `<h1>`, `<meta charset>`, `lang` on `<html>`); that every local `href`/`src` is relative and resolves to a file that exists; that the two pages link to each other; and — v4-specific — that the string `ai-app-factory-hello-world-v4` appears in the rendered text of both pages. Keeping the default `TEST_COMMAND=pytest` means no `--set` override and the generated `CLAUDE.md`'s definition of done works unmodified.

**Deployment:** `pages-deploy.yml` (`actions/upload-pages-artifact` → `actions/deploy-pages`), uploading the repo root with no build step, copied verbatim from v1 — known-good, and not the variable under test. Committed by the human at provisioning time, with Settings → Pages → Source set to "GitHub Actions" in the same sitting, because each project's `GH_PAT` deliberately excludes `Workflows` and `Pages`. See M0: on v4 this step is explicitly a checklist item to be confirmed, not assumed.

### What concurrency could plausibly break

Naming the hypotheses up front, so the run either falsifies them or doesn't — rather than concluding "it seemed fine":

- **The shared `CLAUDE_CODE_OAUTH_TOKEN`.** This is the strongest candidate. Every generated repo's `claude.yml` authenticates against the *same* subscription token; per-project isolation is real for `GH_PAT` and non-existent here by design. Two unattended Opus builds running simultaneously is the first time that token has served concurrent load. Rate-limiting, queueing, or a mid-run failure would show up as an unexplained red run in whichever project lost the race — plausibly attributed to the wrong cause if nobody is looking for it.
- **Wrong-repo approve/reject.** `[review-approve] PR #1` is a valid issue title in both repos, and today the requester constructs that URL by hand. There is no cross-check that PR #1 in v4 is the one they actually reviewed. The authorization check in `review-decision.yml` confirms *who* is asking, never *what* they meant.
- **Notification ambiguity.** The same account now receives interleaved GitHub notifications from two repos differing by one character, on mobile, where the repo name is often truncated. `DESIGN.md` leans on GitHub notifications as the entire cross-device layer; this is the first run where that layer has to disambiguate.
- **Dashboard rendering.** `projects.json` will carry three `hello-world` entries with the same `ask` string and the same `requesterGithub`. Whether the sidebar distinguishes them usefully is a real question about the factory's own UI, and it is free to answer here.
- **Actions runner contention.** Shared free-tier minutes across concurrently building public repos. Expected to be a non-issue at this scale; worth noting so a queued run isn't misread as a hang.

Each of these is a finding about `ai-app-factory`, and findings belong as issues against `ai-app-factory` — never as scope added to this site.

## What a successful run proves

The pass condition is about the pipeline, not the site:

1. A non-collaborator's intake issue (#46) produced this design doc as a PR against `main`, with `**Requested by:** @mmorrow2012` stamped from the issue's authenticated author — for the second consecutive time, and this time through the fixed line-position dedup check (commit `3b9c8b8`), which v3's doc was the very thing to break.
2. Merging that PR opened a provisioning issue in *this* repo carrying the invocation above, and touched no other repo.
3. v4 was provisioned **while v3 was still building**, with its own separate `GH_PAT`, and neither project's runs interfered with the other's: no failed run in either repo attributable to the other's existence, and in particular no `CLAUDE_CODE_OAUTH_TOKEN` rate-limit or contention failure.
4. The provisioned repo's `README.md` contains the rendered `Requested by` line — verifiable by reading the file, before any PR exists.
5. M0's human steps were all completed at provisioning time: `pages-deploy.yml` committed **and** Pages set to deploy from GitHub Actions, confirmed by a non-404 `GET /repos/mmorrow24work/ai-app-factory-hello-world-v4/pages`.
6. `seed-milestones.yml`, fired by hand, turned this doc into milestones M1–M3 with `claude-go` issues, using only v4's own secrets.
7. `claude.yml` implemented each issue unattended and opened a PR meeting its own definition of done.
8. **The requester — not the owner — approved each PR** from their own account, and `review-decision.yml` merged it through the requester-match branch, **against the correct repo each time**, with v3 concurrently offering identically-shaped decisions.
9. Each merge deployed, and the site was live and correct under the `/ai-app-factory-hello-world-v4/` subpath, self-identifying as v4 on both pages.
10. `docs/journal.md` in the new repo accumulated one entry per merged run, appended by the workflow and never by a PR branch.
11. All three hello-world projects rendered distinguishably on the dashboard.

Things a successful run still will **not** prove, and which should not be claimed as proven:

- **The authorization *deny* path.** Still needs a third GitHub account that is neither owner nor requester. Unchanged from v1 and v3.
- **Anything about the node/npm toolchain**, deliberately avoided again.
- **Concurrency at any scale beyond two.** Two simultaneous builds is evidence against the strongest failure modes, not proof of general concurrency.
- **That the requester *discovers* a pending decision.** The `pull_request: opened` reviewer workflow is still unbuilt (see "Open questions"), so discovery remains a hand-off by hand-constructed URL.

## Milestones

- **M0 — Bootstrap.** Repo created from the `custom-script` template with `ENTRY_POINT` and `REQUESTER_GITHUB` set, its own freshly-minted scoped `GH_PAT`, label taxonomy applied, `docs/journal.md` seeded, `claude.yml` / `seed-milestones.yml` / `review-decision.yml` in place, registered in `projects.json` with `requesterGithub: mmorrow2012` — plus the two steps the pipeline cannot do for itself: `pages-deploy.yml` committed and Pages set to deploy from GitHub Actions. Human, at provisioning time; no `claude-go` issue. **Confirm three things explicitly before firing `seed-milestones.yml`:** the rendered `Requested by` line, a non-404 `/pages` API response, and that v3 is genuinely still in flight (if v3 has finished, say so in the provisioning issue — the concurrency test has then lapsed and open question 1 needs re-answering).
- **M1 — The page.** `index.html` and `style.css`: a greeting, the project name `ai-app-factory-hello-world-v4` in rendered text, and a line naming the ask and intake issue #46. Valid HTML5 with `lang`, `<meta charset>`, `<title>`, viewport meta. All asset references relative. First deploy goes live.
- **M2 — Tests.** The `pytest` suite described above — parse, required elements, relative-only local references, every referenced file exists, and the v4 self-identification assertion. No network access in CI.
- **M3 — About page and README.** `about.html`, linked from `index.html` and linking back, tracing the pipeline steps that produced the site — written for someone who has never seen this repo, naming which steps were the requester's and which were the owner's, and stating plainly that this project ran alongside v3 and why. README with the project URL, how to view locally, and a statement that this is a factory test rather than a maintained project.

Three `claude-go` issues across M1–M3, sequenced so each PR merges before the next starts — three separate requester approve/reject decisions, at roughly v1's and v3's token cost. Sequencing them keeps the *within-project* behaviour identical to v3, so the only difference between the two runs is that they overlap.

## Open questions for review

Answer these in this PR before merging; each is a real fork rather than a detail to defer.

1. **Should v4 exist at all, or should this ask be closed in favour of letting v3 finish?** This is the load-bearing question and it should be answered deliberately, not by default. The case for closing: v3 is 20 minutes old and has proved none of its downstream claims yet, a fourth identical site is otherwise redundant, and each run costs real tokens. The case for building — and the recommendation — is that the *only* thing a fourth identical ask can uniquely contribute is the concurrency test, that opportunity exists solely because v3 is mid-flight right now, and it costs one extra provisioning to take. If the reviewer prefers to close this, the right disposition is to close #46 with a comment pointing at v3, **not** to merge this doc and provision later — provisioned after v3 finishes, v4 is a fourth serial run proving nothing new.
2. **Confirm or refute the v3 M0 gap before provisioning v4.** As of drafting, v3 has no `pages-deploy.yml` and Pages is not enabled. If that was simply pending, no action beyond noting it. If it was genuinely missed, then v3's own open question #4 — should the provisioning issue carry an explicit M0 checklist — has been answered empirically by the first run after it was asked, and it is a change to `generate-issues.yml` in *this* repo that should probably land before v4 is provisioned rather than after. M0 above compensates by hand; a checklist in the generated issue is the actual fix.
3. **Build the `pull_request: opened` reviewer workflow first?** Carried forward from v3 unresolved. It matters more here than it did there: with two near-identical projects in flight, hand-constructed approve/reject URLs are not just undiscoverable but actively confusable, and "the requester approved the wrong repo's PR #1" is a failure this run can produce for real. Recommendation is still to run without it and log the gap — v4's value is measuring the confusion, and building the workflow first would remove the very thing being measured — but the trade is genuinely closer than it was on v3.
4. **Is the shared `CLAUDE_CODE_OAUTH_TOKEN` acceptable as a permanent single point of contention?** Out of scope to fix here, but v4 is the run most likely to produce the first evidence either way, and `DESIGN.md` currently asserts concurrency works without mentioning that one credential is shared across every project. If the run surfaces contention, that assertion needs revising and the finding belongs as an issue against `ai-app-factory`.
5. **The node/npm path, still unproven after three deferrals.** Recommendation unchanged and now stronger: keep v4 dependency-free — mixing a new toolchain into the concurrency test would confound both — and prove the node path with a separately-named project (`ai-app-factory-hello-world-node` or similar) whose *stated purpose* is the toolchain. Three consecutive docs deferring it suggests it will not happen until something is named for it.

## Disposal

When M3 closes, v4 has served its purpose, and there will be three live hello-world deployments where the factory needs at most one as a standing check that the deploy path still works.

Proposal: once both v3 and v4 have completed, keep whichever has the more complete requester-driven history as the standing check — likely v4 if the concurrency run goes the distance, since its journal would cover both the requester-autonomy path and the concurrency evidence — and set the other two `projects.json` entries to a non-active status so they stop competing for attention on the dashboard alongside real work. Do **not** dispose of v3 before it finishes: half this project's evidence is the comparison between the two.

If any repo is deleted outright, remove its `projects.json` entry in the same change, as was done for `ai-app-factory-smoke-test`.
