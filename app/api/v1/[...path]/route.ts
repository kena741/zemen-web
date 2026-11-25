import { getApiBaseUrl, isBackendMode } from "@/lib/env";

export const runtime = "nodejs";

/** Same-origin proxy — Cloud Run CORS rejects local Origins (OPTIONS 400). */
async function proxy(
	request: Request,
	context: { params: Promise<{ path: string[] }> },
) {
	if (!isBackendMode()) {
		return Response.json({ error: "Not found" }, { status: 404 });
	}
	const base = getApiBaseUrl();
	if (!base) {
		return Response.json({ error: "API_BASE_URL not configured" }, { status: 500 });
	}

	const { path } = await context.params;
	const incoming = new URL(request.url);
	const target = `${base}/api/v1/${path.join("/")}${incoming.search}`;

	const headers: Record<string, string> = {
		Accept: request.headers.get("Accept") || "application/json",
	};
	const auth = request.headers.get("Authorization");
	if (auth) headers.Authorization = auth;
	const contentType = request.headers.get("Content-Type");
	if (contentType) headers["Content-Type"] = contentType;

	const method = request.method.toUpperCase();
	const body =
		method === "GET" || method === "HEAD"
			? undefined
			: await request.arrayBuffer();

	try {
		const res = await fetch(target, { method, headers, body });
		const text = await res.text();
		return new Response(text, {
			status: res.status,
			headers: {
				"Content-Type": res.headers.get("Content-Type") || "application/json",
			},
		});
	} catch {
		return Response.json({ error: "Upstream unreachable" }, { status: 502 });
	}
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
