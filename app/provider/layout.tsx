import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ProviderAppLayout } from "@/components/provider/provider-app-layout";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
	title: "Provider",
	robots: NO_INDEX_ROBOTS,
};

export default function ProviderLayout({ children }: { children: ReactNode }) {
	return <ProviderAppLayout>{children}</ProviderAppLayout>;
}
