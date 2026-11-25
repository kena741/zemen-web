"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { changeAccountPassword } from "@/services/auth/changePasswordApi";
import { useAuth } from "@/store/useAuth";

export default function ChangePasswordPage() {
	const { t, te } = useLocale();
	const router = useRouter();
	const { user } = useAuth();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSuccess(false);

		if (newPassword.length < 6) {
			setError(t("providerPasswordMinLength"));
			return;
		}
		if (newPassword !== confirmPassword) {
			setError(t("providerPasswordMismatch"));
			return;
		}
		if (newPassword === currentPassword) {
			setError(t("providerPasswordMustDiffer"));
			return;
		}

		const email = user?.email ?? user?.provider?.email;
		if (!email) {
			setError(t("providerPasswordNoEmail"));
			return;
		}

		setBusy(true);
		const result = await changeAccountPassword({
			email,
			oldPassword: currentPassword,
			newPassword,
			profile: user?.provider?.id
				? { table: "provider", id: user.provider.id }
				: undefined,
		});
		setBusy(false);
		if (result.error) {
			setError(
				result.error === "authErrorCredentials"
					? t("providerPasswordIncorrect")
					: te(result.error),
			);
			return;
		}

		setSuccess(true);
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		window.setTimeout(() => router.push("/provider/profile"), 1200);
	}

	return (
		<div className="mx-auto max-w-md">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<p className="admin-eyebrow">{t("commonSecurity")}</p>
			<h1 className="admin-page-title mt-1">{t("profileChangePassword")}</h1>

			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}
			{success ? (
				<Alert className="mt-4">
					<AlertDescription>{t("providerPasswordUpdated")}</AlertDescription>
				</Alert>
			) : null}

			<form onSubmit={handleSubmit} className="mt-6 space-y-3">
				<div className="space-y-1.5">
					<Label htmlFor="current">{t("providerCurrentPassword")}</Label>
					<Input
						id="current"
						type="password"
						required
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="next">{t("newPassword")}</Label>
					<Input
						id="next"
						type="password"
						required
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="confirm">{t("providerConfirmNewPassword")}</Label>
					<Input
						id="confirm"
						type="password"
						required
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
				</div>
				<Button type="submit" disabled={busy} className="w-full">
					{busy ? t("commonUpdating") : t("providerUpdatePassword")}
				</Button>
			</form>
		</div>
	);
}
