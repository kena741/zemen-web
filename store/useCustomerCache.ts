"use client";

import { useCallback, useEffect } from "react";

import { useAppDispatch, useAppSelector } from "./hooks";
import {
	loadAddresses,
	loadBookingDetail,
	loadBookings,
	loadCategories,
	loadFavorites,
	loadHomeFeed,
	loadInbox,
	loadNotifications,
	loadRequests,
	loadServiceDetail,
	loadServiceList,
	loadWallet,
	selectCustomerCache,
	servicesListKey,
	type CacheEntry,
} from "./customerCacheSlice";

function useCacheResource<T>(entry: CacheEntry<T>) {
	const loading = entry.fetchedAt == null && entry.status !== "failed";
	const refreshing = entry.status === "loading" && entry.fetchedAt != null;
	return { ...entry, loading, refreshing };
}

export function useCachedHomeFeed() {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectCustomerCache(s).home);
	const view = useCacheResource(entry);

	useEffect(() => {
		void dispatch(loadHomeFeed(undefined));
	}, [dispatch]);

	const refresh = useCallback(() => {
		void dispatch(loadHomeFeed(true));
	}, [dispatch]);

	return { ...view, refresh };
}

export function useCachedCategories() {
	const dispatch = useAppDispatch();
	const cache = useAppSelector(selectCustomerCache);
	const fromHome =
		cache.home.status === "succeeded" && cache.home.data.categories.length > 0;
	const entry = fromHome
		? {
				...cache.categories,
				data: cache.home.data.categories,
				status: "succeeded" as const,
				fetchedAt: cache.home.fetchedAt,
			}
		: cache.categories;
	const view = useCacheResource(entry);

	useEffect(() => {
		if (fromHome) return;
		void dispatch(loadCategories(undefined));
	}, [dispatch, fromHome]);

	const refresh = useCallback(() => {
		void dispatch(loadCategories(true));
	}, [dispatch]);

	return { ...view, refresh };
}

export function useCachedServiceList(params?: {
	categoryId?: string;
	featuredOnly?: boolean;
}) {
	const dispatch = useAppDispatch();
	const key = servicesListKey(params);
	const entry = useAppSelector(
		(s) =>
			selectCustomerCache(s).serviceLists[key] ?? {
				data: [] as never[],
				status: "idle" as const,
				error: null,
				fetchedAt: null,
			},
	);
	const view = useCacheResource(entry);

	useEffect(() => {
		void dispatch(loadServiceList({ ...params }));
	}, [dispatch, key]); // eslint-disable-line react-hooks/exhaustive-deps

	const refresh = useCallback(() => {
		void dispatch(loadServiceList({ ...params, force: true }));
	}, [dispatch, params?.categoryId, params?.featuredOnly]); // eslint-disable-line react-hooks/exhaustive-deps

	return { ...view, refresh };
}

export function useCachedServiceDetail(id: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector(
		(s) =>
			selectCustomerCache(s).serviceById[id] ?? {
				data: null,
				status: "idle" as const,
				error: null,
				fetchedAt: null,
			},
	);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!id) return;
		void dispatch(loadServiceDetail({ id }));
	}, [dispatch, id]);

	const refresh = useCallback(() => {
		if (!id) return;
		void dispatch(loadServiceDetail({ id, force: true }));
	}, [dispatch, id]);

	return { ...view, service: entry.data, refresh };
}

export function useCachedBookings(customerId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectCustomerCache(s).bookings);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!customerId) return;
		void dispatch(loadBookings({ customerId }));
	}, [dispatch, customerId]);

	const refresh = useCallback(() => {
		if (!customerId) return;
		void dispatch(loadBookings({ customerId, force: true }));
	}, [dispatch, customerId]);

	return { ...view, refresh };
}

export function useCachedBookingDetail(id: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector(
		(s) =>
			selectCustomerCache(s).bookingById[id] ?? {
				data: null,
				status: "idle" as const,
				error: null,
				fetchedAt: null,
			},
	);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!id) return;
		void dispatch(loadBookingDetail({ id }));
	}, [dispatch, id]);

	const refresh = useCallback(() => {
		if (!id) return;
		void dispatch(loadBookingDetail({ id, force: true }));
	}, [dispatch, id]);

	return { ...view, booking: entry.data, refresh };
}

export function useCachedFavorites(userId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectCustomerCache(s).favorites);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!userId) return;
		void dispatch(loadFavorites({ userId }));
	}, [dispatch, userId]);

	const refresh = useCallback(() => {
		if (!userId) return;
		void dispatch(loadFavorites({ userId, force: true }));
	}, [dispatch, userId]);

	return { ...view, refresh };
}

export function useCachedRequests(customerId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectCustomerCache(s).requests);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!customerId) return;
		void dispatch(loadRequests({ customerId }));
	}, [dispatch, customerId]);

	const refresh = useCallback(() => {
		if (!customerId) return;
		void dispatch(loadRequests({ customerId, force: true }));
	}, [dispatch, customerId]);

	return { ...view, refresh };
}

export function useCachedInbox(userId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectCustomerCache(s).inbox);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!userId) return;
		void dispatch(loadInbox({ userId }));
	}, [dispatch, userId]);

	const refresh = useCallback(() => {
		if (!userId) return;
		void dispatch(loadInbox({ userId, force: true }));
	}, [dispatch, userId]);

	return { ...view, refresh };
}

export function useCachedNotifications(customerId: string) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectCustomerCache(s).notifications);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!customerId) return;
		void dispatch(loadNotifications({ customerId }));
	}, [dispatch, customerId]);

	const refresh = useCallback(() => {
		if (!customerId) return;
		void dispatch(loadNotifications({ customerId, force: true }));
	}, [dispatch, customerId]);

	return { ...view, refresh };
}

export function useCachedWallet(params: {
	authUserId: string;
	customerId: string;
	balanceHint?: string | null;
}) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectCustomerCache(s).wallet);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!params.authUserId) return;
		void dispatch(
			loadWallet({
				authUserId: params.authUserId,
				customerId: params.customerId,
				balanceHint: params.balanceHint,
			}),
		);
	}, [dispatch, params.authUserId, params.customerId, params.balanceHint]);

	const refresh = useCallback(() => {
		if (!params.authUserId) return;
		void dispatch(
			loadWallet({
				authUserId: params.authUserId,
				customerId: params.customerId,
				balanceHint: params.balanceHint,
				force: true,
			}),
		);
	}, [dispatch, params.authUserId, params.customerId, params.balanceHint]);

	return { ...view, refresh };
}

export function useCachedAddresses(params: {
	customerId: string;
	authUserId?: string;
}) {
	const dispatch = useAppDispatch();
	const entry = useAppSelector((s) => selectCustomerCache(s).addresses);
	const view = useCacheResource(entry);

	useEffect(() => {
		if (!params.customerId) return;
		void dispatch(loadAddresses(params));
	}, [dispatch, params.customerId, params.authUserId]);

	const refresh = useCallback(() => {
		if (!params.customerId) return;
		void dispatch(loadAddresses({ ...params, force: true }));
	}, [dispatch, params.customerId, params.authUserId]);

	return { ...view, refresh };
}
