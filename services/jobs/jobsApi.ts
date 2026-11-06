import { getSupabase } from "@/lib/supabase/client";
import {
	mapServiceRow,
	type ProviderService,
} from "@/services/services/types";

export type JobBid = {
	price: string | null;
	providerId: string | null;
	providerName: string | null;
	providerImage: string | null;
	note?: string | null;
	createdAt: string | null;
};

export type ProviderJobRequest = {
	id: string;
	title: string | null;
	description: string | null;
	price: string | null;
	customerId: string | null;
	customerName: string | null;
	customerImage: string | null;
	address: string | null;
	providerId: string | null;
	accepted: boolean;
	status: string | null;
	bidList: JobBid[];
	createdAt: string | null;
	/** Category / subcategory ids from nested serviceModelList. */
	categoryIds: string[];
	subCategoryIds: string[];
	/** First service image from serviceModelList (mobile list thumb). */
	imageUrl: string | null;
	/** All images across serviceModelList entries. */
	imageUrls: string[];
	categoryName: string | null;
	serviceName: string | null;
};

function asString(value: unknown): string | null {
	if (value == null) return null;
	const s = String(value).trim();
	return s.length ? s : null;
}

function mapBid(raw: unknown): JobBid | null {
	if (!raw || typeof raw !== "object") return null;
	const m = raw as Record<string, unknown>;
	return {
		price: asString(m.price ?? m.bidPrice ?? m.bid_price),
		providerId: asString(m.providerId ?? m.provider_id),
		providerName: asString(
			m.providerName ?? m.provider_name ?? m.fullName ?? m.full_name,
		),
		providerImage: asString(
			m.providerImage ??
				m.provider_image ??
				m.profileImage ??
				m.profile_image,
		),
		note: asString(m.note ?? m.description),
		createdAt: asString(m.createdAt ?? m.created_at ?? m.date),
	};
}

function serviceModelListOf(row: Record<string, unknown>): unknown {
	return row.serviceModelList ?? row.service_model_list ?? row.serviceModellist;
}

function collectServiceImages(raw: unknown): string[] {
	if (Array.isArray(raw)) {
		return raw.map((u) => asString(u)).filter((u): u is string => Boolean(u));
	}
	const single = asString(raw);
	return single ? [single] : [];
}

function serviceMetaFromRow(row: Record<string, unknown>): {
	imageUrl: string | null;
	imageUrls: string[];
	categoryName: string | null;
	serviceName: string | null;
	address: string | null;
} {
	const list = serviceModelListOf(row);
	const entries = Array.isArray(list) ? list : [];
	const imageUrls: string[] = [];
	let categoryName: string | null = null;
	let serviceName: string | null = null;
	let address: string | null = null;
	for (const entry of entries) {
		if (!entry || typeof entry !== "object") continue;
		const m = entry as Record<string, unknown>;
		imageUrls.push(
			...collectServiceImages(m.serviceImage ?? m.service_image),
		);
		if (!categoryName) {
			categoryName = asString(
				m.categoryName ??
					m.category_name ??
					(m.categoryModel && typeof m.categoryModel === "object"
						? (m.categoryModel as Record<string, unknown>).categoryName
						: null),
			);
		}
		if (!serviceName) {
			serviceName = asString(m.serviceName ?? m.service_name);
		}
		if (!address) {
			address = asString(
				m.address ??
					(m.bookingAddress && typeof m.bookingAddress === "object"
						? (m.bookingAddress as Record<string, unknown>).address
						: null),
			);
		}
	}
	const bookingAddress = row.booking_address ?? row.bookingAddress;
	if (!address && bookingAddress && typeof bookingAddress === "object") {
		address = asString((bookingAddress as Record<string, unknown>).address);
	}
	const unique = [...new Set(imageUrls)];
	return {
		imageUrl: unique[0] ?? null,
		imageUrls: unique,
		categoryName,
		serviceName,
		address,
	};
}

