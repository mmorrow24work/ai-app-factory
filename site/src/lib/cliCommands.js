// Reference list of `gh` commands the Lane B pipeline actually runs (or will run once
// M2/M5/M6 land). "live" entries are sourced from files that exist in this repo today —
// see each entry's `source` field. "planned" entries have no source file yet (scripts/ and
// generate-issues.yml don't exist until M2/M6), so they're documented from DESIGN.md's
// milestone descriptions instead and must not be presented as functional.
export const CLI_STAGES = [
	{
		stage: 'Triggering a run',
		status: 'live',
		commands: [
			{
				command: 'gh issue edit <n> --add-label claude-go -R <owner>/<repo>',
				who: 'Human',
				when: 'Hands an issue to Lane B — matches the `issues: labeled` trigger in claude.yml.',
				source: '.github/workflows/claude.yml'
			},
			{
				command: '@claude <comment>  (posted on an issue or PR)',
				who: 'Human (OWNER, MEMBER, or COLLABORATOR)',
				when: 'A comment containing "@claude" from an authorized author re-fires the workflow via its issue_comment trigger.',
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
		status: 'live',
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
		stage: 'Repo setup',
		status: 'planned',
		commands: [
			{
				command: 'gh repo create <owner>/<repo> --public --source=. --push',
				who: 'Human, via factory-new.sh',
				when: 'M2 — creates a new project repo from a template and pushes the initial scaffold.',
				source: 'planned — scripts/ does not exist yet'
			}
		]
	},
	{
		stage: 'Labels, milestones & issues',
		status: 'planned',
		commands: [
			{
				command: 'gh label create <name> --color <hex> --description "<desc>"',
				who: 'Human, via factory-new.sh',
				when: 'M2 — applies the templates/_shared/labels.json taxonomy to a freshly created repo.',
				source: 'planned — scripts/ does not exist yet'
			},
			{
				command: 'gh api repos/<owner>/<repo>/milestones -f title=... -f description=...',
				who: 'Workflow (generate-issues.yml)',
				when: 'M6 — turns an approved DESIGN.md into milestones on merge.',
				source: 'planned — .github/workflows/generate-issues.yml does not exist yet'
			},
			{
				command: 'gh issue create --title ... --milestone ... --body ...',
				who: 'Workflow (generate-issues.yml)',
				when: 'M6 — files one issue per DESIGN.md work item.',
				source: 'planned — .github/workflows/generate-issues.yml does not exist yet'
			},
			{
				command: 'gh issue edit <n> --add-label claude-go',
				who: 'Workflow (generate-issues.yml)',
				when: 'M6 — labels each generated issue so it lands directly in Lane B.',
				source: 'planned — .github/workflows/generate-issues.yml does not exist yet'
			}
		]
	},
	{
		stage: 'Secrets',
		status: 'planned',
		commands: [
			{
				command: 'gh secret set CLAUDE_CODE_OAUTH_TOKEN -R <owner>/<repo>',
				who: 'Human, via factory-secrets.sh',
				when: "M2 — provisions the subscription token a new project's claude.yml needs.",
				source: 'planned — scripts/ does not exist yet'
			},
			{
				command: 'gh secret set GH_PAT -R <owner>/<repo>',
				who: 'Human, via factory-secrets.sh',
				when: "M2 — optional PAT so Claude's PRs trigger other workflows (the default GITHUB_TOKEN cannot).",
				source: 'planned — scripts/ does not exist yet'
			}
		]
	}
];
