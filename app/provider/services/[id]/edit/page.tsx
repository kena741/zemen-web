"use client";

import { useParams, useRouter } from "next/navigation";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceForm } from "@/components/provider/service-form";
import { AppLoading } from "@/components/ui/app-loading";
import { useLocale } from "@/lib/i18n";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderServices } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderServiceDetail } from "@/store/useProviderCache";

export default function EditServicePage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const authUserId = user?.id ?? "";
	const { service, loading, error: loadError } =
		useCachedProviderServiceDetail(id);
	const ownershipError =
		service?.providerId &&
		providerId &&
		service.providerId !== providerId
			? t("providerServiceNotOwned")
			: null;

	if (!providerId || !authUserId) {
		return <AppLoading />;
	}

	return (
		<div className="mx-auto max-w-2xl pb-8">
			<div className="flex items-center gap-1">
				<ProfileBackLink
					href={id ? `/provider/services/${id}` : "/provider/services"}
					label=""
					className="mb-0 size-10 shrink-0 justify-center px-0"
				/>
				<h1 className="text-[22px] font-semibold tracking-tight text-foreground">
					{t("providerServiceEdit")}
				</h1>
			</div>

			{loading ? (
				<AppLoading compact />
			) : ownershipError || loadError || !service ? (
				<p className="mt-6 text-sm text-destructive">
					{ownershipError || loadError || t("providerServiceNotFound")}
				</p>
			) : (
				<div className="mt-5">
					<ServiceForm
						mode="edit"
						providerId={providerId}
						authUserId={authUserId}
						initial={service}
						onSuccess={(serviceId) => {
							dispatch(invalidateProviderServices());
							router.replace(`/provider/services/${serviceId}`);
						}}
					/>
				</div>
			)}
		</div>
	);
}
