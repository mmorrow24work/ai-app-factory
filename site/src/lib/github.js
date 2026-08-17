const GITHUB_API = 'https://api.github.com';

/** @typedef {{token?: string}} GithubRequestOpts */

/**
 * Thin fetch-based helper for the GitHub REST API -- no external client library, per
 * CLAUDE.md ("plain fetch ... no bespoke GitHub API client library"). `token` is optional;
 * unauthenticated calls are subject to GitHub's lower per-IP rate limit.
 *
 * @param {string} path
 * @param {GithubRequestOpts} opts
 * @returns {Promise<any>}
 */
async function githubRequest(path, { token } = {}) {
	/** @type {Record<string, string>} */
	const headers = { Accept: 'application/vnd.github+json' };
	if (token) headers.Authorization = `Bearer ${token}`;

	const response = await fetch(`${GITHUB_API}${path}`, { headers });
	if (!response.ok) {
		throw new Error(
			`GitHub API request to ${path} failed: ${response.status} ${response.statusText}`
		);
	}
	return response.json();
}

/**
 * @param {string} repo "owner/name"
 * @param {GithubRequestOpts} [opts]
 */
export function getRepo(repo, opts = {}) {
	return githubRequest(`/repos/${repo}`, opts);
}

/**
 * @param {string} repo "owner/name"
 * @param {GithubRequestOpts} [opts]
 */
export function listIssues(repo, opts = {}) {
	return githubRequest(`/repos/${repo}/issues?state=all&per_page=100`, opts);
}

/**
 * @param {string} repo "owner/name"
 * @param {GithubRequestOpts} [opts]
 */
export function listMilestones(repo, opts = {}) {
	return githubRequest(`/repos/${repo}/milestones?state=all&per_page=100`, opts);
}
