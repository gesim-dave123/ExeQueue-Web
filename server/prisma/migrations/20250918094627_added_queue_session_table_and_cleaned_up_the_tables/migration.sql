/*
  Warnings:

  - You are about to drop the column `action` on the `transaction_history` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[queue_type,queue_number,queue_date,queue_session_id]` on the table `queue` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `queue_date` to the `queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `queue_session_id` to the `queue` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."idx_course_created_at";

-- DropIndex
DROP INDEX "public"."idx_course_deleted_at";

-- DropIndex
DROP INDEX "public"."idx_queue_course_status_type";

-- DropIndex
DROP INDEX "public"."idx_queue_created_at";

-- DropIndex
DROP INDEX "public"."idx_queue_deleted_at";

-- DropIndex
DROP INDEX "public"."idx_queue_number_created";

-- DropIndex
DROP INDEX "public"."idx_queue_status_type_created";

-- DropIndex
DROP INDEX "public"."idx_queue_student_name";

-- DropIndex
DROP INDEX "public"."idx_queue_updated_at";

-- DropIndex
DROP INDEX "public"."idx_queue_year_course";

-- DropIndex
DROP INDEX "public"."unq_queue_number_created";

-- DropIndex
DROP INDEX "public"."idx_request_deleted_at";

-- DropIndex
DROP INDEX "public"."idx_request_updated_at";

-- DropIndex
DROP INDEX "public"."idx_sas_staff_deleted_at";

-- DropIndex
DROP INDEX "public"."idx_sas_staff_full_name";

-- DropIndex
DROP INDEX "public"."idx_sas_staff_updated_at";

-- DropIndex
DROP INDEX "public"."idx_service_window_created_at";

-- DropIndex
DROP INDEX "public"."idx_service_window_deleted_at";

-- DropIndex
DROP INDEX "public"."idx_service_window_is_active";

-- DropIndex
DROP INDEX "public"."idx_transaction_action_time";

-- DropIndex
DROP INDEX "public"."idx_transaction_created_at";

-- DropIndex
DROP INDEX "public"."idx_transaction_queue_action_time";

-- DropIndex
DROP INDEX "public"."idx_transaction_role_action";

-- AlterTable
ALTER TABLE "public"."queue" ADD COLUMN     "queue_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "queue_session_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."request" ALTER COLUMN "processed_by" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."sas_staff" ADD COLUMN     "window_id" INTEGER,
ALTER COLUMN "username" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."transaction_history" DROP COLUMN "action",
ADD COLUMN     "transactionStatus" "public"."Status";

-- CreateTable
CREATE TABLE "public"."QueueSession" (
    "session_id" SERIAL NOT NULL,
    "session_no" INTEGER NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueSession_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE INDEX "idx_today_active_session" ON "public"."QueueSession"("session_date", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "unq_sessions_same_date" ON "public"."QueueSession"("session_date", "session_no");

-- CreateIndex
CREATE UNIQUE INDEX "unq_queue_number_created" ON "public"."queue"("queue_type", "queue_number", "queue_date", "queue_session_id");

-- CreateIndex
CREATE INDEX "idx_transaction_action_time" ON "public"."transaction_history"("transactionStatus", "created_at");

-- CreateIndex
CREATE INDEX "idx_transaction_role_action" ON "public"."transaction_history"("performed_by_role", "transactionStatus");

-- AddForeignKey
ALTER TABLE "public"."queue" ADD CONSTRAINT "queue_queue_session_id_fkey" FOREIGN KEY ("queue_session_id") REFERENCES "public"."QueueSession"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;
