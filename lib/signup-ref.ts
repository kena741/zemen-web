/** Allowed signup attribution codes from ?ref= (e.g. qr). */
export function sanitizeSignupRef(raw: string | null | undefined): string | null {
	const s = (raw ?? "").trim().toLowerCase();
	if (!/^[a-z0-9_-]{1,32}$/.test(s)) return null;
	return s;
}
