import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { MarketingShell } from "@/components/marketing/site-chrome";
import { BRAND_NAME } from "@/lib/brand";
import { SHORT_CODE, WHATSAPP_URL } from "@/lib/marketing";
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

function readingMinutes(html: string, excerpt?: string | null): number {
	const text = `${excerpt ?? ""} ${html}`
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	const words = text ? text.split(" ").length : 0;
	return Math.max(1, Math.round(words / 200));
}

function PostMeta({
	date,
	author,
	minutes,
}: {
	date: string | null;
	author?: string | null;
	minutes?: number;
}) {
	const parts: string[] = [];
	const formatted = formatDate(date);
	if (formatted) parts.push(formatted);
	if (author?.trim()) parts.push(author.trim());
	if (minutes != null) parts.push(`${minutes} min read`);

	if (parts.length === 0) return null;

	return (
		<p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#5a6b54]">
			{parts.map((part, i) => (
				<span key={part} className="inline-flex items-center gap-2">
					{i > 0 ? (
						<span className="size-1 rounded-full bg-[#b7c7b0]" aria-hidden />
					) : null}
					{part}
				</span>
			))}
		</p>
	);
}

export function BlogIndexPage({ posts }: { posts: PublicBlogPost[] }) {
	const [featured, ...rest] = posts;

	return (
		<MarketingShell active="blog">
			<section className="relative overflow-hidden">
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,_#e8f5e3_0%,_#f4f8f1_55%,_transparent_80%)]"
				/>

				<div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
					<header className="max-w-2xl">
						<p className="text-xs font-semibold tracking-[0.14em] text-[#1f5a0b] uppercase">
							{BRAND_NAME}
						</p>
						<h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#0f1a0c] sm:text-5xl">
							Blog
						</h1>
						<p className="mt-4 text-lg leading-relaxed text-[#52634c]">
							Practical guides and updates for better home services in Addis
							Ababa.
						</p>
					</header>

					{posts.length === 0 ? (
						<div className="mt-16 max-w-md">
							<p className="text-base leading-relaxed text-[#52634c]">
								New articles are on the way. Check back soon for tips on
								cleaning, cooking, babysitting, and trusted home help.
							</p>
							<Link
								href="/services"
								className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#1f5a0b] hover:underline"
							>
								Browse services
								<ArrowRightIcon className="size-4" aria-hidden />
							</Link>
						</div>
					) : (
						<div className="mt-14 space-y-16">
							{featured ? (
								<article>
									<Link
										href={`/blog/${featured.slug}`}
										className="group grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
									>
										<div className="relative aspect-[16/10] overflow-hidden bg-[#e8f5e3]">
											{featured.coverImage ? (
												<Image
													src={featured.coverImage}
													alt=""
													fill
													priority
													sizes="(max-width: 1024px) 100vw, 50vw"
													className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
												/>
											) : (
												<div className="absolute inset-0 bg-gradient-to-br from-[#dcebd4] via-[#e8f5e3] to-[#c8e0bc]" />
											)}
										</div>
										<div className="space-y-4">
											<p className="text-xs font-semibold tracking-[0.14em] text-[#1f5a0b] uppercase">
												Latest
											</p>
											<PostMeta
												date={featured.publishedAt}
												author={featured.authorName}
											/>
											<h2 className="text-3xl font-semibold tracking-tight text-[#0f1a0c] transition group-hover:text-[#1f5a0b] sm:text-4xl">
												{featured.title}
											</h2>
											{featured.excerpt ? (
												<p className="max-w-xl text-base leading-relaxed text-[#52634c] sm:text-lg">
													{featured.excerpt}
												</p>
											) : null}
											<span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f5a0b]">
												Read article
												<ArrowRightIcon
													className="size-4 transition group-hover:translate-x-0.5"
													aria-hidden
												/>
											</span>
										</div>
									</Link>
								</article>
							) : null}

							{rest.length > 0 ? (
								<ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
									{rest.map((post) => (
										<li key={post.id}>
											<article>
												<Link
													href={`/blog/${post.slug}`}
													className="group flex h-full flex-col"
												>
													<div className="relative aspect-[16/10] overflow-hidden bg-[#e8f5e3]">
														{post.coverImage ? (
															<Image
																src={post.coverImage}
																alt=""
																fill
																sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
																className="object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
															/>
														) : (
															<div className="absolute inset-0 bg-gradient-to-br from-[#e8f5e3] to-[#d7e3d2]" />
														)}
													</div>
													<div className="mt-5 flex flex-1 flex-col space-y-3">
														<PostMeta date={post.publishedAt} />
														<h2 className="text-xl font-semibold tracking-tight text-[#0f1a0c] transition group-hover:text-[#1f5a0b]">
															{post.title}
														</h2>
														{post.excerpt ? (
															<p className="line-clamp-3 text-[0.95rem] leading-relaxed text-[#52634c]">
																{post.excerpt}
															</p>
														) : null}
														<span className="mt-auto pt-2 text-sm font-medium text-[#1f5a0b] opacity-0 transition group-hover:opacity-100">
															Read more →
														</span>
													</div>
												</Link>
											</article>
										</li>
									))}
								</ul>
							) : null}
						</div>
					)}
				</div>
			</section>
		</MarketingShell>
	);
}

