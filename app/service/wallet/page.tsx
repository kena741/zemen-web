"use client";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";
import { useCachedWallet } from "@/store/useCustomerCache";

export default function CustomerWalletPage() {
	const { user } = useAuth();
	const authUserId = user?.id ?? "";
	const customerId = user?.customer?.id ?? user?.id ?? "";
	const { data, loading, error, refresh, refreshing } = useCachedWallet({
		authUserId,
		customerId,
		balanceHint: user?.customer?.walletAmount,
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
			<h1 className="admin-page-title">Wallet</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Balance & recent activity
			</p>

			<div className="mt-5 rounded-xl bg-primary px-5 py-6 text-primary-foreground shadow-sm">
				<p className="text-xs font-medium text-primary-foreground/80">
					Available balance
				</p>
				<p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
					{loading ? "…" : formatAmount(data.balance)}
				</p>
				<p className="mt-2 text-xs text-primary-foreground/70">
					Top-ups are available in the mobile app
				</p>
			</div>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<section className="mt-6">
				<h2 className="text-sm font-semibold">History</h2>
				<div className="mt-3 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
					{loading ? (
						<ServiceLoading compact />
					) : data.transactions.length === 0 ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							No transactions yet.
						</p>
					) : (
						data.transactions.map((tx) => (
							<div
								key={tx.id}
								className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
							>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium">
										{tx.note || tx.paymentType || "Transaction"}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{formatDateTime(tx.createdDate)}
									</p>
								</div>
								<p
									className={`shrink-0 text-sm font-semibold tabular-nums ${
										tx.isCredit ? "text-primary" : "text-foreground"
									}`}
								>
									{tx.isCredit ? "+" : "−"}
									{formatAmount(tx.amount)}
								</p>
							</div>
						))
					)}
				</div>
			</section>
		</div>
	);
}
