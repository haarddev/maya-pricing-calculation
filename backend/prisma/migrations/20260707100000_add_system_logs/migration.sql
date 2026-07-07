-- CreateEnum
CREATE TYPE "LogCategory" AS ENUM ('INCOMING_REQUEST', 'OUTGOING_RESPONSE', 'PRICING_RESULT', 'EXTERNAL_CALLBACK', 'ERROR');

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "category" "LogCategory" NOT NULL,
    "method" TEXT,
    "path" TEXT,
    "status_code" INTEGER,
    "source" TEXT,
    "external_id" TEXT,
    "pricing_method" TEXT,
    "request_body" JSONB,
    "response_body" JSONB,
    "calculated_price" DECIMAL(12,2),
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "is_dummy" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_logs_category_created_at_idx" ON "system_logs"("category", "created_at");
