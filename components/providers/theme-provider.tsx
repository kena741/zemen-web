"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "zemen.theme";

interface ThemeContextValue {
	theme: ThemeMode;
	setTheme: (theme: ThemeMode) => void;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyLight() {
	document.documentElement.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	useEffect(() => {
		applyLight();
		try {
			window.localStorage.setItem(STORAGE_KEY, "light");
		} catch {
			/* ignore */
		}
	}, []);

	const setTheme = useCallback((_theme: ThemeMode) => {
		applyLight();
		try {
			window.localStorage.setItem(STORAGE_KEY, "light");
		} catch {
			/* ignore */
		}
	}, []);

	const toggleTheme = useCallback(() => {
		applyLight();
	}, []);

	const value = useMemo(
		() => ({ theme: "light" as const, setTheme, toggleTheme }),
		[setTheme, toggleTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}
