"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";

import { PlacesAddressField } from "@/components/addresses/places-address-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
	type RecurringPaymentSettings,
	RECURRING_PAYMENT_SETTINGS_DEFAULT,
} from "@/lib/recurring";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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

const fieldClass =
	"h-12 w-full rounded-xl border border-[#cfd8c9] bg-white px-4 text-[15px] text-foreground outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20";

function Chip({
	selected,
	disabled,
	onClick,
	children,
}: {
	selected: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			aria-pressed={selected}
			className={cn(
				"rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-150",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
				"disabled:cursor-not-allowed disabled:opacity-40",
				selected
					? "bg-primary text-primary-foreground shadow-sm"
					: "bg-[#f3f5f1] text-foreground hover:bg-[#e8ebe4]",
			)}
		>
			{children}
		</button>
	);
}

function ToggleCard({
	checked,
	onChange,
	label,
	description,
}: {
	checked: boolean;
	onChange: (next: boolean) => void;
	label: string;
	description?: string;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={cn(
				"flex w-full items-center justify-between gap-4 rounded-xl bg-[#f5f5f5] px-4 py-3.5 text-left transition-colors duration-150",
				"hover:bg-[#efefef]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
			)}
		>
			<span className="min-w-0">
				<span className="block text-[15px] font-semibold text-foreground">
					{label}
				</span>
				{description ? (
					<span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
						{description}
					</span>
				) : null}
			</span>
			<span
				className={cn(
					"relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150",
					checked ? "bg-primary" : "bg-[#d0d0d0]",
				)}
			>
				<span
					className={cn(
						"absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform duration-150",
						checked && "translate-x-5",
					)}
				/>
			</span>
		</button>
	);
}

