"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
	ChevronRightIcon,
	GlobeIcon,
	HeadphonesIcon,
	MailIcon,
	MessageSquareIcon,
	PhoneIcon,
} from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { TelegramLink } from "@/components/app/telegram-link";
import { WhatsAppLink } from "@/components/app/whatsapp-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
	fetchContactInfo,
	type ContactInfo,
} from "@/services/config/contactApi";

function ContactRow({
	href,
	icon: Icon,
	title,
	subtitle,
	external,
}: {
	href: string;
	icon: ComponentType<{ className?: string; strokeWidth?: number }>;
	title: string;
	subtitle: string;
	external?: boolean;
}) {
	return (
		<a
			href={href}
			{...(external ? { target: "_blank", rel: "noreferrer" } : {})}
			className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted/70"
		>
			<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
				<Icon className="size-5" strokeWidth={1.75} />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-[15px] font-semibold text-foreground">
					{title}
				</span>
				<span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
					{subtitle}
				</span>
			</span>
			<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/70" />
		</a>
	);
}

export function ContactUsView({ backHref }: { backHref: string }) {
	const { t } = useLocale();
	const [info, setInfo] = useState<ContactInfo | null>(null);

	useEffect(() => {
		void fetchContactInfo().then(setInfo);
	}, []);

	if (!info) {
		return (
			<div className="mx-auto max-w-lg px-4 py-6">
				<ProfileBackLink href={backHref} label={t("profileTitle")} />
				<ServiceLoading compact />
			</div>
		);
	}

	const phoneHref = info.phone
		? `tel:${info.phone.replace(/\s+/g, "")}`
		: null;
	const emailHref = `mailto:${info.email}`;

	return (
		<div className="mx-auto max-w-lg px-4 pb-10 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href={backHref} label={t("profileTitle")} />

			<section className="mt-4 overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-foreground shadow-sm">
				<div className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
					<HeadphonesIcon className="size-6" strokeWidth={1.75} />
				</div>
				<h1 className="mt-4 text-[22px] font-bold tracking-tight">
					{t("contactUs")}
				</h1>
				<p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-primary-foreground/85">
					{t("providerContactHint")}
				</p>
			</section>

			<section className="mt-5">
				<h2 className="mb-2 px-0.5 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
					{t("contactDirect")}
				</h2>
				<div
					className={cn(
						"grid gap-3",
						phoneHref ? "grid-cols-2" : "grid-cols-1",
					)}
				>
					{phoneHref ? (
						<a
							href={phoneHref}
							className="flex flex-col items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-colors hover:bg-muted/40 active:scale-[0.99]"
						>
							<span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<PhoneIcon className="size-5" strokeWidth={1.75} />
							</span>
							<span>
								<span className="block text-[15px] font-semibold">
									{t("phone")}
								</span>
								<span className="mt-0.5 block text-[13px] text-muted-foreground">
									{info.phone}
								</span>
							</span>
						</a>
					) : null}
					<a
						href={emailHref}
						className="flex flex-col items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-colors hover:bg-muted/40 active:scale-[0.99]"
					>
						<span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<MailIcon className="size-5" strokeWidth={1.75} />
						</span>
						<span className="min-w-0">
							<span className="block text-[15px] font-semibold">
								{t("email")}
							</span>
							<span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
								{info.email}
							</span>
						</span>
					</a>
				</div>
			</section>

			<section className="mt-5">
				<h2 className="mb-2 px-0.5 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
					{t("contactChat")}
				</h2>
				<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
					<WhatsAppLink className="h-12 w-full justify-center rounded-xl border-0 bg-[#25D366] text-[15px] font-semibold text-white shadow-sm hover:bg-[#1ebe57] hover:text-white" />
					<TelegramLink className="h-12 w-full justify-center rounded-xl border-0 bg-[#229ED9] text-[15px] font-semibold text-white shadow-sm hover:bg-[#1b8fc5] hover:text-white" />
				</div>
			</section>

			<section className="mt-5">
				<h2 className="mb-2 px-0.5 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
					{t("contactMore")}
				</h2>
				<div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
					<ContactRow
						href={info.contactPageUrl}
						icon={MessageSquareIcon}
						title={t("providerContactPage")}
						subtitle={info.contactPageUrl.replace(/^https?:\/\//, "")}
						external
					/>
					<div className="mx-4 border-t border-border/60" />
					<ContactRow
						href={info.websiteUrl}
						icon={GlobeIcon}
						title={t("providerContactWebsite")}
						subtitle={info.websiteUrl.replace(/^https?:\/\//, "")}
						external
					/>
				</div>
			</section>
		</div>
	);
}
