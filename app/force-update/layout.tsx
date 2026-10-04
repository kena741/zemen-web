import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
	title: "Update required",
	robots: NO_INDEX_ROBOTS,
};

export default function ForceUpdateLayout({ children }: { children: ReactNode }) {
	return children;
}
