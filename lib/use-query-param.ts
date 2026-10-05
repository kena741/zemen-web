"use client";

import { useSearchParams } from "next/navigation";

/** Read `?id=` from the URL (static-export-safe alternative to useParams). */
export function useQueryId(): string {
	const search = useSearchParams();
	return (search.get("id") ?? "").trim();
}

/** Read `?peerId=` from the URL. */
export function useQueryPeerId(): string {
	const search = useSearchParams();
	return (search.get("peerId") ?? "").trim();
}
