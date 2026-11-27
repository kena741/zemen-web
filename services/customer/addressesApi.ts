import { apiFetch } from "@/lib/backend/client";
import { isBackendMode } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";

export interface CustomerAddress {
	id: string;
	address: string;
	locality?: string;
	landmark?: string;
	addressAs?: string;
	name?: string;
	isDefault?: boolean;
	location?: { latitude: number; longitude: number };
}

function normalizeAddress(row: Record<string, unknown>): CustomerAddress {
	return {
		id: String(row.id ?? crypto.randomUUID()),
		address: String(row.address ?? row.Address ?? ""),
		locality: row.locality != null ? String(row.locality) : undefined,
		landmark: row.landmark != null ? String(row.landmark) : undefined,
		addressAs: String(row.addressAs ?? row.name ?? row.label ?? "Home"),
		name: row.name != null ? String(row.name) : undefined,
		isDefault: row.isDefault === true || row.is_default === true,
		location:
			row.location && typeof row.location === "object"
				? (row.location as { latitude: number; longitude: number })
				: undefined,
	};
}

function pickAddressList(row: Record<string, unknown>): unknown {
	return (
		row.customer_addresses ??
		row.customerAddresses ??
		row.address ??
		row.add_addresses ??
		row.addAddresses
	);
}

function addressesFromCustomerRow(row: Record<string, unknown>): CustomerAddress[] {
	const raw = pickAddressList(row);
	if (!Array.isArray(raw)) return [];
	return raw.map((item) =>
		normalizeAddress(
			item && typeof item === "object"
				? (item as Record<string, unknown>)
				: {},
		),
	);
}

export async function fetchCustomerAddresses(
	customerId: string,
	authUserId?: string,
): Promise<{ addresses: CustomerAddress[]; error: string | null }> {
	if (isBackendMode()) {
		try {
			const row = await apiFetch<Record<string, unknown>>("/customers/me", {
				auth: true,
			});
			return { addresses: addressesFromCustomerRow(row), error: null };
		} catch (e) {
			return {
				addresses: [],
				error: e instanceof Error ? e.message : "Failed to load addresses",
			};
		}
	}

	const filter = authUserId
		? `id.eq.${customerId},user_id.eq.${authUserId}`
		: `id.eq.${customerId}`;

	const { data, error } = await getSupabase()
		.from("customer")
		.select("customer_addresses, address, default_address")
		.or(filter)
		.maybeSingle();

	if (error) return { addresses: [], error: error.message };
	return {
		addresses: addressesFromCustomerRow((data ?? {}) as Record<string, unknown>),
		error: null,
	};
}

export async function saveCustomerAddresses(params: {
	customerId: string;
	authUserId?: string;
	addresses: CustomerAddress[];
}): Promise<{ ok: boolean; error: string | null }> {
	const defaultId =
		params.addresses.find((a) => a.isDefault)?.id ??
		params.addresses[0]?.id ??
		null;

	if (isBackendMode()) {
		try {
			await apiFetch("/customers/me", {
				method: "PATCH",
				auth: true,
				body: {
					customerAddresses: params.addresses,
					address: params.addresses,
					defaultAddress: defaultId,
				},
			});
			return { ok: true, error: null };
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : "Failed to save addresses",
			};
		}
	}

	const payload = {
		customer_addresses: params.addresses,
		address: params.addresses,
		default_address: defaultId,
	};

	const filter = params.authUserId
		? `id.eq.${params.customerId},user_id.eq.${params.authUserId}`
		: `id.eq.${params.customerId}`;

	const { error } = await getSupabase()
		.from("customer")
		.update(payload)
		.or(filter);

	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null };
}

export async function upsertCustomerAddress(params: {
	customerId: string;
	authUserId?: string;
	address: CustomerAddress;
}): Promise<{ ok: boolean; error: string | null }> {
	const existing = await fetchCustomerAddresses(
		params.customerId,
		params.authUserId,
	);
	if (existing.error) return { ok: false, error: existing.error };

	let list = [...existing.addresses];
	const idx = list.findIndex((a) => a.id === params.address.id);
	if (idx >= 0) list[idx] = params.address;
	else list.push(params.address);

	if (params.address.isDefault) {
		list = list.map((a) => ({
			...a,
			isDefault: a.id === params.address.id,
		}));
	}

	return saveCustomerAddresses({
		customerId: params.customerId,
		authUserId: params.authUserId,
		addresses: list,
	});
}

export async function deleteCustomerAddress(params: {
	customerId: string;
	authUserId?: string;
	addressId: string;
}): Promise<{ ok: boolean; error: string | null }> {
	const existing = await fetchCustomerAddresses(
		params.customerId,
		params.authUserId,
	);
	if (existing.error) return { ok: false, error: existing.error };

	const list = existing.addresses.filter((a) => a.id !== params.addressId);
	return saveCustomerAddresses({
		customerId: params.customerId,
		authUserId: params.authUserId,
		addresses: list,
	});
}
