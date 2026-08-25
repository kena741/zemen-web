import {
	createAsyncThunk,
	createSlice,
	type PayloadAction,
} from "@reduxjs/toolkit";

import {
	APP_MODE_STORAGE_KEY,
	type AppMode,
} from "@/lib/brand";
import {
	loginWithEmailOrPhone,
	restoreSession,
	signOut,
} from "@/services/auth/authApi";
import type { AuthUser } from "@/services/auth/types";

function readStoredMode(): AppMode {
	if (typeof window === "undefined") return "provider";
	const raw = window.localStorage.getItem(APP_MODE_STORAGE_KEY);
	return raw === "service" ? "service" : "provider";
}

function persistMode(mode: AppMode) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(APP_MODE_STORAGE_KEY, mode);
}

export interface AuthState {
	user: AuthUser | null;
	mode: AppMode;
	error: string | null;
	sessionPending: boolean;
	loginPending: boolean;
}

const initialState: AuthState = {
	user: null,
	mode: "provider",
	error: null,
	sessionPending: true,
	loginPending: false,
};

export const initializeAuthSession = createAsyncThunk<
	AuthUser | null,
	void,
	{ state: { auth: AuthState }; rejectValue: string }
>("auth/initializeSession", async (_, { getState, rejectWithValue }) => {
	if (typeof window === "undefined") return null;
	const mode = getState().auth.mode || readStoredMode();
	const result = await restoreSession(mode);
	if (result.error && !result.user) {
		// Soft fail: no session is fine; only reject on hard errors with prior session intent
		return null;
	}
	if (result.error) return rejectWithValue(result.error);
	return result.user;
});

export const loginWithCredentials = createAsyncThunk<
	AuthUser,
	{ identifier: string; password: string; mode?: AppMode },
	{ state: { auth: AuthState }; rejectValue: string }
>("auth/login", async ({ identifier, password, mode }, { getState, rejectWithValue }) => {
	const appMode = mode ?? getState().auth.mode;
	const result = await loginWithEmailOrPhone({
		identifier,
		password,
		mode: appMode,
	});
	if (!result.user) {
		return rejectWithValue(result.error ?? "Login failed");
	}
	persistMode(appMode);
	return result.user;
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
	await signOut();
});

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		clearAuthError(state) {
			state.error = null;
		},
		setAppMode(state, action: PayloadAction<AppMode>) {
			state.mode = action.payload;
			persistMode(action.payload);
		},
		hydrateAppMode(state) {
			state.mode = readStoredMode();
		},
		patchAuthUser(state, action: PayloadAction<Partial<AuthUser>>) {
			if (!state.user) return;
			state.user = {
				...state.user,
				...action.payload,
				provider:
					action.payload.provider !== undefined
						? action.payload.provider
						: state.user.provider,
			};
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(initializeAuthSession.pending, (state) => {
				state.sessionPending = true;
				state.error = null;
			})
			.addCase(initializeAuthSession.fulfilled, (state, action) => {
				state.sessionPending = false;
				state.user = action.payload;
				if (action.payload) {
					state.mode = action.payload.mode;
				}
			})
			.addCase(initializeAuthSession.rejected, (state, action) => {
				state.sessionPending = false;
				state.user = null;
				state.error =
					typeof action.payload === "string" ? action.payload : null;
			})
			.addCase(loginWithCredentials.pending, (state) => {
				state.loginPending = true;
				state.error = null;
			})
			.addCase(loginWithCredentials.fulfilled, (state, action) => {
				state.loginPending = false;
				state.user = action.payload;
				state.mode = action.payload.mode;
				state.error = null;
			})
			.addCase(loginWithCredentials.rejected, (state, action) => {
				state.loginPending = false;
				state.error =
					typeof action.payload === "string"
						? action.payload
						: "Login failed";
			})
			.addCase(logoutUser.fulfilled, (state) => {
				state.user = null;
				state.error = null;
			});
	},
});

export const { clearAuthError, setAppMode, hydrateAppMode, patchAuthUser } =
	authSlice.actions;
export default authSlice.reducer;

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthMode = (state: { auth: AuthState }) => state.auth.mode;
export const selectAuthSessionPending = (state: { auth: AuthState }) =>
	state.auth.sessionPending;
export const selectAuthLoginPending = (state: { auth: AuthState }) =>
	state.auth.loginPending;
export const selectAuthLoading = (state: { auth: AuthState }) =>
	state.auth.sessionPending || state.auth.loginPending;
