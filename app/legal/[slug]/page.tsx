import { notFound } from "next/navigation";

import { LegalView } from "@/components/legal/legal-view";
import { getPublicSupabase } from "@/lib/supabase/public";
import { fetchPolicyHtml, type PolicySlug } from "@/services/config/policyApi";

const SLUGS: PolicySlug[] = ["privacy", "terms"];

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
	return SLUGS.map((slug) => ({ slug }));
}

export default async function LegalPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const policySlug = SLUGS.find((item) => item === slug);
	if (!policySlug) notFound();

	const policy = await fetchPolicyHtml(policySlug, getPublicSupabase()).catch((error) => {
		console.error("LegalPage", error);
		return { title: "", html: "", error: "Content not available yet." };
	});

	return <LegalView slug={policySlug} {...policy} />;
}
