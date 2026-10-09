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
import {
	looksLikePhoneIdentifier,
	validateEmailOrPhone,
} from "@/lib/phone";
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
	const [identifier, setIdentifier] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	function modeLabel(option: AppMode) {
		return option === "provider" ? t("provider") : t("customer");
	}

	async function handleSendCode(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const validation = validateEmailOrPhone(identifier);
		if (validation) {
			setError(validation);
			return;
		}

		const raw = identifier.trim();
		if (looksLikePhoneIdentifier(raw)) {
			router.push(
				`/verify-phone?mode=${mode}&reset=1&phone=${encodeURIComponent(raw)}`,
			);
			return;
		}

		const normalizedEmail = raw.toLowerCase();
		setBusy(true);
		const check = await checkEmailForPasswordReset({
			email: normalizedEmail,
			mode,
		});
		if (check.error) {
			setBusy(false);
			setError(check.error);
			return;
		}
		const result = await requestPasswordResetEmail(normalizedEmail);
		setBusy(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		setEmail(normalizedEmail);
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
								? "bg-white text-[#0f1a0c] shadow-sm dark:bg-white dark:text-[#0f1a0c]"
								: "text-muted-foreground dark:text-white/70 dark:hover:text-white",
						)}
					>
						{modeLabel(option)}
					</button>
				))}
			</div>

			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{otpSent ? (
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
					onSubmit={(e) => void handleSendCode(e)}
					className="mt-6 flex flex-col gap-4"
				>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="emailOrPhone">
								{t("emailOrPhone")}
							</FieldLabel>
							<Input
								id="emailOrPhone"
								name="username"
								type="text"
								inputMode="email"
								autoComplete="username"
								spellCheck={false}
								required
								placeholder={t("emailOrPhonePlaceholder")}
								value={identifier}
								onChange={(e) => setIdentifier(e.target.value)}
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
