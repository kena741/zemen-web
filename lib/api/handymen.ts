import { invokeFunction } from "./client";

export async function createHandyman(
	body: Record<string, unknown>,
): Promise<{ handyman: Record<string, unknown>; error?: string }> {
	return invokeFunction("manage-handymen", body);
}

export async function updateHandyman(
	id: string,
	body: Record<string, unknown>,
): Promise<{ handyman: Record<string, unknown>; email?: string }> {
	return invokeFunction("manage-handyman", {
		...body,
		id,
		action: "update",
	});
}

export async function deleteHandyman(
	id: string,
): Promise<{ ok: boolean }> {
	return invokeFunction("manage-handyman", {
		id,
		action: "delete",
	});
}
