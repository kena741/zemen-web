"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { HandymanForm } from "@/components/provider/handyman-form";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { useLocale } from "@/lib/i18n";
import { createHandyman } from "@/services/handymen/handymenApi";
import type { HandymanFormValues } from "@/services/handymen/types";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderHandymen } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";

export default function NewHandymanPage() {
	const { t } = useLocale();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(values: HandymanFormValues) {
		setBusy(true);
		setError(null);
		const res = await createHandyman(values);
		setBusy(false);
		if (!res.handyman) {
			setError(res.error);
			return;
		}
		dispatch(invalidateProviderHandymen());
		router.replace(`/provider/handymen/${res.handyman.id}`);
	}

	return (
		<div className="mx-auto max-w-2xl">
			<ProfileBackLink href="/provider/handymen" label={t("handymanList")} />
			<p className="admin-eyebrow">{t("commonTeam")}</p>
			<h1 className="admin-page-title mt-1">{t("handymanAdd")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("providerHandymanCreateSubtitle")}
			</p>
			<div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
				<HandymanForm
					mode="create"
					defaultAddress={user?.provider?.address}
					busy={busy}
					error={error}
					onSubmit={handleSubmit}
				/>
			</div>
		</div>
	);
}
