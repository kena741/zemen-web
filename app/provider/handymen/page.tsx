"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { AppLoading } from "@/components/ui/app-loading";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { handymanDisplayName } from "@/services/handymen/handymenApi";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderHandymen } from "@/store/useProviderCache";

export default function HandymenPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const { data: handymen, loading, error } =
		useCachedProviderHandymen(providerId);
	const [showInactive, setShowInactive] = useState(true);

	const visible = showInactive
		? handymen
		: handymen.filter((h) => h.active && h.isActive);

	const countLabel =
		handymen.length === 1
			? t("providerHandymenCountOne")
			: t("providerHandymenCount", { count: handymen.length });

	return (
		<div className="mx-auto max-w-3xl">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="admin-eyebrow">{t("commonTeam")}</p>
					<h1 className="admin-page-title mt-1">{t("handymanList")}</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{loading ? t("commonLoading") : countLabel}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowInactive((v) => !v)}
					>
						{showInactive ? t("providerHideInactive") : t("providerShowInactive")}
					</Button>
					<Link
						href="/provider/handymen/new"
						className={cn(
							buttonVariants({ size: "sm" }),
							"inline-flex items-center gap-1.5",
						)}
					>
						<PlusIcon className="size-3.5" />
						{t("handymanAdd")}
					</Link>
				</div>
			</div>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
				{loading ? (
					<AppLoading compact />
				) : visible.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						{t("providerNoHandymenYet")}
					</p>
				) : (
					visible.map((h) => {
						const name = handymanDisplayName(h);
						const inactive = !h.active || !h.isActive;
						return (
							<Link
								key={h.id}
								href={`/provider/handymen/${h.id}`}
								className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40"
							>
								<UserAvatar
									src={h.profileImage}
									name={name}
									size="md"
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">
										{name}
										{inactive ? (
											<span className="ml-2 text-[10px] font-medium text-muted-foreground">
												{t("commonInactive")}
											</span>
										) : null}
									</p>
									<p className="mt-0.5 truncate text-xs text-muted-foreground">
										{h.email || h.phoneNumber || h.category || "—"}
									</p>
								</div>
								<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
							</Link>
						);
					})
				)}
			</div>
		</div>
	);
}
