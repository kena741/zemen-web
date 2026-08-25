"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import {
	APP_MODE_LABEL,
	homePathForMode,
	type AppMode,
} from "@/lib/brand";
import {
	clearAuthError,
	loginWithCredentials,
	logoutUser,
	selectAuthError,
	selectAuthLoading,
	selectAuthLoginPending,
	selectAuthMode,
	selectAuthUser,
	setAppMode,
} from "./authSlice";
import { useAppDispatch, useAppSelector } from "./hooks";

export function useAuth() {
	const dispatch = useAppDispatch();
	const router = useRouter();
	const user = useAppSelector(selectAuthUser);
	const mode = useAppSelector(selectAuthMode);
	const loading = useAppSelector(selectAuthLoading);
	const loginPending = useAppSelector(selectAuthLoginPending);
	const error = useAppSelector(selectAuthError);

	const setMode = useCallback(
		(next: AppMode) => {
			dispatch(setAppMode(next));
		},
		[dispatch],
	);

	const login = useCallback(
		async (
			identifier: string,
			password: string,
			loginMode?: AppMode,
		): Promise<boolean> => {
			dispatch(clearAuthError());
			const result = await dispatch(
				loginWithCredentials({
					identifier,
					password,
					mode: loginMode ?? mode,
				}),
			);
			return loginWithCredentials.fulfilled.match(result);
		},
		[dispatch, mode],
	);

	const logout = useCallback(() => {
		void dispatch(logoutUser());
		router.push("/login");
	}, [dispatch, router]);

	const homePath = homePathForMode(user?.mode ?? mode);

	return {
		user,
		mode,
		modeLabel: APP_MODE_LABEL[mode],
		setMode,
		login,
		logout,
		loading,
		loginPending,
		error,
		homePath,
	};
}
