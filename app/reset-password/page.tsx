"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import { updatePasswordFromRecovery } from "@/services/auth/passwordRecoveryApi";
import { getSupabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
	const router = useRouter();
	const { t } = useLocale();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [ready, setReady] = useState(false);
	const [checking, setChecking] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		const supabase = getSupabase();
		let active = true;

		async function hydrate() {
			const { data } = await supabase.auth.getSession();
			if (!active) return;
			if (data.session) {
				setReady(true);
				setChecking(false);
				return;
			}
			// Hash / PKCE params may land slightly after first paint
			await new Promise((r) => setTimeout(r, 400));
			const again = await supabase.auth.getSession();
			if (!active) return;
			setReady(Boolean(again.data.session));
			setChecking(false);
		}

		void hydrate();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "PASSWORD_RECOVERY" || session) {
				setReady(true);
				setChecking(false);
			}
		});

		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (password !== confirm) {
			setError(t("passwordMismatch"));
			return;
		}
		setBusy(true);
		const result = await updatePasswordFromRecovery(password);
		setBusy(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		await getSupabase().auth.signOut();
		router.replace("/login");
	}

	return (
		<AuthShell title={t("resetPassword")}>
			{checking ? (
				<p className="mt-6 text-sm text-muted-foreground">{t("commonLoading")}</p>
			) : !ready ? (
				<div className="mt-6 space-y-3 text-sm text-muted-foreground">
					<p>{t("resetOpenLink")}</p>
					<p>
						<Link href="/forgot-password" className="text-primary hover:underline">
							{t("forgotPassword")}
						</Link>
					</p>
				</div>
			) : (
				<form
					onSubmit={(e) => void handleSubmit(e)}
					className="mt-6 flex flex-col gap-4"
				>
					{error ? (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
					<FieldGroup>
						<Field>
							<FieldLabel>{t("newPassword")}</FieldLabel>
							<Input
								type="password"
								required
								minLength={6}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
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
				</form>
			)}
			<p className="mt-4 text-center text-sm">
				<Link href="/login" className="text-primary hover:underline">
					{t("signIn")}
				</Link>
			</p>
		</AuthShell>
	);
}
