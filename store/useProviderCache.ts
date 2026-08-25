"use client";

import { useCallback, useEffect } from "react";

import { useAppDispatch, useAppSelector } from "./hooks";
import {
	loadProviderBank,
	loadProviderBookingDetail,
	loadProviderBookings,
	loadProviderDashboard,
	loadProviderHandymanDetail,
	loadProviderHandymen,
	loadProviderInbox,
	loadProviderNotifications,
	loadProviderOffers,
	loadProviderServiceDetail,
	loadProviderServices,
	loadProviderWallet,
	selectProviderCache,
	type CacheEntry,
} from "./providerCacheSlice";

function useCacheResource<T>(entry: CacheEntry<T>) {
	const loading = entry.fetchedAt == null && entry.status !== "failed";
	const refreshing = entry.status === "loading" && entry.fetchedAt != null;
	return { ...entry, loading, refreshing };
}

export function useCachedProviderDashboard(providerId: string, year?: number) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectProviderCache(s).dashboard);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!providerId) return;
		void dispatch(loadProviderDashboard({ providerId, year }));
	}, [dispatch, providerId, year]);

	const refresh = useCallback(() => {
		if (!providerId) return;
		void dispatch(loadProviderDashboard({ providerId, year, force: true }));
	}, [dispatch, providerId, year]);

	return { ...view, refresh };
}

export function useCachedProviderBookings(providerId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectProviderCache(s).bookings);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!providerId) return;
		void dispatch(loadProviderBookings({ providerId }));
	}, [dispatch, providerId]);

	const refresh = useCallback(() => {
		if (!providerId) return;
		void dispatch(loadProviderBookings({ providerId, force: true }));
	}, [dispatch, providerId]);

	return { ...view, refresh };
}

export function useCachedProviderBookingDetail(id: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector(
		(s) =>
			selectProviderCache(s).bookingById[id] ?? {
				data: null,
				status: "idle" as const,
				error: null,
				fetchedAt: null,
			},
	);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!id) return;
		void dispatch(loadProviderBookingDetail({ id }));
	}, [dispatch, id]);

	const refresh = useCallback(() => {
		if (!id) return;
		void dispatch(loadProviderBookingDetail({ id, force: true }));
	}, [dispatch, id]);

	return { ...view, booking: entry.data, refresh };
}

export function useCachedProviderServices(providerId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectProviderCache(s).services);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!providerId) return;
		void dispatch(loadProviderServices({ providerId }));
	}, [dispatch, providerId]);

	const refresh = useCallback(() => {
		if (!providerId) return;
		void dispatch(loadProviderServices({ providerId, force: true }));
	}, [dispatch, providerId]);

	return { ...view, refresh };
}

export function useCachedProviderServiceDetail(id: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector(
		(s) =>
			selectProviderCache(s).serviceById[id] ?? {
				data: null,
				status: "idle" as const,
				error: null,
				fetchedAt: null,
			},
	);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!id) return;
		void dispatch(loadProviderServiceDetail({ id }));
	}, [dispatch, id]);

	const refresh = useCallback(() => {
		if (!id) return;
		void dispatch(loadProviderServiceDetail({ id, force: true }));
	}, [dispatch, id]);

	return { ...view, service: entry.data, refresh };
}

export function useCachedProviderOffers(
	providerId: string,
	authUserId?: string,
) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectProviderCache(s).offers);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!providerId && !authUserId) return;
		void dispatch(loadProviderOffers({ providerId, authUserId }));
	}, [dispatch, providerId, authUserId]);

	const refresh = useCallback(() => {
		void dispatch(
			loadProviderOffers({ providerId, authUserId, force: true }),
		);
	}, [dispatch, providerId, authUserId]);

	return { ...view, refresh };
}

export function useCachedProviderHandymen(providerId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectProviderCache(s).handymen);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!providerId) return;
		void dispatch(loadProviderHandymen({ providerId }));
	}, [dispatch, providerId]);

	const refresh = useCallback(() => {
		if (!providerId) return;
		void dispatch(loadProviderHandymen({ providerId, force: true }));
	}, [dispatch, providerId]);

	return { ...view, refresh };
}

export function useCachedProviderHandymanDetail(id: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector(
		(s) =>
			selectProviderCache(s).handymanById[id] ?? {
				data: null,
				status: "idle" as const,
				error: null,
				fetchedAt: null,
			},
	);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!id) return;
		void dispatch(loadProviderHandymanDetail({ id }));
	}, [dispatch, id]);

	const refresh = useCallback(() => {
		if (!id) return;
		void dispatch(loadProviderHandymanDetail({ id, force: true }));
	}, [dispatch, id]);

	return { ...view, handyman: entry.data, refresh };
}

export function useCachedProviderInbox(userId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectProviderCache(s).inbox);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!userId) return;
		void dispatch(loadProviderInbox({ userId }));
	}, [dispatch, userId]);

	const refresh = useCallback(() => {
		if (!userId) return;
		void dispatch(loadProviderInbox({ userId, force: true }));
	}, [dispatch, userId]);

	return { ...view, refresh };
}

export function useCachedProviderNotifications(providerId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectProviderCache(s).notifications);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!providerId) return;
		void dispatch(loadProviderNotifications({ providerId }));
	}, [dispatch, providerId]);

	const refresh = useCallback(() => {
		if (!providerId) return;
		void dispatch(loadProviderNotifications({ providerId, force: true }));
	}, [dispatch, providerId]);

	return { ...view, refresh };
}

export function useCachedProviderWallet(params: {
	authUserId: string;
	providerId: string;
}) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectProviderCache(s).wallet);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!params.authUserId || !params.providerId) return;
		void dispatch(loadProviderWallet(params));
	}, [dispatch, params.authUserId, params.providerId]);

	const refresh = useCallback(() => {
		if (!params.authUserId || !params.providerId) return;
		void dispatch(loadProviderWallet({ ...params, force: true }));
	}, [dispatch, params.authUserId, params.providerId]);

	return { ...view, refresh };
}

export function useCachedProviderBank(params: {
	authUserId: string;
	providerId: string;
}) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectProviderCache(s).bank);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!params.authUserId || !params.providerId) return;
		void dispatch(loadProviderBank(params));
	}, [dispatch, params.authUserId, params.providerId]);

	const refresh = useCallback(() => {
		if (!params.authUserId || !params.providerId) return;
		void dispatch(loadProviderBank({ ...params, force: true }));
	}, [dispatch, params.authUserId, params.providerId]);

	return { ...view, refresh };
}
