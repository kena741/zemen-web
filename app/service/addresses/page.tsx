"use client";

import { MapPinIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useAuth } from "@/store/useAuth";
import { useCachedAddresses } from "@/store/useCustomerCache";

export default function AddressesPage() {
	const { user } = useAuth();
	const customerId = user?.customer?.id ?? user?.id ?? "";
	const { data: addresses, loading, error, refresh, refreshing } =
		useCachedAddresses({
			customerId,
			authUserId: user?.id,
		});

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/service/profile" label="Profile" />
				<button
					type="button"
					onClick={refresh}
					className="mb-3 text-xs font-medium text-primary"
				>
					{refreshing ? "Refreshing…" : "Refresh"}
				</button>
			</div>
			<h1 className="admin-page-title">Addresses</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Saved locations for bookings
			</p>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
				{loading ? (
					<ServiceLoading compact />
				) : addresses.length === 0 ? (
					<div className="px-4 py-12 text-center">
						<MapPinIcon className="mx-auto size-8 text-muted-foreground/50" />
						<p className="mt-3 text-sm text-muted-foreground">
							No saved addresses yet. Add them in the mobile app, or
							enter an address when booking.
						</p>
					</div>
				) : (
					addresses.map((a) => (
						<div
							key={a.id}
							className="flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-b-0"
						>
							<MapPinIcon className="mt-0.5 size-5 shrink-0 text-primary" />
							<div className="min-w-0">
								<p className="text-sm font-semibold">
									{a.label}
									{a.isDefault ? (
										<span className="ml-2 text-[10px] font-medium text-primary">
											Default
										</span>
									) : null}
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{a.full}
								</p>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
