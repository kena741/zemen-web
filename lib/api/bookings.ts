import { invokeFunction } from "./client";

export async function completeBooking(
	bookingId: string,
): Promise<{ ok: boolean; warning?: string }> {
	return invokeFunction("complete-booking", { bookingId });
}
