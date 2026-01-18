-- Migration: Add missing marketing addon columns to salons table
-- This script is safe to run multiple times (uses IF NOT EXISTS)

-- Marketing Add-On Core Fields
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "marketing_addon_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "marketing_addon_suspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "marketing_addon_enabled_at" TIMESTAMP(3);
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "stripe_marketing_sub_id" TEXT;

-- SendGrid Configuration
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "sendgrid_api_key_encrypted" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "sendgrid_from_email" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "sendgrid_validated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "sendgrid_last_validated_at" TIMESTAMP(3);

-- Twilio Configuration
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_account_sid_encrypted" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_auth_token_encrypted" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_phone_number" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_validated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "twilio_last_validated_at" TIMESTAMP(3);

-- Verify columns were added
SELECT column_name FROM information_schema.columns WHERE table_name = 'salons' ORDER BY ordinal_position;
