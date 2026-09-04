import type { AppMode } from "@/lib/brand";
import { getEdgeFunctionsBaseUrl, getSiteUrl } from "@/lib/env";
import { normalizeLocalEthiopianPhone } from "@/lib/phone";
import { getSupabase } from "@/lib/supabase/client";
import { friendlyLoginError } from "./authApi";

export async function requestPasswordResetEmail(
	email: string,
): Promise<{ error: string | null }> {
	const normalized = email.trim().toLowerCase();
	if (!normalized) return { error: "Email is required" };

	const redirectTo = `${getSiteUrl()}/reset-password`;
	const { error } = await getSupabase().auth.resetPasswordForEmail(normalized, {
		redirectTo,
	});
	if (error) return { error: friendlyLoginError(error.message) };
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
	const { error } = await getSupabase().auth.updateUser({ password: newPassword });
	if (error) return { error: friendlyLoginError(error.message) };
	return { error: null };
}
