"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
	ArrowLeftIcon,
	CalendarIcon,
	CheckIcon,
	ChevronRightIcon,
	ClockIcon,
	InfoIcon,
	MapPinIcon,
	MinusIcon,
	PlusIcon,
} from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { PlacesAddressField } from "@/components/addresses/places-address-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
	dueNowAmount,
	effectivePrePaymentPercent,
	isRecurringPricingType,
	remainingAmount,
} from "@/lib/recurring";
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
import {
	fetchCustomerAddresses,
	type CustomerAddress,
} from "@/services/customer/addressesApi";
import {
	fetchPaymentMethodsConfig,
	type PaymentMethodsConfig,
} from "@/services/config/paymentConfigApi";
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

function nowTimeValue() {
	const d = new Date();
	const h = String(d.getHours()).padStart(2, "0");
	const m = String(d.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
}

function formatDisplayDate(iso: string) {
	const d = new Date(`${iso}T12:00:00`);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString(undefined, {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function formatDisplayTime(hhmm: string) {
	const [h, m] = hhmm.split(":").map(Number);
	if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
	const d = new Date();
	d.setHours(h, m, 0, 0);
	return d.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});
}

function BookStepper({ step }: { step: 1 | 2 }) {
	return (
		<div className="flex items-center py-4" aria-label={`Step ${step} of 2`}>
			<div className="h-1 w-6 rounded-full bg-primary" />
			<div
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white transition-colors duration-200",
					"bg-primary",
				)}
			>
				{step > 1 ? <CheckIcon className="size-4" strokeWidth={2.5} /> : "1"}
			</div>
			<div
				className={cn(
					"h-1 flex-1 transition-colors duration-200",
					step >= 2 ? "bg-primary" : "bg-[#e5e5e5]",
				)}
			/>
			<div
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors duration-200",
					step >= 2
						? "bg-primary text-white"
						: "bg-[#e5e5e5] text-white",
				)}
			>
				2
			</div>
			<div className="h-1 flex-1 rounded-r-full bg-[#e5e5e5]" />
		</div>
	);
}

