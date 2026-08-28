"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLocale } from "@/lib/i18n";
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
	const { t } = useLocale();
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
			? t("providerYourself").toLowerCase()
			: picked
				? handymanDisplayName(picked)
				: t("handymanTitle").toLowerCase();
		if (
			!window.confirm(
				opts.self
					? t("providerAssignConfirmSelf")
					: t("providerAssignConfirmHandyman", { name: label }),
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
				{t("commonBack")}
			</Button>

			<p className="admin-eyebrow">{t("bookingTitle")}</p>
			<h1 className="admin-page-title mt-1">{t("providerAssignTitle")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("providerAssignHint")}
			</p>

			{error || loadError ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error || loadError}</AlertDescription>
				</Alert>
			) : null}

			{loading || handymenLoading ? (
				<AppLoading compact />
			) : !booking ? (
				<p className="mt-6 text-sm text-destructive">{t("bookingNotFound")}</p>
			) : booking.status !== "pending" ? (
				<p className="mt-6 text-sm text-muted-foreground">
					{t("providerBookingAlreadyStatus", {
						status: booking.status ?? "",
					})}
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
									{user?.provider?.fullName ?? t("providerYou")}
								</p>
								<p className="text-xs text-muted-foreground">{t("provider")}</p>
							</div>
						</div>
						<Button
							className="mt-4 w-full"
							disabled={busy}
							onClick={() => void assign({ self: true })}
						>
							{t("providerAssignSelf")}
						</Button>
					</div>

					<div>
						<p className="mb-2 text-sm font-semibold">{t("handymanList")}</p>
						{activeHandymen.length === 0 ? (
							<p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
								{t("providerNoHandymen")}
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
													{t("handymanTitle")}
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
											{t("commonAssign")}
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
