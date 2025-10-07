/*
  Warnings:

  - You are about to drop the column `school_id` on the `queue` table. All the data in the column will be lost.
  - You are about to drop the column `student_full_name` on the `queue` table. All the data in the column will be lost.
  - You are about to drop the column `year_level` on the `queue` table. All the data in the column will be lost.
  - You are about to drop the column `service_window_id` on the `sas_staff` table. All the data in the column will be lost.
  - You are about to drop the `QueueSession` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sequence_number` to the `queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `queue` table without a default value. This is not possible if the table is not empty.
  - Made the column `request_status` on table `request` required. This step will fail if there are existing NULL values in that column.
  - Made the column `transactionStatus` on table `transaction_history` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."queue" DROP CONSTRAINT "queue_queue_session_id_fkey";

-- DropIndex
DROP INDEX "public"."idx_queue_school_status";

-- DropIndex
DROP INDEX "public"."idx_request_type_created_at";

-- DropIndex
DROP INDEX "public"."idx_request_type_deleted_at";

-- AlterTable
ALTER TABLE "public"."course" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."queue" DROP COLUMN "school_id",
DROP COLUMN "student_full_name",
DROP COLUMN "year_level",
ADD COLUMN     "sequence_number" INTEGER NOT NULL,
ADD COLUMN     "student_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."request" ALTER COLUMN "request_status" SET NOT NULL,
ALTER COLUMN "request_status" SET DEFAULT 'WAITING',
ALTER COLUMN "processed_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."request_type" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."sas_staff" DROP COLUMN "service_window_id";

-- AlterTable
ALTER TABLE "public"."service_window" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "display_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."transaction_history" ALTER COLUMN "transactionStatus" SET NOT NULL,
ALTER COLUMN "transactionStatus" SET DEFAULT 'WAITING';

-- DropTable
DROP TABLE "public"."QueueSession";

-- CreateTable
CREATE TABLE "public"."student" (
    "student_id" SERIAL NOT NULL,
    "school_id" VARCHAR(20) NOT NULL,
    "student_full_name" VARCHAR(255) NOT NULL,
    "course_id" INTEGER NOT NULL,
    "year_level" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "public"."window_assignment" (
    "assignment_id" SERIAL NOT NULL,
    "sas_staff_id" UUID NOT NULL,
    "window_id" INTEGER NOT NULL,
    "session_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "window_assignment_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "public"."queue_session" (
    "session_id" SERIAL NOT NULL,
    "session_no" INTEGER NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL,
    "max_queue_number" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_session_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE INDEX "idx_student_course_id" ON "public"."student"("course_id");

-- CreateIndex
CREATE INDEX "idx_assignment_staff_active" ON "public"."window_assignment"("sas_staff_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_assignment_window_active" ON "public"."window_assignment"("window_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_assignment_session_active" ON "public"."window_assignment"("session_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_today_active_session" ON "public"."queue_session"("session_date", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "unq_sessions_same_date" ON "public"."queue_session"("session_date", "session_no");

-- RenameForeignKey
ALTER TABLE "public"."queue" RENAME CONSTRAINT "fk_queue_course" TO "queue_course_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."student" ADD CONSTRAINT "student_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."window_assignment" ADD CONSTRAINT "fk_assignment_staff" FOREIGN KEY ("sas_staff_id") REFERENCES "public"."sas_staff"("sas_staff_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."window_assignment" ADD CONSTRAINT "fk_assignment_window" FOREIGN KEY ("window_id") REFERENCES "public"."service_window"("window_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."window_assignment" ADD CONSTRAINT "fk_assignment_session_id" FOREIGN KEY ("session_id") REFERENCES "public"."queue_session"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue" ADD CONSTRAINT "fk_queue_student" FOREIGN KEY ("student_id") REFERENCES "public"."student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue" ADD CONSTRAINT "queue_queue_session_id_fkey" FOREIGN KEY ("queue_session_id") REFERENCES "public"."queue_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;
