<script>
	// Node/arrow coordinates for the Lane B pipeline flowchart. Colors are all CSS custom
	// properties from app.css (hsl(var(--foreground)) etc.), the same tokens the rest of the
	// site uses, so this stays consistent with whatever theme the site ends up shipping —
	// there's no dark-mode toggle yet (see app.css), so this doesn't hardcode light/dark
	// colors either way.
	const liveNodes = [
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

	const plannedNodes = [
		{
			x: 210,
			y: 766,
			w: 340,
			h: 88,
			title: 'factory-new.sh / factory-secrets.sh  (M2)',
			sub: 'new repo created from a template; secrets set'
		},
		{
			x: 210,
			y: 894,
			w: 340,
			h: 88,
			title: '/new page → draft-design-doc.yml  (M5)',
			sub: 'workflow_dispatch; Opus drafts DESIGN.md as a PR'
		},
		{
			x: 210,
			y: 1022,
			w: 340,
			h: 110,
			title: 'Merge of that PR → generate-issues.yml  (M6)',
			sub: 'Opus creates milestones + claude-go-labeled issues; creates the target repo via factory-new.sh if new'
		}
	];

	const liveArrows = [
		{ from: [204, 176], to: [378, 218] },
		{ from: [556, 176], to: [382, 218] },
		{ from: [380, 286], to: [380, 328] },
		{ from: [380, 402], to: [380, 444] },
		{ from: [380, 530], to: [380, 572] }
	];

	const plannedArrows = [
		{ from: [380, 854], to: [380, 896] },
		{ from: [380, 982], to: [380, 1024] }
	];

	const feedbackPath = 'M 550,1077 C 700,1077 700,137 356,137';
</script>

<svg
	viewBox="0 0 760 1180"
	role="img"
	aria-labelledby="pipeline-diagram-title pipeline-diagram-desc"
	class="w-full h-auto"
>
	<title id="pipeline-diagram-title">The Lane B pipeline</title>
	<desc id="pipeline-diagram-desc">
		Built today: a claude-go label or an @claude comment triggers claude.yml, which resolves the
		model (claude-opus-5 if model:opus is present, else claude-sonnet-5), runs claude-code-action to
		implement the issue and open a PR against main, then journal-entry.sh appends run metrics to
		docs/journal.md on main. Planned, not yet built: factory-new.sh and factory-secrets.sh (M2)
		scaffold a new repo and its secrets; the /new page triggers draft-design-doc.yml (M5) so Opus
		drafts DESIGN.md as a PR; merging that PR triggers generate-issues.yml (M6), where Opus creates
		milestones and claude-go-labeled issues, feeding back into the built pipeline above.
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
			id="arrow-planned"
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
	<text x="54" y="23" font-size="12" fill="hsl(var(--foreground))">Built today</text>
	<rect
		x="176"
		y="10"
		width="28"
		height="16"
		rx="3"
		fill="hsl(var(--card))"
		stroke="hsl(var(--muted-foreground))"
		stroke-width="1.5"
		stroke-dasharray="4 3"
	/>
	<text x="210" y="23" font-size="12" fill="hsl(var(--muted-foreground))">
		Planned — not yet built
	</text>

	<!-- Built today section -->
	<text
		x="20"
		y="58"
		font-size="12"
		font-weight="600"
		letter-spacing="0.06em"
		fill="hsl(var(--muted-foreground))">BUILT TODAY — LANE B CORE, LIVE SINCE M0</text
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

	{#each liveArrows as arrow, i (i)}
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

	{#each liveNodes as node, i (i)}
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

	<!-- Planned section -->
	<text
		x="20"
		y="726"
		font-size="12"
		font-weight="600"
		letter-spacing="0.06em"
		fill="hsl(var(--muted-foreground))">PLANNED — NOT YET BUILT (M2 / M5 / M6)</text
	>
	<rect
		x="20"
		y="736"
		width="720"
		height="420"
		rx="12"
		fill="none"
		stroke="hsl(var(--muted-foreground))"
		stroke-width="1.5"
		stroke-dasharray="6 4"
	/>

	{#each plannedArrows as arrow, i (i)}
		<line
			x1={arrow.from[0]}
			y1={arrow.from[1]}
			x2={arrow.to[0]}
			y2={arrow.to[1]}
			stroke="hsl(var(--muted-foreground))"
			stroke-width="1.5"
			stroke-dasharray="6 4"
			marker-end="url(#arrow-planned)"
		/>
	{/each}

	{#each plannedNodes as node, i (i)}
		<rect
			x={node.x}
			y={node.y}
			width={node.w}
			height={node.h}
			rx="8"
			fill="hsl(var(--card))"
			stroke="hsl(var(--muted-foreground))"
			stroke-width="1.5"
			stroke-dasharray="6 4"
		/>
		<foreignObject x={node.x} y={node.y} width={node.w} height={node.h}>
			<div
				xmlns="http://www.w3.org/1999/xhtml"
				class="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center"
			>
				<p class="text-sm font-semibold text-muted-foreground">{node.title}</p>
				<p class="text-xs text-muted-foreground">{node.sub}</p>
			</div>
		</foreignObject>
	{/each}

	<!-- Feedback arrow: generate-issues.yml (M6) creates the claude-go-labeled issues that feed
	     the built pipeline above -->
	<path
		d={feedbackPath}
		fill="none"
		stroke="hsl(var(--muted-foreground))"
		stroke-width="1.5"
		stroke-dasharray="6 4"
		marker-end="url(#arrow-planned)"
	/>
	<text
		x="695"
		y="607"
		font-size="11"
		fill="hsl(var(--muted-foreground))"
		text-anchor="middle"
		transform="rotate(-90 695 607)"
	>
		generate-issues.yml creates claude-go-labeled issues
	</text>
</svg>
