import { error } from '@sveltejs/kit';
import { PROJECTS, findProject } from '$lib/projects.js';

export const prerender = true;

export function entries() {
	return PROJECTS.map((project) => ({ repo: encodeURIComponent(project.repo) }));
}

export function load({ params }) {
	const repo = decodeURIComponent(params.repo);
	const project = findProject(repo);
	if (!project) {
		error(404, `Unknown project: ${repo}`);
	}
	return { project };
}
