import type { SupabaseClient } from "@supabase/supabase-js";

// ponytail: silent empty — no UI "Supabase unavailable" while call sites migrate
type StubResult = {
	data: null;
	error: null;
	count: null;
	status: number;
	statusText: string;
};

const RESULT: StubResult = {
	data: null,
	error: null,
	count: null,
	status: 200,
	statusText: "ok",
};

/**
 * Chainable thenable stand-in for leftover Supabase calls in backend mode.
 * Soft-fails instead of crashing the UI while those call sites are migrated.
 * ponytail: delete this file when no getSupabase() callers remain.
 */
export function createSupabaseBackendStub(): SupabaseClient {
	const builder: object = new Proxy(
		{},
		{
			get(_target, prop) {
				if (prop === "then") {
					return (
						onFulfilled?: (value: StubResult) => unknown,
						onRejected?: (reason: unknown) => unknown,
					) => Promise.resolve(RESULT).then(onFulfilled, onRejected);
				}
				if (prop === "catch" || prop === "finally") {
					return (cb: (...args: unknown[]) => unknown) =>
						Promise.resolve(RESULT)[
							prop as "catch" | "finally"
						](cb as never);
				}
				// auth.getSession / storage.from / channel / etc.
				if (prop === "unsubscribe" || prop === "subscribe") {
					return () => ({
						data: { subscription: { unsubscribe: () => undefined } },
						error: null,
					});
				}
				return () => builder;
			},
		},
	);

	return new Proxy(
		{},
		{
			get(_target, prop) {
				if (prop === "auth") {
					return new Proxy(
						{},
						{
							get() {
								return (..._args: unknown[]) =>
									Promise.resolve({
										data: {
											session: null,
											user: null,
											subscription: {
												unsubscribe: () => undefined,
											},
										},
										error: null,
									});
							},
						},
					);
				}
				if (prop === "storage") {
					return {
						from: () => builder,
					};
				}
				if (prop === "channel" || prop === "removeChannel") {
					return () => builder;
				}
				return () => builder;
			},
		},
	) as SupabaseClient;
}
