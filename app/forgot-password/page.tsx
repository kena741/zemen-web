"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { homePathForMode, type AppMode } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { requestPasswordResetEmail } from "@/services/auth/passwordRecoveryApi";

export default function ForgotPasswordPage() {
	const { t } = useLocale();
	const [mode, setMode] = useState<AppMode>("service");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [usePhone, setUsePhone] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	function modeLabel(option: AppMode) {
		return option === "provider" ? t("provider") : t("customer");
	}

	async function handleEmail(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const result = await requestPasswordResetEmail(email);
		setBusy(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		setSent(true);
	}

	return (
		<AuthShell
			title={t("forgotPassword")}
			footer={
				<Link href="/login" className="font-medium text-primary hover:underline">
					{t("signIn")}
				</Link>
			}
		>
			<div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
				{(["provider", "service"] as const).map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => setMode(option)}
						className={cn(
							"rounded-md px-3 py-2 text-[13px] font-medium",
							mode === option ? "bg-white shadow-sm dark:bg-card" : "text-muted-foreground",
						)}
					>
						{modeLabel(option)}
					</button>
				))}
			</div>

			<div className="mt-4 flex gap-2 text-sm">
				<button type="button" className={!usePhone ? "font-semibold text-primary" : ""} onClick={() => setUsePhone(false)}>
					{t("email")}
				</button>
				<button type="button" className={usePhone ? "font-semibold text-primary" : ""} onClick={() => setUsePhone(true)}>
					{t("phone")}
				</button>
			</div>

			{sent ? (
				<p className="mt-6 text-sm text-muted-foreground">
					{t("resetEmailSent")}
				</p>
			) : usePhone ? (
				<div className="mt-6">
					<p className="text-sm text-muted-foreground">
						{t("resetPhoneHint")}
					</p>
					<Link
						href={`/verify-phone?mode=${mode}&reset=1&phone=${encodeURIComponent(phone)}`}
						className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
					>
						{t("sendCode")}
					</Link>
					<Input className="mt-3" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251…" />
				</div>
			) : (
				<form onSubmit={(e) => void handleEmail(e)} className="mt-6 flex flex-col gap-4">
					{error ? (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
					<FieldGroup>
						<Field>
							<FieldLabel>{t("email")}</FieldLabel>
							<Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
						</Field>
					</FieldGroup>
					<Button type="submit" disabled={busy} className="w-full">
						{t("resetPassword")}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}
