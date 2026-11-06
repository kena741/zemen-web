"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
	ChevronRightIcon,
	ImageIcon,
	PlusIcon,
	SearchIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { formatAmount } from "@/services/bookings/types";
import {
	formatJobDate,
	jobDisplayFromRow,
} from "@/services/jobs/jobsApi";
import { useAuth } from "@/store/useAuth";
import { useCachedRequests } from "@/store/useCustomerCache";

export default function RequestsPage() {
	const { t } = useLocale();
	const router = useRouter();
	const { user } = useAuth();
	const customerKey = user?.id ?? "";
	const { data: jobs, loading, error } = useCachedRequests(customerKey);
	const [query, setQuery] = useState("");
	const [lightbox, setLightbox] = useState<{
		images: string[];
		index: number;
	} | null>(null);

	const items = useMemo(() => {
		const mapped = jobs.map((row) =>
			jobDisplayFromRow(row as Record<string, unknown>),
		);
		const q = query.trim().toLowerCase();
		if (!q) return mapped;
		return mapped.filter((job) => {
			const hay = [job.title, job.description, job.categoryName, job.price]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return hay.includes(q);
		});
	}, [jobs, query]);

	return (
		<div className="mx-auto flex min-h-[min(100dvh,56rem)] max-w-lg flex-col px-4 pt-4 pb-28 md:px-6 md:pt-8">
			<div className="mb-4 flex items-center gap-2">
				<h1 className="min-w-0 flex-1 text-[22px] font-bold tracking-tight">
					{t("requestsTitle")}
				</h1>
				<button
					type="button"
					aria-label={t("requestAddRequest")}
					onClick={() => router.push("/service/requests/new")}
					className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
				>
					<PlusIcon className="size-5" />
				</button>
			</div>

			<label className="relative mb-4 block">
				<SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t("requestSearchPlaceholder")}
					className="h-11 w-full rounded-full border-0 bg-[#f0f0ee] py-2 pr-4 pl-10 text-[14px] outline-none ring-primary/0 transition focus:bg-white focus:ring-2 focus:ring-primary/20"
				/>
			</label>

			{error ? (
				<p className="mb-3 text-sm text-destructive">{error}</p>
			) : null}

			<div className="flex-1 space-y-3">
				{loading ? (
					<ServiceLoading compact />
				) : items.length === 0 ? (
					<div className="rounded-2xl bg-white px-4 py-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
						<p className="text-sm text-muted-foreground">
							{query.trim()
								? t("bookingsNoMatchFilters")
								: t("requestNoJobRequests")}
						</p>
						{!query.trim() ? (
							<Button
								className="mt-4"
								onClick={() => router.push("/service/requests/new")}
							>
								{t("requestAddRequest")}
							</Button>
						) : null}
					</div>
				) : (
					items.map((job) => (
						<Link
							key={job.id}
							href={`/service/requests/${job.id}`}
							className="flex gap-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-muted/30"
						>
							{job.imageUrls.length > 0 ? (
								<button
									type="button"
									className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setLightbox({ images: job.imageUrls, index: 0 });
									}}
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={job.imageUrls[0]}
										alt=""
										className="size-full object-cover"
									/>
									{job.imageUrls.length > 1 ? (
										<span className="absolute right-1 bottom-1 rounded-md bg-black/65 px-1 py-0.5 text-[10px] font-semibold text-white tabular-nums">
											{job.imageUrls.length}
										</span>
									) : null}
								</button>
							) : (
								<div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
									<ImageIcon className="size-5 opacity-40" />
								</div>
							)}
							<div className="min-w-0 flex-1">
								<div className="flex items-start gap-2">
									<div className="min-w-0 flex-1">
										<p className="truncate text-[15px] font-bold text-foreground">
											{job.title || t("requestJobRequest")}
										</p>
										{job.createdAt ? (
											<p className="mt-0.5 text-[12px] text-muted-foreground">
												{formatJobDate(job.createdAt)}
											</p>
										) : null}
									</div>
									<div className="flex shrink-0 items-center gap-1">
										{job.price ? (
											<p className="text-[14px] font-bold tabular-nums text-primary">
												{formatAmount(job.price)}
											</p>
										) : null}
										<ChevronRightIcon className="size-4 text-muted-foreground" />
									</div>
								</div>
								{job.description ? (
									<p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
										{job.description}
									</p>
								) : null}
							</div>
						</Link>
					))
				)}
			</div>

			<div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-lg px-4 md:bottom-6">
				<Button
					className="h-12 w-full rounded-2xl text-[15px] font-semibold shadow-md"
					onClick={() => router.push("/service/requests/new")}
				>
					{t("requestAddRequest")}
				</Button>
			</div>

			{lightbox ? (
				<ImageLightbox
					images={lightbox.images}
					index={lightbox.index}
					onClose={() => setLightbox(null)}
					onIndexChange={(index) =>
						setLightbox((prev) => (prev ? { ...prev, index } : prev))
					}
				/>
			) : null}
		</div>
	);
}
