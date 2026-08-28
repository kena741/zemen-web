"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import {
	fetchPaymentMethodsConfig,
	type PaymentMethodsConfig,
} from "@/services/config/paymentConfigApi";

export function PaymentMethodStubs() {
	const { t } = useLocale();
	const [config, setConfig] = useState<PaymentMethodsConfig | null>(null);
	const [toast, setToast] = useState<string | null>(null);

	useEffect(() => {
		void fetchPaymentMethodsConfig().then(setConfig);
	}, []);

	if (!config) return null;
	if (!config.telebirrEnabled && !config.flutterWaveEnabled) return null;

	return (
		<div className="mt-3 space-y-2">
			<p className="text-xs text-muted-foreground">{t("otherPaymentMethods")}</p>
			<div className="flex flex-wrap gap-2">
				{config.telebirrEnabled ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							setToast(
								t("telebirrUnavailableNamed", { name: config.telebirrName }),
							)
						}
					>
						{config.telebirrName}
					</Button>
				) : null}
				{config.flutterWaveEnabled ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							setToast(
								t("flutterwaveUnavailableNamed", {
									name: config.flutterWaveName,
								}),
							)
						}
					>
						{config.flutterWaveName}
					</Button>
				) : null}
			</div>
			{toast ? <p className="text-xs text-muted-foreground">{toast}</p> : null}
		</div>
	);
}
