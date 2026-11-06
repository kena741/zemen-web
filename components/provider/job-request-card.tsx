"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon, ImageIcon, UserIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { formatAmount } from "@/services/bookings/types";
import {
	formatJobDate,
	type ProviderJobRequest,
} from "@/services/jobs/jobsApi";

function jobThumb(job: ProviderJobRequest): string | null {
	return job.imageUrl ?? job.customerImage ?? null;
}

function jobTitle(job: ProviderJobRequest): string {
	return (
		job.serviceName?.trim() ||
		job.title?.trim() ||
		job.customerName?.trim() ||
		"Job request"
	);
}

function myBidAmount(
	job: ProviderJobRequest,
	providerId: string,
): string | null {
	const bid = job.bidList.find((b) => b.providerId === providerId);
	return bid?.price ?? null;
}

/** Horizontal card for provider home (mirrors UpcomingBookingCard). */
export function JobRequestHomeCard({ job }: { job: ProviderJobRequest }) {
	const [imgFailed, setImgFailed] = useState(false);
	const image = jobThumb(job);

	return (
		<Link
			href={`/provider/jobs/${job.id}`}
			className="relative flex h-50 w-55 shrink-0 flex-col overflow-hidden sm:w-65"
		>
			<div className="h-35 w-full overflow-hidden rounded-[10px] bg-muted">
				{image && !imgFailed ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={image}
						alt=""
						className="size-full object-cover"
						onError={() => setImgFailed(true)}
					/>
				) : (
					<div className="flex size-full items-center justify-center text-muted-foreground">
						<ImageIcon className="size-8 opacity-35" />
					</div>
				)}
			</div>
			<div className="absolute inset-x-0 bottom-2 flex h-16 flex-col justify-evenly rounded-b-xl bg-white px-2 py-1.5">
				<p className="line-clamp-1 text-sm font-semibold text-[#525252]">
					{jobTitle(job)}
				</p>
				<div className="flex items-center justify-between gap-2">
					<p className="min-w-0 truncate text-xs font-semibold tabular-nums text-primary">
						{formatAmount(job.price)}
					</p>
					{job.categoryName ? (
						<p className="max-w-25 truncate text-right text-xs text-muted-foreground">
							{job.categoryName}
						</p>
					) : null}
				</div>
			</div>
		</Link>
	);
}

/** Full-width Bid List / open-job card matching mobile. */
export function JobBidListCard({
	job,
	providerId,
	mode,
}: {
	job: ProviderJobRequest;
	providerId: string;
	mode: "open" | "bids";
}) {
	const { t } = useLocale();
	const [imgFailed, setImgFailed] = useState(false);
	const image = jobThumb(job);
	const assigned =
		job.accepted &&
		Boolean(job.providerId) &&
		job.providerId === providerId;
	const statusLabel =
		mode === "bids"
			? assigned
				? t("providerBidAssigned")
				: t("providerBidPending")
			: t("providerOpenJobs");
	const amount =
		mode === "bids"
			? myBidAmount(job, providerId) ?? job.price
			: job.price;

	return (
		<Link
			href={`/provider/jobs/${job.id}`}
			className="flex gap-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-muted/30"
		>
			<div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
				{image && !imgFailed ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={image}
						alt=""
						className="size-full object-cover"
						onError={() => setImgFailed(true)}
					/>
				) : (
					<div className="flex size-full items-center justify-center text-muted-foreground">
						{job.customerImage ? (
							<UserIcon className="size-6 opacity-40" />
						) : (
							<ImageIcon className="size-6 opacity-40" />
						)}
					</div>
				)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-2">
					<p
						className={cn(
							"text-[13px] font-semibold",
							assigned || mode === "bids"
								? "text-primary"
								: "text-muted-foreground",
						)}
					>
						{statusLabel}
					</p>
					{job.createdAt ? (
						<p className="shrink-0 text-[12px] text-muted-foreground">
							{formatJobDate(job.createdAt)}
						</p>
					) : null}
				</div>
				<p className="mt-1 truncate text-[15px] font-bold text-foreground">
					{job.customerName?.trim() || jobTitle(job)}
				</p>
				<p className="mt-1 text-[14px] font-bold tabular-nums text-primary">
					{formatAmount(amount)}
				</p>
			</div>
			<ChevronRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
		</Link>
	);
}
