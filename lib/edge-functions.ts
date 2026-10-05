import { invokeFunction } from "@/lib/api/client";

/**
 * Invoke a named Supabase Edge Function (JWT attached by the client).
 * Replaces the former /api/edge browser proxy.
 */
export async function invokeEdgeFunction<T = Record<string, unknown>>(
	name: string,
	body: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
	try {
		const data = await invokeFunction<
			T & { success?: boolean; error?: string; message?: string }
		>(name, body);
		if (
			data &&
			typeof data === "object" &&
			"success" in data &&
			(data as { success?: boolean }).success === false
		) {
			return {
				data: null,
				error:
					(data as { error?: string; message?: string }).error ||
					(data as { message?: string }).message ||
					`Edge function ${name} failed`,
			};
		}
		return { data, error: null };
	} catch (e) {
		return {
			data: null,
			error: e instanceof Error ? e.message : "No internet connection",
		};
	}
}
