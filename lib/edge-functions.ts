import { getEdgeFunctionsBaseUrl } from "@/lib/env";

export async function invokeEdgeFunction<T = Record<string, unknown>>(
	name: string,
	body: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
	const base = getEdgeFunctionsBaseUrl();
	const anonKey =
		process.env.SUPABASE_ANON_KEY?.trim() ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
	const isBrowserProxy = base === "/api/edge";
	if (!base || (!isBrowserProxy && !anonKey)) {
		return { data: null, error: "Edge functions are not configured" };
	}

	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (anonKey) headers.Authorization = `Bearer ${anonKey}`;

		const res = await fetch(`${base}/${name}`, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});
		const data = (await res.json()) as T & { success?: boolean; error?: string; message?: string };
		if (!res.ok) {
			return {
				data: null,
				error:
					(data as { error?: string; message?: string }).error ||
					(data as { message?: string }).message ||
					`Edge function ${name} failed`,
			};
		}
		return { data, error: null };
	} catch {
		return { data: null, error: "No internet connection" };
	}
}
