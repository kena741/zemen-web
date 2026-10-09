import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogPostPage } from "@/components/marketing/blog-pages";
import { BRAND_NAME } from "@/lib/brand";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";
import {
	fetchPublishedBlogPostBySlug,
	fetchPublishedBlogSlugs,
} from "@/services/blog/publicBlog";

type PageProps = {
	params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateStaticParams() {
	const posts = await fetchPublishedBlogSlugs();
	return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const post = await fetchPublishedBlogPostBySlug(slug);
	if (!post) {
		return { title: "Post not found" };
	}

	const description =
		post.excerpt?.trim() ||
		`${post.title} — ${BRAND_NAME} blog`;

	return {
		title: post.title,
		description,
		alternates: {
			canonical: `/blog/${post.slug}`,
		},
		openGraph: buildOpenGraph({
			title: `${post.title} | ${BRAND_NAME}`,
			description,
			path: `/blog/${post.slug}`,
		}),
		twitter: buildTwitter({
			title: `${post.title} | ${BRAND_NAME}`,
			description,
		}),
	};
}

export default async function BlogSlugPage({ params }: PageProps) {
	const { slug } = await params;
	const post = await fetchPublishedBlogPostBySlug(slug);
	if (!post) notFound();
	return <BlogPostPage post={post} />;
}
