/** Static-export-safe app paths — IDs live in query strings, not path segments. */

function withId(path: string, id: string, extra?: Record<string, string | undefined>): string {
	const qs = new URLSearchParams();
	qs.set("id", id);
	if (extra) {
		for (const [k, v] of Object.entries(extra)) {
			if (v != null && v !== "") qs.set(k, v);
		}
	}
	return `${path}?${qs.toString()}`;
}

function withPeer(path: string, peerId: string): string {
	const qs = new URLSearchParams();
	qs.set("peerId", peerId);
	return `${path}?${qs.toString()}`;
}

export const routes = {
	serviceServiceDetail: (id: string) => withId("/service/services/detail", id),
	serviceBook: (
		id: string,
		extra?: {
			bidPrice?: string;
			providerId?: string;
			postJob?: string;
		},
	) => withId("/service/book", id, extra),
	serviceBookingDetail: (id: string) => withId("/service/bookings/detail", id),
	serviceBookingHandyman: (id: string) =>
		withId("/service/bookings/handyman", id),
	serviceRequestDetail: (id: string) => withId("/service/requests/detail", id),
	serviceInboxChat: (peerId: string) => withPeer("/service/inbox/chat", peerId),

	providerBookingDetail: (id: string) => withId("/provider/bookings/detail", id),
	providerBookingAssign: (id: string) => withId("/provider/bookings/assign", id),
	providerHandymanDetail: (id: string) => withId("/provider/handymen/detail", id),
	providerHandymanEdit: (id: string) => withId("/provider/handymen/edit", id),
	providerInboxChat: (peerId: string) => withPeer("/provider/inbox/chat", peerId),
	providerJobDetail: (id: string) => withId("/provider/jobs/detail", id),
	providerOfferDetail: (id: string) => withId("/provider/offers/detail", id),
	providerServiceDetail: (id: string) => withId("/provider/services/detail", id),
	providerServiceEdit: (id: string) => withId("/provider/services/edit", id),
	providerServiceReviews: (id: string) =>
		withId("/provider/services/reviews", id),
} as const;
