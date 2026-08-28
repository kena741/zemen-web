"use client";

import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import {
	sendSignupEmailOtp,
	verifySignupEmailOtp,
} from "@/services/auth/verificationApi";

export default function VerifyEmailPage() {
	const { t } = useLocale();
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);
	const [done, setDone] = useState(false);

	async function send() {
		setError(null);
		const result = await sendSignupEmailOtp(email);
		if (result.error) {
			setError(result.error);
			return;
		}
		setSent(true);
	}

	async function verify() {
		setError(null);
		const result = await verifySignupEmailOtp(email, code);
		if (result.error) {
			setError(result.error);
			return;
		}
		setDone(true);
	}

	return (
		<AuthShell title={t("verifyEmail")}>
			{done ? (
				<p className="mt-6 text-sm text-primary">{t("emailVerified")}</p>
			) : (
				<div className="mt-6 flex flex-col gap-4">
					{error ? (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
					<FieldGroup>
						<Field>
							<FieldLabel>{t("email")}</FieldLabel>
							<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
						</Field>
						{sent ? (
							<Field>
								<FieldLabel>{t("verificationCode")}</FieldLabel>
								<Input value={code} onChange={(e) => setCode(e.target.value)} />
							</Field>
						) : null}
					</FieldGroup>
					{sent ? (
						<Button type="button" onClick={() => void verify()}>
							{t("verifyCode")}
						</Button>
					) : (
						<Button type="button" onClick={() => void send()}>
							{t("sendCode")}
						</Button>
					)}
				</div>
			)}
		</AuthShell>
	);
}
