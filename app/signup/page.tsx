"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
	EyeIcon,
	EyeOffIcon,
	Loader2Icon,
	LockIcon,
	MailIcon,
	RefreshCwIcon,
	UserPlusIcon,
} from "lucide-react";

import {
	AuthFieldButton,
	AuthFieldLabel,
	AuthTextField,
} from "@/components/auth/auth-field";
import { AuthRoleTabs } from "@/components/auth/auth-role-tabs";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { type AppMode } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import { normalizeLocalEthiopianPhone } from "@/lib/phone";
import { sanitizeSignupRef } from "@/lib/signup-ref";
import {
	finishSignupLogin,
	signUpProvider,
} from "@/services/auth/signupApi";
import { phoneAlreadyRegistered } from "@/services/auth/authApi";
import { useAuth } from "@/store/useAuth";

function SignupForm() {
	const router = useRouter();
	const search = useSearchParams();
	const { t, te } = useLocale();
	const { setMode, login } = useAuth();
	const initialMode = search.get("mode") === "provider" ? "provider" : "service";
	const signupSource = sanitizeSignupRef(search.get("ref"));
	const [mode, setLocalMode] = useState<AppMode>(initialMode);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [terms, setTerms] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function onPhoneChange(raw: string) {
		const digits = normalizeLocalEthiopianPhone(raw).slice(0, 9);
		setPhone(digits);
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

		const phoneValue = phone.trim();

		if (mode === "service") {
			setBusy(true);
			try {
				const check = await phoneAlreadyRegistered(phoneValue, "service");
				if (check.taken == null) {
					setError(t("commonError"));
					return;
				}
				if (check.taken) {
					setError(t("signupPhoneAlreadyRegistered"));
					return;
				}
			} finally {
				setBusy(false);
			}
			sessionStorage.setItem(
				"zemen_signup_draft",
				JSON.stringify({
					firstName,
					lastName,
					email: email.trim(),
					phone: phoneValue,
					password,
					signupSource,
				}),
			);
			router.push(
				`/verify-phone?mode=service&signup=1&phone=${encodeURIComponent(phoneValue)}`,
			);
			return;
		}

		setBusy(true);
		try {
			const phoneCheck = await phoneAlreadyRegistered(phoneValue, "provider");
			if (phoneCheck.taken == null) {
				setError(t("commonError"));
				return;
			}
			if (phoneCheck.taken) {
				setError(t("signupPhoneAlreadyRegistered"));
				return;
			}
			const result = await signUpProvider({
				firstName,
				lastName,
				email,
				phone: phoneValue,
				password,
				signupSource,
			});
			if (!result.userId) {
				setError(te(result.error));
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
			subtitle={t("signupSubtitle")}
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
			<AuthRoleTabs value={mode} onChange={setLocalMode} />

			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<form
				onSubmit={(e) => void handleSubmit(e)}
				className="mt-5 flex flex-col gap-3.5"
			>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<AuthFieldLabel htmlFor="firstName" className="sr-only">
							{t("firstName")}
						</AuthFieldLabel>
						<AuthTextField
							id="firstName"
							name="given-name"
							autoComplete="given-name"
							required
							placeholder={t("firstName")}
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
						/>
					</div>
					<div>
						<AuthFieldLabel htmlFor="lastName" className="sr-only">
							{t("lastName")}
						</AuthFieldLabel>
						<AuthTextField
							id="lastName"
							name="family-name"
							autoComplete="family-name"
							required
							placeholder={t("lastName")}
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
						/>
					</div>
				</div>

				<div>
					<AuthFieldLabel htmlFor="phone" className="sr-only">
						{t("phone")}
					</AuthFieldLabel>
					<AuthTextField
						id="phone"
						name="tel"
						type="tel"
						inputMode="numeric"
						autoComplete="tel-national"
						required
						placeholder={t("phone")}
						value={phone}
						onChange={(e) => onPhoneChange(e.target.value)}
						start={
							<span className="inline-flex items-center gap-1 text-[13px] font-semibold text-foreground">
								+251
							</span>
						}
					/>
				</div>

				<div>
					<AuthFieldLabel htmlFor="email" className="sr-only">
						{mode === "provider"
							? t("email")
							: `${t("email")} (${t("commonOptional")})`}
					</AuthFieldLabel>
					<AuthTextField
						id="email"
						name="email"
						type="email"
						inputMode="email"
						autoComplete="email"
						required={mode === "provider"}
						placeholder={
							mode === "provider"
								? t("email")
								: `${t("email")} (${t("commonOptional")})`
						}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						start={<MailIcon className="size-4" aria-hidden />}
					/>
				</div>

				<div>
					<AuthFieldLabel htmlFor="password" className="sr-only">
						{t("password")}
					</AuthFieldLabel>
					<AuthTextField
						id="password"
						name="new-password"
						type={showPassword ? "text" : "password"}
						autoComplete="new-password"
						required
						placeholder={t("password")}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						start={<LockIcon className="size-4" aria-hidden />}
						end={
							<AuthFieldButton
								type="button"
								size="icon-sm"
								aria-label={
									showPassword ? t("hidePassword") : t("showPassword")
								}
								aria-pressed={showPassword}
								onClick={() => setShowPassword((v) => !v)}
							>
								{showPassword ? (
									<EyeOffIcon aria-hidden />
								) : (
									<EyeIcon aria-hidden />
								)}
							</AuthFieldButton>
						}
					/>
				</div>

				<div>
					<AuthFieldLabel htmlFor="confirmPassword" className="sr-only">
						{t("confirmPassword")}
					</AuthFieldLabel>
					<AuthTextField
						id="confirmPassword"
						name="confirm-password"
						type={showConfirm ? "text" : "password"}
						autoComplete="new-password"
						required
						placeholder={t("confirmPassword")}
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						start={<RefreshCwIcon className="size-4" aria-hidden />}
						end={
							<AuthFieldButton
								type="button"
								size="icon-sm"
								aria-label={
									showConfirm ? t("hidePassword") : t("showPassword")
								}
								aria-pressed={showConfirm}
								onClick={() => setShowConfirm((v) => !v)}
							>
								{showConfirm ? (
									<EyeOffIcon aria-hidden />
								) : (
									<EyeIcon aria-hidden />
								)}
							</AuthFieldButton>
						}
					/>
				</div>

				<label className="mt-1 flex items-start gap-3 text-[13px] leading-snug text-muted-foreground">
					<input
						type="checkbox"
						checked={terms}
						onChange={(e) => setTerms(e.target.checked)}
						className="mt-0.5 size-5 shrink-0 rounded border-border"
					/>
					<span>
						{t("signupTermsPrefix")}{" "}
						<Link href="/legal/terms" className="text-primary underline">
							{t("legalTermsOfService")}
						</Link>{" "}
						{t("signupTermsAnd")}{" "}
						<Link href="/legal/privacy" className="text-primary underline">
							{t("legalPrivacyPolicy")}
						</Link>
					</span>
				</label>

				<Button
					type="submit"
					disabled={busy}
					className="mt-1 h-12 w-full rounded-xl text-[15px] font-semibold"
				>
					{busy ? (
						<Loader2Icon
							data-icon="inline-start"
							className="animate-spin"
							aria-hidden
						/>
					) : (
						<UserPlusIcon data-icon="inline-start" aria-hidden />
					)}
					{t("createAccount")}
				</Button>
			</form>
		</AuthShell>
	);
}

export default function SignupPage() {
	return (
		<Suspense fallback={<main className="min-h-svh bg-[#0e2604]" />}>
			<SignupForm />
		</Suspense>
	);
}
