import type { Metadata } from "next";

import { BlogIndexPage } from "@/components/marketing/blog-pages";
import { BRAND_NAME } from "@/lib/brand";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";
import { fetchPublishedBlogPosts } from "@/services/blog/publicBlog";

const TITLE = "Blog";
const DESCRIPTION = `Tips, guides, and updates on home services in Addis Ababa from ${BRAND_NAME}.`;

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	alternates: {
		canonical: "/blog",
	},
	openGraph: buildOpenGraph({
		title: `${TITLE} | ${BRAND_NAME}`,
		description: DESCRIPTION,
		path: "/blog",
	}),
	twitter: buildTwitter({
		title: `${TITLE} | ${BRAND_NAME}`,
		description: DESCRIPTION,
	}),
};

export const revalidate = 60;

export default async function BlogPage() {
	const posts = await fetchPublishedBlogPosts();
	return <BlogIndexPage posts={posts} />;
}
