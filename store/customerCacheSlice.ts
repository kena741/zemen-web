import {
	createAsyncThunk,
	createSlice,
	type PayloadAction,
} from "@reduxjs/toolkit";

import {
	fetchCatalogServiceById,
	fetchCatalogServices,
	fetchCategories,
	fetchFavoriteServices,
	fetchHomeFeed,
	type BannerItem,
} from "@/services/catalog/catalogApi";
import {
	fetchCustomerBookingById,
	fetchCustomerBookings,
	fetchCustomerJobRequests,
} from "@/services/customer/bookingsApi";
import type { Booking } from "@/services/bookings/types";
import {
	fetchCustomerNotifications,
	fetchInbox,
} from "@/services/chat/chatApi";
import type { AppNotification, InboxThread } from "@/services/chat/types";
import type {
	ProviderService,
	ServiceCategory,
} from "@/services/services/types";
import { fetchWalletTransactions } from "@/services/wallet/walletApi";
import type { WalletTransaction } from "@/services/wallet/types";
import { getSupabase } from "@/lib/supabase/client";
import { logoutUser } from "./authSlice";

export type CacheStatus = "idle" | "loading" | "succeeded" | "failed";

export type CacheEntry<T> = {
	data: T;
	status: CacheStatus;
	error: string | null;
	fetchedAt: number | null;
};

function emptyEntry<T>(data: T): CacheEntry<T> {
	return { data, status: "idle", error: null, fetchedAt: null };
}

export type HomeFeedData = {
	categories: ServiceCategory[];
	banners: BannerItem[];
	featured: ProviderService[];
	services: ProviderService[];
};

export type AddressItem = {
	id: string;
	label: string;
	full: string;
	isDefault: boolean;
};

export type WalletCacheData = {
	balance: number;
	transactions: WalletTransaction[];
};

type CustomerCacheState = {
	home: CacheEntry<HomeFeedData>;
	categories: CacheEntry<ServiceCategory[]>;
	/** keyed by listKey e.g. all | featured | cat:xyz */
	serviceLists: Record<string, CacheEntry<ProviderService[]>>;
	serviceById: Record<string, CacheEntry<ProviderService | null>>;
	bookings: CacheEntry<Booking[]>;
	bookingById: Record<string, CacheEntry<Booking | null>>;
	favorites: CacheEntry<ProviderService[]>;
	requests: CacheEntry<Record<string, unknown>[]>;
	inbox: CacheEntry<InboxThread[]>;
	notifications: CacheEntry<AppNotification[]>;
	wallet: CacheEntry<WalletCacheData>;
	addresses: CacheEntry<AddressItem[]>;
};

const emptyHome: HomeFeedData = {
	categories: [],
	banners: [],
	featured: [],
	services: [],
};

const initialState: CustomerCacheState = {
	home: emptyEntry(emptyHome),
	categories: emptyEntry([]),
	serviceLists: {},
	serviceById: {},
	bookings: emptyEntry([]),
	bookingById: {},
	favorites: emptyEntry([]),
	requests: emptyEntry([]),
	inbox: emptyEntry([]),
	notifications: emptyEntry([]),
	wallet: emptyEntry({ balance: 0, transactions: [] }),
	addresses: emptyEntry([]),
};

function shouldFetch(entry: CacheEntry<unknown> | undefined, force?: boolean) {
	if (force) return true;
	if (!entry) return true;
	if (entry.status === "loading") return false;
	if (entry.status === "succeeded") return false;
	return true;
}

export function servicesListKey(params?: {
	categoryId?: string;
	featuredOnly?: boolean;
}): string {
	if (params?.featuredOnly) return "featured";
	if (params?.categoryId) return `cat:${params.categoryId}`;
	return "all";
}

export const loadHomeFeed = createAsyncThunk(
	"customerCache/home",
	async () => {
		const res = await fetchHomeFeed();
		if (res.error) throw new Error(res.error);
		return {
			categories: res.categories,
			banners: res.banners,
			featured: res.featured,
			services: res.services,
		} satisfies HomeFeedData;
	},
	{
		condition: (force: boolean | undefined, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(state.customerCache.home, Boolean(force));
		},
	},
);

