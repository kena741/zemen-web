import { apiFetch } from "@/lib/backend/client";
import { isBackendMode } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";
import { mapBankRow, type BankMethod } from "./types";

function ownerIds(authUserId: string, providerId: string | null): string[] {
	const ids = new Set<string>();
	if (authUserId) ids.add(authUserId);
	if (providerId) ids.add(providerId);
	return [...ids];
}

function mapApiBank(row: Record<string, unknown>): BankMethod {
	return mapBankRow({
		...row,
		providerID: row.providerID ?? row.providerId ?? row.provider_id,
		method_type: row.method_type ?? row.methodType ?? "bank",
		method_code: row.method_code ?? row.methodCode,
		method_name: row.method_name ?? row.methodName,
		is_active: row.is_active ?? row.isActive,
		is_default: row.is_default ?? row.isDefault,
	});
}

export async function fetchBankMethods(params: {
	authUserId: string;
	providerId: string | null;
}): Promise<{ banks: BankMethod[]; error: string | null }> {
	if (isBackendMode()) {
		try {
			const page = await apiFetch<
				| { items?: Record<string, unknown>[]; data?: Record<string, unknown>[] }
				| Record<string, unknown>[]
			>("/wallet/payment-methods", { auth: true });
			const rows = Array.isArray(page)
				? page
				: (page.items ?? page.data ?? []);
			return {
				banks: rows.map((row) => mapApiBank(row)),
				error: null,
			};
		} catch (e) {
			return {
				banks: [],
				error: e instanceof Error ? e.message : "Failed to load banks",
			};
		}
	}

	const ids = ownerIds(params.authUserId, params.providerId);
	if (!ids.length) return { banks: [], error: "Missing user id" };

	const { data, error } = await getSupabase()
		.from("provider_payment_methods")
		.select("*")
		.in("providerID", ids)
		.eq("method_type", "bank")
		.order("is_default", { ascending: false });

	if (error) {
		console.error("fetchBankMethods", error);
		return { banks: [], error: error.message };
	}

	return {
		banks: (data ?? []).map((row) =>
			mapBankRow(row as Record<string, unknown>),
		),
		error: null,
	};
}

export async function saveBankMethod(params: {
	authUserId: string;
	id?: string | null;
	holderName: string;
	accountNumber: string;
	bankName: string;
	swiftCode?: string;
	branchCity?: string;
	branchCountry?: string;
	/** When omitted: true for create, false for update (preserves current default). */
	setAsDefault?: boolean;
}): Promise<{ ok: boolean; error: string | null }> {
	const bankName = params.bankName.trim();
	const methodName = bankName || "Bank";
	const methodCode = methodName.toLowerCase().replace(/\s+/g, "_");
	const accountNumber = params.accountNumber.trim();
	if (!accountNumber) {
		return { ok: false, error: "Account number is required" };
	}

	const setAsDefault = params.setAsDefault ?? !params.id;

	if (isBackendMode()) {
		try {
			await apiFetch("/wallet/payment-methods", {
				method: "POST",
				auth: true,
				body: {
					bankName: bankName || null,
					accountNumber,
					holderName: params.holderName.trim(),
					swiftCode: params.swiftCode?.trim() || null,
					branchCity: params.branchCity?.trim() || null,
					branchCountry: params.branchCountry?.trim() || null,
					methodType: "bank",
					methodCode,
					methodName,
					isDefault: setAsDefault,
					isActive: true,
				},
			});
			return { ok: true, error: null };
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : "Failed to save bank",
			};
		}
	}

	const providerID = params.authUserId;
	const supabase = getSupabase();

	if (setAsDefault) {
		await supabase
			.from("provider_payment_methods")
			.update({ is_default: false })
			.eq("providerID", providerID);
	}

	const payload: Record<string, unknown> = {
		providerID,
		method_type: "bank",
		method_code: methodCode,
		method_name: methodName,
		holderName: params.holderName.trim(),
		accountNumber,
		swiftCode: params.swiftCode?.trim() || null,
		bankName: bankName || null,
		branchCity: params.branchCity?.trim() || null,
		branchCountry: params.branchCountry?.trim() || null,
		is_active: true,
		metadata: {},
	};
	if (setAsDefault) payload.is_default = true;

	if (params.id) {
		const { error } = await supabase
			.from("provider_payment_methods")
			.update(payload)
			.eq("id", params.id);
		if (error) return { ok: false, error: error.message };
		return { ok: true, error: null };
	}

	const { data: existing } = await supabase
		.from("provider_payment_methods")
		.select("id")
		.eq("providerID", providerID)
		.eq("method_type", "bank")
		.eq("accountNumber", accountNumber)
		.maybeSingle();

	if (existing?.id) {
		const { error } = await supabase
			.from("provider_payment_methods")
			.update(payload)
			.eq("id", existing.id);
		if (error) return { ok: false, error: error.message };
		return { ok: true, error: null };
	}

	const { error } = await supabase
		.from("provider_payment_methods")
		.insert({ ...payload, is_default: true });
	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null };
}

export async function setDefaultBankMethod(params: {
	authUserId: string;
	bankId: string;
}): Promise<{ ok: boolean; error: string | null }> {
	if (isBackendMode()) {
		// ponytail: wallet payment-methods API has no dedicated default PATCH; recreate via POST body.
		try {
			const { banks, error } = await fetchBankMethods({
				authUserId: params.authUserId,
				providerId: null,
			});
			if (error) return { ok: false, error };
			const bank = banks.find((b) => b.id === params.bankId);
			if (!bank) return { ok: false, error: "Bank method not found" };
			return saveBankMethod({
				authUserId: params.authUserId,
				id: bank.id,
				holderName: bank.holderName ?? "",
				accountNumber: bank.accountNumber ?? "",
				bankName: bank.bankName ?? bank.methodName ?? "Bank",
				swiftCode: bank.swiftCode ?? undefined,
				branchCity: bank.branchCity ?? undefined,
				branchCountry: bank.branchCountry ?? undefined,
				setAsDefault: true,
			});
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : "Failed to set default",
			};
		}
	}

	const supabase = getSupabase();
	await supabase
		.from("provider_payment_methods")
		.update({ is_default: false })
		.eq("providerID", params.authUserId);

	const { error } = await supabase
		.from("provider_payment_methods")
		.update({ is_default: true })
		.eq("id", params.bankId);

	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null };
}

export async function deleteBankMethod(
	bankId: string,
): Promise<{ ok: boolean; error: string | null }> {
	if (isBackendMode()) {
		try {
			await apiFetch(`/wallet/payment-methods/${bankId}`, {
				method: "DELETE",
				auth: true,
			});
			return { ok: true, error: null };
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : "Failed to delete bank",
			};
		}
	}

	const { error } = await getSupabase()
		.from("provider_payment_methods")
		.delete()
		.eq("id", bankId);
	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null };
}
