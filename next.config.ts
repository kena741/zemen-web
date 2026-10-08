import type { NextConfig } from "next";

// Macle serves the repo root and loads out/index.html, so URL routes must be
// under /out/... (matching the filesystem). For a packaged mini-app whose root
// *is* the export folder, build with MACLE_PACKAGE=1 instead.
const isMaclePackage = process.env.MACLE_PACKAGE === "1";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1", "localhost"],
	output: "export", // Tells Next.js to generate static HTML/CSS/JS files
	images: {
		unoptimized: true, // Native Next.js Image Optimization requires a Node.js server; disable it for H5
	},
	// Emit /login/index.html so directory hosts can serve /login/
	trailingSlash: true,
	...(isMaclePackage
		? {
				// Packaged H5 root === export root; prefer relative assets per Macle docs
				assetPrefix: "./",
			}
		: {
				// Simulator: files live at /out/... on localhost:30005
				basePath: "/out",
			}),
};

export default nextConfig;
