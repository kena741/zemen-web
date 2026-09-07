import {
	createAsyncThunk,
	createSlice,
	type PayloadAction,
} from "@reduxjs/toolkit";

import {
	fetchBookingById,
	fetchDashboardSnapshot,
	fetchProviderBookings,
	fetchYearlyRevenueChart,
	type RevenueChartPoint,
} from "@/services/bookings/bookingsApi";
import type { Booking } from "@/services/bookings/types";
import { fetchInbox, fetchNotifications } from "@/services/chat/chatApi";
import type { AppNotification, InboxThread } from "@/services/chat/types";
import { fetchBankMethods } from "@/services/bank/bankApi";
import type { BankMethod } from "@/services/bank/types";
import {
	fetchHandymanById,
	fetchProviderHandymen,
} from "@/services/handymen/handymenApi";
import type { Handyman } from "@/services/handymen/types";
import {
	fetchProviderOffers,
	type ServiceOffer,
} from "@/services/offers/offersApi";
import {
	fetchProviderServices,
	fetchServiceById,
} from "@/services/services/servicesApi";
import type { ProviderService } from "@/services/services/types";
import {
	fetchWalletBalance,
	fetchWalletTransactions,
	fetchWithdrawals,
} from "@/services/wallet/walletApi";
import type {
	WalletTransaction,
	WithdrawRequest,
} from "@/services/wallet/types";
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

function shouldFetch(entry: CacheEntry<unknown> | undefined, force?: boolean) {
	if (force) return true;
	if (!entry) return true;
	if (entry.status === "loading") return false;
	if (entry.status === "succeeded") return false;
	return true;
}

export type DashboardData = {
	pending: number;
	upcoming: Booking[];
	totalBookings: number;
	activeServices: number;
	completedThisMonth: number;
	revenueThisMonth: number;
	chartPoints: RevenueChartPoint[];
	chartMonthRevenue: number;
	year: number;
};

export type WalletData = {
	balance: number;
	transactions: WalletTransaction[];
	withdrawals: WithdrawRequest[];
};

type ProviderCacheState = {
	dashboard: CacheEntry<DashboardData>;
	bookings: CacheEntry<Booking[]>;
	bookingById: Record<string, CacheEntry<Booking | null>>;
	services: CacheEntry<ProviderService[]>;
	serviceById: Record<string, CacheEntry<ProviderService | null>>;
	offers: CacheEntry<ServiceOffer[]>;
	handymen: CacheEntry<Handyman[]>;
	handymanById: Record<string, CacheEntry<Handyman | null>>;
	inbox: CacheEntry<InboxThread[]>;
	notifications: CacheEntry<AppNotification[]>;
	wallet: CacheEntry<WalletData>;
	bank: CacheEntry<BankMethod[]>;
};

const emptyDashboard: DashboardData = {
	pending: 0,
	upcoming: [],
	totalBookings: 0,
	activeServices: 0,
	completedThisMonth: 0,
	revenueThisMonth: 0,
	chartPoints: [],
	chartMonthRevenue: 0,
	year: new Date().getFullYear(),
};

const initialState: ProviderCacheState = {
	dashboard: emptyEntry(emptyDashboard),
	bookings: emptyEntry([]),
	bookingById: {},
	services: emptyEntry([]),
	serviceById: {},
	offers: emptyEntry([]),
	handymen: emptyEntry([]),
	handymanById: {},
	inbox: emptyEntry([]),
	notifications: emptyEntry([]),
	wallet: emptyEntry({ balance: 0, transactions: [], withdrawals: [] }),
	bank: emptyEntry([]),
};

