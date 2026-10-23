"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";
import { createJobRequest } from "@/services/customer/bookingsApi";
import { uploadCustomerServiceImage } from "@/services/customer/customerServicesApi";
import {
	fetchCategories,
	fetchSubCategories,
} from "@/services/services/servicesApi";
import type {
	ServiceCategory,
	ServiceSubCategory,
} from "@/services/services/types";
import { useAppDispatch } from "@/store/hooks";
import { invalidateRequests } from "@/store/customerCacheSlice";
import { useAuth } from "@/store/useAuth";

const MIN_BUDGET = 500;

export default function NewRequestPage() {
	const { t } = useLocale();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const customerId = user?.customer?.id ?? user?.id ?? "";
	const [serviceName, setServiceName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [subCategoryId, setSubCategoryId] = useState("");
	const [categories, setCategories] = useState<ServiceCategory[]>([]);
	const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);
	const [file, setFile] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void fetchCategories().then((res) => setCategories(res.categories));
	}, []);

	useEffect(() => {
		if (!categoryId) {
			setSubCategories([]);
			setSubCategoryId("");
			return;
		}
		void fetchSubCategories(categoryId).then((res) => {
			setSubCategories(res.subCategories);
			setSubCategoryId("");
		});
	}, [categoryId]);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!user?.id || !customerId) return;
		const amount = Number(price);
		if (
			!serviceName.trim() ||
			!description.trim() ||
			!categoryId ||
			!subCategoryId
		) {
			setError(t("requestFieldsRequired"));
			return;
		}
		if (Number.isNaN(amount) || amount < MIN_BUDGET) {
			setError(t("requestBudgetMin", { min: String(MIN_BUDGET) }));
			return;
		}
		setBusy(true);
		setError(null);

		let images: string[] = [];
		if (file) {
			const uploaded = await uploadCustomerServiceImage({
				customerId,
				file,
			});
			if (uploaded.error) {
				setBusy(false);
				setError(uploaded.error);
				return;
			}
			if (uploaded.url) images = [uploaded.url];
		}

		const category = categories.find((c) => c.id === categoryId);
		const sub = subCategories.find((s) => s.id === subCategoryId);
		const serviceModel = {
			id: crypto.randomUUID(),
			serviceName: serviceName.trim(),
			description: description.trim(),
			categoryId,
			subCategoryId,
			categoryName: category?.categoryName ?? null,
			subCategoryName: sub?.subCategoryName ?? null,
			subCategoryModel: sub
				? {
						id: sub.id,
						categoryId: sub.categoryId,
						subCategoryName: sub.subCategoryName,
					}
				: null,
			serviceImage: images,
			price: String(amount),
		};

		const res = await createJobRequest({
			customerId: user.id,
			title: serviceName.trim(),
			description: description.trim(),
			price: String(amount),
			serviceModelList: [serviceModel],
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

			<form
				onSubmit={(e) => void onSubmit(e)}
				className="mx-auto mt-6 max-w-lg space-y-4"
			>
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<Field>
					<FieldLabel htmlFor="image">{t("providerChooseImage")}</FieldLabel>
					<Input
						id="image"
						type="file"
						accept="image/*"
						onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						className="bg-white"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="name">{t("providerServiceName")}</FieldLabel>
					<Input
						id="name"
						required
						value={serviceName}
						onChange={(e) => setServiceName(e.target.value)}
						placeholder={t("providerServiceNamePlaceholder")}
						className="bg-white"
					/>
				</Field>

				<Field>
					<FieldLabel>{t("providerSelectCategory")}</FieldLabel>
					<SearchableSelect
						options={categories.map((c) => ({
							id: c.id,
							label: c.categoryName ?? c.id,
						}))}
						value={categoryId}
						onChange={setCategoryId}
						placeholder={t("providerSelectCategory")}
					/>
				</Field>

				{categoryId ? (
					<Field>
						<FieldLabel>{t("providerSelectSubcategory")}</FieldLabel>
						<SearchableSelect
							options={subCategories.map((s) => ({
								id: s.id,
								label: s.subCategoryName ?? s.id,
							}))}
							value={subCategoryId}
							onChange={setSubCategoryId}
							placeholder={t("providerSelectSubcategory")}
							disabled={subCategories.length === 0}
						/>
					</Field>
				) : null}

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
					<FieldLabel htmlFor="budget">{t("requestBudget")}</FieldLabel>
					<Input
						id="budget"
						type="number"
						min={MIN_BUDGET}
						required
						value={price}
						onChange={(e) => setPrice(e.target.value)}
						placeholder={String(MIN_BUDGET)}
						className="bg-white"
					/>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("requestBudgetMin", { min: String(MIN_BUDGET) })}
					</p>
				</Field>

				<Button type="submit" className="w-full" disabled={busy}>
					{busy ? t("requestPosting") : t("requestPostButton")}
				</Button>
			</form>
		</div>
	);
}
