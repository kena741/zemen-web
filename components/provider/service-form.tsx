"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { XIcon } from "lucide-react";

import { PlacesAddressField } from "@/components/addresses/places-address-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	normalizeBillingInterval,
	type RecurringPaymentSettings,
	RECURRING_PAYMENT_SETTINGS_DEFAULT,
} from "@/lib/recurring";
import { useLocale } from "@/lib/i18n";
import { fetchRecurringPaymentSettings } from "@/services/config/recurringSettingsApi";
import {
	fetchCategories,
	fetchSubCategories,
	upsertService,
} from "@/services/services/servicesApi";
import {
	SERVICE_CONSTRAINTS,
	type ProviderService,
	type ServiceCategory,
	type ServiceSubCategory,
} from "@/services/services/types";

type ServiceFormProps = {
	mode: "create" | "edit";
	providerId: string;
	authUserId: string;
	initial?: ProviderService | null;
	onSuccess: (serviceId: string) => void;
};

const INTERVAL_OPTIONS = [
	{ value: "WEEK", label: "Weekly" },
	{ value: "MONTH", label: "Monthly" },
	{ value: "QUARTER", label: "Quarterly" },
	{ value: "YEAR", label: "Yearly" },
] as const;

export function ServiceForm({
	mode,
	providerId,
	authUserId,
	initial,
	onSuccess,
}: ServiceFormProps) {
	const { t } = useLocale();
	const [categories, setCategories] = useState<ServiceCategory[]>([]);
	const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);
	const [serviceName, setServiceName] = useState(initial?.serviceName ?? "");
	const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
	const [subCategoryId, setSubCategoryId] = useState(
		initial?.subCategoryId ?? "",
	);
	const [price, setPrice] = useState(initial?.price ?? "");
	const [discount, setDiscount] = useState(
		initial?.discount && initial.discount !== "0" ? initial.discount : "",
	);
	const [description, setDescription] = useState(initial?.description ?? "");
	const [address, setAddress] = useState(initial?.address ?? "");
	const [latitude, setLatitude] = useState(initial?.latitude ?? 0);
	const [longitude, setLongitude] = useState(initial?.longitude ?? 0);
	const [status, setStatus] = useState(initial?.status ?? true);
	const [pricingType, setPricingType] = useState(
		initial?.pricingType ?? "ONE_TIME",
	);
	const [billingInterval, setBillingInterval] = useState(
		initial?.billingInterval ?? "MONTH",
	);
	const [billingIntervalCount, setBillingIntervalCount] = useState(
		String(initial?.billingIntervalCount ?? 1),
	);
	const isRecurring = pricingType === "RECURRING";
	const [prePaymentPercent, setPrePaymentPercent] = useState(
		String(
			initial?.prePaymentPercent != null && initial.prePaymentPercent > 0
				? initial.prePaymentPercent
				: 100,
		),
	);
	const [allowsCustomOffer, setAllowsCustomOffer] = useState(
		initial?.allowsCustomOffer ?? false,
	);
	const [existingImages, setExistingImages] = useState<string[]>(
		initial?.serviceImage ?? [],
	);
	const [newFiles, setNewFiles] = useState<File[]>([]);
	const [newPreviews, setNewPreviews] = useState<string[]>([]);
	const [loadingMeta, setLoadingMeta] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [recurringSettings, setRecurringSettings] =
		useState<RecurringPaymentSettings>(RECURRING_PAYMENT_SETTINGS_DEFAULT);

	useEffect(() => {
		void fetchRecurringPaymentSettings().then(setRecurringSettings);
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoadingMeta(true);
			const res = await fetchCategories();
			if (cancelled) return;
			setCategories(res.categories);
			if (res.error) setError(res.error);
			setLoadingMeta(false);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!categoryId) {
			setSubCategories([]);
			return;
		}
		let cancelled = false;
		(async () => {
			const res = await fetchSubCategories(categoryId);
			if (cancelled) return;
			setSubCategories(res.subCategories);
			if (
				subCategoryId &&
				!res.subCategories.some((s) => s.id === subCategoryId)
			) {
				setSubCategoryId("");
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only reload subs when category changes
	}, [categoryId]);

	useEffect(() => {
		return () => {
			for (const url of newPreviews) URL.revokeObjectURL(url);
		};
	}, [newPreviews]);

	const imageSlotsUsed = existingImages.length + newFiles.length;
	const slotsLeft = SERVICE_CONSTRAINTS.maxImages - imageSlotsUsed;

	const selectedCategory = useMemo(
		() => categories.find((c) => c.id === categoryId) ?? null,
		[categories, categoryId],
	);
	const selectedSub = useMemo(
		() => subCategories.find((s) => s.id === subCategoryId) ?? null,
		[subCategories, subCategoryId],
	);
	const intervalOptions = useMemo(() => {
		const allowed = new Set(
			recurringSettings.availableCycles.map((c) => normalizeBillingInterval(c)),
		);
		const filtered = INTERVAL_OPTIONS.filter((o) => allowed.has(o.value));
		return filtered.length > 0 ? filtered : [...INTERVAL_OPTIONS];
	}, [recurringSettings.availableCycles]);

	useEffect(() => {
		if (pricingType !== "RECURRING") return;
		if (!intervalOptions.some((o) => o.value === billingInterval)) {
			setBillingInterval(intervalOptions[0]?.value ?? "MONTH");
		}
	}, [pricingType, intervalOptions, billingInterval]);

	function onPickFiles(files: FileList | null) {
		if (!files?.length) return;
		const incoming = Array.from(files).slice(0, Math.max(0, slotsLeft));
		const nextFiles = [...newFiles, ...incoming];
		const nextPreviews = [
			...newPreviews,
			...incoming.map((f) => URL.createObjectURL(f)),
		];
		setNewFiles(nextFiles);
		setNewPreviews(nextPreviews);
	}

	function removeExisting(url: string) {
		setExistingImages((prev) => prev.filter((u) => u !== url));
	}

	function removeNew(index: number) {
		URL.revokeObjectURL(newPreviews[index] ?? "");
		setNewFiles((prev) => prev.filter((_, i) => i !== index));
		setNewPreviews((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);

		const percent = Math.min(
			100,
			Math.max(1, Number(prePaymentPercent) || 100),
		);

		const res = await upsertService({
			authUserId,
			isEdit: mode === "edit",
			input: {
				id: initial?.id,
				providerId,
				serviceName,
				categoryId,
				subCategoryId,
				categoryName: selectedCategory?.categoryName ?? "",
				subCategoryName: selectedSub?.subCategoryName ?? "",
				price,
				discount,
				description,
				address,
				latitude,
				longitude,
				status,
				existingImages,
				newFiles,
				createdAt: initial?.createdAt,
				slug: initial?.slug,
				reviewSum: initial?.reviewSum,
				reviewCount: initial?.reviewCount,
				feature: initial?.feature ?? false,
				pricingType,
				billingInterval,
				billingIntervalCount: Number(billingIntervalCount) || 1,
				prePayment: !isRecurring,
				prePaymentPercent: isRecurring ? 100 : percent,
				allowsCustomOffer,
			},
		});

		setBusy(false);
		if (!res.serviceId) {
			setError(res.error);
			return;
		}
		onSuccess(res.serviceId);
	}

	return (
		<form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
			{error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<div className="space-y-1.5">
				<Label htmlFor="name">{t("providerServiceName")}</Label>
				<Input
					id="name"
					required
					value={serviceName}
					onChange={(e) => setServiceName(e.target.value)}
					placeholder={t("providerServiceNamePlaceholder")}
				/>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor="category">{t("commonCategory")}</Label>
					<select
						id="category"
						required
						disabled={loadingMeta}
						value={categoryId}
						onChange={(e) => {
							setCategoryId(e.target.value);
							setSubCategoryId("");
						}}
						className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						<option value="">{t("providerSelectCategory")}</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.categoryName}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="subcategory">{t("providerSubcategory")}</Label>
					<select
						id="subcategory"
						required
						disabled={!categoryId}
						value={subCategoryId}
						onChange={(e) => setSubCategoryId(e.target.value)}
						className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						<option value="">{t("providerSelectSubcategory")}</option>
						{subCategories.map((s) => (
							<option key={s.id} value={s.id}>
								{s.subCategoryName}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor="price">{t("commonPrice")} (ETB)</Label>
					<Input
						id="price"
						type="number"
						min={SERVICE_CONSTRAINTS.minPrice}
						step="1"
						required
						value={price}
						onChange={(e) => setPrice(e.target.value)}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="discount">
						{t("commonDiscount")} % ({t("commonOptional")})
					</Label>
					<Input
						id="discount"
						type="number"
						min={0}
						max={100}
						value={discount}
						onChange={(e) => setDiscount(e.target.value)}
					/>
				</div>
			</div>

			<div className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
				<p className="text-sm font-semibold">{t("bookServicePayment")}</p>
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="pricing-type">{t("pricingOneTime")}</Label>
						<select
							id="pricing-type"
							value={pricingType}
							onChange={(e) => setPricingType(e.target.value)}
							className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
						>
							<option value="ONE_TIME">{t("pricingOneTime")}</option>
							<option value="RECURRING">{t("pricingRecurring")}</option>
						</select>
					</div>
					{isRecurring ? (
						<>
							<div className="space-y-1.5">
								<Label htmlFor="billing-interval">{t("billingInterval")}</Label>
								<select
									id="billing-interval"
									value={billingInterval}
									onChange={(e) => setBillingInterval(e.target.value)}
									className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
								>
									{intervalOptions.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-1.5 sm:col-span-2">
								<Label htmlFor="billing-interval-count">
									{t("providerBillingEveryN")}
								</Label>
								<Input
									id="billing-interval-count"
									type="number"
									min={1}
									max={24}
									value={billingIntervalCount}
									onChange={(e) => setBillingIntervalCount(e.target.value)}
								/>
							</div>
						</>
					) : (
						<div className="space-y-1.5">
							<Label htmlFor="prepay">{t("providerPrePaymentPercent")}</Label>
							<Input
								id="prepay"
								type="number"
								min={1}
								max={100}
								value={prePaymentPercent}
								onChange={(e) => setPrePaymentPercent(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">
								{t("providerPrePaymentHint")}
							</p>
						</div>
					)}
				</div>
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={allowsCustomOffer}
						onChange={(e) => setAllowsCustomOffer(e.target.checked)}
						className="size-4 rounded border-input"
					/>
					{t("providerAllowCustomPrice")}
				</label>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="description">{t("requestDescription")}</Label>
				<Textarea
					id="description"
					required
					rows={5}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>
				<p className="text-xs text-muted-foreground">
					{description.trim().length}/{SERVICE_CONSTRAINTS.minDescription} min ·{" "}
					{SERVICE_CONSTRAINTS.maxDescription} max
				</p>
			</div>

			<div className="space-y-1.5">
				<Label>{t("commonAddress")}</Label>
				<PlacesAddressField
					value={address}
					required
					onChange={setAddress}
					onLocationChange={(loc) => {
						if (!loc) return;
						setLatitude(loc.lat);
						setLongitude(loc.lng);
					}}
				/>
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between gap-2">
					<Label>{t("providerServiceImages")}</Label>
					<span className="text-xs text-muted-foreground">
						{imageSlotsUsed}/{SERVICE_CONSTRAINTS.maxImages}
					</span>
				</div>
				<div className="flex flex-wrap gap-2">
					{existingImages.map((url) => (
						<div
							key={url}
							className="relative size-20 overflow-hidden rounded-lg border border-border bg-muted"
						>
							<Image
								src={url}
								alt=""
								fill
								className="object-cover"
								unoptimized
								sizes="80px"
							/>
							<button
								type="button"
								onClick={() => removeExisting(url)}
								className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white"
								aria-label={t("commonClear")}
							>
								<XIcon className="size-3.5" />
							</button>
						</div>
					))}
					{newPreviews.map((url, i) => (
						<div
							key={url}
							className="relative size-20 overflow-hidden rounded-lg border border-border bg-muted"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={url} alt="" className="size-full object-cover" />
							<button
								type="button"
								onClick={() => removeNew(i)}
								className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white"
								aria-label={t("commonClear")}
							>
								<XIcon className="size-3.5" />
							</button>
						</div>
					))}
				</div>
				{slotsLeft > 0 ? (
					<Input
						type="file"
						accept="image/*"
						multiple
						onChange={(e) => {
							onPickFiles(e.target.files);
							e.target.value = "";
						}}
					/>
				) : null}
			</div>

			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={status}
					onChange={(e) => setStatus(e.target.checked)}
					className="size-4 rounded border-input"
				/>
				{t("providerServiceActiveListing")}
			</label>

			{mode === "edit" ? (
				<p className="text-xs text-muted-foreground">
					{t("providerServiceEditPendingHint")}
				</p>
			) : null}

			<Button type="submit" disabled={busy} className="w-full sm:w-auto">
				{busy
					? t("commonSaving")
					: mode === "edit"
						? t("commonSaveChanges")
						: t("providerAddService")}
			</Button>
		</form>
	);
}
