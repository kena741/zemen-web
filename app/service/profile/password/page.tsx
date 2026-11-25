"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeAccountPassword } from "@/services/auth/changePasswordApi";
import { useAuth } from "@/store/useAuth";

export default function CustomerChangePasswordPage() {
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
			setError("New password must be at least 6 characters.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("New password and confirmation do not match.");
			return;
		}
		if (newPassword === currentPassword) {
			setError("New password must be different from the current one.");
			return;
		}

		const email = user?.email ?? user?.customer?.email;
		if (!email) {
			setError("No email on this account.");
			return;
		}

		setBusy(true);
		const result = await changeAccountPassword({
			email,
			oldPassword: currentPassword,
			newPassword,
			profile: user?.customer?.id
				? { table: "customer", id: user.customer.id }
				: undefined,
		});
		setBusy(false);
		if (result.error) {
			setError(
				result.error === "authErrorCredentials"
					? "Current password is incorrect."
					: result.error,
			);
			return;
		}

		setSuccess(true);
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		window.setTimeout(() => router.push("/service/profile"), 1200);
	}

	return (
		<div className="px-4 pt-4 md:mx-auto md:max-w-md md:px-6 md:pt-8">
			<ProfileBackLink href="/service/profile" label="Profile" />
			<p className="admin-eyebrow">Security</p>
			<h1 className="admin-page-title mt-1">Change password</h1>

			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}
			{success ? (
				<Alert className="mt-4">
					<AlertDescription>Password updated.</AlertDescription>
				</Alert>
			) : null}

			<form onSubmit={handleSubmit} className="mt-6 space-y-3">
				<div className="space-y-1.5">
					<Label htmlFor="current">Current password</Label>
					<Input
						id="current"
						type="password"
						required
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						className="bg-white"
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="next">New password</Label>
					<Input
						id="next"
						type="password"
						required
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						className="bg-white"
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="confirm">Confirm new password</Label>
					<Input
						id="confirm"
						type="password"
						required
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="bg-white"
					/>
				</div>
				<Button type="submit" disabled={busy} className="w-full">
					{busy ? "Updating…" : "Update password"}
				</Button>
			</form>
		</div>
	);
}