export const loadProviderDashboard = createAsyncThunk(
	"providerCache/dashboard",
	async (params: { providerId: string; year?: number; force?: boolean }) => {
		const year = params.year ?? new Date().getFullYear();
		const [snap, chart] = await Promise.all([
			fetchDashboardSnapshot(params.providerId),
			fetchYearlyRevenueChart(params.providerId, year),
		]);
		const err = snap.error || chart.error;
		if (err) throw new Error(err);
		return {
			pending: snap.pending,
			upcoming: snap.upcoming,
			totalBookings: snap.totalBookings,
			activeServices: snap.activeServices,
			completedThisMonth: snap.completedThisMonth,
			revenueThisMonth:
				chart.currentMonthRevenue || snap.revenueThisMonth,
			chartPoints: chart.points,
			chartMonthRevenue: chart.currentMonthRevenue,
			year,
		} satisfies DashboardData;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(
				state.providerCache.dashboard,
				Boolean(params.force),
			);
		},
	},
);

export const loadProviderBookings = createAsyncThunk(
	"providerCache/bookings",
	async (params: { providerId: string; force?: boolean }) => {
		const res = await fetchProviderBookings(params.providerId);
		if (res.error) throw new Error(res.error);
		return res.bookings;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(
				state.providerCache.bookings,
				Boolean(params.force),
			);
		},
	},
);

export const loadProviderBookingDetail = createAsyncThunk(
	"providerCache/bookingDetail",
	async (params: { id: string; force?: boolean }) => {
		const res = await fetchBookingById(params.id);
		if (res.error && !res.booking) throw new Error(res.error);
		return { id: params.id, booking: res.booking };
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(
				state.providerCache.bookingById[params.id],
				Boolean(params.force),
			);
		},
	},
);

export const loadProviderServices = createAsyncThunk(
	"providerCache/services",
	async (params: { providerId: string; force?: boolean }) => {
		const res = await fetchProviderServices(params.providerId);
		if (res.error) throw new Error(res.error);
		return res.services;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(
				state.providerCache.services,
				Boolean(params.force),
			);
		},
	},
);

export const loadProviderServiceDetail = createAsyncThunk(
	"providerCache/serviceDetail",
	async (params: { id: string; force?: boolean }) => {
		const res = await fetchServiceById(params.id);
		if (res.error && !res.service) throw new Error(res.error);
		return { id: params.id, service: res.service };
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(
				state.providerCache.serviceById[params.id],
				Boolean(params.force),
			);
		},
	},
);

export const loadProviderOffers = createAsyncThunk(
	"providerCache/offers",
	async (params: {
		providerId: string;
		authUserId?: string;
		force?: boolean;
	}) => {
		const res = await fetchProviderOffers(
			params.providerId,
			params.authUserId,
		);
		if (res.error) throw new Error(res.error);
		return res.offers;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(state.providerCache.offers, Boolean(params.force));
		},
	},
);

export const loadProviderHandymen = createAsyncThunk(
	"providerCache/handymen",
	async (params: { providerId: string; force?: boolean }) => {
		const res = await fetchProviderHandymen(params.providerId);
		if (res.error) throw new Error(res.error);
		return res.handymen;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(
				state.providerCache.handymen,
				Boolean(params.force),
			);
		},
	},
);

export const loadProviderHandymanDetail = createAsyncThunk(
	"providerCache/handymanDetail",
	async (params: { id: string; force?: boolean }) => {
		const res = await fetchHandymanById(params.id);
		if (res.error && !res.handyman) throw new Error(res.error);
		return { id: params.id, handyman: res.handyman };
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(
				state.providerCache.handymanById[params.id],
				Boolean(params.force),
			);
		},
	},
);

export const loadProviderInbox = createAsyncThunk(
	"providerCache/inbox",
	async (params: { userId: string; force?: boolean }) => {
		const res = await fetchInbox(params.userId);
		if (res.error) throw new Error(res.error);
		return res.threads;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(state.providerCache.inbox, Boolean(params.force));
		},
	},
);

export const loadProviderNotifications = createAsyncThunk(
	"providerCache/notifications",
	async (params: { providerId: string; force?: boolean }) => {
		const res = await fetchNotifications(params.providerId);
		if (res.error) throw new Error(res.error);
		return res.notifications;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(
				state.providerCache.notifications,
				Boolean(params.force),
			);
		},
	},
);

