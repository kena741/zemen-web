"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { LocateFixedIcon, MapPinIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LatLng = { lat: number; lng: number };

type GoogleMaps = {
	maps: {
		Map: new (
			el: HTMLElement,
			opts: { center: LatLng; zoom: number; mapTypeControl?: boolean },
		) => {
			addListener: (event: string, cb: (e: { latLng?: { lat: () => number; lng: () => number } | null }) => void) => void;
			setCenter: (c: LatLng) => void;
			panTo: (c: LatLng) => void;
		};
		Marker: new (opts: {
			map: unknown;
			position: LatLng;
			draggable?: boolean;
		}) => {
			setPosition: (c: LatLng) => void;
			addListener: (event: string, cb: () => void) => void;
			getPosition: () => { lat: () => number; lng: () => number } | null;
		};
		places: {
			Autocomplete: new (
				input: HTMLInputElement,
				opts?: { fields?: string[]; componentRestrictions?: { country: string | string[] } },
			) => {
				addListener: (event: string, cb: () => void) => void;
				getPlace: () => {
					formatted_address?: string;
					geometry?: { location?: { lat: () => number; lng: () => number } };
				};
			};
		};
		Geocoder: new () => {
			geocode: (
				req: { location?: LatLng; address?: string },
				cb: (
					results: Array<{ formatted_address?: string }> | null,
					status: string,
				) => void,
			) => void;
		};
		event: { clearInstanceListeners: (instance: unknown) => void };
	};
};

function getGoogle(): GoogleMaps | undefined {
	return (window as Window & { google?: GoogleMaps }).google;
}

