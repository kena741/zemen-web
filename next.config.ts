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

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1", "localhost"],
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
