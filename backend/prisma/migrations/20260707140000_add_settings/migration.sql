-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN "login_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "locked_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "app_name" TEXT NOT NULL DEFAULT 'Maya Pricing',
    "jwt_expires_in" TEXT NOT NULL DEFAULT '7d',
    "login_attempt_limit" INTEGER NOT NULL DEFAULT 5,
    "lockout_duration_minutes" INTEGER NOT NULL DEFAULT 15,
    "allow_only_active_templates" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- Seed default settings
INSERT INTO "app_settings" ("id", "app_name", "jwt_expires_in", "login_attempt_limit", "lockout_duration_minutes", "allow_only_active_templates", "updated_at")
VALUES ('default', 'Maya Pricing', '7d', 5, 15, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Promote seed admin to ADMIN role
UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'admin@maya.local';
