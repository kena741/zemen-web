import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1", "localhost"],
	output: "export", // Tells Next.js to generate static HTML/CSS/JS files
	images: {
		unoptimized: true, // Native Next.js Image Optimization requires a Node.js server; disable it for H5
	},
	// Relative asset URLs so the static export works inside Telebirr/Macle WebView
	assetPrefix: "./",
};

export default nextConfig;
