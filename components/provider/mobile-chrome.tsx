"use client";

import Link from "next/link";
import { BellIcon, MessagesSquareIcon } from "lucide-react";

import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

/** Flutter tab AppBar: title left, chat + bell right (no back). */
export function ProviderMobileTabBar({
	title,
	className,
}: {
	title: string;
	className?: string;
}) {
	return (
		<header
			className={cn(
				"sticky top-0 z-20 flex items-center justify-between gap-3 bg-white px-4 py-3 lg:hidden",
				className,
			)}
			style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
		>
			<h1 className="text-lg font-normal text-[#464646]">{title}</h1>
			<div className="flex items-center gap-2.5">
				<Link
					href="/provider/inbox"
					className="inline-flex size-9 items-center justify-center text-[#7C7C7C]"
					aria-label="Inbox"
				>
					<MessagesSquareIcon className="size-6" strokeWidth={1.75} />
				</Link>
				<Link
					href="/provider/notifications"
					className="inline-flex size-9 items-center justify-center text-[#7C7C7C]"
					aria-label="Notifications"
				>
					<BellIcon className="size-6" strokeWidth={1.75} />
				</Link>
			</div>
		</header>
	);
}

/** Flutter home header: avatar + Welcome/name + chat/bell. */
export function ProviderHomeHeader({
	name,
	image,
}: {
	name: string;
	image?: string | null;
}) {
	return (
		<header
			className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-white px-3 py-3 lg:hidden"
			style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
		>
			<Link href="/provider/profile" className="flex min-w-0 items-center gap-3">
				<UserAvatar src={image} name={name} size="md" className="size-10" />
				<div className="min-w-0">
					<p className="text-lg font-normal text-[#464646]">Welcome</p>
					<p className="truncate text-sm text-[#525252]">{name}</p>
				</div>
			</Link>
			<div className="flex shrink-0 items-center gap-2.5">
				<Link
					href="/provider/inbox"
					className="inline-flex size-9 items-center justify-center text-[#7C7C7C]"
					aria-label="Inbox"
				>
					<MessagesSquareIcon className="size-6" strokeWidth={1.75} />
				</Link>
				<Link
					href="/provider/notifications"
					className="inline-flex size-9 items-center justify-center text-[#7C7C7C]"
					aria-label="Notifications"
				>
					<BellIcon className="size-6" strokeWidth={1.75} />
				</Link>
			</div>
		</header>
	);
}
