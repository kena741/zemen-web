import { getSupabase } from "@/lib/supabase/client";

export type JobBid = {
	price: string | null;
	providerId: string | null;
	note?: string | null;
	createdAt: string | null;
};

export type ProviderJobRequest = {
	id: string;
	title: string | null;
	description: string | null;
	price: string | null;
	customerId: string | null;
	providerId: string | null;
	accepted: boolean;
	status: string | null;
	bidList: JobBid[];
	createdAt: string | null;
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
		price: asString(m.price),
		providerId: asString(m.providerId ?? m.provider_id),
		note: asString(m.note),
		createdAt: asString(m.createdAt ?? m.created_at),
	};
}

export function mapJobRequestRow(
	row: Record<string, unknown>,
): ProviderJobRequest {
	const bidsRaw = Array.isArray(row.bidList) ? row.bidList : [];
	const bidList = bidsRaw
		.map(mapBid)
		.filter((b): b is JobBid => Boolean(b));

	return {
		id: String(row.id ?? ""),
		title: asString(row.title),
		description: asString(row.description),
		price: asString(row.price),
		customerId: asString(row.customerId ?? row.customer_id),
		providerId: asString(row.providerId ?? row.provider_id),
		accepted: row.accepted === true,
		status: asString(row.status),
		bidList,
		createdAt: asString(row.createdAt ?? row.created_at),
	};
}

/** Open marketplace jobs (not yet assigned to a provider). */
export async function fetchOpenJobRequests(): Promise<{
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

	const jobs = (data ?? [])
		.map((row) => mapJobRequestRow(row as Record<string, unknown>))
		.filter((job) => {
			const pid = job.providerId?.trim() ?? "";
			const hasProvider = Boolean(pid) && pid.toLowerCase() !== "null";
			if (hasProvider) return false;
			if (job.accepted && hasProvider) return false;
			return true;
		});

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
	return {
		job: mapJobRequestRow(data as Record<string, unknown>),
		error: null,
	};
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

	const jobs = (data ?? [])
		.map((row) => mapJobRequestRow(row as Record<string, unknown>))
		.filter((job) =>
			job.bidList.some((b) => b.providerId === providerId),
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
