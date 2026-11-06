"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	CalendarIcon,
	ImageIcon,
	Trash2Icon,
} from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useLocale } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase/client";
import { formatAmount } from "@/services/bookings/types";
import {
	acceptJobBid,
	deleteJobRequest,
} from "@/services/customer/bookingsApi";
import {
	formatJobDate,
	hydrateBidProviders,
	jobDisplayFromRow,
	type JobBid,
} from "@/services/jobs/jobsApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateRequests } from "@/store/customerCacheSlice";

export default function RequestDetailPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [job, setJob] = useState<ReturnType<typeof jobDisplayFromRow> | null>(
		null,
	);
	const [bids, setBids] = useState<JobBid[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

	async function reload() {
		setLoading(true);
		const { data, error: err } = await getSupabase()
			.from("job_request")
			.select("*")
			.eq("id", params.id)
			.maybeSingle();
		if (err) setError(err.message);
		const row = (data as Record<string, unknown> | null) ?? null;
		if (!row) {
			setJob(null);
			setBids([]);
			setLoading(false);
			return;
		}
		const display = jobDisplayFromRow(row);
		setJob(display);
		setBids(await hydrateBidProviders(display.bidList));
		setLoading(false);
	}

	useEffect(() => {
		void reload();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params.id]);

	async function onDelete() {
		if (!job || busy) return;
		if (!window.confirm(t("requestDeleteConfirm"))) return;
		setBusy(true);
		const res = await deleteJobRequest(job.id);
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		dispatch(invalidateRequests());
		router.replace("/service/requests");
	}

	async function onAcceptBid(bid: JobBid) {
		if (!job || busy) return;
		const providerId = bid.providerId?.trim() ?? "";
		const bidPrice = bid.price?.trim() ?? "";
		if (!providerId || !bidPrice) {
			setError(t("requestInvalidBid"));
			return;
		}
		if (
			!window.confirm(
				t("requestAcceptBidConfirm", { amount: formatAmount(bidPrice) }),
			)
		) {
			return;
		}
		setBusy(true);
		setError(null);
		const res = await acceptJobBid({
			jobId: job.id,
			providerId,
			bidPrice,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		dispatch(invalidateRequests());
		// Book from job id — serviceModelList ids are snapshots, not catalog rows.
		router.push(
			`/service/book/${job.id}?postJob=1&bidPrice=${encodeURIComponent(bidPrice)}&providerId=${encodeURIComponent(providerId)}`,
		);
	}

	if (loading) {
		return <ServiceLoading />;
	}

	if (!job) {
		return (
			<div className="px-4 pt-4">
				<ProfileBackLink href="/service/requests" label={t("requestsTitle")} />
				<p className="text-sm text-destructive">
					{error || t("requestNotFound")}
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-lg px-4 pt-4 pb-10 md:px-6 md:pt-8">
			<div className="mb-4 flex items-center gap-2">
				<ProfileBackLink
					href="/service/requests"
					label={t("requestPostDetails")}
					className="mb-0 min-w-0 flex-1 font-semibold"
				/>
				{!job.accepted ? (
					<button
						type="button"
						disabled={busy}
						aria-label={t("requestDelete")}
						onClick={() => void onDelete()}
						className="flex size-10 shrink-0 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
					>
						<Trash2Icon className="size-5" />
					</button>
				) : null}
			</div>

			{error ? (
				<p className="mb-3 text-sm text-destructive">{error}</p>
			) : null}

			<section className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
				<div className="flex items-start justify-between gap-3">
					<h1 className="min-w-0 text-[18px] font-bold text-foreground">
						{job.title || t("requestJobRequest")}
					</h1>
					{job.price ? (
						<p className="shrink-0 text-[16px] font-bold tabular-nums text-primary">
							{formatAmount(job.price)}
						</p>
					) : null}
				</div>
				{job.description ? (
					<p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap text-foreground/90">
						{job.description}
					</p>
				) : null}
				{(job.imageUrls.length > 0 || job.categoryName) && (
					<div className="mt-4 space-y-3 border-t border-border/60 pt-3">
						{job.imageUrls.length > 0 ? (
							<div className="flex gap-2 overflow-x-auto pb-0.5">
								{job.imageUrls.map((url, i) => (
									<button
										key={`${url}-${i}`}
										type="button"
										onClick={() => setLightboxIndex(i)}
										className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-black/5 transition-opacity hover:opacity-90"
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={url}
											alt=""
											className="size-full object-cover"
										/>
										{i === 0 && job.imageUrls.length > 1 ? (
											<span className="absolute right-1 bottom-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
												{job.imageUrls.length}
											</span>
										) : null}
									</button>
								))}
							</div>
						) : null}
						{job.categoryName ? (
							<div className="flex items-center gap-2.5">
								{job.imageUrls.length === 0 ? (
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
										<ImageIcon className="size-4 opacity-40" />
									</div>
								) : null}
								<p className="text-[13px] font-medium text-muted-foreground">
									{job.categoryName}
								</p>
							</div>
						) : null}
					</div>
				)}
			</section>

			{lightboxIndex != null && job.imageUrls.length > 0 ? (
				<ImageLightbox
					images={job.imageUrls}
					index={lightboxIndex}
					onClose={() => setLightboxIndex(null)}
					onIndexChange={setLightboxIndex}
				/>
			) : null}

			<section className="mt-6">
				<h2 className="text-[16px] font-bold text-foreground">
					{t("requestBids")}
				</h2>
				{bids.length === 0 ? (
					<p className="mt-3 rounded-2xl bg-white py-8 text-center text-sm text-muted-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
						{t("requestNoBids")}
					</p>
				) : (
					<ul className="mt-3 space-y-3">
						{bids.map((bid, i) => {
							const name =
								bid.providerName?.trim() ||
								t("provider") ||
								`Bid #${i + 1}`;
							const initial = name.charAt(0).toUpperCase();
							return (
								<li
									key={`${bid.providerId ?? i}-${i}`}
									className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
								>
									<div className="flex items-start gap-3">
										<div className="size-11 shrink-0 overflow-hidden rounded-full bg-muted">
											{bid.providerImage ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={bid.providerImage}
													alt=""
													className="size-full object-cover"
												/>
											) : (
												<div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
													{initial}
												</div>
											)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													<p className="truncate text-[15px] font-bold">
														{name}
													</p>
													{bid.createdAt ? (
														<p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
															<CalendarIcon className="size-3.5 shrink-0" />
															{formatJobDate(bid.createdAt)}
														</p>
													) : null}
												</div>
												{!job.accepted ? (
													<button
														type="button"
														disabled={busy}
														onClick={() => void onAcceptBid(bid)}
														className="shrink-0 rounded-full bg-primary/15 px-3.5 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/25 disabled:opacity-50"
													>
														{t("requestAcceptBid")}
													</button>
												) : null}
											</div>
											<div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
												<p className="text-[13px] text-muted-foreground">
													{t("requestBidAmount")}
												</p>
												<p className="text-[15px] font-bold tabular-nums text-primary">
													{formatAmount(bid.price)}
												</p>
											</div>
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</section>

			{job.accepted ? (
				<p className="mt-5 text-center text-sm font-medium text-primary">
					{t("statusAccepted")}
				</p>
			) : null}
		</div>
	);
}