/** Parse mobile-shaped job_request rows for customer list/detail UI. */
export function jobDisplayFromRow(row: Record<string, unknown>): {
	id: string;
	title: string | null;
	description: string | null;
	price: string | null;
	createdAt: string | null;
	accepted: boolean;
	imageUrl: string | null;
	imageUrls: string[];
	categoryName: string | null;
	bidList: JobBid[];
} {
	const mapped = mapJobRequestRow(row);
	return {
		id: mapped.id,
		title: mapped.title,
		description: mapped.description,
		price: mapped.price,
		createdAt: mapped.createdAt,
		accepted: mapped.accepted,
		imageUrl: mapped.imageUrl,
		imageUrls: mapped.imageUrls,
		categoryName: mapped.categoryName,
		bidList: mapped.bidList,
	};
}

export function formatJobDate(iso: string | null | undefined): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

/** Fill missing bid provider name/avatar from provider table. */
export async function hydrateBidProviders(
	bids: JobBid[],
): Promise<JobBid[]> {
	const missing = [
		...new Set(
			bids
				.filter((b) => b.providerId && (!b.providerName || !b.providerImage))
				.map((b) => b.providerId as string),
		),
	];
	if (!missing.length) return bids;

	const byId = new Map<
		string,
		{ name: string | null; image: string | null }
	>();
	const { data: byPk } = await getSupabase()
		.from("provider")
		.select("id, user_id, fullName, profileImage")
		.in("id", missing);
	for (const row of byPk ?? []) {
		const r = row as Record<string, unknown>;
		const id = asString(r.id);
		const userId = asString(r.user_id);
		const meta = {
			name: asString(r.fullName),
			image: asString(r.profileImage),
		};
		if (id) byId.set(id, meta);
		if (userId) byId.set(userId, meta);
	}
	const still = missing.filter((id) => !byId.has(id));
	if (still.length) {
		const { data: byUser } = await getSupabase()
			.from("provider")
			.select("id, user_id, fullName, profileImage")
			.in("user_id", still);
		for (const row of byUser ?? []) {
			const r = row as Record<string, unknown>;
			const id = asString(r.id);
			const userId = asString(r.user_id);
			const meta = {
				name: asString(r.fullName),
				image: asString(r.profileImage),
			};
			if (id) byId.set(id, meta);
			if (userId) byId.set(userId, meta);
		}
	}

	return bids.map((b) => {
		if (!b.providerId) return b;
		const meta = byId.get(b.providerId);
		if (!meta) return b;
		return {
			...b,
			providerName: b.providerName ?? meta.name,
			providerImage: b.providerImage ?? meta.image,
		};
	});
}

function categoryIdsFromServiceModelList(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	const ids = new Set<string>();
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const m = item as Record<string, unknown>;
		const id = asString(m.categoryId ?? m.category_id);
		if (id) ids.add(id);
		const nested = m.categoryModel ?? m.category_model;
		if (nested && typeof nested === "object") {
			const n = nested as Record<string, unknown>;
			const nestedId = asString(n.id ?? n.categoryId ?? n.category_id);
			if (nestedId) ids.add(nestedId);
		}
	}
	return [...ids];
}

function subCategoryIdsFromServiceModelList(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	const ids = new Set<string>();
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const m = item as Record<string, unknown>;
		const id = asString(
			m.subCategoryId ?? m.sub_category_id ?? m.subcategoryId,
		);
		if (id) ids.add(id);
		const nested = m.subCategoryModel ?? m.sub_category_model;
		if (nested && typeof nested === "object") {
			const n = nested as Record<string, unknown>;
			const nestedId = asString(n.id ?? n.subCategoryId ?? n.sub_category_id);
			if (nestedId) ids.add(nestedId);
		}
	}
	return [...ids];
}

/**
 * Match job to provider on subcategory first.
 * Parent category alone is too broad (Cleaning ≠ Catering under Domestic).
 */
export function jobMatchesProviderCategories(
	job: Pick<ProviderJobRequest, "categoryIds" | "subCategoryIds">,
	provider: { categoryIds: Set<string>; subCategoryIds: Set<string> },
): boolean {
	if (provider.subCategoryIds.size > 0) {
		if (job.subCategoryIds.some((id) => provider.subCategoryIds.has(id))) {
			return true;
		}
		// Job missing subcategory ids — allow parent category only as last resort.
		if (job.subCategoryIds.length === 0) {
			return job.categoryIds.some((id) => provider.categoryIds.has(id));
		}
		return false;
	}
	return job.categoryIds.some((id) => provider.categoryIds.has(id));
}

