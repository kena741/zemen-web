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
	countPlanUsageServices,
	fetchFreeServiceCategories,
	fetchProviderTierMax,
	isOnFreeServicePlan,
	serviceCreateLimit,
	type FreeServiceCategories,
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
	const [freeCats, setFreeCats] = useState<FreeServiceCategories | null>(
		null,
	);

	useEffect(() => {
		if (!providerId) return;
		void fetchProviderTierMax(providerId).then(setTierMax);
	}, [providerId]);

	useEffect(() => {
		void fetchFreeServiceCategories().then(setFreeCats);
	}, []);

	const planUsage = useMemo(() => {
		if (!freeCats) return 0;
		return countPlanUsageServices(services, freeCats);
	}, [services, freeCats]);
	const limit = tierMax == null ? null : serviceCreateLimit(tierMax);
	const canAddPaid =
		tierMax != null && canCreateService(tierMax, planUsage);
	const onFree = tierMax != null && isOnFreeServicePlan(tierMax);

	if (
		!providerId ||
		!authUserId ||
		servicesLoading ||
		tierMax == null ||
		!freeCats
	) {
		return <AppLoading />;
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
			<p className="mt-1 text-[13px] text-muted-foreground">
				{t("providerFreeCategoryHint")}
			</p>
			{onFree && !canAddPaid ? (
				<Alert className="mt-3">
					<AlertDescription>
						{t("providerPaidCategoryNeedsUpgrade")}{" "}
						<Link
							href="/provider/tier"
							className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
						>
							{t("providerFreeServiceUpgrade")}
						</Link>
					</AlertDescription>
				</Alert>
			) : onFree ? (
				<p className="mt-1 text-[13px] text-muted-foreground">
					{t("providerFreeServiceLimit", {
						used: planUsage,
						limit: limit ?? 0,
					})}
				</p>
			) : !canAddPaid ? (
				<p className="mt-1 text-[13px] text-muted-foreground">
					{t("providerServiceLimitReached", {
						used: planUsage,
						limit: Number.isFinite(limit ?? 0) ? (limit ?? 0) : "∞",
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
