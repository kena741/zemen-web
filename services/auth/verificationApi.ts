import { getSupabase } from "@/lib/supabase/client";
import { friendlyLoginError } from "./authApi";

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

export async function uploadVerifyDocument(params: {
	providerId: string;
	providerName?: string;
	providerEmail?: string;
	documentId: string;
	file: File;
}): Promise<{ error: string | null }> {
	const supabase = getSupabase();
	const ext = params.file.name.split(".").pop() || "jpg";
	const path = `documentImage/${params.documentId}/${params.providerId}.${ext}`;

	const { error: uploadErr } = await supabase.storage
		.from("verify_documents")
		.upload(path, params.file, { upsert: true });
	if (uploadErr) return { error: uploadErr.message };

	const { data: publicData } = supabase.storage
		.from("verify_documents")
		.getPublicUrl(path);

	const { error: rowErr } = await supabase.from("verify_documents").upsert({
		providerId: params.providerId,
		providerName: params.providerName ?? "",
		providerEmail: params.providerEmail ?? "",
		documentId: params.documentId,
		documentImage: publicData.publicUrl || path,
		isVerify: false,
		createdAt: new Date().toISOString(),
	});
	if (rowErr) return { error: rowErr.message };
	return { error: null };
}

export async function uploadVerifyDocumentLegacy(params: {
	providerId: string;
	label: string;
	file: File;
}): Promise<{ error: string | null }> {
	const supabase = getSupabase();
	const ext = params.file.name.split(".").pop() || "jpg";
	const path = `${params.providerId}/${params.label.replace(/\s+/g, "_")}-${Date.now()}.${ext}`;

	const { error: uploadErr } = await supabase.storage
		.from("verify_documents")
		.upload(path, params.file, { upsert: true });
	if (uploadErr) return { error: uploadErr.message };

	const { error: rowErr } = await supabase.from("verify_documents").upsert({
		provider_id: params.providerId,
		document_name: params.label,
		document_url: path,
		status: "Pending",
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
	const column = params.mode === "provider" ? "fcm_token" : "fcm_token";
	await supabase
		.from(table)
		.update({ [column]: params.token })
		.eq("id", params.userId);
}