export const loadCategories = createAsyncThunk(
	"customerCache/categories",
	async () => {
		const res = await fetchCategories();
		if (res.error) throw new Error(res.error);
		return res.categories;
	},
	{
		condition: (force: boolean | undefined, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			const home = state.customerCache.home;
			if (
				!force &&
				home.status === "succeeded" &&
				home.data.categories.length
			) {
				return false;
			}
			return shouldFetch(state.customerCache.categories, Boolean(force));
		},
	},
);

export const loadServiceList = createAsyncThunk(
	"customerCache/serviceList",
	async (params: {
		categoryId?: string;
		featuredOnly?: boolean;
		force?: boolean;
	}) => {
		const res = await fetchCatalogServices({
			categoryId: params.categoryId,
			featuredOnly: params.featuredOnly,
		});
		if (res.error) throw new Error(res.error);
		return {
			key: servicesListKey(params),
			services: res.services,
		};
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			const key = servicesListKey(params);
			return shouldFetch(
				state.customerCache.serviceLists[key],
				Boolean(params.force),
			);
		},
	},
);

export const loadServiceDetail = createAsyncThunk(
	"customerCache/serviceDetail",
	async (params: { id: string; force?: boolean }) => {
		const res = await fetchCatalogServiceById(params.id);
		if (res.error && !res.service) throw new Error(res.error);
		return { id: params.id, service: res.service };
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(
				state.customerCache.serviceById[params.id],
				Boolean(params.force),
			);
		},
	},
);

export const loadBookings = createAsyncThunk(
	"customerCache/bookings",
	async (params: { customerId: string; force?: boolean }) => {
		const res = await fetchCustomerBookings(params.customerId);
		if (res.error) throw new Error(res.error);
		return res.bookings;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(
				state.customerCache.bookings,
				Boolean(params.force),
			);
		},
	},
);

export const loadBookingDetail = createAsyncThunk(
	"customerCache/bookingDetail",
	async (params: { id: string; force?: boolean }) => {
		const res = await fetchCustomerBookingById(params.id);
		if (res.error && !res.booking) throw new Error(res.error);
		return { id: params.id, booking: res.booking };
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(
				state.customerCache.bookingById[params.id],
				Boolean(params.force),
			);
		},
	},
);

export const loadFavorites = createAsyncThunk(
	"customerCache/favorites",
	async (params: { userId: string; force?: boolean }) => {
		const res = await fetchFavoriteServices(params.userId);
		if (res.error) throw new Error(res.error);
		return res.services;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(
				state.customerCache.favorites,
				Boolean(params.force),
			);
		},
	},
);

export const loadRequests = createAsyncThunk(
	"customerCache/requests",
	async (params: { customerId: string; force?: boolean }) => {
		const res = await fetchCustomerJobRequests(params.customerId);
		if (res.error) throw new Error(res.error);
		return res.jobs;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(
				state.customerCache.requests,
				Boolean(params.force),
			);
		},
	},
);

export const loadInbox = createAsyncThunk(
	"customerCache/inbox",
	async (params: { userId: string; force?: boolean }) => {
		const res = await fetchInbox(params.userId);
		if (res.error) throw new Error(res.error);
		return res.threads;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(state.customerCache.inbox, Boolean(params.force));
		},
	},
);

export const loadNotifications = createAsyncThunk(
	"customerCache/notifications",
	async (params: { customerId: string; force?: boolean }) => {
		const res = await fetchCustomerNotifications(params.customerId);
		if (res.error) throw new Error(res.error);
		return res.notifications;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(
				state.customerCache.notifications,
				Boolean(params.force),
			);
		},
	},
);

export const loadWallet = createAsyncThunk(
	"customerCache/wallet",
	async (params: {
		authUserId: string;
		customerId: string;
		balanceHint?: string | null;
		force?: boolean;
	}) => {
		const txs = await fetchWalletTransactions({
			authUserId: params.authUserId,
			providerId: params.customerId,
			type: "customer",
		});
		if (txs.error) throw new Error(txs.error);
		return {
			balance: Number(params.balanceHint ?? 0) || 0,
			transactions: txs.transactions,
		} satisfies WalletCacheData;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(state.customerCache.wallet, Boolean(params.force));
		},
	},
);

function parseAddresses(raw: unknown): AddressItem[] {
	if (!Array.isArray(raw)) return [];
	return raw.map((item, i) => {
		const row =
			item && typeof item === "object"
				? (item as Record<string, unknown>)
				: {};
		const parts = [
			row.address ?? row.Address,
			row.locality ?? row.Locality,
			row.landmark ?? row.Landmark,
		]
			.map((v) => (v != null ? String(v).trim() : ""))
			.filter(Boolean);
		return {
			id: String(row.id ?? i),
			label: String(row.addressAs ?? row.name ?? row.label ?? "Address"),
			full: parts.join(", ") || String(row.addressAs ?? "Saved address"),
			isDefault: row.isDefault === true || row.is_default === true,
		};
	});
}

