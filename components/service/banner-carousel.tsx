"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { BannerItem } from "@/services/catalog/catalogApi";

const AUTO_MS = 4000;
const SLIDE_MS = 420;

export function BannerCarousel({
	banners,
	intervalMs = AUTO_MS,
	className,
}: {
	banners: BannerItem[];
	intervalMs?: number;
	className?: string;
}) {
	const items = banners.filter((b) => b.image).slice(0, 8);
	const [index, setIndex] = useState(0);
	const [paused, setPaused] = useState(false);
	const touchStartX = useRef<number | null>(null);

	useEffect(() => {
		setIndex(0);
	}, [items.length]);

	useEffect(() => {
		if (items.length < 2 || paused) return;
		const id = window.setInterval(() => {
			setIndex((i) => (i + 1) % items.length);
		}, intervalMs);
		return () => window.clearInterval(id);
	}, [items.length, intervalMs, paused]);

	if (items.length === 0) return null;

	function goTo(next: number) {
		setIndex(((next % items.length) + items.length) % items.length);
	}

	return (
		<section
			className={cn("relative", className)}
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onTouchStart={(e) => {
				touchStartX.current = e.touches[0]?.clientX ?? null;
				setPaused(true);
			}}
			onTouchEnd={(e) => {
				const start = touchStartX.current;
				touchStartX.current = null;
				setPaused(false);
				if (start == null) return;
				const end = e.changedTouches[0]?.clientX ?? start;
				const dx = end - start;
				if (Math.abs(dx) < 40) return;
				goTo(index + (dx < 0 ? 1 : -1));
			}}
		>
			<div className="relative aspect-[3.8/1] w-full overflow-hidden rounded-xl bg-muted">
				<div
					className="flex h-full transition-transform ease-in-out"
					style={{
						width: `${items.length * 100}%`,
						transform: `translateX(-${(index * 100) / items.length}%)`,
						transitionDuration: `${SLIDE_MS}ms`,
					}}
				>
					{items.map((b) => (
						<div
							key={b.id}
							className="relative h-full shrink-0"
							style={{ width: `${100 / items.length}%` }}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={b.image!}
								alt={b.title ?? ""}
								className="size-full object-cover"
								draggable={false}
							/>
						</div>
					))}
				</div>
			</div>

			{items.length > 1 ? (
				<div className="mt-2.5 flex items-center justify-center gap-1.5">
					{items.map((b, i) => (
						<button
							key={b.id}
							type="button"
							aria-label={`Banner ${i + 1}`}
							onClick={() => goTo(i)}
							className={cn(
								"h-1.5 rounded-full transition-all duration-300",
								i === index
									? "w-4 bg-primary"
									: "w-1.5 bg-primary/25",
							)}
						/>
					))}
				</div>
			) : null}
		</section>
	);
}
