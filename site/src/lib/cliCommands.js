// Reference list of `gh`/script commands the Lane B pipeline actually runs. Every entry below
// is sourced from a file that exists in this repo today — see each entry's `source` field. There
// is no "planned" status anymore: M2 (scripts/), M5 (draft-design-doc.yml), and M6
// (generate-issues.yml + the seed-milestones.yml template) have all shipped. See
// docs/adr/0001-design-to-issues-loop.md for the full loop these commands walk through.
export const CLI_STAGES = [
	{
		stage: 'Triggering a run',
		commands: [
			{
				command: 'gh issue edit <n> --add-label claude-go -R <owner>/<repo>',
				who: 'Human',
				when: 'Hands an issue to Lane B — matches the `issues: labeled` trigger in claude.yml.',
				source: '.github/workflows/claude.yml'
			},
			{
				command: '@claude <comment>  (posted on an issue or PR)',
				who: 'Human — a repo collaborator, or the project’s own recorded requester (parsed from README.md’s "Requested by" line, not just OWNER/MEMBER/COLLABORATOR as of 2026-08-18)',
				when: 'A comment containing "@claude" re-fires the workflow via its issue_comment trigger; the comment’s own text is read into the prompt (a real bug, fixed the same day it was found: the text used to be discarded, the comment only ever acted as a re-trigger signal), so this is also how a requester gives feedback or redirects work mid-build, not just approve/reject on something already drafted.',
				source: '.github/workflows/claude.yml'
			},
			{
				command: 'gh workflow run claude.yml -f issue_number=<n> -R <owner>/<repo>',
				who: 'Human',
				when: 'Manual workflow_dispatch run; overrides the lane:interactive / lane:manual exclusions.',
				source: '.github/workflows/claude.yml'
			}
		]
	},
	{
		stage: 'Monitoring runs',
		commands: [
			{
				command: 'gh run list -R <owner>/<repo>',
				who: 'Human',
				when: 'Lists recent claude.yml runs and their status.',
				source: 'operational use — not embedded in a script'
			},
			{
				command: 'gh run view <run-id> -R <owner>/<repo>',
				who: 'Human',
				when: 'Inspects the logs/output of one run in detail.',
				source: 'operational use — not embedded in a script'
			},
			{
				command: 'gh issue view <n> --repo <owner>/<repo> --json title,body,labels,milestone',
				who: 'Workflow (claude.yml)',
				when: "Reads the target issue's labels (to resolve model + lane exclusions) and injects its title/body into Claude's prompt — a workflow_dispatch run has no event payload to fall back on.",
				source: '.github/workflows/claude.yml'
			},
			{
				command: 'gh pr list --repo <owner>/<repo> --search "linked:issue-<n>"',
				who: 'Workflow (journal-entry.sh)',
				when: 'Resolves the PR that references this issue, to record in the journal entry.',
				source: '.github/scripts/journal-entry.sh'
			}
		]
	},
	{
		stage: 'Ask → design doc',
		commands: [
			{
				command:
					'gh issue create --repo mmorrow24work/ai-app-factory --title "[new-project-ask] <name>" --body "<ask>"',
				who: 'Human, via the `/new` page (a pre-filled link to this exact GitHub issue form — no token, no account setup on the site itself)',
				when: 'M5 — draft-design-doc.yml triggers on issues: opened, filtered to the [new-project-ask] title prefix rather than a label (GitHub silently drops labels= on this URL for non-collaborators — found via a real end-to-end test on 2026-08-18). Opus drafts docs/proposals/<slug>.md and opens a "Design: <name>" PR against main for review; the issue author\'s GitHub login is stamped onto the doc and PR as the authenticated requester identity, then the intake issue is closed.',
				source: '.github/workflows/draft-design-doc.yml'
			}
		]
	},
	{
		stage: 'Review → provisioning plan',
		commands: [
			{
				command: 'gh pr merge <n> --repo mmorrow24work/ai-app-factory',
				who: 'Human — approval gate #1',
				when: "Reviews/edits the drafted design doc in GitHub's normal PR review UI, then merges it. The merge (a push to main touching docs/proposals/*.md) is what fires generate-issues.yml next.",
				source: 'GitHub PR review UI — no script'
			},
			{
				command:
					'gh workflow run generate-issues.yml -R mmorrow24work/ai-app-factory -f path=docs/proposals/<slug>.md',
				who: 'Workflow (generate-issues.yml) — auto-fired on merge; this is the manual re-run form',
				when: 'M6 — reads the merged design doc and opens a "Provision mmorrow24work/<slug>" issue in ai-app-factory with the exact commands to run next. Creates nothing else and touches no other repo.',
				source: '.github/workflows/generate-issues.yml'
			}
		]
	},
	{
		stage: 'Provision the repo',
		commands: [
			{
				command:
					'scripts/factory-new.sh <type> <repo-name> --ask "<summary>" [--set KEY=VALUE ...]',
				who: 'Human — approval gate #2, own gh auth',
				when: 'M2 — scaffolds the repo from a template, runs `gh repo create`, applies templates/_shared/labels.json, and appends the project to projects.json (locally — does not push).',
				source: 'scripts/factory-new.sh'
			},
			{
				command: 'scripts/factory-secrets.sh <repo-name>',
				who: 'Human — same gate as above',
				when: 'M2 — sets CLAUDE_CODE_OAUTH_TOKEN (from the local .env store) and a freshly minted, never-persisted GH_PAT (prompted interactively) as Actions secrets on the new repo.',
				source: 'scripts/factory-secrets.sh'
			},
			{
				command:
					'git add projects.json && git commit -m "Register mmorrow24work/<slug>" && git push',
				who: 'Human — same gate as above',
				when: 'Pushes the projects.json entry factory-new.sh wrote locally, so the dashboard picks up the new project.',
				source: 'scripts/factory-new.sh writes projects.json; this command pushes it'
			}
		]
	},
	{
		stage: 'Seed milestones & issues',
		commands: [
			{
				command: 'gh workflow run seed-milestones.yml -R mmorrow24work/<repo-name>',
				who: 'Human — manual trigger, no inputs (Actions tab → seed-milestones → Run workflow works the same way)',
				when: "M6 — fetches the approved design doc from ai-app-factory's public main over an unauthenticated raw.githubusercontent.com request, then creates one milestone per doc milestone and one or more claude-go-labeled issues per milestone, using the new repo's own secrets.",
				source: 'templates/<type>/.github/workflows/seed-milestones.yml'
			},
			{
				command: 'gh api repos/<owner>/<repo>/milestones -f title=... -f description=...',
				who: 'Workflow (seed-milestones.yml)',
				when: 'Creates one GitHub milestone per "## Milestones" bullet in the design doc; skips any title that already exists.',
				source: 'templates/<type>/.github/workflows/seed-milestones.yml'
			},
			{
				command: 'gh issue create --title ... --milestone "M<n>: <title>" --body ...',
				who: 'Workflow (seed-milestones.yml)',
				when: 'Files one or more issues per milestone with an acceptance-criteria checklist; applies claude-go only to issues concrete enough for the unattended pipeline.',
				source: 'templates/<type>/.github/workflows/seed-milestones.yml'
			}
		]
	},
	{
		stage: 'Review & decisions during the build',
		commands: [
			{
				command: 'gh issue create --repo <owner>/<repo> --title "[review-approve] PR #<n>"',
				who: 'Human — the project’s own recorded requester, or the repo owner (via the "Pending decisions" section on that project’s dashboard page, a pre-filled link — or hand-constructed)',
				when: 'Implemented 2026-08-18. review-decision.yml triggers on issues: opened, filtered to a [review-approve]/[review-reject] title prefix (not a label — same labels=-is-dropped-for-non-collaborators reasoning as intake). Parses the referenced PR number from the title and merges (squash + delete branch) if authorized.',
				source: 'templates/<type>/.github/workflows/review-decision.yml'
			},
			{
				command: 'gh issue create --repo <owner>/<repo> --title "[review-reject] PR #<n>"',
				who: 'Human — same authorization as above',
				when: 'Same mechanism, opposite action: closes the referenced PR without merging and deletes its branch.',
				source: 'templates/<type>/.github/workflows/review-decision.yml'
			},
			{
				command:
					"grep -oE '\\[@[A-Za-z0-9-]+\\]\\(https://github\\.com/[A-Za-z0-9-]+\\)' README.md",
				who: 'Workflow (review-decision.yml and claude.yml’s Authorize step)',
				when: 'Recovers the project’s recorded requester login from its own README "Requested by" line — the only source of truth for who besides a collaborator is allowed to approve/reject a PR or direct changes via @claude. A repo predating that line (no match) falls through to collaborator/owner-only, not an error.',
				source: 'templates/<type>/.github/workflows/review-decision.yml'
			}
		]
	}
];
