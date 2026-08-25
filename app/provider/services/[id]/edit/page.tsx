"use client";

import { useParams, useRouter } from "next/navigation";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceForm } from "@/components/provider/service-form";
import { AppLoading } from "@/components/ui/app-loading";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderServices } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderServiceDetail } from "@/store/useProviderCache";

export default function EditServicePage() {
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
			? "This service does not belong to your account."
			: null;

	if (!providerId || !authUserId) {
		return <AppLoading />;
	}

	return (
		<div className="mx-auto max-w-2xl">
			<ProfileBackLink
				href={id ? `/provider/services/${id}` : "/provider/services"}
				label="Back"
			/>
			<p className="admin-eyebrow">Services</p>
			<h1 className="admin-page-title mt-1">Edit service</h1>

			{loading ? (
				<AppLoading compact />
			) : ownershipError || loadError || !service ? (
				<p className="mt-6 text-sm text-destructive">
					{ownershipError || loadError || "Service not found"}
				</p>
			) : (
				<div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
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
