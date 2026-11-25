import type { AppMode } from "@/lib/brand";
import { apiFetch } from "@/lib/backend/client";
import { ApiError } from "@/lib/backend/errors";
import {
	applySession,
	clearSession,
	normalizeSession,
	type AuthSessionPayload,
} from "@/lib/auth/session";
import { getAccessToken, hasStoredSession } from "@/lib/auth/tokenStore";
import {
	looksLikePhoneIdentifier,
	normalizeLocalEthiopianPhone,
	validateEmailOrPhone,
} from "@/lib/phone";
import {
	mapCustomerRow,
	mapProviderRow,
	USER_TYPE_PROVIDER,
	type AuthUser,
	type CustomerProfile,
	type ProviderProfile,
} from "./types";

export { friendlyLoginError } from "./supabase";

type LoginBody = {
	identifier?: string;
	email?: string;
	phone?: string;
	password: string;
};

async function loginSession(
	path: "/auth/login/customer" | "/auth/login/provider" | "/auth/login",
	body: LoginBody,
): Promise<AuthSessionPayload> {
	const raw = await apiFetch<Record<string, unknown>>(path, {
		method: "POST",
		body,
	});
	return normalizeSession(raw);
}

export async function fetchProviderProfile(
	_uid: string,
): Promise<ProviderProfile | null> {
	try {
		const row = await apiFetch<Record<string, unknown>>("/providers/me", {
			auth: true,
		});
		return mapProviderRow(row);
	} catch (e) {
		if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
			return null;
		}
		console.error("fetchProviderProfile backend", e);
		return null;
	}
}

export async function fetchCustomerProfile(
	_uid: string,
): Promise<CustomerProfile | null> {
	try {
		const row = await apiFetch<Record<string, unknown>>("/customers/me", {
			auth: true,
		});
		return mapCustomerRow(row);
	} catch (e) {
		if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
			return null;
		}
		console.error("fetchCustomerProfile backend", e);
		return null;
	}
}

function displayName(
	mode: AppMode,
	provider: ProviderProfile | null,
	customer: CustomerProfile | null,
	email: string | null,
): string {
	if (mode === "provider") {
		return provider?.fullName?.trim() || email || "Provider";
	}
	return customer?.fullName?.trim() || email || "Customer";
}

export async function buildAuthUser(
	uid: string,
	email: string | null,
	mode: AppMode,
): Promise<{ user: AuthUser | null; error: string | null }> {
	if (mode === "provider") {
		const provider = await fetchProviderProfile(uid);
		if (!provider) {
			return {
				user: null,
				error: "authErrorNoProviderAccount",
			};
		}
		if (!provider.active) {
			return {
				user: null,
				error: "authErrorAccountDisabled",
			};
		}
		if (provider.userType && provider.userType !== USER_TYPE_PROVIDER) {
			// Backend ProviderOut may omit userType; treat missing as provider.
		}
		return {
			user: {
				id: uid,
				email: email ?? provider.email,
				name: displayName(mode, provider, null, email),
				mode,
				provider: {
					...provider,
					userType: provider.userType ?? USER_TYPE_PROVIDER,
				},
				customer: null,
			},
			error: null,
		};
	}

	const customer = await fetchCustomerProfile(uid);
	if (!customer) {
		return {
			user: null,
			error: "authErrorNoCustomerAccount",
		};
	}
	if (customer.active === false) {
		return {
			user: null,
			error: "authErrorAccountDisabled",
		};
	}
	return {
		user: {
			id: uid,
			email: email ?? customer.email,
			name: displayName(mode, null, customer, email),
			mode,
			provider: null,
			customer,
		},
		error: null,
	};
}

export async function phoneAlreadyRegistered(
	phone: string,
	_mode: AppMode,
): Promise<{ taken: boolean | null }> {
	const local = normalizeLocalEthiopianPhone(phone);
	if (local.length !== 9) return { taken: false };
	// ponytail: no dedicated "phone taken" API; signup endpoint rejects duplicates
	void local;
	void _mode;
	return { taken: false };
}

function resolveIdentifier(identifier: string): Omit<LoginBody, "password"> {
	const raw = identifier.trim();
	if (looksLikePhoneIdentifier(raw)) {
		return { phone: raw, identifier: raw };
	}
	return { email: raw.toLowerCase(), identifier: raw };
}

export async function loginWithEmailOrPhone(params: {
	identifier: string;
	password: string;
	mode: AppMode;
}): Promise<{ user: AuthUser | null; error: string | null }> {
	const { identifier, password, mode } = params;
	const validation = validateEmailOrPhone(identifier.trim());
	if (validation) {
		const { friendlyLoginError } = await import("./supabase");
		return { user: null, error: friendlyLoginError(validation) };
	}

	const id = resolveIdentifier(identifier);
	const path =
		mode === "provider" ? "/auth/login/provider" : "/auth/login/customer";

	try {
		const session = await loginSession(path, { ...id, password });
		applySession(session);

		const uid =
			(session.user?.id != null ? String(session.user.id) : null) ||
			(mode === "provider"
				? session.providerId
				: session.customerId) ||
			"";
		const email =
			session.user?.email != null
				? String(session.user.email)
				: id.email ?? null;

		// Prefer /auth/me for stable user id
		let userId = uid;
		let userEmail = email;
		try {
			const me = await apiFetch<{
				userId?: string;
				user_id?: string;
				email?: string | null;
			}>("/auth/me", { auth: true });
			userId = String(me.userId ?? me.user_id ?? userId);
			if (me.email) userEmail = me.email;
		} catch {
			/* keep session ids */
		}

		const built = await buildAuthUser(userId, userEmail, mode);
		if (!built.user) {
			clearSession();
			const { friendlyLoginError } = await import("./supabase");
			return { user: null, error: friendlyLoginError(built.error) };
		}
		return built;
	} catch (e) {
		const { friendlyLoginError } = await import("./supabase");
		const msg = e instanceof Error ? e.message : "Login failed";
		return { user: null, error: friendlyLoginError(msg) };
	}
}

export async function restoreSession(
	mode: AppMode,
): Promise<{ user: AuthUser | null; error: string | null }> {
	if (!hasStoredSession()) return { user: null, error: null };

	try {
		// Re-issue tokens while access token still works
		const token = getAccessToken();
		if (token) {
			try {
				const raw = await apiFetch<Record<string, unknown>>(
					"/auth/session/restore",
					{ method: "POST", auth: true },
				);
				applySession(normalizeSession(raw));
			} catch {
				/* continue with existing access token */
			}
		}

		const me = await apiFetch<{
			userId?: string;
			user_id?: string;
			email?: string | null;
			roles?: string[];
		}>("/auth/me", { auth: true });

		const uid = String(me.userId ?? me.user_id ?? "");
		const built = await buildAuthUser(uid, me.email ?? null, mode);
		if (!built.user) {
			clearSession();
			return { user: null, error: built.error };
		}
		return built;
	} catch (e) {
		clearSession();
		if (e instanceof ApiError && e.status === 401) {
			return { user: null, error: null };
		}
		const { friendlyLoginError } = await import("./supabase");
		const msg = e instanceof Error ? e.message : null;
		return { user: null, error: friendlyLoginError(msg) };
	}
}

export async function signOut(): Promise<void> {
	try {
		if (getAccessToken()) {
			await apiFetch("/auth/logout", { method: "POST", auth: true });
		}
	} catch {
		/* still clear local */
	}
	clearSession();
}
