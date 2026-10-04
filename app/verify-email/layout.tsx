import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
	title: "Verify email",
	robots: NO_INDEX_ROBOTS,
};

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
	return children;
}
