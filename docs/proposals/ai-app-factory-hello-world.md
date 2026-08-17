# Design: ai-app-factory-hello-world

## Problem

The factory's first end-to-end dogfood run (`ai-app-factory-smoke-test`, the `urlcheck` CLI) is complete: it carried a vague ask through drafting, provisioning, seeding, and unattended implementation, and its repo has since been deleted. What it proved is narrower than it looks. `urlcheck` was a `custom-script` project whose entire artifact was a Python file and a `pytest` suite — every acceptance criterion was checkable by running the test suite inside the same Actions job that wrote the code.

Two things the pipeline will routinely be asked to build were never exercised by that run:

1. **A deployed artifact.** Nothing `urlcheck` produced had to leave the repository to be considered working. A project whose output is a *site* has a definition of done that includes "it is actually live at a URL", which no unattended job can fully self-verify.
2. **The permission edges of the per-project token.** `factory-secrets.sh` deliberately mints each project's `GH_PAT` without `Workflows` and without `Pages` (see `DESIGN.md`, "GH_PAT: token strategy"). No issue in the `urlcheck` run ever needed either, so neither boundary was hit. A project that deploys will hit both — and it is much better to discover the exact failure mode on a hello-world than on real work.

The pipeline has also changed materially since that run: M6 was redesigned on 2026-08-17 so that provisioning is a human step with its own approval gate rather than something `generate-issues.yml` does. The current loop, as documented in `docs/adr/0001-design-to-issues-loop.md`, has not been run start to finish by anyone.

## Goal

`ai-app-factory-hello-world` is a deliberately trivial static site — a page that says hello, a short "about" page describing the pipeline that built it, and nothing else — published to GitHub Pages at `https://mmorrow24work.github.io/ai-app-factory-hello-world/`.

The site is the pretext; the pipeline is the subject. Its real purpose is to be the factory's second dogfood run, chosen specifically to cover the ground the first one didn't: a **deployed** artifact, built by a project type the factory has never produced, under the current human-gated M6 loop. As with the first smoke test, it is small enough that any failure is unambiguously the pipeline's fault rather than the requirements'.

## Non-goals

- **Being a real site.** No content beyond the two pages, no framework, no router, no analytics, no forms, no theming system, no custom domain. Every "it would be more useful if it also…" defeats the point: the site must stay uninteresting so the pipeline is the only variable.
- **Third-party dependencies.** No npm packages, no build step, no lockfile. Same reasoning as the first smoke test — a red run must never be attributable to a registry outage or a version conflict. This is a deliberate trade-off, and the alternative is called out under "Open questions" below.
- **Testing the factory's own SvelteKit dashboard.** `site/` in this repo is unrelated to this project and untouched by it.
- **Long-term maintenance.** This project is disposable. See "Disposal".

## Architecture

