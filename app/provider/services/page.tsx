"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceCard } from "@/components/provider/service-card";
import { AppLoading } from "@/components/ui/app-loading";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/store/useAuth";
import { useCachedProviderServices } from "@/store/useProviderCache";

type ServiceFilter = "active" | "inactive" | "archived";

export default function ProviderServicesPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const { data: services, loading, error } =
		useCachedProviderServices(providerId);
	const [filter, setFilter] = useState<ServiceFilter>("active");
	const [query, setQuery] = useState("");
	const [tierMax, setTierMax] = useState(
		() => Number(user?.provider?.serviceTierMax ?? 0) || 0,
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
	const limit = serviceCreateLimit(tierMax);
	// Free categories are always postable; paid slots may be full.
	const canAddPaid = canCreateService(tierMax, planUsage);
	const onFree = isOnFreeServicePlan(tierMax);

	const visible = services
		.filter((s) => {
			if (filter === "active") return s.status && !s.archived;
			if (filter === "inactive") return !s.status && !s.archived;
			return s.archived;
		})
		.filter((s) => {
			const q = query.trim().toLowerCase();
			if (!q) return true;
			return (
				s.serviceName?.toLowerCase().includes(q) ||
				s.categoryName?.toLowerCase().includes(q) ||
				s.subCategoryName?.toLowerCase().includes(q)
			);
		});

	const countLabel =
		services.length === 1
			? t("providerServicesCountOne")
			: t("providerServicesCount", { count: services.length });

	const filters: { id: ServiceFilter; label: string }[] = [
		{ id: "active", label: t("providerServiceActive") },
		{ id: "inactive", label: t("providerServiceInactive") },
		{ id: "archived", label: t("providerServiceArchived") },
	];

	const addHref = "/provider/services/new";
	const addLabel = t("providerAddService");

	return (
		<div className="mx-auto w-full max-w-5xl pb-20 lg:pb-0">
			<div className="lg:hidden">
				<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
				<h1 className="text-lg font-normal text-[#464646]">
					{t("providerServicesAll")}
				</h1>
			</div>

			<div className="hidden flex-wrap items-end justify-between gap-3 lg:flex">
				<div className="min-w-0">
					<p className="admin-eyebrow">{t("provider")}</p>
					<h1 className="admin-page-title mt-1">{t("providerServicesTitle")}</h1>
					<p className="mt-1.5 text-sm text-muted-foreground">
						{loading ? t("commonLoading") : countLabel}
					</p>
					{!loading && freeCats ? (
						<p className="mt-1 text-xs text-muted-foreground">
							{onFree
								? t("providerFreeServiceLimit", {
										used: planUsage,
										limit,
									})
								: t("providerPlanUsage", {
										used: planUsage,
										limit: Number.isFinite(limit) ? limit : "∞",
									})}
							{!canAddPaid ? ` · ${t("providerPaidCategoryNeedsUpgrade")}` : ""}
						</p>
					) : null}
				</div>
				<div className="flex gap-2">
					<Link
						href={addHref}
						className={cn(
							buttonVariants({ size: "sm" }),
							"inline-flex items-center gap-1.5",
						)}
					>
						<PlusIcon className="size-3.5" />
						{addLabel}
					</Link>
				</div>
			</div>

			{!loading && freeCats ? (
				<p className="mt-2 text-xs text-muted-foreground lg:hidden">
					{onFree
						? t("providerFreeServiceLimit", {
								used: planUsage,
								limit,
							})
						: t("providerPlanUsage", {
								used: planUsage,
								limit: Number.isFinite(limit) ? limit : "∞",
							})}
				</p>
			) : null}

			<div className="relative mt-3 lg:mt-5">
				<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t("providerSearchServices")}
					className="h-10 rounded-lg border-0 bg-white pl-9 lg:h-11 lg:rounded-xl"
				/>
			</div>

			<div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
				{filters.map((f) => (
					<Button
						key={f.id}
						variant={filter === f.id ? "default" : "outline"}
						size="sm"
						className="shrink-0"
						onClick={() => setFilter(f.id)}
					>
						{f.label}
					</Button>
				))}
			</div>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			{loading ? (
				<AppLoading compact />
			) : visible.length === 0 ? (
				<div className="mt-5 rounded-xl bg-white px-4 py-12 text-center">
					<p className="text-sm text-muted-foreground">
						{t("providerNoServices")}
					</p>
				</div>
			) : (
				<div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
					{visible.map((service) => (
						<ServiceCard
							key={service.id}
							service={service}
							compact
							showActiveToggle
							providerName={user?.name}
							providerImage={user?.provider?.profileImage}
						/>
					))}
				</div>
			)}

			<div
				className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white px-4 py-3 lg:hidden"
				style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
			>
				<Link
					href={addHref}
					className={cn(
						buttonVariants(),
						"flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base",
					)}
				>
					<PlusIcon className="size-4" />
					{addLabel}
				</Link>
			</div>
		</div>
	);
}
