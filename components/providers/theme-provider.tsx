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

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "zemen.theme";

interface ThemeContextValue {
	theme: ThemeMode;
	setTheme: (theme: ThemeMode) => void;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): ThemeMode {
	if (typeof window === "undefined") return "light";
	const raw = window.localStorage.getItem(STORAGE_KEY);
	return raw === "dark" ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
	document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<ThemeMode>("light");

	useEffect(() => {
		const initial = readTheme();
		setThemeState(initial);
		applyTheme(initial);
	}, []);

	const setTheme = useCallback((next: ThemeMode) => {
		setThemeState(next);
		window.localStorage.setItem(STORAGE_KEY, next);
		applyTheme(next);
	}, []);

	const toggleTheme = useCallback(() => {
		setTheme(readTheme() === "dark" ? "light" : "dark");
	}, [setTheme]);

	const value = useMemo(
		() => ({ theme, setTheme, toggleTheme }),
		[theme, setTheme, toggleTheme],
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
