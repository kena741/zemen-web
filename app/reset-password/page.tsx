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
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		void getSupabase().auth.getSession().then(({ data }) => {
			setReady(Boolean(data.session));
		});
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
		router.replace("/login");
	}

	return (
		<AuthShell title={t("resetPassword")}>
			{!ready ? (
				<p className="mt-6 text-sm text-muted-foreground">
					{t("resetOpenLink")}
				</p>
			) : (
				<form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4">
					{error ? (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
					<FieldGroup>
						<Field>
							<FieldLabel>{t("newPassword")}</FieldLabel>
							<Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
						</Field>
						<Field>
							<FieldLabel>{t("confirmPassword")}</FieldLabel>
							<Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
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
