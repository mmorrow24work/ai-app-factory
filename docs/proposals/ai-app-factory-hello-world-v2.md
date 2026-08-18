# Design: ai-app-factory-hello-world-v2

**Requested by:** @mmorrow2012

## Problem

`ai-app-factory-hello-world` (v1, provisioned 2026-08-17) was the factory's second dogfood run and it did most of its job: three `claude-go` issues ran unattended and succeeded, `docs/journal.md` accumulated one metrics entry per run, `pages-deploy.yml` deployed on merge, and the site went live at `https://mmorrow24work.github.io/ai-app-factory-hello-world/`. Everything from *seeding* onward is proven.

Everything *before* seeding is not — and it has all been rewritten since. On 2026-08-18 the intake half of the pipeline was redesigned and then fixed three separate times, each fix prompted by a failure that only an actual outside requester could surface:

1. **The `labels=` deep-link param is silently dropped for non-collaborators**, so the original label-triggered intake would never have fired for a real requester. Replaced with a `[new-project-ask] ` title-prefix trigger.
2. **`claude-code-action` refuses to run for any actor without write access**, by default — which is every real requester, by construction. Fixed with `allowed_non_write_users: "*"`.
3. **`review-decision.yml`'s requester-extraction grep died under `set -euo pipefail`** when the README had no "Requested by" line, silently blocking every decision. Fixed with `|| true`.

v1 cannot re-test any of this. Its ask was opened by the repo owner under the old mechanism, and its README predates the `Requested by` section entirely — so its `review-decision.yml` authorization check falls through to owner-only, which is precisely the branch that *isn't* the interesting one. The two live approve/reject tests run against v1 on 2026-08-18 (PRs #7 and #9) were owner-driven for that reason, and `DESIGN.md` still records the requester-authorized path, and the denial path, as unverified by a live run.

