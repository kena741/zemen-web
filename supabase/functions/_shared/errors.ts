import { corsHeaders } from "./cors.ts";

/** Known/validation errors that are safe to surface to the client. */
export class AppError extends Error {
	readonly status: number;

	constructor(message: string, status = 400) {
		super(message);
		this.name = "AppError";
		this.status = status;
	}
}

/**
 * Convert an unknown thrown value into a client-safe message.
 * Known/validation errors return their message; unexpected errors are logged
 * and replaced with a generic string.
 */
export function safeError(e: unknown): string {
	if (e instanceof AppError) {
		return e.message;
	}
	if (e instanceof Error && e.message === "Unauthorized") {
		return "Unauthorized";
	}
	if (e instanceof Error && e.name === "AppError") {
		return e.message;
	}
	console.error(e);
	return "Server error";
}

/** Status code for a thrown value (defaults to 500 for unexpected errors). */
export function errorStatus(e: unknown): number {
	if (e instanceof AppError) return e.status;
	if (e instanceof Error && e.message === "Unauthorized") return 401;
	return 500;
}

/**
 * JSON error Response with CORS headers.
 * Never includes stack traces or internal DB details beyond the safe message.
 */
export function errorResponse(
	message: string,
	status: number,
	origin: string,
): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			...corsHeaders(origin),
			"Content-Type": "application/json",
		},
	});
}

/** JSON success Response with CORS headers. */
export function jsonResponse(
	body: unknown,
	status: number,
	origin: string,
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			...corsHeaders(origin),
			"Content-Type": "application/json",
		},
	});
}
