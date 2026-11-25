import { isBackendMode } from "@/lib/env";
import * as backend from "./backend";
import * as supabase from "./supabase";

function impl() {
	return isBackendMode() ? backend : supabase;
}

export const friendlyLoginError = supabase.friendlyLoginError;

export function phoneAlreadyRegistered(
	...args: Parameters<typeof backend.phoneAlreadyRegistered>
) {
	return impl().phoneAlreadyRegistered(...args);
}

export function fetchProviderProfile(
	...args: Parameters<typeof backend.fetchProviderProfile>
) {
	return impl().fetchProviderProfile(...args);
}

export function fetchCustomerProfile(
	...args: Parameters<typeof backend.fetchCustomerProfile>
) {
	return impl().fetchCustomerProfile(...args);
}

export function buildAuthUser(
	...args: Parameters<typeof backend.buildAuthUser>
) {
	return impl().buildAuthUser(...args);
}

export function loginWithEmailOrPhone(
	...args: Parameters<typeof backend.loginWithEmailOrPhone>
) {
	return impl().loginWithEmailOrPhone(...args);
}

export function restoreSession(
	...args: Parameters<typeof backend.restoreSession>
) {
	return impl().restoreSession(...args);
}

export function signOut(...args: Parameters<typeof backend.signOut>) {
	return impl().signOut(...args);
}

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