export function PlacesAddressField({
	id,
	label,
	value,
	onChange,
	onLocationChange,
	required,
	className,
}: {
	id?: string;
	label?: string;
	value: string;
	onChange: (address: string) => void;
	onLocationChange?: (loc: LatLng | null) => void;
	required?: boolean;
	className?: string;
}) {
	const { t } = useLocale();
	const autoId = useId();
	const inputId = id ?? autoId;
	const inputRef = useRef<HTMLInputElement>(null);
	const mapRef = useRef<HTMLDivElement>(null);
	const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
	const [scriptReady, setScriptReady] = useState(false);
	const [mapOpen, setMapOpen] = useState(false);
	const [busyLoc, setBusyLoc] = useState(false);
	const [mapError, setMapError] = useState<string | null>(null);
	const [picked, setPicked] = useState<LatLng | null>(null);
	const markerRef = useRef<InstanceType<GoogleMaps["maps"]["Marker"]> | null>(null);
	const mapInstanceRef = useRef<InstanceType<GoogleMaps["maps"]["Map"]> | null>(null);

	useEffect(() => {
		if (!mapsKey || !scriptReady || !inputRef.current) return;
		const g = getGoogle();
		if (!g?.maps?.places) return;
		const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
			fields: ["formatted_address", "geometry"],
			componentRestrictions: { country: "et" },
		});
		autocomplete.addListener("place_changed", () => {
			const place = autocomplete.getPlace();
			if (place.formatted_address) onChange(place.formatted_address);
			const loc = place.geometry?.location;
			if (loc) {
				const next = { lat: loc.lat(), lng: loc.lng() };
				setPicked(next);
				onLocationChange?.(next);
			}
		});
		return () => {
			g.maps.event.clearInstanceListeners(autocomplete);
		};
	}, [mapsKey, scriptReady, onChange, onLocationChange]);

	useEffect(() => {
		if (!mapOpen || !scriptReady || !mapRef.current) return;
		const g = getGoogle();
		if (!g?.maps) return;

		const center = picked ?? { lat: 9.03, lng: 38.74 };
		const map = new g.maps.Map(mapRef.current, {
			center,
			zoom: 14,
			mapTypeControl: false,
		});
		mapInstanceRef.current = map;
		const marker = new g.maps.Marker({
			map,
			position: center,
			draggable: true,
		});
		markerRef.current = marker;

		map.addListener("click", (e) => {
			const ll = e.latLng;
			if (!ll) return;
			const next = { lat: ll.lat(), lng: ll.lng() };
			marker.setPosition(next);
			map.panTo(next);
			setPicked(next);
		});
		marker.addListener("dragend", () => {
			const pos = marker.getPosition();
			if (!pos) return;
			setPicked({ lat: pos.lat(), lng: pos.lng() });
		});

		return () => {
			g.maps.event.clearInstanceListeners(map);
			g.maps.event.clearInstanceListeners(marker);
			markerRef.current = null;
			mapInstanceRef.current = null;
		};
		// ponytail: init map once when dialog opens; picked updates via marker handlers
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mapOpen, scriptReady]);

	async function reverseGeocode(loc: LatLng): Promise<string | null> {
		const g = getGoogle();
		if (!g?.maps) return null;
		return new Promise((resolve) => {
			const geocoder = new g.maps.Geocoder();
			geocoder.geocode({ location: loc }, (results, status) => {
				if (status === "OK" && results?.[0]?.formatted_address) {
					resolve(results[0].formatted_address);
				} else resolve(null);
			});
		});
	}

	async function useCurrentLocation() {
		if (!navigator.geolocation) {
			setMapError(t("bookServiceLocationUnsupported"));
			return;
		}
		setBusyLoc(true);
		setMapError(null);
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				setPicked(loc);
				onLocationChange?.(loc);
				const addr = await reverseGeocode(loc);
				if (addr) onChange(addr);
				else onChange(`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`);
				setBusyLoc(false);
			},
			() => {
				setMapError(t("bookServiceLocationDenied"));
				setBusyLoc(false);
			},
			{ enableHighAccuracy: true, timeout: 12000 },
		);
	}

	async function confirmMapPick() {
		if (!picked) {
			setMapOpen(false);
			return;
		}
		setBusyLoc(true);
		const addr = await reverseGeocode(picked);
		if (addr) onChange(addr);
		else onChange(`${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`);
		onLocationChange?.(picked);
		setBusyLoc(false);
		setMapOpen(false);
	}

	return (
		<div className={cn("space-y-2", className)}>
			{mapsKey ? (
				<Script
					src={`https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`}
					strategy="lazyOnload"
					onLoad={() => setScriptReady(true)}
				/>
			) : null}

			<Field>
				{label ? <FieldLabel htmlFor={inputId}>{label}</FieldLabel> : null}
				<Input
					id={inputId}
					ref={inputRef}
					required={required}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={t("bookServiceAddressPlaceholder")}
					className="bg-white"
					autoComplete="street-address"
				/>
			</Field>

			{mapsKey ? (
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={busyLoc || !scriptReady}
						onClick={() => void useCurrentLocation()}
						className="gap-1.5"
					>
						<LocateFixedIcon className="size-3.5" />
						{busyLoc ? t("commonLoading") : t("bookServiceUseCurrentLocation")}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!scriptReady}
						onClick={() => setMapOpen(true)}
						className="gap-1.5"
					>
						<MapPinIcon className="size-3.5" />
						{t("bookServicePickOnMap")}
					</Button>
				</div>
			) : null}

			{mapError ? <p className="text-xs text-destructive">{mapError}</p> : null}

			{mapOpen ? (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
					<div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-lg">
						<div className="flex items-center justify-between border-b px-4 py-3">
							<p className="text-sm font-semibold">{t("bookServicePickOnMap")}</p>
							<button
								type="button"
								className="text-sm text-muted-foreground hover:text-foreground"
								onClick={() => setMapOpen(false)}
							>
								{t("commonCancel")}
							</button>
						</div>
						<p className="px-4 pt-2 text-xs text-muted-foreground">
							{t("bookServiceMapHint")}
						</p>
						<div ref={mapRef} className="mx-4 mt-2 h-72 rounded-lg bg-muted" />
						<div className="flex gap-2 p-4">
							<Button
								type="button"
								className="flex-1"
								disabled={busyLoc || !picked}
								onClick={() => void confirmMapPick()}
							>
								{t("commonConfirm")}
							</Button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