export function BlogPostPage({ post }: { post: PublicBlogPost }) {
	const minutes = readingMinutes(post.contentHtml, post.excerpt);

	return (
		<MarketingShell active="blog">
			<article>
				<div className="relative overflow-hidden border-b border-[#d7e3d2]/80 bg-[#f4f8f1]">
					<div
						aria-hidden
						className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-[#c8e6b8]/40 blur-3xl"
					/>
					<div className="relative mx-auto max-w-3xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16">
						<Link
							href="/blog"
							className="inline-flex items-center gap-2 text-sm font-medium text-[#1f5a0b] transition hover:gap-2.5"
						>
							<ArrowLeftIcon className="size-4" aria-hidden />
							All articles
						</Link>

						<header className="mt-8 space-y-5">
							<PostMeta
								date={post.publishedAt}
								author={post.authorName}
								minutes={minutes}
							/>
							<h1 className="text-balance text-4xl font-semibold tracking-tight text-[#0f1a0c] sm:text-5xl sm:leading-[1.12]">
								{post.title}
							</h1>
							{post.excerpt ? (
								<p className="max-w-2xl text-xl leading-relaxed text-[#52634c]">
									{post.excerpt}
								</p>
							) : null}
						</header>
					</div>
				</div>

				{post.coverImage ? (
					<div className="mx-auto max-w-4xl px-4 sm:px-6">
						<div className="relative -mt-2 aspect-[16/9] overflow-hidden bg-[#e8f5e3] sm:aspect-[2/1] sm:-mt-6">
							<Image
								src={post.coverImage}
								alt=""
								fill
								priority
								sizes="(max-width: 896px) 100vw, 896px"
								className="object-cover"
							/>
						</div>
					</div>
				) : null}

				<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
					<div
						className="blog-prose"
						dangerouslySetInnerHTML={{ __html: post.contentHtml }}
					/>

					<footer className="mt-16 border-t border-[#d7e3d2] pt-10">
						<p className="text-sm font-medium tracking-wide text-[#1f5a0b] uppercase">
							Need help at home?
						</p>
						<p className="mt-2 max-w-md text-base leading-relaxed text-[#52634c]">
							Book trusted cleaning, cooking, babysitting, and skilled services
							with {BRAND_NAME}.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<a
								href={`tel:${SHORT_CODE}`}
								className="inline-flex items-center justify-center rounded-lg bg-[#174309] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f5a0b]"
							>
								Call {SHORT_CODE}
							</a>
							<a
								href={WHATSAPP_URL}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center justify-center rounded-lg border border-[#d7e3d2] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f1a0c] transition hover:border-[#b7c7b0]"
							>
								WhatsApp
							</a>
							<Link
								href="/blog"
								className="inline-flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-[#1f5a0b] hover:underline"
							>
								More articles
								<ArrowRightIcon className="size-4" aria-hidden />
							</Link>
						</div>
					</footer>
				</div>
			</article>
		</MarketingShell>
	);
}
