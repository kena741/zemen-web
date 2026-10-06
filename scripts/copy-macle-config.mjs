import { copyFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "out");

copyFileSync(
	join(root, "project.config.json"),
	join(outDir, "project.config.json"),
);

writeFileSync(
	join(outDir, "app-config.json"),
	`${JSON.stringify(
		{
			pages: ["index.html"],
			entryPagePath: "index.html",
			page: {},
			global: {
				window: {
					backgroundTextStyle: "light",
					navigationBarBackgroundColor: "#fff",
					navigationBarTitleText: "Zemen Service",
					navigationBarTextStyle: "black",
					capsuleTheme: "light",
				},
			},
			type: "legacy",
		},
		null,
		2,
	)}\n`,
);

console.log("Copied Macle config into out/");
