"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AppMode } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import { validateLoginPhoneNumber } from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
	checkEmailForPasswordReset,
	requestPasswordResetEmail,
	resetPasswordWithEmailOtp,
} from "@/services/auth/passwordRecoveryApi";

export default function ForgotPasswordPage() {
	const { t } = useLocale();
	const router = useRouter();
	const [mode, setMode] = useState<AppMode>("service");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [usePhone, setUsePhone] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	function modeLabel(option: AppMode) {
		return option === "provider" ? t("provider") : t("customer");
	}

	async function handleSendEmail(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const check = await checkEmailForPasswordReset({ email, mode });
		if (check.error) {
			setBusy(false);
			setError(check.error);
			return;
		}
		const result = await requestPasswordResetEmail(email);
		setBusy(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		setOtpSent(true);
	}

	async function handleVerifyEmail(e: React.FormEvent) {
		e.preventDefault();
		if (newPassword !== confirm) {
			setError(t("passwordMismatch"));
			return;
		}
		setBusy(true);
		setError(null);
		const result = await resetPasswordWithEmailOtp({
			email,
			token: code,
			newPassword,
		});
		setBusy(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		router.replace("/login");
	}

	async function resendEmailCode() {
		setBusy(true);
		setError(null);
		const result = await requestPasswordResetEmail(email);
		setBusy(false);
		if (result.error) setError(result.error);
	}

	function goPhoneReset() {
		setError(null);
		const phoneError = validateLoginPhoneNumber(phone);
		if (phoneError) {
			setError(phoneError);
			return;
		}
		router.push(
			`/verify-phone?mode=${mode}&reset=1&phone=${encodeURIComponent(phone.trim())}`,
		);
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
							mode === option
								? "bg-white shadow-sm dark:bg-card"
								: "text-muted-foreground",
						)}
					>
						{modeLabel(option)}
					</button>
				))}
			</div>

			<div className="mt-4 flex gap-2 text-sm">
				<button
					type="button"
					className={!usePhone ? "font-semibold text-primary" : ""}
					onClick={() => {
						setUsePhone(false);
						setOtpSent(false);
						setError(null);
					}}
				>
					{t("email")}
				</button>
				<button
					type="button"
					className={usePhone ? "font-semibold text-primary" : ""}
					onClick={() => {
						setUsePhone(true);
						setOtpSent(false);
						setError(null);
					}}
				>
					{t("phone")}
				</button>
			</div>

			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{usePhone ? (
				<div className="mt-6 flex flex-col gap-4">
					<p className="text-sm text-muted-foreground">{t("resetPhoneHint")}</p>
					<FieldGroup>
						<Field>
							<FieldLabel>{t("phone")}</FieldLabel>
							<Input
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+251…"
								inputMode="tel"
							/>
						</Field>
					</FieldGroup>
					<Button
						type="button"
						className="w-full"
						onClick={() => goPhoneReset()}
					>
						{t("sendCode")}
					</Button>
				</div>
			) : otpSent ? (
				<form
					onSubmit={(e) => void handleVerifyEmail(e)}
					className="mt-6 flex flex-col gap-4"
				>
					<p className="text-sm text-muted-foreground">{t("resetEmailSent")}</p>
					<FieldGroup>
						<Field>
							<FieldLabel>{t("verificationCode")}</FieldLabel>
							<Input
								required
								inputMode="numeric"
								autoComplete="one-time-code"
								value={code}
								onChange={(e) => setCode(e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel>{t("newPassword")}</FieldLabel>
							<Input
								type="password"
								required
								minLength={6}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel>{t("confirmPassword")}</FieldLabel>
							<Input
								type="password"
								required
								minLength={6}
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
							/>
						</Field>
					</FieldGroup>
					<Button type="submit" disabled={busy} className="w-full">
						{t("resetPassword")}
					</Button>
					<button
						type="button"
						className="text-sm text-primary hover:underline"
						disabled={busy}
						onClick={() => void resendEmailCode()}
					>
						{t("sendCode")}
					</button>
				</form>
			) : (
				<form
					onSubmit={(e) => void handleSendEmail(e)}
					className="mt-6 flex flex-col gap-4"
				>
					<FieldGroup>
						<Field>
							<FieldLabel>{t("email")}</FieldLabel>
							<Input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</Field>
					</FieldGroup>
					<Button type="submit" disabled={busy} className="w-full">
						{t("sendCode")}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}
