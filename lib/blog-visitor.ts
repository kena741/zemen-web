const VISITOR_KEY = "zemen.blog.visitor";
const VIEWED_PREFIX = "zemen.blog.viewed.";
const LIKED_PREFIX = "zemen.blog.liked.";

function randomKey(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getBlogVisitorKey(): string {
	if (typeof window === "undefined") return "";
	try {
		const existing = window.localStorage.getItem(VISITOR_KEY);
		if (existing && existing.length >= 8) return existing;
		const next = randomKey();
		window.localStorage.setItem(VISITOR_KEY, next);
		return next;
	} catch {
		return randomKey();
	}
}

export function hasViewedBlogPost(postId: string): boolean {
	if (typeof window === "undefined") return true;
	try {
		return window.sessionStorage.getItem(`${VIEWED_PREFIX}${postId}`) === "1";
	} catch {
		return false;
	}
}

export function markBlogPostViewed(postId: string): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(`${VIEWED_PREFIX}${postId}`, "1");
	} catch {
		/* ignore */
	}
}

export function hasLikedBlogPost(postId: string): boolean {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(`${LIKED_PREFIX}${postId}`) === "1";
	} catch {
		return false;
	}
}

export function setLikedBlogPost(postId: string, liked: boolean): void {
	if (typeof window === "undefined") return;
	try {
		if (liked) window.localStorage.setItem(`${LIKED_PREFIX}${postId}`, "1");
		else window.localStorage.removeItem(`${LIKED_PREFIX}${postId}`);
	} catch {
		/* ignore */
	}
}
