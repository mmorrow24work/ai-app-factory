const RAW_BASE = 'https://raw.githubusercontent.com';
const JOURNAL_PATH = 'docs/journal.md';
const FALLBACK_BRANCHES = ['main', 'master'];

/** @typedef {{date: string, issueNumber: number|null, title: string, result: string|null, pr: string|null, milestone: string|null, model: string|null, duration: string|null, turns: number|null, inputTokens: number|null, outputTokens: number|null, cost: number|null, run: string|null}} JournalEntry */
/** @typedef {Record<string, string>} VelocitySummary */
/** @typedef {{velocity: VelocitySummary|null, entries: JournalEntry[]}} ParsedJournal */

const ENTRY_HEADER_RE = /^## (\d{4}-\d{2}-\d{2}) — Issue #(\d+): (.+)$/m;

/**
 * @param {string} block
 * @param {string} name
 * @returns {string|null}
 */
function field(block, name) {
	const match = block.match(new RegExp(`\\*\\*${name}:\\*\\*\\s*(.+)`));
	return match ? match[1].trim() : null;
}

/**
 * @param {string|null} value
 * @returns {number|null}
 */
function parseIntField(value) {
	if (!value) return null;
	const n = Number(value.replace(/,/g, ''));
	return Number.isNaN(n) ? null : n;
}

/**
 * "$0.3981 (notional — see above)" -> 0.3981
 * @param {string|null} value
 * @returns {number|null}
 */
function parseCost(value) {
	if (!value) return null;
	const match = value.match(/\$([\d.]+)/);
	return match ? Number(match[1]) : null;
}

/**
 * Parses the `<!-- VELOCITY_START -->...<!-- VELOCITY_END -->` markdown table into a
 * plain {Metric: Value} map, e.g. {"Mean output tokens per issue": "25,866"}.
 *
 * @param {string} markdown
 * @returns {VelocitySummary|null}
 */
function parseVelocity(markdown) {
	const section = markdown.match(/<!-- VELOCITY_START -->([\s\S]*?)<!-- VELOCITY_END -->/);
	if (!section) return null;

	/** @type {VelocitySummary} */
	const summary = {};
	const rowRe = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/gm;
	let match;
	while ((match = rowRe.exec(section[1]))) {
		const [, key, value] = match;
		if (key === 'Metric' || /^-+$/.test(key.replace(/[^-]/g, ''))) continue;
		summary[key] = value;
	}
	return Object.keys(summary).length > 0 ? summary : null;
}

/**
 * Splits the `<!-- ENTRIES_START -->` section into per-run blocks (`## YYYY-MM-DD — Issue
 * #N: Title`) and parses each one's bullet fields.
 *
 * @param {string} markdown
 * @returns {JournalEntry[]}
 */
function parseEntries(markdown) {
	const startIndex = markdown.indexOf('<!-- ENTRIES_START -->');
	const section = startIndex === -1 ? markdown : markdown.slice(startIndex);
	const blocks = section.split(/\n(?=## \d{4}-\d{2}-\d{2} — Issue #\d+:)/);

	/** @type {JournalEntry[]} */
	const entries = [];
	for (const block of blocks) {
		const header = block.match(ENTRY_HEADER_RE);
		if (!header) continue;
		const [, date, issueNumber, title] = header;
		entries.push({
			date,
			issueNumber: Number(issueNumber),
			title: title.trim(),
			result: field(block, 'Result'),
			pr: field(block, 'PR'),
			milestone: field(block, 'Milestone'),
			model: field(block, 'Model'),
			duration: field(block, 'Execution Duration'),
			turns: parseIntField(field(block, 'Turns')),
			inputTokens: parseIntField(field(block, 'Input Tokens')),
			outputTokens: parseIntField(field(block, 'Output Tokens')),
			cost: parseCost(field(block, 'Estimated Cost')),
			run: field(block, 'Run')
		});
	}
	return entries;
}

/**
 * Parses `docs/journal.md` (this repo's own file, or any project generated from the same
 * template) into a velocity summary plus a list of per-run entries.
 *
 * @param {string} markdown
 * @returns {ParsedJournal}
 */
export function parseJournal(markdown) {
	return {
		velocity: parseVelocity(markdown),
		entries: parseEntries(markdown)
	};
}

/**
 * Fetches and parses a tracked project's `docs/journal.md` straight from
 * raw.githubusercontent.com -- no auth, no API rate limit. Tries `main` then `master`.
 * Returns `null` (not an error) when the project has no journal.md yet, which is expected
 * for a project early in its build.
 *
 * @param {string} repo "owner/name"
 * @returns {Promise<ParsedJournal|null>}
 */
export async function fetchJournal(repo) {
	let lastError = /** @type {Error|null} */ (null);
	for (const branch of FALLBACK_BRANCHES) {
		let response;
		try {
			response = await fetch(`${RAW_BASE}/${repo}/${branch}/${JOURNAL_PATH}`);
		} catch (error) {
			lastError = /** @type {Error} */ (error);
			continue;
		}
		if (response.status === 404) continue;
		if (!response.ok) {
			lastError = new Error(
				`journal.md request for ${repo}@${branch} failed: ${response.status} ${response.statusText}`
			);
			continue;
		}
		return parseJournal(await response.text());
	}
	if (lastError) throw lastError;
	return null;
}
