import { getSupabase } from "@/lib/supabase/client";
import { parseObjectValue } from "@/lib/chapa";

export const CONTACT_US_URL = "https://www.zemenservice.com/contact-us";
export const CONTACT_WEBSITE_URL = "https://www.zemenservice.com";

export interface ContactInfo {
	websiteUrl: string;
	contactPageUrl: string;
	email: string;
	phone: string;
}

const DEFAULTS: ContactInfo = {
	websiteUrl: CONTACT_WEBSITE_URL,
	contactPageUrl: CONTACT_US_URL,
	email: "support@zemenservice.com",
	phone: "",
};

export async function fetchContactInfo(): Promise<ContactInfo> {
	const { data } = await getSupabase()
		.from("settings")
		.select("value")
		.eq("id", "constant")
		.maybeSingle();

	const map = parseObjectValue((data as { value?: unknown } | null)?.value);
	const email =
		(typeof map.supportEmail === "string" && map.supportEmail.trim()) ||
		DEFAULTS.email;
	const phone =
		(typeof map.phoneNumber === "string" && map.phoneNumber.trim()) ||
		DEFAULTS.phone;

	return {
		websiteUrl: DEFAULTS.websiteUrl,
		contactPageUrl: DEFAULTS.contactPageUrl,
		email,
		phone,
	};
}
