import type { NextConfig } from "next";

function supabaseHostname(): string | null {
	const raw =
		process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
		process.env.SUPABASE_URL?.trim();
	if (!raw) return null;
	try {
		return new URL(raw).hostname;
	} catch {
		return null;
	}
}

const supabaseHost = supabaseHostname();

/** Canonical marketing host; www is permanently redirected here. */
const CANONICAL_HOST = "zemenservice.com";

/** Service URLs that were linked before the slugs matched the catalog. */
const LEGACY_SERVICE_REDIRECTS: [string, string][] = [
	["/services/domestic-help/cleaning", "/services/domestic-help/cleaning-service"],
	["/services/domestic-help/cooking", "/services/domestic-help/cooking-service"],
	["/services/maintenance/plumbing", "/services/maintenance/plumber"],
	["/services/maintenance/electrical", "/services/maintenance/electrician"],
	["/services/logistics/moving", "/services/logistics/furniture-moving"],
];

const nextConfig: NextConfig = {
	output: "standalone",
	allowedDevOrigins: ["127.0.0.1", "localhost"],
	async redirects() {
		return [
			{
				source: "/:path*",
				has: [{ type: "host", value: `www.${CANONICAL_HOST}` }],
				destination: `https://${CANONICAL_HOST}/:path*`,
				permanent: true,
			},
			...LEGACY_SERVICE_REDIRECTS.map(([source, destination]) => ({
				source,
				destination,
				permanent: true,
			})),
		];
	},
	images: {
		qualities: [65, 70, 75],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.supabase.co",
				pathname: "/storage/v1/object/public/**",
			},
			...(supabaseHost
				? [
						{
							protocol: "https" as const,
							hostname: supabaseHost,
							pathname: "/storage/v1/object/public/**",
						},
					]
				: []),
		],
	},
};

export default nextConfig;
