-- Add onboarding tracking fields to Salon model
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "business_type" TEXT;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "onboarding_complete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "onboarding_step" INTEGER NOT NULL DEFAULT 1;
