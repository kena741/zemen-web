"use client";

import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import {
	fetchActiveTaxes,
	type TaxRow,
} from "@/services/config/taxesApi";

export default function ProviderTaxesPage() {
	const { t } = useLocale();
	const [rows, setRows] = useState<TaxRow[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void fetchActiveTaxes().then((res) => {
			setRows(res.rows);
			setLoading(false);
		});
	}, []);

	return (
		<div className="mx-auto max-w-lg px-4 py-6">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<h1 className="admin-page-title mt-2">{t("taxes")}</h1>
			{loading ? (
				<ServiceLoading className="mt-6" />
			) : (
				<ul className="mt-6 divide-y divide-border rounded-xl bg-white ring-1 ring-black/5 dark:bg-card">
					{rows.map((row) => (
						<li key={row.id} className="flex justify-between px-4 py-3 text-sm">
							<span>{row.title ?? row.type ?? t("providerTaxDefault")}</span>
							<span className="font-medium tabular-nums">{row.tax ?? "—"}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
