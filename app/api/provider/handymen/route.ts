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

export async function POST(req: Request) {
	try {
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
			password: String(body.password ?? ""),
			categoryId: String(body.categoryId ?? ""),
			subCategoryId: String(body.subCategoryId ?? ""),
			category: String(body.category ?? ""),
			subCategory: String(body.subCategory ?? ""),
			address: String(body.address ?? ""),
		};

		const validation = validateHandymanInput(input, { requirePassword: true });
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

		const { data: providerRow } = await admin
			.from("provider")
			.select("address")
			.eq("id", providerId)
			.maybeSingle();

		const email = input.email.trim().toLowerCase();
		const phone = normalizeHandymanPhone(input.phoneNumber);
		const firstName = input.firstName.trim();
		const lastName = input.lastName.trim();
		const userName = input.userName.trim();

		const { data: created, error: createError } =
			await admin.auth.admin.createUser({
				email,
				password: input.password,
				email_confirm: true,
				user_metadata: {
					firstName,
					lastName,
					userName,
					phoneNumber: phone,
				},
			});

		if (createError || !created.user) {
			return NextResponse.json(
				{ error: createError?.message ?? "Could not create handyman account." },
				{ status: 400 },
			);
		}

		const userId = created.user.id;
		const address =
			input.address.trim() ||
			(providerRow?.address != null ? String(providerRow.address) : "");

		const payload = {
			provider_id: providerId,
			user_id: userId,
			firstName,
			lastName,
			userName,
			email,
			countryCode: "+251",
			phoneNumber: phone,
			password: input.password,
			profileImage: "",
			address,
			category: input.category.trim(),
			subCategory: input.subCategory.trim(),
			categoryId: input.categoryId.trim() || null,
			subCategoryId: input.subCategoryId.trim() || null,
			userType: "HandyMan",
			active: true,
			isActive: true,
			fcmToken: "",
			slug: handymanSlug(firstName, lastName, userName),
			createdAt: new Date().toISOString(),
		};

		const { data: row, error: insertError } = await admin
			.from("handyman")
			.insert(payload)
			.select("*")
			.maybeSingle();

		if (insertError || !row) {
			await admin.auth.admin.deleteUser(userId);
			return NextResponse.json(
				{ error: insertError?.message ?? "Could not save handyman profile." },
				{ status: 400 },
			);
		}

		return NextResponse.json({ handyman: row });
	} catch (e) {
		const message = e instanceof Error ? e.message : "Server error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
