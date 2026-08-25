"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { AppLoading } from "@/components/ui/app-loading";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import { handymanDisplayName } from "@/services/handymen/handymenApi";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderHandymen } from "@/store/useProviderCache";

export default function HandymenPage() {
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const { data: handymen, loading, error, refresh, refreshing } =
		useCachedProviderHandymen(providerId);
	const [showInactive, setShowInactive] = useState(true);

	const visible = showInactive
		? handymen
		: handymen.filter((h) => h.active && h.isActive);

	return (
		<div className="mx-auto max-w-3xl">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/provider/profile" label="Profile" />
				<button
					type="button"
					onClick={refresh}
					className="mb-3 text-xs font-medium text-primary"
				>
					{refreshing ? "Refreshing…" : "Refresh"}
				</button>
			</div>
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

			<div className="mt-5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
				{loading ? (
					<AppLoading compact />
				) : visible.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						No handymen yet.
					</p>
				) : (
					visible.map((h) => {
						const name = handymanDisplayName(h);
						const inactive = !h.active || !h.isActive;
						return (
							<Link
								key={h.id}
								href={`/provider/handymen/${h.id}`}
								className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40"
							>
								<UserAvatar
									src={h.profileImage}
									name={name}
									size="md"
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">
										{name}
										{inactive ? (
											<span className="ml-2 text-[10px] font-medium text-muted-foreground">
												Inactive
											</span>
										) : null}
									</p>
									<p className="mt-0.5 truncate text-xs text-muted-foreground">
										{h.email || h.phoneNumber || h.category || "—"}
									</p>
								</div>
								<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
							</Link>
						);
					})
				)}
			</div>
		</div>
	);
}
