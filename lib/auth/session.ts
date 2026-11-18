import { assertDataModeConfig, getApiBaseUrl, isBackendMode } from "@/lib/env";
import { ApiError, formatApiDetail } from "@/lib/backend/errors";
import {
	clearTokens,
	getAccessToken,
	getRefreshToken,
	setTokens,
} from "@/lib/auth/tokenStore";

export type AuthSessionPayload = {
	accessToken: string;
	refreshToken: string;
	roles: string[];
	customerId?: string | null;
	providerId?: string | null;
	handymanId?: string | null;
	user?: Record<string, unknown>;
	expiresIn?: number;
};

// ponytail: single-flight mutex — concurrent 401s share one restore
let refreshPromise: Promise<string | null> | null = null;

function normalizeSession(raw: Record<string, unknown>): AuthSessionPayload {
	const accessToken = String(raw.accessToken ?? raw.access_token ?? "");
	const refreshToken = String(raw.refreshToken ?? raw.refresh_token ?? "");
	if (!accessToken || !refreshToken) {
		throw new ApiError(500, raw, "Invalid auth session response");
	}
	const rolesRaw = raw.roles;
	const roles = Array.isArray(rolesRaw)
		? rolesRaw.map((r) => String(r))
		: [];
	return {
		accessToken,
		refreshToken,
		roles,
		customerId:
			raw.customerId != null
				? String(raw.customerId)
				: raw.customer_id != null
					? String(raw.customer_id)
					: null,
		providerId:
			raw.providerId != null
				? String(raw.providerId)
				: raw.provider_id != null
					? String(raw.provider_id)
					: null,
		handymanId:
			raw.handymanId != null
				? String(raw.handymanId)
				: raw.handyman_id != null
					? String(raw.handyman_id)
					: null,
		user:
			raw.user && typeof raw.user === "object"
				? (raw.user as Record<string, unknown>)
				: undefined,
		expiresIn:
			typeof raw.expiresIn === "number"
				? raw.expiresIn
				: typeof raw.expires_in === "number"
					? raw.expires_in
					: undefined,
	};
}

export function applySession(session: AuthSessionPayload): void {
	setTokens(session.accessToken, session.refreshToken);
}

export function clearSession(): void {
	clearTokens();
}

async function postRestore(bearer: string): Promise<AuthSessionPayload> {
	assertDataModeConfig();
	const base = getApiBaseUrl();
	const res = await fetch(`${base}/api/v1/auth/session/restore`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${bearer}`,
			Accept: "application/json",
		},
	});
	const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (!res.ok) {
		throw new ApiError(res.status, body.detail ?? body, formatApiDetail(body.detail ?? body));
	}
	return normalizeSession(body);
}

/**
 * Re-issue tokens via POST /auth/session/restore (requires a still-usable bearer).
 * Concurrent callers share one in-flight promise.
 */
export async function refreshAccessToken(): Promise<string | null> {
	if (!isBackendMode()) return null;
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			const access = getAccessToken();
			const refresh = getRefreshToken();
			if (!access && !refresh) {
				clearSession();
				return null;
			}
			// Prefer access token (API contract). Fall back to refresh as bearer if access missing.
			const bearer = access || refresh!;
			const session = await postRestore(bearer);
			applySession(session);
			return session.accessToken;
		} catch {
			clearSession();
			return null;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

export { normalizeSession };
