import type { AppMode } from "@/lib/brand";
import { apiFetch } from "@/lib/backend/client";
import { applySession, normalizeSession } from "@/lib/auth/session";
import { getEdgeFunctionsBaseUrl, isBackendMode } from "@/lib/env";
import {
	normalizeLocalEthiopianPhone,
	validateEmail,
	validateLoginPhoneNumber,
} from "@/lib/phone";
import { syntheticEmailFromPhone } from "@/lib/synthetic-email";
import { getSupabase } from "@/lib/supabase/client";
import { friendlyLoginError } from "./authApi";

export interface CustomerSignupInput {
	firstName: string;
	lastName: string;
	userName?: string;
	email?: string;
	phone: string;
	countryCode?: string;
	password: string;
	address?: string;
	phoneVerified?: boolean;
	signupSource?: string | null;
}

export interface ProviderSignupInput {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	countryCode?: string;
	password: string;
	address?: string;
	signupSource?: string | null;
}

function slugFromName(first: string, last: string): string {
	const base = `${first}-${last}`
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	return base || `provider-${Date.now()}`;
}

async function signUpCustomerBackend(
	input: CustomerSignupInput,
): Promise<{ userId: string | null; error: string | null }> {
	const phoneErr = validateLoginPhoneNumber(input.phone);
	if (phoneErr) return { userId: null, error: phoneErr };

	const email =
		input.email?.trim() ||
		(input.phoneVerified ? syntheticEmailFromPhone(input.phone) : null);
	if (!email) return { userId: null, error: "Email or verified phone is required" };
	if (input.email?.trim()) {
		const emailErr = validateEmail(input.email);
		if (emailErr) return { userId: null, error: emailErr };
	}

	try {
		const raw = await apiFetch<Record<string, unknown>>("/auth/signup/customer", {
			method: "POST",
			body: {
				email,
				password: input.password,
				first_name: input.firstName.trim(),
				last_name: input.lastName.trim(),
				user_name:
					input.userName?.trim() ||
					`${input.firstName} ${input.lastName}`.trim(),
				phone: normalizeLocalEthiopianPhone(input.phone),
				country_code: input.countryCode || "+251",
				address: input.address?.trim() || null,
				login_type: "app",
			},
		});
		const session = normalizeSession(raw);
		applySession(session);
		const userId =
			(session.user?.id != null ? String(session.user.id) : null) ||
			session.customerId ||
			null;
		return { userId, error: null };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Signup failed";
		return { userId: null, error: friendlyLoginError(msg) };
	}
}

async function signUpProviderBackend(
	input: ProviderSignupInput,
): Promise<{ userId: string | null; error: string | null }> {
	const emailErr = validateEmail(input.email);
	if (emailErr) return { userId: null, error: emailErr };
	const phoneErr = validateLoginPhoneNumber(input.phone);
	if (phoneErr) return { userId: null, error: phoneErr };

	try {
		const raw = await apiFetch<Record<string, unknown>>("/auth/signup/provider", {
			method: "POST",
			body: {
				email: input.email.trim().toLowerCase(),
				password: input.password,
				first_name: input.firstName.trim(),
				last_name: input.lastName.trim(),
				user_name: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
				phone: normalizeLocalEthiopianPhone(input.phone),
				country_code: input.countryCode || "+251",
				address: input.address?.trim() || null,
			},
		});
		const session = normalizeSession(raw);
		applySession(session);
		const userId =
			(session.user?.id != null ? String(session.user.id) : null) ||
			session.providerId ||
			null;
		return { userId, error: null };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Signup failed";
		return { userId: null, error: friendlyLoginError(msg) };
	}
}

