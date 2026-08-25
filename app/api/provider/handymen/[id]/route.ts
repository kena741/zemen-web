import { NextResponse } from "next/server";

import {
	getAuthUserFromRequest,
	getSupabaseAdmin,
	resolveProviderIdForAuthUser,
} from "@/lib/supabase/admin";
import {
	handymanSlug,
	normalizeHandymanPhone,
	validateHandymanInput,
} from "@/services/handymen/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
	try {
		const { id } = await ctx.params;
		if (!id) {
			return NextResponse.json({ error: "Missing id" }, { status: 400 });
		}

		const auth = await getAuthUserFromRequest(req);
		if (!auth.userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await req.json()) as Record<string, unknown>;
		const input = {
			firstName: String(body.firstName ?? ""),
			lastName: String(body.lastName ?? ""),
			userName: String(body.userName ?? ""),
			email: String(body.email ?? ""),
			phoneNumber: String(body.phoneNumber ?? ""),
			password: body.password != null ? String(body.password) : undefined,
			categoryId: String(body.categoryId ?? ""),
			subCategoryId: String(body.subCategoryId ?? ""),
			category: String(body.category ?? ""),
			subCategory: String(body.subCategory ?? ""),
			address: String(body.address ?? ""),
		};

		const validation = validateHandymanInput(input, {
			requirePassword: false,
		});
		if (validation) {
			return NextResponse.json({ error: validation }, { status: 400 });
		}

		const admin = getSupabaseAdmin();
		const providerId = await resolveProviderIdForAuthUser(admin, auth.userId);
		if (!providerId) {
			return NextResponse.json(
				{ error: "Provider account not found." },
				{ status: 403 },
			);
		}

		const { data: existing, error: findError } = await admin
			.from("handyman")
			.select("*")
			.eq("id", id)
			.maybeSingle();

		if (findError || !existing) {
			return NextResponse.json({ error: "Handyman not found" }, { status: 404 });
		}
		if (String(existing.provider_id ?? "") !== providerId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const firstName = input.firstName.trim();
		const lastName = input.lastName.trim();
		const userName = input.userName.trim();
		const phone = normalizeHandymanPhone(input.phoneNumber);
		const email = String(existing.email ?? input.email)
			.trim()
			.toLowerCase();

		const updatePayload: Record<string, unknown> = {
			firstName,
			lastName,
			userName,
			phoneNumber: phone,
			countryCode: "+251",
			slug: handymanSlug(firstName, lastName, userName),
		};

		if (input.category.trim() || input.categoryId.trim()) {
			updatePayload.category = input.category.trim();
			updatePayload.categoryId = input.categoryId.trim() || null;
		}
		if (input.subCategory.trim() || input.subCategoryId.trim()) {
			updatePayload.subCategory = input.subCategory.trim();
			updatePayload.subCategoryId = input.subCategoryId.trim() || null;
		}
		if (input.address.trim()) {
			updatePayload.address = input.address.trim();
		}

		const newPassword = input.password?.trim();
		if (newPassword) {
			updatePayload.password = newPassword;
			const authUserId = String(existing.user_id ?? existing.userId ?? "");
			if (authUserId) {
				const { error: pwError } = await admin.auth.admin.updateUserById(
					authUserId,
					{ password: newPassword },
				);
				if (pwError) {
					return NextResponse.json({ error: pwError.message }, { status: 400 });
				}
			}
		}

		const { data: row, error: updateError } = await admin
			.from("handyman")
			.update(updatePayload)
			.eq("id", id)
			.select("*")
			.maybeSingle();

		if (updateError || !row) {
			return NextResponse.json(
				{ error: updateError?.message ?? "Update failed" },
				{ status: 400 },
			);
		}

		return NextResponse.json({ handyman: row, email });
	} catch (e) {
		const message = e instanceof Error ? e.message : "Server error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(req: Request, ctx: Ctx) {
	try {
		const { id } = await ctx.params;
		if (!id) {
			return NextResponse.json({ error: "Missing id" }, { status: 400 });
		}

		const auth = await getAuthUserFromRequest(req);
		if (!auth.userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const admin = getSupabaseAdmin();
		const providerId = await resolveProviderIdForAuthUser(admin, auth.userId);
		if (!providerId) {
			return NextResponse.json(
				{ error: "Provider account not found." },
				{ status: 403 },
			);
		}

		const { data: existing, error: findError } = await admin
			.from("handyman")
			.select("id, provider_id, user_id")
			.eq("id", id)
			.maybeSingle();

		if (findError || !existing) {
			return NextResponse.json({ error: "Handyman not found" }, { status: 404 });
		}
		if (String(existing.provider_id ?? "") !== providerId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const authUserId = existing.user_id ? String(existing.user_id) : null;

		const { error: deleteError } = await admin
			.from("handyman")
			.delete()
			.eq("id", id);

		if (deleteError) {
			return NextResponse.json({ error: deleteError.message }, { status: 400 });
		}

		if (authUserId) {
			await admin.auth.admin.deleteUser(authUserId);
		}

		return NextResponse.json({ ok: true });
	} catch (e) {
		const message = e instanceof Error ? e.message : "Server error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
