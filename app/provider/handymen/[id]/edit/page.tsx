"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { HandymanForm } from "@/components/provider/handyman-form";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import {
	fetchHandymanById,
	updateHandyman,
} from "@/services/handymen/handymenApi";
import type { Handyman, HandymanFormValues } from "@/services/handymen/types";
import { useAuth } from "@/store/useAuth";

export default function EditHandymanPage() {
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const { user } = useAuth();
	const [handyman, setHandyman] = useState<Handyman | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			const res = await fetchHandymanById(id);
			if (cancelled) return;
			if (
				res.handyman?.providerId &&
				user?.provider?.id &&
				res.handyman.providerId !== user.provider.id
			) {
				setError("This handyman does not belong to your account.");
				setHandyman(null);
			} else {
				setHandyman(res.handyman);
				setError(res.error);
			}
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [id, user?.provider?.id]);

	async function handleSubmit(values: HandymanFormValues) {
		if (!id) return;
		setBusy(true);
		setError(null);
		const payload: Record<string, unknown> = { ...values };
		if (!values.password.trim()) delete payload.password;
		const res = await updateHandyman(id, payload);
		setBusy(false);
		if (!res.handyman) {
			setError(res.error);
			return;
		}
		router.replace(`/provider/handymen/${id}`);
	}

	return (
		<div className="mx-auto max-w-2xl">
			<ProfileBackLink
				href={id ? `/provider/handymen/${id}` : "/provider/handymen"}
				label="Back"
			/>
			<p className="admin-eyebrow">Team</p>
			<h1 className="admin-page-title mt-1">Edit handyman</h1>

			{loading ? (
				<p className="mt-6 text-sm text-muted-foreground">Loading…</p>
			) : !handyman ? (
				<p className="mt-6 text-sm text-destructive">
					{error ?? "Handyman not found"}
				</p>
			) : (
				<div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-xs sm:p-5">
					<HandymanForm
						mode="edit"
						initial={handyman}
						busy={busy}
						error={error}
						onSubmit={handleSubmit}
					/>
				</div>
			)}
		</div>
	);
}
