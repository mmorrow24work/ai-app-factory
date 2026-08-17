const STATUS_API_BASE = 'https://status.claude.com/api/v2';
const DEFAULT_POLL_INTERVAL_MS = 90_000;

/** @typedef {'none' | 'minor' | 'major' | 'critical'} StatusIndicator */
/** @typedef {{indicator: StatusIndicator, description: string}} StatusSummary */
/** @typedef {{id: string, name: string, impact: string, shortlink: string, status: string}} Incident */
/** @typedef {{status: StatusSummary, incidents: Incident[]}} ClaudeStatusSnapshot */

/**
 * @param {string} path
 * @returns {Promise<any>}
 */
async function fetchJson(path) {
	const response = await fetch(`${STATUS_API_BASE}${path}`);
	if (!response.ok) {
		throw new Error(`status.claude.com request to ${path} failed: ${response.status}`);
	}
	return response.json();
}

/** @returns {Promise<StatusSummary>} */
export async function fetchClaudeStatus() {
	const data = await fetchJson('/status.json');
	return { indicator: data.status.indicator, description: data.status.description };
}

/** @returns {Promise<Incident[]>} */
export async function fetchUnresolvedIncidents() {
	const data = await fetchJson('/incidents/unresolved.json');
	return /** @type {Incident[]} */ (data.incidents ?? []).map((incident) => ({
		id: incident.id,
		name: incident.name,
		impact: incident.impact,
		shortlink: incident.shortlink,
		status: incident.status
	}));
}

/**
 * Polls status.claude.com on an interval until `stop()` is called. Fetches the overall
 * indicator and any unresolved incidents together so the badge can show incident detail
 * without a second round trip. A failed poll calls `onError` and leaves the previous
 * snapshot in place rather than clearing it -- a single dropped request shouldn't flash
 * the badge to "unknown" when the platform is actually fine.
 *
 * @param {{
 *   onUpdate: (snapshot: ClaudeStatusSnapshot) => void,
 *   onError?: (error: unknown) => void,
 *   intervalMs?: number
 * }} opts
 * @returns {() => void} stop function
 */
export function pollClaudeStatus({ onUpdate, onError, intervalMs = DEFAULT_POLL_INTERVAL_MS }) {
	let stopped = false;

	async function poll() {
		if (stopped) return;
		try {
			const [status, incidents] = await Promise.all([
				fetchClaudeStatus(),
				fetchUnresolvedIncidents()
			]);
			if (!stopped) onUpdate({ status, incidents });
		} catch (error) {
			if (!stopped) onError?.(error);
		}
	}

	poll();
	const interval = setInterval(poll, intervalMs);

	return function stop() {
		stopped = true;
		clearInterval(interval);
	};
}
