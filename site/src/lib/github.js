const GITHUB_API = 'https://api.github.com';

/** @typedef {{token?: string}} GithubRequestOpts */

/**
 * @param {string} [token]
 * @returns {Record<string, string>}
 */
function buildHeaders(token) {
	/** @type {Record<string, string>} */
	const headers = { Accept: 'application/vnd.github+json' };
	if (token) headers.Authorization = `Bearer ${token}`;
	return headers;
}

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
	const response = await fetch(`${GITHUB_API}${path}`, { headers: buildHeaders(token) });
	if (!response.ok) {
		throw new Error(
			`GitHub API request to ${path} failed: ${response.status} ${response.statusText}`
		);
	}
	return response.json();
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
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
 * @typedef {{number: number, title: string, html_url: string, created_at: string, user: {login: string}}} PullRequest
 */

/**
 * @param {string} repo "owner/name"
 * @param {GithubRequestOpts} [opts]
 * @returns {Promise<PullRequest[]>}
 */
export function listOpenPullRequests(repo, opts = {}) {
	return githubRequest(`/repos/${repo}/pulls?state=open&per_page=100`, opts);
}

/**
 * @param {string} repo "owner/name"
 * @param {GithubRequestOpts} [opts]
 */
export function listMilestones(repo, opts = {}) {
	return githubRequest(`/repos/${repo}/milestones?state=all&per_page=100`, opts);
}

/**
 * @typedef {{id: number, path: string, status: string, conclusion: string|null, html_url: string, run_number: number, created_at: string}} WorkflowRun
 */

/**
 * Lists recent Actions runs across every workflow in the repo. Filter by `path` (e.g.
 * `.github/workflows/claude.yml`) with {@link findLatestWorkflowRun} to get a single
 * workflow's latest run -- GitHub doesn't expose a per-workflow filter on this endpoint,
 * only on `/actions/workflows/{workflow_id}/runs`, and the issue asks for this one.
 *
 * @param {string} repo "owner/name"
 * @param {GithubRequestOpts} [opts]
 * @returns {Promise<WorkflowRun[]>}
 */
export async function listWorkflowRuns(repo, opts = {}) {
	const data = await githubRequest(`/repos/${repo}/actions/runs?per_page=30`, opts);
	return data.workflow_runs ?? [];
}

/**
 * @param {WorkflowRun[]} runs
 * @param {string} [workflowPath]
 * @returns {WorkflowRun|null}
 */
export function findLatestWorkflowRun(runs, workflowPath = '.github/workflows/claude.yml') {
	return runs.find((run) => run.path === workflowPath) ?? null;
}

/** @typedef {{week: number, total: number, days: number[]}} CommitActivityWeek */
/** @typedef {{ready: boolean, weeks: CommitActivityWeek[]}} CommitActivityResult */

const COMMIT_ACTIVITY_RETRY_DELAYS_MS = [0, 1500, 3000, 4500];

/**
 * `stats/commit_activity` can return 202 while GitHub computes the stats cache for a repo
 * it hasn't seen requested before -- this is not an error, just "not ready yet". Retries a
 * few times with a short backoff; if it's still 202 after that, returns `ready: false`
 * rather than throwing, so the caller can show a loading state instead of an error.
 *
 * @param {string} repo "owner/name"
 * @param {GithubRequestOpts} [opts]
 * @returns {Promise<CommitActivityResult>}
 */
export async function getCommitActivity(repo, opts = {}) {
	for (const delay of COMMIT_ACTIVITY_RETRY_DELAYS_MS) {
		if (delay) await sleep(delay);
		const response = await fetch(`${GITHUB_API}/repos/${repo}/stats/commit_activity`, {
			headers: buildHeaders(opts.token)
		});
		if (response.status === 202) continue;
		if (response.status === 204) return { ready: true, weeks: [] };
		if (!response.ok) {
			throw new Error(
				`commit_activity request for ${repo} failed: ${response.status} ${response.statusText}`
			);
		}
		return { ready: true, weeks: await response.json() };
	}
	return { ready: false, weeks: [] };
}
