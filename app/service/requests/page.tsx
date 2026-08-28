"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { formatDateTime } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";
import { useCachedRequests } from "@/store/useCustomerCache";

export default function RequestsPage() {
	const { t } = useLocale();
	const router = useRouter();
	const { user } = useAuth();
	const customerKey = user?.id ?? "";
	const { data: jobs, loading, error, refresh, refreshing } =
		useCachedRequests(customerKey);

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold tracking-tight md:text-[1.65rem]">
						{t("requestsTitle")}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("requestsSubtitle")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={refresh}
						className="text-xs font-medium text-primary"
					>
						{refreshing ? "…" : t("commonRefresh")}
					</button>
					<Button
						size="sm"
						className="gap-1.5"
						onClick={() => router.push("/service/requests/new")}
					>
						<PlusIcon className="size-4" />
						{t("commonNew")}
					</Button>
				</div>
			</div>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
				{loading ? (
					<ServiceLoading compact />
				) : jobs.length === 0 ? (
					<div className="px-4 py-12 text-center">
						<p className="text-sm text-muted-foreground">
							{t("requestNoJobRequests")}
						</p>
						<Button
							className="mt-4"
							onClick={() => router.push("/service/requests/new")}
						>
							{t("requestPost")}
						</Button>
					</div>
				) : (
					jobs.map((job) => {
						const id = String(job.id ?? "");
						const title = String(job.title ?? t("requestJobRequest"));
						const description =
							job.description != null ? String(job.description) : "";
						const accepted = job.accepted === true;
						const createdAt =
							job.createdAt != null
								? String(job.createdAt)
								: job.created_at != null
									? String(job.created_at)
									: null;
						const bids = Array.isArray(job.bidList)
							? job.bidList.length
							: 0;

						return (
							<Link
								key={id}
								href={`/service/requests/${id}`}
								className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5 last:border-b-0 hover:bg-muted/40"
							>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold">{title}</p>
									{description ? (
										<p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
											{description}
										</p>
									) : null}
									<p className="mt-1 text-xs text-muted-foreground">
										{accepted
											? t("statusAccepted")
											: bids === 1
												? t("requestBidCountOne")
												: t("requestBidCount", { count: bids })}
										{createdAt ? ` · ${formatDateTime(createdAt)}` : null}
									</p>
								</div>
								<ChevronRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
							</Link>
						);
					})
				)}
			</div>
		</div>
	);
}
