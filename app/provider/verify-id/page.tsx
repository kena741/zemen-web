"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { uploadVerifyDocument } from "@/services/auth/verificationApi";
import {
	fetchProviderVerifyDocuments,
	fetchSignupIdentityDocuments,
	type IdentityDocument,
	type ProviderVerifyDoc,
	type VerifyDocStatus,
} from "@/services/provider/documentsApi";
import { useAuth } from "@/store/useAuth";

function statusLabel(
	status: VerifyDocStatus,
	t: (key: "providerVerifyRequired" | "providerVerifyPending" | "providerVerifyApproved" | "providerVerifySubmitted") => string,
): string {
	switch (status) {
		case "approved":
			return t("providerVerifyApproved");
		case "pending":
			return t("providerVerifyPending");
		case "rejected":
			return t("providerVerifyPending");
		default:
			return t("providerVerifyRequired");
	}
}

function statusClass(status: VerifyDocStatus): string {
	switch (status) {
		case "approved":
			return "bg-primary/10 text-primary";
		case "pending":
			return "bg-amber-500/15 text-amber-800";
		case "rejected":
			return "bg-destructive/10 text-destructive";
		default:
			return "bg-muted text-muted-foreground";
	}
}

export default function ProviderVerifyIdPage() {
	const router = useRouter();
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const [docs, setDocs] = useState<IdentityDocument[]>([]);
	const [files, setFiles] = useState<Record<string, File | null>>({});
	const [existing, setExisting] = useState<Record<string, ProviderVerifyDoc>>(
		{},
	);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		void fetchSignupIdentityDocuments().then((res) => {
			if (res.error) setError(res.error);
			setDocs(res.documents);
		});
		if (providerId) {
			void fetchProviderVerifyDocuments(providerId).then((res) => {
				if (res.error) setError(res.error);
				setExisting(res.byDocumentId);
			});
		}
	}, [providerId]);

	async function submit() {
		if (!providerId) return;
		const pending = docs.filter((d) => files[d.id]);
		if (!pending.length) {
			setError(t("providerVerifyUploadRequired"));
			return;
		}
		setBusy(true);
		setError(null);
		for (const doc of pending) {
			const file = files[doc.id];
			if (!file) continue;
			const r = await uploadVerifyDocument({
				providerId,
				providerName: user?.provider?.fullName ?? user?.name ?? "",
				providerEmail: user?.email ?? "",
				documentId: doc.id,
				file,
			});
			if (r.error) {
				setError(r.error);
				setBusy(false);
				return;
			}
		}
		const refreshed = await fetchProviderVerifyDocuments(providerId);
		setExisting(refreshed.byDocumentId);
		setFiles({});
		setBusy(false);
		router.replace("/provider/onboarding");
	}

	const requiredIds = docs.filter((d) => d.isRequired).map((d) => d.id);
	const hasRequired =
		requiredIds.length === 0 ||
		requiredIds.every(
			(id) =>
				Boolean(files[id]) ||
				existing[id]?.status === "pending" ||
				existing[id]?.status === "approved",
		);

	return (
		<div className="mx-auto max-w-lg px-4 py-6">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<h1 className="admin-page-title mt-2">{t("verifyId")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("providerVerifyHint")}
			</p>
			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}
			<div className="mt-6 space-y-3">
				{docs.map((doc) => {
					const row = existing[doc.id];
					const status: VerifyDocStatus = row?.status ?? "required";
					return (
						<div
							key={doc.id}
							className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-sm font-semibold">
										{doc.name}
										{doc.isRequired ? (
											<span className="text-destructive"> *</span>
										) : null}
									</p>
									<span
										className={cn(
											"mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
											statusClass(status),
										)}
									>
										{statusLabel(status, t)}
									</span>
								</div>
								{row?.documentImage ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={row.documentImage}
										alt=""
										className="size-14 rounded-md object-cover ring-1 ring-black/5"
									/>
								) : null}
							</div>
							{status !== "approved" ? (
								<input
									type="file"
									accept="image/*,.pdf"
									className="mt-3 block w-full text-sm"
									onChange={(e) =>
										setFiles((prev) => ({
											...prev,
											[doc.id]: e.target.files?.[0] ?? null,
										}))
									}
								/>
							) : null}
						</div>
					);
				})}
				{docs.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{t("providerVerifyNotConfigured")}
					</p>
				) : (
					<Button
						type="button"
						className="w-full"
						disabled={busy || !hasRequired}
						onClick={() => void submit()}
					>
						{busy ? t("commonSaving") : t("uploadDocument")}
					</Button>
				)}
			</div>
		</div>
	);
}
