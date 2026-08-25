"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ServiceLoading } from "@/components/service/service-loading";
import { formatAmount } from "@/services/bookings/types";
import { createCustomerBooking } from "@/services/customer/bookingsApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateBookings } from "@/store/customerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedServiceDetail } from "@/store/useCustomerCache";

function todayIsoDate() {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export default function BookServicePage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const customer = user?.customer;
	const { service, loading, error: loadError } = useCachedServiceDetail(params.id);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [bookingDate, setBookingDate] = useState(todayIsoDate());
	const [startTime, setStartTime] = useState("09:00");
	const [address, setAddress] = useState("");
	const [description, setDescription] = useState("");
	const [quantity, setQuantity] = useState(1);

	const unitPrice = Number(service?.price ?? 0) || 0;
	const total = unitPrice * quantity;

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!service || !user?.id || !customer) {
			setError("Missing customer or service");
			return;
		}
		if (!service.providerId) {
			setError("This service has no provider assigned");
			return;
		}
		if (!address.trim()) {
			setError("Please enter an address");
			return;
		}

		const names = (customer.fullName || user.name || "Customer").split(" ");
		const firstName = names[0] || "Customer";
		const lastName = names.slice(1).join(" ") || firstName;

		setBusy(true);
		setError(null);
		const res = await createCustomerBooking({
			customerId: user.id,
			providerId: service.providerId,
			serviceId: service.id,
			firstName,
			lastName,
			phoneNumber: customer.phone || "",
			bookingDate,
			startTime: `${bookingDate}T${startTime}:00`,
			address: address.trim(),
			description,
			quantity,
			price: unitPrice,
			paymentType: "cash",
		});
		setBusy(false);

		if (!res.bookingId) {
			setError(res.error || "Could not create booking");
			return;
		}
		dispatch(invalidateBookings());
		router.replace(`/service/bookings/${res.bookingId}`);
	}

	if (loading) {
		return <ServiceLoading />;
	}

	if (!service) {
		return (
			<div className="px-4 pt-4">
				<ProfileBackLink href="/service" label="Home" />
				<p className="text-sm text-destructive">
					{error || loadError || "Not found"}
				</p>
			</div>
		);
	}

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink
				href={`/service/services/${service.id}`}
				label="Service"
			/>
			<h1 className="admin-page-title">Book service</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{service.serviceName} · {formatAmount(service.price)}
			</p>

			<form onSubmit={onSubmit} className="mx-auto mt-6 max-w-lg space-y-4">
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<div className="grid grid-cols-2 gap-3">
					<Field>
						<FieldLabel htmlFor="date">Date</FieldLabel>
						<Input
							id="date"
							type="date"
							required
							min={todayIsoDate()}
							value={bookingDate}
							onChange={(e) => setBookingDate(e.target.value)}
							className="bg-white"
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="time">Time</FieldLabel>
						<Input
							id="time"
							type="time"
							required
							value={startTime}
							onChange={(e) => setStartTime(e.target.value)}
							className="bg-white"
						/>
					</Field>
				</div>

				<Field>
					<FieldLabel htmlFor="qty">Quantity</FieldLabel>
					<Input
						id="qty"
						type="number"
						min={1}
						max={20}
						value={quantity}
						onChange={(e) =>
							setQuantity(Math.max(1, Number(e.target.value) || 1))
						}
						className="bg-white"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="address">Service address</FieldLabel>
					<Textarea
						id="address"
						required
						rows={3}
						placeholder="Street, area, landmark…"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						className="bg-white"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
					<Textarea
						id="notes"
						rows={3}
						placeholder="Anything the provider should know…"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="bg-white"
					/>
				</Field>

				<div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Subtotal</span>
						<span className="font-semibold tabular-nums text-primary">
							{formatAmount(total)}
						</span>
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						Payment on service · cash
					</p>
				</div>

				<Button type="submit" className="w-full" disabled={busy}>
					{busy ? "Booking…" : "Confirm booking"}
				</Button>
			</form>
		</div>
	);
}