**v1 also stalled, in a way worth naming.** Its M3 PR (`Add about.html and rewrite README`, PR #6) has been open and unmerged since 2026-08-17 — not because it failed, but because merging was still a manual human step at the time and nobody performed it. The journal records the run as a success; the site has no about page. That gap between "the pipeline succeeded" and "the thing exists" is the exact failure mode the requester-autonomy design was adopted to close, and it has never been observed closing.

## Goal

`ai-app-factory-hello-world-v2` is the same deliberately trivial static site as v1 — a page that says hello, a short "about" page describing the pipeline that built it, published to GitHub Pages at `https://mmorrow24work.github.io/ai-app-factory-hello-world-v2/`.

The site is again the pretext. The subject is **the current loop, start to finish, driven by a real non-collaborator requester** — the half v1 could not exercise:

- Intake via the fixed issue-deep-link mechanism, from an account with no write access to `ai-app-factory` (already demonstrated once: this document was drafted by `draft-design-doc.yml` firing on issue #40, opened by `@mmorrow2012`).
- A repo scaffolded from the *current* templates, so it carries a `Requested by` line and `review-decision.yml` from birth.
- Every merge decision made by the requester through `[review-approve]` / `[review-reject]` issues, with the owner never in the decision path.

Keeping the requirements byte-identical to v1's is deliberate: it makes this a controlled second run, where any difference in outcome is attributable to the pipeline changes rather than to a different ask.

## Non-goals

- **Being a real site.** No content beyond the two pages, no framework, no router, no analytics, no theming. Same reasoning as v1: the site must stay uninteresting so the pipeline is the only variable.
- **Improving on v1's site.** Not "v1 but better" — a redesign would reintroduce requirements as a variable. If v2's output is dull and near-identical to v1's, the run did what it was supposed to.
- **Third-party dependencies.** No npm packages, no build step, no lockfile. A red run must never be attributable to a registry outage. The node-toolchain path still needs proving eventually; it should be a separate project (see "Open questions").
- **Replacing or deleting v1.** v1 is the factory's only live external Pages deployment and doubles as a standing check that the deploy path still works. v2 stands alongside it. Whether to finally merge or close v1's stranded PR #6 is a decision about v1, not scope here.
- **Fixing the pipeline gaps this run exposes.** Findings become issues against `ai-app-factory`, never scope added to this site.

## Architecture

**Type:** `custom-script` (per `templates/custom-script`), same as v1 and for the same reason — the factory has no static-site type, and this is the only fit. The mismatch (the template is shaped around a single entry-point script plus a `pytest` suite, while the real artifact is `index.html`) is unchanged and still an open question for `ai-app-factory` rather than a problem for this project. Keeping the type identical to v1 is also what makes the two runs comparable.

Provisioning invocation, for the M6 provisioning issue:

```
scripts/factory-new.sh custom-script ai-app-factory-hello-world-v2 \
  --ask "Create a simple hello-world site to test the ai-app-factory build process" \
  --set ENTRY_POINT=index.html \
  --set REQUESTER_GITHUB=mmorrow2012
```

`REQUESTER_GITHUB` is the load-bearing difference from v1's invocation. It stamps the `Requested by` section into the new repo's `README.md`, which is the *only* thing `review-decision.yml` reads to decide whether an approve/reject issue is authorized. Get it wrong or omit it and every requester decision falls through to owner-only — silently, and looking exactly like v1.

**Shape:** hand-written static files at the repo root, no build step:

```
index.html          The hello page
about.html          What built this, and how
style.css           A few dozen lines, no framework
tests/              pytest suite, Python stdlib only
```

**Paths must be relative.** A GitHub Pages *project* site is served from `/ai-app-factory-hello-world-v2/`, not the domain root, so `/style.css` resolves to `mmorrow24work.github.io/style.css` and 404s. This is invisible when previewing files locally and is the single most likely thing an unattended agent with no browser gets wrong, so it is encoded as a test rather than as prose. v1's suite already covers this and passed; carrying the same check forward keeps the comparison honest.

**Testing:** `pytest`, Python stdlib only (`html.parser`, `pathlib`), no network access. The suite asserts each HTML file parses; that required elements are present (`<title>`, one `<h1>`, `<meta charset>`, `lang` on `<html>`); that every local `href`/`src` is relative and resolves to a file that exists; and that the two pages link to each other. The default `TEST_COMMAND=pytest` needs no override.

**Deployment:** a `pages-deploy.yml` workflow uploading the repo root as a Pages artifact (`actions/upload-pages-artifact` → `actions/deploy-pages`), no build step.

### Two things the pipeline still cannot do for itself

Each project's `GH_PAT` is minted with `Contents`, `Issues`, `Pull requests`, `Actions`, `Secrets` — deliberately not `Workflows` and not `Pages`. So, exactly as in v1, a human must do two things at provisioning time:

1. Commit `pages-deploy.yml` into the scaffold.
2. Set Settings → Pages → Source to "GitHub Actions".

**This is v1's most actionable finding, unactioned.** v1 raised it, the run confirmed it, and `templates/custom-script/.github/workflows/` still contains only `claude.yml`, `review-decision.yml`, and `seed-milestones.yml` — no `pages-deploy.yml`. Forgetting step 2 in particular produces a green Actions run and no live site, which reads as success. If v2 hits it again, the recommendation stops being "worth considering" and becomes evidence: the Pages workflow belongs in the templates, and the provisioning issue should emit both steps as an explicit checklist for any design doc that mentions Pages. Both are changes to `ai-app-factory`.

### Review decisions: what's wired and what isn't

`review-decision.yml` ships in the template, so v2's repo gets it at provisioning. With `REQUESTER_GITHUB=mmorrow2012` recorded in the README, `@mmorrow2012` — a non-collaborator on that repo, as every requester is — can merge or close their own PRs by opening `[review-approve] PR #<n>` / `[review-reject] PR #<n>` issues. That is the design working as intended and it has never run for a real requester.

**What does not exist is the thing that opens those issues.** The `pull_request: opened` reviewer workflow described in `DESIGN.md` ("PR review & merge") is still unbuilt, and no site UI surfaces pending decisions. So for this run the requester must construct the decision issue by hand — title `[review-approve] PR #<n>`, any body — from the repo's issue tracker. This is a known, deliberate limitation of running now rather than waiting; the point of v2 is to prove the *execution* half works for a real requester, and hand-constructing the trigger does not weaken that proof. It does mean "the requester never needs anything but GitHub's own UI" is only true in the sense that a hand-typed issue title is still GitHub's own UI.

## What a successful run proves

The project is the test, so the pass condition is about the pipeline. Numbering follows `docs/adr/0001-design-to-issues-loop.md`.

1. **(Already observed.)** A non-collaborator (`@mmorrow2012`) opened a `[new-project-ask] ` issue via the deep link, `draft-design-doc.yml` fired despite the actor having no write access, and this document opened as a PR with the requester stamped from the authenticated issue author. Steps 1–2, under all three 2026-08-18 fixes at once.
2. Merging that PR triggers `generate-issues.yml`, which opens a `Provision mmorrow24work/ai-app-factory-hello-world-v2` issue in *this* repo, carrying both `--set` values — including `REQUESTER_GITHUB`, which v1's provisioning predates — with no `claude-go` label and no attempt to touch another repo (steps 3–4).
3. A human runs `factory-new.sh` + `factory-secrets.sh`, commits `pages-deploy.yml`, enables Pages, and pushes the `projects.json` entry — which now carries `requesterGithub` (step 5).
4. Firing `seed-milestones.yml` fetches this doc unauthenticated from `raw.githubusercontent.com` and creates M1–M3 with `claude-go` issues, using only that repo's own secrets (step 6).
5. `claude.yml` implements each issue unattended and opens a PR meeting its definition of done (step 7).
6. **The new part:** for each PR, `@mmorrow2012` opens a `[review-approve] PR #<n>` issue and the PR actually merges — squash, branch deleted, decision issue commented and closed — authorized by the README's `Requested by` line rather than by repo ownership. The owner takes no action.
7. Each merge deploys, and the site is live and correct at the project URL, including under the `/ai-app-factory-hello-world-v2/` subpath.
8. All three milestones reach "merged and deployed", with no PR left stranded as v1's #6 was.
9. `docs/journal.md` accumulates one entry per merged run, appended by the workflow and never by a PR branch; the project renders on the dashboard with its ask, elapsed time, token burn, and heatmap.

**Worth doing once, deliberately:** have some third account — neither `@mmorrow2012` nor the owner — open a `[review-approve] PR #<n>` issue against this repo and confirm it is acknowledged and closed *without* merging. `DESIGN.md` records this denial path as verified by code review and local shell testing only. It is the one branch of the authorization check that fails open if it is wrong, and this project is the cheapest possible place to find that out.

Any step needing unplanned human intervention is a finding, and findings belong as issues against `ai-app-factory`.

## Milestones

Deliberately identical in shape to v1's, so the two runs are comparable.

- **M0 — Bootstrap.** Repo created from the `custom-script` template with `ENTRY_POINT=index.html` and `REQUESTER_GITHUB=mmorrow2012`, label taxonomy applied, `docs/journal.md` seeded, `claude.yml` / `seed-milestones.yml` / `review-decision.yml` in place, registered in `projects.json` — plus the two steps the pipeline cannot do for itself: `pages-deploy.yml` committed and Pages set to deploy from GitHub Actions. Human, at provisioning time; no `claude-go` issue.
- **M1 — The page.** `index.html` and `style.css`: a greeting, the project name, a line naming the ask it came from. Valid HTML5 with `lang`, `<meta charset>`, `<title>`, viewport meta. All asset references relative. First deploy goes live.
- **M2 — Tests.** The `pytest` suite described above — parse, required elements, relative-only local references, every referenced file exists. No network access in CI.
- **M3 — About page and README.** `about.html`, linked from `index.html` and linking back, tracing the pipeline steps that produced the site, written for someone who has never seen this repo. README with the project URL, how to view locally, and a note that this is a factory test rather than a maintained project. **This is the milestone v1 never landed** — reaching it merged and deployed is the single clearest signal that the requester-autonomy path closed the gap that stranded v1's PR #6.

Three `claude-go` issues across M1–M3, sequenced so each PR merges before the next starts. Each merge is a separate requester decision, so the run exercises the approve path three times rather than once — cheap, and the only way to know it works repeatedly rather than once.

## Open questions for review

Answer these in this PR before merging.

1. **Is a controlled repeat the right call, or should v2 change something?** Drafted as a byte-identical ask to v1 so that any difference is attributable to the pipeline. The cost is that v2 proves nothing new about the *build* half — same site, same type, same tests. The alternative (a slightly different site, or the npm/SvelteKit path) tests more but muddies the comparison, and mixes a possible build-toolchain failure into a run designed to isolate intake and review. Recommendation: keep it identical, and prove the node path with a separate later project.
2. **Should the reviewer workflow be built first?** Without the `pull_request: opened` half, the requester hand-constructs each decision issue. Building it first would make v2 a true zero-hand-editing run; running now proves the execution half sooner and generates the evidence for what the reviewer workflow should actually check. Recommendation: run now, and treat the reviewer workflow as the finding this run most strongly motivates.
3. **Should `pages-deploy.yml` land in the templates before provisioning v2?** If yes, v2 stops testing the "human forgot a step" failure mode but starts being scaffolded correctly. If no, v2 becomes the second data point that this step is routinely needed. Either is defensible; deciding it here avoids it being decided by accident at provisioning time.
4. **Does v1's stranded PR #6 get resolved as part of this?** Not scope for v2, but leaving it open means the factory's one live external site permanently disagrees with its own journal about what was built. Worth a decision, in its own issue.

## Disposal

When M3 closes, this project has served its purpose. v1 is already being kept as the standing Pages-deploy canary, so v2 does not need to be — the default should be to delete it once its findings are written up as `ai-app-factory` issues, removing its `projects.json` entry in the same change (as was done for `ai-app-factory-smoke-test`). If it is kept instead, set its `projects.json` status to something non-active so two near-identical test projects don't both compete for attention on the dashboard alongside real work.
