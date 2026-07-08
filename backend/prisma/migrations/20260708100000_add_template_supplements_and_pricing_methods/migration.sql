-- Add new pricing method enum values
ALTER TYPE "PricingMethod" ADD VALUE IF NOT EXISTS 'PRICE_BY_PASSENGERS';
ALTER TYPE "PricingMethod" ADD VALUE IF NOT EXISTS 'PRICE_BY_SKU';
ALTER TYPE "PricingMethod" ADD VALUE IF NOT EXISTS 'PRICE_BY_MINUTES';
ALTER TYPE "PricingMethod" ADD VALUE IF NOT EXISTS 'PRICE_BY_KM_AND_HOURS';

-- Add supplements/additions column to templates
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "supplements_additions" TEXT NOT NULL DEFAULT '';
