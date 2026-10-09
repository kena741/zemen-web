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
import { getSupabase } from "@/lib/supabase/client";
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

const selectClassName =
	"h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
	return (
		w.rejectionReason?.trim() ||
		w.adminNote?.trim() ||
		null
	);
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
	const [info, setInfo] = useState<string | null>(null);
	const [showWithdraw, setShowWithdraw] = useState(false);
	const [amount, setAmount] = useState("");
	const [withdrawPassword, setWithdrawPassword] = useState("");
	const [note, setNote] = useState("");
	const [selectedBankId, setSelectedBankId] = useState("");
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

	const defaultBank = useMemo(
		() => banks.find((b) => b.isDefault) ?? banks[0] ?? null,
		[banks],
	);
	const selectedBank = useMemo(
		() => banks.find((b) => b.id === selectedBankId) ?? defaultBank,
		[banks, selectedBankId, defaultBank],
	);

	useEffect(() => {
		if (!selectedBankId && defaultBank) {
			setSelectedBankId(defaultBank.id);
		}
	}, [defaultBank, selectedBankId]);

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
		if (!selectedBank) {
			setError(t("providerWalletAddBankFirst"));
			return;
		}
		const value = Number(amount);
		if (!value || value <= 0) {
			setError(t("providerWalletValidAmount"));
			return;
		}
		const email = user?.email ?? user?.provider?.email;
		if (!email) {
			setError(t("providerPasswordNoEmail"));
			return;
		}
		if (!withdrawPassword.trim()) {
			setError(t("providerPasswordIncorrect"));
			return;
		}
		setBusy(true);
		setError(null);
		setInfo(null);
		const supabase = getSupabase();
		const passwordCheck = await supabase.auth.signInWithPassword({
			email,
			password: withdrawPassword,
		});
		if (passwordCheck.error) {
			setBusy(false);
			setError(t("providerPasswordIncorrect"));
			return;
		}
		const res = await requestWithdrawal({
			providerId,
			amount: value,
			note,
			paymentMethodId: selectedBank.id,
			holderName: selectedBank.holderName ?? "",
			bankName: selectedBank.bankName ?? selectedBank.methodName ?? t("navBank"),
			accountNumber: selectedBank.accountNumber ?? "",
			swiftCode: selectedBank.swiftCode,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setShowWithdraw(false);
		setAmount("");
		setNote("");
		setWithdrawPassword("");
		if (res.updatedPending) {
			setInfo(t("providerWalletPendingUpdated"));
			setTab("withdraw");
			setWithdrawFilter("pending");
		}
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
				<p className="mt-2 text-3xl font-semibold tracking-tight text-primary-foreground tabular-nums">
					{loading ? "…" : formatAmount(String(wallet.balance))}
				</p>
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
						className="border-white/25 bg-white/15 text-white hover:bg-white/25 hover:text-white"
						onClick={() => {
							setShowWithdraw((v) => {
								if (!v) {
									setSelectedBankId(defaultBank?.id ?? "");
									setError(null);
									setInfo(null);
									setWithdrawPassword("");
								}
								return !v;
							});
						}}
					>
						{showWithdraw ? t("commonCancel") : t("requestWithdrawal")}
					</Button>
					<Link
						href="/provider/bank"
						className={cn(
							buttonVariants({ size: "sm", variant: "secondary" }),
							"border-white/25 bg-white/15 text-white hover:bg-white/25 hover:text-white",
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
			{info ? (
				<Alert className="mt-4">
					<AlertDescription>{info}</AlertDescription>
				</Alert>
			) : null}

			{showWithdraw ? (
				<form
					onSubmit={(e) => void submitWithdraw(e)}
					className="mt-4 space-y-3 rounded-xl border border-border bg-white p-4 shadow-xs"
				>
					{banks.length > 0 ? (
						<div className="space-y-1.5">
							<Label htmlFor="payout-bank">{t("providerWalletPayoutBank")}</Label>
							<select
								id="payout-bank"
								required
								value={selectedBank?.id ?? ""}
								onChange={(e) => setSelectedBankId(e.target.value)}
								className={selectClassName}
							>
								{banks.map((b) => (
									<option key={b.id} value={b.id}>
										{(b.bankName || b.methodName || t("navBank")) +
											" · " +
											(b.accountNumber ?? "") +
											(b.isDefault ? ` (${t("commonDefault")})` : "")}
									</option>
								))}
							</select>
						</div>
					) : (
						<p className="text-sm text-destructive">
							{t("providerWalletNoBank")}{" "}
							<Link href="/provider/bank" className="underline">
								{t("providerWalletAddOne")}
							</Link>
						</p>
					)}
					<div className="space-y-1.5">
						<Label htmlFor="amount">{t("commonAmountEtb")}</Label>
						<Input
							id="amount"
							type="number"
							min={1}
							step="0.01"
							max={Math.max(0, wallet.balance)}
							required
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="withdraw-password">{t("providerCurrentPassword")}</Label>
						<Input
							id="withdraw-password"
							type="password"
							required
							value={withdrawPassword}
							onChange={(e) => setWithdrawPassword(e.target.value)}
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
					<Button type="submit" disabled={busy || !selectedBank}>
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
									{isRejectedStatus(w.paymentStatus) ? (
										<p className="mt-1.5 text-xs leading-snug text-destructive">
											<span className="font-semibold">
												{t("providerWalletRejectionReason")}:
											</span>{" "}
											{reason ?? t("providerWalletNoRejectionReason")}
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
