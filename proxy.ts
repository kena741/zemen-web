import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function requestLogsEnabled(): boolean {
	const value = (process.env.ENABLE_REQUEST_LOGS ?? "").trim().toLowerCase();
	return value === "1" || value === "true" || value === "yes";
}

export function proxy(request: NextRequest) {
	if (requestLogsEnabled()) {
		console.log(
			`${request.method} ${request.nextUrl.pathname}${request.nextUrl.search}`,
		);
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
