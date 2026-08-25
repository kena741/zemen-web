"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import {
	fetchJobRequestById,
	placeJobBid,
	type ProviderJobRequest,
} from "@/services/jobs/jobsApi";
import { useAuth } from "@/store/useAuth";

export default function ProviderJobDetailPage() {
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const { user } = useAuth();
	/** Bid providerId matches Flutter auth uid. */
	const providerId = user?.id ?? "";
	const [job, setJob] = useState<ProviderJobRequest | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [bidPrice, setBidPrice] = useState("");
	const [busy, setBusy] = useState(false);

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
		job &&
		!myBid &&
		!(job.accepted && job.providerId) &&
		!(job.providerId && job.providerId.toLowerCase() !== "null");

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
		await load();
	}

	if (loading) return <AppLoading />;

	if (!job) {
		return (
			<div className="mx-auto max-w-2xl">
				<ProfileBackLink href="/provider/jobs" label="Jobs" />
				<p className="text-sm text-destructive">{error || "Not found"}</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl">
			<ProfileBackLink href="/provider/jobs" label="Jobs" />
			<p className="admin-eyebrow">Job request</p>
			<h1 className="admin-page-title mt-1">{job.title || "Untitled"}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Budget {formatAmount(job.price)}
				{job.createdAt ? ` · ${formatDateTime(job.createdAt)}` : ""}
			</p>

			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<div className="mt-5 space-y-3 rounded-xl border border-border bg-white p-4 shadow-xs">
				{job.description ? (
					<div>
						<p className="text-xs text-muted-foreground">Description</p>
						<p className="mt-0.5 whitespace-pre-wrap text-sm">
							{job.description}
						</p>
					</div>
				) : null}
				<div>
					<p className="text-xs text-muted-foreground">Bids</p>
					{job.bidList.length === 0 ? (
						<p className="mt-1 text-sm text-muted-foreground">No bids yet.</p>
					) : (
						<ul className="mt-2 space-y-2">
							{job.bidList.map((b, i) => (
								<li
									key={`${b.providerId}-${i}`}
									className="flex justify-between text-sm"
								>
									<span className="text-muted-foreground">
										{b.providerId === providerId
											? "Your bid"
											: `Provider ${b.providerId?.slice(0, 8) ?? "—"}`}
									</span>
									<span className="font-medium">{formatAmount(b.price)}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			{myBid ? (
				<p className="mt-4 rounded-xl bg-[#e8f5e3] px-4 py-3 text-sm text-primary">
					You bid {formatAmount(myBid.price)}. Waiting for the customer to
					accept.
				</p>
			) : canBid ? (
				<form
					onSubmit={onBid}
					className="mt-5 space-y-3 rounded-xl border border-border bg-white p-4 shadow-xs"
				>
					<Label htmlFor="bid">Your bid (ETB)</Label>
					<Input
						id="bid"
						required
						inputMode="decimal"
						value={bidPrice}
						onChange={(e) => setBidPrice(e.target.value)}
						placeholder="Enter amount"
					/>
					<div className="flex gap-2">
						<Button type="submit" disabled={busy}>
							Place bid
						</Button>
						<Button
							type="button"
							variant="ghost"
							onClick={() => router.push("/provider/jobs")}
						>
							Back
						</Button>
					</div>
				</form>
			) : (
				<p className="mt-4 text-sm text-muted-foreground">
					Bidding is closed for this job.
				</p>
			)}
		</div>
	);
}