export const loadAddresses = createAsyncThunk(
	"customerCache/addresses",
	async (params: {
		customerId: string;
		authUserId?: string;
		force?: boolean;
	}) => {
		const { data, error } = await getSupabase()
			.from("customer")
			.select("addAddresses, add_addresses, default_address")
			.or(
				`id.eq.${params.customerId}${
					params.authUserId ? `,user_id.eq.${params.authUserId}` : ""
				}`,
			)
			.maybeSingle();
		if (error) throw new Error(error.message);
		const row = (data ?? {}) as Record<string, unknown>;
		return parseAddresses(row.addAddresses ?? row.add_addresses);
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { customerCache: CustomerCacheState };
			return shouldFetch(
				state.customerCache.addresses,
				Boolean(params.force),
			);
		},
	},
);

const customerCacheSlice = createSlice({
	name: "customerCache",
	initialState,
	reducers: {
		clearCustomerCache() {
			return initialState;
		},
		invalidateBookings(state) {
			state.bookings = emptyEntry([]);
			state.bookingById = {};
		},
		invalidateFavorites(state) {
			state.favorites = emptyEntry([]);
		},
		invalidateRequests(state) {
			state.requests = emptyEntry([]);
		},
		invalidateInbox(state) {
			state.inbox = emptyEntry([]);
		},
		patchServiceInCache(
			state,
			action: PayloadAction<{ id: string; patch: Partial<ProviderService> }>,
		) {
			const { id, patch } = action.payload;
			const detail = state.serviceById[id];
			if (detail?.data) {
				detail.data = { ...detail.data, ...patch };
			}
			const applyList = (list: ProviderService[]) =>
				list.map((s) => (s.id === id ? { ...s, ...patch } : s));
			if (state.home.status === "succeeded") {
				state.home.data.services = applyList(state.home.data.services);
				state.home.data.featured = applyList(state.home.data.featured);
			}
			for (const key of Object.keys(state.serviceLists)) {
				const entry = state.serviceLists[key];
				if (entry?.status === "succeeded") {
					entry.data = applyList(entry.data);
				}
			}
			if (state.favorites.status === "succeeded") {
				state.favorites.data = applyList(state.favorites.data);
			}
		},
		upsertBookingInCache(state, action: PayloadAction<Booking>) {
			const booking = action.payload;
			state.bookingById[booking.id] = {
				data: booking,
				status: "succeeded",
				error: null,
				fetchedAt: Date.now(),
			};
			if (state.bookings.status === "succeeded") {
				const idx = state.bookings.data.findIndex((b) => b.id === booking.id);
				if (idx >= 0) state.bookings.data[idx] = booking;
				else state.bookings.data = [booking, ...state.bookings.data];
			} else {
				state.bookings = emptyEntry([]);
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(logoutUser.fulfilled, () => initialState)
			.addCase(loadHomeFeed.pending, (state) => {
				state.home.status = "loading";
				state.home.error = null;
			})
			.addCase(loadHomeFeed.fulfilled, (state, action) => {
				state.home = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
				state.categories = {
					data: action.payload.categories,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadHomeFeed.rejected, (state, action) => {
				state.home.status = "failed";
				state.home.error = action.error.message ?? "Failed to load";
			})
			.addCase(loadCategories.pending, (state) => {
				if (state.categories.status !== "succeeded") {
					state.categories.status = "loading";
				}
			})
			.addCase(loadCategories.fulfilled, (state, action) => {
				state.categories = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadCategories.rejected, (state, action) => {
				state.categories.status = "failed";
				state.categories.error = action.error.message ?? "Failed";
			})
			.addCase(loadServiceList.pending, (state, action) => {
				const key = servicesListKey(action.meta.arg);
				const prev = state.serviceLists[key] ?? emptyEntry([]);
				state.serviceLists[key] = {
					...prev,
					status: "loading",
					error: null,
				};
			})
			.addCase(loadServiceList.fulfilled, (state, action) => {
				state.serviceLists[action.payload.key] = {
					data: action.payload.services,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadServiceList.rejected, (state, action) => {
				const key = servicesListKey(action.meta.arg);
				const prev = state.serviceLists[key] ?? emptyEntry([]);
				state.serviceLists[key] = {
					...prev,
					status: "failed",
					error: action.error.message ?? "Failed",
				};
			})
			.addCase(loadServiceDetail.pending, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.serviceById[id] ?? emptyEntry(null);
				state.serviceById[id] = { ...prev, status: "loading", error: null };
			})
			.addCase(loadServiceDetail.fulfilled, (state, action) => {
				state.serviceById[action.payload.id] = {
					data: action.payload.service,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadServiceDetail.rejected, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.serviceById[id] ?? emptyEntry(null);
				state.serviceById[id] = {
					...prev,
					status: "failed",
					error: action.error.message ?? "Failed",
				};
			})
			.addCase(loadBookings.pending, (state) => {
				if (state.bookings.status !== "succeeded") {
					state.bookings.status = "loading";
				}
			})
			.addCase(loadBookings.fulfilled, (state, action) => {
				state.bookings = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadBookings.rejected, (state, action) => {
				state.bookings.status = "failed";
				state.bookings.error = action.error.message ?? "Failed";
			})
			.addCase(loadBookingDetail.pending, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.bookingById[id] ?? emptyEntry(null);
				state.bookingById[id] = { ...prev, status: "loading", error: null };
			})
			.addCase(loadBookingDetail.fulfilled, (state, action) => {
				state.bookingById[action.payload.id] = {
					data: action.payload.booking,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadBookingDetail.rejected, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.bookingById[id] ?? emptyEntry(null);
				state.bookingById[id] = {
					...prev,
					status: "failed",
					error: action.error.message ?? "Failed",
				};
			})
			.addCase(loadFavorites.pending, (state) => {
				if (state.favorites.status !== "succeeded") {
					state.favorites.status = "loading";
				}
			})
			.addCase(loadFavorites.fulfilled, (state, action) => {
				state.favorites = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadFavorites.rejected, (state, action) => {
				state.favorites.status = "failed";
				state.favorites.error = action.error.message ?? "Failed";
			})
			.addCase(loadRequests.pending, (state) => {
				if (state.requests.status !== "succeeded") {
					state.requests.status = "loading";
				}
			})
			.addCase(loadRequests.fulfilled, (state, action) => {
				state.requests = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadRequests.rejected, (state, action) => {
				state.requests.status = "failed";
				state.requests.error = action.error.message ?? "Failed";
			})
			.addCase(loadInbox.pending, (state) => {
				if (state.inbox.status !== "succeeded") {
					state.inbox.status = "loading";
				}
			})
			.addCase(loadInbox.fulfilled, (state, action) => {
				state.inbox = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadInbox.rejected, (state, action) => {
				state.inbox.status = "failed";
				state.inbox.error = action.error.message ?? "Failed";
			})
			.addCase(loadNotifications.pending, (state) => {
				if (state.notifications.status !== "succeeded") {
					state.notifications.status = "loading";
				}
			})
			.addCase(loadNotifications.fulfilled, (state, action) => {
				state.notifications = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadNotifications.rejected, (state, action) => {
				state.notifications.status = "failed";
				state.notifications.error = action.error.message ?? "Failed";
			})
			.addCase(loadWallet.pending, (state) => {
				if (state.wallet.status !== "succeeded") {
					state.wallet.status = "loading";
				}
			})
			.addCase(loadWallet.fulfilled, (state, action) => {
				state.wallet = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadWallet.rejected, (state, action) => {
				state.wallet.status = "failed";
				state.wallet.error = action.error.message ?? "Failed";
			})
			.addCase(loadAddresses.pending, (state) => {
				if (state.addresses.status !== "succeeded") {
					state.addresses.status = "loading";
				}
			})
			.addCase(loadAddresses.fulfilled, (state, action) => {
				state.addresses = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadAddresses.rejected, (state, action) => {
				state.addresses.status = "failed";
				state.addresses.error = action.error.message ?? "Failed";
			});
	},
});

export const {
	clearCustomerCache,
	invalidateBookings,
	invalidateFavorites,
	invalidateRequests,
	invalidateInbox,
	patchServiceInCache,
	upsertBookingInCache,
} = customerCacheSlice.actions;

export default customerCacheSlice.reducer;

export const selectCustomerCache = (state: {
	customerCache: CustomerCacheState;
}) => state.customerCache;
