import { NextResponse } from "next/server";

import {
	normalizeLocalEthiopianPhone,
	validateLoginPhoneNumber,
} from "@/lib/phone";
import { getPublicSupabase } from "@/lib/supabase/public";
import {
	fetchApprovedBlogComments,
	fetchPublishedBlogPostBySlug,
} from "@/services/blog/publicBlog";

export const runtime = "nodejs";

type RouteContext = {
	params: Promise<{ slug: string }>;
};

type CommentBody = {
	fullName?: string;
	phone?: string;
	body?: string;
};

function stripTags(value: string): string {
	return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(_request: Request, context: RouteContext) {
	const { slug } = await context.params;
	const post = await fetchPublishedBlogPostBySlug(slug);
	if (!post) {
		return NextResponse.json({ error: "Post not found" }, { status: 404 });
	}

	const comments = await fetchApprovedBlogComments(post.id);
	return NextResponse.json({ comments });
}

export async function POST(request: Request, context: RouteContext) {
	const { slug } = await context.params;
	const post = await fetchPublishedBlogPostBySlug(slug);
	if (!post) {
		return NextResponse.json({ error: "Post not found" }, { status: 404 });
	}

	let payload: CommentBody;
	try {
		payload = (await request.json()) as CommentBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const fullName = stripTags(payload.fullName ?? "");
	const phoneRaw = (payload.phone ?? "").trim();
	const body = stripTags(payload.body ?? "");

	if (fullName.length < 2 || fullName.length > 80) {
		return NextResponse.json(
			{ error: "Please enter your full name" },
			{ status: 400 },
		);
	}

	const phoneError = validateLoginPhoneNumber(phoneRaw);
	if (phoneError) {
		return NextResponse.json({ error: phoneError }, { status: 400 });
	}

	if (body.length < 2 || body.length > 2000) {
		return NextResponse.json(
			{ error: "Comment must be between 2 and 2000 characters" },
			{ status: 400 },
		);
	}

	const phone = `+251${normalizeLocalEthiopianPhone(phoneRaw)}`;
	const supabase = getPublicSupabase();
	const { data, error } = await supabase.rpc("add_blog_comment", {
		p_post_id: post.id,
		p_full_name: fullName,
		p_phone: phone,
		p_body: body,
	});

	if (error) {
		console.error("add_blog_comment", error);
		return NextResponse.json(
			{ error: error.message || "Failed to post comment" },
			{ status: 500 },
		);
	}

	const row = data as {
		id?: string;
		full_name?: string;
		body?: string;
		created_at?: string;
	} | null;

	return NextResponse.json({
		comment: {
			id: row?.id ?? crypto.randomUUID(),
			fullName: row?.full_name ?? fullName,
			body: row?.body ?? body,
			createdAt: row?.created_at ?? new Date().toISOString(),
		},
	});
}
