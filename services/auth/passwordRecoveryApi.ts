import type { AppMode } from "@/lib/brand";
import { getEdgeFunctionsBaseUrl, getSiteUrl } from "@/lib/env";
import { normalizeLocalEthiopianPhone } from "@/lib/phone";
import { getSupabase } from "@/lib/supabase/client";
import { friendlyLoginError } from "./authApi";

function resetRedirectUrl(): string {
	const base =
		typeof window !== "undefined" ? window.location.origin : getSiteUrl();
	return `${base.replace(/\/$/, "")}/reset-password`;
}

export async function checkEmailForPasswordReset(params: {
	email: string;
	mode: AppMode;
}): Promise<{ error: string | null }> {
	const email = params.email.trim().toLowerCase();
	if (!email) return { error: "Email is required" };

	const table = params.mode === "provider" ? "provider" : "customer";
	const { data, error } = await getSupabase()
		.from(table)
		.select("id, login_type")
		.ilike("email", email)
		.maybeSingle();

	if (error) return { error: friendlyLoginError(error.message) };
	if (!data) return { error: "No account found for this email." };

	const loginType = String(
		(data as { login_type?: string | null }).login_type ?? "",
	)
		.trim()
		.toLowerCase();
	if (loginType === "google" || loginType === "apple") {
		return {
			error: "This account uses social login. Password reset is not available.",
		};
	}
	return { error: null };
}

/** Sends Supabase recovery email (OTP + link). Link must land on this web app. */
export async function requestPasswordResetEmail(
	email: string,
): Promise<{ error: string | null }> {
	const normalized = email.trim().toLowerCase();
	if (!normalized) return { error: "Email is required" };

	const redirectTo = resetRedirectUrl();
	const { error } = await getSupabase().auth.resetPasswordForEmail(normalized, {
		redirectTo,
	});
	if (error) {
		const msg = error.message.toLowerCase();
		if (msg.includes("redirect") || msg.includes("redirect_to")) {
			return {
				error:
					"Reset email could not be sent (redirect URL not allowed). Contact support.",
			};
		}
		return { error: friendlyLoginError(error.message) };
	}
	return { error: null };
}

/** Verify email recovery OTP, then set the new password. */
export async function resetPasswordWithEmailOtp(params: {
	email: string;
	token: string;
	newPassword: string;
}): Promise<{ error: string | null }> {
	const email = params.email.trim().toLowerCase();
	const token = params.token.trim();
	if (!email || !token) return { error: "Email and code are required" };
	if (params.newPassword.length < 6) {
		return { error: "Password must be at least 6 characters" };
	}

	const supabase = getSupabase();
	const { error: verifyErr } = await supabase.auth.verifyOtp({
		type: "recovery",
		email,
		token,
	});
	if (verifyErr) return { error: friendlyLoginError(verifyErr.message) };

	const { error: updateErr } = await supabase.auth.updateUser({
		password: params.newPassword,
	});
	if (updateErr) return { error: friendlyLoginError(updateErr.message) };

	await supabase.auth.signOut();
	return { error: null };
}

export async function resetPasswordByPhone(params: {
	phone: string;
	code: string;
	verificationId: string;
	newPassword: string;
	mode: AppMode;
}): Promise<{ error: string | null }> {
	const edgeBase = getEdgeFunctionsBaseUrl();
	if (!edgeBase) {
		return { error: "Password reset is not configured on this deployment" };
	}

	const path =
		params.mode === "provider"
			? "reset-password-by-phone-provider"
			: "reset-password-by-phone";
	const local = normalizeLocalEthiopianPhone(params.phone);

	try {
		const res = await fetch(`${edgeBase}/${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				phone: local,
				code: params.code.trim(),
				verificationId: params.verificationId,
				newPassword: params.newPassword,
			}),
		});
		const data = (await res.json()) as { success?: boolean; error?: string };
		if (!res.ok || !data.success) {
			return { error: friendlyLoginError(data.error || "Reset failed") };
		}
		return { error: null };
	} catch {
		return { error: "No internet connection" };
	}
}

export async function updatePasswordFromRecovery(
	newPassword: string,
): Promise<{ error: string | null }> {
	const { error } = await getSupabase().auth.updateUser({
		password: newPassword,
	});
	if (error) return { error: friendlyLoginError(error.message) };
	return { error: null };
}
