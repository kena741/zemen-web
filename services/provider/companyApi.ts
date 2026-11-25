import { apiFetch } from "@/lib/backend/client";
import { isBackendMode } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";

export async function saveProviderCompany(params: {
	providerId: string;
	companyName: string;
	address: string;
}): Promise<{ error: string | null }> {
	if (isBackendMode()) {
		try {
			await apiFetch("/providers/me/company", {
				method: "PUT",
				auth: true,
				body: {
					companyName: params.companyName.trim() || null,
					name: params.companyName.trim() || null,
					headquarters: params.address.trim() || null,
				},
			});
			return { error: null };
		} catch (e) {
			return {
				error: e instanceof Error ? e.message : "Failed to save company",
			};
		}
	}

	const supabase = getSupabase();
	await supabase.from("company").upsert({
		provider_id: params.providerId,
		company_name: params.companyName,
		address: params.address,
	});
	await supabase
		.from("provider")
		.update({ address: params.address })
		.eq("id", params.providerId);
	return { error: null };
}
