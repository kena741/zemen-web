import { apiFetch } from "@/lib/backend/client";
import { isBackendMode } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";

export interface TaxRow {
	id: string;
	title: string | null;
	tax: string | number | null;
	type: string | null;
}

export async function fetchActiveTaxes(): Promise<{
	rows: TaxRow[];
	error: string | null;
}> {
	if (isBackendMode()) {
		try {
			const data = await apiFetch<
				{ items?: Record<string, unknown>[] } | Record<string, unknown>[]
			>("/config/taxes");
			const rows = (Array.isArray(data) ? data : (data.items ?? [])).map(
				(row) => ({
					id: String(row.id ?? ""),
					title:
						row.name != null
							? String(row.name)
							: row.title != null
								? String(row.title)
								: null,
					tax: (row.value as string | number | null) ??
						(row.tax as string | number | null) ??
						null,
					type: row.type != null ? String(row.type) : null,
				}),
			);
			return { rows: rows.filter((r) => r.id), error: null };
		} catch (e) {
			return {
				rows: [],
				error: e instanceof Error ? e.message : "Failed to load taxes",
			};
		}
	}

	const { data, error } = await getSupabase()
		.from("country_tax")
		.select("id, title, tax, type")
		.eq("active", true);
	if (error) return { rows: [], error: error.message };
	return { rows: (data as TaxRow[]) ?? [], error: null };
}
