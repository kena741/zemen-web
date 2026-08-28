"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { fetchPolicyHtml, type PolicySlug } from "@/services/config/policyApi";

const SLUGS: PolicySlug[] = ["privacy", "terms", "about"];

function slugLabel(slug: PolicySlug, t: ReturnType<typeof useLocale>["t"]) {
	if (slug === "privacy") return t("legalPrivacy");
	if (slug === "terms") return t("legalTerms");
	return t("legalAbout");
}

export default function LegalPage() {
	const params = useParams<{ slug: string }>();
	const { t } = useLocale();
	const slug = (params.slug ?? "privacy") as PolicySlug;
	const valid = SLUGS.includes(slug) ? slug : "privacy";
	const [title, setTitle] = useState("");
	const [html, setHtml] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		void fetchPolicyHtml(valid).then((res) => {
			setTitle(res.title);
			setHtml(res.html);
			setError(res.error);
			setLoading(false);
		});
	}, [valid]);

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<ProfileBackLink href="/login" label={t("commonBack")} />
			<h1 className="admin-page-title mt-4">{title || t("legalTitle")}</h1>
			<div className="mt-4 flex flex-wrap gap-3 text-sm">
				{SLUGS.map((s) => (
					<Link
						key={s}
						href={`/legal/${s}`}
						className={s === valid ? "font-semibold text-primary" : "text-muted-foreground"}
					>
						{slugLabel(s, t)}
					</Link>
				))}
			</div>
			{loading ? (
				<ServiceLoading compact />
			) : error ? (
				<p className="mt-6 text-sm text-muted-foreground">{error || t("legalNotAvailable")}</p>
			) : (
				<article
					className="prose prose-sm mt-6 max-w-none dark:prose-invert"
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			)}
		</div>
	);
}
