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
import {
	upsertCustomerServiceDetail,
	uploadCustomerServiceImage,
} from "@/services/customer/customerServicesApi";
import { useAuth } from "@/store/useAuth";

export default function NewMyServicePage() {
	const { t } = useLocale();
	const router = useRouter();
	const { user } = useAuth();
	const customerId = user?.customer?.id ?? user?.id ?? "";
	const [serviceName, setServiceName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!customerId) return;
		const amount = Number(price);
		if (!serviceName.trim() || !description.trim() || Number.isNaN(amount) || amount <= 0) {
			setError(t("myServicesFieldsRequired"));
			return;
		}
		setBusy(true);
		setError(null);
		let images: string[] = [];
		if (file) {
			const uploaded = await uploadCustomerServiceImage({ customerId, file });
			if (uploaded.error) {
				setBusy(false);
				setError(uploaded.error);
				return;
			}
			if (uploaded.url) images = [uploaded.url];
		}
		const res = await upsertCustomerServiceDetail({
			customerId,
			serviceName,
			description,
			price: amount,
			serviceImages: images,
		});
		setBusy(false);
		if (!res.id) {
			setError(res.error ?? t("myServicesSaveFailed"));
			return;
		}
		router.replace("/service/my-services");
	}

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href="/service/my-services" label={t("myServicesTitle")} />
			<h1 className="admin-page-title">{t("myServicesNew")}</h1>
			<form onSubmit={(e) => void onSubmit(e)} className="mx-auto mt-6 max-w-lg space-y-4">
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}
				<Field>
					<FieldLabel htmlFor="name">{t("myServicesName")}</FieldLabel>
					<Input
						id="name"
						required
						value={serviceName}
						onChange={(e) => setServiceName(e.target.value)}
						className="bg-white"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="desc">{t("myServicesDescription")}</FieldLabel>
					<Textarea
						id="desc"
						required
						rows={4}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="bg-white"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="price">{t("myServicesPrice")}</FieldLabel>
					<Input
						id="price"
						required
						inputMode="decimal"
						value={price}
						onChange={(e) => setPrice(e.target.value)}
						className="bg-white"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="image">{t("myServicesPhoto")}</FieldLabel>
					<Input
						id="image"
						type="file"
						accept="image/*"
						onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						className="bg-white"
					/>
				</Field>
				<Button type="submit" disabled={busy} className="w-full">
					{busy ? t("commonSaving") : t("myServicesSave")}
				</Button>
			</form>
		</div>
	);
}
