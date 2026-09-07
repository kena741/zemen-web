"use client";

import { useRouter } from "next/navigation";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { useCachedCategories } from "@/store/useCustomerCache";

export default function CategoriesPage() {
	const { t } = useLocale();
	const router = useRouter();
	const { data: categories, loading, error } =
		useCachedCategories();

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href="/service" label={t("navHome")} />
			<h1 className="admin-page-title">{t("categoriesTitle")}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{t("categoriesSubtitle")}
			</p>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			{loading ? (
				<ServiceLoading compact />
			) : (
				<div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
					{categories.map((cat) => (
						<button
							key={cat.id}
							type="button"
							onClick={() =>
								router.push(`/service/services?category=${cat.id}`)
							}
							className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition active:scale-[0.98]"
						>
							<span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-[#f6faf4]">
								{cat.image ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={cat.image}
										alt=""
										className="size-full object-cover"
									/>
								) : (
									<span className="text-2xl font-semibold text-primary">
										{(cat.categoryName || "?").charAt(0)}
									</span>
								)}
							</span>
							<span className="line-clamp-2 text-center text-xs font-medium">
								{cat.categoryName}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
