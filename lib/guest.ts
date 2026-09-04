const GUEST_KEY = "zemen_guest_browse";

export function isGuestBrowse(): boolean {
	if (typeof window === "undefined") return false;
	return window.localStorage.getItem(GUEST_KEY) === "1";
}

export function enableGuestBrowse(): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(GUEST_KEY, "1");
}

export function clearGuestBrowse(): void {
	if (typeof window === "undefined") return;
	window.localStorage.removeItem(GUEST_KEY);
}

/** Paths guests may browse without auth (mobile parity). */
export function isGuestAllowedPath(pathname: string | null): boolean {
	if (!pathname) return false;
	if (pathname === "/service") return true;
	if (pathname === "/service/profile") return true;
	if (pathname === "/service/categories") return true;
	if (pathname === "/service/offers") return true;
	if (pathname === "/service/services" || pathname.startsWith("/service/services/"))
		return true;
	return false;
}

export function loginPathForGuest(nextPath?: string | null): string {
	if (!nextPath || nextPath === "/service") return "/login";
	return `/login?next=${encodeURIComponent(nextPath)}`;
}
