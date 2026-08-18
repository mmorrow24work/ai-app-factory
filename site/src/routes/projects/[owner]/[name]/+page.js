import { error } from '@sveltejs/kit';
import { PROJECTS, findProject } from '$lib/projects.js';

export const prerender = true;

// Two path segments (owner, name), not one with an encoded slash -- GitHub Pages (like most
// static hosts) decodes %2F in the URL path before matching it to files on disk, so a single
// `[repo]` segment built from `encodeURIComponent('owner/name')` prerenders a file GitHub
// Pages can never actually serve: every project page 404s live even though the file exists.
// Found live 2026-08-18, present since M3 -- nobody had clicked through a deployed project
// link until then, only ever hit these routes via direct API/gh CLI checks.
export function entries() {
	return PROJECTS.map((project) => {
		const [owner, name] = project.repo.split('/');
		return { owner, name };
	});
}

export function load({ params }) {
	const repo = `${params.owner}/${params.name}`;
	const project = findProject(repo);
	if (!project) {
		error(404, `Unknown project: ${repo}`);
	}
	return { project };
}
