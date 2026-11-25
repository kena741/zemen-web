import { isBackendMode } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";
import { parseObjectValue } from "@/lib/chapa";

export interface TelebirrConfig {
	enable?: boolean;
	name?: string;
}

export interface FlutterWaveConfig {
	isActive?: boolean;
	enable?: boolean;
	name?: string;
	publicKey?: string;
}

export interface PaymentMethodsConfig {
	chapaEnabled: boolean;
	telebirrEnabled: boolean;
	flutterWaveEnabled: boolean;
	telebirrName: string;
	flutterWaveName: string;
}

export async function fetchPaymentMethodsConfig(): Promise<PaymentMethodsConfig> {
	// Product: Telebirr-only web checkout (Chapa disabled).
	const telebirrOnly: PaymentMethodsConfig = {
		chapaEnabled: false,
		telebirrEnabled: true,
		flutterWaveEnabled: false,
		telebirrName: "Telebirr",
		flutterWaveName: "Flutterwave",
	};

	if (isBackendMode()) return telebirrOnly;

	try {
		const { data } = await getSupabase()
			.from("app_settings")
			.select("data")
			.eq("id", "payment")
			.maybeSingle();
		const root = parseObjectValue(data?.data);
		const telebirr = (root.telebirr ?? {}) as TelebirrConfig;
		const flutterWave = (root.flutterWave ??
			root.flutterwave ??
			{}) as FlutterWaveConfig;

		return {
			chapaEnabled: false,
			telebirrEnabled: telebirr.enable !== false,
			flutterWaveEnabled:
				(flutterWave.isActive === true || flutterWave.enable === true) &&
				Boolean(String(flutterWave.publicKey ?? "").trim()),
			telebirrName: telebirr.name?.trim() || "Telebirr",
			flutterWaveName: flutterWave.name?.trim() || "Flutterwave",
		};
	} catch {
		return telebirrOnly;
	}
}
