import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
	title: "Forgot password",
	robots: NO_INDEX_ROBOTS,
};

export default function ForgotPasswordLayout({
	children,
}: {
	children: ReactNode;
}) {
	return children;
}
