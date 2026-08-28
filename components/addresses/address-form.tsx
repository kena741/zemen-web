"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

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
	const [label, setLabel] = useState(initial?.addressAs ?? t("addressesDefaultHome"));
	const [address, setAddress] = useState(initial?.address ?? "");
	const [locality, setLocality] = useState(initial?.locality ?? "");
	const [landmark, setLandmark] = useState(initial?.landmark ?? "");
	const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
	const [busy, setBusy] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

	useEffect(() => {
		if (!mapsKey || !inputRef.current) return;
		const g = (
			window as Window & {
				google?: {
					maps?: {
						places?: {
							Autocomplete: new (
								input: HTMLInputElement,
								opts?: { fields?: string[] },
							) => {
								addListener: (
									event: string,
									cb: () => void,
								) => void;
								getPlace: () => {
									formatted_address?: string;
									name?: string;
								};
							};
						};
					};
				};
			}
		).google;
		if (!g?.maps?.places || !inputRef.current) return;
		const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
			fields: ["formatted_address", "name"],
		});
		autocomplete.addListener("place_changed", () => {
			const place = autocomplete.getPlace();
			if (place.formatted_address) setAddress(place.formatted_address);
			if (place.name) setLocality(place.name);
		});
	}, [mapsKey]);

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
			location: initial?.location,
		});
		setBusy(false);
	}

	return (
		<form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
			{mapsKey ? (
				<Script
					src={`https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`}
					strategy="lazyOnload"
				/>
			) : null}
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
			<Field>
				<FieldLabel htmlFor="addr-street">{t("addressesStreet")}</FieldLabel>
				<Input
					id="addr-street"
					ref={inputRef}
					required
					value={address}
					onChange={(e) => setAddress(e.target.value)}
					placeholder={t("addressesStreetPlaceholder")}
					className="bg-white"
				/>
			</Field>
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
