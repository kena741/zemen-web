"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

import { am } from "./messages/am";
import { en, type MessageKey } from "./messages/en";

export type Locale = "en" | "am";

const STORAGE_KEY = "zemen.locale";

interface LocaleContextValue {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readLocale(): Locale {
	if (typeof window === "undefined") return "am";
	const raw = window.localStorage.getItem(STORAGE_KEY);
	return raw === "en" ? "en" : "am";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>("am");

	useEffect(() => {
		setLocaleState(readLocale());
	}, []);

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next);
		window.localStorage.setItem(STORAGE_KEY, next);
		document.documentElement.lang = next;
	}, []);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	const t = useCallback(
		(key: MessageKey, vars?: Record<string, string | number>) => {
			let text = locale === "am" ? am[key] : en[key];
			if (vars) {
				for (const [k, v] of Object.entries(vars)) {
					text = text.replace(`{${k}}`, String(v));
				}
			}
			return text;
		},
		[locale],
	);

	const value = useMemo(
		() => ({ locale, setLocale, t }),
		[locale, setLocale, t],
	);

	return (
		<LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
	);
}

export function useLocale() {
	const ctx = useContext(LocaleContext);
	if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
	return ctx;
}
