"use client";

import { useState } from "react";

import { PlacesAddressField } from "@/components/addresses/places-address-field";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import type { CustomerAddress } from "@/services/customer/addressesApi";

interface AddressFormProps {
	initial?: CustomerAddress | null;
	onSave: (address: CustomerAddress) => Promise<void>;
	onCancel: () => void;
}

export function AddressForm({ initial, onSave, onCancel }: AddressFormProps) {
	const { t } = useLocale();
	const [label, setLabel] = useState(
		initial?.addressAs ?? t("addressesDefaultHome"),
	);
	const [address, setAddress] = useState(initial?.address ?? "");
	const [locality, setLocality] = useState(initial?.locality ?? "");
	const [landmark, setLandmark] = useState(initial?.landmark ?? "");
	const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
	const [location, setLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(initial?.location ?? null);
	const [busy, setBusy] = useState(false);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!address.trim()) return;
		setBusy(true);
		await onSave({
			id: initial?.id ?? crypto.randomUUID(),
			address: address.trim(),
			locality: locality.trim() || undefined,
			landmark: landmark.trim() || undefined,
			addressAs: label.trim() || t("addressesDefaultHome"),
			isDefault,
			location: location ?? undefined,
		});
		setBusy(false);
	}

	return (
		<form
			onSubmit={(e) => void submit(e)}
			className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
		>
			<Field>
				<FieldLabel htmlFor="addr-label">{t("addressesLabel")}</FieldLabel>
				<Input
					id="addr-label"
					value={label}
					onChange={(e) => setLabel(e.target.value)}
					placeholder={t("addressesLabelPlaceholder")}
					className="bg-white"
				/>
			</Field>
			<PlacesAddressField
				id="addr-street"
				label={t("addressesStreet")}
				value={address}
				required
				placeholder={t("addressesStreetPlaceholder")}
				onChange={setAddress}
				onLocationChange={(loc) => {
					if (!loc) {
						setLocation(null);
						return;
					}
					setLocation({ latitude: loc.lat, longitude: loc.lng });
				}}
			/>
			<Field>
				<FieldLabel htmlFor="addr-locality">{t("addressesArea")}</FieldLabel>
				<Input
					id="addr-locality"
					value={locality}
					onChange={(e) => setLocality(e.target.value)}
					className="bg-white"
				/>
			</Field>
			<Field>
				<FieldLabel htmlFor="addr-landmark">{t("addressesLandmark")}</FieldLabel>
				<Input
					id="addr-landmark"
					value={landmark}
					onChange={(e) => setLandmark(e.target.value)}
					className="bg-white"
				/>
			</Field>
			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={isDefault}
					onChange={(e) => setIsDefault(e.target.checked)}
				/>
				{t("addressesSetDefault")}
			</label>
			<div className="flex gap-2">
				<Button type="submit" disabled={busy}>
					{busy ? t("commonSaving") : t("addressesSave")}
				</Button>
				<Button type="button" variant="outline" onClick={onCancel}>
					{t("commonCancel")}
				</Button>
			</div>
		</form>
	);
}
