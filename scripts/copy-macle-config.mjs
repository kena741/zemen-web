import { copyFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "out");

copyFileSync(join(root, "app-config.json"), join(outDir, "app-config.json"));
copyFileSync(
	join(root, "project.config.json"),
	join(outDir, "project.config.json"),
);

console.log("Copied Macle config into out/");