export const loadProviderWallet = createAsyncThunk(
	"providerCache/wallet",
	async (params: {
		authUserId: string;
		providerId: string;
		force?: boolean;
	}) => {
		const [bal, txs, wds] = await Promise.all([
			fetchWalletBalance(params.providerId),
			fetchWalletTransactions({
				authUserId: params.authUserId,
				providerId: params.providerId,
			}),
			fetchWithdrawals({
				authUserId: params.authUserId,
				providerId: params.providerId,
			}),
		]);
		const err = bal.error || txs.error || wds.error;
		if (err) throw new Error(err);
		return {
			balance: bal.balance,
			transactions: txs.transactions,
			withdrawals: wds.withdrawals,
		} satisfies WalletData;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(state.providerCache.wallet, Boolean(params.force));
		},
	},
);

export const loadProviderBank = createAsyncThunk(
	"providerCache/bank",
	async (params: {
		authUserId: string;
		providerId: string;
		force?: boolean;
	}) => {
		const res = await fetchBankMethods({
			authUserId: params.authUserId,
			providerId: params.providerId,
		});
		if (res.error) throw new Error(res.error);
		return res.banks;
	},
	{
		condition: (params, { getState }) => {
			const state = getState() as { providerCache: ProviderCacheState };
			return shouldFetch(state.providerCache.bank, Boolean(params.force));
		},
	},
);

