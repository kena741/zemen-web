import { getSupabase } from "@/lib/supabase/client";
import { mapProviderRow, type ProviderProfile } from "@/services/auth/types";
import { uploadServiceImages } from "@/services/services/servicesApi";

export async function updateProviderProfile(params: {
	providerId: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	address: string;
	profileImageFile?: File | null;
	authUserId: string;
}): Promise<{ provider: ProviderProfile | null; error: string | null }> {
	const firstName = params.firstName.trim();
	const lastName = params.lastName.trim();
	if (!firstName) return { provider: null, error: "First name is required." };

	let profileImage: string | undefined;
	if (params.profileImageFile) {
		const upload = await uploadServiceImages({
			authUserId: params.authUserId,
			files: [params.profileImageFile],
		});
		if (upload.error) {
			return { provider: null, error: upload.error };
		}
		profileImage = upload.urls[0];
	}

	const payload: Record<string, unknown> = {
		firstName,
		lastName,
		phoneNumber: params.phoneNumber.trim() || null,
		address: params.address.trim() || null,
	};
	if (profileImage) payload.profileImage = profileImage;

	const { data, error } = await getSupabase()
		.from("provider")
		.update(payload)
		.eq("id", params.providerId)
		.select("*")
		.maybeSingle();

	if (error) {
		console.error("updateProviderProfile", error);
		return { provider: null, error: error.message };
	}
	if (!data) {
		return { provider: null, error: "Update failed. Check permissions." };
	}
	return {
		provider: mapProviderRow(data as Record<string, unknown>),
		error: null,
	};
}
