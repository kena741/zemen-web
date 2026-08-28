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

export async function fetchCustomerAddresses(
	customerId: string,
	authUserId?: string,
): Promise<{ addresses: CustomerAddress[]; error: string | null }> {
	const filter = authUserId
		? `id.eq.${customerId},user_id.eq.${authUserId}`
		: `id.eq.${customerId}`;

	const { data, error } = await getSupabase()
		.from("customer")
		.select("addAddresses, add_addresses")
		.or(filter)
		.maybeSingle();

	if (error) return { addresses: [], error: error.message };
	const row = (data ?? {}) as Record<string, unknown>;
	const raw = row.addAddresses ?? row.add_addresses;
	if (!Array.isArray(raw)) return { addresses: [], error: null };
	return {
		addresses: raw.map((item) =>
			normalizeAddress(
				item && typeof item === "object"
					? (item as Record<string, unknown>)
					: {},
			),
		),
		error: null,
	};
}

export async function saveCustomerAddresses(params: {
	customerId: string;
	authUserId?: string;
	addresses: CustomerAddress[];
}): Promise<{ ok: boolean; error: string | null }> {
	const defaultId =
		params.addresses.find((a) => a.isDefault)?.id ?? params.addresses[0]?.id ?? null;

	const payload = {
		addAddresses: params.addresses,
		add_addresses: params.addresses,
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
	const existing = await fetchCustomerAddresses(params.customerId, params.authUserId);
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
	const existing = await fetchCustomerAddresses(params.customerId, params.authUserId);
	if (existing.error) return { ok: false, error: existing.error };

	const list = existing.addresses.filter((a) => a.id !== params.addressId);
	return saveCustomerAddresses({
		customerId: params.customerId,
		authUserId: params.authUserId,
		addresses: list,
	});
}