function SuffixField({
	suffix,
	className,
	...props
}: React.ComponentProps<"input"> & { suffix: string }) {
	return (
		<div className="relative">
			<input {...props} className={cn(fieldClass, "pr-12", className)} />
			<span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[14px] font-medium text-muted-foreground">
				{suffix}
			</span>
		</div>
	);
}

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
	const isRecurring = pricingType === "RECURRING";
	const [prePaymentPercent, setPrePaymentPercent] = useState(() => {
		const pct = Number(initial?.prePaymentPercent);
		if (
			Number.isFinite(pct) &&
			pct >= SERVICE_CONSTRAINTS.minPrePaymentPercent &&
			pct <= SERVICE_CONSTRAINTS.maxPrePaymentPercent
		) {
			return Math.round(pct);
		}
		return 100;
	});
	const [prePaymentInput, setPrePaymentInput] = useState(() => {
		const pct = Number(initial?.prePaymentPercent);
		if (
			Number.isFinite(pct) &&
			pct >= SERVICE_CONSTRAINTS.minPrePaymentPercent &&
			pct <= SERVICE_CONSTRAINTS.maxPrePaymentPercent
		) {
			return String(Math.round(pct));
		}
		return "100";
	});
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
		const allowed = new Set(recurringSettings.availableCycles);
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
		if (!categoryId || !subCategoryId) {
			setError(t("providerSelectCategory"));
			return;
		}
		setBusy(true);
		setError(null);

		const discountTrim = discount.trim();
		if (discountTrim) {
			const d = Number(discountTrim);
			if (
				Number.isNaN(d) ||
				d < SERVICE_CONSTRAINTS.minDiscount ||
				d > SERVICE_CONSTRAINTS.maxDiscount
			) {
				setError(
					`Discount must be between ${SERVICE_CONSTRAINTS.minDiscount} and ${SERVICE_CONSTRAINTS.maxDiscount}.`,
				);
				setBusy(false);
				return;
			}
		}

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
				discount: discountTrim,
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
				billingIntervalCount: isRecurring ? 1 : undefined,
				prePayment: !isRecurring,
				prePaymentPercent: isRecurring ? 100 : prePaymentPercent,
				allowsCustomOffer: isRecurring ? false : allowsCustomOffer,
			},
		});

		setBusy(false);
		if (!res.serviceId) {
			setError(res.error);
			return;
		}
		onSuccess(res.serviceId);
	}

	const descLen = description.length;

	return (
		<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pb-28">
			{error ? (
				<div
					role="alert"
					className="rounded-xl bg-destructive/10 px-4 py-3 text-[14px] text-destructive"
				>
					{error}
				</div>
			) : null}

			{/* Images — dashed picker first, matching mobile */}
			<div className="space-y-3">
				{imageSlotsUsed === 0 && slotsLeft > 0 ? (
					<label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#b8c4b0] bg-white px-4 py-8 text-center transition-colors hover:bg-[#fafbf9]">
						<ImagePlusIcon className="size-8 text-muted-foreground/70" />
						<span className="text-[15px] font-medium text-foreground">
							{t("providerChooseImage")}
						</span>
						<span className="text-[13px] text-muted-foreground">
							{t("providerMaxImages", {
								count: SERVICE_CONSTRAINTS.maxImages,
							})}
						</span>
						<input
							type="file"
							accept="image/*"
							multiple
							className="sr-only"
							onChange={(e) => {
								onPickFiles(e.target.files);
								e.target.value = "";
							}}
						/>
					</label>
				) : (
					<div className="flex flex-wrap gap-3">
						{existingImages.map((url) => (
							<div
								key={url}
								className="relative size-[88px] overflow-hidden rounded-xl border border-[#cfd8c9] bg-[#f5f5f5]"
							>
								<Image
									src={url}
									alt=""
									fill
									className="object-cover"
									unoptimized
									sizes="88px"
								/>
								<button
									type="button"
									onClick={() => removeExisting(url)}
									className="absolute top-1.5 right-1.5 rounded-full bg-black/55 p-1 text-white"
									aria-label={t("commonClear")}
								>
									<XIcon className="size-3.5" />
								</button>
							</div>
						))}
						{newPreviews.map((url, i) => (
							<div
								key={url}
								className="relative size-[88px] overflow-hidden rounded-xl border border-[#cfd8c9] bg-[#f5f5f5]"
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={url} alt="" className="size-full object-cover" />
								<button
									type="button"
									onClick={() => removeNew(i)}
									className="absolute top-1.5 right-1.5 rounded-full bg-black/55 p-1 text-white"
									aria-label={t("commonClear")}
								>
									<XIcon className="size-3.5" />
								</button>
							</div>
						))}
						{slotsLeft > 0 ? (
							<label className="flex size-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#b8c4b0] bg-white text-muted-foreground transition-colors hover:bg-[#fafbf9]">
								<ImagePlusIcon className="size-5" />
								<span className="text-[11px] font-medium">
									{t("commonAdd")}
								</span>
								<input
									type="file"
									accept="image/*"
									multiple
									className="sr-only"
									onChange={(e) => {
										onPickFiles(e.target.files);
										e.target.value = "";
									}}
								/>
							</label>
						) : null}
					</div>
				)}
			</div>

			<input
				id="name"
				required
				value={serviceName}
				onChange={(e) => setServiceName(e.target.value)}
				placeholder={t("providerServiceNamePlaceholder")}
				aria-label={t("providerServiceName")}
				className={fieldClass}
			/>

			{loadingMeta ? (
				<p className="text-[13px] text-muted-foreground">{t("commonLoading")}</p>
			) : (
				<div className="space-y-3">
					<SearchableSelect
						options={categories.map((c) => ({
							id: c.id,
							label: c.categoryName ?? c.id,
						}))}
						value={categoryId}
						onChange={(id) => {
							setCategoryId(id);
							setSubCategoryId("");
						}}
						placeholder={t("providerSelectCategory")}
					/>
					{categoryId ? (
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
					) : null}
				</div>
			)}

			<PlacesAddressField
				value={address}
				required
				label={undefined}
				compact
				placeholder={t("providerServiceAddress")}
				onChange={setAddress}
				onLocationChange={(loc) => {
					if (!loc) return;
					setLatitude(loc.lat);
					setLongitude(loc.lng);
				}}
				inputClassName="h-12 rounded-xl border border-[#cfd8c9] bg-white px-4 text-[15px] shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
				className="space-y-2"
			/>

			<SuffixField
				type="number"
				min={SERVICE_CONSTRAINTS.minPrice}
				step="1"
				required
				value={price}
				onChange={(e) => setPrice(e.target.value)}
				placeholder={t("commonPrice")}
				aria-label={`${t("commonPrice")} (ETB)`}
				suffix="ETB"
			/>

			<div className="space-y-1.5">
				<SuffixField
					type="number"
					min={SERVICE_CONSTRAINTS.minDiscount}
					max={SERVICE_CONSTRAINTS.maxDiscount}
					step="1"
					value={discount}
					onChange={(e) => setDiscount(e.target.value)}
					placeholder={t("commonDiscount")}
					aria-label={t("commonDiscount")}
					suffix="%"
				/>
				<p className="px-0.5 text-[12px] text-muted-foreground">
					{t("providerAdminCommission")}: -- · Max{" "}
					{SERVICE_CONSTRAINTS.maxDiscount}%
				</p>
			</div>

			{!isRecurring ? (
				<fieldset className="relative rounded-xl border border-[#cfd8c9] px-3 pb-2 pt-3">
					<legend className="ml-1 px-1 text-[12px] font-medium text-muted-foreground">
						{t("providerPrePaymentPercent")}
					</legend>
					<div className="relative">
						<input
							type="number"
							inputMode="numeric"
							min={SERVICE_CONSTRAINTS.minPrePaymentPercent}
							max={SERVICE_CONSTRAINTS.maxPrePaymentPercent}
							step="1"
							required
							value={prePaymentInput}
							onChange={(e) => {
								const raw = e.target.value.replace(/[^\d]/g, "");
								setPrePaymentInput(raw);
								const n = Number(raw);
								if (
									Number.isFinite(n) &&
									n >= SERVICE_CONSTRAINTS.minPrePaymentPercent &&
									n <= SERVICE_CONSTRAINTS.maxPrePaymentPercent
								) {
									setPrePaymentPercent(n);
								}
							}}
							onBlur={() => {
								const n = Number(prePaymentInput);
								const clamped = Number.isFinite(n)
									? Math.min(
											SERVICE_CONSTRAINTS.maxPrePaymentPercent,
											Math.max(
												SERVICE_CONSTRAINTS.minPrePaymentPercent,
												Math.round(n),
											),
										)
									: SERVICE_CONSTRAINTS.maxPrePaymentPercent;
								setPrePaymentPercent(clamped);
								setPrePaymentInput(String(clamped));
							}}
							className="h-10 w-full border-0 bg-transparent px-1 text-[15px] outline-none"
						/>
						<span className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-[14px] font-medium text-muted-foreground">
							%
						</span>
					</div>
				</fieldset>
			) : null}

			{(recurringSettings.enabled || isRecurring) ? (
				<div className="space-y-3">
					<ToggleCard
						checked={isRecurring}
						onChange={(on) =>
							setPricingType(on ? "RECURRING" : "ONE_TIME")
						}
						label={t("providerEnableRecurringPayment")}
						description={t("providerRecurringPaymentDesc")}
					/>
					{isRecurring ? (
						<div className="flex flex-wrap gap-2 px-0.5">
							{intervalOptions.map((o) => (
								<Chip
									key={o.value}
									selected={billingInterval === o.value}
									onClick={() => setBillingInterval(o.value)}
								>
									{o.label}
								</Chip>
							))}
						</div>
					) : null}
				</div>
			) : null}

			{!isRecurring ? (
				<ToggleCard
					checked={allowsCustomOffer}
					onChange={setAllowsCustomOffer}
					label={t("providerAllowCustomPrice")}
					description={t("providerAllowCustomPriceDesc")}
				/>
			) : null}

			<ToggleCard
				checked={status}
				onChange={setStatus}
				label={t("providerServiceActiveListing")}
				description={t("providerServiceVisibleHint")}
			/>

			<div className="relative">
				<textarea
					required
					rows={5}
					value={description}
					onChange={(e) =>
						setDescription(
							e.target.value.slice(0, SERVICE_CONSTRAINTS.maxDescription),
						)
					}
					placeholder={t("requestDescription")}
					className={cn(
						"min-h-[120px] w-full resize-y rounded-xl border border-[#cfd8c9] bg-white px-4 py-3 pb-8 text-[15px] leading-relaxed text-foreground outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
					)}
				/>
				<p className="pointer-events-none absolute right-3 bottom-3 text-[12px] tabular-nums text-muted-foreground">
					{descLen} / {SERVICE_CONSTRAINTS.maxDescription}
				</p>
			</div>

			{mode === "edit" ? (
				<p className="text-[12px] text-muted-foreground">
					{t("providerServiceEditPendingHint")}
				</p>
			) : null}

			<div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center p-4 lg:pl-60">
				<div className="pointer-events-auto w-full max-w-2xl">
					<button
						type="submit"
						disabled={busy}
						className={cn(
							"h-12 w-full rounded-xl bg-primary text-[16px] font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(23,67,9,0.55)] transition-[transform,opacity] duration-150",
							"hover:opacity-95 active:scale-[0.99]",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
							"disabled:cursor-not-allowed disabled:opacity-60",
						)}
					>
						{busy ? t("commonSaving") : t("commonSave")}
					</button>
				</div>
			</div>
		</form>
	);
}
