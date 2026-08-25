"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { ProviderMobileTabBar } from "@/components/provider/mobile-chrome";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	formatOfferPrice,
	respondToOffer,
	type ServiceOffer,
} from "@/services/offers/offersApi";
import { formatDateTime } from "@/services/bookings/types";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderOffers } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderOffers } from "@/store/useProviderCache";

function statusClass(status: string) {
	switch (status) {
		case "pending":
			return "bg-amber-100 text-amber-900";
		case "accepted":
			return "bg-[#e8f5e3] text-primary";
		default:
			return "bg-muted text-muted-foreground";
	}
}

export default function ProviderOffersPage() {
	const { user } = useAuth();
	const dispatch = useAppDispatch();
	const providerId = user?.provider?.id ?? "";
	const authUserId = user?.id ?? "";
	const { data: offers, loading, error, refresh, refreshing } =
		useCachedProviderOffers(providerId, authUserId);
	const [actingId, setActingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	async function onRespond(offer: ServiceOffer, accept: boolean) {
		if (actingId) return;
		setActingId(offer.id);
		setActionError(null);
		const res = await respondToOffer({ offerId: offer.id, accept });
		setActingId(null);
		if (!res.ok) {
			setActionError(res.error);
			return;
		}
		dispatch(invalidateProviderOffers());
		refresh();
	}

	return (
		<div className="mx-auto max-w-3xl">
			<ProviderMobileTabBar title="Offers" />

			<div className="hidden lg:block">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="admin-eyebrow">Provider</p>
						<h1 className="admin-page-title mt-1">Offers</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Customer price offers on your services
						</p>
					</div>
					<button
						type="button"
						onClick={refresh}
						className="text-xs font-medium text-primary"
					>
						{refreshing ? "Refreshing…" : "Refresh"}
					</button>
				</div>
			</div>

			<div className="px-3 pt-3 lg:px-0 lg:pt-5">
				<div className="mb-2 flex justify-end lg:hidden">
					<button
						type="button"
						onClick={refresh}
						className="text-xs font-medium text-primary"
					>
						{refreshing ? "Refreshing…" : "Refresh"}
					</button>
				</div>

				{actionError || error ? (
					<p className="mb-3 text-sm text-destructive">
						{actionError || error}
					</p>
				) : null}

				{loading ? (
					<AppLoading compact />
				) : offers.length === 0 ? (
					<div className="rounded-xl bg-white px-4 py-14 text-center">
						<p className="text-sm text-muted-foreground">No offers yet.</p>
					</div>
				) : (
					<ul className="space-y-2.5">
						{offers.map((offer) => (
							<li
								key={offer.id}
								className="overflow-hidden rounded-xl bg-white"
							>
								<div className="flex gap-3 p-3">
									<div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
										{offer.serviceImage ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={offer.serviceImage}
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
										<div className="flex items-start justify-between gap-2">
											<p className="line-clamp-1 text-sm font-semibold">
												{offer.serviceName || "Service offer"}
											</p>
											<span
												className={cn(
													"shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
													statusClass(offer.status),
												)}
											>
												{offer.status}
											</span>
										</div>
										<p className="mt-0.5 text-xs text-[#7C7C7C]">
											{offer.customerName || "Customer"}
										</p>
										<p className="mt-1 text-sm font-semibold text-primary">
											{formatOfferPrice(offer.offeredPrice)}
										</p>
										{offer.message ? (
											<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
												{offer.message}
											</p>
										) : null}
										<p className="mt-1 text-[10px] text-muted-foreground">
											{formatDateTime(offer.createdAt)}
										</p>
									</div>
								</div>
								{offer.status === "pending" ? (
									<div className="flex gap-2 border-t border-border/60 px-3 py-2.5">
										<Button
											size="sm"
											variant="outline"
											className="flex-1"
											disabled={actingId === offer.id}
											onClick={() => onRespond(offer, false)}
										>
											Reject
										</Button>
										<Button
											size="sm"
											className="flex-1"
											disabled={actingId === offer.id}
											onClick={() => onRespond(offer, true)}
										>
											Accept
										</Button>
									</div>
								) : null}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
