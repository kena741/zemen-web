import { getSupabase } from "@/lib/supabase/client";
import { mapBankRow, type BankMethod } from "./types";

function ownerIds(authUserId: string, providerId: string | null): string[] {
	const ids = new Set<string>();
	if (authUserId) ids.add(authUserId);
	if (providerId) ids.add(providerId);
	return [...ids];
}

export async function fetchBankMethods(params: {
	authUserId: string;
	providerId: string | null;
}): Promise<{ banks: BankMethod[]; error: string | null }> {
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
}): Promise<{ ok: boolean; error: string | null }> {
	const providerID = params.authUserId;
	const bankName = params.bankName.trim();
	const methodName = bankName || "Bank";
	const methodCode = methodName.toLowerCase().replace(/\s+/g, "_");
	const accountNumber = params.accountNumber.trim();
	if (!accountNumber) {
		return { ok: false, error: "Account number is required" };
	}

	const supabase = getSupabase();

	await supabase
		.from("provider_payment_methods")
		.update({ is_default: false })
		.eq("providerID", providerID);

	const payload = {
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
		is_default: true,
		metadata: {},
	};

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
		.insert(payload);
	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null };
}

export async function setDefaultBankMethod(params: {
	authUserId: string;
	bankId: string;
}): Promise<{ ok: boolean; error: string | null }> {
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
	const { error } = await getSupabase()
		.from("provider_payment_methods")
		.delete()
		.eq("id", bankId);
	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null };
}
