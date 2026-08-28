"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { XIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function ServiceForm({
	mode,
	providerId,
	authUserId,
	initial,
	onSuccess,
}: ServiceFormProps) {
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
	const [latitude, setLatitude] = useState(
		initial?.latitude != null ? String(initial.latitude) : "",
	);
	const [longitude, setLongitude] = useState(
		initial?.longitude != null ? String(initial.longitude) : "",
	);
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
	const [existingImages, setExistingImages] = useState<string[]>(
		initial?.serviceImage ?? [],
	);
	const [newFiles, setNewFiles] = useState<File[]>([]);
	const [newPreviews, setNewPreviews] = useState<string[]>([]);
	const [loadingMeta, setLoadingMeta] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
				latitude: latitude.trim() ? Number(latitude) : 0,
				longitude: longitude.trim() ? Number(longitude) : 0,
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
		<form onSubmit={handleSubmit} className="space-y-5">
			{error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<div className="space-y-1.5">
				<Label htmlFor="name">Service name</Label>
				<Input
					id="name"
					required
					value={serviceName}
					onChange={(e) => setServiceName(e.target.value)}
					placeholder="e.g. Deep house cleaning"
				/>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor="category">Category</Label>
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
						<option value="">Select category</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.categoryName}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="subcategory">Subcategory</Label>
					<select
						id="subcategory"
						required
						disabled={!categoryId}
						value={subCategoryId}
						onChange={(e) => setSubCategoryId(e.target.value)}
						className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						<option value="">Select subcategory</option>
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
					<Label htmlFor="price">Price (ETB)</Label>
					<Input
						id="price"
						type="number"
						min={SERVICE_CONSTRAINTS.minPrice}
						step="1"
						required
						value={price}
						onChange={(e) => setPrice(e.target.value)}
					/>
					<p className="text-xs text-muted-foreground">
						Minimum {SERVICE_CONSTRAINTS.minPrice} ETB
					</p>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="discount">Discount % (optional)</Label>
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

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor="pricing-type">Pricing</Label>
					<select
						id="pricing-type"
						value={pricingType}
						onChange={(e) => setPricingType(e.target.value)}
						className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
					>
						<option value="ONE_TIME">One-time</option>
						<option value="RECURRING">Recurring</option>
					</select>
				</div>
				{pricingType === "RECURRING" ? (
					<div className="space-y-1.5">
						<Label htmlFor="billing-interval">Billing interval</Label>
						<select
							id="billing-interval"
							value={billingInterval}
							onChange={(e) => setBillingInterval(e.target.value)}
							className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
						>
							<option value="WEEK">Weekly</option>
							<option value="MONTH">Monthly</option>
							<option value="QUARTER">Quarterly</option>
							<option value="YEAR">Yearly</option>
						</select>
					</div>
				) : null}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					required
					rows={5}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Describe what’s included…"
				/>
				<p className="text-xs text-muted-foreground">
					{description.trim().length}/{SERVICE_CONSTRAINTS.minDescription} min ·{" "}
					{SERVICE_CONSTRAINTS.maxDescription} max
				</p>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="address">Address / service area</Label>
				<Input
					id="address"
					required
					value={address}
					onChange={(e) => setAddress(e.target.value)}
					placeholder="Neighborhood, city"
				/>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor="lat">Latitude (optional)</Label>
					<Input
						id="lat"
						type="number"
						step="any"
						value={latitude}
						onChange={(e) => setLatitude(e.target.value)}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="lng">Longitude (optional)</Label>
					<Input
						id="lng"
						type="number"
						step="any"
						value={longitude}
						onChange={(e) => setLongitude(e.target.value)}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between gap-2">
					<Label>Images</Label>
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
								aria-label="Remove image"
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
								aria-label="Remove image"
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
				Active listing
			</label>

			{mode === "edit" ? (
				<p className="text-xs text-muted-foreground">
					Saving edits sets the listing back to pending approval.
				</p>
			) : null}

			<Button type="submit" disabled={busy} className="w-full sm:w-auto">
				{busy
					? "Saving…"
					: mode === "edit"
						? "Save changes"
						: "Create service"}
			</Button>
		</form>
	);
}
