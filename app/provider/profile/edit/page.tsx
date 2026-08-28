"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLocale } from "@/lib/i18n";
import { updateProviderProfile } from "@/services/provider/profileApi";
import { patchAuthUser } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { useAuth } from "@/store/useAuth";

export default function EditProviderProfilePage() {
	const { t } = useLocale();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const provider = user?.provider;
	const [firstName, setFirstName] = useState(provider?.firstName ?? "");
	const [lastName, setLastName] = useState(provider?.lastName ?? "");
	const [phoneNumber, setPhoneNumber] = useState(provider?.phoneNumber ?? "");
	const [address, setAddress] = useState(provider?.address ?? "");
	const [file, setFile] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!provider || !user) {
		return <p className="text-sm text-muted-foreground">{t("commonLoading")}</p>;
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!provider || !user) return;
		setBusy(true);
		setError(null);
		const res = await updateProviderProfile({
			providerId: provider.id,
			authUserId: user.id,
			firstName,
			lastName,
			phoneNumber,
			address,
			profileImageFile: file,
		});
		setBusy(false);
		if (!res.provider) {
			setError(res.error);
			return;
		}
		dispatch(
			patchAuthUser({
				name: res.provider.fullName ?? user.name,
				provider: res.provider,
			}),
		);
		router.replace("/provider/profile");
	}

	return (
		<div className="mx-auto max-w-2xl">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<p className="admin-eyebrow">{t("profileAccount")}</p>
			<h1 className="admin-page-title mt-1">{t("profileEdit")}</h1>

			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<form
				onSubmit={onSubmit}
				className="mt-6 space-y-4 rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5"
			>
				<div className="flex items-center gap-3">
					<UserAvatar
						src={
							file
								? URL.createObjectURL(file)
								: provider.profileImage
						}
						name={provider.fullName ?? user.name}
						className="size-16 text-lg"
					/>
					<div className="space-y-1.5">
						<Label htmlFor="photo">{t("providerProfilePhoto")}</Label>
						<Input
							id="photo"
							type="file"
							accept="image/*"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						/>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="first">{t("firstName")}</Label>
						<Input
							id="first"
							required
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="last">{t("lastName")}</Label>
						<Input
							id="last"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="phone">{t("phone")}</Label>
					<Input
						id="phone"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value)}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="address">{t("commonAddress")}</Label>
					<Input
						id="address"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
					/>
				</div>

				<p className="text-xs text-muted-foreground">{t("providerEmailHint")}</p>

				<Button type="submit" disabled={busy}>
					{t("providerSaveChanges")}
				</Button>
			</form>
		</div>
	);
}
