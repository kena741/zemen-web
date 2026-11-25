"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserIcon } from "lucide-react";

import {
	AuthFieldLabel,
	AuthTextField,
} from "@/components/auth/auth-field";
import { AuthRoleTabs } from "@/components/auth/auth-role-tabs";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AppMode } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import {
	looksLikePhoneIdentifier,
	validateEmailOrPhone,
} from "@/lib/phone";
import {
	checkEmailForPasswordReset,
	checkPhoneForPasswordReset,
	requestPasswordResetEmail,
	resetPasswordWithEmailOtp,
} from "@/services/auth/passwordRecoveryApi";

export default function ForgotPasswordPage() {
	const { t, te } = useLocale();
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

	async function handleSendCode(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const validation = validateEmailOrPhone(identifier);
		if (validation) {
			setError(te(validation));
			return;
		}

		const raw = identifier.trim();
		if (looksLikePhoneIdentifier(raw)) {
			setBusy(true);
			const check = await checkPhoneForPasswordReset(raw);
			setBusy(false);
			if (check.error) {
				setError(te(check.error));
				return;
			}
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
			setError(te(check.error));
			return;
		}
		const result = await requestPasswordResetEmail(normalizedEmail);
		setBusy(false);
		if (result.error) {
			setError(te(result.error));
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
			setError(te(result.error));
			return;
		}
		router.replace("/login");
	}

	async function resendEmailCode() {
		setBusy(true);
		setError(null);
		const result = await requestPasswordResetEmail(email);
		setBusy(false);
		if (result.error) setError(te(result.error));
	}

	return (
		<AuthShell
			title={t("forgotPassword")}
			subtitle={t("forgotPasswordSubtitle")}
			footer={
				<>
					{t("alreadyHaveAccount")}{" "}
					<Link
						href="/login"
						className="font-semibold text-primary underline-offset-2 hover:underline"
					>
						{t("signIn")}
					</Link>
				</>
			}
		>
			<AuthRoleTabs value={mode} onChange={setMode} />

			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{otpSent ? (
				<form
					onSubmit={(e) => void handleVerifyEmail(e)}
					className="mt-5 flex flex-col gap-3.5"
				>
					<p className="text-sm text-muted-foreground">{t("resetEmailSent")}</p>
					<div>
						<AuthFieldLabel htmlFor="code">{t("verificationCode")}</AuthFieldLabel>
						<AuthTextField
							id="code"
							required
							inputMode="numeric"
							autoComplete="one-time-code"
							value={code}
							onChange={(e) => setCode(e.target.value)}
						/>
					</div>
					<div>
						<AuthFieldLabel htmlFor="newPassword">
							{t("newPassword")}
						</AuthFieldLabel>
						<AuthTextField
							id="newPassword"
							type="password"
							required
							minLength={6}
							autoComplete="new-password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
					</div>
					<div>
						<AuthFieldLabel htmlFor="confirmPassword">
							{t("confirmPassword")}
						</AuthFieldLabel>
						<AuthTextField
							id="confirmPassword"
							type="password"
							required
							minLength={6}
							autoComplete="new-password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
						/>
					</div>
					<Button
						type="submit"
						disabled={busy}
						className="mt-1 h-12 w-full rounded-xl text-[15px] font-semibold"
					>
						{t("resetPassword")}
					</Button>
					<button
						type="button"
						className="text-sm font-medium text-primary hover:underline"
						disabled={busy}
						onClick={() => void resendEmailCode()}
					>
						{t("sendCode")}
					</button>
				</form>
			) : (
				<form
					onSubmit={(e) => void handleSendCode(e)}
					className="mt-5 flex flex-col gap-3.5"
				>
					<div>
						<AuthFieldLabel htmlFor="emailOrPhone" className="sr-only">
							{t("emailOrPhone")}
						</AuthFieldLabel>
						<AuthTextField
							id="emailOrPhone"
							name="username"
							type="text"
							inputMode="email"
							autoComplete="username"
							spellCheck={false}
							required
							placeholder={t("emailOrPhone")}
							value={identifier}
							onChange={(e) => setIdentifier(e.target.value)}
							start={<UserIcon className="size-4" aria-hidden />}
						/>
					</div>
					<Button
						type="submit"
						disabled={busy}
						className="mt-1 h-12 w-full rounded-xl text-[15px] font-semibold"
					>
						{t("sendCode")}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}
