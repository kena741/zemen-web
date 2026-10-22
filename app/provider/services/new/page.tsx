"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceForm } from "@/components/provider/service-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
	canCreateService,
	fetchProviderTierMax,
	isOnFreeServicePlan,
	serviceCreateLimit,
} from "@/services/provider/tiersApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderServices } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderServices } from "@/store/useProviderCache";

export default function NewServicePage() {
	const { t } = useLocale();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const authUserId = user?.id ?? "";
	const { data: services, loading: servicesLoading } =
		useCachedProviderServices(providerId);
	const [tierMax, setTierMax] = useState<number | null>(
		user?.provider?.serviceTierMax ?? null,
	);

	useEffect(() => {
		if (!providerId) return;
		void fetchProviderTierMax(providerId).then(setTierMax);
	}, [providerId]);

	const activeCount = useMemo(
		() => services.filter((s) => !s.archived).length,
		[services],
	);
	const limit = tierMax == null ? null : serviceCreateLimit(tierMax);
	const allowed = tierMax != null && canCreateService(tierMax, activeCount);
	const onFree = tierMax != null && isOnFreeServicePlan(tierMax);

	if (!providerId || !authUserId || servicesLoading || tierMax == null) {
		return <AppLoading />;
	}

	if (!allowed) {
		return (
			<div className="mx-auto max-w-2xl pb-8">
				<ProfileBackLink
					href="/provider/services"
					label={t("providerServicesTitle")}
				/>
				<Alert className="mt-6">
					<AlertDescription>
						{onFree
							? t("providerFreeServiceLimit", {
									used: activeCount,
									limit: limit ?? 0,
								})
							: t("providerServiceLimitReached", {
									used: activeCount,
									limit: Number.isFinite(limit ?? 0) ? (limit ?? 0) : "∞",
								})}
					</AlertDescription>
				</Alert>
				<Link
					href="/provider/tier"
					className={cn(buttonVariants(), "mt-4 inline-flex")}
				>
					{t("providerFreeServiceUpgrade")}
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl pb-8">
			<div className="flex items-center gap-1">
				<ProfileBackLink
					href="/provider/services"
					label=""
					className="mb-0 size-10 shrink-0 justify-center px-0"
				/>
				<h1 className="text-[22px] font-semibold tracking-tight text-foreground">
					{t("providerAddService")}
				</h1>
			</div>
			{onFree ? (
				<p className="mt-1 text-[13px] text-muted-foreground">
					{t("providerFreeServiceLimit", {
						used: activeCount,
						limit: limit ?? 0,
					})}
				</p>
			) : null}
			<div className="mt-5">
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
