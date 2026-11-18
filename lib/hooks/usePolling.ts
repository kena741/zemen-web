"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight interval poller for backend-mode chat/notifications.
 * Pauses while the document is hidden; cleans up on unmount.
 */
export function usePolling(
	callback: () => void | Promise<void>,
	intervalMs: number,
	enabled = true,
): void {
	const cbRef = useRef(callback);
	cbRef.current = callback;

	useEffect(() => {
		if (!enabled || intervalMs <= 0) return;

		let cancelled = false;
		const tick = () => {
			if (cancelled) return;
			if (typeof document !== "undefined" && document.hidden) return;
			void cbRef.current();
		};

		tick();
		const id = window.setInterval(tick, intervalMs);
		const onVis = () => {
			if (!document.hidden) tick();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			cancelled = true;
			window.clearInterval(id);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, [intervalMs, enabled]);
}
