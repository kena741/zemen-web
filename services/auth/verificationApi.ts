import { getSupabase } from "@/lib/supabase/client";
import { friendlyLoginError } from "./authApi";

const VERIFY_STORAGE_BUCKET = "betegnabucket";

export async function sendSignupEmailOtp(email: string): Promise<{ error: string | null }> {
	const { error } = await getSupabase().auth.resend({
		type: "signup",
		email: email.trim().toLowerCase(),
	});
	if (error) return { error: friendlyLoginError(error.message) };
	return { error: null };
}

export async function verifySignupEmailOtp(
	email: string,
	token: string,
): Promise<{ error: string | null }> {
	const { error } = await getSupabase().auth.verifyOtp({
		type: "signup",
		email: email.trim().toLowerCase(),
		token: token.trim(),
	});
	if (error) return { error: friendlyLoginError(error.message) };
	return { error: null };
}

function publicUrlForPath(path: string): string {
	const { data } = getSupabase().storage.from(VERIFY_STORAGE_BUCKET).getPublicUrl(path);
	return data.publicUrl || path;
}

async function deleteStorageByUrl(imageUrl: string): Promise<void> {
	if (!imageUrl) return;
	const marker = `${VERIFY_STORAGE_BUCKET}/`;
	const index = imageUrl.indexOf(marker);
	if (index === -1) return;
	const path = imageUrl.slice(index + marker.length);
	if (!path) return;
	await getSupabase().storage.from(VERIFY_STORAGE_BUCKET).remove([path]);
}

export async function uploadVerifyDocument(params: {
	providerId: string;
	providerName?: string;
	providerEmail?: string;
	documentId: string;
	file: File;
	previousImageUrl?: string | null;
}): Promise<{ error: string | null }> {
	const supabase = getSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const uid = user?.id;
	if (!uid) return { error: "Not signed in." };

	if (params.previousImageUrl) {
		await deleteStorageByUrl(params.previousImageUrl);
	}

	const ext = params.file.name.split(".").pop() || "jpg";
	const path = `documentImage/${params.documentId}/${uid}.${ext}`;

	const { error: uploadErr } = await supabase.storage
		.from(VERIFY_STORAGE_BUCKET)
		.upload(path, params.file, { upsert: true });
	if (uploadErr) return { error: uploadErr.message };

	const imageUrl = publicUrlForPath(path);

	await supabase
		.from("verify_documents")
		.delete()
		.eq("providerId", params.providerId)
		.eq("documentId", params.documentId);

	const { error: rowErr } = await supabase.from("verify_documents").upsert({
		providerId: params.providerId,
		providerName: params.providerName ?? "",
		providerEmail: params.providerEmail ?? "",
		documentId: params.documentId,
		documentImage: imageUrl,
		isVerify: null,
		createdAt: new Date().toISOString(),
	});
	if (rowErr) return { error: rowErr.message };
	return { error: null };
}

export async function saveFcmToken(params: {
	userId: string;
	mode: "provider" | "service";
	token: string;
}): Promise<void> {
	const supabase = getSupabase();
	const table = params.mode === "provider" ? "provider" : "customer";
	await supabase
		.from(table)
		.update({ fcm_token: params.token })
		.eq("id", params.userId);
}
