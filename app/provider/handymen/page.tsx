"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import {
	fetchProviderHandymen,
	handymanDisplayName,
} from "@/services/handymen/handymenApi";
import type { Handyman } from "@/services/handymen/types";
import { useAuth } from "@/store/useAuth";

export default function HandymenPage() {
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const [handymen, setHandymen] = useState<Handyman[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showInactive, setShowInactive] = useState(true);

	useEffect(() => {
		if (!providerId) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			const res = await fetchProviderHandymen(providerId);
			if (cancelled) return;
			setHandymen(res.handymen);
			setError(res.error);
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [providerId]);

	const visible = showInactive
		? handymen
		: handymen.filter((h) => h.active && h.isActive);

	return (
		<div className="mx-auto max-w-3xl">
			<ProfileBackLink href="/provider" label="Dashboard" />
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="admin-eyebrow">Team</p>
					<h1 className="admin-page-title mt-1">Handymen</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{loading
							? "Loading…"
							: `${handymen.length} team member${handymen.length === 1 ? "" : "s"}`}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowInactive((v) => !v)}
					>
						{showInactive ? "Hide inactive" : "Show inactive"}
					</Button>
					<Link
						href="/provider/handymen/new"
						className={cn(
							buttonVariants({ size: "sm" }),
							"inline-flex items-center gap-1.5",
						)}
					>
						<PlusIcon className="size-3.5" />
						Add handyman
					</Link>
				</div>
			</div>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 space-y-2">
				{loading ? (
					<p className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground shadow-xs">
						Loading handymen…
					</p>
				) : visible.length === 0 ? (
					<div className="rounded-xl border border-border bg-white px-4 py-10 text-center shadow-xs">
						<p className="text-sm text-muted-foreground">
							No handymen yet. Create one with an email and password.
						</p>
						<Link
							href="/provider/handymen/new"
							className={cn(
								buttonVariants({ size: "sm" }),
								"mt-4 inline-flex items-center gap-1.5",
							)}
						>
							<PlusIcon className="size-3.5" />
							Add handyman
						</Link>
					</div>
				) : (
					visible.map((h) => {
						const available = h.active && h.isActive;
						const name = handymanDisplayName(h);
						return (
							<Link
								key={h.id}
								href={`/provider/handymen/${h.id}`}
								className={cn(
									"flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-3 shadow-xs transition-colors hover:bg-muted/40",
									!available && "opacity-70",
								)}
							>
								<UserAvatar
									src={h.profileImage}
									name={name}
									size="md"
									className="size-12"
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">{name}</p>
									<p className="mt-0.5 truncate text-xs text-muted-foreground">
										{[h.category, h.subCategory, h.phoneNumber]
											.filter(Boolean)
											.join(" · ") || h.email}
									</p>
								</div>
								<span
									className={cn(
										"rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
										available
											? "bg-secondary text-secondary-foreground"
											: "bg-muted text-muted-foreground",
									)}
								>
									{available ? "Active" : "Off"}
								</span>
								<ChevronRightIcon className="size-4 text-muted-foreground" />
							</Link>
						);
					})
				)}
			</div>
		</div>
	);
}
