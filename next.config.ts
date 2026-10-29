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
	["/movers", "/services/logistics/furniture-moving"],
	["/services/movers", "/services/logistics/furniture-moving"],
	["/movers-addis-ababa", "/services/logistics/furniture-moving"],
	["/cleaning", "/services/domestic-help/cleaning-service"],
	["/cleaning-service", "/services/domestic-help/cleaning-service"],
	["/cleaning-services", "/services/domestic-help/cleaning-service"],
	["/cleaning-addis-ababa", "/services/domestic-help/cleaning-service"],
	["/deep-cleaning", "/services/domestic-help/deep-cleaning"],
	["/kitchen-deep-cleaning", "/services/domestic-help/deep-cleaning"],
	["/kitchen-cleaning", "/services/domestic-help/deep-cleaning"],
	["/office-cleaning", "/services/domestic-help/cleaning-service"],
	["/maid-agency", "/services/domestic-help/housemaid"],
	["/maid-agency-near-me", "/services/domestic-help/housemaid"],
	["/housemaid", "/services/domestic-help/housemaid"],
	["/nanny", "/services/domestic-help/babysitting"],
	["/nanny-suppliers", "/services/domestic-help/babysitting"],
	["/nanny-ethiopia", "/services/domestic-help/babysitting"],
	["/babysitting", "/services/domestic-help/babysitting"],
	["/plumbing-company", "/services/maintenance/plumber"],
	["/plumber", "/services/maintenance/plumber"],
	["/plumbing", "/services/maintenance/plumber"],
	["/cctv", "/services/technical/cctv-installation"],
	["/cctv-installation", "/services/technical/cctv-installation"],
	["/security-camera", "/services/technical/cctv-installation"],
	["/security-cameras", "/services/technical/cctv-installation"],
	["/services/security-camera", "/services/technical/cctv-installation"],
	["/services/cctv", "/services/technical/cctv-installation"],
	["/ac-repair", "/services/maintenance/ac-repair-and-service"],
	["/ac-service", "/services/maintenance/ac-repair-and-service"],
	["/air-conditioning", "/services/maintenance/ac-repair-and-service"],
	["/air-conditioning-repair", "/services/maintenance/ac-repair-and-service"],
	["/air-conditioner-repair", "/services/maintenance/ac-repair-and-service"],
	["/ac-repair-addis-ababa", "/services/maintenance/ac-repair-and-service"],
	["/services/ac-repair", "/services/maintenance/ac-repair-and-service"],
	["/services/maintenance/ac-repair", "/services/maintenance/ac-repair-and-service"],
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
