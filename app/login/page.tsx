"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
	EyeIcon,
	EyeOffIcon,
	Loader2Icon,
	LockIcon,
	UserIcon,
} from "lucide-react";

import { TelegramLink } from "@/components/app/telegram-link";
import { WhatsAppLink } from "@/components/app/whatsapp-link";
import {
	AuthFieldButton,
	AuthFieldLabel,
	AuthTextField,
} from "@/components/auth/auth-field";
import { AuthRoleTabs } from "@/components/auth/auth-role-tabs";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BRAND_NAME, homePathForMode, type AppMode } from "@/lib/brand";
import { clearGuestBrowse, enableGuestBrowse } from "@/lib/guest";
import { useLocale } from "@/lib/i18n";
import {
	isAuthEmailConfirmError,
	isAuthSwitchCustomerError,
	isAuthSwitchProviderError,
} from "@/lib/auth/errors";
import { looksLikePhoneIdentifier } from "@/lib/phone";
import { useAuth } from "@/store/useAuth";

const REMEMBER_KEY = "zemen_remember_login";

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t, te } = useLocale();
	const {
		login,
		loginPending,
		error: authError,
		user,
		mode,
		setMode,
	} = useAuth();
	const [emailOrPhone, setEmailOrPhone] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [error, setError] = useState("");

	const rawError = error || authError || "";
	const uiError = rawError ? te(rawError) : "";
	const nextPath = searchParams.get("next");

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(REMEMBER_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as {
				emailOrPhone?: string;
				password?: string;
			};
			if (parsed.emailOrPhone) {
				setEmailOrPhone(parsed.emailOrPhone);
				setRememberMe(true);
			}
			// ponytail: drop legacy password storage; identifier only
			if (parsed.password) {
				window.localStorage.setItem(
					REMEMBER_KEY,
					JSON.stringify({ emailOrPhone: parsed.emailOrPhone ?? "" }),
				);
			}
		} catch {
			/* ignore */
		}
	}, []);

	useEffect(() => {
		if (!user) return;
		clearGuestBrowse();
		const dest =
			nextPath && nextPath.startsWith("/")
				? nextPath
				: homePathForMode(user.mode);
		router.replace(dest);
	}, [user, router, nextPath]);

	function modeLabel(option: AppMode) {
		return option === "provider" ? t("provider") : t("customer");
	}

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		setError("");

		const success = await login(emailOrPhone, password, mode);
		if (!success) return;

		try {
			if (rememberMe) {
				window.localStorage.setItem(
					REMEMBER_KEY,
					JSON.stringify({ emailOrPhone }),
				);
			} else {
				window.localStorage.removeItem(REMEMBER_KEY);
			}
		} catch {
			/* ignore */
		}
		clearGuestBrowse();
		const dest =
			nextPath && nextPath.startsWith("/") && mode === "service"
				? nextPath
				: homePathForMode(mode);
		router.push(dest);
	}

	function selectMode(next: AppMode) {
		setMode(next);
		setError("");
	}

	function continueAsGuest() {
		enableGuestBrowse();
		setMode("service");
		router.push("/service");
	}

	const identifierLooksPhone = looksLikePhoneIdentifier(emailOrPhone);

	return (
		<AuthShell
			title={t("signInToAccount")}
			subtitle={t("signInSubtitle")}
			belowCard={
				<footer className="flex flex-col items-center gap-3 text-[12px]">
					<div className="flex flex-wrap items-center justify-center gap-2">
						<WhatsAppLink className="border-border bg-white text-[#0f1a0c] shadow-sm hover:bg-muted" />
						<TelegramLink className="border-border bg-white text-[#0f1a0c] shadow-sm hover:bg-muted" />
					</div>
					<p className="text-muted-foreground">
						© {new Date().getFullYear()} {BRAND_NAME}
					</p>
				</footer>
			}
		>
			<AuthRoleTabs
				value={mode}
				onChange={selectMode}
				ariaLabel={t("signInAsRole")}
			/>

			{uiError ? (
				<Alert variant="destructive" className="mt-4" aria-live="polite">
					<AlertTitle>{t("signInFailed")}</AlertTitle>
					<AlertDescription>
						<div className="flex flex-col gap-2">
							<div>{uiError}</div>
								{isAuthSwitchCustomerError(rawError) ? (
									<button
										type="button"
										className="text-left text-sm font-medium underline underline-offset-2"
										onClick={() => selectMode("service")}
									>
										{t("switchToCustomer")}
									</button>
								) : null}
								{isAuthSwitchProviderError(rawError) ? (
									<button
										type="button"
										className="text-left text-sm font-medium underline underline-offset-2"
										onClick={() => selectMode("provider")}
									>
										{t("switchToProvider")}
									</button>
								) : null}
								{isAuthEmailConfirmError(rawError) ? (
									<p className="text-sm">{t("signInConfirmEmailHint")}</p>
								) : null}
						</div>
					</AlertDescription>
				</Alert>
			) : null}

			<form
				onSubmit={(e) => void handleLogin(e)}
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
						inputMode={identifierLooksPhone ? "tel" : "email"}
						autoComplete="username"
						spellCheck={false}
						required
						placeholder={t("emailOrPhone")}
						value={emailOrPhone}
						onChange={(e) => setEmailOrPhone(e.target.value)}
						start={<UserIcon className="size-4" aria-hidden />}
					/>
				</div>

				<div>
					<AuthFieldLabel htmlFor="password" className="sr-only">
						{t("password")}
					</AuthFieldLabel>
					<AuthTextField
						id="password"
						name="password"
						type={showPassword ? "text" : "password"}
						autoComplete="current-password"
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

				<div className="flex items-center justify-between gap-3">
					<label className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
						<input
							type="checkbox"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							className="size-5 rounded border-border"
						/>
						{t("rememberMe")}
					</label>
					<Link
						href="/forgot-password"
						className="text-[13px] font-medium text-primary hover:underline"
					>
						{t("forgotPassword")}
					</Link>
				</div>

				<Button
					type="submit"
					className="mt-1 h-12 w-full rounded-xl text-[15px] font-semibold"
					disabled={loginPending}
				>
					{loginPending ? (
						<Loader2Icon
							data-icon="inline-start"
							className="animate-spin"
							aria-hidden
						/>
					) : null}
					{loginPending
						? t("signingIn")
						: t("signInAs", { mode: modeLabel(mode) })}
				</Button>

				<div className="flex flex-col items-center gap-2 pt-1 text-sm">
					<p className="text-muted-foreground">
						{t("needAccount")}{" "}
						<Link
							href="/signup"
							className="font-semibold text-primary underline-offset-2 hover:underline"
						>
							{t("createAnAccount")}
						</Link>
					</p>
					{mode === "service" ? (
						<button
							type="button"
							onClick={continueAsGuest}
							className="font-medium text-primary hover:underline"
						>
							{t("loginAsGuest")}
						</button>
					) : null}
				</div>
			</form>
		</AuthShell>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={<main className="min-h-svh bg-[#0e2604]" />}>
			<LoginForm />
		</Suspense>
	);
}
