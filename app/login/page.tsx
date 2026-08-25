"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";

import appIcon from "@/assets/images/app_icon.png";
import { LoginMeshBackground } from "@/components/login/login-mesh-bg";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	APP_MODE_LABEL,
	BRAND_NAME,
	homePathForMode,
	type AppMode,
} from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";

export default function LoginPage() {
	const router = useRouter();
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
	const [error, setError] = useState("");

	const uiError = error || authError || "";

	useEffect(() => {
		if (user) router.replace(homePathForMode(user.mode));
	}, [user, router]);

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		setError("");

		const success = await login(emailOrPhone, password, mode);
		if (success) {
			router.push(homePathForMode(mode));
			return;
		}
	}

	function selectMode(next: AppMode) {
		setMode(next);
		setError("");
	}

	return (
		<main className="relative flex min-h-svh flex-col overflow-hidden bg-[#f6f6f6] pb-[env(safe-area-inset-bottom)]">
			<LoginMeshBackground />

			<header className="relative z-10 flex items-center gap-2.5 px-6 py-5 sm:px-8">
				<Image
					src={appIcon}
					alt=""
					priority
					width={28}
					height={28}
					className="size-7 rounded-md"
				/>
				<span className="text-[15px] font-semibold tracking-tight text-foreground">
					{BRAND_NAME}
				</span>
			</header>

			<div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
				<div className="w-full max-w-[25rem] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_15px_35px_rgba(23,23,23,0.08),0_5px_15px_rgba(0,0,0,0.04)] sm:rounded-xl">
					<div className="px-5 py-7 sm:px-8 sm:py-8">
						<h1 className="text-center text-[20px] font-semibold tracking-tight text-foreground sm:text-[22px]">
							Sign in to your account
						</h1>

						<div
							className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
							role="tablist"
							aria-label="Sign in as"
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
												? "bg-white text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground",
										)}
									>
										{APP_MODE_LABEL[option]}
									</button>
								);
							})}
						</div>
						<p className="mt-2 text-center text-[12px] text-muted-foreground">
							{mode === "provider"
								? "Continue as a service provider partner."
								: "Continue as a customer (Zemen Service)."}
						</p>

						{uiError ? (
							<Alert
								variant="destructive"
								className="mt-6"
								aria-live="polite"
							>
								<AlertTitle>Sign in failed</AlertTitle>
								<AlertDescription>
									<div className="flex flex-col gap-2">
										<div>{uiError}</div>
										{uiError.toLowerCase().includes("switch to customer") ? (
											<button
												type="button"
												className="text-left text-sm font-medium underline underline-offset-2"
												onClick={() => selectMode("service")}
											>
												Switch to Customer
											</button>
										) : null}
										{uiError.toLowerCase().includes("confirm") ||
										uiError.toLowerCase().includes("verify your email") ? (
											<p className="text-sm">
												Check your email inbox (and spam folder) for the
												confirmation link.
											</p>
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
										className="text-[13px] font-medium text-muted-foreground"
									>
										Email or phone
									</FieldLabel>
									<InputGroup className="rounded-md border-[#d7e3d2] shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-[#d7e3d2] has-[[data-slot=input-group-control]:focus-visible]:ring-0">
										<InputGroupInput
											id="emailOrPhone"
											name="username"
											type="text"
											inputMode="email"
											autoComplete="username"
											spellCheck={false}
											required
											placeholder="name@company.com or +251…"
											value={emailOrPhone}
											onChange={(e) => setEmailOrPhone(e.target.value)}
											className="h-10 bg-white shadow-none focus-visible:ring-0"
										/>
									</InputGroup>
								</Field>

								<Field>
									<FieldLabel
										htmlFor="password"
										className="text-[13px] font-medium text-muted-foreground"
									>
										Password
									</FieldLabel>
									<InputGroup className="rounded-md border-[#d7e3d2] shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-[#d7e3d2] has-[[data-slot=input-group-control]:focus-visible]:ring-0">
										<InputGroupInput
											id="password"
											name="password"
											type={showPassword ? "text" : "password"}
											autoComplete="current-password"
											required
											placeholder="Your password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											className="h-10 bg-white shadow-none focus-visible:ring-0"
										/>
										<InputGroupAddon align="inline-end">
											<InputGroupButton
												type="button"
												size="icon-xs"
												aria-label={
													showPassword ? "Hide password" : "Show password"
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
									? "Signing in…"
									: `Sign in as ${APP_MODE_LABEL[mode]}`}
							</Button>
						</form>
					</div>

					<div className="border-t border-border bg-muted/60 px-6 py-4 text-center text-[13px] text-muted-foreground sm:px-8">
						Need access? Contact your administrator.
					</div>
				</div>
			</div>

			<footer className="relative z-10 px-6 py-4 text-[12px] text-muted-foreground sm:px-8">
				© {new Date().getFullYear()} {BRAND_NAME}
			</footer>
		</main>
	);
}
