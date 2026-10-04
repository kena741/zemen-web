import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ServiceAppLayout } from "@/components/service/service-app-layout";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
	title: "Customer",
	robots: NO_INDEX_ROBOTS,
};

export default function ServiceLayout({ children }: { children: ReactNode }) {
	return <ServiceAppLayout>{children}</ServiceAppLayout>;
}
