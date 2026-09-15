import { getSupabase } from "@/lib/supabase/client";

export interface IdentityDocument {
	id: string;
	name: string;
	description: string;
	isRequired: boolean;
}

export type VerifyDocStatus = "required" | "pending" | "approved" | "rejected";

export interface ProviderVerifyDoc {
	documentId: string;
	isVerify: boolean | null;
	documentImage: string | null;
	status: VerifyDocStatus;
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

/** Matches mobile verify_id chips: no image → required; true → approved; false → rejected; null → pending. */
export function resolveVerifyStatus(
	isVerify: boolean | null,
	hasImage: boolean,
): VerifyDocStatus {
	if (!hasImage) return "required";
	if (isVerify === true) return "approved";
	if (isVerify === false) return "rejected";
	return "pending";
}

export async function fetchSignupIdentityDocuments(): Promise<{
	documents: IdentityDocument[];
	error: string | null;
}> {
	const { data, error } = await getSupabase()
		.from("documents")
		.select("id, name, active")
		.eq("active", true);

	if (error) return { documents: [], error: error.message };

	const documents = (data ?? [])
		.map((row) => {
			const r = row as Record<string, unknown>;
			const name = String(r.name ?? "").trim();
			return {
				id: String(r.id ?? ""),
				name,
				description: "",
				isRequired: true,
			};
		})
		.filter((d) => d.id && d.name && isSignupIdentityDocument(d.name))
		.sort(sortIdentityDocs);

	return { documents, error: null };
}

export async function fetchDocumentsBySubCategory(
	subCategoryId: string,
): Promise<{ documents: IdentityDocument[]; error: string | null }> {
	if (!subCategoryId) return { documents: [], error: null };

	const { data: linkRows, error: linkErr } = await getSupabase()
		.from("sub_category_documents")
		.select("documentId, description, isRequired")
		.eq("subCategoryId", subCategoryId)
		.or("isRequired.is.null,isRequired.eq.true");

	if (linkErr) return { documents: [], error: linkErr.message };

	const descById = new Map<string, string>();
	const ids: string[] = [];
	for (const row of linkRows ?? []) {
		const r = row as Record<string, unknown>;
		const id = String(r.documentId ?? "").trim();
		if (!id || descById.has(id)) continue;
		ids.push(id);
		descById.set(id, String(r.description ?? "").trim());
	}
	if (ids.length === 0) return { documents: [], error: null };

	const { data, error } = await getSupabase()
		.from("documents")
		.select("id, name, active")
		.eq("active", true)
		.in("id", ids);

	if (error) return { documents: [], error: error.message };

	const byId = new Map(
		(data ?? []).map((row) => {
			const r = row as Record<string, unknown>;
			return [String(r.id ?? ""), r] as const;
		}),
	);

	const documents: IdentityDocument[] = [];
	for (const id of ids) {
		const r = byId.get(id);
		if (!r) continue;
		const name = String(r.name ?? "").trim();
		if (!name) continue;
		documents.push({
			id,
			name,
			description: descById.get(id) ?? "",
			isRequired: true,
		});
	}
	documents.sort(sortIdentityDocs);
	return { documents, error: null };
}

export async function fetchProviderVerifyDocuments(providerId: string): Promise<{
	byDocumentId: Record<string, ProviderVerifyDoc>;
	error: string | null;
}> {
	const { data, error } = await getSupabase()
		.from("verify_documents")
		.select("documentId, isVerify, documentImage")
		.eq("providerId", providerId)
		.order("createdAt", { ascending: false });

	if (error) return { byDocumentId: {}, error: error.message };

	const byDocumentId: Record<string, ProviderVerifyDoc> = {};
	for (const row of data ?? []) {
		const r = row as Record<string, unknown>;
		const id = String(r.documentId ?? "");
		if (!id || byDocumentId[id]) continue;
		const isVerify =
			r.isVerify == null ? null : Boolean(r.isVerify);
		const documentImage =
			r.documentImage != null && String(r.documentImage).trim()
				? String(r.documentImage)
				: null;
		byDocumentId[id] = {
			documentId: id,
			isVerify,
			documentImage,
			status: resolveVerifyStatus(isVerify, Boolean(documentImage)),
		};
	}
	return { byDocumentId, error: null };
}
