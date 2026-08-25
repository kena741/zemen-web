"use client";

import { useEffect, useMemo, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	fetchCategories,
	fetchSubCategories,
} from "@/services/services/servicesApi";
import type {
	ServiceCategory,
	ServiceSubCategory,
} from "@/services/services/types";
import type { Handyman, HandymanFormValues } from "@/services/handymen/types";

type HandymanFormProps = {
	mode: "create" | "edit";
	initial?: Handyman | null;
	defaultAddress?: string | null;
	busy?: boolean;
	error?: string | null;
	onSubmit: (values: HandymanFormValues) => void | Promise<void>;
};

export function HandymanForm({
	mode,
	initial,
	defaultAddress,
	busy,
	error,
	onSubmit,
}: HandymanFormProps) {
	const [firstName, setFirstName] = useState(initial?.firstName ?? "");
	const [lastName, setLastName] = useState(initial?.lastName ?? "");
	const [userName, setUserName] = useState(initial?.userName ?? "");
	const [email, setEmail] = useState(initial?.email ?? "");
	const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? "");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [address, setAddress] = useState(
		initial?.address ?? defaultAddress ?? "",
	);
	const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
	const [subCategoryId, setSubCategoryId] = useState(
		initial?.subCategoryId ?? "",
	);
	const [categories, setCategories] = useState<ServiceCategory[]>([]);
	const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>(
		[],
	);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const res = await fetchCategories();
			if (!cancelled) setCategories(res.categories);
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [categoryId]);

	const selectedCategory = useMemo(
		() => categories.find((c) => c.id === categoryId) ?? null,
		[categories, categoryId],
	);
	const selectedSub = useMemo(
		() => subCategories.find((s) => s.id === subCategoryId) ?? null,
		[subCategories, subCategoryId],
	);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		await onSubmit({
			firstName,
			lastName,
			userName,
			email,
			phoneNumber,
			password,
			categoryId,
			subCategoryId,
			category: selectedCategory?.categoryName ?? initial?.category ?? "",
			subCategory:
				selectedSub?.subCategoryName ?? initial?.subCategory ?? "",
			address,
		});
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor="firstName">First name</Label>
					<Input
						id="firstName"
						required
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="lastName">Last name</Label>
					<Input
						id="lastName"
						required
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
					/>
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="userName">Username</Label>
				<Input
					id="userName"
					required
					value={userName}
					onChange={(e) => setUserName(e.target.value)}
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					required
					disabled={mode === "edit"}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				{mode === "edit" ? (
					<p className="text-xs text-muted-foreground">
						Email can’t be changed after creation.
					</p>
				) : null}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="phone">Phone</Label>
				<Input
					id="phone"
					required
					inputMode="tel"
					placeholder="9xxxxxxxx"
					value={phoneNumber}
					onChange={(e) => setPhoneNumber(e.target.value)}
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="password">
					{mode === "create" ? "Password" : "New password (optional)"}
				</Label>
				<div className="relative">
					<Input
						id="password"
						type={showPassword ? "text" : "password"}
						required={mode === "create"}
						minLength={mode === "create" ? 6 : undefined}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder={
							mode === "edit" ? "Leave blank to keep current" : undefined
						}
						className="pr-10"
					/>
					<button
						type="button"
						className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
						onClick={() => setShowPassword((v) => !v)}
						aria-label={showPassword ? "Hide password" : "Show password"}
					>
						{showPassword ? (
							<EyeOffIcon className="size-4" />
						) : (
							<EyeIcon className="size-4" />
						)}
					</button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor="category">Category</Label>
					<select
						id="category"
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

			<div className="space-y-1.5">
				<Label htmlFor="address">Address</Label>
				<Input
					id="address"
					value={address}
					onChange={(e) => setAddress(e.target.value)}
					placeholder="Defaults to provider address"
				/>
			</div>

			<Button type="submit" disabled={busy} className="w-full sm:w-auto">
				{busy
					? "Saving…"
					: mode === "create"
						? "Create handyman"
						: "Save changes"}
			</Button>
		</form>
	);
}
