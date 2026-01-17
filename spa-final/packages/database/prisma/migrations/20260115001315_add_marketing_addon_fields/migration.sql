-- Marketing & Reminders Add-On Fields Migration
-- Adds multi-tenant marketing addon configuration to salons table

-- Marketing Add-On Core Fields
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "marketing_addon_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "marketing_addon_suspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "marketing_addon_enabled_at" TIMESTAMP(3);
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "stripe_marketing_sub_id" TEXT;

-- SendGrid Configuration (Encrypted at application level)
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "sendgrid_api_key_encrypted" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "sendgrid_from_email" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "sendgrid_validated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "sendgrid_last_validated_at" TIMESTAMP(3);

-- Twilio Configuration (Encrypted at application level)
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_account_sid_encrypted" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_auth_token_encrypted" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_phone_number" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_validated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_last_validated_at" TIMESTAMP(3);
