"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import {
	fetchMyBidJobs,
	fetchOpenJobRequests,
	type ProviderJobRequest,
} from "@/services/jobs/jobsApi";
import { useAuth } from "@/store/useAuth";

function ProviderJobsContent() {
	const { t } = useLocale();
	const { user } = useAuth();
	const search = useSearchParams();
	const providerId = user?.id ?? "";
	const [tab, setTab] = useState<"open" | "bids">(
		search.get("tab") === "bids" ? "bids" : "open",
	);
	const [jobs, setJobs] = useState<ProviderJobRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [q, setQ] = useState("");

	useEffect(() => {
		setTab(search.get("tab") === "bids" ? "bids" : "open");
	}, [search]);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		const res =
			tab === "open"
				? await fetchOpenJobRequests()
				: await fetchMyBidJobs(providerId);
		setJobs(res.jobs);
		setError(res.error);
		setLoading(false);
	}, [tab, providerId]);

	useEffect(() => {
		void load();
	}, [load]);

	const filtered = jobs.filter((j) => {
		if (!q.trim()) return true;
		const hay = `${j.title ?? ""} ${j.description ?? ""}`.toLowerCase();
		return hay.includes(q.trim().toLowerCase());
	});

	return (
		<div className="mx-auto max-w-3xl">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<p className="admin-eyebrow">{t("commonMarketplace")}</p>
			<h1 className="admin-page-title mt-1">{t("providerJobRequests")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("providerJobsSubtitle")}
			</p>

			<div className="mt-4 flex gap-2">
				<Button
					size="sm"
					variant={tab === "open" ? "default" : "outline"}
					onClick={() => setTab("open")}
				>
					{t("providerOpenJobs")}
				</Button>
				<Button
					size="sm"
					variant={tab === "bids" ? "default" : "outline"}
					onClick={() => setTab("bids")}
				>
					{t("providerMyBids")}
				</Button>
			</div>

			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				placeholder={t("providerSearchJobs")}
				className="mt-4 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
			/>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
				{loading ? (
					<AppLoading compact />
				) : filtered.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						{tab === "open" ? t("providerNoOpenJobs") : t("providerNoBids")}
					</p>
				) : (
					filtered.map((job) => {
						const myBid = job.bidList.find(
							(b) => b.providerId === providerId,
						);
						const bidCountLabel =
							job.bidList.length === 1
								? t("providerBidCountOne")
								: t("providerBidCount", { count: job.bidList.length });
						return (
							<Link
								key={job.id}
								href={`/provider/jobs/${job.id}`}
								className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">
										{job.title || t("providerJobRequest")}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{t("providerBudget", { amount: formatAmount(job.price) })}
										{job.createdAt
											? ` · ${formatDateTime(job.createdAt)}`
											: ""}
										{myBid?.price
											? ` · ${t("providerYourBidAmount", { amount: formatAmount(myBid.price) })}`
											: ` · ${bidCountLabel}`}
									</p>
								</div>
								<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
							</Link>
						);
					})
				)}
			</div>
		</div>
	);
}

export default function ProviderJobsPage() {
	return (
		<Suspense fallback={<AppLoading />}>
			<ProviderJobsContent />
		</Suspense>
	);
}