**Type:** `custom-script` (per `templates/custom-script`). The factory has three project types — `nautobot-app`, `netbox-plugin`, `custom-script` — and none of them is a static-site type, so `custom-script` is the only fit. It is an imperfect one: its template is shaped around a single entry-point script plus a `pytest` suite (`CLAUDE.md.tmpl`'s repo map names `{{ENTRY_POINT}}` as "Main script — the thing this project does"), and this project's main artifact is `index.html`. The mismatch is itself worth observing during the run — whether a fourth `static-site` template is warranted is a finding for `ai-app-factory`, not scope for this project.

Provisioning invocation, for the M6 provisioning issue:

```
scripts/factory-new.sh custom-script ai-app-factory-hello-world \
  --ask "Create a simple hello-world site to test the ai-app-factory build process" \
  --set ENTRY_POINT=index.html
```

**Shape:** hand-written static files at the repo root, no build step:

```
index.html          The hello page
about.html          What built this, and how
style.css           A few dozen lines, no framework
tests/              pytest suite, Python stdlib only
```

**Paths must be relative.** A GitHub Pages *project* site is served from the subpath `/ai-app-factory-hello-world/`, not from the domain root, so any absolute reference (`/style.css`, `/about.html`) resolves to `mmorrow24work.github.io/style.css` and 404s. This is the one genuine bug class a hello-world site has, it is invisible when previewing files locally, and it is exactly what an unattended agent with no browser is most likely to get wrong — so it is worth encoding as a test rather than as prose.

**Testing:** `pytest`, Python stdlib only (`html.parser`, `pathlib`), no network access. The suite asserts that each HTML file parses; that required elements are present (a `<title>`, one `<h1>`, a `<meta charset>`, `lang` on `<html>`); that every local `href`/`src` is relative and resolves to a file that exists in the repo; and that the two pages link to each other. Keeping the default `TEST_COMMAND=pytest` means no `--set` override is needed and the generated `CLAUDE.md`'s definition of done works unmodified.

**Deployment:** a `pages-deploy.yml` workflow that uploads the repo root as a Pages artifact (`actions/upload-pages-artifact` → `actions/deploy-pages`), modelled on this repo's own `.github/workflows/pages-deploy.yml` but with no npm build step, since there is nothing to build.

### The constraint that shapes the milestones

**The unattended pipeline cannot create `pages-deploy.yml` itself, and cannot enable Pages.** Each project's `GH_PAT` is minted with `Contents`, `Issues`, `Pull requests`, `Actions`, `Secrets` — deliberately *not* `Workflows` and *not* `Pages`. A `claude-go` issue that tries to commit a file under `.github/workflows/` will be rejected by the API, and nothing in the pipeline can flip the repository's Pages setting to "GitHub Actions".

So both must happen at provisioning time, by the human, alongside `factory-new.sh` / `factory-secrets.sh`:

1. Commit `pages-deploy.yml` into the scaffold.
2. Set Settings → Pages → Source to "GitHub Actions".

This is a constraint to design around, not a bug to fix in this project — the `Workflows` exclusion is deliberate, and keeping workflow changes behind human review is the reason it exists. The finding this run should produce is a narrower one: *if* deployed projects become common, the Pages workflow belongs in the templates (or in a new `static-site` template) so it lands in the scaffold automatically rather than being a step a human must remember. That belongs as an issue against `ai-app-factory`.

## What a successful run proves

This project is the test, so its pass condition is about the pipeline, not the site. A successful run means:

1. `draft-design-doc.yml` turned a one-sentence ask into this doc and opened it as a PR against `main` (ADR 0001, steps 1–2).
2. Merging that PR triggered `generate-issues.yml`, which opened a `Provision mmorrow24work/ai-app-factory-hello-world` issue in *this* repo — with the `factory-new.sh` invocation and the `--set ENTRY_POINT` value inferred from this doc, no `claude-go` label, and no attempt to touch any other repo (step 4, and the M6 revision that made this a human step).
3. A human ran `factory-new.sh` + `factory-secrets.sh`, added `pages-deploy.yml`, enabled Pages, and pushed the `projects.json` entry (step 5).
4. Manually firing the new repo's `seed-milestones.yml` fetched this doc unauthenticated from `raw.githubusercontent.com`, and created milestones M1–M3 with `claude-go` issues against them, using only that repo's own secrets (step 6).
5. `claude.yml` in the new repo implemented each issue unattended and opened a PR that passed its own definition of done (step 7).
6. Each merge deployed, and the site was live and correct at the project URL — including under the `/ai-app-factory-hello-world/` subpath, which is where a relative-path mistake would show up.
7. `docs/journal.md` in the new repo accumulated one metrics entry per merged run, appended by the workflow and never by a PR branch.
8. The project rendered on the dashboard with its ask, elapsed time, token burn, and commit heatmap.

Any step needing unplanned human intervention is a finding, and findings belong as issues against `ai-app-factory` — never as scope added to this site.

## Milestones

- **M0 — Bootstrap.** Repo created from the `custom-script` template, label taxonomy applied, `docs/journal.md` seeded, `claude.yml` and `seed-milestones.yml` in place, registered in `projects.json` — plus the two steps the pipeline cannot do for itself: `pages-deploy.yml` committed and Pages set to deploy from GitHub Actions. Done by a human at provisioning time; no `claude-go` issue.
- **M1 — The page.** `index.html` and `style.css`: a greeting, the project name, a line naming the ask it came from. Valid HTML5 with `lang`, `<meta charset>`, a `<title>`, and a viewport meta. All asset references relative. First deploy goes live.
- **M2 — Tests.** The `pytest` suite described above — parse, required elements, relative-only local references, every referenced file exists. No network access in CI.
- **M3 — About page and README.** `about.html`, linked from `index.html` and linking back, laying out the seven pipeline steps that produced the site (the trace from ADR 0001, written for someone who has never seen this repo). README with the project URL, how to view the site locally, and a statement that this is a factory smoke test rather than a maintained project.

Three `claude-go` issues across M1–M3, sequenced so each PR merges before the next starts — enough to exercise repeated unattended runs, journal appends, and repeated Pages deploys without spending meaningfully more than the first smoke test did.

## Open questions for review

Answer these in this PR before merging; each is a real fork in the design rather than a detail to defer.

1. **No build step, or exercise the npm path?** Drafted as plain HTML/CSS with no dependencies, so a red run can only mean the pipeline broke. The cost is that the node-toolchain path — `npm ci`, a lockfile, a framework build — stays untested, and the factory's own dashboard is SvelteKit, so that path will need proving eventually. Reversing this decision means a SvelteKit + `adapter-static` scaffold instead, accepting registry and lockfile flakiness as possible sources of false failures. The recommendation is to keep this run dependency-free and prove the node path with a separate, later dogfood project, so the two variables stay separated.
2. **Should M0 be a checklist in the provisioning issue?** The two human-only steps (commit `pages-deploy.yml`, enable Pages) are easy to forget, and forgetting the second produces a green Actions run with no live site — a confusing failure. `generate-issues.yml` could learn to emit them for any design doc that mentions Pages, which is a change to `ai-app-factory` rather than to this project.
3. **Is a fourth `static-site` template the right outcome?** If this run goes smoothly apart from the scaffolding mismatch noted under Architecture, the fix may be a new template rather than more `custom-script` overrides. Worth deciding after the run, on evidence.

## Disposal

When M3 closes, this project has served its purpose. Unlike the first smoke test — whose repo was deleted once verified — consider keeping this one: it is the factory's only live Pages deployment outside this repo, so it doubles as a standing check that the deploy path still works after pipeline changes. If it is kept, set its `projects.json` status to something non-active so it stops competing for attention on the dashboard alongside real work; if it is deleted, remove the `projects.json` entry in the same change, as was done for `ai-app-factory-smoke-test`.
