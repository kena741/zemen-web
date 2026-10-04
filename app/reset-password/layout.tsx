import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
	title: "Reset password",
	robots: NO_INDEX_ROBOTS,
};

export default function ResetPasswordLayout({
	children,
}: {
	children: ReactNode;
}) {
	return children;
}