const providerCacheSlice = createSlice({
	name: "providerCache",
	initialState,
	reducers: {
		clearProviderCache() {
			return initialState;
		},
		invalidateProviderBookings(state) {
			state.bookings = emptyEntry([]);
			state.bookingById = {};
			state.dashboard = emptyEntry(emptyDashboard);
		},
		invalidateProviderServices(state) {
			state.services = emptyEntry([]);
			state.serviceById = {};
			state.dashboard = emptyEntry(emptyDashboard);
		},
		invalidateProviderOffers(state) {
			state.offers = emptyEntry([]);
		},
		invalidateProviderHandymen(state) {
			state.handymen = emptyEntry([]);
			state.handymanById = {};
		},
		invalidateProviderWallet(state) {
			state.wallet = emptyEntry({
				balance: 0,
				transactions: [],
				withdrawals: [],
			});
		},
		invalidateProviderBank(state) {
			state.bank = emptyEntry([]);
		},
		invalidateProviderInbox(state) {
			state.inbox = emptyEntry([]);
		},
		upsertProviderBooking(
			state,
			action: PayloadAction<Booking>,
		) {
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
			}
		},
		patchProviderService(
			state,
			action: PayloadAction<{
				id: string;
				patch: Partial<ProviderService>;
			}>,
		) {
			const { id, patch } = action.payload;
			const detail = state.serviceById[id];
			if (detail?.data) {
				detail.data = { ...detail.data, ...patch };
			}
			if (state.services.status === "succeeded") {
				state.services.data = state.services.data.map((s) =>
					s.id === id ? { ...s, ...patch } : s,
				);
			}
		},
	},
	extraReducers: (builder) => {
		const pend =
			<K extends keyof ProviderCacheState>(key: K) =>
			(state: ProviderCacheState) => {
				const entry = state[key] as CacheEntry<unknown>;
				if (entry.status !== "succeeded") entry.status = "loading";
				entry.error = null;
			};
		const fail =
			<K extends keyof ProviderCacheState>(key: K) =>
			(state: ProviderCacheState, action: { error: { message?: string } }) => {
				const entry = state[key] as CacheEntry<unknown>;
				entry.status = "failed";
				entry.error = action.error.message ?? "Failed";
			};

		builder
			.addCase(logoutUser.fulfilled, () => initialState)
			.addCase(loadProviderDashboard.pending, pend("dashboard"))
			.addCase(loadProviderDashboard.fulfilled, (state, action) => {
				state.dashboard = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderDashboard.rejected, fail("dashboard"))
			.addCase(loadProviderBookings.pending, pend("bookings"))
			.addCase(loadProviderBookings.fulfilled, (state, action) => {
				state.bookings = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderBookings.rejected, fail("bookings"))
			.addCase(loadProviderBookingDetail.pending, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.bookingById[id] ?? emptyEntry(null);
				state.bookingById[id] = { ...prev, status: "loading", error: null };
			})
			.addCase(loadProviderBookingDetail.fulfilled, (state, action) => {
				state.bookingById[action.payload.id] = {
					data: action.payload.booking,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderBookingDetail.rejected, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.bookingById[id] ?? emptyEntry(null);
				state.bookingById[id] = {
					...prev,
					status: "failed",
					error: action.error.message ?? "Failed",
				};
			})
			.addCase(loadProviderServices.pending, pend("services"))
			.addCase(loadProviderServices.fulfilled, (state, action) => {
				state.services = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderServices.rejected, fail("services"))
			.addCase(loadProviderServiceDetail.pending, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.serviceById[id] ?? emptyEntry(null);
				state.serviceById[id] = { ...prev, status: "loading", error: null };
			})
			.addCase(loadProviderServiceDetail.fulfilled, (state, action) => {
				state.serviceById[action.payload.id] = {
					data: action.payload.service,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderServiceDetail.rejected, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.serviceById[id] ?? emptyEntry(null);
				state.serviceById[id] = {
					...prev,
					status: "failed",
					error: action.error.message ?? "Failed",
				};
			})
			.addCase(loadProviderOffers.pending, pend("offers"))
			.addCase(loadProviderOffers.fulfilled, (state, action) => {
				state.offers = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderOffers.rejected, fail("offers"))
			.addCase(loadProviderHandymen.pending, pend("handymen"))
			.addCase(loadProviderHandymen.fulfilled, (state, action) => {
				state.handymen = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderHandymen.rejected, fail("handymen"))
			.addCase(loadProviderHandymanDetail.pending, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.handymanById[id] ?? emptyEntry(null);
				state.handymanById[id] = { ...prev, status: "loading", error: null };
			})
			.addCase(loadProviderHandymanDetail.fulfilled, (state, action) => {
				state.handymanById[action.payload.id] = {
					data: action.payload.handyman,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderHandymanDetail.rejected, (state, action) => {
				const id = action.meta.arg.id;
				const prev = state.handymanById[id] ?? emptyEntry(null);
				state.handymanById[id] = {
					...prev,
					status: "failed",
					error: action.error.message ?? "Failed",
				};
			})
			.addCase(loadProviderInbox.pending, pend("inbox"))
			.addCase(loadProviderInbox.fulfilled, (state, action) => {
				state.inbox = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderInbox.rejected, fail("inbox"))
			.addCase(loadProviderNotifications.pending, pend("notifications"))
			.addCase(loadProviderNotifications.fulfilled, (state, action) => {
				state.notifications = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderNotifications.rejected, fail("notifications"))
			.addCase(loadProviderWallet.pending, pend("wallet"))
			.addCase(loadProviderWallet.fulfilled, (state, action) => {
				state.wallet = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderWallet.rejected, fail("wallet"))
			.addCase(loadProviderBank.pending, pend("bank"))
			.addCase(loadProviderBank.fulfilled, (state, action) => {
				state.bank = {
					data: action.payload,
					status: "succeeded",
					error: null,
					fetchedAt: Date.now(),
				};
			})
			.addCase(loadProviderBank.rejected, fail("bank"));
	},
});

export const {
	clearProviderCache,
	invalidateProviderBookings,
	invalidateProviderServices,
	invalidateProviderOffers,
	invalidateProviderHandymen,
	invalidateProviderWallet,
	invalidateProviderBank,
	invalidateProviderInbox,
	upsertProviderBooking,
	patchProviderService,
} = providerCacheSlice.actions;

export default providerCacheSlice.reducer;

export const selectProviderCache = (state: {
	providerCache: ProviderCacheState;
}) => state.providerCache;
