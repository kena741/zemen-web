"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ServiceLoading } from "@/components/service/service-loading";
import { formatAmount } from "@/services/bookings/types";
import { createCustomerBooking } from "@/services/customer/bookingsApi";
import {
	couponDiscount,
	fetchCouponByCode,
	fetchPublicCoupons,
	type Coupon,
} from "@/services/customer/couponsApi";
import {
	attachOfferToBooking,
	createCustomerServiceOffer,
} from "@/services/customer/offersApi";
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

function BookServiceForm() {
	const params = useParams<{ id: string }>();
	const search = useSearchParams();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const customer = user?.customer;
	const { service, loading, error: loadError } = useCachedServiceDetail(params.id);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const bidPrice = search.get("bidPrice");
	const bidProvider = search.get("providerId");
	const postJob = search.get("postJob") === "1";

	const [bookingDate, setBookingDate] = useState(todayIsoDate());
	const [startTime, setStartTime] = useState("09:00");
	const [address, setAddress] = useState("");
	const [description, setDescription] = useState("");
	const [quantity, setQuantity] = useState(1);
	const catalogPrice = Number(service?.price ?? 0) || 0;
	const [customPrice, setCustomPrice] = useState("");
	const [useCustomPrice, setUseCustomPrice] = useState(false);
	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [couponCode, setCouponCode] = useState("");
	const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
	const [couponError, setCouponError] = useState<string | null>(null);

	useEffect(() => {
		if (bidPrice) {
			setCustomPrice(bidPrice);
			setUseCustomPrice(true);
		}
	}, [bidPrice]);

	useEffect(() => {
		void fetchPublicCoupons().then((res) => setCoupons(res.coupons));
	}, []);

	const allowsCustom = Boolean(service?.allowsCustomOffer) || Boolean(bidPrice);
	const unitPrice = useMemo(() => {
		if (useCustomPrice && customPrice.trim()) {
			const n = Number(customPrice);
			return Number.isNaN(n) ? 0 : n;
		}
		return catalogPrice;
	}, [useCustomPrice, customPrice, catalogPrice]);

	const isCustomOffer =
		allowsCustom &&
		useCustomPrice &&
		customPrice.trim() !== "" &&
		Math.abs(unitPrice - catalogPrice) > 0.001;

	const subtotal = unitPrice * quantity;
	const discount = appliedCoupon
		? couponDiscount(appliedCoupon, subtotal)
		: 0;
	const total = Math.max(0, subtotal - discount);

	async function applyCoupon() {
		setCouponError(null);
		if (isCustomOffer) {
			setCouponError("Coupons cannot be used with a custom price.");
			return;
		}
		const res = await fetchCouponByCode(couponCode);
		if (!res.coupon) {
			setCouponError(res.error);
			setAppliedCoupon(null);
			return;
		}
		if (subtotal < res.coupon.minAmount) {
			setCouponError(
				`Minimum amount for this coupon is ${formatAmount(res.coupon.minAmount)}.`,
			);
			setAppliedCoupon(null);
			return;
		}
		setAppliedCoupon(res.coupon);
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!service || !user?.id || !customer) {
			setError("Missing customer or service");
			return;
		}
		const providerId = bidProvider || service.providerId;
		if (!providerId) {
			setError("This service has no provider assigned");
			return;
		}
		if (!address.trim()) {
			setError("Please enter an address");
			return;
		}
		if (isCustomOffer && !description.trim()) {
			setError("Description is required when sending a custom price.");
			return;
		}
		if (unitPrice <= 0) {
			setError("Price must be greater than zero.");
			return;
		}

		const names = (customer.fullName || user.name || "Customer").split(" ");
		const firstName = names[0] || "Customer";
		const lastName = names.slice(1).join(" ") || firstName;

		setBusy(true);
		setError(null);

		if (isCustomOffer) {
			const offerRes = await createCustomerServiceOffer({
				customerId: user.id,
				serviceId: service.id,
				providerId,
				offeredPrice: total,
				bookingDate: `${bookingDate}T${startTime}:00`,
				address: address.trim(),
				description: description.trim(),
			});
			if (!offerRes.offer) {
				setBusy(false);
				setError(offerRes.error || "Could not create custom price");
				return;
			}
			const bookRes = await createCustomerBooking({
				customerId: user.id,
				providerId,
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
				paymentType: "",
				paymentCompleted: false,
				totalAmount: total,
			});
			if (!bookRes.bookingId) {
				setBusy(false);
				setError(bookRes.error || "Could not create booking");
				return;
			}
			await attachOfferToBooking({
				offerId: offerRes.offer.id,
				bookingId: bookRes.bookingId,
			});
			dispatch(invalidateBookings());
			setBusy(false);
			router.replace(`/service/bookings/${bookRes.bookingId}`);
			return;
		}

		const couponSnapshot = appliedCoupon
			? {
					id: appliedCoupon.id,
					code: appliedCoupon.code,
					amount: appliedCoupon.amount,
					isFix: appliedCoupon.isFix,
					title: appliedCoupon.title,
				}
			: null;

		const res = await createCustomerBooking({
			customerId: user.id,
			providerId,
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
			coupon: couponSnapshot,
			discount,
			totalAmount: total,
			postJob,
		});
		setBusy(false);

		if (!res.bookingId) {
			setError(res.error || "Could not create booking");
			return;
		}
		dispatch(invalidateBookings());
		router.replace(`/service/bookings/${res.bookingId}`);
	}

	if (loading) return <ServiceLoading />;

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
				{service.serviceName} · Catalog {formatAmount(service.price)}
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

				{!isCustomOffer ? (
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
				) : null}

				{allowsCustom ? (
					<div className="space-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={useCustomPrice}
								onChange={(e) => {
									setUseCustomPrice(e.target.checked);
									if (e.target.checked) setAppliedCoupon(null);
								}}
							/>
							Propose a custom price
						</label>
						{useCustomPrice ? (
							<Field>
								<FieldLabel htmlFor="custom-price">Your price (ETB)</FieldLabel>
								<Input
									id="custom-price"
									inputMode="decimal"
									required
									value={customPrice}
									onChange={(e) => setCustomPrice(e.target.value)}
									className="bg-white"
								/>
								<p className="mt-1 text-xs text-muted-foreground">
									Provider must accept before payment.
								</p>
							</Field>
						) : null}
					</div>
				) : null}

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
					<FieldLabel htmlFor="notes">
						{isCustomOffer ? "Description (required)" : "Notes (optional)"}
					</FieldLabel>
					<Textarea
						id="notes"
						rows={3}
						required={isCustomOffer}
						placeholder="Anything the provider should know…"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="bg-white"
					/>
				</Field>

				{!isCustomOffer ? (
					<div className="space-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
						<p className="text-sm font-medium">Coupon</p>
						<div className="flex gap-2">
							<Input
								value={couponCode}
								onChange={(e) => setCouponCode(e.target.value)}
								placeholder="Enter code"
								className="bg-white"
							/>
							<Button type="button" variant="outline" onClick={() => void applyCoupon()}>
								Apply
							</Button>
						</div>
						{couponError ? (
							<p className="text-xs text-destructive">{couponError}</p>
						) : null}
						{appliedCoupon ? (
							<p className="text-xs text-primary">
								Applied {appliedCoupon.code} (−
								{formatAmount(discount)})
							</p>
						) : null}
						{coupons.length > 0 ? (
							<div className="flex flex-wrap gap-1.5 pt-1">
								{coupons.slice(0, 4).map((c) => (
									<button
										key={c.id}
										type="button"
										className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium"
										onClick={() => {
											setCouponCode(c.code ?? "");
											setAppliedCoupon(c);
											setCouponError(null);
										}}
									>
										{c.code}
									</button>
								))}
							</div>
						) : null}
					</div>
				) : null}

				<div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Subtotal</span>
						<span className="tabular-nums">{formatAmount(subtotal)}</span>
					</div>
					{discount > 0 ? (
						<div className="mt-1 flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Coupon</span>
							<span className="tabular-nums text-primary">
								−{formatAmount(discount)}
							</span>
						</div>
					) : null}
					<div className="mt-2 flex items-center justify-between text-sm font-semibold">
						<span>Total</span>
						<span className="tabular-nums text-primary">
							{formatAmount(total)}
						</span>
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						{isCustomOffer
							? "Sent as custom price offer · pay after provider accepts"
							: "Payment on service · cash, or wallet later if required"}
					</p>
				</div>

				<Button type="submit" className="w-full" disabled={busy}>
					{busy
						? "Submitting…"
						: isCustomOffer
							? "Send custom price"
							: "Confirm booking"}
				</Button>
			</form>
		</div>
	);
}

export default function BookServicePage() {
	return (
		<Suspense fallback={<ServiceLoading />}>
			<BookServiceForm />
		</Suspense>
	);
}
