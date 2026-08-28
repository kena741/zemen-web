"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	ArrowLeftIcon,
	EyeIcon,
	EyeOffIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
	deleteHandyman,
	handymanDisplayName,
	setHandymanActive,
} from "@/services/handymen/handymenApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderHandymen } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderHandymanDetail } from "@/store/useProviderCache";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5 border-b border-border py-3 last:border-b-0 sm:flex-row sm:justify-between sm:gap-4">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="text-sm font-medium sm:text-right">{value ?? "—"}</dd>
		</div>
	);
}

export default function HandymanDetailPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const { handyman, loading, error: loadError, refresh } =
		useCachedProviderHandymanDetail(id);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (!handyman || !user?.provider?.id) return;
		if (handyman.providerId && handyman.providerId !== user.provider.id) {
			setError(t("providerHandymanNotOwned"));
		}
	}, [handyman, user?.provider?.id]);

	async function toggle() {
		if (!handyman) return;
		setBusy(true);
		setError(null);
		const res = await setHandymanActive({
			handymanId: handyman.id,
			isActive: !handyman.isActive,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		dispatch(invalidateProviderHandymen());
		refresh();
	}

	async function handleDelete() {
		if (!handyman) return;
		if (
			!window.confirm(
				t("handymanDeleteConfirm"),
			)
		) {
			return;
		}
		setBusy(true);
		setError(null);
		const res = await deleteHandyman(handyman.id);
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		dispatch(invalidateProviderHandymen());
		router.replace("/provider/handymen");
	}

	return (
		<div className="mx-auto max-w-2xl">
			<Button
				variant="ghost"
				size="sm"
				className="-ml-2 mb-3 gap-1.5"
				onClick={() => router.push("/provider/handymen")}
			>
				<ArrowLeftIcon className="size-4" />
				{t("handymanList")}
			</Button>

			{loading ? (
				<AppLoading compact />
			) : !handyman ? (
				<p className="text-sm text-destructive">
					{error || loadError || t("commonNotFound")}
				</p>
			) : (
				<>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="flex items-center gap-4">
							<UserAvatar
								src={handyman.profileImage}
								name={handymanDisplayName(handyman)}
								size="xl"
							/>
							<div>
								<p className="admin-eyebrow">{t("handymanTitle")}</p>
								<h1 className="admin-page-title mt-1">
									{handymanDisplayName(handyman)}
								</h1>
								<p className="mt-1 text-sm text-muted-foreground">
									@{handyman.userName || "—"}
								</p>
							</div>
						</div>
						<Link
							href={`/provider/handymen/${handyman.id}/edit`}
							className={cn(
								buttonVariants({ variant: "outline", size: "sm" }),
								"inline-flex items-center gap-1.5",
							)}
						>
							<PencilIcon className="size-3.5" />
							{t("commonEdit")}
						</Link>
					</div>

					{error ? (
						<Alert variant="destructive" className="mt-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}

					<dl className="mt-6 rounded-xl border border-border bg-white px-4 shadow-xs">
						<Row label={t("email")} value={handyman.email} />
						<Row
							label={t("phone")}
							value={
								handyman.phoneNumber
									? `${handyman.countryCode ?? "+251"} ${handyman.phoneNumber}`
									: null
							}
						/>
						<Row
							label={t("password")}
							value={
								handyman.password ? (
									<span className="inline-flex items-center gap-2">
										<span className="font-mono tabular-nums">
											{showPassword
												? handyman.password
												: "•".repeat(
														Math.min(handyman.password.length, 12),
													)}
										</span>
										<button
											type="button"
											className="text-muted-foreground hover:text-foreground"
											onClick={() => setShowPassword((v) => !v)}
											aria-label={
												showPassword ? t("providerHidePassword") : t("providerShowPassword")
											}
										>
											{showPassword ? (
												<EyeOffIcon className="size-4" />
											) : (
												<EyeIcon className="size-4" />
											)}
										</button>
									</span>
								) : (
									"—"
								)
							}
						/>
						<Row label={t("commonCategory")} value={handyman.category} />
						<Row label={t("providerSubcategory")} value={handyman.subCategory} />
						<Row label={t("commonAddress")} value={handyman.address} />
						<Row
							label={t("commonStatus")}
							value={
								handyman.active && handyman.isActive
									? t("commonAvailable")
									: t("commonInactive")
							}
						/>
					</dl>

					<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
						<Button
							variant={handyman.isActive ? "outline" : "default"}
							disabled={busy}
							onClick={() => void toggle()}
						>
							{handyman.isActive ? t("handymanDeactivate") : t("handymanActivate")}
						</Button>
						<Button
							variant="destructive"
							disabled={busy}
							className="gap-1.5 sm:ml-auto"
							onClick={() => void handleDelete()}
						>
							<Trash2Icon className="size-3.5" />
							{t("commonDelete")}
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
