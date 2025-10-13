/*
  Warnings:

  - A unique constraint covering the columns `[session_date,is_active]` on the table `queue_session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "queue_session_session_date_is_active_key" ON "public"."queue_session"("session_date", "is_active");
