"use client";

import { type ReactNode, useEffect } from "react";
import { Provider } from "react-redux";

import {
	hydrateAppMode,
	initializeAuthSession,
	selectAuthUser,
} from "./authSlice";
import { useAppDispatch, useAppSelector } from "./hooks";
import { store } from "./store";

function AuthBootstrap({ children }: { children: ReactNode }) {
	const dispatch = useAppDispatch();
	const user = useAppSelector(selectAuthUser);

	useEffect(() => {
		dispatch(hydrateAppMode());
		void dispatch(initializeAuthSession());
	}, [dispatch]);

	useEffect(() => {
		function onVisible() {
			if (document.visibilityState !== "visible") return;
			if (user) return;
			void dispatch(initializeAuthSession());
		}
		document.addEventListener("visibilitychange", onVisible);
		return () => document.removeEventListener("visibilitychange", onVisible);
	}, [dispatch, user]);

	return <>{children}</>;
}

export function ReduxProvider({ children }: { children: ReactNode }) {
	return (
		<Provider store={store}>
			<AuthBootstrap>{children}</AuthBootstrap>
		</Provider>
	);
}
