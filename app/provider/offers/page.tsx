"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

import { ProviderMobileTabBar } from "@/components/provider/mobile-chrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	fetchProviderOffers,
	formatOfferPrice,
	respondToOffer,
	type ServiceOffer,
} from "@/services/offers/offersApi";
import { formatDateTime } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";

function statusClass(status: string) {
	switch (status) {
		case "pending":
			return "bg-amber-100 text-amber-900";
		case "accepted":
			return "bg-[#e8f5e3] text-primary";
		case "rejected":
		case "cancelled":
		case "expired":
			return "bg-muted text-muted-foreground";
		default:
			return "bg-muted text-muted-foreground";
	}
}

export default function ProviderOffersPage() {
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const authUserId = user?.id ?? "";
	const [offers, setOffers] = useState<ServiceOffer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actingId, setActingId] = useState<string | null>(null);

	async function load() {
		if (!providerId && !authUserId) return;
		setLoading(true);
		const res = await fetchProviderOffers(providerId, authUserId);
		setOffers(res.offers);
		setError(res.error);
		setLoading(false);
	}

	useEffect(() => {
		void load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [providerId, authUserId]);

	async function onRespond(offer: ServiceOffer, accept: boolean) {
		if (actingId) return;
		setActingId(offer.id);
		const res = await respondToOffer({ offerId: offer.id, accept });
		setActingId(null);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		await load();
	}

	return (
		<div className="mx-auto max-w-3xl">
			<ProviderMobileTabBar title="Offers" />

			<div className="hidden lg:block">
				<p className="admin-eyebrow">Provider</p>
				<h1 className="admin-page-title mt-1">Offers</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Customer price offers on your services
				</p>
			</div>

			<div className="px-3 pt-3 lg:px-0 lg:pt-5">
				{error ? (
					<p className="mb-3 text-sm text-destructive">{error}</p>
				) : null}

				{loading ? (
					<div className="space-y-2.5">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="h-28 animate-pulse rounded-xl bg-muted"
							/>
						))}
					</div>
				) : offers.length === 0 ? (
					<div className="rounded-xl bg-white px-4 py-14 text-center">
						<p className="text-sm text-muted-foreground">
							No offers yet.
						</p>
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
