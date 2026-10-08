import { describe, expect, it } from "vitest";

import { sanitizeSignupRef } from "@/lib/signup-ref";

describe("sanitizeSignupRef", () => {
	it("accepts qr and rejects junk", () => {
		expect(sanitizeSignupRef("qr")).toBe("qr");
		expect(sanitizeSignupRef("QR")).toBe("qr");
		expect(sanitizeSignupRef("poster-1")).toBe("poster-1");
		expect(sanitizeSignupRef("")).toBe(null);
		expect(sanitizeSignupRef("bad ref")).toBe(null);
		expect(sanitizeSignupRef("a".repeat(33))).toBe(null);
	});
});
