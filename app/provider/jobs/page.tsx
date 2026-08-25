"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRightIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import {
	fetchMyBidJobs,
	fetchOpenJobRequests,
	type ProviderJobRequest,
} from "@/services/jobs/jobsApi";
import { useAuth } from "@/store/useAuth";

export default function ProviderJobsPage() {
	const { user } = useAuth();
	/** Bid providerId matches Flutter auth uid. */
	const providerId = user?.id ?? "";
	const [tab, setTab] = useState<"open" | "bids">("open");
	const [jobs, setJobs] = useState<ProviderJobRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [q, setQ] = useState("");

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
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/provider/profile" label="Profile" />
				<button
					type="button"
					onClick={() => void load()}
					className="mb-3 text-xs font-medium text-primary"
				>
					Refresh
				</button>
			</div>
			<p className="admin-eyebrow">Marketplace</p>
			<h1 className="admin-page-title mt-1">Job requests</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				Browse open customer requests and place bids.
			</p>

			<div className="mt-4 flex gap-2">
				<Button
					size="sm"
					variant={tab === "open" ? "default" : "outline"}
					onClick={() => setTab("open")}
				>
					Open jobs
				</Button>
				<Button
					size="sm"
					variant={tab === "bids" ? "default" : "outline"}
					onClick={() => setTab("bids")}
				>
					My bids
				</Button>
			</div>

			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				placeholder="Search jobs…"
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
						{tab === "open" ? "No open jobs right now." : "No bids yet."}
					</p>
				) : (
					filtered.map((job) => {
						const myBid = job.bidList.find(
							(b) => b.providerId === providerId,
						);
						return (
							<Link
								key={job.id}
								href={`/provider/jobs/${job.id}`}
								className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">
										{job.title || "Job request"}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										Budget {formatAmount(job.price)}
										{job.createdAt
											? ` · ${formatDateTime(job.createdAt)}`
											: ""}
										{myBid?.price
											? ` · Your bid ${formatAmount(myBid.price)}`
											: ` · ${job.bidList.length} bid${job.bidList.length === 1 ? "" : "s"}`}
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
