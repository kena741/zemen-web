#!/usr/bin/env bash
# Deploy Zemen Edge Functions to project rffptyqhqvzrpmyxlwwu
# Prerequisite: supabase login with an account that can access this project
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="rffptyqhqvzrpmyxlwwu"

if [[ -f .env ]]; then
  # Strip CR (Windows line endings) then export needed keys
  eval "$(
    tr -d '\r' < .env | grep -E '^(NEXT_PUBLIC_SITE_URL|CHAPA_SECRET_KEY|SMS_API_BASE_URL|EDGE_FUNCTIONS_BASE_URL)=' | sed 's/^/export /'
  )"
fi

echo "==> Linking project ${PROJECT_REF}"
supabase link --project-ref "$PROJECT_REF"

FUNCTIONS=(
  complete-booking
  handle-sms
  verify-payment
  chapa-payment
  manage-handymen
  manage-handyman
  dynamic-edge
  refund-rejected
)

for fn in "${FUNCTIONS[@]}"; do
  echo "==> Deploying ${fn}"
  supabase functions deploy "$fn" --no-verify-jwt
done

echo "==> Setting secrets"
# SUPABASE_URL / SUPABASE_ANON_KEY / SERVICE_ROLE_KEY are platform-injected
# (CLI rejects custom secrets whose names start with SUPABASE_).
# ALLOWED_ORIGIN=* → cors.ts reflects any Origin (Authorization-safe)
supabase secrets set \
  "ALLOWED_ORIGIN=*" \
  "SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://zemen-web-ivory.vercel.app}" \
  "EDGE_FUNCTIONS_BASE_URL=${EDGE_FUNCTIONS_BASE_URL:-https://rffptyqhqvzrpmyxlwwu.functions.supabase.co}"

if [[ -n "${CHAPA_SECRET_KEY:-}" ]]; then
  supabase secrets set "CHAPA_SECRET_KEY=${CHAPA_SECRET_KEY}"
else
  echo "NOTE: CHAPA_SECRET_KEY not in .env — Chapa will use app_settings.payment if present"
fi

if [[ -n "${SMS_API_BASE_URL:-}" ]]; then
  supabase secrets set "SMS_API_BASE_URL=${SMS_API_BASE_URL}"
fi

echo "==> Done. SUPABASE_URL / SERVICE_ROLE_KEY are injected automatically by Supabase."
echo "Test example:"
echo "  curl -i -X POST \"https://${PROJECT_REF}.functions.supabase.co/complete-booking\" \\"
echo "    -H 'Content-Type: application/json' -d '{\"bookingId\":\"x\"}'"
echo "  (expect 401 Unauthorized without a user JWT)"
