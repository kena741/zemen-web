"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchBankMethods } from "@/services/bank/bankApi";
import type { BankMethod } from "@/services/bank/types";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import {
	fetchWalletBalance,
	fetchWalletTransactions,
	fetchWithdrawals,
	requestWithdrawal,
} from "@/services/wallet/walletApi";
import type {
	WalletTransaction,
	WithdrawRequest,
} from "@/services/wallet/types";
import { useAuth } from "@/store/useAuth";

export default function WalletPage() {
	const { user } = useAuth();
	const authUserId = user?.id ?? "";
	const providerId = user?.provider?.id ?? "";
	const [balance, setBalance] = useState(0);
	const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
	const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
	const [banks, setBanks] = useState<BankMethod[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [showWithdraw, setShowWithdraw] = useState(false);
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [tab, setTab] = useState<"tx" | "withdraw">("tx");

	const load = useCallback(async () => {
		if (!authUserId || !providerId) return;
		setLoading(true);
		const [bal, txs, wds, bks] = await Promise.all([
			fetchWalletBalance(providerId),
			fetchWalletTransactions({ authUserId, providerId }),
			fetchWithdrawals({ authUserId, providerId }),
			fetchBankMethods({ authUserId, providerId }),
		]);
		setBalance(bal.balance);
		setTransactions(txs.transactions);
		setWithdrawals(wds.withdrawals);
		setBanks(bks.banks);
		setError(bal.error || txs.error || wds.error || bks.error);
		setLoading(false);
	}, [authUserId, providerId]);

	useEffect(() => {
		void load();
	}, [load]);

	const defaultBank = banks.find((b) => b.isDefault) ?? banks[0] ?? null;

	async function submitWithdraw(e: React.FormEvent) {
		e.preventDefault();
		if (!defaultBank) {
			setError("Add a bank account before withdrawing.");
			return;
		}
		const value = Number(amount);
		if (!value || value <= 0) {
			setError("Enter a valid amount");
			return;
		}
		setBusy(true);
		setError(null);
		const res = await requestWithdrawal({
			providerId,
			amount: value,
			note,
			paymentMethodId: defaultBank.id,
			holderName: defaultBank.holderName ?? "",
			bankName: defaultBank.bankName ?? defaultBank.methodName ?? "Bank",
			accountNumber: defaultBank.accountNumber ?? "",
			swiftCode: defaultBank.swiftCode,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setShowWithdraw(false);
		setAmount("");
		setNote("");
		await load();
	}

	return (
		<div className="mx-auto max-w-3xl">
			<ProfileBackLink />
			<p className="admin-eyebrow">Payments</p>
			<h1 className="admin-page-title mt-1">Wallet</h1>

			<div className="admin-brand-band mt-6 px-5 py-6">
				<p className="admin-brand-band-label">Available balance</p>
				<p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{loading ? "…" : formatAmount(String(balance))}
				</p>
				<div className="mt-4 flex flex-wrap gap-2">
					<Button
						size="sm"
						variant="secondary"
						className="bg-white/15 text-primary-foreground hover:bg-white/25"
						onClick={() => setShowWithdraw((v) => !v)}
					>
						{showWithdraw ? "Cancel" : "Request withdrawal"}
					</Button>
					<Link
						href="/provider/bank"
						className={cn(
							buttonVariants({ size: "sm", variant: "secondary" }),
							"bg-white/15 text-primary-foreground hover:bg-white/25",
						)}
					>
						Bank details
					</Link>
				</div>
			</div>

			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{showWithdraw ? (
				<form
					onSubmit={submitWithdraw}
					className="mt-4 space-y-3 rounded-xl border border-border bg-white p-4 shadow-xs"
				>
					{defaultBank ? (
						<p className="text-sm text-muted-foreground">
							Payout to {defaultBank.bankName} · {defaultBank.accountNumber}
						</p>
					) : (
						<p className="text-sm text-destructive">
							No bank account.{" "}
							<Link href="/provider/bank" className="underline">
								Add one
							</Link>
						</p>
					)}
					<div className="space-y-1.5">
						<Label htmlFor="amount">Amount (ETB)</Label>
						<Input
							id="amount"
							type="number"
							min={1}
							step="0.01"
							required
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="note">Note (optional)</Label>
						<Input
							id="note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
						/>
					</div>
					<Button type="submit" disabled={busy || !defaultBank}>
						Submit request
					</Button>
				</form>
			) : null}

			<div className="mt-6 flex gap-1.5">
				<Button
					size="sm"
					variant={tab === "tx" ? "default" : "outline"}
					onClick={() => setTab("tx")}
				>
					Transactions
				</Button>
				<Button
					size="sm"
					variant={tab === "withdraw" ? "default" : "outline"}
					onClick={() => setTab("withdraw")}
				>
					Withdrawals
				</Button>
			</div>

			<div className="mt-3 rounded-xl border border-border bg-white px-4 shadow-xs">
				{loading ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						Loading…
					</p>
				) : tab === "tx" ? (
					transactions.length === 0 ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							No wallet transactions yet.
						</p>
					) : (
						transactions.map((tx) => (
							<div
								key={tx.id}
								className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0"
							>
								<div className="min-w-0">
									<p className="text-sm font-medium">
										{tx.note || tx.paymentType || "Transaction"}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{formatDateTime(tx.createdDate)}
									</p>
								</div>
								<p
									className={cn(
										"shrink-0 text-sm font-semibold tabular-nums",
										tx.isCredit ? "text-brand-ink" : "text-destructive",
									)}
								>
									{tx.isCredit ? "+" : "−"}
									{formatAmount(tx.amount)}
								</p>
							</div>
						))
					)
				) : withdrawals.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						No withdrawal requests yet.
					</p>
				) : (
					withdrawals.map((w) => (
						<div
							key={w.id}
							className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0"
						>
							<div className="min-w-0">
								<p className="text-sm font-medium capitalize">
									{w.paymentStatus || "pending"}
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{w.bankName} · {formatDateTime(w.createdDate)}
								</p>
							</div>
							<p className="shrink-0 text-sm font-semibold tabular-nums">
								{formatAmount(w.amount)}
							</p>
						</div>
					))
				)}
			</div>
		</div>
	);
}
