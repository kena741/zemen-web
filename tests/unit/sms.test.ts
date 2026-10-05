import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/client", () => ({
	invokeFunction: vi.fn(),
}));

import { invokeFunction } from "@/lib/api/client";
import {
	parseSendOtpResponse,
	parseVerifyOtpResponse,
	sendPhoneOtp,
	verifyPhoneOtp,
} from "@/services/sms/smsApi";

const mockInvoke = vi.mocked(invokeFunction);

describe("parseSendOtpResponse", () => {
	it("treats acknowledge+verificationId as success", () => {
		const result = parseSendOtpResponse({
			acknowledge: "success",
			response: {
				verificationId: "vid-123",
				status: "Send is in progress...",
			},
		});
		expect(result.success).toBe(true);
		expect(result.verificationId).toBe("vid-123");
	});

	it("fails when verificationId missing", () => {
		const result = parseSendOtpResponse({
			acknowledge: "success",
			response: {},
		});
		expect(result.success).toBe(false);
	});
});

describe("sendPhoneOtp", () => {
	it("invokes handle-sms with send-otp action", async () => {
		mockInvoke.mockResolvedValueOnce({
			acknowledge: "success",
			response: { verificationId: "vid-123" },
		});

		const result = await sendPhoneOtp("0991732568");

		expect(mockInvoke).toHaveBeenCalledWith(
			"handle-sms",
			expect.objectContaining({
				action: "send-otp",
				recipient: "0991732568",
			}),
		);
		expect(result.success).toBe(true);
		expect(result.verificationId).toBe("vid-123");
	});
});

describe("verifyPhoneOtp", () => {
	it("sends verification_id like mobile", async () => {
		mockInvoke.mockResolvedValueOnce({ success: true });

		const result = await verifyPhoneOtp("0991732568", "123456", "vid-1");

		expect(result.success).toBe(true);
		expect(mockInvoke).toHaveBeenCalledWith(
			"handle-sms",
			expect.objectContaining({
				action: "verify-otp",
				verification_id: "vid-1",
				recipient: "0991732568",
				code: "123456",
			}),
		);
		expect(parseVerifyOtpResponse({ success: true }).success).toBe(true);
	});
});
