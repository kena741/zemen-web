"use client";

import { useEffect, useState } from "react";
import {
	GlobeIcon,
	MailIcon,
	MessageSquareIcon,
	PhoneIcon,
} from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { TelegramLink } from "@/components/app/telegram-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import {
	fetchContactInfo,
	type ContactInfo,
} from "@/services/config/contactApi";

export default function ProviderContactPage() {
	const { t } = useLocale();
	const [info, setInfo] = useState<ContactInfo | null>(null);

	useEffect(() => {
		void fetchContactInfo().then(setInfo);
	}, []);

	if (!info) {
		return (
			<div className="mx-auto max-w-lg px-4 py-6">
				<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
				<ServiceLoading compact />
			</div>
		);
	}

	const phoneHref = info.phone
		? `tel:${info.phone.replace(/\s+/g, "")}`
		: null;
	const emailHref = `mailto:${info.email}`;

	return (
		<div className="mx-auto max-w-lg px-4 pb-10 pt-4">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<h1 className="admin-page-title mt-2">{t("contactUs")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("providerContactHint")}
			</p>

			<div className="mt-6 overflow-hidden rounded-xl bg-white">
				<a
					href={info.contactPageUrl}
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
				>
					<MessageSquareIcon className="size-5.5 shrink-0 text-foreground" strokeWidth={1.75} />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium">{t("providerContactPage")}</p>
						<p className="truncate text-xs text-muted-foreground">
							{info.contactPageUrl}
						</p>
					</div>
				</a>
				<div className="mx-4 border-t border-black/5" />
				<a
					href={info.websiteUrl}
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
				>
					<GlobeIcon className="size-5.5 shrink-0 text-foreground" strokeWidth={1.75} />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium">{t("providerContactWebsite")}</p>
						<p className="truncate text-xs text-muted-foreground">
							{info.websiteUrl}
						</p>
					</div>
				</a>
				{phoneHref ? (
					<>
						<div className="mx-4 border-t border-black/5" />
						<a
							href={phoneHref}
							className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
						>
							<PhoneIcon className="size-5.5 shrink-0 text-foreground" strokeWidth={1.75} />
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium">{t("phone")}</p>
								<p className="text-xs text-muted-foreground">{info.phone}</p>
							</div>
						</a>
					</>
				) : null}
				<div className="mx-4 border-t border-black/5" />
				<a
					href={emailHref}
					className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
				>
					<MailIcon className="size-5.5 shrink-0 text-foreground" strokeWidth={1.75} />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium">{t("email")}</p>
						<p className="truncate text-xs text-muted-foreground">{info.email}</p>
					</div>
				</a>
				<div className="mx-4 border-t border-black/5" />
				<div className="px-4 py-3">
					<TelegramLink className="w-full justify-start" />
				</div>
			</div>
		</div>
	);
}
