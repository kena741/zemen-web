"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ServiceLoading } from "@/components/service/service-loading";

/** Legacy activation route — listing plan lives at /provider/tier (mobile parity). */
export default function ProviderActivationPage() {
	const router = useRouter();
	useEffect(() => {
		router.replace("/provider/tier");
	}, [router]);
	return (
		<div className="px-4 py-8">
			<ServiceLoading compact />
		</div>
	);
}
