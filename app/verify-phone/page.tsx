"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

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

interface SignupDraft {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	password: string;
}

function readSignupDraft(phoneFromQuery: string): SignupDraft | null {
	try {
		const raw = sessionStorage.getItem("zemen_signup_draft");
		if (!raw) return null;
		const draft = JSON.parse(raw) as SignupDraft;
		if (!draft.phone || !draft.password) return null;
		if (phoneFromQuery && draft.phone !== phoneFromQuery) return null;
		return draft;
	} catch {
		return null;
	}
}

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
	const autoSendStarted = useRef(false);

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

	useEffect(() => {
		if ((!isSignup && !isReset) || !phone || autoSendStarted.current) return;
		autoSendStarted.current = true;
		void (async () => {
			setBusy(true);
			setError(null);
			const result = await sendPhoneOtp(phone);
			setBusy(false);
			if (!result.success) {
				// Keep autoSendStarted true — never loop on failure; user can tap Send.
				setError(result.error ?? t("commonError"));
				return;
			}
			setVerificationId(result.verificationId ?? null);
		})();
	}, [isSignup, isReset, phone, t]);

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
			const draft = readSignupDraft(phone);
			const signupFirst = draft?.firstName || firstName;
			const signupLast = draft?.lastName || lastName;
			const signupPassword = draft?.password || password;
			const signupEmail = draft?.email?.trim() || "";
			if (!signupFirst || !signupLast || !signupPassword) {
				setBusy(false);
				setError(t("commonError"));
				return;
			}
			const signup = await signUpCustomer({
				firstName: signupFirst,
				lastName: signupLast,
				email: signupEmail || undefined,
				phone,
				password: signupPassword,
				phoneVerified: true,
			});
			if (!signup.userId) {
				setBusy(false);
				setError(signup.error);
				return;
			}
			const email = signupEmail || syntheticEmailFromPhone(phone);
			if (!email) {
				setBusy(false);
				setError(t("invalidPhone"));
				return;
			}
			sessionStorage.removeItem("zemen_signup_draft");
			await finishSignupLogin(email, signupPassword, "service");
			const ok = await login(email, signupPassword, "service");
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
