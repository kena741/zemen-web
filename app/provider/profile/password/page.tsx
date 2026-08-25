"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/store/useAuth";

export default function ChangePasswordPage() {
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

		const email = user?.email ?? user?.provider?.email;
		if (!email) {
			setError("No email on this account.");
			return;
		}

		setBusy(true);
		const supabase = getSupabase();

		const verify = await supabase.auth.signInWithPassword({
			email,
			password: currentPassword,
		});
		if (verify.error) {
			setBusy(false);
			setError("Current password is incorrect.");
			return;
		}

		const { error: updateError } = await supabase.auth.updateUser({
			password: newPassword,
		});

		if (!updateError && user?.provider?.id) {
			await supabase
				.from("provider")
				.update({ password: newPassword })
				.eq("id", user.provider.id);
		}

		setBusy(false);
		if (updateError) {
			setError(updateError.message);
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
			<ProfileBackLink href="/provider/profile" label="Profile" />
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
					/>
				</div>
				<Button type="submit" disabled={busy} className="w-full">
					{busy ? "Updating…" : "Update password"}
				</Button>
			</form>
		</div>
	);
}
