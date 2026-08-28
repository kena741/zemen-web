"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { fetchHandymanById, handymanDisplayName } from "@/services/handymen/handymenApi";
import { useCachedBookingDetail } from "@/store/useCustomerCache";

export default function AboutHandymanPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const bookingId = params.id ?? "";
	const { booking, loading: bookingLoading } = useCachedBookingDetail(bookingId);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [image, setImage] = useState<string | null>(null);

	useEffect(() => {
		if (!booking) return;
		const handymanId = booking.handymanId;
		if (!handymanId) {
			setLoading(false);
			setError(t("handymanNotAssigned"));
			return;
		}
		void fetchHandymanById(handymanId).then((res) => {
			if (!res.handyman) {
				setError(res.error ?? t("handymanNotFound"));
			} else {
				setName(handymanDisplayName(res.handyman));
				setPhone(
					res.handyman.phoneNumber
						? `${res.handyman.countryCode ?? "+251"} ${res.handyman.phoneNumber}`
						: "",
				);
				setEmail(res.handyman.email ?? "");
				setAddress(res.handyman.address ?? "");
				setImage(res.handyman.profileImage);
			}
			setLoading(false);
		});
	}, [booking, t]);

	return (
		<div className="mx-auto max-w-lg px-4 py-6">
			<ProfileBackLink
				href={`/service/bookings/${bookingId}`}
				label={t("bookingTitle")}
			/>
			<h1 className="admin-page-title mt-2">{t("handymanAbout")}</h1>
			{bookingLoading || loading ? (
				<ServiceLoading compact />
			) : error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : (
				<div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
					{image ? (
						<div className="relative mx-auto mb-4 size-24 overflow-hidden rounded-full">
							<Image src={image} alt={name} fill className="object-cover" />
						</div>
					) : null}
					<p className="text-center text-lg font-semibold">{name}</p>
					<dl className="mt-4 space-y-2 text-sm">
						{phone ? (
							<div>
								<dt className="text-muted-foreground">{t("phone")}</dt>
								<dd className="font-medium">{phone}</dd>
							</div>
						) : null}
						{email ? (
							<div>
								<dt className="text-muted-foreground">{t("email")}</dt>
								<dd className="font-medium">{email}</dd>
							</div>
						) : null}
						{address ? (
							<div>
								<dt className="text-muted-foreground">{t("addressesStreet")}</dt>
								<dd className="font-medium">{address}</dd>
							</div>
						) : null}
					</dl>
				</div>
			)}
		</div>
	);
}
