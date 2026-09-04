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
import { useLocale } from "@/lib/i18n";
import { dueNowAmount, remainingAmount } from "@/lib/recurring";
import { formatAmount } from "@/services/bookings/types";
import { createCustomerBooking, payBookingWithWallet } from "@/services/customer/bookingsApi";
import { savePaymentPending } from "@/lib/payment-pending";
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
	const { t } = useLocale();
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
	const [paymentMethod, setPaymentMethod] = useState<"cash" | "wallet" | "chapa">(
		"cash",
	);
	const walletBalance = Number(user?.customer?.walletAmount ?? 0) || 0;

	useEffect(() => {
		if (!user) {
			router.replace(
				`/login?next=${encodeURIComponent(`/service/book/${params.id}`)}`,
			);
		}
	}, [user, router, params.id]);

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
	const dueNow = dueNowAmount({
		total,
		pricingType: service?.pricingType,
		prePayment: service?.prePayment,
		prePaymentPercent: service?.prePaymentPercent,
	});
	const remaining = remainingAmount(total, dueNow);
	const prePayPercent =
		service?.prePayment &&
		service.prePaymentPercent != null &&
		service.prePaymentPercent > 0 &&
		service.prePaymentPercent < 100
			? service.prePaymentPercent
			: null;

	const paymentLabels = {
		cash: t("paymentCash"),
		wallet: t("paymentWallet"),
		chapa: t("paymentChapa"),
	} as const;

	async function applyCoupon() {
		setCouponError(null);
		if (isCustomOffer) {
			setCouponError(t("couponCustomBlocked"));
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
				t("couponMinAmount", {
					amount: formatAmount(res.coupon.minAmount),
				}),
			);
			setAppliedCoupon(null);
			return;
		}
		setAppliedCoupon(res.coupon);
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!service || !user?.id || !customer) {
			setError(t("bookServiceMissingCustomer"));
			return;
		}
		const providerId = bidProvider || service.providerId;
		if (!providerId) {
			setError(t("bookServiceNoProvider"));
			return;
		}
		if (!address.trim()) {
			setError(t("bookServiceEnterAddress"));
			return;
		}
		if (isCustomOffer && !description.trim()) {
			setError(t("bookServiceDescriptionRequired"));
			return;
		}
		if (unitPrice <= 0) {
			setError(t("bookServicePriceRequired"));
			return;
		}

		const names = (customer.fullName || user.name || t("customer")).split(" ");
		const firstName = names[0] || t("customer");
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
				setError(offerRes.error || t("bookServiceCreateCustomFailed"));
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
				setError(bookRes.error || t("bookServiceCreateFailed"));
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

		if (paymentMethod === "wallet" && dueNow > walletBalance) {
			setBusy(false);
			setError(t("bookServiceInsufficientWallet"));
			return;
		}

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
			paymentType: paymentMethod,
			paymentCompleted: paymentMethod === "cash",
			coupon: couponSnapshot,
			discount,
			totalAmount: total,
			postJob,
		});
		if (!res.bookingId) {
			setBusy(false);
			setError(res.error || t("bookServiceCreateFailed"));
			return;
		}

		if (paymentMethod === "wallet") {
			const paid = await payBookingWithWallet({
				bookingId: res.bookingId,
				customerId: user.id,
				amount: dueNow,
			});
			setBusy(false);
			if (!paid.ok) {
				setError(paid.error || t("bookServiceWalletFailed"));
				return;
			}
			dispatch(invalidateBookings());
			router.replace(`/service/bookings/${res.bookingId}`);
			return;
		}

		if (paymentMethod === "chapa") {
			savePaymentPending({
				purpose: "booking",
				userId: user.id,
				accountType: "customer",
				amount: String(dueNow),
				bookingId: res.bookingId,
			});
			setBusy(false);
			const chapaRes = await fetch("/api/pay/chapa", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: dueNow,
					email: user.email,
					first_name: firstName,
					last_name: lastName,
					phone_number: customer.phone,
					purpose: "booking",
					return_path: `/pay/done?purpose=booking&amount=${dueNow}`,
					booking_id: res.bookingId,
				}),
			});
			const chapaData = (await chapaRes.json()) as {
				checkout_url?: string;
				error?: string;
			};
			if (!chapaRes.ok || !chapaData.checkout_url) {
				setError(chapaData.error || t("bookServiceChapaFailed"));
				return;
			}
			window.location.href = chapaData.checkout_url;
			return;
		}

		setBusy(false);
		dispatch(invalidateBookings());
		router.replace(`/service/bookings/${res.bookingId}`);
	}

	if (loading || !user) return <ServiceLoading />;

	if (!service) {
		return (
			<div className="px-4 pt-4">
				<ProfileBackLink href="/service" label={t("navHome")} />
				<p className="text-sm text-destructive">
					{error || loadError || t("commonNotFound")}
				</p>
			</div>
		);
	}

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink
				href={`/service/services/${service.id}`}
				label={t("serviceTitle")}
			/>
			<h1 className="admin-page-title">{t("bookServiceTitle")}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{service.serviceName} · {t("serviceCatalog")}{" "}
				{formatAmount(service.price)}
			</p>

			<form onSubmit={onSubmit} className="mx-auto mt-6 max-w-lg space-y-4">
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<div className="grid grid-cols-2 gap-3">
					<Field>
						<FieldLabel htmlFor="date">{t("bookServiceDate")}</FieldLabel>
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
						<FieldLabel htmlFor="time">{t("bookServiceTime")}</FieldLabel>
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
						<FieldLabel htmlFor="qty">{t("bookServiceQty")}</FieldLabel>
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
							{t("bookServiceCustomPrice")}
						</label>
						{useCustomPrice ? (
							<Field>
								<FieldLabel htmlFor="custom-price">
									{t("bookServiceYourPrice")}
								</FieldLabel>
								<Input
									id="custom-price"
									inputMode="decimal"
									required
									value={customPrice}
									onChange={(e) => setCustomPrice(e.target.value)}
									className="bg-white"
								/>
								<p className="mt-1 text-xs text-muted-foreground">
									{t("bookServiceCustomHint")}
								</p>
							</Field>
						) : null}
					</div>
				) : null}

				<Field>
					<FieldLabel htmlFor="address">{t("bookServiceAddress")}</FieldLabel>
					<Textarea
						id="address"
						required
						rows={3}
						placeholder={t("bookServiceAddressPlaceholder")}
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						className="bg-white"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="notes">
						{isCustomOffer
							? t("bookServiceDescription")
							: t("bookServiceNotes")}
					</FieldLabel>
					<Textarea
						id="notes"
						rows={3}
						required={isCustomOffer}
						placeholder={t("bookServiceNotesPlaceholder")}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="bg-white"
					/>
				</Field>

				{!isCustomOffer ? (
					<div className="space-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
						<p className="text-sm font-medium">{t("bookServiceCoupon")}</p>
						<div className="flex gap-2">
							<Input
								value={couponCode}
								onChange={(e) => setCouponCode(e.target.value)}
								placeholder={t("bookServiceCouponPlaceholder")}
								className="bg-white"
							/>
							<Button type="button" variant="outline" onClick={() => void applyCoupon()}>
								{t("commonApply")}
							</Button>
						</div>
						{couponError ? (
							<p className="text-xs text-destructive">{couponError}</p>
						) : null}
						{appliedCoupon ? (
							<p className="text-xs text-primary">
								{t("couponApplied", {
									code: appliedCoupon.code ?? "",
									amount: formatAmount(discount),
								})}
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

				{!isCustomOffer ? (
					<div className="space-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
						<p className="text-sm font-medium">{t("bookServicePayment")}</p>
						<div className="flex flex-wrap gap-2">
							{(["cash", "wallet", "chapa"] as const).map((method) => (
								<button
									key={method}
									type="button"
									className={`rounded-md px-3 py-1.5 text-xs font-medium ${
										paymentMethod === method
											? "bg-primary text-primary-foreground"
											: "bg-muted text-foreground"
									}`}
									onClick={() => setPaymentMethod(method)}
								>
									{paymentLabels[method]}
									{method === "wallet"
										? ` (${formatAmount(walletBalance)})`
										: ""}
								</button>
							))}
						</div>
					</div>
				) : null}

				<div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("bookServiceSubtotal")}</span>
						<span className="tabular-nums">{formatAmount(subtotal)}</span>
					</div>
					{discount > 0 ? (
						<div className="mt-1 flex items-center justify-between text-sm">
							<span className="text-muted-foreground">{t("commonCoupon")}</span>
							<span className="tabular-nums text-primary">
								−{formatAmount(discount)}
							</span>
						</div>
					) : null}
					<div className="mt-2 flex items-center justify-between text-sm font-semibold">
						<span>{t("commonTotal")}</span>
						<span className="tabular-nums text-primary">
							{formatAmount(total)}
						</span>
					</div>
					{dueNow < total ? (
						<>
							<div className="mt-2 flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									{t("bookingDueNow")}
									{prePayPercent != null
										? ` · ${t("bookingPayPercentNow", {
												percent: String(prePayPercent),
											})}`
										: ""}
								</span>
								<span className="tabular-nums font-medium">
									{formatAmount(dueNow)}
								</span>
							</div>
							<div className="mt-1 flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									{t("bookingRemaining")}
								</span>
								<span className="tabular-nums">
									{formatAmount(remaining)}
								</span>
							</div>
						</>
					) : null}
					<p className="mt-1 text-xs text-muted-foreground">
						{isCustomOffer
							? t("bookServiceCustomOfferNote")
							: paymentMethod === "cash"
								? t("bookServicePayCash")
								: paymentMethod === "wallet"
									? t("bookServicePayWallet")
									: t("bookServicePayChapa")}
					</p>
				</div>

				<Button type="submit" className="w-full" disabled={busy}>
					{busy
						? t("commonSubmitting")
						: isCustomOffer
							? t("bookServiceSendCustom")
							: t("bookServiceConfirm")}
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
