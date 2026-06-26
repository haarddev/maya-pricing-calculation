-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DRAFT');

-- CreateTable
CREATE TABLE "catalogs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "CatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "template_id" TEXT NOT NULL,
    "field_values" JSONB NOT NULL,
    "calculated_price" DECIMAL(12,2),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
