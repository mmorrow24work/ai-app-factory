# Design: ai-app-factory-cov-pubs

## Problem

Deciding which pub in Coventry to go to is a question with a lot of scattered inputs — is it near me, does it do food, has it got a garden, can I park, is it any good, and have I already been and thought it was rubbish? The public half of that (ratings, facilities, websites) is spread across Google, CAMRA's WhatPub, each pub's own site, and Facebook. The personal half — *my* rating, *when I last went* — exists nowhere at all, or in someone's notes app.

The ask is for a single page that holds both halves at once, sortable by the two things that actually decide a Friday night: how good it is and how far away it is.

**This is also the first ask through the factory that is a real application rather than a pipeline test.** Every project provisioned so far (`ai-app-factory-hello-world` and v2–v4) was a deliberately trivial static page whose purpose was to exercise the build process. This one has real data, real third-party sources, real users other than the requester, and a custom domain. That makes it the first ask where the factory's own architectural constraints — static hosting, no server, no secrets in the browser — collide with what the requirements actually want, and most of the design work below is resolving those collisions rather than describing screens.

## The requirements, as given

> Create an app listing pubs in Coventry, show user ratings and allow me to sort them by popularity and proximity to my location based on post code, i want to create my own personal ratings and sort them by popularity, date visited and proximity to my location based on post code. Show pub facilities inc. pub food, access to gardens and free parking. All users to share public reviews and data and my personal reviews using WhatsApp or Facebook etc. add hyper-links to the pub website inc. events and photo gallery. I want to use a custom DNS - the URL will be https://ai-app-factory-cov-pubs.coldwire.uk/

Restated as discrete capabilities, so nothing is quietly dropped later:

| # | Capability | Where it lands |
| --- | --- | --- |
| R1 | List pubs in Coventry | M1, M2 |
| R2 | Show user (public) ratings | M5 |
| R3 | Sort public list by popularity | M2, M5 |
| R4 | Sort public list by proximity, from a postcode | M3 |
| R5 | Create my own personal ratings | M4 |
| R6 | Sort personal list by popularity, date visited, proximity | M4 |
| R7 | Show facilities: food, garden, free parking | M1, M2 |
| R8 | Share public reviews and my personal reviews via WhatsApp/Facebook/etc. | M6 |
| R9 | Hyperlink to each pub's website, events, photo gallery | M1, M6 |
| R10 | Custom DNS at `https://ai-app-factory-cov-pubs.coldwire.uk/` | M0, M7 |

Two of these — R2 and R8's "all users share public reviews **and data**" — are the only ones that cannot be satisfied by a purely static site as written. They get their own section below rather than a hand-wave.

## Goal

`ai-app-factory-cov-pubs` is a static web app at `https://ai-app-factory-cov-pubs.coldwire.uk/` that lists the pubs of Coventry with their facilities and links, and lets a visitor sort that list two ways — by how well-rated it is and by how far it is from a postcode they type in — while keeping a private, device-local record of their own ratings and visit dates that sorts the same three ways.

Concretely, when it works:

- A visitor lands on the domain root and immediately sees every Coventry pub, with food/garden/parking shown as facts rather than icons they have to guess at.
- They type `CV1 5FB` and the list reorders nearest-first, with a distance on each row. Their postcode never leaves their browser (see "Proximity without a backend").
- They tap a pub, get its detail page with its website, events page and photo gallery linked out, the public reviews it has, and a Share button that hands WhatsApp or Facebook a real link with a real preview.
- They rate it 4/5, mark that they went on 14 March, and that survives a page reload — on that device, with no account and no login.
- They post a public review, which is a GitHub issue opened through a pre-filled link, and it appears on the site after the next aggregation run.

## Non-goals

