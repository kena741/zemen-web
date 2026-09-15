"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChapaTopUp } from "@/components/payments/chapa-top-up";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import {
	requestWithdrawal,
	restorePrematureWithdrawalDeducts,
} from "@/services/wallet/walletApi";
import type { WithdrawRequest } from "@/services/wallet/types";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderWallet } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import {
	useCachedProviderBank,
	useCachedProviderWallet,
} from "@/store/useProviderCache";

function isPendingStatus(status: string | null | undefined): boolean {
	const s = (status ?? "pending").trim().toLowerCase();
	return s === "pending" || s === "" || s === "hold";
}

function isRejectedStatus(status: string | null | undefined): boolean {
	const s = (status ?? "").trim().toLowerCase();
	return s === "rejected" || s === "failed" || s === "declined";
}

function isApprovedStatus(status: string | null | undefined): boolean {
	const s = (status ?? "").trim().toLowerCase();
	return s === "approved" || s === "completed" || s === "success";
}

function rejectionReason(w: WithdrawRequest): string | null {
	if (!isRejectedStatus(w.paymentStatus)) return null;
	return w.rejectionReason?.trim() || w.adminNote?.trim() || null;
}

function matchesDateHour(
	iso: string | null | undefined,
	date: string,
	hour: string,
): boolean {
	if (!date && !hour) return true;
	if (!iso) return false;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return false;
	if (date) {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		if (`${y}-${m}-${day}` !== date) return false;
	}
	if (hour !== "") {
		if (d.getHours() !== Number(hour)) return false;
	}
	return true;
}

