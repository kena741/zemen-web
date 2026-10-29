import type { Metadata } from "next";

import { BlogIndexPage } from "@/components/marketing/blog-pages";
import { BRAND_NAME } from "@/lib/brand";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";
import { fetchPublishedBlogPosts } from "@/services/blog/publicBlog";

const TITLE = `Home Service Tips & Guides for Addis Ababa | ${BRAND_NAME}`;
const DESCRIPTION = `Practical tips, guides, and news on cleaning, housemaids, cooking, childcare, and home repairs in Addis Ababa, Ethiopia from the ${BRAND_NAME} blog.`;

export const metadata: Metadata = {
	title: { absolute: TITLE },
	description: DESCRIPTION,
	alternates: {
		canonical: "/blog",
	},
	openGraph: buildOpenGraph({
		title: TITLE,
		description: DESCRIPTION,
		path: "/blog",
	}),
	twitter: buildTwitter({
		title: TITLE,
		description: DESCRIPTION,
	}),
};

export const revalidate = 60;

export default async function BlogPage() {
	const posts = await fetchPublishedBlogPosts();
	return <BlogIndexPage posts={posts} />;
}
