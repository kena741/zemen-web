/** Matches Flutter `Constant.bookingDescriptionForbiddenChars`. */
const BOOKING_DESCRIPTION_FORBIDDEN = /[/\\{}$#&[\]<>)]/;

export const BOOKING_DESCRIPTION_MIN = 10;
export const BOOKING_DESCRIPTION_MAX = 1000;

export type BookingDescriptionIssue =
	| "empty"
	| "tooShort"
	| "tooLong"
	| "invalidChars"
	| null;

export function validateBookingDescription(
	raw: string,
	opts?: { min?: number; max?: number },
): BookingDescriptionIssue {
	const description = raw.trim();
	const min = opts?.min ?? BOOKING_DESCRIPTION_MIN;
	const max = opts?.max ?? BOOKING_DESCRIPTION_MAX;
	if (!description) return "empty";
	if (description.length < min) return "tooShort";
	if (description.length > max) return "tooLong";
	if (BOOKING_DESCRIPTION_FORBIDDEN.test(description)) return "invalidChars";
	return null;
}

/** Strip forbidden characters while typing (mobile TextField filter). */
export function filterBookingDescriptionInput(raw: string): string {
	return raw.replace(/[/\\{}$#&[\]<>)]/g, "");
}

export function isPastTimeOnDate(isoDate: string, hhmm: string, now = new Date()): boolean {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	if (isoDate !== `${y}-${m}-${d}`) return false;
	const [h, min] = hhmm.split(":").map(Number);
	if (!Number.isFinite(h) || !Number.isFinite(min)) return false;
	const minutes = h * 60 + min;
	const nowMinutes = now.getHours() * 60 + now.getMinutes();
	return minutes < nowMinutes;
}
