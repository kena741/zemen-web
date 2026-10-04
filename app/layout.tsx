import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { ReduxProvider } from "@/store/ReduxProvider";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
	variable: "--font-sans-app",
	subsets: ["latin"],
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
	description: BRAND_TAGLINE,
	applicationName: BRAND_NAME,
	icons: {
		icon: [
			{ url: "/favicon.png", sizes: "32x32", type: "image/png" },
			{ url: "/app-icon.png", sizes: "1024x1024", type: "image/png" },
		],
		apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
	},
	appleWebApp: {
		capable: true,
		title: BRAND_NAME,
		statusBarStyle: "default",
	},
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`${plusJakarta.variable} ${geistMono.variable}`}
			suppressHydrationWarning
		>
			<body className="min-h-svh bg-background font-sans text-foreground antialiased">
				<ReduxProvider>
					<AppProviders>{children}</AppProviders>
				</ReduxProvider>
			</body>
		</html>
	);
}
