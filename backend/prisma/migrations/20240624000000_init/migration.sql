-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DRAFT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PricingMethod" AS ENUM ('PRICE_BY_DESTINATION', 'PRICE_BY_HOURS', 'PRICE_BY_ROUTE', 'PRICE_BY_DISTANCE', 'PRICE_BY_AREA');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'DROPDOWN', 'BOOLEAN', 'DATE', 'TIME');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "pricing_method" "PricingMethod" NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_fields" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "label_he" TEXT NOT NULL,
    "field_type" "FieldType" NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "template_fields_template_id_field_key_key" ON "template_fields"("template_id", "field_key");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_fields" ADD CONSTRAINT "template_fields_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
