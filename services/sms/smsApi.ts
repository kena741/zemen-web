/**
 * SMS OTP helpers — thin wrappers over Edge Function `handle-sms`.
 * Prefer importing from `@/lib/api/sms` in new code.
 */
export {
	parseSendOtpResponse,
	parseVerifyOtpResponse,
	sendOtp as sendPhoneOtp,
	verifyOtp as verifyPhoneOtp,
	type SmsOtpResult,
	type SmsVerifyResult,
} from "@/lib/api/sms";