- **A backend, a database, or user accounts.** The factory produces static GitHub Pages sites and nothing else (`DESIGN.md`, "The site is static"). No login, no password reset, no session. Every requirement below is solved within that constraint or explicitly flagged as compromised by it.
- **A national pub directory.** Coventry only, and "Coventry" gets a defined boundary (see "Open questions" #4). Scope creep to Warwickshire, or to restaurants/bars/clubs, is a different project.
- **Live third-party API calls on every page load.** Pub data is a build-time snapshot committed to the repo, not an Overpass query fired from the visitor's browser. Reasons in "Architecture".
- **Scraping CAMRA WhatPub, Google Places, or TripAdvisor.** WhatPub's data is CAMRA's and not licensed for republication; Google Places requires a billable API key (impossible to hold safely in a public static bundle — same reasoning as `DESIGN.md`'s "Why the write-path credential can't be hardcoded into the site") and its terms forbid caching results the way this design needs. Neither is a source this project can use.
- **Hosting photographs of pubs.** Copyright in pub photos belongs to whoever took them. R9 asks for a *hyperlink* to the pub's photo gallery, and that is exactly what this builds — a link out, not a copy in. See "Open questions" #6.
- **Bookings, table reservations, payments, or opening-hours accuracy guarantees.** Not asked for, and each drags in liability the project has no way to honour.
- **Facebook/WhatsApp SDKs, tracking pixels, or analytics.** Sharing is done with plain URLs and the browser's own Web Share API. No third-party JavaScript runs on this site.
- **Being authoritative.** This lists what open data and volunteer reviews say. It will be wrong about some pubs, some of the time, and the UI should say so rather than imply a verified dataset.

## Architecture

**Project type:** `custom-script` (per `templates/custom-script`), for the third time and with the worst fit yet. This project genuinely wants a SvelteKit frontend — routing, per-pub prerendered pages, a component per card. `templates/_shared/design-system/` exists precisely for that case and would be hand-copied in at M0 (`DESIGN.md`, "Web UI design system"). Issue #27 already tracks the missing `web-app` template type against `ai-app-factory`; this project is the strongest evidence for it so far, and that finding belongs as a comment on #27, not as scope here.

Provisioning invocation for the M6 provisioning issue:

```
scripts/factory-new.sh custom-script ai-app-factory-cov-pubs \
  --ask "List Coventry pubs with facilities, public and personal ratings, sortable by popularity and postcode proximity, shareable, at https://ai-app-factory-cov-pubs.coldwire.uk/" \
  --set ENTRY_POINT=src/routes/+page.svelte \
  --set REQUESTER_GITHUB=<intake issue author>
```

`REQUESTER_GITHUB` is mandatory: it renders `templates/_shared/REQUESTED_BY.md.tmpl` into the new repo's `README.md`, and that rendered line is the exact string `review-decision.yml` and `claude.yml`'s `Authorize` step grep back out to let the requester approve their own PRs and direct work via `@claude`. Omit it and the requester silently drops to owner-only.

### Data: where the pub list comes from

**Source: OpenStreetMap, via the Overpass API, at build time.** An Overpass query for `amenity=pub` (plus `amenity=bar` and `amenity=biergarten` if the boundary question resolves that way) within the Coventry administrative boundary returns each pub's name, coordinates, and whatever tags mappers have filled in — `website`, `phone`, `addr:*`, `food`/`cuisine`, `outdoor_seating`, `beer_garden`, `parking`, `wheelchair`.

**Why OSM and not anything else:** it's the only source that is (a) free, (b) has no API key to hide in a public bundle, (c) is explicitly licensed for reuse, and (d) covers facilities as structured tags rather than prose. The licence is ODbL 1.0, which obliges attribution ("© OpenStreetMap contributors") on every page that shows the data, and share-alike on any *derived database* published. Both are cheap to honour and both are hard requirements, not niceties — the attribution goes in the site footer at M2, and the ODbL implication for the reviews database is called out in "Open questions" #2.

**Why build-time and not runtime.** Overpass is a free, volunteer-run service with rate limits, no SLA, and multi-second response times under load; a page that queries it on every visit would be slow, would break when Overpass is busy, and would hammer a public good for no reason. Instead a scheduled workflow (`refresh-pubs.yml`, weekly `schedule` + `workflow_dispatch`) runs the query, normalises the result, and opens a PR against `data/pubs.json` when it changes. The site ships that JSON as a static asset. Practical consequences: the data is stale by up to a week (fine for pubs), the site works when Overpass is down, and the diff of every refresh is reviewable — so a mass-retagging accident upstream shows up as a big red PR rather than silently mangling the live site.

**The facilities data will be incomplete, and the UI must not lie about it.** OSM tags are volunteer-supplied and sparse; plenty of real Coventry pubs will have no `outdoor_seating` tag at all. That is *unknown*, not *no garden*, and rendering it as an unticked checkbox is a false statement about a real business. The design requires three states per facility — yes / no / not known — and filters that say "has a garden" must mean "tagged as having one", with the unknowns visible and countable rather than silently excluded. This is the single most likely way the app ends up being wrong in a way users notice, so it is a design constraint rather than a polish item.

### Proximity without a backend

R4/R6 want distance from a user-supplied postcode. That needs postcode → coordinates.

**Primary: bundle the coordinates.** The ONS Postcode Directory is published under the Open Government Licence and includes a centroid for every UK postcode. The `CV` postcode area is a small slice of it — a filtered `data/postcodes-cv.json` of roughly the CV1–CV8 districts, built once by a script and committed. Lookup is then a local object read: instant, offline-capable, zero third-party dependency at runtime, and — the part that actually matters — **the user's postcode never leaves their browser**, because there is nothing to send it to. A postcode is fine-grained location data about a real person; not transmitting it is meaningfully better than transmitting it to a well-behaved API.

**Fallback: `postcodes.io`** — free, no API key, CORS-enabled — for a postcode outside the bundled set (someone visiting from out of town). This is opt-in behaviour worth stating in the UI at the moment it happens, not a silent background request, precisely because it *does* send the postcode somewhere.

**Distance is straight-line (haversine) from postcode centroid to pub coordinate.** Two honesty caveats the UI should carry: a postcode centroid is the middle of a delivery unit, not a doorstep (typically tens to a couple of hundred metres out), and a crow-flies distance in a city with a ring road is not a walking distance. Showing "1.2 km (direct)" is honest; showing "14 min walk" would not be, without a routing engine this project isn't going to have.

**Browser geolocation is a reasonable optional extra** — one button, "use my location instead" — but the ask says postcode, so postcode is the primary path and geolocation is at most a small addition in M3. It also never gets to be the *only* path: it needs HTTPS and a permission grant, and plenty of people will decline.

### Public reviews: the hard part

R2 and R8 want *all users* to share public reviews. Reviews are user-generated writes. A static site cannot accept a write. Three options were considered:

**(a) Reviews as GitHub issues, aggregated at build time — recommended.** A "Write a review" button builds a pre-filled `issues/new` deep link with a `[review] <pub name>` title prefix and a structured body template (rating, facilities corrections, free text). The visitor submits it on GitHub's own page. A workflow (`aggregate-reviews.yml`, on `issues: opened`/`edited`/`closed` plus a schedule) reads issues matching that prefix, parses them, and commits `data/reviews.json`; Pages redeploys and the review is live.

This is not a novel mechanism — it is precisely the zero-credential deep-link pattern `ai-app-factory` already uses for intake and for approve/reject (`DESIGN.md`, "Write path"), applied a third time. That brings real properties for free: no credential of any kind touches the visitor's browser; every review carries an **authenticated** GitHub identity rather than a self-reported name; GitHub's own rate limiting and abuse tooling apply; and moderation is "close the issue", which is a mechanism that already exists and that a human already knows how to use.

Its costs are equally real and should be accepted knowingly: **a reviewer needs a GitHub account**, which is a genuine barrier for the general pub-going public and materially narrows who "all users" means; there is a delay of a workflow run between submitting and seeing it; and the site inherits the two known bugs the factory already paid for in this pattern — `labels=` on a deep link is silently dropped for non-collaborators (so filter on the **title prefix**, never a label), and URL length is capped (so the long free-text body goes via clipboard, not `body=`). Both fixes are documented in `DESIGN.md` and must be copied, not rediscovered.

**(b) A third-party backend-as-a-service** (Supabase, Firebase) with its public anon key in the bundle. Rejected. It removes the GitHub-account barrier, which is its one real advantage, but it puts a credential in a public static bundle — the exact thing `DESIGN.md` argues at length is never safe here — and the "row-level security makes the anon key harmless" answer is only true if the policies are perfect, which is a claim nobody can verify unattended. It also adds a second hosting account with its own billing and its own outage surface, against the factory's "no separate hosting account" non-goal.

**(c) No public reviews; personal ratings only.** Rejected as written — it deletes R2 and half of R8 — but it is the honest fallback if the reviewer decides the GitHub-account barrier makes (a) pointless, and it is worth saying out loud that a personal-ratings-only app is still a genuinely useful app. See "Open questions" #1.

**Popularity must not be a raw average.** With review counts in the low single digits, a mean rating makes a pub with one 5★ review outrank a pub with forty 4.6★ ones, which is both wrong and the first thing a user will notice. Sort by a shrunk score — a Bayesian/Wilson-style average pulled toward the site-wide mean in proportion to how few reviews there are — and show the review count next to every rating so the number is interpretable. Pubs with zero reviews sort last in popularity order rather than being hidden.

**Reviews are about real, named businesses, which carries a real moderation duty.** A defamatory or malicious review of a named Coventry pub is a live risk on a public site, not a theoretical one. The mitigations here are that every review is attributable to an authenticated GitHub account, that removal is a single click on a public issue tracker, and that the site states plainly whose opinions these are. The repo owner is the person who ends up holding that duty; that should be a conscious acceptance at gate #1, not a surprise later. Flagged in "Open questions" #7.

### Personal ratings

Device-local, in `localStorage`, keyed per pub: rating, date visited, and a free-text note. No account, no sync, nothing sent anywhere. This is the one place where `localStorage` is the right answer rather than the wrong one — `DESIGN.md` removed a `localStorage`-held PAT because it was a *credential* with a cross-device problem; a personal star rating is neither secret nor, in the first instance, worth building accounts for.

The cost is stated up front in the UI, not buried: **clear your browser data and your ratings are gone**, and they do not follow you to your phone. Mitigated by an explicit Export/Import — a downloadable JSON file the user can keep or move between devices by hand. That is a deliberate floor, not a stopgap: real cross-device sync needs accounts and a server, which is out of scope for the whole factory, and R5 says "my own personal ratings", not "my ratings everywhere".

Personal sorting (R6) is the same sort machinery as the public list, over the local store: popularity (own rating), date visited (most recent first), proximity (same postcode input).

### Pages, routing and sharing

The site is SvelteKit with `adapter-static`, prerendered — a list route and a route per pub.

**Per-pub pages must be real prerendered paths, not hash routes or query strings.** R8 wants a shared link to a specific pub to look right in WhatsApp and Facebook, and both build their preview by fetching the URL server-side and reading its `og:title`/`og:description`/`og:image` meta tags. A crawler does not run JavaScript, so a client-rendered `#/pub/foo` route yields a blank, identical preview for every pub — the share works but looks broken. Prerendering one HTML file per pub, each with its own OG tags, is the whole reason this is worth stating.

**Slugs must be two real path segments' worth of care.** `DESIGN.md` records this factory's own live 404: a route parameter containing an encoded `/` prerendered to a file GitHub Pages could never serve, because hosts decode `%2F` in the request path before matching. Pub names contain apostrophes, ampersands and spaces (`The Old Windmill`, `Bear & Ragged Staff`), so slugs get normalised to lowercase `[a-z0-9-]` with a stable ID suffix for collisions — no encoding anywhere in a URL, ever. Uniqueness of slugs is asserted in the test suite, because two pubs in Coventry sharing a name is not hypothetical.

**Sharing uses `navigator.share()` where available**, falling back to plain URLs: `https://wa.me/?text=<encoded>` for WhatsApp and `https://www.facebook.com/sharer/sharer.php?u=<encoded>` for Facebook, plus a copy-link button that always works. No SDK, no pixel, no third-party script. Sharing a *personal* review means composing the text locally from the local store and handing it to the share sheet — the personal data goes wherever the user chooses to send it and nowhere else.

**External links (R9)** — website, events page, photo gallery — come from OSM's `website`/`contact:website` tags where present, with `rel="noopener noreferrer external"`. Most pubs will have at most a website tag, not a distinct events or gallery URL; those get surfaced when a review submission supplies them (the review template includes optional link fields) and are otherwise simply absent rather than faked. Every outbound link is to a third party this project does not control and cannot vouch for, and dead links are inevitable — a link-check job in CI can flag them without blocking the build.

### Custom domain

R10 asks for `https://ai-app-factory-cov-pubs.coldwire.uk/`. This factory migrated its own dashboard to a `coldwire.uk` subdomain on 2026-08-19 and the migration produced exactly one bug worth inheriting the fix for.

- **A DNS `CNAME` record for `ai-app-factory-cov-pubs.coldwire.uk` → `mmorrow24work.github.io`**, created in the `coldwire.uk` DNS zone. Entirely outside GitHub; only the domain owner can do it.
- **Settings → Pages → Custom domain** set to the same name, and Enforce HTTPS ticked once the certificate provisions. GitHub writes and manages the repo-root `CNAME` file itself as part of this; commit `4f74c42` removed hand-added `CNAME` files from this repo as inert once the setting was configured, so **do not hand-commit one**.
- **`svelte.config.js` must use an empty `paths.base`, not `/ai-app-factory-cov-pubs`.** This is the bug: commit `076be14` on this repo fixed a hardcoded project-pages base that made every built asset URL wrong (`/repo-name/_app/...` instead of `/_app/...`) the moment it was served from a domain root. A site serving from a custom domain root needs `base: ''`. Getting this wrong produces a page that loads and then renders nothing — a failure that looks like a build problem and isn't.
- **All three steps are human, at provisioning time**, because each project's `GH_PAT` deliberately excludes both `Workflows` and `Pages` scope (`DESIGN.md`, "GH_PAT: token strategy"). The pipeline cannot do them and cannot detect that they were skipped. M0 makes them a checklist with an explicit verification step, which is the fix v4's design doc asked for after v3 was seeded with Pages never enabled.
- **Until DNS and Pages are both configured, the project-pages URL stays the working preview** — the site should be buildable and verifiable at `https://mmorrow24work.github.io/ai-app-factory-cov-pubs/` only if `base` is set accordingly, which it deliberately is not. So the honest sequence is: configure the domain *first*, at M0, and verify M1's deploy against the real domain. Trying to run the whole build on the project-pages URL and switch at the end means re-testing every asset path at the end.

### Testing

`pytest`, stdlib only, no network — matching the template default so no `--set TEST_COMMAND` override is needed — for the data and build layer, plus `npm run build`/`npm run lint` for the app itself.

The tests that earn their place are the ones covering the failure modes named above: `data/pubs.json` validates against a schema and every entry has a name and a coordinate inside the Coventry bounding box; slugs are unique and match `^[a-z0-9-]+$`; every internal link resolves to a prerendered file that exists; facilities are one of three states and never coerce unknown to false; the postcode lookup returns a plausible CV coordinate and haversine returns known distances for known pairs; the popularity sort puts a 40-review 4.6 above a 1-review 5.0; and the built `index.html` references `/_app/` rather than `/ai-app-factory-cov-pubs/_app/`. That last one is a one-line test that would have caught this repo's own custom-domain bug before it shipped.

## Milestones

- **M0 — Bootstrap.** Human, at provisioning time; no `claude-go` issue. Repo from the `custom-script` template with `ENTRY_POINT` and `REQUESTER_GITHUB` set, its own freshly-minted single-repo `GH_PAT`, labels, `docs/journal.md`, `claude.yml`/`seed-milestones.yml`/`review-decision.yml`, registered in `projects.json`. Then the steps the pipeline cannot do for itself: `pages-deploy.yml` committed, Pages source set to GitHub Actions, the `coldwire.uk` DNS CNAME created, Pages custom domain set to `ai-app-factory-cov-pubs.coldwire.uk`, Enforce HTTPS on. `templates/_shared/design-system/` hand-copied in with `{{PROJECT_NAME}}` rendered. **Verify before firing `seed-milestones.yml`:** the rendered `Requested by` line in `README.md`, a non-404 `GET /repos/.../pages`, and `dig ai-app-factory-cov-pubs.coldwire.uk` resolving to GitHub's Pages IPs.
- **M1 — Pub data pipeline.** The Overpass query, the normaliser, `data/pubs.json` committed, `refresh-pubs.yml` (weekly + `workflow_dispatch`, opens a PR on change), the schema test, and the OSM attribution string. Facilities normalised to three-state yes/no/unknown. No UI yet — the milestone is done when the data is right, because everything downstream is wrong if it isn't.
- **M2 — The list.** SvelteKit shell on the design system, the pub list with name, address, facilities and website link, facility filters, alphabetical and (placeholder, review-count-free) popularity sort, ODbL attribution in the footer, dark mode. First deploy — **verified against the custom domain**, not the project-pages URL.
- **M3 — Proximity.** `data/postcodes-cv.json` built from the ONS OGL data, the postcode input with validation and a clear "not found" state, haversine distance shown per row, sort-by-distance, the `postcodes.io` fallback with its own visible notice, and the "direct distance from postcode centroid" caveat in the UI.
- **M4 — Personal ratings.** `localStorage` store (rating, date visited, note), the rating and date-visited controls, a "my pubs" view sorting by own rating / date visited / distance, Export and Import JSON, and the plain statement that this is device-local. No network calls in this milestone at all.
- **M5 — Public reviews.** The `[review] <pub>` deep-link submission flow (title-prefix trigger, clipboard for the body — both known-bug fixes copied deliberately), `aggregate-reviews.yml` parsing issues into `data/reviews.json`, review display per pub, the shrunk popularity score, review counts shown everywhere a rating is, and a documented moderation procedure in the README.
- **M6 — Pub pages and sharing.** A prerendered page per pub with OG meta tags, website/events/gallery links, its reviews, and Share — Web Share API with WhatsApp/Facebook/copy-link fallbacks — for both the pub itself and the visitor's own personal review. Slug-uniqueness and no-encoded-slash tests.
- **M7 — Polish and handoff.** README (what it is, where the data comes from, its licence, how to review, how to fork), an About page tracing what built this, the link-checker job, a "data may be wrong, here's how to fix it upstream in OSM" note, and a final pass on the custom domain including HTTPS enforcement and a real share-preview check in WhatsApp and Facebook.

M1–M7 is roughly seven to nine `claude-go` issues, sequenced so each PR merges before the next starts. That is substantially more than any project the factory has run — the hello-worlds were three issues of trivial HTML — so the token cost is genuinely different in kind, and gate #1 is the place to decide that's acceptable.

## What a successful run proves

Beyond the app working, this is the first run that would demonstrate:

1. The factory can produce something with a real data pipeline and a scheduled refresh workflow, not just static pages.
2. The deep-link write pattern generalises from "request a project" and "approve a PR" to ordinary end-user content — or that it doesn't, because the GitHub-account barrier is fatal for a public audience. Either answer is a real finding about `ai-app-factory` and belongs as an issue against it.
3. The custom-domain path works for a *generated* project and not just for the factory's own dashboard, including the `paths.base` trap it hit on 2026-08-19.
4. A multi-milestone build (7+ issues) holds together unattended across a design of this size, which the three-issue hello-worlds could not test.

What it will **not** prove: anything about scale (a few dozen pubs and a handful of reviews is not load), anything about the accuracy of OSM's facility tagging, and anything about whether real Coventry pub-goers would use it.

## Open questions for review

Answer these in this PR before merging. The first three change what gets built.

1. **Public reviews via GitHub issues, or drop them?** Recommended: build them (option (a) above), because it satisfies R2/R8 with a mechanism this factory has already proven twice and puts no credential in the browser. But it means only people with GitHub accounts can review, which is not "all users" in any ordinary sense. If that barrier is unacceptable, the honest choices are to accept a BaaS backend with its credential-in-a-public-bundle problem (not recommended) or to ship personal ratings only and say so on the site. Deciding this after M2 would waste work; decide it here.
2. **Is the ODbL share-alike implication acceptable?** Displaying OSM data needs attribution, which is trivial. But `data/reviews.json` joined to `data/pubs.json` and republished is arguably a *derived database*, which ODbL says must itself be shared under ODbL. In practice that means adding a licence statement to the repo saying so. It costs nothing and it should be a deliberate yes rather than an oversight — flagging it because "we used open data and didn't read the licence" is a bad way to find out.
3. **How much does "sort by popularity" mean at launch, given there will be zero reviews on day one?** The site ships empty of ratings and stays that way until people review. Options: launch with popularity sort present but visibly empty (recommended — honest, and it fills in); seed it with the requester's own ratings promoted to public, which conflates R2 with R5; or hold M5 until there's an audience. Worth a decision, because "the popularity sort does nothing" is the most likely first impression otherwise.
4. **What is "Coventry"?** The city's administrative boundary (recommended — it's a real polygon in OSM and is defensible), a radius around the city centre, or the CV1–CV6 postcode districts? These disagree at the edges by dozens of pubs, and the answer also settles whether `amenity=bar`, `amenity=biergarten` and pub-restaurants are in scope, or `amenity=pub` only.
5. **Personal ratings: device-local only, accepted?** Recommended yes, with Export/Import, because sync needs accounts and a server. But R5/R6 read as though the requester expects their ratings to be *theirs*, persistently — and "I cleared my cache and lost two years of pub ratings" is a bad outcome. If cross-device persistence is actually required, say so now: the least-bad static answer is an opt-in "back up to a GitHub gist/issue" flow, which is more work and needs a token, and it should be designed in rather than bolted on.
6. **Photo galleries — link out only?** Recommended yes: link to the pub's own gallery, host nothing. If the ask actually wants photos *on* the site, the only clean sources are OSM/Wikimedia Commons images with compatible licences (sparse — most pubs will have none) or user-submitted photos, which adds image hosting, moderation of image content, and a copyright warranty this project can't take on.
7. **Does the repo owner accept the moderation duty for public reviews of named local businesses?** This is a people question, not a technical one, and it lands on whoever owns the repo. Reviews are attributable and removable, which is most of the answer, but somebody has to actually look. If nobody will, that is a strong argument for question 1's fallback.
8. **The project name.** `ai-app-factory-cov-pubs` names the factory that built it rather than the thing it is, and it's the name in the requested URL, so it stays. Noting only that a future public-facing project might want its repo name and its product name to diverge, and nothing in the pipeline currently supports that.

## Disposal

Unlike the hello-world projects, this one is not disposable by design — it has a custom domain and, if M5 lands, other people's content in it. Two things follow. If the project is ever retired, the DNS CNAME in `coldwire.uk` must be removed in the same change as the repo, or the subdomain dangles at a deleted Pages site (a dangling CNAME to a takeover-able host is a real, if small, hijack risk). And the review issues are other people's contributions: archiving the repo preserves them read-only, deleting it destroys them. Archive rather than delete, and remove the `projects.json` entry only if the repo actually goes.
