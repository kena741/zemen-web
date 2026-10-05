import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1", "localhost"],
	output: "export", // Tells Next.js to generate static HTML/CSS/JS files
	images: {
		unoptimized: true, // Native Next.js Image Optimization requires a Node.js server; disable it for H5
	},
	// If your H5 app will live in a sub-folder (e.g., ://example.com), uncomment the line below:
	// basePath: '/h5',
};

export default nextConfig;
