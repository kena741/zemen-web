import { isBackendMode } from "@/lib/env";
import { invokeEdgeFunction } from "@/lib/edge-functions";

export async function scanRecurringCycleDue(): Promise<void> {
	// ponytail: edge-only notify; no backend equivalent yet
	if (isBackendMode()) return;
	await invokeEdgeFunction("notify-recurring-cycle-due", {});
}
