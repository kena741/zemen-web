import type { AppMode } from "@/lib/brand";
import { getEdgeFunctionsBaseUrl } from "@/lib/env";
import {
	looksLikePhoneIdentifier,
	normalizeLocalEthiopianPhone,
	validateEmailOrPhone,
} from "@/lib/phone";
import { getSupabase } from "@/lib/supabase/client";
import {
	mapCustomerRow,
	mapProviderRow,
	USER_TYPE_PROVIDER,
	type AuthUser,
	type CustomerProfile,
	type ProviderProfile,
} from "./types";

export function friendlyLoginError(rawError: string | null | undefined): string {
	const raw = rawError?.trim() ?? "";
	if (!raw) return "Something went wrong. Please try again.";

	const lower = raw.toLowerCase();
	if (
		lower.includes("failed to fetch") ||
		lower.includes("network") ||
		lower.includes("offline")
	) {
		return "No internet connection. Please check your network and try again.";
	}
	if (
		lower.includes("invalid login credentials") ||
		lower.includes("invalid email or password") ||
		lower.includes("invalid credentials")
	) {
		return "Email, phone, or password is incorrect.";
	}
	if (lower.includes("no account found for this phone")) {
		return "No account found for this phone number.";
	}
	if (lower.includes("email or phone is required")) {
		return "Email or phone is required.";
	}
	if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
		return "Please verify your email before signing in.";
	}
	if (lower.includes("exception") || lower.includes("errno")) {
		return "Something went wrong. Please try again.";
	}
	return raw;
}

async function getProviderEmailByPhone(phone: string): Promise<string | null> {
	const local = normalizeLocalEthiopianPhone(phone);
	if (local.length !== 9) return null;

	const { data, error } = await getSupabase()
		.from("provider")
		.select("email")
		.or(
			`phoneNumber.eq.${local},phoneNumber.eq.0${local},phoneNumber.eq.251${local}`,
		)
		.maybeSingle();

	if (error) {
		console.error("getProviderEmailByPhone", error);
		return null;
	}
	const email = data?.email?.toString().trim() ?? "";
	return email || null;
}

async function getCustomerEmailByPhone(phone: string): Promise<string | null> {
	const local = normalizeLocalEthiopianPhone(phone);
	if (local.length !== 9) return null;

	const { data, error } = await getSupabase()
		.from("customer")
		.select("email")
		.or(`phone.eq.${local},phone.eq.0${local},phone.eq.251${local}`)
		.maybeSingle();

	if (error) {
		console.error("getCustomerEmailByPhone", error);
		return null;
	}
	const email = data?.email?.toString().trim() ?? "";
	return email || null;
}

async function resolveLoginEmail(
	identifier: string,
	mode: AppMode,
): Promise<{ email: string | null; error: string | null }> {
	const raw = identifier.trim();
	if (!raw) return { email: null, error: "Email or phone is required" };

	const validation = validateEmailOrPhone(raw);
	if (validation) return { email: null, error: validation };

	if (looksLikePhoneIdentifier(raw)) {
		const email =
			mode === "provider"
				? await getProviderEmailByPhone(raw)
				: await getCustomerEmailByPhone(raw);
		if (!email) {
			return { email: null, error: "No account found for this phone number" };
		}
		return { email, error: null };
	}

	return { email: raw.toLowerCase(), error: null };
}

