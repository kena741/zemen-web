import { assertDataModeConfig, getApiBaseUrl, isBackendMode } from "@/lib/env";
import { ApiError, formatApiDetail } from "@/lib/backend/errors";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { refreshAccessToken } from "@/lib/auth/session";

export type ApiFetchOptions = {
	method?: string;
	body?: unknown;
	/** Send as multipart; mutually exclusive with JSON body. */
	formData?: FormData;
	auth?: boolean;
	headers?: Record<string, string>;
	/** Absolute path starting with / (under /api/v1) or full /api/v1/... */
	query?: Record<string, string | number | boolean | undefined | null>;
	/** Skip 401 refresh+retry (used by refresh itself). */
	_retried?: boolean;
};

function buildUrl(path: string, query?: ApiFetchOptions["query"]): string {
	const normalized = path.startsWith("/api/v1")
		? path
		: `/api/v1${path.startsWith("/") ? path : `/${path}`}`;
	// Browser → same-origin /api/v1/[...path] proxy (Cloud Run CORS blocks local Origins)
	const base =
		typeof window !== "undefined" ? window.location.origin : getApiBaseUrl();
	const url = new URL(`${base}${normalized}`);
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			if (v === undefined || v === null || v === "") continue;
			url.searchParams.set(k, String(v));
		}
	}
	return url.toString();
}

export async function apiFetch<T = unknown>(
	path: string,
	options: ApiFetchOptions = {},
): Promise<T> {
	if (!isBackendMode()) {
		throw new Error("apiFetch is only available when NEXT_PUBLIC_DATA_MODE=backend");
	}
	assertDataModeConfig();

	const headers: Record<string, string> = {
		Accept: "application/json",
		...options.headers,
	};

	if (options.auth) {
		const token = getAccessToken();
		if (!token) throw new ApiError(401, null, "Not signed in");
		headers.Authorization = `Bearer ${token}`;
	}

	let body: BodyInit | undefined;
	if (options.formData) {
		body = options.formData;
	} else if (options.body !== undefined) {
		headers["Content-Type"] = "application/json";
		body = JSON.stringify(options.body);
	}

	const res = await fetch(buildUrl(path, options.query), {
		method: options.method ?? (options.body || options.formData ? "POST" : "GET"),
		headers,
		body,
	});

	if (res.status === 401 && options.auth && !options._retried) {
		const next = await refreshAccessToken();
		if (next) {
			return apiFetch<T>(path, { ...options, _retried: true });
		}
		throw new ApiError(401, null, "Session expired. Please sign in again.");
	}

	if (res.status === 204) return undefined as T;

	const text = await res.text();
	let parsed: unknown = null;
	if (text) {
		try {
			parsed = JSON.parse(text);
		} catch {
			parsed = text;
		}
	}

	if (!res.ok) {
		const detail =
			parsed && typeof parsed === "object" && parsed !== null && "detail" in parsed
				? (parsed as { detail: unknown }).detail
				: parsed;
		throw new ApiError(res.status, detail, formatApiDetail(detail));
	}

	return parsed as T;
}
