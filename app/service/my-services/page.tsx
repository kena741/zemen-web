"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { formatAmount } from "@/services/bookings/types";
import {
	deleteCustomerServiceDetail,
	fetchCustomerServiceDetails,
	type CustomerServiceDetail,
} from "@/services/customer/customerServicesApi";
import { useAuth } from "@/store/useAuth";

export default function MyServicesPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const customerId = user?.customer?.id ?? user?.id ?? "";
	const [services, setServices] = useState<CustomerServiceDetail[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function load() {
		setLoading(true);
		const res = await fetchCustomerServiceDetails(customerId);
		setServices(res.services);
		setError(res.error);
		setLoading(false);
	}

	useEffect(() => {
		if (!customerId) return;
		void load();
	}, [customerId]);

	async function remove(id: string) {
		if (!window.confirm(t("myServicesDeleteConfirm"))) return;
		const res = await deleteCustomerServiceDetail(id);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		void load();
	}

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/service/profile" label={t("profileTitle")} />
				<Link
					href="/service/my-services/new"
					className={buttonVariants({ size: "sm", className: "gap-1" })}
				>
					<PlusIcon className="size-4" />
					{t("myServicesAdd")}
				</Link>
			</div>
			<h1 className="admin-page-title">{t("myServicesTitle")}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{t("myServicesSubtitle")}
			</p>
			{error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
			{loading ? (
				<ServiceLoading compact />
			) : services.length === 0 ? (
				<p className="mt-6 text-sm text-muted-foreground">
					{t("myServicesNoSaved")}
				</p>
			) : (
				<ul className="mt-5 space-y-3">
					{services.map((s) => (
						<li
							key={s.id}
							className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="font-semibold">{s.serviceName}</p>
									<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
										{s.description}
									</p>
									<p className="mt-2 text-sm font-medium text-primary">
										{formatAmount(s.price)}
									</p>
								</div>
								<button
									type="button"
									className="text-xs text-destructive"
									onClick={() => void remove(s.id)}
								>
									{t("commonDelete")}
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
