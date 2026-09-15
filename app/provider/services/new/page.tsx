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
		<div className="relative mx-auto max-w-2xl pb-8">
			<div
				aria-hidden
				className="pointer-events-none absolute -top-8 right-0 h-48 w-48 rounded-full bg-primary/8 blur-3xl"
			/>
			<ProfileBackLink
				href="/provider/services"
				label={t("providerServicesTitle")}
			/>
			<header className="mt-4 space-y-2">
				<p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-primary/70 uppercase">
					{t("providerServicesTitle")}
				</p>
				<h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-foreground text-balance sm:text-[32px]">
					{t("providerAddService")}
				</h1>
				<p className="max-w-md text-[15px] leading-snug text-muted-foreground text-pretty">
					{t("providerServiceCreateSubtitle")}
				</p>
			</header>
			<div className="mt-8">
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
