import Link from "next/link";

import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function MarketingBreadcrumbs({
	items,
	className,
}: {
	items: Crumb[];
	className?: string;
}) {
	return (
		<nav aria-label="Breadcrumb" className={cn("text-sm text-[#52634c]", className)}>
			<ol className="flex flex-wrap items-center gap-1.5">
				{items.map((item, index) => {
					const last = index === items.length - 1;
					return (
						<li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
							{index > 0 ? <span aria-hidden className="text-[#9cb394]">/</span> : null}
							{item.href && !last ? (
								<Link
									href={item.href}
									className="font-medium text-primary underline-offset-4 hover:underline"
								>
									{item.label}
								</Link>
							) : (
								<span
									className={cn(last && "font-semibold text-[#0f1a0c]")}
									aria-current={last ? "page" : undefined}
								>
									{item.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
