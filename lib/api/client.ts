import { getSupabase } from "@/lib/supabase/client";

/**
 * Invoke a Supabase Edge Function. Attaches the current user's JWT
 * automatically via the Supabase client — never attach tokens manually.
 */
export async function invokeFunction<T>(
	name: string,
	body: Record<string, unknown> = {},
): Promise<T> {
	const { data, error } = await getSupabase().functions.invoke(name, { body });

	if (error) {
		const response = (
			error as { context?: Response }
		).context;
		if (response && typeof response.json === "function") {
			try {
				const payload = (await response.json()) as { error?: string; message?: string };
				const msg = payload?.error || payload?.message;
				if (msg) throw new Error(msg);
			} catch (e) {
				if (e instanceof Error && e.message !== error.message) throw e;
			}
		}
		throw error instanceof Error ? error : new Error(String(error));
	}

	if (
		data &&
		typeof data === "object" &&
		"error" in data &&
		(data as { error?: unknown }).error &&
		!("ok" in data) &&
		!("status" in data) &&
		!("checkout_url" in data) &&
		!("handyman" in data) &&
		!("handymen" in data) &&
		!("refunded" in data)
	) {
		throw new Error(String((data as { error: unknown }).error));
	}

	return data as T;
}
