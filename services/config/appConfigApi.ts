import { WEB_APP_CONFIG_KEY } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";

export interface WebAppConfig {
	maintenanceMode: boolean;
	maintenanceMessage: string | null;
}

export async function fetchWebAppConfig(): Promise<WebAppConfig> {
	const fallback: WebAppConfig = {
		maintenanceMode: false,
		maintenanceMessage: null,
	};

	try {
		const { data, error } = await getSupabase()
			.from("mobile_app_config")
			.select("maintenance_mode, maintenance_message")
			.eq("app_key", WEB_APP_CONFIG_KEY)
			.maybeSingle();

		// ponytail: never fall back to zemen_service — mobile force-update would lock web forever
		if (error || !data) return fallback;

		const row = data as Record<string, unknown>;
		return {
			maintenanceMode: row.maintenance_mode === true,
			maintenanceMessage:
				row.maintenance_message != null
					? String(row.maintenance_message)
					: null,
		};
	} catch {
		return fallback;
	}
}
