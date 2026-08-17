# Design: ai-app-factory smoke test

## Problem

`ai-app-factory`'s whole premise is an unattended loop: a vague ask becomes a design doc, an approved design doc becomes a repo with milestones and `claude-go` issues, and the Lane B workflow implements those issues as PRs while `docs/journal.md` records the metrics. Every stage of that loop now exists (M1–M6), but no project has yet been carried through all of it in one continuous run. The individual pieces have each been exercised while being built; the seams between them have not.

Testing the seams with a *real* project is expensive and confounded — a real project's issues are ambiguous enough that a failed run is as likely to mean "the requirements were unclear" as "the pipeline is broken". What's missing is a project small enough that any failure is unambiguously the pipeline's fault.

## Goal

A deliberately tiny CLI tool, `urlcheck`, that takes a list of URLs, checks whether each one responds, and prints its status (up/down, HTTP code, response time). It is real enough to be genuinely useful in a shell pipeline and small enough that a competent implementation is not in doubt.

Its actual purpose is to be the factory's first end-to-end dogfood run: **this doc** is the artifact that `draft-design-doc.yml` produced from a vague ask, its merge is what `generate-issues.yml` turns into a repo and issues, and its issues are what `claude.yml` implements unattended. The tool is the pretext; the pipeline is the subject.

## Non-goals

- **Being a monitoring product.** No daemon, no scheduling, no alerting, no history, no persistence, no dashboard. It runs once, prints, and exits. Anything resembling "but it would be more useful if it also…" is out of scope by construction — added scope defeats the purpose of a smoke test, which is to keep the *tool* uninteresting so the *pipeline* is the only variable.
- **Third-party dependencies.** Python standard library only. A dependency-free tool means a failed run can't be blamed on a lockfile, a registry outage, or a version conflict.
- **Deep protocol coverage.** No TLS certificate expiry checks, no content assertions, no retry/flap detection, no authentication, no proxies. "Did it answer, how fast" is the entire feature set.
- **Long-term maintenance.** This project is disposable. See "Disposal" below — it is not intended to accrue milestones after M3.

## Architecture

**Type:** `custom-script` (per `templates/custom-script`) — no Nautobot or NetBox involvement.

**Shape:** a single-file Python script, `urlcheck.py`, stdlib-only (`argparse`, `urllib.request`, `concurrent.futures`, `time`, `json`), executable via `./urlcheck.py` and `python3 urlcheck.py` alike. Tests live in `tests/` and run under `pytest`.

**Input:** URLs from positional arguments, from a file (`--file urls.txt`, one per line, `#` comments and blanks ignored), or from stdin when neither is given and stdin isn't a TTY. A bare hostname with no scheme is assumed to be `https://`.

**Check:** one HTTP request per URL with a timeout (`--timeout`, default 5s), issued as `HEAD` and retried once as `GET` if the server rejects `HEAD` (405/501) — a common enough server quirk that not handling it would make the tool wrong on ordinary sites. Elapsed wall time is measured around the request. A URL is **up** if it produced an HTTP response at all; the status code is reported alongside, and `--fail-on-status` optionally treats 4xx/5xx as down. Connection errors, DNS failures, and timeouts are **down**, with the reason recorded.

**Concurrency:** a `ThreadPoolExecutor` with a small bounded pool (`--concurrency`, default 8). Output is always emitted in input order regardless of completion order, so the tool is deterministic to eyeball and to test.

**Output:** an aligned text table by default (URL, UP/DOWN, code, milliseconds); `--json` emits one JSON array of result objects instead, for piping. Colour only when stdout is a TTY.

**Exit codes:** `0` all up, `1` at least one down, `2` usage error (no URLs, unreadable file). This is what makes it usable in a shell pipeline and, conveniently, what makes its acceptance criteria mechanically checkable by the unattended pipeline itself.

**Testing:** unit tests against a `http.server` instance bound to `127.0.0.1` on an ephemeral port, serving canned responses (200, 404, 500, a `HEAD`-rejecting handler, and a deliberately slow endpoint for the timeout path). No network access required in CI — a test suite that reaches the public internet would make a red run ambiguous, which is exactly the failure mode this project exists to avoid.

## What a successful run proves

This project is the test, so its pass condition is about the pipeline, not the tool. A successful run means:

1. `draft-design-doc.yml` turned a two-sentence ask into this doc and opened it as a PR.
2. Merging that PR triggered `generate-issues.yml`, which created `mmorrow24work/ai-app-factory-smoke-test` from the `custom-script` template, applied the shared label taxonomy from `templates/_shared/labels.json`, created milestones M0–M3, and filed `claude-go` issues against them.
3. `claude.yml` in the new repo picked up each `claude-go` issue unattended and opened a PR that passed its own definition of done.
4. `docs/journal.md` in the new repo accumulated one metrics entry per merged run — appended by the workflow, never by a PR branch.
5. The project appeared in `projects.json` and rendered on the dashboard with its ask, elapsed time, token burn, and commit heatmap.

Any step that needs a human to intervene is a finding, and the finding belongs in this repo as an issue against `ai-app-factory` — not as scope added to `urlcheck`.

## Milestones

- **M0 — Bootstrap.** Repo created from the `custom-script` template by `scripts/factory-new.sh`, label taxonomy applied, `docs/journal.md` seeded, `.github/workflows/claude.yml` in place, registered in `projects.json`. Produced by `generate-issues.yml` itself rather than by a `claude-go` issue.
- **M1 — Core checker.** `urlcheck.py` accepting URLs as positional arguments: HEAD-with-GET-fallback request per URL, configurable `--timeout`, up/down classification, HTTP code and elapsed milliseconds printed as an aligned table, exit codes 0/1/2.
- **M2 — Input and output modes.** `--file` and stdin input (comments and blanks ignored, bare hostnames defaulted to `https://`), `--json` output, `--fail-on-status`, and bounded `--concurrency` with output held in input order.
- **M3 — Tests and README.** `pytest` suite covering up, 404, 500, HEAD-rejection fallback, timeout, and each exit code, against a local `http.server` with no outbound network; README with usage, examples, and exit-code table.

## Disposal

When M3 closes, this project has served its purpose. Archive the repo (or fork it away per the standard handoff in `templates/_shared/SUPPORT_HANDOFF.md.tmpl`) and set its `projects.json` entry to a non-active status so it stops competing for attention on the dashboard alongside real work. Keep the repo rather than deleting it: its `docs/journal.md` is the factory's first complete end-to-end metrics trace, and it is the natural regression target the next time the pipeline changes.
