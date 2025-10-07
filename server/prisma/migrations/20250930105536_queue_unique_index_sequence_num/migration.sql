/*
  Warnings:

  - A unique constraint covering the columns `[queue_type,sequence_number,queue_date,queue_session_id]` on the table `queue` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."unq_queue_number_created";

-- CreateIndex
CREATE UNIQUE INDEX "unq_queue_number_created" ON "public"."queue"("queue_type", "sequence_number", "queue_date", "queue_session_id");
