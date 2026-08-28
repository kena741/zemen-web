import { normalizeLocalEthiopianPhone } from "@/lib/phone";

export function syntheticEmailFromPhone(phone: string): string | null {
	const local = normalizeLocalEthiopianPhone(phone);
	if (local.length !== 9) return null;
	return `251${local}@phone.zemen.app`;
}
