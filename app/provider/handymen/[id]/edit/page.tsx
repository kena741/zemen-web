"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { HandymanForm } from "@/components/provider/handyman-form";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { AppLoading } from "@/components/ui/app-loading";
import { useLocale } from "@/lib/i18n";
import { updateHandyman } from "@/services/handymen/handymenApi";
import type { HandymanFormValues } from "@/services/handymen/types";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderHandymen } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderHandymanDetail } from "@/store/useProviderCache";

export default function EditHandymanPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const { handyman, loading, error: loadError } =
		useCachedProviderHandymanDetail(id);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const ownershipError =
		handyman?.providerId &&
		user?.provider?.id &&
		handyman.providerId !== user.provider.id
			? t("providerHandymanNotOwned")
			: null;

	async function handleSubmit(values: HandymanFormValues) {
		if (!id) return;
		setBusy(true);
		setError(null);
		const payload: Record<string, unknown> = { ...values };
		if (!values.password.trim()) delete payload.password;
		const res = await updateHandyman(id, payload);
		setBusy(false);
		if (!res.handyman) {
			setError(res.error);
			return;
		}
		dispatch(invalidateProviderHandymen());
		router.replace(`/provider/handymen/${id}`);
	}

	return (
		<div className="mx-auto max-w-2xl">
			<ProfileBackLink
				href={id ? `/provider/handymen/${id}` : "/provider/handymen"}
				label={t("commonBack")}
			/>
			<p className="admin-eyebrow">{t("commonTeam")}</p>
			<h1 className="admin-page-title mt-1">{t("handymanEdit")}</h1>

			{loading ? (
				<AppLoading compact />
			) : ownershipError || loadError || !handyman ? (
				<p className="mt-6 text-sm text-destructive">
					{ownershipError || loadError || error || t("commonNotFound")}
				</p>
			) : (
				<div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
					<HandymanForm
						mode="edit"
						initial={handyman}
						busy={busy}
						error={error}
						onSubmit={handleSubmit}
					/>
				</div>
			)}
		</div>
	);
}
