import { describe, expect, it } from "vitest";

// Mirror parse helpers by exercising through exported API with mocked fetch.
import { sendPhoneOtp, verifyPhoneOtp } from "@/services/sms/smsApi";

describe("sendPhoneOtp response parsing", () => {
	it("treats acknowledge+verificationId as success", async () => {
		const original = globalThis.fetch;
		globalThis.fetch = (async () =>
			new Response(
				JSON.stringify({
					acknowledge: "success",
					response: {
						verificationId: "vid-123",
						status: "Send is in progress...",
					},
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			)) as typeof fetch;

		const result = await sendPhoneOtp("0991732568");
		globalThis.fetch = original;

		expect(result.success).toBe(true);
		expect(result.verificationId).toBe("vid-123");
	});

	it("fails when verificationId missing", async () => {
		const original = globalThis.fetch;
		globalThis.fetch = (async () =>
			new Response(JSON.stringify({ acknowledge: "success", response: {} }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			})) as typeof fetch;

		const result = await sendPhoneOtp("0991732568");
		globalThis.fetch = original;

		expect(result.success).toBe(false);
	});
});

describe("verifyPhoneOtp", () => {
	it("sends verification_id like mobile", async () => {
		const original = globalThis.fetch;
		let body = "";
		globalThis.fetch = (async (_url, init) => {
			body = String(init?.body ?? "");
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}) as typeof fetch;

		const result = await verifyPhoneOtp("0991732568", "123456", "vid-1");
		globalThis.fetch = original;

		expect(result.success).toBe(true);
		expect(JSON.parse(body)).toMatchObject({
			verification_id: "vid-1",
			recipient: "0991732568",
			code: "123456",
		});
	});
});
