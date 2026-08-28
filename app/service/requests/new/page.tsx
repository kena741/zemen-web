"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";
import { createJobRequest } from "@/services/customer/bookingsApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateRequests } from "@/store/customerCacheSlice";
import { useAuth } from "@/store/useAuth";

export default function NewRequestPage() {
	const { t } = useLocale();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!user?.id) return;
		if (!title.trim() || !description.trim()) {
			setError(t("requestTitleRequired"));
			return;
		}
		setBusy(true);
		setError(null);
		const res = await createJobRequest({
			customerId: user.id,
			title,
			description,
			price,
		});
		setBusy(false);
		if (!res.id) {
			setError(res.error || t("requestCreateFailed"));
			return;
		}
		dispatch(invalidateRequests());
		router.replace(`/service/requests/${res.id}`);
	}

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href="/service/requests" label={t("requestsTitle")} />
			<h1 className="admin-page-title">{t("requestNew")}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{t("requestNewSubtitle")}
			</p>

			<form onSubmit={onSubmit} className="mx-auto mt-6 max-w-lg space-y-4">
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<Field>
					<FieldLabel htmlFor="title">{t("requestTitle")}</FieldLabel>
					<Input
						id="title"
						required
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={t("requestTitlePlaceholder")}
						className="bg-white"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="desc">{t("requestDescription")}</FieldLabel>
					<Textarea
						id="desc"
						required
						rows={5}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t("requestDescPlaceholder")}
						className="bg-white"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="budget">{t("requestBudgetOptional")}</FieldLabel>
					<Input
						id="budget"
						type="number"
						min={0}
						value={price}
						onChange={(e) => setPrice(e.target.value)}
						placeholder="0"
						className="bg-white"
					/>
				</Field>

				<Button type="submit" className="w-full" disabled={busy}>
					{busy ? t("requestPosting") : t("requestPostButton")}
				</Button>
			</form>
		</div>
	);
}
