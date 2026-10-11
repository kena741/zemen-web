"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { EyeIcon, HeartIcon, MessageCircleIcon, SendIcon } from "lucide-react";

import {
	getBlogVisitorKey,
	hasLikedBlogPost,
	hasViewedBlogPost,
	markBlogPostViewed,
	setLikedBlogPost,
} from "@/lib/blog-visitor";
import type { PublicBlogComment } from "@/services/blog/publicBlog";
import { cn } from "@/lib/utils";

function formatCount(n: number): string {
	if (n < 1000) return String(n);
	if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
	return `${Math.round(n / 1000)}k`;
}

function formatCommentDate(iso: string): string {
	try {
		return new Intl.DateTimeFormat("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		}).format(new Date(iso));
	} catch {
		return "";
	}
}

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
	return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

export function BlogEngagement({
	slug,
	postId,
	initialViewCount,
	initialLikeCount,
	initialComments,
}: {
	slug: string;
	postId: string;
	initialViewCount: number;
	initialLikeCount: number;
	initialComments: PublicBlogComment[];
}) {
	const [viewCount, setViewCount] = useState(initialViewCount);
	const [likeCount, setLikeCount] = useState(initialLikeCount);
	const [liked, setLiked] = useState(false);
	const [comments, setComments] = useState(initialComments);
	const [fullName, setFullName] = useState("");
	const [phone, setPhone] = useState("");
	const [body, setBody] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [likePending, startLike] = useTransition();
	const [commentPending, startComment] = useTransition();

	useEffect(() => {
		setLiked(hasLikedBlogPost(postId));

		if (hasViewedBlogPost(postId)) return;
		markBlogPostViewed(postId);

		void fetch(`/api/blog/${encodeURIComponent(slug)}/engage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "view" }),
		})
			.then(async (res) => {
				if (!res.ok) return;
				const data = (await res.json()) as { viewCount?: number };
				if (typeof data.viewCount === "number") setViewCount(data.viewCount);
			})
			.catch(() => {
				/* ignore */
			});
	}, [postId, slug]);

	function toggleLike() {
		const visitorKey = getBlogVisitorKey();
		startLike(async () => {
			try {
				const res = await fetch(
					`/api/blog/${encodeURIComponent(slug)}/engage`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ action: "like", visitorKey }),
					},
				);
				const data = (await res.json()) as {
					liked?: boolean;
					likeCount?: number;
					error?: string;
				};
				if (!res.ok) throw new Error(data.error || "Could not update like");
				const nextLiked = Boolean(data.liked);
				setLiked(nextLiked);
				setLikedBlogPost(postId, nextLiked);
				if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
			} catch {
				/* keep prior state */
			}
		});
	}

	function submitComment(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		startComment(async () => {
			try {
				const res = await fetch(
					`/api/blog/${encodeURIComponent(slug)}/comments`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ fullName, phone, body }),
					},
				);
				const data = (await res.json()) as {
					comment?: PublicBlogComment;
					error?: string;
				};
				if (!res.ok) throw new Error(data.error || "Could not post comment");
				if (data.comment) {
					setComments((prev) => [data.comment!, ...prev]);
				}
				setBody("");
				setSuccess(true);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Could not post comment");
			}
		});
	}

	return (
		<section className="mt-14 space-y-12 border-t border-[#d7e3d2] pt-10">
			<div className="flex flex-wrap items-center gap-3">
				<div className="inline-flex items-center gap-2 rounded-full bg-[#eef5ea] px-3.5 py-2 text-sm text-[#3d4f38]">
					<EyeIcon className="size-4 text-[#1f5a0b]" aria-hidden />
					<span className="font-medium tabular-nums">
						{formatCount(viewCount)}
					</span>
					<span className="text-[#5a6b54]">
						{viewCount === 1 ? "view" : "views"}
					</span>
				</div>

				<button
					type="button"
					onClick={toggleLike}
					disabled={likePending}
					aria-pressed={liked}
					className={cn(
						"inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition",
						liked
							? "border-[#f3c4c8] bg-[#fff5f5] text-[#b42318]"
							: "border-[#d7e3d2] bg-white text-[#3d4f38] hover:border-[#b7c7b0]",
					)}
				>
					<HeartIcon
						className={cn("size-4", liked && "fill-current")}
						aria-hidden
					/>
					<span className="font-medium tabular-nums">
						{formatCount(likeCount)}
					</span>
					<span>{liked ? "Liked" : "Like"}</span>
				</button>

				<div className="inline-flex items-center gap-2 rounded-full bg-[#eef5ea] px-3.5 py-2 text-sm text-[#3d4f38]">
					<MessageCircleIcon className="size-4 text-[#1f5a0b]" aria-hidden />
					<span className="font-medium tabular-nums">{comments.length}</span>
					<span className="text-[#5a6b54]">
						{comments.length === 1 ? "comment" : "comments"}
					</span>
				</div>
			</div>

			<div>
				<h2 className="text-xl font-semibold tracking-tight text-[#0f1a0c]">
					Comments
				</h2>
				<p className="mt-1 text-sm text-[#5a6b54]">
					Share your thoughts. We only show your name with your comment.
				</p>

				<form onSubmit={submitComment} className="mt-6 space-y-3">
					<div className="grid gap-3 sm:grid-cols-2">
						<label className="block">
							<span className="mb-1.5 block text-xs font-medium tracking-wide text-[#52634c] uppercase">
								Full name
							</span>
							<input
								type="text"
								required
								maxLength={80}
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								placeholder="Your full name"
								className="h-11 w-full border border-[#d7e3d2] bg-white px-3 text-sm text-[#0f1a0c] outline-none transition placeholder:text-[#8a9a84] focus:border-[#1f5a0b]"
							/>
						</label>
						<label className="block">
							<span className="mb-1.5 block text-xs font-medium tracking-wide text-[#52634c] uppercase">
								Phone number
							</span>
							<input
								type="tel"
								required
								inputMode="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="09xxxxxxxx"
								className="h-11 w-full border border-[#d7e3d2] bg-white px-3 text-sm text-[#0f1a0c] outline-none transition placeholder:text-[#8a9a84] focus:border-[#1f5a0b]"
							/>
						</label>
					</div>
					<label className="block">
						<span className="mb-1.5 block text-xs font-medium tracking-wide text-[#52634c] uppercase">
							Comment
						</span>
						<textarea
							required
							maxLength={2000}
							rows={4}
							value={body}
							onChange={(e) => setBody(e.target.value)}
							placeholder="Write a helpful comment…"
							className="w-full resize-y border border-[#d7e3d2] bg-white px-3 py-2.5 text-sm leading-relaxed text-[#0f1a0c] outline-none transition placeholder:text-[#8a9a84] focus:border-[#1f5a0b]"
						/>
					</label>

					{error ? (
						<p className="text-sm text-[#b42318]" role="alert">
							{error}
						</p>
					) : null}
					{success ? (
						<p className="text-sm text-[#1f5a0b]" role="status">
							Thanks — your comment is live.
						</p>
					) : null}

					<button
						type="submit"
						disabled={commentPending}
						className="inline-flex h-11 items-center gap-2 bg-[#13452A] px-5 text-sm font-semibold text-white transition hover:bg-[#1a5c38] disabled:opacity-60"
					>
						<SendIcon className="size-4" aria-hidden />
						{commentPending ? "Posting…" : "Post comment"}
					</button>
				</form>

				{comments.length === 0 ? (
					<p className="mt-10 text-sm text-[#5a6b54]">
						No comments yet. Be the first to share your thoughts.
					</p>
				) : (
					<ul className="mt-10 divide-y divide-[#e4eee0]">
						{comments.map((comment) => (
							<li key={comment.id} className="flex gap-3 py-5 first:pt-0">
								<div
									aria-hidden
									className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f5e3] text-xs font-semibold text-[#1f5a0b]"
								>
									{initials(comment.fullName)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
										<p className="text-sm font-semibold text-[#0f1a0c]">
											{comment.fullName}
										</p>
										<p className="text-xs text-[#8a9a84]">
											{formatCommentDate(comment.createdAt)}
										</p>
									</div>
									<p className="mt-1.5 text-[0.95rem] leading-relaxed whitespace-pre-wrap text-[#3d4f38]">
										{comment.body}
									</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
