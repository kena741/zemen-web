import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { OrganizationJsonLd } from "@/components/marketing/json-ld";
import { AppProviders } from "@/components/providers/app-providers";
import { ReduxProvider } from "@/store/ReduxProvider";
import { BRAND_NAME } from "@/lib/brand";
import {
	buildOpenGraph,
	buildTwitter,
	getMetadataBaseUrl,
	SEO_DESCRIPTION,
	SEO_KEYWORDS,
	SEO_OG_DESCRIPTION,
	SEO_TITLE_DEFAULT,
	SEO_TWITTER_DESCRIPTION,
} from "@/lib/seo";

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
	metadataBase: getMetadataBaseUrl(),
	title: {
		default: SEO_TITLE_DEFAULT,
		template: "%s | Zemen Service",
	},
	description: SEO_DESCRIPTION,
	keywords: [...SEO_KEYWORDS],
	applicationName: BRAND_NAME,
	authors: [{ name: BRAND_NAME }],
	creator: BRAND_NAME,
	publisher: BRAND_NAME,
	category: "home services",
	alternates: {
		canonical: "/",
	},
	openGraph: buildOpenGraph({
		title: SEO_TITLE_DEFAULT,
		description: SEO_OG_DESCRIPTION,
		path: "https://www.zemenservice.com",
	}),
	twitter: buildTwitter({
		title: SEO_TITLE_DEFAULT,
		description: SEO_TWITTER_DESCRIPTION,
	}),
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
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`${plusJakarta.variable} ${geistMono.variable}`}
			suppressHydrationWarning
		>
			<head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
				/>
			</head>
			<body className="min-h-svh bg-background font-sans text-foreground antialiased">
				<OrganizationJsonLd />
				<ReduxProvider>
					<AppProviders>{children}</AppProviders>
				</ReduxProvider>
			</body>
		</html>
	);
}
