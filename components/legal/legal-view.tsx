"use client";

import Link from "next/link";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { useLocale } from "@/lib/i18n";
import type { PolicySlug } from "@/services/config/policyApi";

const LINKS: { slug: PolicySlug; href: string }[] = [
	{ slug: "privacy", href: "/legal/privacy" },
	{ slug: "terms", href: "/legal/terms" },
	{ slug: "about", href: "/about" },
];

function slugLabel(slug: PolicySlug, t: ReturnType<typeof useLocale>["t"]) {
	if (slug === "privacy") return t("legalPrivacy");
	if (slug === "terms") return t("legalTerms");
	return t("legalAbout");
}

/** Legal page body; the policy HTML is fetched on the server so crawlers see it. */
export function LegalView({
	slug,
	title,
	html,
	error,
}: {
	slug: PolicySlug;
	title: string;
	html: string;
	error: string | null;
}) {
	const { t } = useLocale();

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<ProfileBackLink href="/login" label={t("commonBack")} />
			<h1 className="admin-page-title mt-4">{title || t("legalTitle")}</h1>
			<div className="mt-4 flex flex-wrap gap-3 text-sm">
				{LINKS.map((link) => (
					<Link
						key={link.slug}
						href={link.href}
						className={link.slug === slug ? "font-semibold text-primary" : "text-muted-foreground"}
					>
						{slugLabel(link.slug, t)}
					</Link>
				))}
			</div>
			{error || !html ? (
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
