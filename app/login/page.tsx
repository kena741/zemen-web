"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { TelegramLink } from "@/components/app/telegram-link";
import { WhatsAppLink } from "@/components/app/whatsapp-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { BRAND_NAME, homePathForMode, type AppMode } from "@/lib/brand";
import { clearGuestBrowse, enableGuestBrowse } from "@/lib/guest";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";

const REMEMBER_KEY = "zemen_remember_login";

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useLocale();
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

	const uiError = error || authError || "";
	const nextPath = searchParams.get("next");

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(REMEMBER_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as {
				emailOrPhone?: string;
				password?: string;
			};
			if (parsed.emailOrPhone) setEmailOrPhone(parsed.emailOrPhone);
			if (parsed.password) {
				setPassword(parsed.password);
				setRememberMe(true);
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
					JSON.stringify({ emailOrPhone, password }),
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

	return (
		<AuthShell
			title={t("signInToAccount")}
			className="max-w-100"
			footer={
				<Link
					href="/signup"
					className="font-medium text-primary hover:underline"
				>
					{t("createAnAccount")}
				</Link>
			}
			belowCard={
				<footer className="flex flex-col items-center gap-3 text-[12px]">
					<div className="flex flex-wrap items-center justify-center gap-2">
						<WhatsAppLink className="border-white/70 bg-white/90 text-[#0f1a0c] shadow-sm hover:bg-white" />
						<TelegramLink className="border-white/70 bg-white/90 text-[#0f1a0c] shadow-sm hover:bg-white" />
					</div>
					<p className="rounded-full bg-black/35 px-3 py-1 text-white/95">
						© {new Date().getFullYear()} {BRAND_NAME}
					</p>
				</footer>
			}
		>
				<div
					className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted/80 p-1 dark:bg-white/10"
					role="tablist"
					aria-label={t("signInAsRole")}
				>
					{(["provider", "service"] as const).map((option) => {
						const selected = mode === option;
						return (
							<button
								key={option}
								type="button"
								role="tab"
								aria-selected={selected}
								onClick={() => selectMode(option)}
								className={cn(
									"rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
									selected
										? "bg-white text-[#0f1a0c] shadow-sm dark:bg-white dark:text-[#0f1a0c]"
										: "text-muted-foreground hover:text-foreground dark:text-[#c5d6bc] dark:hover:text-white",
								)}
							>
								{modeLabel(option)}
							</button>
						);
					})}
				</div>
				<p className="mt-2 min-h-8 text-center text-[12px] text-muted-foreground dark:text-[#c5d6bc]">
					{mode === "provider"
						? t("signInProviderHint")
						: t("signInCustomerHint")}
				</p>

				{uiError ? (
					<Alert variant="destructive" className="mt-6" aria-live="polite">
						<AlertTitle>{t("signInFailed")}</AlertTitle>
						<AlertDescription>
							<div className="flex flex-col gap-2">
								<div>{uiError}</div>
								{uiError.toLowerCase().includes("switch to customer") ? (
									<button
										type="button"
										className="text-left text-sm font-medium underline underline-offset-2"
										onClick={() => selectMode("service")}
									>
										{t("switchToCustomer")}
									</button>
								) : null}
								{uiError.toLowerCase().includes("confirm") ||
								uiError.toLowerCase().includes("verify your email") ? (
									<p className="text-sm">{t("signInConfirmEmailHint")}</p>
								) : null}
							</div>
						</AlertDescription>
					</Alert>
				) : null}

				<form
					onSubmit={(e) => void handleLogin(e)}
					className="mt-7 flex flex-col gap-5"
				>
					<FieldGroup>
						<Field>
							<FieldLabel
								htmlFor="emailOrPhone"
								className="text-[13px] font-medium text-muted-foreground dark:text-[#c5d6bc]"
							>
								{t("emailOrPhone")}
							</FieldLabel>
							<InputGroup className="h-10 rounded-md border-[#d7e3d2] bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-[#d7e3d2] has-[[data-slot=input-group-control]:focus-visible]:ring-0 dark:border-white/25 dark:bg-white/5 dark:has-[[data-slot=input-group-control]:focus-visible]:border-white/40">
								<InputGroupInput
									id="emailOrPhone"
									name="username"
									type="text"
									inputMode="email"
									autoComplete="username"
									spellCheck={false}
									required
									placeholder={t("emailOrPhonePlaceholder")}
									value={emailOrPhone}
									onChange={(e) => setEmailOrPhone(e.target.value)}
									className="h-10 bg-transparent shadow-none focus-visible:ring-0 dark:text-white dark:placeholder:text-white/45"
								/>
							</InputGroup>
						</Field>

						<Field>
							<FieldLabel
								htmlFor="password"
								className="text-[13px] font-medium text-muted-foreground dark:text-[#c5d6bc]"
							>
								{t("password")}
							</FieldLabel>
							<InputGroup className="h-10 rounded-md border-[#d7e3d2] bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-[#d7e3d2] has-[[data-slot=input-group-control]:focus-visible]:ring-0 dark:border-white/25 dark:bg-white/5 dark:has-[[data-slot=input-group-control]:focus-visible]:border-white/40">
								<InputGroupInput
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									required
									placeholder={t("passwordPlaceholder")}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="h-10 bg-transparent shadow-none focus-visible:ring-0 dark:text-white dark:placeholder:text-white/45"
								/>
								<InputGroupAddon align="inline-end">
									<InputGroupButton
										type="button"
										size="icon-xs"
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
									</InputGroupButton>
								</InputGroupAddon>
							</InputGroup>
						</Field>
					</FieldGroup>

					<label className="flex items-center gap-2 text-[13px] text-muted-foreground dark:text-[#c5d6bc]">
						<input
							type="checkbox"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							className="size-4 rounded border-border"
						/>
						{t("rememberMe")}
					</label>

					<Button
						type="submit"
						className="h-10 w-full rounded-md text-[15px] font-medium"
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
					<p className="text-center text-sm text-muted-foreground">
						<Link
							href="/forgot-password"
							className="text-primary hover:underline"
						>
							{t("forgotPassword")}
						</Link>
					</p>
					{/* Reserve height so guest link does not shift layout */}
					<div className="min-h-5 text-center">
						{mode === "service" ? (
							<button
								type="button"
								onClick={continueAsGuest}
								className="text-sm font-medium text-primary hover:underline"
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
