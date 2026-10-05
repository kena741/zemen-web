import { verifyAuth } from "../_shared/auth.ts";
import { handleCors, requestOrigin } from "../_shared/cors.ts";
import {
	AppError,
	errorResponse,
	errorStatus,
	jsonResponse,
	safeError,
} from "../_shared/errors.ts";
import {
	handymanSlug,
	normalizeHandymanPhone,
	validateHandymanInput,
} from "../_shared/handyman-validation.ts";
import {
	getSupabaseAdmin,
	resolveProviderIdForAuthUser,
} from "../_shared/supabase.ts";

function stripPassword(row: Record<string, unknown>): Record<string, unknown> {
	const { password: _p, ...rest } = row;
	return rest;
}

Deno.serve(async (req) => {
	const origin = requestOrigin(req);
	const preflight = handleCors(req);
	if (preflight) return preflight;

	if (req.method !== "GET" && req.method !== "POST") {
		return errorResponse("Method not allowed", 405, origin);
	}

	try {
		const admin = getSupabaseAdmin();
		const userId = await verifyAuth(req, admin);
		const providerId = await resolveProviderIdForAuthUser(admin, userId);
		if (!providerId) {
			throw new AppError("Provider account not found.", 403);
		}

		if (req.method === "GET") {
			const { data, error } = await admin
				.from("handyman")
				.select("*")
				.eq("provider_id", providerId)
				.order("createdAt", { ascending: false });
			if (error) {
				console.error(error);
				throw new AppError("Server error", 500);
			}
			const handymen = (data ?? []).map((row) =>
				stripPassword(row as Record<string, unknown>),
			);
			return jsonResponse({ handymen }, 200, origin);
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
			throw new AppError(validation, 400);
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
		const password = input.password.trim();

		const { data: created, error: createError } =
			await admin.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
				user_metadata: {
					firstName,
					lastName,
					userName,
					phoneNumber: phone,
				},
			});

		if (createError || !created.user) {
			throw new AppError(
				createError?.message ?? "Could not create handyman account.",
				400,
			);
		}

		const handymanUserId = created.user.id;
		const address =
			input.address.trim() ||
			(providerRow?.address != null ? String(providerRow.address) : "");

		const payload = {
			provider_id: providerId,
			user_id: handymanUserId,
			firstName,
			lastName,
			userName,
			email,
			countryCode: "+251",
			phoneNumber: phone,
			password,
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
			await admin.auth.admin.deleteUser(handymanUserId);
			console.error(insertError);
			throw new AppError("Could not save handyman profile.", 400);
		}

		return jsonResponse(
			{ handyman: stripPassword(row as Record<string, unknown>) },
			200,
			origin,
		);
	} catch (e) {
		return errorResponse(safeError(e), errorStatus(e), origin);
	}
});
