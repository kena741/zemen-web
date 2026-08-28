import { getSupabase } from "@/lib/supabase/client";

export interface IdentityDocument {
	id: string;
	name: string;
	isRequired: boolean;
}

function isSignupIdentityDocument(name: string): boolean {
	const lower = name.toLowerCase();
	return lower.includes("national") && lower.includes("id");
}

function sortIdentityDocs(a: IdentityDocument, b: IdentityDocument): number {
	const rank = (name: string) => {
		const lower = name.toLowerCase();
		if (lower.includes("front")) return 0;
		if (lower.includes("back")) return 1;
		return 2;
	};
	const diff = rank(a.name) - rank(b.name);
	return diff !== 0 ? diff : a.name.localeCompare(b.name);
}

export async function fetchSignupIdentityDocuments(): Promise<{
	documents: IdentityDocument[];
	error: string | null;
}> {
	const { data, error } = await getSupabase()
		.from("documents")
		.select("id, name, documentName, active, isRequired")
		.eq("active", true);

	if (error) return { documents: [], error: error.message };

	const documents = (data ?? [])
		.map((row) => {
			const r = row as Record<string, unknown>;
			const name = String(r.name ?? r.documentName ?? "").trim();
			return {
				id: String(r.id ?? ""),
				name,
				isRequired: r.isRequired === true,
			};
		})
		.filter((d) => d.id && d.name && isSignupIdentityDocument(d.name))
		.sort(sortIdentityDocs);

	return { documents, error: null };
}

export async function fetchProviderVerifyDocuments(providerId: string): Promise<{
	byDocumentId: Record<string, { isVerify: boolean }>;
	error: string | null;
}> {
	const { data, error } = await getSupabase()
		.from("verify_documents")
		.select("documentId, isVerify")
		.eq("providerId", providerId);

	if (error) return { byDocumentId: {}, error: error.message };

	const byDocumentId: Record<string, { isVerify: boolean }> = {};
	for (const row of data ?? []) {
		const r = row as Record<string, unknown>;
		const id = String(r.documentId ?? "");
		if (!id) continue;
		byDocumentId[id] = { isVerify: r.isVerify === true };
	}
	return { byDocumentId, error: null };
}