async function loginCustomerViaEdge(
	email: string,
	password: string,
): Promise<{ session: { access_token: string; refresh_token: string } | null; error: string | null }> {
	const base = getEdgeFunctionsBaseUrl();
	if (!base) {
		return { session: null, error: "Login service unavailable" };
	}

	try {
		const res = await fetch(`${base}/login-customer`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		const data = (await res.json()) as {
			success?: boolean;
			error?: string;
			access_token?: string;
			refresh_token?: string;
		};
		if (!res.ok || !data.success || !data.access_token || !data.refresh_token) {
			return { session: null, error: data.error ?? "Login failed" };
		}
		return {
			session: {
				access_token: data.access_token,
				refresh_token: data.refresh_token,
			},
			error: null,
		};
	} catch {
		return { session: null, error: "No internet connection" };
	}
}

export async function fetchProviderProfile(
	uid: string,
): Promise<ProviderProfile | null> {
	const supabase = getSupabase();

	let { data, error } = await supabase
		.from("provider")
		.select("*")
		.eq("id", uid)
		.maybeSingle();

	if (!data && !error) {
		({ data, error } = await supabase
			.from("provider")
			.select("*")
			.eq("user_id", uid)
			.maybeSingle());
	}

	if (error) {
		console.error("fetchProviderProfile", error);
		return null;
	}
	if (!data) return null;
	return mapProviderRow(data as Record<string, unknown>);
}

export async function fetchCustomerProfile(
	uid: string,
): Promise<CustomerProfile | null> {
	const supabase = getSupabase();

	let { data, error } = await supabase
		.from("customer")
		.select("*")
		.eq("id", uid)
		.maybeSingle();

	if (!data && !error) {
		({ data, error } = await supabase
			.from("customer")
			.select("*")
			.eq("user_id", uid)
			.maybeSingle());
	}

	if (error) {
		console.error("fetchCustomerProfile", error);
		return null;
	}
	if (!data) return null;
	return mapCustomerRow(data as Record<string, unknown>);
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
				error: "No provider account found for these credentials.",
			};
		}
		if (!provider.active) {
			return {
				user: null,
				error: "Your account is disabled. Please contact an administrator.",
			};
		}
		if (provider.userType !== USER_TYPE_PROVIDER) {
			return {
				user: null,
				error: "This account is not a provider. Switch to Customer to continue.",
			};
		}
		return {
			user: {
				id: uid,
				email,
				name: displayName(mode, provider, null, email),
				mode,
				provider,
				customer: null,
			},
			error: null,
		};
	}

	const customer = await fetchCustomerProfile(uid);
	if (!customer) {
		return {
			user: null,
			error: "No customer account found for these credentials.",
		};
	}
	if (customer.active === false) {
		return {
			user: null,
			error: "Your account is disabled. Please contact an administrator.",
		};
	}
	return {
		user: {
			id: uid,
			email,
			name: displayName(mode, null, customer, email),
			mode,
			provider: null,
			customer,
		},
		error: null,
	};
}

export async function loginWithEmailOrPhone(params: {
	identifier: string;
	password: string;
	mode: AppMode;
}): Promise<{ user: AuthUser | null; error: string | null }> {
	const { identifier, password, mode } = params;
	const resolved = await resolveLoginEmail(identifier, mode);
	if (!resolved.email) {
		return { user: null, error: friendlyLoginError(resolved.error) };
	}

	const { data, error } = await getSupabase().auth.signInWithPassword({
		email: resolved.email,
		password,
	});

	if ((error || !data.user) && mode === "service") {
		const msg = (error?.message ?? "").toLowerCase();
		if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
			const edge = await loginCustomerViaEdge(resolved.email, password);
			if (edge.session) {
				const { data: sessionData, error: sessionErr } =
					await getSupabase().auth.setSession({
						access_token: edge.session.access_token,
						refresh_token: edge.session.refresh_token,
					});
				if (!sessionErr && sessionData.user) {
					const built = await buildAuthUser(
						sessionData.user.id,
						sessionData.user.email ?? resolved.email,
						mode,
					);
					if (built.user) return built;
				}
			}
		}
	}

	if (error || !data.user) {
		return {
			user: null,
			error: friendlyLoginError(error?.message ?? "Login failed"),
		};
	}

	const built = await buildAuthUser(
		data.user.id,
		data.user.email ?? resolved.email,
		mode,
	);

	if (!built.user) {
		await getSupabase().auth.signOut();
		return { user: null, error: friendlyLoginError(built.error) };
	}

	return built;
}

export async function restoreSession(
	mode: AppMode,
): Promise<{ user: AuthUser | null; error: string | null }> {
	const supabase = getSupabase();
	const { data, error } = await supabase.auth.getSession();
	if (error) {
		return { user: null, error: friendlyLoginError(error.message) };
	}
	const session = data.session;
	if (!session?.user) return { user: null, error: null };

	const built = await buildAuthUser(
		session.user.id,
		session.user.email ?? null,
		mode,
	);

	if (!built.user) {
		await supabase.auth.signOut();
		return { user: null, error: built.error };
	}

	return built;
}

export async function signOut(): Promise<void> {
	await getSupabase().auth.signOut();
}
