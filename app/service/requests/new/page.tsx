"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, ImagePlusIcon, XIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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
const MAX_DESC = 500;
const MAX_IMAGES = 6;
const BUDGET_CHIPS = [500, 1000, 2500, 5000] as const;

type ImageDraft = { id: string; file: File; previewUrl: string };

export default function NewRequestPage() {
	const { t } = useLocale();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const customerId = user?.customer?.id ?? user?.id ?? "";
	const [serviceName, setServiceName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState(String(MIN_BUDGET));
	const [categoryId, setCategoryId] = useState("");
	const [subCategoryId, setSubCategoryId] = useState("");
	const [categories, setCategories] = useState<ServiceCategory[]>([]);
	const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);
	const [images, setImages] = useState<ImageDraft[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const imagesRef = useRef(images);
	imagesRef.current = images;

	useEffect(() => {
		return () => {
			for (const img of imagesRef.current) {
				URL.revokeObjectURL(img.previewUrl);
			}
		};
	}, []);

	function appendImages(list: FileList | File[] | null) {
		if (!list) return;
		const incoming = Array.from(list);
		if (!incoming.length) return;
		setImages((prev) => {
			const room = MAX_IMAGES - prev.length;
			if (room <= 0) return prev;
			const added = incoming.slice(0, room).map((file) => ({
				id: crypto.randomUUID(),
				file,
				previewUrl: URL.createObjectURL(file),
			}));
			return [...prev, ...added];
		});
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	function removeImage(id: string) {
		setImages((prev) => {
			const target = prev.find((img) => img.id === id);
			if (target) URL.revokeObjectURL(target.previewUrl);
			return prev.filter((img) => img.id !== id);
		});
	}

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

		const uploadedUrls: string[] = [];
		for (const img of images) {
			const uploaded = await uploadCustomerServiceImage({
				customerId,
				file: img.file,
			});
			if (uploaded.error) {
				setBusy(false);
				setError(uploaded.error);
				return;
			}
			if (uploaded.url) uploadedUrls.push(uploaded.url);
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
			serviceImage: uploadedUrls,
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

	const descLen = description.length;
	const priceNum = Number(price) || 0;

	return (
		<div className="mx-auto max-w-lg px-4 pb-28 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href="/service/requests" label={t("requestsTitle")} />
			<h1 className="mt-2 text-[26px] font-bold tracking-tight text-foreground">
				{t("requestNew")}
			</h1>
			<p className="mt-1 text-[14px] leading-snug text-muted-foreground">
				{t("requestNewSubtitle")}
			</p>

			<form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-5">
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<div className="space-y-2">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/png,image/jpeg,image/heic,image/webp"
						multiple
						className="sr-only"
						onChange={(e) => appendImages(e.target.files)}
					/>
					{images.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{images.map((img) => (
								<div
									key={img.id}
									className="relative size-20 overflow-hidden rounded-xl bg-muted"
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={img.previewUrl}
										alt=""
										className="size-full object-cover"
									/>
									<button
										type="button"
										aria-label={t("commonClose")}
										className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
										onClick={() => removeImage(img.id)}
									>
										<XIcon className="size-3.5" />
									</button>
								</div>
							))}
							{images.length < MAX_IMAGES ? (
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#b8c4b0] bg-[#f7faf5] text-primary hover:bg-[#f0f5ec]"
								>
									<ImagePlusIcon className="size-5" />
									<span className="text-[10px] font-semibold">
										{images.length}/{MAX_IMAGES}
									</span>
								</button>
							) : null}
						</div>
					) : (
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#b8c4b0] bg-[#f7faf5] px-4 py-8 text-center transition-colors hover:bg-[#f0f5ec]"
						>
							<span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
								<ImagePlusIcon className="size-6" />
							</span>
							<p className="text-[14px] text-foreground">
								<span className="font-semibold text-primary">
									{t("requestTapUpload")}
								</span>{" "}
								{t("requestOrDropPhotos")}
							</p>
							<p className="text-[12px] text-muted-foreground">
								{t("requestImageHint")}
							</p>
						</button>
					)}
				</div>

				<div className="space-y-1.5">
					<label
						htmlFor="name"
						className="text-[11px] font-bold tracking-[0.08em] text-foreground uppercase"
					>
						{t("providerServiceName")} *
					</label>
					<input
						id="name"
						required
						value={serviceName}
						onChange={(e) => setServiceName(e.target.value)}
						placeholder={t("requestServiceNamePlaceholder")}
						className="h-12 w-full rounded-xl border-0 bg-[#eef3ea] px-4 text-[15px] outline-none ring-primary/0 transition focus:bg-white focus:ring-2 focus:ring-primary/25"
					/>
				</div>

				<div className="space-y-1.5">
					<p className="text-[11px] font-bold tracking-[0.08em] text-foreground uppercase">
						{t("providerSelectCategory")} *
					</p>
					<SearchableSelect
						options={categories.map((c) => ({
							id: c.id,
							label: c.categoryName ?? c.id,
						}))}
						value={categoryId}
						onChange={setCategoryId}
						placeholder={t("requestSelectCategory")}
						triggerClassName="h-12 rounded-xl border-0 bg-[#eef3ea] focus-visible:bg-white"
					/>
				</div>

				{categoryId ? (
					<div className="space-y-1.5">
						<p className="text-[11px] font-bold tracking-[0.08em] text-foreground uppercase">
							{t("providerSelectSubcategory")} *
						</p>
						<SearchableSelect
							options={subCategories.map((s) => ({
								id: s.id,
								label: s.subCategoryName ?? s.id,
							}))}
							value={subCategoryId}
							onChange={setSubCategoryId}
							placeholder={t("providerSelectSubcategory")}
							disabled={subCategories.length === 0}
							triggerClassName="h-12 rounded-xl border-0 bg-[#eef3ea] focus-visible:bg-white"
						/>
					</div>
				) : null}

				<div className="space-y-1.5">
					<div className="flex items-end justify-between gap-2">
						<label
							htmlFor="desc"
							className="text-[11px] font-bold tracking-[0.08em] text-foreground uppercase"
						>
							{t("requestDescription")} *
						</label>
						<span className="text-[12px] tabular-nums text-muted-foreground">
							{descLen} / {MAX_DESC}
						</span>
					</div>
					<textarea
						id="desc"
						required
						rows={4}
						value={description}
						onChange={(e) =>
							setDescription(e.target.value.slice(0, MAX_DESC))
						}
						placeholder={t("requestDescPlaceholder")}
						className="min-h-[110px] w-full resize-y rounded-xl border-0 bg-[#eef3ea] px-4 py-3 text-[15px] leading-relaxed outline-none focus:bg-white focus:ring-2 focus:ring-primary/25"
					/>
				</div>

				<div className="space-y-2">
					<label
						htmlFor="budget"
						className="text-[11px] font-bold tracking-[0.08em] text-foreground uppercase"
					>
						{t("requestBudget")} *
					</label>
					<div className="relative">
						<input
							id="budget"
							type="number"
							min={MIN_BUDGET}
							required
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							className="h-12 w-full rounded-xl border-0 bg-[#eef3ea] px-4 pr-28 text-[15px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/25"
						/>
						<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
							{t("requestCurrencyEtb")}
						</span>
					</div>
					<div className="flex flex-wrap gap-2">
						{BUDGET_CHIPS.map((chip) => (
							<button
								key={chip}
								type="button"
								onClick={() => setPrice(String(chip))}
								className={cn(
									"rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
									priceNum === chip
										? "bg-primary/15 text-primary"
										: "bg-[#eef3ea] text-foreground hover:bg-[#e4ecde]",
								)}
							>
								{chip.toLocaleString()}
							</button>
						))}
					</div>
				</div>

				<Button
					type="submit"
					disabled={busy}
					className="h-12 w-full gap-2 rounded-2xl text-[15px] font-semibold"
				>
					{busy ? t("requestPosting") : t("requestPostButton")}
					{!busy ? <ArrowRightIcon className="size-4" /> : null}
				</Button>
			</form>
		</div>
	);
}
