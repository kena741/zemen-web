"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2Icon } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type AppMode } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
	finishSignupLogin,
	signUpProvider,
} from "@/services/auth/signupApi";
import { useAuth } from "@/store/useAuth";

function SignupForm() {
	const router = useRouter();
	const search = useSearchParams();
	const { t } = useLocale();
	const { setMode, login } = useAuth();
	const initialMode = search.get("mode") === "provider" ? "provider" : "service";
	const [mode, setLocalMode] = useState<AppMode>(initialMode);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [terms, setTerms] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function modeLabel(option: AppMode) {
		return option === "provider" ? t("provider") : t("customer");
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!terms) {
			setError(t("signupAcceptTerms"));
			return;
		}
		if (password !== confirm) {
			setError(t("passwordMismatch"));
			return;
		}
		if (password.length < 6) {
			setError(t("passwordMinLength"));
			return;
		}

		if (mode === "service") {
			sessionStorage.setItem(
				"zemen_signup_draft",
				JSON.stringify({
					firstName,
					lastName,
					email: email.trim(),
					phone,
					password,
				}),
			);
			router.push(
				`/verify-phone?mode=service&signup=1&phone=${encodeURIComponent(phone)}`,
			);
			return;
		}

		setBusy(true);
		try {
			const result = await signUpProvider({
				firstName,
				lastName,
				email,
				phone,
				password,
			});
			if (!result.userId) {
				setError(result.error);
				return;
			}
			await finishSignupLogin(email, password, "provider");
			setMode("provider");
			const ok = await login(email, password, "provider");
			if (ok) router.replace("/provider/verify-id?signup=1");
			else router.replace("/login");
		} finally {
			setBusy(false);
		}
	}

	return (
		<AuthShell
			title={t("createAccount")}
			footer={
				<>
					{t("alreadyHaveAccount")}{" "}
					<Link href="/login" className="font-medium text-primary underline-offset-2 hover:underline">
						{t("signIn")}
					</Link>
				</>
			}
		>
			<div
				className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
				role="tablist"
			>
				{(["provider", "service"] as const).map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => setLocalMode(option)}
						className={cn(
							"rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
							mode === option
								? "bg-white text-foreground shadow-sm dark:bg-card"
								: "text-muted-foreground",
						)}
					>
						{modeLabel(option)}
					</button>
				))}
			</div>

			{error ? (
				<Alert variant="destructive" className="mt-6">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4">
				<FieldGroup>
					<Field>
						<FieldLabel>{t("firstName")}</FieldLabel>
						<Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>{t("lastName")}</FieldLabel>
						<Input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>{t("phone")}</FieldLabel>
						<Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251…" />
					</Field>
					{mode === "provider" ? (
						<Field>
							<FieldLabel>{t("email")}</FieldLabel>
							<Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
						</Field>
					) : (
						<Field>
							<FieldLabel>
								{t("email")} ({t("commonOptional")})
							</FieldLabel>
							<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
						</Field>
					)}
					<Field>
						<FieldLabel>{t("password")}</FieldLabel>
						<Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
					</Field>
					<Field>
						<FieldLabel>{t("confirmPassword")}</FieldLabel>
						<Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
					</Field>
				</FieldGroup>
				<label className="flex items-start gap-2 text-sm text-muted-foreground">
					<input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1" />
					<span>
						{t("signupTermsPrefix")}{" "}
						<Link href="/legal/terms" className="text-primary hover:underline">
							{t("legalTermsOfService")}
						</Link>{" "}
						{t("signupTermsAnd")}{" "}
						<Link href="/legal/privacy" className="text-primary hover:underline">
							{t("legalPrivacyPolicy")}
						</Link>
					</span>
				</label>
				<Button type="submit" disabled={busy} className="h-10 w-full">
					{busy ? <Loader2Icon className="animate-spin" /> : null}
					{t("createAccount")}
				</Button>
			</form>
		</AuthShell>
	);
}

export default function SignupPage() {
	return (
		<Suspense>
			<SignupForm />
		</Suspense>
	);
}
