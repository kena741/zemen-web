"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SearchIcon } from "lucide-react";

import { ServiceCard } from "@/components/provider/service-card";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import { useCachedServiceList } from "@/store/useCustomerCache";

function ServicesListInner() {
	const { t } = useLocale();
	const searchParams = useSearchParams();
	const categoryId = searchParams.get("category") ?? undefined;
	const featuredOnly = searchParams.get("featured") === "1";
	const [query, setQuery] = useState("");
	const { data: services, loading, error } =
		useCachedServiceList({ categoryId, featuredOnly });

	const filtered = query.trim()
		? services.filter((s) => {
				const q = query.trim().toLowerCase();
				return (
					s.serviceName?.toLowerCase().includes(q) ||
					s.subCategoryName?.toLowerCase().includes(q)
				);
			})
		: services;

	const title = featuredOnly
		? t("homeFeatured")
		: categoryId
			? t("servicesCategoryTitle")
			: t("servicesAllTitle");

	const countLabel =
		filtered.length === 1
			? t("servicesCountOne")
			: t("servicesCount", { count: filtered.length });

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href="/service" label={t("navHome")} />
			<h1 className="admin-page-title">{title}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{loading ? t("commonLoading") : countLabel}
			</p>

			<div className="relative mt-4">
				<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t("commonSearch")}
					className="h-10 rounded-lg bg-white pl-9"
				/>
			</div>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			{loading ? (
				<ServiceLoading compact />
			) : filtered.length === 0 ? (
				<p className="mt-10 text-center text-sm text-muted-foreground">
					{t("homeNoServices")}
				</p>
			) : (
				<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{filtered.map((s) => (
						<ServiceCard
							key={s.id}
							service={s}
							compact
							href={`/service/services/${s.id}`}
							showFeaturedPending={false}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default function ServicesListPage() {
	return (
		<Suspense fallback={<ServiceLoading />}>
			<ServicesListInner />
		</Suspense>
	);
}
