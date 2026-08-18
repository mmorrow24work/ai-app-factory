import projectsData from '../../../projects.json';

/**
 * @typedef {{repo: string, type: string, createdAt: string, status: string, ask: string}} Project
 */

const REQUIRED_FIELDS = /** @type {const} */ (['repo', 'type', 'createdAt', 'status', 'ask']);

// Display order/labels for the known statuses (DESIGN.md: "Active" / "Done" / "Archived").
// Any status value outside this set still renders -- just alphabetically, after the known
// ones -- rather than silently dropping projects an unanticipated status value.
const STATUS_ORDER = ['active', 'done', 'archived'];
/** @type {Record<string, string>} */
const STATUS_LABELS = { active: 'Active', done: 'Done', archived: 'Archived' };

/**
 * @param {Project} project
 * @param {number} index
 * @returns {Project}
 */
function validateProject(project, index) {
	for (const field of REQUIRED_FIELDS) {
		if (typeof project[field] !== 'string' || project[field].length === 0) {
			throw new Error(`projects.json[${index}] is missing required string field "${field}"`);
		}
	}
	if (Number.isNaN(Date.parse(project.createdAt))) {
		throw new Error(
			`projects.json[${index}] ("${project.repo}") has an unparseable createdAt: "${project.createdAt}"`
		);
	}
	return project;
}

if (!Array.isArray(projectsData)) {
	throw new Error('projects.json must be a JSON array');
}

/** @type {Project[]} */
export const PROJECTS = projectsData.map(validateProject);

/**
 * Groups PROJECTS by `status`, in STATUS_ORDER order with any unknown statuses appended
 * (alphabetically) after it -- mirrors uk-wealth-tracker's NAV_GROUPS/NAV_TABS split, but
 * the groups themselves come from the data instead of a fixed tab list.
 *
 * @param {Project[]} projects
 * @returns {Array<{status: string, label: string, projects: Project[]}>}
 */
export function groupProjectsByStatus(projects = PROJECTS) {
	/** @type {Map<string, Project[]>} */
	const byStatus = new Map();
	for (const project of projects) {
		const key = project.status;
		if (!byStatus.has(key)) byStatus.set(key, []);
		byStatus.get(key)?.push(project);
	}

	const knownKeys = STATUS_ORDER.filter((status) => byStatus.has(status));
	const unknownKeys = [...byStatus.keys()]
		.filter((status) => !STATUS_ORDER.includes(status))
		.sort();

	return [...knownKeys, ...unknownKeys].map((status) => ({
		status,
		label: STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1),
		projects: byStatus.get(status) ?? []
	}));
}

/**
 * @param {string} repo
 * @param {Project[]} projects
 * @returns {Project | undefined}
 */
export function findProject(repo, projects = PROJECTS) {
	return projects.find((project) => project.repo === repo);
}

/**
 * Elapsed time between `createdAt` and `now`, as a short human string. Intended to be
 * called client-side (see routes/projects/[repo]/+page.svelte) so it reflects the visitor's
 * clock rather than this static site's build time.
 *
 * @param {string} createdAt
 * @param {Date} now
 * @returns {string}
 */
export function elapsedSince(createdAt, now = new Date()) {
	const start = new Date(createdAt);
	const ms = Math.max(0, now.getTime() - start.getTime());

	const hours = Math.floor(ms / 3_600_000);
	if (hours < 1) return 'less than an hour';
	if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;

	const days = Math.floor(hours / 24);
	if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;

	const months = Math.floor(days / 30);
	if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;

	const years = Math.floor(months / 12);
	return `${years} year${years === 1 ? '' : 's'}`;
}

/**
 * Formats `createdAt` as a plain UTC date for display -- handles both the full ISO 8601
 * timestamp factory-new.sh writes today and the date-only ("YYYY-MM-DD") values older
 * registry entries still carry (predating the fix for elapsedSince showing hours-since-
 * midnight-UTC instead of hours-since-actual-creation on same-day projects). Forced to UTC
 * rather than the visitor's local zone so this can't shift by a day near a timezone boundary.
 *
 * @param {string} createdAt
 * @returns {string}
 */
export function formatCreatedAt(createdAt) {
	return new Date(createdAt).toLocaleDateString(undefined, {
		timeZone: 'UTC',
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}
