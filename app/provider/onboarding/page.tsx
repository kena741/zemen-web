"use client";

import { useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/store/useAuth";

export default function ProviderOnboardingPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const [companyName, setCompanyName] = useState("");
	const [address, setAddress] = useState(user?.provider?.address ?? "");
	const [busy, setBusy] = useState(false);
	const [saved, setSaved] = useState(false);

	async function save() {
		if (!providerId) return;
		setBusy(true);
		const supabase = getSupabase();
		await supabase.from("company").upsert({
			provider_id: providerId,
			company_name: companyName,
			address,
		});
		await supabase.from("provider").update({ address }).eq("id", providerId);
		setBusy(false);
		setSaved(true);
	}

	return (
		<div className="mx-auto max-w-lg px-4 py-6">
			<ProfileBackLink href="/provider/verify-id" label={t("verifyId")} />
			<h1 className="admin-page-title mt-2">{t("companyDetails")}</h1>
			<div className="mt-6 space-y-4">
				<div>
					<Label>{t("providerCompanyName")}</Label>
					<Input className="mt-2" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
				</div>
				<div>
					<Label>{t("commonAddress")}</Label>
					<Input className="mt-2" value={address} onChange={(e) => setAddress(e.target.value)} />
				</div>
				<Button type="button" disabled={busy} onClick={() => void save()}>
					{t("commonSave")}
				</Button>
				{saved ? (
					<p className="text-sm text-primary">{t("providerOnboardingSaved")}</p>
				) : null}
			</div>
		</div>
	);
}
