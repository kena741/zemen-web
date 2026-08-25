"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProfileBackLink({
	href = "/provider",
	label = "Dashboard",
	className,
}: {
	href?: string;
	label?: string;
	className?: string;
}) {
	return (
		<Link
			href={href}
			className={cn(
				buttonVariants({ variant: "ghost", size: "sm" }),
				"-ml-2 mb-3 gap-1.5",
				className,
			)}
		>
			<ArrowLeftIcon className="size-4" />
			{label}
		</Link>
	);
}
