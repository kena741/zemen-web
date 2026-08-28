import { WEB_APP_CONFIG_KEY } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";

export interface MobileAppConfig {
	maintenanceMode: boolean;
	maintenanceMessage: string | null;
	updateNeeded: boolean;
	updateMessage: string | null;
}

export async function fetchWebAppConfig(): Promise<MobileAppConfig> {
	const fallback: MobileAppConfig = {
		maintenanceMode: false,
		maintenanceMessage: null,
		updateNeeded: false,
		updateMessage: null,
	};

	try {
		const { data, error } = await getSupabase()
			.from("mobile_app_config")
			.select(
				"maintenance_mode, maintenance_message, update_needed, update_message",
			)
			.eq("app_key", WEB_APP_CONFIG_KEY)
			.maybeSingle();

		if (error || !data) {
			const { data: serviceRow } = await getSupabase()
				.from("mobile_app_config")
				.select(
					"maintenance_mode, maintenance_message, update_needed, update_message",
				)
				.eq("app_key", "zemen_service")
				.maybeSingle();
			if (!serviceRow) return fallback;
			return mapRow(serviceRow as Record<string, unknown>);
		}
		return mapRow(data as Record<string, unknown>);
	} catch {
		return fallback;
	}
}

function mapRow(row: Record<string, unknown>): MobileAppConfig {
	return {
		maintenanceMode: row.maintenance_mode === true,
		maintenanceMessage:
			row.maintenance_message != null ? String(row.maintenance_message) : null,
		updateNeeded: row.update_needed === true,
		updateMessage:
			row.update_message != null ? String(row.update_message) : null,
	};
}
