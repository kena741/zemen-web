"use client";

import { useRouter } from "next/navigation";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceForm } from "@/components/provider/service-form";
import { AppLoading } from "@/components/ui/app-loading";
import { useLocale } from "@/lib/i18n";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderServices } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";

export default function NewServicePage() {
	const { t } = useLocale();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const authUserId = user?.id ?? "";

	if (!providerId || !authUserId) {
		return <AppLoading />;
	}

	return (
		<div className="mx-auto max-w-2xl">
			<ProfileBackLink href="/provider/services" label={t("providerServicesTitle")} />
			<p className="admin-eyebrow">{t("providerServicesTitle")}</p>
			<h1 className="admin-page-title mt-1">{t("providerAddService")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("providerServiceCreateSubtitle")}
			</p>
			<div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
				<ServiceForm
					mode="create"
					providerId={providerId}
					authUserId={authUserId}
					onSuccess={(id) => {
						dispatch(invalidateProviderServices());
						router.replace(`/provider/services/${id}`);
					}}
				/>
			</div>
		</div>
	);
}
