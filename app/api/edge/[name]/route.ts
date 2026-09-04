import { NextResponse } from "next/server";

export const runtime = "nodejs";

function serverEdgeBase(): string {
	const raw =
		process.env.EDGE_FUNCTIONS_BASE_URL?.trim() ||
		process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_BASE_URL?.trim();
	return raw ? raw.replace(/\/$/, "") : "";
}

export async function POST(
	request: Request,
	context: { params: Promise<{ name: string }> },
) {
	const { name } = await context.params;
	if (!/^[a-z0-9-]+$/i.test(name)) {
		return NextResponse.json({ error: "Invalid function name" }, { status: 400 });
	}

	const base = serverEdgeBase();
	const anonKey =
		process.env.SUPABASE_ANON_KEY?.trim() ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
	if (!base || !anonKey) {
		return NextResponse.json(
			{ error: "Edge functions are not configured" },
			{ status: 500 },
		);
	}

	try {
		const body = await request.text();
		const res = await fetch(`${base}/${name}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${anonKey}`,
			},
			body,
		});
		const text = await res.text();
		return new NextResponse(text, {
			status: res.status,
			headers: { "Content-Type": "application/json" },
		});
	} catch {
		return NextResponse.json({ error: "Edge function unreachable" }, { status: 502 });
	}
}
