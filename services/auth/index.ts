import { isBackendMode } from "@/lib/env";
import * as backend from "./backend";
import * as supabase from "./supabase";

const impl = isBackendMode() ? backend : supabase;

export const friendlyLoginError = supabase.friendlyLoginError;
export const phoneAlreadyRegistered = impl.phoneAlreadyRegistered;
export const fetchProviderProfile = impl.fetchProviderProfile;
export const fetchCustomerProfile = impl.fetchCustomerProfile;
export const buildAuthUser = impl.buildAuthUser;
export const loginWithEmailOrPhone = impl.loginWithEmailOrPhone;
export const restoreSession = impl.restoreSession;
export const signOut = impl.signOut;

export type {
	AuthUser,
	CustomerProfile,
	ProviderProfile,
} from "./types";
export {
	mapCustomerRow,
	mapProviderRow,
	USER_TYPE_PROVIDER,
} from "./types";
