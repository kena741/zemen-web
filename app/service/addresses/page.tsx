"use client";

import { MapPinIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { AddressForm } from "@/components/addresses/address-form";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import {
	deleteCustomerAddress,
	upsertCustomerAddress,
	type CustomerAddress,
} from "@/services/customer/addressesApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateAddresses } from "@/store/customerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedAddresses } from "@/store/useCustomerCache";

export default function AddressesPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const dispatch = useAppDispatch();
	const customerId = user?.customer?.id ?? user?.id ?? "";
	const { data: addresses, loading, error, refresh } =
		useCachedAddresses({
			customerId,
			authUserId: user?.id,
		});

	const [editing, setEditing] = useState<CustomerAddress | null | "new">(null);
	const [busy, setBusy] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);

	async function saveAddress(addr: CustomerAddress) {
		setBusy(true);
		setLocalError(null);
		const res = await upsertCustomerAddress({
			customerId,
			authUserId: user?.id,
			address: addr,
		});
		setBusy(false);
		if (!res.ok) {
			setLocalError(res.error);
			return;
		}
		dispatch(invalidateAddresses());
		setEditing(null);
		refresh();
	}

	async function removeAddress(id: string) {
		if (!window.confirm(t("addressesDeleteConfirm"))) return;
		setBusy(true);
		const res = await deleteCustomerAddress({
			customerId,
			authUserId: user?.id,
			addressId: id,
		});
		setBusy(false);
		if (!res.ok) {
			setLocalError(res.error);
			return;
		}
		dispatch(invalidateAddresses());
		refresh();
	}

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href="/service/profile" label={t("profileTitle")} />
			<h1 className="admin-page-title">{t("addressesTitle")}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{t("addressesSubtitle")}
			</p>

			{error || localError ? (
				<p className="mt-4 text-sm text-destructive">{error ?? localError}</p>
			) : null}

			{editing ? (
				<div className="mt-5">
					<AddressForm
						initial={editing === "new" ? null : editing}
						onSave={saveAddress}
						onCancel={() => setEditing(null)}
					/>
				</div>
			) : (
				<Button
					type="button"
					variant="outline"
					className="mt-5 gap-2"
					onClick={() => setEditing("new")}
				>
					<PlusIcon className="size-4" />
					{t("addressesAdd")}
				</Button>
			)}

			<div className="mt-5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
				{loading ? (
					<ServiceLoading compact />
				) : addresses.length === 0 ? (
					<div className="px-4 py-12 text-center">
						<MapPinIcon className="mx-auto size-8 text-muted-foreground/50" />
						<p className="mt-3 text-sm text-muted-foreground">
							{t("addressesNoSaved")}
						</p>
					</div>
				) : (
					addresses.map((a) => (
						<div
							key={a.id}
							className="flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-b-0"
						>
							<MapPinIcon className="mt-0.5 size-5 shrink-0 text-primary" />
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold">
									{a.label}
									{a.isDefault ? (
										<span className="ml-2 text-[10px] font-medium text-primary">
											{t("commonDefault")}
										</span>
									) : null}
								</p>
								<p className="mt-0.5 text-xs text-muted-foreground">{a.full}</p>
							</div>
							<div className="flex shrink-0 gap-1">
								<button
									type="button"
									disabled={busy}
									className="rounded-md p-2 text-muted-foreground hover:bg-muted"
									onClick={() =>
										setEditing({
											id: a.id,
											address: a.full,
											addressAs: a.label,
											isDefault: a.isDefault,
										})
									}
								>
									<PencilIcon className="size-4" />
								</button>
								<button
									type="button"
									disabled={busy}
									className="rounded-md p-2 text-destructive hover:bg-muted"
									onClick={() => void removeAddress(a.id)}
								>
									<Trash2Icon className="size-4" />
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
