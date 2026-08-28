"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { uploadVerifyDocument } from "@/services/auth/verificationApi";
import {
	fetchProviderVerifyDocuments,
	fetchSignupIdentityDocuments,
	type IdentityDocument,
} from "@/services/provider/documentsApi";
import { useAuth } from "@/store/useAuth";

export default function ProviderVerifyIdPage() {
	const router = useRouter();
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const [docs, setDocs] = useState<IdentityDocument[]>([]);
	const [files, setFiles] = useState<Record<string, File | null>>({});
	const [status, setStatus] = useState<Record<string, boolean>>({});
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		void fetchSignupIdentityDocuments().then((res) => {
			if (res.error) setError(res.error);
			setDocs(res.documents);
		});
		if (providerId) {
			void fetchProviderVerifyDocuments(providerId).then((res) => {
				const map: Record<string, boolean> = {};
				for (const [id, row] of Object.entries(res.byDocumentId)) {
					map[id] = row.isVerify;
				}
				setStatus(map);
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
		setBusy(false);
		router.replace("/provider/onboarding");
	}

	const requiredIds = docs.filter((d) => d.isRequired).map((d) => d.id);
	const hasRequired =
		requiredIds.length === 0 ||
		requiredIds.every((id) => Boolean(files[id]) || status[id]);

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
			<div className="mt-6 space-y-4">
				{docs.map((doc) => (
					<label key={doc.id} className="block text-sm font-medium">
						{doc.name}
						{status[doc.id] ? (
							<span className="ml-2 text-xs text-primary">
								{t("providerVerifySubmitted")}
							</span>
						) : null}
						<input
							type="file"
							accept="image/*,.pdf"
							className="mt-2 block w-full text-sm"
							onChange={(e) =>
								setFiles((prev) => ({
									...prev,
									[doc.id]: e.target.files?.[0] ?? null,
								}))
							}
						/>
					</label>
				))}
				{docs.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{t("providerVerifyNotConfigured")}
					</p>
				) : (
					<Button
						type="button"
						disabled={busy || !hasRequired}
						onClick={() => void submit()}
					>
						{t("uploadDocument")}
					</Button>
				)}
			</div>
		</div>
	);
}