export function mapJobRequestRow(
	row: Record<string, unknown>,
): ProviderJobRequest {
	const bidsRaw = Array.isArray(row.bidList) ? row.bidList : [];
	const bidList = bidsRaw
		.map(mapBid)
		.filter((b): b is JobBid => Boolean(b));
	const serviceModelList = serviceModelListOf(row);
	const meta = serviceMetaFromRow(row);

	return {
		id: String(row.id ?? ""),
		title: asString(row.title),
		description: asString(row.description),
		price: asString(row.price),
		customerId: asString(row.customerId ?? row.customer_id),
		customerName: null,
		customerImage: null,
		address: meta.address,
		providerId: asString(row.providerId ?? row.provider_id),
		accepted: row.accepted === true,
		status: asString(row.status),
		bidList,
		createdAt: asString(row.createdAt ?? row.created_at),
		categoryIds: categoryIdsFromServiceModelList(serviceModelList),
		subCategoryIds: subCategoryIdsFromServiceModelList(serviceModelList),
		imageUrl: meta.imageUrl,
		imageUrls: meta.imageUrls,
		categoryName: meta.categoryName,
		serviceName: meta.serviceName ?? asString(row.title),
	};
}

export async function hydrateJobCustomers(
	jobs: ProviderJobRequest[],
): Promise<ProviderJobRequest[]> {
	const ids = [
		...new Set(
			jobs
				.map((j) => j.customerId)
				.filter((id): id is string => Boolean(id)),
		),
	];
	if (!ids.length) return jobs;

	const byId = new Map<
		string,
		{ name: string | null; image: string | null }
	>();
	const { data: byPk } = await getSupabase()
		.from("customer")
		.select("id, user_id, fullName, firstName, lastName, profileImage")
		.in("id", ids);
	const { data: byUser } = await getSupabase()
		.from("customer")
		.select("id, user_id, fullName, firstName, lastName, profileImage")
		.in("user_id", ids);
	for (const row of [...(byPk ?? []), ...(byUser ?? [])]) {
		const r = row as Record<string, unknown>;
		const id = asString(r.id);
		const userId = asString(r.user_id);
		const full =
			asString(r.fullName) ||
			[asString(r.firstName), asString(r.lastName)].filter(Boolean).join(" ") ||
			null;
		const meta = { name: full, image: asString(r.profileImage) };
		if (id) byId.set(id, meta);
		if (userId) byId.set(userId, meta);
	}

	return jobs.map((job) => {
		if (!job.customerId) return job;
		const meta = byId.get(job.customerId);
		if (!meta) return job;
		return {
			...job,
			customerName: job.customerName ?? meta.name,
			customerImage: job.customerImage ?? meta.image,
		};
	});
}

export async function fetchProviderVerifiedSubCategoryIds(
	providerId: string,
): Promise<string[]> {
	if (!providerId) return [];
	const { data, error } = await getSupabase()
		.from("provider")
		.select("verified_subcategory_ids")
		.eq("id", providerId)
		.maybeSingle();
	if (error || !data) return [];
	const raw = (data as Record<string, unknown>).verified_subcategory_ids;
	if (!Array.isArray(raw)) return [];
	return raw.map((id) => String(id).trim()).filter(Boolean);
}

/**
 * Categories + subcategories from the provider's own service listings.
 * This is the source of truth for "jobs in my category" — not verified_* alone.
 */
export async function fetchProviderServiceCategoryScope(
	providerId: string,
): Promise<{ categoryIds: string[]; subCategoryIds: string[] }> {
	if (!providerId) return { categoryIds: [], subCategoryIds: [] };
	// Same lookup path as fetchProviderServices (provider_id, then providerId).
	let { data, error } = await getSupabase()
		.from("service")
		.select("categoryId, subCategoryId, isArchived, status")
		.eq("provider_id", providerId)
		.limit(200);
	if (error) {
		({ data, error } = await getSupabase()
			.from("service")
			.select("categoryId, subCategoryId, isArchived, status")
			.eq("providerId", providerId)
			.limit(200));
	}
	if (error || !data) return { categoryIds: [], subCategoryIds: [] };

	const categoryIds = new Set<string>();
	const subCategoryIds = new Set<string>();
	for (const row of data) {
		const r = row as Record<string, unknown>;
		const archived = r.isArchived === true || r.isArchived === "true";
		const inactive = r.status === false || r.status === "false";
		if (archived || inactive) continue;
		const cat = asString(r.categoryId);
		const sub = asString(r.subCategoryId);
		if (cat) categoryIds.add(cat);
		if (sub) subCategoryIds.add(sub);
	}
	return {
		categoryIds: [...categoryIds],
		subCategoryIds: [...subCategoryIds],
	};
}

