/** Map FastAPI `{ detail }` (string | array | object) to a user-facing message. */
export function formatApiDetail(detail: unknown): string {
	if (detail == null) return "Request failed";
	if (typeof detail === "string") return detail;
	if (Array.isArray(detail)) {
		return detail
			.map((item) => {
				if (typeof item === "string") return item;
				if (item && typeof item === "object" && "msg" in item) {
					return String((item as { msg: unknown }).msg);
				}
				return JSON.stringify(item);
			})
			.filter(Boolean)
			.join("; ");
	}
	if (typeof detail === "object" && detail !== null && "message" in detail) {
		return String((detail as { message: unknown }).message);
	}
	try {
		return JSON.stringify(detail);
	} catch {
		return "Request failed";
	}
}

export class ApiError extends Error {
	status: number;
	detail: unknown;

	constructor(status: number, detail: unknown, message?: string) {
		super(message ?? formatApiDetail(detail));
		this.name = "ApiError";
		this.status = status;
		this.detail = detail;
	}
}
