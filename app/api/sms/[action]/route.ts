import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SMS_BASE = (
	process.env.SMS_API_BASE_URL?.trim() || "https://betegna-ai.vercel.app"
).replace(/\/$/, "");

const ALLOWED = new Set(["send-otp", "verify-otp"]);

/** Same-origin proxy so browser OTP calls are not blocked by CORS. */
export async function POST(
	request: Request,
	context: { params: Promise<{ action: string }> },
) {
	const { action } = await context.params;
	if (!ALLOWED.has(action)) {
		return NextResponse.json({ error: "Unknown SMS action" }, { status: 404 });
	}

	try {
		const body = await request.text();
		const res = await fetch(`${SMS_BASE}/sms/${action}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
		});
		const text = await res.text();
		return new NextResponse(text, {
			status: res.status,
			headers: { "Content-Type": "application/json" },
		});
	} catch {
		return NextResponse.json({ error: "SMS service unreachable" }, { status: 502 });
	}
}
