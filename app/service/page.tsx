"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
	BellIcon,
	HeartIcon,
	MapPinIcon,
	MessagesSquareIcon,
	SearchIcon,
} from "lucide-react";

import appIcon from "@/assets/images/app_icon.png";
import { ServiceCard } from "@/components/provider/service-card";
import { BannerCarousel } from "@/components/service/banner-carousel";
import { ServiceLoading } from "@/components/service/service-loading";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { BRAND_NAME } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";
import { useCachedHomeFeed } from "@/store/useCustomerCache";

export default function ServiceHomePage() {
	const { t } = useLocale();
	const router = useRouter();
	const { user } = useAuth();
	const [pending, startTransition] = useTransition();
	const [query, setQuery] = useState("");
	const [sortMode, setSortMode] = useState<"popular" | "nearby">("popular");
	const {
		data,
		loading,
		error,
		refresh,
		refreshing,
	} = useCachedHomeFeed();

	const categories = data.categories;
	const banners = data.banners;
	const featured = data.featured;
	const services = data.services;

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		let list = services;
		if (q) {
			list = services.filter(
				(s) =>
					s.serviceName?.toLowerCase().includes(q) ||
					s.categoryName?.toLowerCase().includes(q) ||
					s.subCategoryName?.toLowerCase().includes(q),
			);
		}
		if (sortMode === "nearby") {
			const withCoords = [...list].sort((a, b) => {
				const da =
					a.latitude != null && a.longitude != null ? 0 : 1;
				const db =
					b.latitude != null && b.longitude != null ? 0 : 1;
				if (da !== db) return da - db;
				return (a.serviceName ?? "").localeCompare(b.serviceName ?? "");
			});
			return withCoords;
		}
		return [...list].sort((a, b) => {
			const ra = Number(a.reviewCount ?? 0) || 0;
			const rb = Number(b.reviewCount ?? 0) || 0;
			return rb - ra;
		});
	}, [services, query, sortMode]);

	const greeting =
		user?.customer?.fullName?.split(" ")[0] || user?.name || t("homeGuest");

	return (
		<div className="min-h-svh md:min-h-0">
			<header className="relative overflow-hidden bg-primary text-primary-foreground md:hidden">
				<div
					className="pointer-events-none absolute inset-0 opacity-30"
					style={{
						background:
							"radial-gradient(ellipse 80% 60% at 20% 0%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(0,0,0,0.15), transparent 50%)",
					}}
				/>
				<div className="relative px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<Image
									src={appIcon}
									alt=""
									width={28}
									height={28}
									className="size-7 rounded-md ring-1 ring-white/20"
								/>
								<p className="text-lg font-semibold tracking-tight">
									{BRAND_NAME}
								</p>
							</div>
							<p className="mt-2 text-sm text-primary-foreground/85">
								{t("welcomeBack", { name: greeting })}
							</p>
							<p className="mt-0.5 flex items-center gap-1 text-xs text-primary-foreground/70">
								<MapPinIcon className="size-3.5 shrink-0" />
								<span className="truncate">{t("homeFindNearby")}</span>
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-1">
							<button
								type="button"
								onClick={refresh}
								disabled={refreshing}
								className="rounded-full px-2 py-2 text-[11px] font-medium text-primary-foreground/80 hover:bg-white/10 disabled:opacity-50"
							>
								{refreshing ? "…" : t("commonRefresh")}
							</button>
							<Link
								href="/service/favorites"
								className="rounded-full p-2 hover:bg-white/10"
								aria-label={t("favoritesTitle")}
							>
								<HeartIcon className="size-5" />
							</Link>
							<Link
								href="/service/inbox"
								className="rounded-full p-2 hover:bg-white/10"
								aria-label={t("inboxTitle")}
							>
								<MessagesSquareIcon className="size-5" />
							</Link>
							<Link
								href="/service/notifications"
								className="rounded-full p-2 hover:bg-white/10"
								aria-label={t("notificationsTitle")}
							>
								<BellIcon className="size-5" />
							</Link>
						</div>
					</div>

					<div className="relative mt-3">
						<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={query}
							onChange={(e) => {
								const v = e.target.value;
								startTransition(() => setQuery(v));
							}}
							placeholder={t("homeSearchServices")}
							className="h-10 rounded-lg border-0 bg-white pl-9 text-[13px] text-foreground shadow-sm placeholder:text-muted-foreground/70"
						/>
					</div>
				</div>
			</header>

			<div className="hidden px-6 pt-8 md:block">
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="admin-eyebrow">{t("customer")}</p>
						<h1 className="admin-page-title mt-1">
							{t("welcomeBack", { name: greeting })}
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("homeSubtitle")}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={refresh}
							className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
						>
							{refreshing ? t("commonRefreshing") : t("commonRefresh")}
						</button>
						<Link
							href="/service/favorites"
							className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
						>
							{t("favoritesTitle")}
						</Link>
						<Link
							href="/service/inbox"
							className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
						>
							{t("inboxTitle")}
						</Link>
						<UserAvatar
							src={user?.customer?.profileImage}
							name={user?.name}
							size="md"
						/>
					</div>
				</div>
				<div className="relative mt-4 max-w-md">
					<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t("homeSearchServices")}
						className="h-10 rounded-lg bg-white pl-9"
					/>
				</div>
			</div>

			<div className="px-4 pt-4 md:px-6">
				{error ? (
					<p className="mb-3 text-sm text-destructive">{error}</p>
				) : null}

				{loading ? (
					<ServiceLoading />
				) : (
					<div className={cn("space-y-6", pending && "opacity-90")}>
						<section>
							<div className="mb-3 flex items-center justify-between">
								<h2 className="text-base font-semibold tracking-tight">
									{t("homeCategories")}
								</h2>
								<button
									type="button"
									onClick={() => router.push("/service/categories")}
									className="text-xs font-medium text-primary"
								>
									{t("homeSeeAll")}
								</button>
							</div>
							<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
								{categories.slice(0, 12).map((cat) => (
									<button
										key={cat.id}
										type="button"
										onClick={() =>
											router.push(`/service/services?category=${cat.id}`)
										}
										className="flex w-[72px] shrink-0 flex-col items-center gap-1.5"
									>
										<span className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
											{cat.image ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={cat.image}
													alt=""
													className="size-full object-cover"
												/>
											) : (
												<span className="text-lg font-semibold text-primary">
													{(cat.categoryName || "?").charAt(0)}
												</span>
											)}
										</span>
										<span className="line-clamp-2 text-center text-[11px] leading-tight text-foreground">
											{cat.categoryName}
										</span>
									</button>
								))}
							</div>
						</section>

						{banners.length > 0 ? (
							<BannerCarousel banners={banners} />
						) : null}

						<section>
							<button
								type="button"
								onClick={() => router.push("/service/requests/new")}
								className="flex w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3.5 text-left text-primary-foreground shadow-sm transition active:scale-[0.99]"
							>
								<div>
									<p className="text-sm font-semibold">{t("homeCustomTitle")}</p>
									<p className="mt-0.5 text-xs text-primary-foreground/80">
										{t("homeCustomBody")}
									</p>
								</div>
								<span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold">
									{t("requestsTitle")}
								</span>
							</button>
						</section>

						{featured.length > 0 && !query.trim() ? (
							<section>
								<div className="mb-3 flex items-center justify-between">
									<h2 className="text-base font-semibold tracking-tight">
										{t("homeFeatured")}
									</h2>
									<button
										type="button"
										onClick={() =>
											router.push("/service/services?featured=1")
										}
										className="text-xs font-medium text-primary"
									>
										{t("homeSeeAll")}
									</button>
								</div>
								<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
									{featured.map((s) => (
										<div
											key={s.id}
											className="w-[220px] shrink-0 sm:w-[240px]"
										>
											<ServiceCard
												service={s}
												compact
												href={`/service/services/${s.id}`}
												showFeaturedPending={false}
											/>
										</div>
									))}
								</div>
							</section>
						) : null}

						<section>
							<div className="mb-3 flex items-center justify-between gap-2">
								<h2 className="text-base font-semibold tracking-tight">
									{query.trim() ? t("homeResults") : t("servicesTitle")}
								</h2>
								<div className="flex items-center gap-2">
									{!query.trim() ? (
										<>
											<button
												type="button"
												onClick={() => setSortMode("popular")}
												className={cn(
													"text-xs font-medium",
													sortMode === "popular"
														? "text-primary"
														: "text-muted-foreground",
												)}
											>
												{t("homePopular")}
											</button>
											<button
												type="button"
												onClick={() => setSortMode("nearby")}
												className={cn(
													"text-xs font-medium",
													sortMode === "nearby"
														? "text-primary"
														: "text-muted-foreground",
												)}
											>
												{t("homeNearby")}
											</button>
											<button
												type="button"
												onClick={() => router.push("/service/services")}
												className="text-xs font-medium text-primary"
											>
												{t("homeSeeAll")}
											</button>
										</>
									) : null}
								</div>
							</div>
							{filtered.length === 0 ? (
								<div className="rounded-xl bg-white px-4 py-8 text-center shadow-sm ring-1 ring-black/5">
									<p className="text-sm text-muted-foreground">
										{query.trim()
											? t("homeNoMatch", { query: query.trim() })
											: t("homeNoServices")}
									</p>
									{query.trim() ? (
										<button
											type="button"
											onClick={() =>
												router.push("/service/requests/new")
											}
											className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
										>
											{t("homeRequestCustom")}
										</button>
									) : null}
								</div>
							) : (
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
						</section>
					</div>
				)}
			</div>
		</div>
	);
}
