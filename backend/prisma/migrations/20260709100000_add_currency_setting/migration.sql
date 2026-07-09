-- Add currency to app settings
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'ILS';
