"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
	ChevronRightIcon,
	ImageIcon,
	MapPinIcon,
	MessageSquareIcon,
	UserIcon,
} from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import { formatAmount } from "@/services/bookings/types";
import {
	fetchJobRequestById,
	placeJobBid,
	type ProviderJobRequest,
} from "@/services/jobs/jobsApi";
import { useAuth } from "@/store/useAuth";

export default function ProviderJobDetailPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? user?.id ?? "";
	const [job, setJob] = useState<ProviderJobRequest | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [bidPrice, setBidPrice] = useState("");
	const [busy, setBusy] = useState(false);
	const [showBidForm, setShowBidForm] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		const res = await fetchJobRequestById(id);
		setJob(res.job);
		setError(res.error);
		setLoading(false);
	}, [id]);

	useEffect(() => {
		void load();
	}, [load]);

	const myBid = job?.bidList.find((b) => b.providerId === providerId);
	const canBid =
		Boolean(job) &&
		!myBid &&
		!(job?.accepted && job.providerId) &&
		!(job?.providerId && job.providerId.toLowerCase() !== "null");

	async function onBid(e: React.FormEvent) {
		e.preventDefault();
		if (!job || !providerId) return;
		setBusy(true);
		setError(null);
		const res = await placeJobBid({
			jobId: job.id,
			providerId,
			price: bidPrice,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setBidPrice("");
		setShowBidForm(false);
		await load();
	}

	if (loading) return <AppLoading />;

	if (!job) {
		return (
			<div className="mx-auto max-w-lg px-4 pt-4">
				<ProfileBackLink href="/provider/jobs" label={t("providerJobDetail")} />
				<p className="text-sm text-destructive">{error || t("commonNotFound")}</p>
			</div>
		);
	}

	const serviceTitle =
		job.serviceName?.trim() || job.title?.trim() || t("providerJobRequest");
	const images = job.imageUrls.length
		? job.imageUrls
		: job.imageUrl
			? [job.imageUrl]
			: [];

	return (
		<div className="mx-auto flex min-h-[min(100dvh,56rem)] max-w-lg flex-col px-4 pt-4 pb-28 md:px-6 md:pt-8">
			<ProfileBackLink
				href="/provider/jobs"
				label={t("providerJobDetail")}
				className="mb-4 font-semibold"
			/>

			{error ? (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<section className="space-y-2">
				<h2 className="text-[15px] font-bold text-foreground">
					{t("providerAboutCustomer")}
				</h2>
				<div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
					<div className="size-12 shrink-0 overflow-hidden rounded-full bg-muted">
						{job.customerImage ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={job.customerImage}
								alt=""
								className="size-full object-cover"
							/>
						) : (
							<div className="flex size-full items-center justify-center text-muted-foreground">
								<UserIcon className="size-5 opacity-50" />
							</div>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-[15px] font-bold">
							{job.customerName?.trim() || t("customer")}
						</p>
						{job.address ? (
							<p className="mt-0.5 flex items-start gap-1 text-[12px] text-muted-foreground">
								<MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
								<span className="line-clamp-2">{job.address}</span>
							</p>
						) : null}
					</div>
					{job.customerId ? (
						<Link
							href={`/provider/inbox/${job.customerId}`}
							className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
							aria-label={t("profileMessages")}
						>
							<MessageSquareIcon className="size-4" />
						</Link>
					) : null}
				</div>
			</section>

			<section className="mt-5 space-y-2">
				<h2 className="text-[15px] font-bold text-foreground">
					{t("providerAboutService")}
				</h2>
				<div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
					<button
						type="button"
						className="flex w-full items-center gap-3 p-3.5 text-left"
						onClick={() => {
							if (images.length) setLightboxIndex(0);
						}}
					>
						<div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
							{images[0] ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={images[0]}
									alt=""
									className="size-full object-cover"
								/>
							) : (
								<div className="flex size-full items-center justify-center text-muted-foreground">
									<ImageIcon className="size-6 opacity-40" />
								</div>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-[15px] font-bold">{serviceTitle}</p>
							{job.categoryName ? (
								<p className="mt-0.5 text-[13px] text-muted-foreground">
									{job.categoryName}
								</p>
							) : null}
							<p className="mt-1 text-[15px] font-bold tabular-nums text-primary">
								{formatAmount(job.price)}
							</p>
						</div>
						<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
					</button>
					{job.description ? (
						<div className="border-t border-border/60 bg-[#f7f7f5] px-3.5 py-3">
							<p className="text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
								{job.description}
							</p>
						</div>
					) : null}
				</div>
			</section>

			{myBid ? (
				<p className="mt-5 rounded-2xl bg-[#e8f5e3] px-4 py-3 text-sm font-medium text-primary">
					{t("providerBidWaiting", { amount: formatAmount(myBid.price) })}
				</p>
			) : null}

			{lightboxIndex != null && images.length > 0 ? (
				<ImageLightbox
					images={images}
					index={lightboxIndex}
					onClose={() => setLightboxIndex(null)}
					onIndexChange={setLightboxIndex}
				/>
			) : null}

			{canBid ? (
				<div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-lg px-4 md:bottom-6">
					{showBidForm ? (
						<form
							onSubmit={(e) => void onBid(e)}
							className="space-y-2 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/5"
						>
							<Input
								required
								inputMode="decimal"
								value={bidPrice}
								onChange={(e) => setBidPrice(e.target.value)}
								placeholder={t("providerBidPlaceholder")}
								className="h-11"
							/>
							<div className="flex gap-2">
								<Button type="submit" className="flex-1" disabled={busy}>
									{busy ? t("commonSaving") : t("providerPlaceBid")}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setShowBidForm(false)}
								>
									{t("commonCancel")}
								</Button>
							</div>
						</form>
					) : (
						<Button
							className="h-12 w-full rounded-2xl text-[15px] font-semibold shadow-md"
							onClick={() => setShowBidForm(true)}
						>
							{t("providerBidAction")}
						</Button>
					)}
				</div>
			) : !myBid ? (
				<p className="mt-6 text-center text-sm text-muted-foreground">
					{t("providerBiddingClosed")}
				</p>
			) : null}
		</div>
	);
}
