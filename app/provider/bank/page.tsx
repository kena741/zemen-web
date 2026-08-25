"use client";

import { useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	deleteBankMethod,
	saveBankMethod,
	setDefaultBankMethod,
} from "@/services/bank/bankApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderBank } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderBank } from "@/store/useProviderCache";

export default function BankDetailsPage() {
	const { user } = useAuth();
	const dispatch = useAppDispatch();
	const authUserId = user?.id ?? "";
	const providerId = user?.provider?.id ?? "";
	const { data: banks, loading, error: loadError, refresh, refreshing } =
		useCachedProviderBank({ authUserId, providerId });
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [holderName, setHolderName] = useState("");
	const [accountNumber, setAccountNumber] = useState("");
	const [bankName, setBankName] = useState("");
	const [swiftCode, setSwiftCode] = useState("");
	const [branchCity, setBranchCity] = useState("");

	async function afterMutate() {
		dispatch(invalidateProviderBank());
		refresh();
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const res = await saveBankMethod({
			authUserId,
			holderName,
			accountNumber,
			bankName,
			swiftCode,
			branchCity,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setShowForm(false);
		setHolderName("");
		setAccountNumber("");
		setBankName("");
		setSwiftCode("");
		setBranchCity("");
		await afterMutate();
	}

	async function makeDefault(id: string) {
		setBusy(true);
		const res = await setDefaultBankMethod({ authUserId, bankId: id });
		setBusy(false);
		if (!res.ok) setError(res.error);
		else await afterMutate();
	}

	async function remove(id: string) {
		if (!window.confirm("Delete this bank account?")) return;
		setBusy(true);
		const res = await deleteBankMethod(id);
		setBusy(false);
		if (!res.ok) setError(res.error);
		else await afterMutate();
	}

	return (
		<div className="mx-auto max-w-3xl">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/provider/profile" label="Profile" />
				<button
					type="button"
					onClick={refresh}
					className="mb-3 text-xs font-medium text-primary"
				>
					{refreshing ? "Refreshing…" : "Refresh"}
				</button>
			</div>
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="admin-eyebrow">Payouts</p>
					<h1 className="admin-page-title mt-1">Bank details</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Accounts used for withdrawals
					</p>
				</div>
				<Button
					size="sm"
					variant={showForm ? "outline" : "default"}
					onClick={() => setShowForm((v) => !v)}
				>
					{showForm ? "Cancel" : "Add bank"}
				</Button>
			</div>

			{error || loadError ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error || loadError}</AlertDescription>
				</Alert>
			) : null}

			{showForm ? (
				<form
					onSubmit={handleSave}
					className="mt-5 space-y-3 rounded-xl border border-border bg-white p-4 shadow-xs"
				>
					<div className="space-y-1.5">
						<Label htmlFor="holder">Account holder</Label>
						<Input
							id="holder"
							required
							value={holderName}
							onChange={(e) => setHolderName(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="bank">Bank name</Label>
						<Input
							id="bank"
							required
							value={bankName}
							onChange={(e) => setBankName(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="account">Account number</Label>
						<Input
							id="account"
							required
							value={accountNumber}
							onChange={(e) => setAccountNumber(e.target.value)}
						/>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="swift">Swift / code</Label>
							<Input
								id="swift"
								value={swiftCode}
								onChange={(e) => setSwiftCode(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="city">Branch city</Label>
							<Input
								id="city"
								value={branchCity}
								onChange={(e) => setBranchCity(e.target.value)}
							/>
						</div>
					</div>
					<Button type="submit" disabled={busy}>
						Save as default
					</Button>
				</form>
			) : null}

			<div className="mt-5 space-y-2">
				{loading ? (
					<AppLoading compact />
				) : banks.length === 0 ? (
					<p className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground shadow-xs">
						No bank accounts saved yet.
					</p>
				) : (
					banks.map((b) => (
						<div
							key={b.id}
							className="rounded-xl border border-border bg-white px-4 py-4 shadow-xs"
						>
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div>
									<p className="text-sm font-semibold">
										{b.bankName || b.methodName || "Bank"}
									</p>
									<p className="mt-0.5 text-sm text-muted-foreground">
										{b.holderName}
									</p>
									<p className="mt-1 font-mono text-sm tabular-nums">
										{b.accountNumber}
									</p>
								</div>
								{b.isDefault ? (
									<span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
										Default
									</span>
								) : null}
							</div>
							<div className="mt-3 flex flex-wrap gap-2">
								{!b.isDefault ? (
									<Button
										size="sm"
										variant="outline"
										disabled={busy}
										onClick={() => void makeDefault(b.id)}
									>
										Set default
									</Button>
								) : null}
								<Button
									size="sm"
									variant="destructive"
									disabled={busy}
									onClick={() => void remove(b.id)}
								>
									Delete
								</Button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