export async function signUpCustomer(
	input: CustomerSignupInput,
): Promise<{ userId: string | null; error: string | null }> {
	if (isBackendMode()) return signUpCustomerBackend(input);

	const phoneErr = validateLoginPhoneNumber(input.phone);
	if (phoneErr) return { userId: null, error: phoneErr };

	const email =
		input.email?.trim() ||
		(input.phoneVerified ? syntheticEmailFromPhone(input.phone) : null);
	if (!email) return { userId: null, error: "Email or verified phone is required" };
	if (input.email?.trim()) {
		const emailErr = validateEmail(input.email);
		if (emailErr) return { userId: null, error: emailErr };
	}

	const edgeBase = getEdgeFunctionsBaseUrl();
	if (!edgeBase) {
		return { userId: null, error: "Signup is not configured on this deployment" };
	}

	try {
		const res = await fetch(`${edgeBase}/signup-customer`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email,
				password: input.password,
				first_name: input.firstName.trim(),
				last_name: input.lastName.trim(),
				user_name:
					input.userName?.trim() ||
					`${input.firstName} ${input.lastName}`.trim(),
				phone: normalizeLocalEthiopianPhone(input.phone),
				country_code: input.countryCode || "+251",
				address: input.address?.trim() || "",
				login_type: "email",
				fcmToken: "",
				profile_pic: "",
				wallet_amount: "0",
				active: true,
				signup_source: input.signupSource || undefined,
			}),
		});
		const data = (await res.json()) as {
			success?: boolean;
			userId?: string;
			error?: string;
		};
		if (!res.ok || !data.success || !data.userId) {
			return {
				userId: null,
				error: friendlyLoginError(data.error || "Signup failed"),
			};
		}
		return { userId: data.userId, error: null };
	} catch {
		return { userId: null, error: "No internet connection" };
	}
}

export async function signUpProvider(
	input: ProviderSignupInput,
): Promise<{ userId: string | null; error: string | null }> {
	if (isBackendMode()) return signUpProviderBackend(input);

	const emailErr = validateEmail(input.email);
	if (emailErr) return { userId: null, error: emailErr };
	const phoneErr = validateLoginPhoneNumber(input.phone);
	if (phoneErr) return { userId: null, error: phoneErr };

	const supabase = getSupabase();
	const userName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
	const phone = normalizeLocalEthiopianPhone(input.phone);

	const { data, error } = await supabase.auth.signUp({
		email: input.email.trim().toLowerCase(),
		password: input.password,
		options: {
			data: {
				user_type: "Provider",
				first_name: input.firstName.trim(),
				last_name: input.lastName.trim(),
				user_name: userName,
				country_code: input.countryCode || "+251",
				phone_number: phone,
				address: input.address?.trim() || "",
				slug: slugFromName(input.firstName, input.lastName),
				profile_image: "",
				signup_source: input.signupSource || undefined,
			},
		},
	});

	if (error || !data.user) {
		return {
			userId: null,
			error: friendlyLoginError(error?.message || "Signup failed"),
		};
	}

	const uid = data.user.id;
	const { data: existing } = await supabase
		.from("provider")
		.select("id")
		.eq("id", uid)
		.maybeSingle();

	if (!existing) {
		const base = {
			id: uid,
			user_id: uid,
			email: input.email.trim().toLowerCase(),
			firstName: input.firstName.trim(),
			lastName: input.lastName.trim(),
			userName,
			phoneNumber: phone,
			address: input.address?.trim() || "",
			userType: "Provider",
			active: true,
			slug: slugFromName(input.firstName, input.lastName),
			walletAmount: "0",
		};
		let { error: upsertErr } = await supabase.from("provider").upsert({
			...base,
			...(input.signupSource ? { signupSource: input.signupSource } : {}),
		});
		if (upsertErr && input.signupSource) {
			({ error: upsertErr } = await supabase.from("provider").upsert(base));
		}
		if (upsertErr) {
			return { userId: null, error: friendlyLoginError(upsertErr.message) };
		}
	}

	return { userId: uid, error: null };
}

export async function finishSignupLogin(
	email: string,
	password: string,
	mode: AppMode,
): Promise<{ error: string | null }> {
	if (isBackendMode()) {
		const { loginWithEmailOrPhone } = await import("./index");
		const result = await loginWithEmailOrPhone({
			identifier: email,
			password,
			mode,
		});
		return { error: result.error };
	}

	const { error } = await getSupabase().auth.signInWithPassword({
		email: email.trim().toLowerCase(),
		password,
	});
	if (error) return { error: friendlyLoginError(error.message) };
	return { error: null };
}

export async function stampCustomerSignupSource(
	userId: string,
	signupSource: string,
): Promise<void> {
	if (isBackendMode()) {
		// ponytail: attribution via backend profile patch when available
		void userId;
		void signupSource;
		return;
	}
	await getSupabase()
		.from("customer")
		.update({ signup_source: signupSource })
		.eq("id", userId);
}
