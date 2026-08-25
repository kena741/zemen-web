"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Button } from "@/components/ui/button";
import { ServiceLoading } from "@/components/service/service-loading";
import { getSupabase } from "@/lib/supabase/client";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import { deleteJobRequest } from "@/services/customer/bookingsApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateRequests } from "@/store/customerCacheSlice";

export default function RequestDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [job, setJob] = useState<Record<string, unknown> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			const { data, error: err } = await getSupabase()
				.from("job_request")
				.select("*")
				.eq("id", params.id)
				.maybeSingle();
			if (cancelled) return;
			if (err) setError(err.message);
			setJob((data as Record<string, unknown> | null) ?? null);
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [params.id]);

	async function onDelete() {
		if (!job || busy) return;
		if (!window.confirm("Delete this job request?")) return;
		setBusy(true);
		const res = await deleteJobRequest(String(job.id));
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		dispatch(invalidateRequests());
		router.replace("/service/requests");
	}

	if (loading) {
		return <ServiceLoading />;
	}

	if (!job) {
		return (
			<div className="px-4 pt-4">
				<ProfileBackLink href="/service/requests" label="Requests" />
				<p className="text-sm text-destructive">
					{error || "Request not found"}
				</p>
			</div>
		);
	}

	const bids = Array.isArray(job.bidList)
		? (job.bidList as Record<string, unknown>[])
		: [];

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href="/service/requests" label="Requests" />
			<h1 className="admin-page-title">
				{String(job.title ?? "Job request")}
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{job.accepted === true ? "Accepted" : "Open for bids"}
				{job.createdAt
					? ` · ${formatDateTime(String(job.createdAt))}`
					: null}
			</p>

			{error ? (
				<p className="mt-3 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
				{job.description ? (
					<div>
						<p className="text-xs text-muted-foreground">Description</p>
						<p className="mt-0.5 whitespace-pre-wrap text-sm">
							{String(job.description)}
						</p>
					</div>
				) : null}
				{job.price ? (
					<div>
						<p className="text-xs text-muted-foreground">Budget</p>
						<p className="mt-0.5 text-sm font-semibold text-primary">
							{formatAmount(String(job.price))}
						</p>
					</div>
				) : null}
			</div>

			<section className="mt-6">
				<h2 className="text-sm font-semibold">
					Bids ({bids.length})
				</h2>
				<div className="mt-3 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
					{bids.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No bids yet.
						</p>
					) : (
						bids.map((bid, i) => (
							<div
								key={i}
								className="border-b border-border px-4 py-3 last:border-b-0"
							>
								<p className="text-sm font-semibold">
									{String(
										bid.providerName ??
											bid.providerId ??
											`Bid #${i + 1}`,
									)}
								</p>
								{bid.price != null || bid.bidPrice != null ? (
									<p className="mt-0.5 text-sm text-primary">
										{formatAmount(
											String(bid.bidPrice ?? bid.price),
										)}
									</p>
								) : null}
								{bid.note != null || bid.description != null ? (
									<p className="mt-1 text-xs text-muted-foreground">
										{String(bid.note ?? bid.description)}
									</p>
								) : null}
							</div>
						))
					)}
				</div>
			</section>

			{job.accepted !== true ? (
				<Button
					variant="outline"
					className="mt-5 w-full text-destructive"
					disabled={busy}
					onClick={onDelete}
				>
					{busy ? "Deleting…" : "Delete request"}
				</Button>
			) : null}
		</div>
	);
}
