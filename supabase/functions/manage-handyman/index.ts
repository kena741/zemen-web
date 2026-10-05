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

	// supabase.functions.invoke always POSTs — branch via body.action.
	// PATCH/DELETE also accepted for direct HTTP callers.
	if (
		req.method !== "POST" &&
		req.method !== "PATCH" &&
		req.method !== "DELETE"
	) {
		return errorResponse("Method not allowed", 405, origin);
	}

	try {
		const admin = getSupabaseAdmin();
		const userId = await verifyAuth(req, admin);
		const providerId = await resolveProviderIdForAuthUser(admin, userId);
		if (!providerId) {
			throw new AppError("Provider account not found.", 403);
		}

		const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
		const id = String(body.id ?? "").trim();
		if (!id) {
			throw new AppError("Missing id", 400);
		}

		const actionRaw = String(body.action ?? "").trim().toLowerCase();
		const isDelete =
			req.method === "DELETE" ||
			actionRaw === "delete";
		const isUpdate =
			req.method === "PATCH" ||
			actionRaw === "update" ||
			(!isDelete && req.method === "POST");

		if (!isDelete && !isUpdate) {
			throw new AppError("Invalid action", 400);
		}

		const { data: existing, error: findError } = await admin
			.from("handyman")
			.select("*")
			.eq("id", id)
			.maybeSingle();

		if (findError) {
			console.error(findError);
			throw new AppError("Server error", 500);
		}
		if (!existing) {
			throw new AppError("Handyman not found", 404);
		}
		if (String(existing.provider_id ?? "") !== providerId) {
			throw new AppError("Forbidden", 403);
		}

		if (isDelete) {
			const authUserId = existing.user_id ? String(existing.user_id) : null;

			const { error: deleteError } = await admin
				.from("handyman")
				.delete()
				.eq("id", id);

			if (deleteError) {
				console.error(deleteError);
				throw new AppError("Server error", 400);
			}

			if (authUserId) {
				await admin.auth.admin.deleteUser(authUserId);
			}

			return jsonResponse({ ok: true }, 200, origin);
		}

		// Update
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
			throw new AppError(validation, 400);
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
					throw new AppError(pwError.message, 400);
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
			console.error(updateError);
			throw new AppError("Update failed", 400);
		}

		return jsonResponse(
			{
				handyman: stripPassword(row as Record<string, unknown>),
				email,
			},
			200,
			origin,
		);
	} catch (e) {
		return errorResponse(safeError(e), errorStatus(e), origin);
	}
});
