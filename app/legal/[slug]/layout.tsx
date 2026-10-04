import type { Metadata } from "next";
import type { ReactNode } from "react";

import { BRAND_NAME } from "@/lib/brand";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";

const LABELS: Record<string, string> = {
	privacy: "Privacy Policy",
	terms: "Terms of Service",
	about: "Legal About",
};

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const label = LABELS[slug] ?? "Legal";
	const title = label;
	const description = `${label} for ${BRAND_NAME}.`;
	const path = `/legal/${slug}`;

	return {
		title,
		description,
		alternates: { canonical: path },
		openGraph: buildOpenGraph({
			title: `${title} | ${BRAND_NAME}`,
			description,
			path,
		}),
		twitter: buildTwitter({
			title: `${title} | ${BRAND_NAME}`,
			description,
		}),
	};
}

export default function LegalLayout({ children }: { children: ReactNode }) {
	return children;
}
