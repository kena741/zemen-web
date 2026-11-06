"use client";

import { useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

import { useLocale } from "@/lib/i18n";

export function ImageLightbox({
	images,
	index,
	onClose,
	onIndexChange,
}: {
	images: string[];
	index: number;
	onClose: () => void;
	onIndexChange: (index: number) => void;
}) {
	const { t } = useLocale();
	const total = images.length;
	const safeIndex = total ? ((index % total) + total) % total : 0;
	const src = images[safeIndex];

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft" && total > 1) {
				onIndexChange((safeIndex - 1 + total) % total);
			}
			if (e.key === "ArrowRight" && total > 1) {
				onIndexChange((safeIndex + 1) % total);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose, onIndexChange, safeIndex, total]);

	if (!src) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
			role="presentation"
		>
			<button
				type="button"
				aria-label={t("commonClose")}
				className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
				onClick={onClose}
			>
				<XIcon className="size-5" />
			</button>
			{total > 1 ? (
				<p className="absolute top-5 left-1/2 -translate-x-1/2 text-[13px] font-medium text-white/80 tabular-nums">
					{safeIndex + 1} / {total}
				</p>
			) : null}
			{total > 1 ? (
				<button
					type="button"
					aria-label={t("commonPrevious")}
					className="absolute left-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:left-6"
					onClick={(e) => {
						e.stopPropagation();
						onIndexChange((safeIndex - 1 + total) % total);
					}}
				>
					<ChevronLeftIcon className="size-5" />
				</button>
			) : null}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={src}
				alt=""
				className="max-h-[85vh] max-w-full rounded-lg object-contain"
				onClick={(e) => e.stopPropagation()}
			/>
			{total > 1 ? (
				<button
					type="button"
					aria-label={t("commonNext")}
					className="absolute right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:right-6"
					onClick={(e) => {
						e.stopPropagation();
						onIndexChange((safeIndex + 1) % total);
					}}
				>
					<ChevronRightIcon className="size-5" />
				</button>
			) : null}
		</div>
	);
}
