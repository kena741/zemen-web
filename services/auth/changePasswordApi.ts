import { apiFetch } from "@/lib/backend/client";
import { isBackendMode } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";
import { friendlyLoginError } from "./authApi";

export async function changeAccountPassword(params: {
	email: string;
	oldPassword: string;
	newPassword: string;
	/** Optional profile table sync (supabase mode only). */
	profile?: { table: "provider" | "customer"; id: string };
}): Promise<{ error: string | null }> {
	if (params.newPassword.length < 6) return { error: "passwordMinLength" };

	if (isBackendMode()) {
		try {
			await apiFetch("/auth/password/change", {
				method: "POST",
				auth: true,
				body: {
					oldPassword: params.oldPassword,
					newPassword: params.newPassword,
				},
			});
			return { error: null };
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Password change failed";
			return { error: friendlyLoginError(msg) };
		}
	}

	const supabase = getSupabase();
	const verify = await supabase.auth.signInWithPassword({
		email: params.email,
		password: params.oldPassword,
	});
	if (verify.error) return { error: "authErrorCredentials" };

	const { error: updateError } = await supabase.auth.updateUser({
		password: params.newPassword,
	});
	if (updateError) return { error: friendlyLoginError(updateError.message) };

	if (params.profile) {
		await supabase
			.from(params.profile.table)
			.update({ password: params.newPassword })
			.eq("id", params.profile.id);
	}
	return { error: null };
}
