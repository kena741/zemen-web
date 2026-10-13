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
	/** @deprecated Chapa is no longer the primary gateway; kept for legacy settings reads. */
	chapaEnabled: boolean;
	telebirrEnabled: boolean;
	flutterWaveEnabled: boolean;
	telebirrName: string;
	flutterWaveName: string;
}

export async function fetchPaymentMethodsConfig(): Promise<PaymentMethodsConfig> {
	const defaults: PaymentMethodsConfig = {
		chapaEnabled: false,
		telebirrEnabled: true,
		flutterWaveEnabled: false,
		telebirrName: "Telebirr",
		flutterWaveName: "Flutterwave",
	};

	const { data } = await getSupabase()
		.from("app_settings")
		.select("data")
		.eq("id", "payment")
		.maybeSingle();

	const root = parseObjectValue(data?.data);
	const chapa = (root.chapa ?? {}) as Record<string, unknown>;
	const telebirr = (root.telebirr ?? {}) as TelebirrConfig;
	const flutterWave = (root.flutterWave ?? root.flutterwave ?? {}) as FlutterWaveConfig;

	// Telebirr is the primary web gateway. Enable unless explicitly disabled.
	const telebirrExplicitlyDisabled = telebirr.enable === false;
	const telebirrEnabled = !telebirrExplicitlyDisabled;

	return {
		chapaEnabled: chapa.enable === true || chapa.isActive === true,
		telebirrEnabled,
		flutterWaveEnabled:
			(flutterWave.isActive === true || flutterWave.enable === true) &&
			Boolean(String(flutterWave.publicKey ?? "").trim()),
		telebirrName: telebirr.name?.trim() || "Telebirr",
		flutterWaveName: flutterWave.name?.trim() || "Flutterwave",
	};
}
