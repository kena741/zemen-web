import { getApiBaseUrl, isBackendMode } from "@/lib/env";

/** Forward a Next route request to zemen_backend when in backend data mode. */
export async function proxyToBackend(
	path: string,
	req: Request,
	init?: { method?: string; body?: unknown },
): Promise<Response | null> {
	if (!isBackendMode()) return null;
	const base = getApiBaseUrl();
	if (!base) {
		return Response.json(
			{ error: "API_BASE_URL not configured" },
			{ status: 500 },
		);
	}
	const auth = req.headers.get("authorization") || "";
	const res = await fetch(
		`${base}/api/v1${path.startsWith("/") ? path : `/${path}`}`,
		{
			method: init?.method ?? req.method,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				...(auth ? { Authorization: auth } : {}),
			},
			body:
				init?.body !== undefined
					? JSON.stringify(init.body)
					: req.method === "GET" || req.method === "HEAD"
						? undefined
						: await req.text(),
		},
	);
	const text = await res.text();
	return new Response(text, {
		status: res.status,
		headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
	});
}
