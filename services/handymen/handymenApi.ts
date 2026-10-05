import {
	createHandyman as apiCreateHandyman,
	deleteHandyman as apiDeleteHandyman,
	updateHandyman as apiUpdateHandyman,
} from "@/lib/api/handymen";
import { getSupabase } from "@/lib/supabase/client";
import { handymanDisplayName, mapHandymanRow, type Handyman } from "./types";

export async function fetchProviderHandymen(
	providerId: string,
): Promise<{ handymen: Handyman[]; error: string | null }> {
	if (!providerId) return { handymen: [], error: "Missing provider id" };

	const { data, error } = await getSupabase()
		.from("handyman")
		.select("*")
		.eq("provider_id", providerId)
		.order("createdAt", { ascending: false });

	if (error) {
		console.error("fetchProviderHandymen", error);
		return { handymen: [], error: error.message };
	}

	return {
		handymen: (data ?? []).map((row) =>
			mapHandymanRow(row as Record<string, unknown>),
		),
		error: null,
	};
}

export async function fetchHandymanById(
	id: string,
): Promise<{ handyman: Handyman | null; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("handyman")
		.select("*")
		.eq("id", id)
		.maybeSingle();

	if (error) {
		console.error("fetchHandymanById", error);
		return { handyman: null, error: error.message };
	}
	if (!data) return { handyman: null, error: "Handyman not found" };
	return {
		handyman: mapHandymanRow(data as Record<string, unknown>),
		error: null,
	};
}

export async function setHandymanActive(params: {
	handymanId: string;
	isActive: boolean;
}): Promise<{ ok: boolean; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("handyman")
		.update({ isActive: params.isActive })
		.eq("id", params.handymanId)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("setHandymanActive", error);
		return { ok: false, error: error.message };
	}
	if (!data) {
		return { ok: false, error: "Update failed. Check permissions." };
	}
	return { ok: true, error: null };
}

export async function createHandyman(body: Record<string, unknown>): Promise<{
	handyman: Handyman | null;
	error: string | null;
}> {
	try {
		const json = await apiCreateHandyman(body);
		return {
			handyman: json.handyman ? mapHandymanRow(json.handyman) : null,
			error: null,
		};
	} catch (e) {
		return {
			handyman: null,
			error: e instanceof Error ? e.message : "Create failed",
		};
	}
}

export async function updateHandyman(
	id: string,
	body: Record<string, unknown>,
): Promise<{ handyman: Handyman | null; error: string | null }> {
	try {
		const json = await apiUpdateHandyman(id, body);
		return {
			handyman: json.handyman ? mapHandymanRow(json.handyman) : null,
			error: null,
		};
	} catch (e) {
		return {
			handyman: null,
			error: e instanceof Error ? e.message : "Update failed",
		};
	}
}

export async function deleteHandyman(
	id: string,
): Promise<{ ok: boolean; error: string | null }> {
	try {
		await apiDeleteHandyman(id);
		return { ok: true, error: null };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Delete failed",
		};
	}
}

export { handymanDisplayName };
