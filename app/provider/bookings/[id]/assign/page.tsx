"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { assignBookingWorker } from "@/services/bookings/bookingsApi";
import { handymanDisplayName } from "@/services/handymen/handymenApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderBookings } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import {
	useCachedProviderBookingDetail,
	useCachedProviderHandymen,
} from "@/store/useProviderCache";

export default function AssignHandymanPage() {
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const { booking, loading, error: loadError } =
		useCachedProviderBookingDetail(id);
	const teamProviderId = user?.provider?.id ?? "";
	const { data: handymen, loading: handymenLoading } =
		useCachedProviderHandymen(teamProviderId);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function assign(opts: { self: boolean; handymanId?: string }) {
		if (!booking || busy) return;
		const picked = handymen.find((h) => h.id === opts.handymanId);
		const label = opts.self
			? "yourself"
			: picked
				? handymanDisplayName(picked)
				: "this handyman";
		if (
			!window.confirm(
				opts.self
					? "Assign this job to yourself?"
					: `Assign this job to ${label}?`,
			)
		) {
			return;
		}
		setBusy(true);
		setError(null);
		const res = await assignBookingWorker({
			bookingId: booking.id,
			providerMySelf: opts.self,
			handymanId: opts.self ? null : opts.handymanId,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		dispatch(invalidateProviderBookings());
		router.replace(`/provider/bookings/${booking.id}`);
	}

	const activeHandymen = handymen.filter((h) => h.active && h.isActive);

	return (
		<div className="mx-auto max-w-2xl">
			<Button
				variant="ghost"
				size="sm"
				className="-ml-2 mb-3 gap-1.5"
				onClick={() => router.push(`/provider/bookings/${id}`)}
			>
				<ArrowLeftIcon className="size-4" />
				Back
			</Button>

			<p className="admin-eyebrow">Booking</p>
			<h1 className="admin-page-title mt-1">Assign worker</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				Accept this booking by assigning yourself or a handyman.
			</p>

			{error || loadError ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error || loadError}</AlertDescription>
				</Alert>
			) : null}

			{loading || handymenLoading ? (
				<AppLoading compact />
			) : !booking ? (
				<p className="mt-6 text-sm text-destructive">Booking not found</p>
			) : booking.status !== "pending" ? (
				<p className="mt-6 text-sm text-muted-foreground">
					This booking is already {booking.status}. Assignment is only for
					pending bookings.
				</p>
			) : (
				<div className="mt-6 space-y-4">
					<div className="rounded-xl border border-border bg-white p-4 shadow-xs">
						<div className="flex items-center gap-3">
							<UserAvatar
								src={user?.provider?.profileImage}
								name={user?.provider?.fullName ?? user?.name}
								size="md"
							/>
							<div>
								<p className="text-sm font-semibold">
									{user?.provider?.fullName ?? "You"}
								</p>
								<p className="text-xs text-muted-foreground">Provider</p>
							</div>
						</div>
						<Button
							className="mt-4 w-full"
							disabled={busy}
							onClick={() => void assign({ self: true })}
						>
							Assign myself
						</Button>
					</div>

					<div>
						<p className="mb-2 text-sm font-semibold">Handymen</p>
						{activeHandymen.length === 0 ? (
							<p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
								No active handymen. Add one from Profile → Handyman List.
							</p>
						) : (
							<div className="space-y-2">
								{activeHandymen.map((h) => (
									<div
										key={h.id}
										className="rounded-xl border border-border bg-white p-4 shadow-xs"
									>
										<div className="flex items-center gap-3">
											<UserAvatar
												src={h.profileImage}
												name={handymanDisplayName(h)}
												size="md"
											/>
											<div>
												<p className="text-sm font-semibold">
													{handymanDisplayName(h)}
												</p>
												<p className="text-xs text-muted-foreground">
													Handyman
												</p>
											</div>
										</div>
										<Button
											className="mt-4 w-full"
											variant="outline"
											disabled={busy}
											onClick={() =>
												void assign({ self: false, handymanId: h.id })
											}
										>
											Assign
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
