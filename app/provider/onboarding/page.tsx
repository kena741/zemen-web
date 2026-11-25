"use client";

import { useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { saveProviderCompany } from "@/services/provider/companyApi";
import { useAuth } from "@/store/useAuth";

export default function ProviderOnboardingPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const [companyName, setCompanyName] = useState("");
	const [address, setAddress] = useState(user?.provider?.address ?? "");
	const [busy, setBusy] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function save() {
		if (!providerId) return;
		setBusy(true);
		setError(null);
		const res = await saveProviderCompany({
			providerId,
			companyName,
			address,
		});
		setBusy(false);
		if (res.error) {
			setError(res.error);
			return;
		}
		setSaved(true);
	}

	return (
		<div className="mx-auto max-w-lg px-4 py-6">
			<ProfileBackLink href="/provider/verify-id" label={t("verifyId")} />
			<h1 className="admin-page-title mt-2">{t("companyDetails")}</h1>
			{error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
			<div className="mt-6 space-y-4">
				<div>
					<Label>{t("providerCompanyName")}</Label>
					<Input
						className="mt-2"
						value={companyName}
						onChange={(e) => setCompanyName(e.target.value)}
					/>
				</div>
				<div>
					<Label>{t("commonAddress")}</Label>
					<Input
						className="mt-2"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
					/>
				</div>
				<Button type="button" disabled={busy} onClick={() => void save()}>
					{t("commonSave")}
				</Button>
				{saved ? (
					<p className="text-sm text-muted-foreground">
						{t("providerOnboardingSaved")}
					</p>
				) : null}
			</div>
		</div>
	);
}
