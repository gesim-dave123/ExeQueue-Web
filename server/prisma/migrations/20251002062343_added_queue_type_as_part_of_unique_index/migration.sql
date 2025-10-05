/*
  Warnings:

  - A unique constraint covering the columns `[session_id,sequence_number,queue_type]` on the table `queue` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."queue_session_id_sequence_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "queue_session_id_sequence_number_queue_type_key" ON "public"."queue"("session_id", "sequence_number", "queue_type");
