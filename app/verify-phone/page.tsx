"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { homePathForMode, type AppMode } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import { syntheticEmailFromPhone } from "@/lib/synthetic-email";
import { sendPhoneOtp, verifyPhoneOtp } from "@/services/sms/smsApi";
import {
	finishSignupLogin,
	signUpCustomer,
} from "@/services/auth/signupApi";
import { resetPasswordByPhone } from "@/services/auth/passwordRecoveryApi";
import { useAuth } from "@/store/useAuth";

function VerifyPhoneForm() {
	const search = useSearchParams();
	const router = useRouter();
	const { t } = useLocale();
	const { login } = useAuth();
	const mode = (search.get("mode") === "provider" ? "provider" : "service") as AppMode;
	const isSignup = search.get("signup") === "1";
	const isReset = search.get("reset") === "1";
	const phone = search.get("phone") ?? "";
	const firstName = search.get("firstName") ?? "";
	const lastName = search.get("lastName") ?? "";
	const password = search.get("password") ?? "";

	const [verificationId, setVerificationId] = useState<string | null>(null);
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function sendCode() {
		setBusy(true);
		setError(null);
		const result = await sendPhoneOtp(phone);
		setBusy(false);
		if (!result.success) {
			setError(result.error ?? t("commonError"));
			return;
		}
		setVerificationId(result.verificationId ?? null);
	}

	async function verify() {
		if (!verificationId) return;
		setBusy(true);
		setError(null);
		const verified = await verifyPhoneOtp(phone, code, verificationId);
		if (!verified.success) {
			setBusy(false);
			setError(verified.error ?? t("invalidCode"));
			return;
		}

		if (isReset) {
			const result = await resetPasswordByPhone({
				phone,
				code,
				verificationId,
				newPassword,
				mode,
			});
			setBusy(false);
			if (result.error) {
				setError(result.error);
				return;
			}
			router.replace("/login");
			return;
		}

		if (isSignup) {
			const signup = await signUpCustomer({
				firstName,
				lastName,
				phone,
				password,
				phoneVerified: true,
			});
			if (!signup.userId) {
				setBusy(false);
				setError(signup.error);
				return;
			}
			const email = syntheticEmailFromPhone(phone);
			if (!email) {
				setBusy(false);
				setError(t("invalidPhone"));
				return;
			}
			await finishSignupLogin(email, password, "service");
			const ok = await login(email, password, "service");
			setBusy(false);
			router.replace(ok ? homePathForMode("service") : "/login");
			return;
		}

		setBusy(false);
	}

	return (
		<AuthShell title={t("verifyCode")}>
			{error ? (
				<Alert variant="destructive" className="mt-6">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}
			<div className="mt-6 flex flex-col gap-4">
				<p className="text-sm text-muted-foreground">{phone}</p>
				<Button type="button" onClick={() => void sendCode()} disabled={busy}>
					{t("sendCode")}
				</Button>
				<FieldGroup>
					<Field>
						<FieldLabel>{t("otp")}</FieldLabel>
						<Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" />
					</Field>
					{isReset ? (
						<Field>
							<FieldLabel>{t("newPassword")}</FieldLabel>
							<Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
						</Field>
					) : null}
				</FieldGroup>
				<Button type="button" onClick={() => void verify()} disabled={busy || !verificationId}>
					{t("verifyCode")}
				</Button>
			</div>
		</AuthShell>
	);
}

export default function VerifyPhonePage() {
	return (
		<Suspense>
			<VerifyPhoneForm />
		</Suspense>
	);
}
