import Image from "next/image";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/site-chrome";
import { BRAND_NAME } from "@/lib/brand";
import type { PublicBlogPost } from "@/services/blog/publicBlog";

function formatDate(iso: string | null): string {
	if (!iso) return "";
	try {
		return new Intl.DateTimeFormat("en-GB", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(new Date(iso));
	} catch {
		return "";
	}
}

export function BlogIndexPage({ posts }: { posts: PublicBlogPost[] }) {
	return (
		<MarketingShell active="home">
			<section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
				<p className="text-sm font-medium tracking-wide text-[#1f5a0b] uppercase">
					{BRAND_NAME}
				</p>
				<h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight text-[#0f1a0c] sm:text-5xl">
					Blog
				</h1>
				<p className="mt-4 max-w-xl text-base leading-relaxed text-[#52634c]">
					Tips, guides, and updates on home services in Addis Ababa.
				</p>

				{posts.length === 0 ? (
					<p className="mt-16 text-sm text-[#52634c]">
						New articles are on the way. Check back soon.
					</p>
				) : (
					<ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
						{posts.map((post) => (
							<li key={post.id}>
								<article>
									<Link href={`/blog/${post.slug}`} className="group block">
										{post.coverImage ? (
											<div className="relative aspect-[16/10] overflow-hidden bg-[#e8f5e3]">
												<Image
													src={post.coverImage}
													alt=""
													fill
													sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
													className="object-cover transition duration-500 group-hover:scale-[1.03]"
												/>
											</div>
										) : (
											<div className="aspect-[16/10] bg-gradient-to-br from-[#e8f5e3] to-[#d7e3d2]" />
										)}
										<div className="mt-4 space-y-2">
											{post.publishedAt ? (
												<p className="text-xs tracking-wide text-[#52634c] uppercase">
													{formatDate(post.publishedAt)}
												</p>
											) : null}
											<h2 className="text-xl font-semibold tracking-tight text-[#0f1a0c] transition group-hover:text-[#1f5a0b]">
												{post.title}
											</h2>
											{post.excerpt ? (
												<p className="line-clamp-3 text-sm leading-relaxed text-[#52634c]">
													{post.excerpt}
												</p>
											) : null}
										</div>
									</Link>
								</article>
							</li>
						))}
					</ul>
				)}
			</section>
		</MarketingShell>
	);
}

export function BlogPostPage({ post }: { post: PublicBlogPost }) {
	return (
		<MarketingShell active="home">
			<article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
				<p className="text-sm">
					<Link
						href="/blog"
						className="font-medium text-[#1f5a0b] transition hover:underline"
					>
						← Blog
					</Link>
				</p>
				<header className="mt-6 space-y-4">
					{post.publishedAt ? (
						<p className="text-xs tracking-wide text-[#52634c] uppercase">
							{formatDate(post.publishedAt)}
							{post.authorName ? ` · ${post.authorName}` : ""}
						</p>
					) : null}
					<h1 className="text-4xl font-semibold tracking-tight text-[#0f1a0c] sm:text-5xl">
						{post.title}
					</h1>
					{post.excerpt ? (
						<p className="text-lg leading-relaxed text-[#52634c]">{post.excerpt}</p>
					) : null}
				</header>

				{post.coverImage ? (
					<div className="relative mt-10 aspect-[16/9] overflow-hidden bg-[#e8f5e3]">
						<Image
							src={post.coverImage}
							alt=""
							fill
							priority
							sizes="(max-width: 768px) 100vw, 768px"
							className="object-cover"
						/>
					</div>
				) : null}

				<div
					className="blog-prose mt-10"
					dangerouslySetInnerHTML={{ __html: post.contentHtml }}
				/>
			</article>
		</MarketingShell>
	);
}
