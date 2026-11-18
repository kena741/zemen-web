const ACCESS_KEY = "zemen_access_token";
const REFRESH_KEY = "zemen_refresh_token";

function canUseStorage(): boolean {
	return typeof window !== "undefined" && !!window.localStorage;
}

export function getAccessToken(): string | null {
	if (!canUseStorage()) return null;
	return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
	if (!canUseStorage()) return null;
	return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
	if (!canUseStorage()) return;
	window.localStorage.setItem(ACCESS_KEY, accessToken);
	window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
	if (!canUseStorage()) return;
	window.localStorage.removeItem(ACCESS_KEY);
	window.localStorage.removeItem(REFRESH_KEY);
}

export function hasStoredSession(): boolean {
	return Boolean(getAccessToken());
}
