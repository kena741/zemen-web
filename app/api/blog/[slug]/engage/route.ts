import { NextResponse } from "next/server";

import { getPublicSupabase } from "@/lib/supabase/public";
import { fetchPublishedBlogPostBySlug } from "@/services/blog/publicBlog";

export const runtime = "nodejs";

type RouteContext = {
	params: Promise<{ slug: string }>;
};

type EngageBody = {
	action?: "view" | "like";
	visitorKey?: string;
};

export async function POST(request: Request, context: RouteContext) {
	const { slug } = await context.params;
	const post = await fetchPublishedBlogPostBySlug(slug);
	if (!post) {
		return NextResponse.json({ error: "Post not found" }, { status: 404 });
	}

	let body: EngageBody;
	try {
		body = (await request.json()) as EngageBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const action = body.action;
	const supabase = getPublicSupabase();

	if (action === "view") {
		const { data, error } = await supabase.rpc("increment_blog_view", {
			p_post_id: post.id,
		});
		if (error) {
			console.error("increment_blog_view", error);
			return NextResponse.json(
				{ error: error.message || "Failed to record view" },
				{ status: 500 },
			);
		}
		return NextResponse.json({
			viewCount: Number(data ?? post.viewCount + 1),
			likeCount: post.likeCount,
		});
	}

	if (action === "like") {
		const visitorKey = (body.visitorKey ?? "").trim();
		if (visitorKey.length < 8 || visitorKey.length > 80) {
			return NextResponse.json(
				{ error: "Invalid visitor key" },
				{ status: 400 },
			);
		}

		const { data, error } = await supabase.rpc("toggle_blog_like", {
			p_post_id: post.id,
			p_visitor_key: visitorKey,
		});
		if (error) {
			console.error("toggle_blog_like", error);
			return NextResponse.json(
				{ error: error.message || "Failed to update like" },
				{ status: 500 },
			);
		}

		const payload = (data ?? {}) as { liked?: boolean; likeCount?: number };
		return NextResponse.json({
			liked: Boolean(payload.liked),
			likeCount: Number(payload.likeCount ?? post.likeCount),
			viewCount: post.viewCount,
		});
	}

	return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
