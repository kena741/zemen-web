"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";

import { PlacesAddressField } from "@/components/addresses/places-address-field";
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
	"w-full rounded-xl border-0 bg-[#eef3ea] px-4 py-3.5 text-[15px] text-foreground outline-none transition-[box-shadow,background-color] placeholder:text-muted-foreground/70 focus:bg-white focus:ring-2 focus:ring-primary/25";

function Section({
	step,
	title,
	hint,
	children,
}: {
	step: string;
	title: string;
	hint?: string;
	children: ReactNode;
}) {
	return (
		<section className="relative space-y-4 pt-2">
			<div className="flex items-end gap-3">
				<span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-primary/70">
					{step}
				</span>
				<div className="min-w-0 flex-1 border-b border-primary/10 pb-2">
					<h2 className="text-[17px] font-semibold tracking-tight text-foreground text-balance">
						{title}
					</h2>
					{hint ? (
						<p className="mt-0.5 text-[13px] text-muted-foreground">{hint}</p>
					) : null}
				</div>
			</div>
			{children}
		</section>
	);
}

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
					: "bg-[#e8efe3] text-foreground hover:bg-[#dce8d4]",
			)}
		>
			{children}
		</button>
	);
}

function ToggleRow({
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
				"flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors duration-150",
				"bg-[#eef3ea] hover:bg-[#e4ecde]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
			)}
		>
			<span className="min-w-0">
				<span className="block text-[14px] font-medium text-foreground">
					{label}
				</span>
				{description ? (
					<span className="mt-0.5 block text-[12px] text-muted-foreground">
						{description}
					</span>
				) : null}
			</span>
			<span
				className={cn(
					"relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150",
					checked ? "bg-primary" : "bg-black/15",
				)}
			>
				<span
					className={cn(
						"absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-150",
						checked && "translate-x-5",
					)}
				/>
			</span>
		</button>
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
		const pct = initial?.prePaymentPercent;
		return pct === 10 ? 10 : 100;
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

	const descLen = description.trim().length;

	return (
		<form onSubmit={(e) => void handleSubmit(e)} className="space-y-10 pb-28">
			{error ? (
				<div
					role="alert"
					className="rounded-2xl bg-destructive/10 px-4 py-3 text-[14px] text-destructive"
				>
					{error}
				</div>
			) : null}

			<Section step="01" title={t("providerServiceName")}>
				<input
					id="name"
					required
					value={serviceName}
					onChange={(e) => setServiceName(e.target.value)}
					placeholder={t("providerServiceNamePlaceholder")}
					className={fieldClass}
				/>
			</Section>

			<Section
				step="02"
				title={t("commonCategory")}
				hint={t("providerSelectCategory")}
			>
				<div className="flex flex-wrap gap-2">
					{loadingMeta ? (
						<p className="text-[13px] text-muted-foreground">
							{t("commonLoading")}
						</p>
					) : (
						categories.map((c) => (
							<Chip
								key={c.id}
								selected={categoryId === c.id}
								onClick={() => {
									setCategoryId(c.id);
									setSubCategoryId("");
								}}
							>
								{c.categoryName}
							</Chip>
						))
					)}
				</div>
				{categoryId ? (
					<div className="space-y-2 pt-2">
						<p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
							{t("providerSubcategory")}
						</p>
						<div className="flex flex-wrap gap-2">
							{subCategories.length === 0 ? (
								<p className="text-[13px] text-muted-foreground">…</p>
							) : (
								subCategories.map((s) => (
									<Chip
										key={s.id}
										selected={subCategoryId === s.id}
										onClick={() => setSubCategoryId(s.id)}
									>
										{s.subCategoryName}
									</Chip>
								))
							)}
						</div>
					</div>
				) : null}
			</Section>

			<Section step="03" title={t("bookServicePayment")}>
				{(recurringSettings.enabled || isRecurring) ? (
					<div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#e8efe3] p-1.5">
						{(
							[
								["ONE_TIME", t("pricingOneTime")],
								["RECURRING", t("pricingRecurring")],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type="button"
								aria-pressed={pricingType === value}
								onClick={() => setPricingType(value)}
								className={cn(
									"rounded-xl py-3 text-[14px] font-semibold transition-colors duration-150",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
									pricingType === value
										? "bg-white text-primary shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{label}
							</button>
						))}
					</div>
				) : null}

				<div className="grid gap-3 sm:grid-cols-2">
					<label className="block space-y-1.5">
						<span className="text-[12px] font-medium text-muted-foreground">
							{t("commonPrice")} (ETB)
						</span>
						<input
							type="number"
							min={SERVICE_CONSTRAINTS.minPrice}
							step="1"
							required
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							className={fieldClass}
						/>
					</label>
					<label className="block space-y-1.5">
						<span className="text-[12px] font-medium text-muted-foreground">
							{t("commonDiscount")} % ({t("commonOptional")}) ·{" "}
							{SERVICE_CONSTRAINTS.minDiscount}–
							{SERVICE_CONSTRAINTS.maxDiscount}
						</span>
						<input
							type="number"
							min={SERVICE_CONSTRAINTS.minDiscount}
							max={SERVICE_CONSTRAINTS.maxDiscount}
							step="1"
							value={discount}
							onChange={(e) => setDiscount(e.target.value)}
							placeholder={`${SERVICE_CONSTRAINTS.minDiscount}–${SERVICE_CONSTRAINTS.maxDiscount}`}
							className={fieldClass}
						/>
					</label>
				</div>

				{isRecurring ? (
					<div className="space-y-3">
						<p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
							{t("billingInterval")}
						</p>
						<div className="flex flex-wrap gap-2">
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
					</div>
				) : (
					<div className="space-y-3">
						<p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
							{t("providerPrePaymentPercent")}
						</p>
						<div className="flex flex-wrap gap-2">
							{SERVICE_CONSTRAINTS.prePaymentPercents.map((pct) => (
								<Chip
									key={pct}
									selected={prePaymentPercent === pct}
									onClick={() => setPrePaymentPercent(pct)}
								>
									{pct}%
								</Chip>
							))}
						</div>
						<p className="text-[12px] text-muted-foreground">
							{t("providerPrePaymentHint")}
						</p>
					</div>
				)}

				{!isRecurring ? (
					<ToggleRow
						checked={allowsCustomOffer}
						onChange={setAllowsCustomOffer}
						label={t("providerAllowCustomPrice")}
					/>
				) : null}
			</Section>

			<Section step="04" title={t("requestDescription")}>
				<textarea
					required
					rows={5}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className={cn(fieldClass, "min-h-[140px] resize-y leading-relaxed")}
				/>
				<p className="text-[12px] text-muted-foreground tabular-nums">
					{descLen}/{SERVICE_CONSTRAINTS.minDescription} min ·{" "}
					{SERVICE_CONSTRAINTS.maxDescription} max
				</p>
			</Section>

			<Section step="05" title={t("commonAddress")}>
				<div className="rounded-2xl bg-[#eef3ea] p-3 [&_input]:border-0 [&_input]:bg-white/80 [&_input]:shadow-none">
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
			</Section>

			<Section
				step="06"
				title={t("providerServiceImages")}
				hint={`${imageSlotsUsed}/${SERVICE_CONSTRAINTS.maxImages}`}
			>
				<div className="flex flex-wrap gap-3">
					{existingImages.map((url) => (
						<div
							key={url}
							className="relative size-[88px] overflow-hidden rounded-2xl bg-[#e8efe3]"
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
							className="relative size-[88px] overflow-hidden rounded-2xl bg-[#e8efe3]"
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
						<label className="flex size-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-primary/25 bg-[#eef3ea] text-primary transition-colors hover:bg-[#e4ecde]">
							<ImagePlusIcon className="size-5" />
							<span className="text-[11px] font-medium">{t("commonAdd")}</span>
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
			</Section>

			<ToggleRow
				checked={status}
				onChange={setStatus}
				label={t("providerServiceActiveListing")}
			/>

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
							"h-12 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(23,67,9,0.55)] transition-[transform,opacity] duration-150",
							"hover:opacity-95 active:scale-[0.99]",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
							"disabled:cursor-not-allowed disabled:opacity-60",
						)}
					>
						{busy
							? t("commonSaving")
							: mode === "edit"
								? t("commonSaveChanges")
								: t("providerAddService")}
					</button>
				</div>
			</div>
		</form>
	);
}
