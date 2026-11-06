"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";

import { JobBidListCard } from "@/components/provider/job-request-card";
import { AppLoading } from "@/components/ui/app-loading";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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
	const providerId = user?.provider?.id ?? user?.id ?? "";
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
		if (!providerId) {
			setJobs([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		const res =
			tab === "open"
				? await fetchOpenJobRequests({ providerId })
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
		const hay = [
			j.title,
			j.description,
			j.customerName,
			j.serviceName,
			j.categoryName,
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		return hay.includes(q.trim().toLowerCase());
	});

	const pageTitle =
		tab === "bids" ? t("providerBidList") : t("providerJobRequests");

	return (
		<div className="mx-auto max-w-lg px-4 pb-10 pt-4 md:px-6 md:pt-8">
			<div className="mb-4 flex items-center gap-2">
				<Link
					href="/provider"
					className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
					aria-label={t("commonBack")}
				>
					<ArrowLeftIcon className="size-5" />
				</Link>
				<h1 className="text-[20px] font-bold tracking-tight">{pageTitle}</h1>
			</div>

			<div className="mb-4 flex gap-2 rounded-full bg-[#f0f0ee] p-1">
				<button
					type="button"
					onClick={() => setTab("open")}
					className={cn(
						"flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors",
						tab === "open"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{t("providerOpenJobs")}
				</button>
				<button
					type="button"
					onClick={() => setTab("bids")}
					className={cn(
						"flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors",
						tab === "bids"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{t("providerMyBids")}
				</button>
			</div>

			<label className="relative mb-4 block">
				<SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
				<input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder={t("providerSearchJobs")}
					className="h-11 w-full rounded-full border-0 bg-[#f0f0ee] py-2 pr-4 pl-10 text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20"
				/>
			</label>

			{error ? (
				<p className="mb-3 text-sm text-destructive">{error}</p>
			) : null}

			{loading ? (
				<AppLoading compact />
			) : filtered.length === 0 ? (
				<p className="rounded-2xl bg-white py-12 text-center text-sm text-muted-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
					{tab === "open" ? t("providerNoOpenJobs") : t("providerNoBids")}
				</p>
			) : (
				<ul className="space-y-3">
					{filtered.map((job) => (
						<li key={job.id}>
							<JobBidListCard
								job={job}
								providerId={providerId}
								mode={tab}
							/>
						</li>
					))}
				</ul>
			)}
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
