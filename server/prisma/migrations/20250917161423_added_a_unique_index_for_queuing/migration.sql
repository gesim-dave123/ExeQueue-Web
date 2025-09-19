/*
  Warnings:

  - A unique constraint covering the columns `[queue_type,queue_number,created_at]` on the table `queue` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."idx_queue_number_created";

-- CreateIndex
CREATE INDEX "idx_queue_number_created" ON "public"."queue"("queue_type", "queue_number", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "unq_queue_number_created" ON "public"."queue"("queue_type", "queue_number", "created_at");
