import { apiFetch } from "@/lib/backend/client";
import { isBackendMode } from "@/lib/env";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { getSupabase } from "@/lib/supabase/client";
import { handymanDisplayName, mapHandymanRow, type Handyman } from "./types";

async function authHeaders(): Promise<HeadersInit> {
	if (isBackendMode()) {
		const token = getAccessToken();
		if (!token) throw new Error("You must be signed in.");
		return {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		};
	}
	const { data } = await getSupabase().auth.getSession();
	const token = data.session?.access_token;
	if (!token) throw new Error("You must be signed in.");
	return {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	};
}

export async function fetchProviderHandymen(
	providerId: string,
): Promise<{ handymen: Handyman[]; error: string | null }> {
	if (!providerId) return { handymen: [], error: "Missing provider id" };

	if (isBackendMode()) {
		try {
			const page = await apiFetch<
				{ items?: Record<string, unknown>[] } | Record<string, unknown>[]
			>("/providers/me/handymen", { auth: true });
			const rows = Array.isArray(page) ? page : (page.items ?? []);
			return {
				handymen: rows.map((row) => mapHandymanRow(row)),
				error: null,
			};
		} catch (e) {
			return {
				handymen: [],
				error: e instanceof Error ? e.message : "Failed to load handymen",
			};
		}
	}

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
	if (isBackendMode()) {
		try {
			const row = await apiFetch<Record<string, unknown>>(
				`/handymen/${id}`,
				{ auth: true },
			);
			return { handyman: mapHandymanRow(row), error: null };
		} catch (e) {
			return {
				handyman: null,
				error: e instanceof Error ? e.message : "Handyman not found",
			};
		}
	}

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
	if (isBackendMode()) {
		try {
			await apiFetch(`/providers/me/handymen/${params.handymanId}`, {
				method: "PATCH",
				auth: true,
				body: { is_active: params.isActive, isActive: params.isActive },
			});
			return { ok: true, error: null };
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : "Update failed",
			};
		}
	}

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
	if (isBackendMode()) {
		try {
			const row = await apiFetch<Record<string, unknown>>(
				"/providers/me/handymen",
				{ method: "POST", auth: true, body },
			);
			return { handyman: mapHandymanRow(row), error: null };
		} catch (e) {
			return {
				handyman: null,
				error: e instanceof Error ? e.message : "Create failed",
			};
		}
	}

	try {
		const headers = await authHeaders();
		const res = await fetch("/api/provider/handymen", {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});
		const json = (await res.json()) as {
			handyman?: Record<string, unknown>;
			error?: string;
		};
		if (!res.ok) {
			return { handyman: null, error: json.error ?? "Create failed" };
		}
		return {
			handyman: json.handyman
				? mapHandymanRow(json.handyman)
				: null,
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
	if (isBackendMode()) {
		try {
			const row = await apiFetch<Record<string, unknown>>(
				`/providers/me/handymen/${id}`,
				{ method: "PATCH", auth: true, body },
			);
			return { handyman: mapHandymanRow(row), error: null };
		} catch (e) {
			return {
				handyman: null,
				error: e instanceof Error ? e.message : "Update failed",
			};
		}
	}

	try {
		const headers = await authHeaders();
		const res = await fetch(`/api/provider/handymen/${id}`, {
			method: "PATCH",
			headers,
			body: JSON.stringify(body),
		});
		const json = (await res.json()) as {
			handyman?: Record<string, unknown>;
			error?: string;
		};
		if (!res.ok) {
			return { handyman: null, error: json.error ?? "Update failed" };
		}
		return {
			handyman: json.handyman
				? mapHandymanRow(json.handyman)
				: null,
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
	if (isBackendMode()) {
		try {
			await apiFetch(`/providers/me/handymen/${id}`, {
				method: "DELETE",
				auth: true,
			});
			return { ok: true, error: null };
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : "Delete failed",
			};
		}
	}

	try {
		const headers = await authHeaders();
		const res = await fetch(`/api/provider/handymen/${id}`, {
			method: "DELETE",
			headers,
		});
		const json = (await res.json()) as { error?: string };
		if (!res.ok) {
			return { ok: false, error: json.error ?? "Delete failed" };
		}
		return { ok: true, error: null };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Delete failed",
		};
	}
}

export { handymanDisplayName };
