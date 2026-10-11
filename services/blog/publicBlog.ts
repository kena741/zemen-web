import { getPublicSupabase } from "@/lib/supabase/public";

export type PublicBlogPost = {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	contentHtml: string;
	coverImage: string | null;
	authorName: string | null;
	publishedAt: string | null;
	updatedAt: string;
	viewCount: number;
	likeCount: number;
};

export type PublicBlogComment = {
	id: string;
	fullName: string;
	body: string;
	createdAt: string;
};

type BlogPostRow = {
	id: string;
	title: string;
	slug: string;
	excerpt?: string | null;
	content_html?: string | null;
	cover_image?: string | null;
	author_name?: string | null;
	published_at?: string | null;
	updated_at?: string | null;
	view_count?: number | null;
	like_count?: number | null;
};

type BlogCommentRow = {
	id: string;
	full_name?: string | null;
	body?: string | null;
	created_at?: string | null;
};

function mapRow(row: BlogPostRow): PublicBlogPost {
	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		excerpt: row.excerpt ?? null,
		contentHtml: row.content_html ?? "",
		coverImage: row.cover_image ?? null,
		authorName: row.author_name ?? null,
		publishedAt: row.published_at ?? null,
		updatedAt: row.updated_at ?? row.published_at ?? new Date().toISOString(),
		viewCount: Number(row.view_count ?? 0),
		likeCount: Number(row.like_count ?? 0),
	};
}

const CARD_SELECT =
	"id, title, slug, excerpt, cover_image, author_name, published_at, updated_at, view_count, like_count";
const DETAIL_SELECT = `${CARD_SELECT}, content_html`;

export async function fetchPublishedBlogPosts(): Promise<PublicBlogPost[]> {
	const { data, error } = await getPublicSupabase()
		.from("blog_post")
		.select(CARD_SELECT)
		.eq("status", "published")
		.order("published_at", { ascending: false });

	if (error) {
		console.error("fetchPublishedBlogPosts", error);
		return [];
	}

	return ((data ?? []) as BlogPostRow[]).map(mapRow);
}

export async function fetchPublishedBlogPostBySlug(
	slug: string,
): Promise<PublicBlogPost | null> {
	if (!slug.trim()) return null;

	const { data, error } = await getPublicSupabase()
		.from("blog_post")
		.select(DETAIL_SELECT)
		.eq("status", "published")
		.eq("slug", slug)
		.maybeSingle();

	if (error) {
		console.error("fetchPublishedBlogPostBySlug", error);
		return null;
	}

	if (!data) return null;
	return mapRow(data as BlogPostRow);
}

export async function fetchPublishedBlogSlugs(): Promise<
	{ slug: string; updatedAt: string }[]
> {
	const { data, error } = await getPublicSupabase()
		.from("blog_post")
		.select("slug, updated_at, published_at")
		.eq("status", "published");

	if (error) {
		console.error("fetchPublishedBlogSlugs", error);
		return [];
	}

	return ((data ?? []) as BlogPostRow[]).map((row) => ({
		slug: row.slug,
		updatedAt: row.updated_at ?? row.published_at ?? new Date().toISOString(),
	}));
}

export async function fetchApprovedBlogComments(
	postId: string,
): Promise<PublicBlogComment[]> {
	if (!postId) return [];

	const { data, error } = await getPublicSupabase()
		.from("blog_comment")
		.select("id, full_name, body, created_at")
		.eq("post_id", postId)
		.eq("status", "approved")
		.order("created_at", { ascending: false })
		.limit(100);

	if (error) {
		console.error("fetchApprovedBlogComments", error);
		return [];
	}

	return ((data ?? []) as BlogCommentRow[]).map((row) => ({
		id: row.id,
		fullName: row.full_name ?? "Reader",
		body: row.body ?? "",
		createdAt: row.created_at ?? new Date().toISOString(),
	}));
}
