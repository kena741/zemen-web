/** Returns a usable http(s) image URL, or null for empty/invalid values. */
export function sanitizeImageUrl(value: unknown): string | null {
	if (value == null) return null;
	const raw = String(value).trim();
	if (!raw) return null;

	const lower = raw.toLowerCase();
	if (
		lower === "null" ||
		lower === "undefined" ||
		lower === "none" ||
		lower === "n/a"
	) {
		return null;
	}

	// Asset paths from mobile are not loadable on web
	if (
		lower.startsWith("assets/") ||
		lower.startsWith("file:") ||
		lower.startsWith("content:")
	) {
		return null;
	}

	if (raw.startsWith("//")) return `https:${raw}`;

	if (raw.startsWith("http://") || raw.startsWith("https://")) {
		try {
			new URL(raw);
			return raw;
		} catch {
			return null;
		}
	}

	// Relative storage paths sometimes stored without host
	if (raw.startsWith("/") || raw.includes("betegnabucket")) {
		return null;
	}

	return null;
}

export function initialsFromName(name: string | null | undefined): string {
	const parts = (name ?? "")
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (!parts.length) return "?";
	if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
	return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}