/** Matches mobile ServiceModel.discountAmount (≤100 = %, else fixed per unit). */
function serviceDiscountAmount(
	discountRaw: string | null | undefined,
	unitPrice: number,
	quantity: number,
): number {
	const discountValue = Number(String(discountRaw ?? "").trim()) || 0;
	if (discountValue <= 0) return 0;
	const lineSubtotal = quantity * unitPrice;
	if (lineSubtotal <= 0) return 0;
	if (discountValue <= 100) {
		return Math.round(((lineSubtotal * discountValue) / 100) * 100) / 100;
	}
	const fixedTotal = quantity * discountValue;
	return Math.min(fixedTotal, lineSubtotal);
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
	const [startTime, setStartTime] = useState(nowTimeValue());
	const [address, setAddress] = useState("");
	const [addressLocation, setAddressLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [description, setDescription] = useState("");
	const [quantity, setQuantity] = useState(1);
	const catalogPrice = Number(service?.price ?? 0) || 0;
	const [customPrice, setCustomPrice] = useState("");
	const [useCustomPrice, setUseCustomPrice] = useState(false);
	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [couponCode, setCouponCode] = useState("");
	const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
	const [couponError, setCouponError] = useState<string | null>(null);
	const [paymentMethod, setPaymentMethod] = useState<"wallet" | "chapa">(
		"chapa",
	);
	const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
	const [payConfig, setPayConfig] = useState<PaymentMethodsConfig | null>(null);
	const [step, setStep] = useState<1 | 2>(1);
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
		const raw = search.get("qty");
		if (!raw) return;
		const n = Number(raw);
		if (Number.isFinite(n) && n >= 1 && n <= 10) setQuantity(Math.trunc(n));
	}, [search]);

	useEffect(() => {
		void fetchPublicCoupons().then((res) => setCoupons(res.coupons));
	}, []);

	useEffect(() => {
		void fetchPaymentMethodsConfig().then(setPayConfig);
	}, []);

	useEffect(() => {
		const customerId = customer?.id ?? user?.id;
		if (!customerId) return;
		void fetchCustomerAddresses(customerId, user?.id).then((res) => {
			setSavedAddresses(res.addresses);
			const def = res.addresses.find((a) => a.isDefault) ?? res.addresses[0];
			if (def?.address) {
				setAddress((prev) => (prev.trim() ? prev : def.address));
			}
		});
	}, [customer?.id, user?.id]);

	const allowsCustom =
		Boolean(service?.allowsCustomOffer) || Boolean(bidPrice);
	const unitPrice = useMemo(() => {
		if (allowsCustom && useCustomPrice && customPrice.trim()) {
			const n = Number(customPrice);
			return Number.isNaN(n) ? 0 : n;
		}
		return catalogPrice;
	}, [allowsCustom, useCustomPrice, customPrice, catalogPrice]);

	const isCustomOffer =
		allowsCustom &&
		useCustomPrice &&
		customPrice.trim() !== "" &&
		Math.abs(unitPrice - catalogPrice) > 0.001;

	const isRecurring = isRecurringPricingType(service?.pricingType);
	const subtotal = unitPrice * quantity;
	const serviceDiscount = isCustomOffer
		? 0
		: serviceDiscountAmount(service?.discount, unitPrice, quantity);
	const afterServiceDiscount = Math.max(0, subtotal - serviceDiscount);
	const discount = appliedCoupon
		? couponDiscount(appliedCoupon, afterServiceDiscount)
		: 0;
	const total = Math.max(0, afterServiceDiscount - discount);
	const dueNow = isCustomOffer
		? 0
		: dueNowAmount({
				total,
				pricingType: service?.pricingType,
				prePayment: service?.prePayment,
				prePaymentPercent: service?.prePaymentPercent,
			});
	const remaining = remainingAmount(total, dueNow);
	const prePayPercent = effectivePrePaymentPercent({
		pricingType: service?.pricingType,
		prePaymentPercent: service?.prePaymentPercent,
	});
	const hasPartialPrePayment = !isRecurring && !isCustomOffer && prePayPercent < 100;

	const walletAffordable = walletBalance >= dueNow;
	const chapaEnabled = !payConfig || payConfig.chapaEnabled;
	const paymentOptions = useMemo(() => {
		const options: Array<"wallet" | "chapa"> = [];
		if (walletAffordable) options.push("wallet");
		if (chapaEnabled) options.push("chapa");
		return options;
	}, [walletAffordable, chapaEnabled]);

	useEffect(() => {
		if (paymentOptions.includes(paymentMethod)) return;
		const fallback = paymentOptions[0];
		if (fallback) setPaymentMethod(fallback);
	}, [paymentMethod, paymentOptions]);

	const paymentLabels = {
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
		if (afterServiceDiscount < res.coupon.minAmount) {
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

	async function onSubmit(e?: React.FormEvent) {
		e?.preventDefault();
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
		if (!description.trim()) {
			setError(t("bookServiceDescriptionRequired"));
			return;
		}
		if (description.trim().length < 10) {
			setError(t("bookServiceDescriptionTooShort"));
			return;
		}
		if (description.trim().length > 1000) {
			setError(t("bookServiceDescriptionTooShort"));
			return;
		}
		if (unitPrice <= 0) {
			setError(t("bookServicePriceRequired"));
			return;
		}
		if (!isCustomOffer && dueNow > 0 && paymentOptions.length === 0) {
			setError(t("bookServiceInsufficientWallet"));
			return;
		}
		if (!isCustomOffer && dueNow > 0 && !paymentMethod) {
			setError(t("bookServicePaymentRequired"));
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
				fromBid: Boolean(bidPrice) || postJob,
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
				location: addressLocation,
				description: description.trim(),
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
			location: addressLocation,
			description: description.trim(),
			quantity,
			price: unitPrice,
			paymentType: dueNow > 0 ? paymentMethod : "free",
			paymentCompleted: dueNow <= 0,
			coupon: couponSnapshot,
			discount: serviceDiscount + discount,
			totalAmount: total,
			postJob,
		});
		if (!res.bookingId) {
			setBusy(false);
			setError(res.error || t("bookServiceCreateFailed"));
			return;
		}

		if (dueNow <= 0) {
			dispatch(invalidateBookings());
			setBusy(false);
			router.replace(`/service/bookings/${res.bookingId}`);
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

	function goNext() {
		setError(null);
		if (!address.trim()) {
			setError(t("bookServiceEnterAddress"));
			return;
		}
		const desc = description.trim();
		if (!desc) {
			setError(t("bookServiceDescriptionRequired"));
			return;
		}
		if (desc.length < 10) {
			setError(t("bookServiceDescriptionTooShort"));
			return;
		}
		if (unitPrice <= 0) {
			setError(t("bookServicePriceRequired"));
			return;
		}
		setStep(2);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	const serviceImage = service.serviceImage?.[0] ?? null;
	const descLen = description.length;
	const fieldClass =
		"h-12 rounded-xl border-[#e8e8e8] bg-white pl-10 text-[15px] shadow-none focus-visible:ring-2 focus-visible:ring-primary/25";

	return (
		<div className="mx-auto min-h-[min(100dvh,56rem)] max-w-lg bg-[#f5f5f5] px-4 pt-3 pb-28">
			{step === 2 ? (
				<button
					type="button"
					onClick={() => {
						setStep(1);
						setError(null);
					}}
					className="-ml-2 mb-1 inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-black/5"
				>
					<ArrowLeftIcon className="size-4" />
					{t("bookServiceTitle")}
				</button>
			) : (
				<ProfileBackLink
					href={`/service/services/${service.id}`}
					label={t("bookServiceTitle")}
					className="mb-1"
				/>
			)}
			<h1 className="text-[22px] font-bold tracking-tight text-balance">
				{t("bookServiceTitle")}
			</h1>
			<p className="mt-0.5 truncate text-[13px] text-[#6b6b6b]">
				{service.serviceName}
			</p>
			<BookStepper step={step} />

			{error ? (
				<Alert variant="destructive" className="mb-3">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<div
				key={step}
				className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
			>
				{step === 1 ? (
					<div className="space-y-5 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
						<label className="block space-y-1.5">
							<span className="text-[13px] font-semibold text-[#1a1a1a]">
								{t("bookServiceDate")}
							</span>
							<div className="relative">
								<CalendarIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8a8a8a]" />
								<Input
									type="date"
									required
									min={todayIsoDate()}
									value={bookingDate}
									onChange={(e) => setBookingDate(e.target.value)}
									className={fieldClass}
								/>
							</div>
						</label>

						<label className="block space-y-1.5">
							<span className="text-[13px] font-semibold text-[#1a1a1a]">
								{t("bookServiceTime")}
							</span>
							<div className="relative">
								<ClockIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8a8a8a]" />
								<Input
									type="time"
									required
									value={startTime}
									onChange={(e) => setStartTime(e.target.value)}
									className={fieldClass}
								/>
							</div>
						</label>

						<div className="space-y-1.5">
							<span className="text-[13px] font-semibold text-[#1a1a1a]">
								{t("bookServiceYourAddress")}
							</span>
							{savedAddresses.length > 0 ? (
								<select
									className="mb-1.5 flex h-11 w-full rounded-xl border border-[#e8e8e8] bg-[#fafafa] px-3 text-sm"
									value=""
									onChange={(e) => {
										const picked = savedAddresses.find(
											(a) => a.id === e.target.value,
										);
										if (!picked?.address) return;
										setAddress(picked.address);
										if (picked.location) {
											setAddressLocation({
												lat: Number(picked.location.latitude),
												lng: Number(picked.location.longitude),
											});
										}
									}}
								>
									<option value="">{t("bookServicePickSavedAddress")}</option>
									{savedAddresses.map((a) => (
										<option key={a.id} value={a.id}>
											{a.addressAs || a.name || a.address}
										</option>
									))}
								</select>
							) : null}
							<div className="relative">
								<MapPinIcon className="pointer-events-none absolute top-3.5 left-3.5 z-10 size-4 text-[#8a8a8a]" />
								<PlacesAddressField
									id="address"
									value={address}
									required
									compact
									onChange={setAddress}
									onLocationChange={setAddressLocation}
									inputClassName="h-12 rounded-xl border-[#e8e8e8] bg-white pl-10 pr-10 text-[15px] shadow-none"
								/>
								<ChevronRightIcon className="pointer-events-none absolute top-3.5 right-3.5 size-4 text-[#b0b0b0]" />
							</div>
						</div>

						<label className="block space-y-1.5">
							<span className="text-[13px] font-semibold text-[#1a1a1a]">
								{t("bookServiceDescription")}
							</span>
							<Textarea
								rows={4}
								required
								maxLength={1000}
								placeholder={t("bookServiceDescriptionPlaceholder")}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="min-h-28 rounded-xl border-[#e8e8e8] bg-white text-[15px] shadow-none focus-visible:ring-2 focus-visible:ring-primary/25"
							/>
							<p
								className={cn(
									"text-right text-[12px] tabular-nums",
									descLen < 10 ? "text-[#8a8a8a]" : "text-[#6b6b6b]",
								)}
							>
								{t("bookServiceDescriptionHint", { count: String(descLen) })}
							</p>
						</label>

						{!useCustomPrice ? (
							<label className="block space-y-1.5">
								<span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a1a]">
									{t("bookServicePrice")}
									<InfoIcon className="size-3.5 text-primary" />
								</span>
								<div className="relative">
									<span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[13px] font-medium text-[#8a8a8a]">
										ETB
									</span>
									<Input
										readOnly
										value={String(catalogPrice || "")}
										className="h-12 rounded-xl border-[#e8e8e8] bg-[#fafafa] pl-12 text-[15px] tabular-nums shadow-none"
									/>
								</div>
							</label>
						) : null}

						{allowsCustom ? (
							<div className="space-y-2 border-t border-[#eee] pt-4">
								<button
									type="button"
									onClick={() => {
										const next = !useCustomPrice;
										setUseCustomPrice(next);
										if (next) setAppliedCoupon(null);
									}}
									className={cn(
										"flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[13px] font-medium transition-colors duration-150",
										useCustomPrice
											? "bg-primary/10 text-primary"
											: "bg-[#f7f7f5] text-[#1a1a1a] hover:bg-[#f0f0ee]",
									)}
								>
									<span>{t("bookServiceCustomPrice")}</span>
									<span
										className={cn(
											"flex size-5 items-center justify-center rounded-full border-2 transition-colors duration-150",
											useCustomPrice
												? "border-primary bg-primary text-white"
												: "border-[#ccc]",
										)}
									>
										{useCustomPrice ? (
											<CheckIcon className="size-3" strokeWidth={3} />
										) : null}
									</span>
								</button>
								{useCustomPrice ? (
									<>
										<Input
											inputMode="decimal"
											required
											value={customPrice}
											onChange={(e) => setCustomPrice(e.target.value)}
											placeholder={t("bookServiceYourPrice")}
											className="h-12 rounded-xl border-[#e8e8e8] bg-white text-[15px]"
										/>
										<p className="text-[12px] leading-snug text-[#6b6b6b]">
											{t("bookServiceCustomHint")}
										</p>
									</>
								) : null}
							</div>
						) : null}
					</div>
				) : (
					<div className="space-y-4">
						<section className="space-y-2">
							<h2 className="text-[15px] font-bold text-[#1a1a1a]">
								{t("bookServiceDateTime")}
							</h2>
							<div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
								<div className="flex items-center justify-between gap-3 px-4 py-3.5">
									<span className="text-[14px] text-[#6b6b6b]">
										{t("bookServiceDate")}
									</span>
									<span className="text-[14px] font-semibold text-[#1a1a1a]">
										{formatDisplayDate(bookingDate)}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3 border-t border-[#f0f0f0] px-4 py-3.5">
									<span className="text-[14px] text-[#6b6b6b]">
										{t("bookServiceTime")}
									</span>
									<span className="text-[14px] font-semibold text-[#1a1a1a]">
										{formatDisplayTime(startTime)}
									</span>
								</div>
							</div>
						</section>

						{!isCustomOffer ? (
							<section className="space-y-2">
								<h2 className="text-[15px] font-bold text-[#1a1a1a]">
									{t("bookServiceQty")}
								</h2>
								<div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
									{serviceImage ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={serviceImage}
											alt=""
											className="size-17 shrink-0 rounded-xl object-cover"
										/>
									) : (
										<div className="size-17 shrink-0 rounded-xl bg-[#eee]" />
									)}
									<div className="min-w-0 flex-1">
										<p className="truncate text-[15px] font-bold text-[#1a1a1a]">
											{service.serviceName}
										</p>
										{service.description ? (
											<p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#6b6b6b]">
												{service.description}
											</p>
										) : null}
									</div>
									<div className="flex flex-col items-center gap-1.5">
										<button
											type="button"
											onClick={() => setQuantity((q) => Math.min(10, q + 1))}
											className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors duration-150 hover:bg-primary/25"
											aria-label="+"
										>
											<PlusIcon className="size-4" />
										</button>
										<span className="text-[15px] font-bold tabular-nums">
											{quantity}
										</span>
										<button
											type="button"
											onClick={() => setQuantity((q) => Math.max(1, q - 1))}
											disabled={quantity <= 1}
											className="flex size-8 items-center justify-center rounded-full bg-[#eee] text-[#1a1a1a] transition-opacity duration-150 disabled:opacity-35"
											aria-label="−"
										>
											<MinusIcon className="size-4" />
										</button>
									</div>
								</div>
							</section>
						) : null}

						{!isCustomOffer && coupons.length > 0 ? (
							<div className="space-y-2 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
								<p className="text-[13px] font-semibold">{t("bookServiceCoupon")}</p>
								<div className="flex gap-2">
									<Input
										value={couponCode}
										onChange={(e) => setCouponCode(e.target.value)}
										placeholder={t("bookServiceCouponPlaceholder")}
										className="h-11 rounded-xl border-[#e8e8e8] bg-white"
									/>
									<Button
										type="button"
										variant="outline"
										className="h-11 rounded-xl"
										onClick={() => void applyCoupon()}
									>
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
							</div>
						) : null}

						<section className="space-y-2">
							<h2 className="text-[15px] font-bold text-[#1a1a1a]">
								{t("servicePriceDetail")}
							</h2>
							<div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
								<div className="flex items-start justify-between gap-3 px-4 py-3 text-[14px]">
									<span className="text-[#6b6b6b]">{t("bookServicePriceLine")}</span>
									<span className="text-right font-semibold tabular-nums text-[#1a1a1a]">
										{formatAmount(unitPrice)} * {quantity} ={" "}
										{formatAmount(subtotal)}
									</span>
								</div>
								{serviceDiscount > 0 ? (
									<div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
										<span className="text-[#6b6b6b]">
											{t("commonDiscount")}
											{service.discount && Number(service.discount) <= 100
												? ` (${service.discount}% off)`
												: ""}
										</span>
										<span className="tabular-nums text-[#6b6b6b]">
											{formatAmount(serviceDiscount)}
										</span>
									</div>
								) : null}
								{discount > 0 ? (
									<div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
										<span className="text-[#6b6b6b]">{t("commonCoupon")}</span>
										<span className="tabular-nums text-[#6b6b6b]">
											{formatAmount(discount)}
										</span>
									</div>
								) : null}
								<div className="mx-4 border-t border-[#eee]" />
								{hasPartialPrePayment ? (
									<>
										<div className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
											<span className="font-medium text-[#1a1a1a]">
												{t("bookServiceServiceTotal")}
											</span>
											<span className="font-semibold tabular-nums">
												{formatAmount(total)}
											</span>
										</div>
										<div className="mx-3 mb-1 flex items-center justify-between gap-3 rounded-xl bg-primary/10 px-3 py-3 text-[14px]">
											<span className="font-semibold text-primary">
												{t("bookingPayPercentNow", {
													percent: String(prePayPercent),
												})}
											</span>
											<span className="font-bold tabular-nums text-primary">
												{formatAmount(dueNow)}
											</span>
										</div>
										<div className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
											<span className="text-[#6b6b6b]">
												{t("bookServiceRemainingAfter")}
											</span>
											<span className="tabular-nums text-[#6b6b6b]">
												{formatAmount(remaining)}
											</span>
										</div>
									</>
								) : (
									<div className="flex items-center justify-between gap-3 px-4 py-3.5 text-[14px]">
										<span className="font-bold">{t("commonTotal")}</span>
										<span className="font-bold tabular-nums text-primary">
											{formatAmount(total)}
										</span>
									</div>
								)}
							</div>
						</section>

						{!isCustomOffer && dueNow > 0 ? (
							<div className="space-y-2.5 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
								<p className="text-[13px] font-semibold">
									{t("bookServicePayment")}
								</p>
								{paymentOptions.length === 0 ? (
									<p className="text-xs text-destructive">
										{t("bookServiceInsufficientWallet")}
									</p>
								) : (
									<div className="flex gap-2">
										{paymentOptions.map((method) => (
											<button
												key={method}
												type="button"
												className={cn(
													"h-10 flex-1 rounded-xl text-[13px] font-semibold transition-colors duration-150",
													paymentMethod === method
														? "bg-primary text-primary-foreground"
														: "bg-[#f0f0ee] text-[#1a1a1a] hover:bg-[#e8e8e4]",
												)}
												onClick={() => setPaymentMethod(method)}
											>
												{paymentLabels[method]}
												{method === "wallet"
													? ` (${formatAmount(walletBalance)})`
													: ""}
											</button>
										))}
									</div>
								)}
							</div>
						) : null}
					</div>
				)}
			</div>

			<div
				className="fixed inset-x-0 bottom-0 z-30 bg-white/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md"
				style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
			>
				<div className="mx-auto max-w-lg">
					{step === 1 ? (
						<Button
							type="button"
							className="h-12 w-full rounded-2xl text-[15px] font-semibold"
							onClick={goNext}
						>
							{t("bookServiceNext")}
						</Button>
					) : (
						<Button
							type="button"
							className="h-12 w-full rounded-2xl text-[15px] font-semibold"
							disabled={busy}
							onClick={() => void onSubmit()}
						>
							{busy
								? t("commonSubmitting")
								: isCustomOffer
									? t("bookServiceSendCustom")
									: t("bookServiceConfirm")}
						</Button>
					)}
				</div>
			</div>
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
