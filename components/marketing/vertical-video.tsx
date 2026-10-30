"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
	const total = Math.max(0, Math.ceil(seconds));
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Vertical short-video player. Autoplays muted (browsers block sound without
 * a tap), loops, and pauses while scrolled out of view. Tapping the video or
 * the play button pauses or resumes it; a user pause sticks until they resume.
 */
export function VerticalVideo({
	src,
	poster,
	title,
	caption,
	durationSeconds,
	className,
}: {
	src: string;
	poster: string;
	/** Accessible name for the video. */
	title: string;
	/** Short line in the bottom bar, next to the play button. */
	caption?: string;
	/** Shown as time left until the file's metadata loads. */
	durationSeconds?: number;
	className?: string;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const userPaused = useRef(false);
	const [playing, setPlaying] = useState(false);
	const [muted, setMuted] = useState(true);
	const [timeLeft, setTimeLeft] = useState(durationSeconds ?? 0);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		// React doesn't render the muted attribute; iOS needs it set before play().
		video.muted = true;

		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduceMotion) userPaused.current = true;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !userPaused.current) {
					void video.play().catch(() => setPlaying(false));
				} else if (!entry.isIntersecting) {
					video.pause();
				}
			},
			{ threshold: 0.5 },
		);
		observer.observe(video);

		// Browsers pause muted video in background tabs; resume on return.
		function onVisibilityChange() {
			if (document.visibilityState === "visible" && !userPaused.current && video) {
				const rect = video.getBoundingClientRect();
				if (rect.bottom > 0 && rect.top < window.innerHeight) {
					void video.play().catch(() => setPlaying(false));
				}
			}
		}
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			observer.disconnect();
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	function togglePlay() {
		const video = videoRef.current;
		if (!video) return;
		if (video.paused) {
			userPaused.current = false;
			void video.play().catch(() => setPlaying(false));
		} else {
			userPaused.current = true;
			video.pause();
		}
	}

	function toggleMute() {
		const video = videoRef.current;
		if (!video) return;
		video.muted = !video.muted;
		setMuted(video.muted);
		if (!video.muted && video.paused) {
			userPaused.current = false;
			void video.play().catch(() => setPlaying(false));
		}
	}

	return (
		<figure
			className={cn(
				"relative aspect-[9/16] overflow-hidden rounded-[1.5rem] bg-[#0f1a0c] shadow-[0_24px_60px_-20px_rgba(15,26,12,0.35)] ring-1 ring-black/5",
				className,
			)}
		>
			<video
				ref={videoRef}
				src={src}
				poster={poster}
				aria-label={title}
				className="absolute inset-0 size-full object-cover"
				autoPlay
				muted
				loop
				playsInline
				preload="auto"
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onTimeUpdate={(event) => {
					const video = event.currentTarget;
					if (video.duration) setTimeLeft(video.duration - video.currentTime);
				}}
			/>

			{/* Whole-video tap target for play/pause */}
			<button
				type="button"
				onClick={togglePlay}
				aria-label={playing ? "Pause video" : "Play video"}
				className="absolute inset-0 focus-visible:outline-none"
			/>

			<button
				type="button"
				onClick={toggleMute}
				aria-label={muted ? "Turn sound on" : "Turn sound off"}
				aria-pressed={!muted}
				className="absolute right-4 top-4 flex h-10 items-center gap-2 rounded-full bg-black/40 px-4 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/55 focus-visible:outline-2 focus-visible:outline-white"
			>
				{muted ? (
					<VolumeXIcon className="size-4" aria-hidden />
				) : (
					<Volume2Icon className="size-4" aria-hidden />
				)}
				{muted ? "Sound off" : "Sound on"}
			</button>

			<div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/65 via-black/30 to-transparent px-4 pb-4 pt-16 text-white">
				<button
					type="button"
					onClick={togglePlay}
					aria-label={playing ? "Pause video" : "Play video"}
					className="pointer-events-auto flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#0f1a0c] shadow-md transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
				>
					{playing ? (
						<PauseIcon className="size-4 fill-current" aria-hidden />
					) : (
						<PlayIcon className="ml-0.5 size-4 fill-current" aria-hidden />
					)}
				</button>
				{caption ? (
					<figcaption className="min-w-0 flex-1 truncate text-[15px] font-medium">
						{caption}
					</figcaption>
				) : (
					<span className="flex-1" />
				)}
				{timeLeft > 0 ? (
					<span className="text-sm font-medium tabular-nums text-white/90">
						{formatTime(timeLeft)}
					</span>
				) : null}
			</div>
		</figure>
	);
}
