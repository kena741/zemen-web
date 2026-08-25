"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SearchIcon } from "lucide-react";

import { ServiceCard } from "@/components/provider/service-card";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { Input } from "@/components/ui/input";
import { useCachedServiceList } from "@/store/useCustomerCache";

function ServicesListInner() {
	const searchParams = useSearchParams();
	const categoryId = searchParams.get("category") ?? undefined;
	const featuredOnly = searchParams.get("featured") === "1";
	const [query, setQuery] = useState("");
	const { data: services, loading, error, refresh, refreshing } =
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
		? "Featured"
		: categoryId
			? "Category services"
			: "All services";

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/service" label="Home" />
				<button
					type="button"
					onClick={refresh}
					className="mb-3 text-xs font-medium text-primary"
				>
					{refreshing ? "Refreshing…" : "Refresh"}
				</button>
			</div>
			<h1 className="admin-page-title">{title}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{loading
					? "Loading…"
					: `${filtered.length} service${filtered.length === 1 ? "" : "s"}`}
			</p>

			<div className="relative mt-4">
				<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search…"
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
					No services found.
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
