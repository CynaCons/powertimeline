export const dayMs = 24 * 60 * 60 * 1000;

/**
 * Format an ISO-like date string to YYYY-MM-DD. If parsing fails, return the original.
 * Accepts inputs like 'YYYY-MM-DD' or full ISO strings.
 */
export function formatISODate(input: string): string {
	if (!input) return input;
	// Fast path for already YYYY-MM-DD
	const m = /^\d{4}-\d{2}-\d{2}$/.exec(input);
	if (m) return input;
	const d = new Date(input);
	if (isNaN(d.getTime())) return input;
	// Use UTC to avoid TZ shifts
	const iso = d.toISOString();
	return iso.slice(0, 10);
}
