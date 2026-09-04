"use client";

import { useCallback, useEffect, useState } from "react";

import {
	clearGuestBrowse,
	enableGuestBrowse,
	isGuestBrowse,
} from "@/lib/guest";

export function useGuestBrowse() {
	const [guest, setGuest] = useState(false);

	useEffect(() => {
		setGuest(isGuestBrowse());
		function onStorage(e: StorageEvent) {
			if (e.key === "zemen_guest_browse") setGuest(isGuestBrowse());
		}
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	const enterGuest = useCallback(() => {
		enableGuestBrowse();
		setGuest(true);
	}, []);

	const exitGuest = useCallback(() => {
		clearGuestBrowse();
		setGuest(false);
	}, []);

	return { isGuest: guest, enterGuest, exitGuest };
}