/** @deprecated use fetchProviderServiceCategoryScope */
export async function fetchProviderServiceSubCategoryIds(
	providerId: string,
): Promise<string[]> {
	const scope = await fetchProviderServiceCategoryScope(providerId);
	return scope.subCategoryIds;
}

async function providerMatchingScope(providerId: string): Promise<{
	categoryIds: Set<string>;
	subCategoryIds: Set<string>;
}> {
	const scope = await fetchProviderServiceCategoryScope(providerId);
	const categoryIds = new Set(scope.categoryIds);
	const subCategoryIds = new Set(scope.subCategoryIds);
	// If they have no active services yet, fall back to verified subcategories.
	if (categoryIds.size === 0 && subCategoryIds.size === 0) {
		for (const id of await fetchProviderVerifiedSubCategoryIds(providerId)) {
			subCategoryIds.add(id);
		}
	}
	return { categoryIds, subCategoryIds };
}

/** Open marketplace jobs (not yet assigned to a provider). */
export async function fetchOpenJobRequests(params?: {
	/** When set, only jobs matching provider service categories. */
	providerId?: string;
}): Promise<{
	jobs: ProviderJobRequest[];
	error: string | null;
}> {
	const { data, error } = await getSupabase()
		.from("job_request")
		.select("*")
		.or("status.eq.accepted,status.is.null")
		.order("createdAt", { ascending: false })
		.limit(100);

	if (error) {
		console.error("fetchOpenJobRequests", error);
		return { jobs: [], error: error.message };
	}

	let jobs = (data ?? [])
		.map((row) => mapJobRequestRow(row as Record<string, unknown>))
		.filter((job) => {
			const pid = job.providerId?.trim() ?? "";
			const hasProvider = Boolean(pid) && pid.toLowerCase() !== "null";
			if (hasProvider) return false;
			if (job.accepted) return false;
			return true;
		});

	if (params?.providerId) {
		const scope = await providerMatchingScope(params.providerId);
		if (scope.categoryIds.size === 0 && scope.subCategoryIds.size === 0) {
			jobs = [];
		} else {
			jobs = jobs.filter((job) => jobMatchesProviderCategories(job, scope));
		}
	}

	jobs = await hydrateJobCustomers(jobs);
	return { jobs, error: null };
}

export async function fetchJobRequestById(
	id: string,
): Promise<{ job: ProviderJobRequest | null; error: string | null }> {
	if (!id) return { job: null, error: "Missing id" };
	const { data, error } = await getSupabase()
		.from("job_request")
		.select("*")
		.eq("id", id)
		.maybeSingle();

	if (error) {
		console.error("fetchJobRequestById", error);
		return { job: null, error: error.message };
	}
	if (!data) return { job: null, error: "Job not found" };
	const [job] = await hydrateJobCustomers([
		mapJobRequestRow(data as Record<string, unknown>),
	]);
	return { job, error: null };
}

/**
 * Mobile books post-job requests from embedded serviceModelList — not the
 * catalog `service` table (those ids are client-generated snapshots).
 */
export function serviceFromJobRow(
	row: Record<string, unknown>,
	opts?: { providerId?: string | null; bidPrice?: string | null },
): ProviderService | null {
	const list = serviceModelListOf(row);
	const first =
		Array.isArray(list) && list[0] && typeof list[0] === "object"
			? (list[0] as Record<string, unknown>)
			: null;
	if (!first) return null;
	const service = mapServiceRow(first);
	if (!service.id) service.id = String(row.id ?? crypto.randomUUID());
	service.categoryName =
		service.categoryName ?? asString(first.categoryName ?? first.category_name);
	service.subCategoryName =
		service.subCategoryName ??
		asString(first.subCategoryName ?? first.sub_category_name);
	if (opts?.providerId) service.providerId = opts.providerId;
	if (opts?.bidPrice != null && String(opts.bidPrice).trim()) {
		service.price = String(opts.bidPrice).trim();
	}
	// Bid amount is the booking price — not a second custom-offer round.
	service.allowsCustomOffer = false;
	service.discount = null;
	return service;
}

