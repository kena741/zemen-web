-- Run in Supabase SQL Editor once (same as lolelink-admin migration).
-- QR target: https://www.zemenservice.com/signup?ref=qr
ALTER TABLE provider ADD COLUMN IF NOT EXISTS "signupSource" text;
ALTER TABLE customer ADD COLUMN IF NOT EXISTS signup_source text;

CREATE INDEX IF NOT EXISTS provider_signup_source_idx ON provider ("signupSource");
CREATE INDEX IF NOT EXISTS customer_signup_source_idx ON customer (signup_source);
