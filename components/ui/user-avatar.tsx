"use client";

import { useEffect, useState } from "react";
import { UserIcon } from "lucide-react";

import { initialsFromName, sanitizeImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
	src?: string | null;
	name?: string | null;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
	/** Soft tint for dark brand bands */
	tone?: "default" | "onBrand";
};

const SIZE: Record<NonNullable<UserAvatarProps["size"]>, string> = {
	sm: "size-9 text-xs",
	md: "size-11 text-sm",
	lg: "size-14 text-lg",
	xl: "size-16 text-xl",
};

export function UserAvatar({
	src,
	name,
	size = "md",
	className,
	tone = "default",
}: UserAvatarProps) {
	const safeSrc = sanitizeImageUrl(src);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		setFailed(false);
	}, [safeSrc]);

	const showImage = Boolean(safeSrc) && !failed;
	const initials = initialsFromName(name);

	return (
		<div
			className={cn(
				"relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
				SIZE[size],
				tone === "onBrand"
					? "bg-white/20 text-primary-foreground"
					: "bg-secondary text-brand-ink",
				className,
			)}
			aria-hidden={!name}
		>
			{showImage ? (
				// Use img so onError can fall back reliably (Next/Image is stricter).
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={safeSrc!}
					alt=""
					className="absolute inset-0 size-full object-cover"
					onError={() => setFailed(true)}
					referrerPolicy="no-referrer"
				/>
			) : initials !== "?" ? (
				<span className="select-none">{initials}</span>
			) : (
				<UserIcon className="size-[45%] opacity-70" />
			)}
		</div>
	);
}
