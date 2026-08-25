export const BRAND_NAME = "Zemen";

export const BRAND_TAGLINE = "Home services marketplace";

/** App modes available on the shared login screen. */
export type AppMode = "provider" | "service";

export const APP_MODE_LABEL: Record<AppMode, string> = {
	provider: "Provider",
	service: "Customer",
};

export const APP_MODE_STORAGE_KEY = "zemen.appMode";

export function homePathForMode(mode: AppMode): string {
	return mode === "provider" ? "/provider" : "/service";
}