export default function WalletPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const dispatch = useAppDispatch();
	const authUserId = user?.id ?? "";
	const providerId = user?.provider?.id ?? "";
	const {
		data: wallet,
		loading,
		error: loadError,
		refresh,
	} = useCachedProviderWallet({ authUserId, providerId });
	const { data: banks } = useCachedProviderBank({ authUserId, providerId });
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showWithdraw, setShowWithdraw] = useState(false);
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [tab, setTab] = useState<"tx" | "withdraw">("tx");
	const [withdrawFilter, setWithdrawFilter] = useState<
		"all" | "pending" | "approved" | "rejected"
	>("all");
	const [filterDate, setFilterDate] = useState("");
	const [filterHour, setFilterHour] = useState("");
	const restoredRef = useRef(false);

	useEffect(() => {
		if (!providerId || restoredRef.current) return;
		restoredRef.current = true;
		void restorePrematureWithdrawalDeducts().then((res) => {
			if (res.refunded > 0) {
				dispatch(invalidateProviderWallet());
				refresh();
			}
		});
	}, [providerId, dispatch, refresh]);

	const defaultBank = banks.find((b) => b.isDefault) ?? banks[0] ?? null;

	const pendingTotal = useMemo(
		() =>
			wallet.withdrawals
				.filter((w) => isPendingStatus(w.paymentStatus))
				.reduce((sum, w) => sum + (Number(w.amount ?? 0) || 0), 0),
		[wallet.withdrawals],
	);
	const availableBalance =
		Math.round((wallet.balance - pendingTotal) * 100) / 100;

	const filteredWithdrawals = wallet.withdrawals.filter((w) => {
		if (withdrawFilter === "approved" && !isApprovedStatus(w.paymentStatus))
			return false;
		if (withdrawFilter === "rejected" && !isRejectedStatus(w.paymentStatus))
			return false;
		if (withdrawFilter === "pending" && !isPendingStatus(w.paymentStatus))
			return false;
		return matchesDateHour(w.createdDate, filterDate, filterHour);
	});

	const filteredTransactions = wallet.transactions.filter((tx) =>
		matchesDateHour(tx.createdDate, filterDate, filterHour),
	);

	const hasDateFilter = Boolean(filterDate || filterHour);

	function withdrawStatusLabel(status: string | null) {
		if (isApprovedStatus(status)) return t("statusApproved");
		if (isRejectedStatus(status)) return t("statusRejected");
		return t("statusPending");
	}

	function withdrawStatusClass(status: string | null) {
		if (isRejectedStatus(status)) return "bg-destructive/15 text-destructive";
		if (isApprovedStatus(status)) return "bg-primary/10 text-primary";
		return "bg-amber-100 text-amber-900";
	}

	async function submitWithdraw(e: React.FormEvent) {
		e.preventDefault();
		if (!defaultBank) {
			setError(t("providerWalletAddBankFirst"));
			return;
		}
		const value = Number(amount);
		if (!value || value <= 0) {
			setError(t("providerWalletValidAmount"));
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
			bankName: defaultBank.bankName ?? defaultBank.methodName ?? t("navBank"),
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
		dispatch(invalidateProviderWallet());
		refresh();
	}

	return (
		<div className="mx-auto max-w-3xl">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<p className="admin-eyebrow">{t("commonPayments")}</p>
			<h1 className="admin-page-title mt-1">{t("walletTitle")}</h1>

			<div className="admin-brand-band mt-6 px-5 py-6">
				<p className="admin-brand-band-label">{t("walletBalance")}</p>
				<p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{loading ? "…" : formatAmount(String(wallet.balance))}
				</p>
				{pendingTotal > 0 ? (
					<p className="mt-1 text-sm text-primary-foreground/85">
						{t("providerWalletAvailable")}: {formatAmount(String(availableBalance))}
						{" · "}
						{t("providerWalletPendingHold")}: {formatAmount(String(pendingTotal))}
					</p>
				) : null}
				<div className="mt-4">
					<ChapaTopUp
						email={user?.email}
						firstName={user?.provider?.firstName ?? user?.name}
						lastName={user?.provider?.lastName ?? ""}
						phone={user?.provider?.phoneNumber}
						userId={user?.provider?.id ?? user?.id ?? ""}
						accountType="provider"
						returnPath="/pay/done?purpose=wallet"
					/>
				</div>
				<div className="mt-4 flex flex-wrap gap-2">
					<Button
						size="sm"
						variant="secondary"
						className="bg-white/15 text-primary-foreground hover:bg-white/25"
						onClick={() => setShowWithdraw((v) => !v)}
					>
						{showWithdraw ? t("commonCancel") : t("requestWithdrawal")}
					</Button>
					<Link
						href="/provider/bank"
						className={cn(
							buttonVariants({ size: "sm", variant: "secondary" }),
							"bg-white/15 text-primary-foreground hover:bg-white/25",
						)}
					>
						{t("bankTitle")}
					</Link>
				</div>
			</div>

			{error || loadError ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error || loadError}</AlertDescription>
				</Alert>
			) : null}

			{showWithdraw ? (
				<form
					onSubmit={(e) => void submitWithdraw(e)}
					className="mt-4 space-y-3 rounded-xl border border-border bg-white p-4 shadow-xs"
				>
					{defaultBank ? (
						<p className="text-sm text-muted-foreground">
							{t("providerWalletPayoutTo", {
								bank: defaultBank.bankName ?? "",
								account: defaultBank.accountNumber ?? "",
							})}
						</p>
					) : (
						<p className="text-sm text-destructive">
							{t("providerWalletNoBank")}{" "}
							<Link href="/provider/bank" className="underline">
								{t("providerWalletAddOne")}
							</Link>
						</p>
					)}
					<p className="text-xs text-muted-foreground">
						{t("providerWalletAvailable")}: {formatAmount(String(availableBalance))}
					</p>
					<div className="space-y-1.5">
						<Label htmlFor="amount">{t("commonAmountEtb")}</Label>
						<Input
							id="amount"
							type="number"
							min={1}
							step="0.01"
							max={Math.max(0, availableBalance)}
							required
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="note">{t("commonNoteOptional")}</Label>
						<Input
							id="note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
						/>
					</div>
					<Button type="submit" disabled={busy || !defaultBank}>
						{t("providerWalletSubmitRequest")}
					</Button>
				</form>
			) : null}

			<div className="mt-6 flex gap-1.5">
				<Button
					size="sm"
					variant={tab === "tx" ? "default" : "outline"}
					onClick={() => setTab("tx")}
				>
					{t("providerWalletTransactions")}
				</Button>
				<Button
					size="sm"
					variant={tab === "withdraw" ? "default" : "outline"}
					onClick={() => setTab("withdraw")}
				>
					{t("providerWalletWithdrawals")}
				</Button>
			</div>

			<div className="mt-3 flex flex-wrap items-end gap-2">
				<div className="space-y-1">
					<Label htmlFor="filter-date" className="text-xs">
						{t("providerFilterByDate")}
					</Label>
					<Input
						id="filter-date"
						type="date"
						value={filterDate}
						onChange={(e) => setFilterDate(e.target.value)}
						className="h-9 w-auto bg-white"
					/>
				</div>
				<div className="space-y-1">
					<Label htmlFor="filter-hour" className="text-xs">
						{t("providerFilterByHour")}
					</Label>
					<select
						id="filter-hour"
						value={filterHour}
						onChange={(e) => setFilterHour(e.target.value)}
						className="flex h-9 rounded-md border border-input bg-white px-2 text-sm"
					>
						<option value="">{t("commonAll")}</option>
						{Array.from({ length: 24 }, (_, h) => (
							<option key={h} value={String(h)}>
								{String(h).padStart(2, "0")}:00
							</option>
						))}
					</select>
				</div>
				{hasDateFilter ? (
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => {
							setFilterDate("");
							setFilterHour("");
						}}
					>
						{t("commonClear")}
					</Button>
				) : null}
			</div>

			{tab === "withdraw" ? (
				<div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-none">
					{(
						[
							["all", t("commonAll")],
							["pending", t("statusPending")],
							["approved", t("statusApproved")],
							["rejected", t("statusRejected")],
						] as const
					).map(([id, label]) => (
						<Button
							key={id}
							size="sm"
							variant={withdrawFilter === id ? "default" : "outline"}
							className="shrink-0"
							onClick={() => setWithdrawFilter(id)}
						>
							{label}
						</Button>
					))}
				</div>
			) : null}

			<div className="mt-3 rounded-xl border border-border bg-white px-4 shadow-xs">
				{loading ? (
					<AppLoading compact />
				) : tab === "tx" ? (
					filteredTransactions.length === 0 ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							{t("providerWalletNoTransactions")}
						</p>
					) : (
						filteredTransactions.map((tx) => (
							<div
								key={tx.id}
								className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0"
							>
								<div className="min-w-0">
									<p className="text-sm font-medium">
										{tx.note || tx.paymentType || t("providerWalletTransaction")}
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
				) : filteredWithdrawals.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						{t("providerWalletNoWithdrawals")}
					</p>
				) : (
					filteredWithdrawals.map((w) => {
						const reason = rejectionReason(w);
						return (
							<div
								key={w.id}
								className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0"
							>
								<div className="min-w-0">
									<span
										className={cn(
											"inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
											withdrawStatusClass(w.paymentStatus),
										)}
									>
										{withdrawStatusLabel(w.paymentStatus)}
									</span>
									<p className="mt-1 text-xs text-muted-foreground">
										{w.bankName} · {formatDateTime(w.createdDate)}
									</p>
									{reason ? (
										<p className="mt-1.5 text-xs leading-snug text-destructive">
											<span className="font-semibold">
												{t("providerWalletRejectionReason")}:
											</span>{" "}
											{reason}
										</p>
									) : null}
								</div>
								<p className="shrink-0 text-sm font-semibold tabular-nums">
									{formatAmount(w.amount)}
								</p>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
