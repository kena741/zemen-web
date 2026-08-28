import { invokeEdgeFunction } from "@/lib/edge-functions";

export async function scanRecurringCycleDue(): Promise<void> {
	await invokeEdgeFunction("notify-recurring-cycle-due", {});
}
