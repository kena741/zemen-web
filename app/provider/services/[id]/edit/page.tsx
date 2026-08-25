"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceForm } from "@/components/provider/service-form";
import { fetchServiceById } from "@/services/services/servicesApi";
import type { ProviderService } from "@/services/services/types";
import { useAuth } from "@/store/useAuth";

export default function EditServicePage() {
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const authUserId = user?.id ?? "";
	const [service, setService] = useState<ProviderService | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			const res = await fetchServiceById(id);
			if (cancelled) return;
			if (
				res.service?.providerId &&
				providerId &&
				res.service.providerId !== providerId
			) {
				setError("This service does not belong to your account.");
				setService(null);
			} else {
				setService(res.service);
				setError(res.error);
			}
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [id, providerId]);

	if (!providerId || !authUserId) {
		return <p className="text-sm text-muted-foreground">Loading…</p>;
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
				<p className="mt-6 text-sm text-muted-foreground">Loading…</p>
			) : error || !service ? (
				<p className="mt-6 text-sm text-destructive">
					{error ?? "Service not found"}
				</p>
			) : (
				<div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
					<ServiceForm
						mode="edit"
						providerId={providerId}
						authUserId={authUserId}
						initial={service}
						onSuccess={(serviceId) =>
							router.replace(`/provider/services/${serviceId}`)
						}
					/>
				</div>
			)}
		</div>
	);
}
