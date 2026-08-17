<script>
	// Node/arrow coordinates for the Lane B pipeline flowchart. Colors are all CSS custom
	// properties from app.css (hsl(var(--foreground)) etc.), the same tokens the rest of the
	// site uses, so this stays consistent with whatever theme the site ends up shipping —
	// there's no dark-mode toggle yet (see app.css), so this doesn't hardcode light/dark
	// colors either way.
	//
	// Everything below is built and merged (see docs/adr/0001-design-to-issues-loop.md and
	// DESIGN.md's "GH_PAT: token strategy" for the authoritative description this was built
	// against). There is no "planned" section: as of this diagram's last update, nothing in
	// the ask → design → provision → seed → claude-go loop is still unbuilt. Two steps in the
	// bootstrap loop are human-approval gates rather than automated hops — `type: 'gate'`
	// below — styled with a person badge instead of the plain automated-node style.
	const coreNodes = [
		{
			x: 54,
			y: 98,
			w: 300,
			h: 78,
			title: '`claude-go` label applied to an issue',
			sub: 'issues: labeled trigger'
		},
		{
			x: 406,
			y: 98,
			w: 300,
			h: 78,
			title: '`@claude` comment on an issue/PR',
			sub: 'by OWNER, MEMBER, or COLLABORATOR — issue_comment: created trigger'
		},
		{
			x: 210,
			y: 216,
			w: 340,
			h: 70,
			title: '.github/workflows/claude.yml',
			sub: 'resolves the target issue + model'
		},
		{
			x: 210,
			y: 326,
			w: 340,
			h: 76,
			title: '`model:opus` label present?',
			sub: '→ claude-opus-5, else → claude-sonnet-5'
		},
		{
			x: 210,
			y: 442,
			w: 340,
			h: 88,
			title: 'claude-code-action runs',
			sub: 'implements the issue, opens a PR against main'
		},
		{
			x: 210,
			y: 570,
			w: 340,
			h: 98,
			title: 'journal-entry.sh  (if: always())',
			sub: 'appends run metrics to docs/journal.md on main — never touches the PR branch'
		}
	];

	const bootstrapNodes = [
		{
			x: 210,
			y: 766,
			w: 340,
			h: 96,
			type: 'auto',
			title: '`/new` page → `draft-design-doc.yml`  (M5)',
			sub: 'workflow_dispatch, authenticated with a PAT pasted into /settings; Opus drafts docs/proposals/<slug>.md and opens it as a "Design: <name>" PR'
		},
		{
			x: 210,
			y: 896,
			w: 340,
			h: 84,
			type: 'gate',
			title: 'Review & merge the design-doc PR',
			sub: 'human edits/approves in GitHub’s normal PR review UI — approval gate #1'
		},
		{
			x: 210,
			y: 1014,
			w: 340,
			h: 104,
			type: 'auto',
			title: 'Merge → `generate-issues.yml`  (M6)',
			sub: 'push to main touching docs/proposals/*.md; opens a "Provision mmorrow24work/<slug>" issue in ai-app-factory — no claude-go label, creates nothing, touches no other repo'
		},
		{
			x: 210,
			y: 1152,
			w: 340,
			h: 96,
			type: 'gate',
			title: '`factory-new.sh` + `factory-secrets.sh`  (M2)',
			sub: 'human runs both locally with their own gh auth — creates the real repo, applies labels, sets that repo’s own secrets — approval gate #2'
		},
		{
			x: 210,
			y: 1282,
			w: 340,
			h: 104,
			type: 'auto',
			title: "Human fires the new repo's own `seed-milestones.yml`",
			sub: 'workflow_dispatch, no inputs; fetches the approved doc from ai-app-factory’s public main, creates milestones + claude-go-labeled issues using that repo’s own secrets'
		}
	];

	const coreArrows = [
		{ from: [204, 176], to: [378, 218] },
		{ from: [556, 176], to: [382, 218] },
		{ from: [380, 286], to: [380, 328] },
		{ from: [380, 402], to: [380, 444] },
		{ from: [380, 530], to: [380, 572] }
	];

	const bootstrapArrows = [
		{ from: [380, 862], to: [380, 896] },
		{ from: [380, 980], to: [380, 1014] },
		{ from: [380, 1118], to: [380, 1152] },
		{ from: [380, 1248], to: [380, 1282] }
	];

	// seed-milestones.yml applies claude-go to the issues it creates, which re-fires the core
	// loop above (claude.yml's issues: labeled trigger) — the loop closes here.
	const feedbackPath = 'M 550,1334 C 700,1334 700,137 356,137';
</script>

<svg
	viewBox="0 0 760 1420"
	role="img"
	aria-labelledby="pipeline-diagram-title pipeline-diagram-desc"
	class="w-full h-auto"