export async function fetchJobServiceForBooking(
	jobId: string,
	opts?: { providerId?: string | null; bidPrice?: string | null },
): Promise<{
	service: ProviderService | null;
	job: ProviderJobRequest | null;
	serviceDetails: Record<string, unknown>[];
	error: string | null;
}> {
	if (!jobId) {
		return {
			service: null,
			job: null,
			serviceDetails: [],
			error: "Missing job id",
		};
	}
	const { data, error } = await getSupabase()
		.from("job_request")
		.select("*")
		.eq("id", jobId)
		.maybeSingle();
	if (error) {
		console.error("fetchJobServiceForBooking", error);
		return {
			service: null,
			job: null,
			serviceDetails: [],
			error: error.message,
		};
	}
	if (!data) {
		return {
			service: null,
			job: null,
			serviceDetails: [],
			error: "Job not found",
		};
	}
	const row = data as Record<string, unknown>;
	const list = serviceModelListOf(row);
	const serviceDetails = Array.isArray(list)
		? list.filter(
				(item): item is Record<string, unknown> =>
					Boolean(item) && typeof item === "object",
			)
		: [];
	const service = serviceFromJobRow(row, opts);
	if (!service) {
		return {
			service: null,
			job: mapJobRequestRow(row),
			serviceDetails,
			error: "Job has no service details.",
		};
	}
	return {
		service,
		job: mapJobRequestRow(row),
		serviceDetails,
		error: null,
	};
}

export async function markJobRequestPaid(
	jobId: string,
): Promise<{ ok: boolean; error: string | null }> {
	const id = jobId.trim();
	if (!id) return { ok: false, error: "Missing job id" };
	const { error } = await getSupabase()
		.from("job_request")
		.update({ is_paid: true })
		.eq("id", id);
	if (error) {
		console.error("markJobRequestPaid", error);
		return { ok: false, error: error.message };
	}
	return { ok: true, error: null };
}

/** Jobs where this provider already placed a bid. */
export async function fetchMyBidJobs(
	providerId: string,
): Promise<{ jobs: ProviderJobRequest[]; error: string | null }> {
	if (!providerId) return { jobs: [], error: "Missing provider id" };

	const { data, error } = await getSupabase()
		.from("job_request")
		.select("*")
		.not("bidList", "is", null)
		.order("createdAt", { ascending: false })
		.limit(150);

	if (error) {
		console.error("fetchMyBidJobs", error);
		return { jobs: [], error: error.message };
	}

	const jobs = await hydrateJobCustomers(
		(data ?? [])
			.map((row) => mapJobRequestRow(row as Record<string, unknown>))
			.filter((job) =>
				job.bidList.some((b) => b.providerId === providerId),
			),
	);

	return { jobs, error: null };
}

export async function placeJobBid(params: {
	jobId: string;
	providerId: string;
	price: string;
}): Promise<{ ok: boolean; error: string | null }> {
	const price = params.price.trim();
	const amount = Number(price);
	if (!price || Number.isNaN(amount) || amount < 1) {
		return { ok: false, error: "Enter a valid bid amount (min 1 ETB)." };
	}

	const current = await fetchJobRequestById(params.jobId);
	if (!current.job) {
		return { ok: false, error: current.error ?? "Job not found" };
	}
	if (current.job.accepted && current.job.providerId) {
		return { ok: false, error: "This job already has an accepted provider." };
	}
	if (current.job.bidList.some((b) => b.providerId === params.providerId)) {
		return { ok: false, error: "You already placed a bid on this job." };
	}

	const bidList = [
		...current.job.bidList,
		{
			price,
			providerId: params.providerId,
			createdAt: new Date().toISOString(),
		},
	];

	const { error } = await getSupabase()
		.from("job_request")
		.update({
			bidList,
			accepted: false,
		})
		.eq("id", params.jobId);

	if (error) {
		console.error("placeJobBid", error);
		return { ok: false, error: error.message };
	}
	return { ok: true, error: null };
}