>
	<title id="pipeline-diagram-title">The Lane B pipeline</title>
	<desc id="pipeline-diagram-desc">
		A claude-go label or an @claude comment triggers claude.yml, which resolves the model
		(claude-opus-5 if model:opus is present, else claude-sonnet-5), runs claude-code-action to
		implement the issue and open a PR against main, then journal-entry.sh appends run metrics to
		docs/journal.md on main. Separately, the ask-to-issues bootstrap loop: the /new page fires
		draft-design-doc.yml, where Opus drafts a design doc as a PR; a human reviews and merges it
		(approval gate #1); that merge triggers generate-issues.yml, which opens a provisioning issue in
		ai-app-factory telling a human what to run; a human runs factory-new.sh and factory-secrets.sh
		locally to create the real repo and set its secrets (approval gate #2); the human then manually
		fires that new repo's own seed-milestones.yml, which creates milestones and claude-go-labeled
		issues from the approved design doc, feeding back into the claude.yml loop above.
	</desc>

	<defs>
		<marker
			id="arrow-live"
			viewBox="0 0 10 10"
			refX="9"
			refY="5"
			markerWidth="7"
			markerHeight="7"
			orient="auto-start-reverse"
		>
			<path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--foreground))" />
		</marker>
		<marker
			id="arrow-feedback"
			viewBox="0 0 10 10"
			refX="9"
			refY="5"
			markerWidth="7"
			markerHeight="7"
			orient="auto-start-reverse"
		>
			<path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--muted-foreground))" />
		</marker>
	</defs>

	<!-- Legend -->
	<rect
		x="20"
		y="10"
		width="28"
		height="16"
		rx="3"
		fill="hsl(var(--card))"
		stroke="hsl(var(--foreground))"
		stroke-width="1.5"
	/>
	<text x="54" y="23" font-size="12" fill="hsl(var(--foreground))">Automated step</text>
	<g transform="translate(230, 10)">
		<rect
			width="28"
			height="16"
			rx="3"
			fill="hsl(var(--card))"
			stroke="hsl(var(--primary))"
			stroke-width="2"
		/>
		<g transform="translate(14, 8)">
			<circle cy="-2.2" r="2.4" fill="hsl(var(--primary))" />
			<path d="M -4.5 5 C -4.5 -0.5 4.5 -0.5 4.5 5 Z" fill="hsl(var(--primary))" />
		</g>
	</g>
	<text x="264" y="23" font-size="12" fill="hsl(var(--foreground))">Human approval gate</text>

	<!-- Core execution section -->
	<text
		x="20"
		y="58"
		font-size="12"
		font-weight="600"
		letter-spacing="0.06em"
		fill="hsl(var(--muted-foreground))">LANE B CORE — PER-ISSUE EXECUTION, LIVE SINCE M0</text
	>
	<rect
		x="20"
		y="68"
		width="720"
		height="624"
		rx="12"
		fill="none"
		stroke="hsl(var(--border))"
		stroke-width="1.5"
	/>

	{#each coreArrows as arrow, i (i)}
		<line
			x1={arrow.from[0]}
			y1={arrow.from[1]}
			x2={arrow.to[0]}
			y2={arrow.to[1]}
			stroke="hsl(var(--foreground))"
			stroke-width="1.5"
			marker-end="url(#arrow-live)"
		/>
	{/each}

	{#each coreNodes as node, i (i)}
		<rect
			x={node.x}
			y={node.y}
			width={node.w}
			height={node.h}
			rx="8"
			fill="hsl(var(--card))"
			stroke="hsl(var(--foreground))"
			stroke-width="1.5"
		/>
		<foreignObject x={node.x} y={node.y} width={node.w} height={node.h}>
			<div
				xmlns="http://www.w3.org/1999/xhtml"
				class="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center"
			>
				<p class="text-sm font-semibold text-foreground">{node.title}</p>
				<p class="text-xs text-muted-foreground">{node.sub}</p>
			</div>
		</foreignObject>
	{/each}

	<!-- Bootstrap loop section: ask -> design -> provision -> seed -->
	<text
		x="20"
		y="726"
		font-size="12"
		font-weight="600"
		letter-spacing="0.06em"
		fill="hsl(var(--muted-foreground))"
		>PROJECT BOOTSTRAP LOOP — ASK → DESIGN → PROVISION → SEED (M2 / M5 / M6)</text
	>
	<rect
		x="20"
		y="736"
		width="720"
		height="670"
		rx="12"
		fill="none"
		stroke="hsl(var(--border))"
		stroke-width="1.5"
	/>

	{#each bootstrapArrows as arrow, i (i)}
		<line
			x1={arrow.from[0]}
			y1={arrow.from[1]}
			x2={arrow.to[0]}
			y2={arrow.to[1]}
			stroke="hsl(var(--foreground))"
			stroke-width="1.5"
			marker-end="url(#arrow-live)"
		/>
	{/each}

	{#each bootstrapNodes as node, i (i)}
		{@const isGate = node.type === 'gate'}
		<rect
			x={node.x}
			y={node.y}
			width={node.w}
			height={node.h}
			rx="8"
			fill="hsl(var(--card))"
			stroke={isGate ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
			stroke-width={isGate ? '2.5' : '1.5'}
		/>
		{#if isGate}
			<g transform="translate({node.x + 22}, {node.y + 22})">
				<circle cy="-4" r="4.5" fill="hsl(var(--primary))" />
				<path d="M -8 9 C -8 -1 8 -1 8 9 Z" fill="hsl(var(--primary))" />
			</g>
		{/if}
		<foreignObject x={node.x} y={node.y} width={node.w} height={node.h}>
			<div
				xmlns="http://www.w3.org/1999/xhtml"
				class="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center"
			>
				<p class="text-sm font-semibold text-foreground">{node.title}</p>
				<p class="text-xs text-muted-foreground">{node.sub}</p>
			</div>
		</foreignObject>
	{/each}

	<!-- Feedback arrow: seed-milestones.yml applies claude-go to the issues it creates, which
	     re-fires claude.yml's issues: labeled trigger in the core section above -->
	<path
		d={feedbackPath}
		fill="none"
		stroke="hsl(var(--muted-foreground))"
		stroke-width="1.5"
		stroke-dasharray="6 4"
		marker-end="url(#arrow-feedback)"
	/>
	<text
		x="705"
		y="735"
		font-size="11"
		fill="hsl(var(--muted-foreground))"
		text-anchor="middle"
		transform="rotate(-90 705 735)"
	>
		seed-milestones.yml applies claude-go to the issues it creates, re-firing claude.yml above
	</text>
</svg>
