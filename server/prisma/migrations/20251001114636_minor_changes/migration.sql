/*
  Warnings:

  - You are about to drop the column `queue_date` on the `queue` table. All the data in the column will be lost.
  - You are about to drop the column `queue_session_id` on the `queue` table. All the data in the column will be lost.
  - You are about to alter the column `reference_number` on the `queue` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(50)`.
  - You are about to drop the column `max_queue_number` on the `queue_session` table. All the data in the column will be lost.
  - You are about to drop the column `session_no` on the `queue_session` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `window_assignment` table. All the data in the column will be lost.
  - You are about to drop the column `unassigned_at` on the `window_assignment` table. All the data in the column will be lost.
  - You are about to drop the `student` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sequence_number]` on the table `queue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference_number]` on the table `queue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_date,session_number]` on the table `queue_session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `course_code` to the `queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_name` to the `queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_id` to the `queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_full_name` to the `queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year_level` to the `queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_number` to the `queue_session` table without a default value. This is not possible if the table is not empty.
  - Made the column `role` on table `sas_staff` required. This step will fail if there are existing NULL values in that column.
  - Made the column `window_name` on table `service_window` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."queue" DROP CONSTRAINT "fk_queue_student";

-- DropForeignKey
ALTER TABLE "public"."queue" DROP CONSTRAINT "queue_queue_session_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."student" DROP CONSTRAINT "student_course_id_fkey";

-- DropIndex
DROP INDEX "public"."idx_queue_active_created";

-- DropIndex
DROP INDEX "public"."idx_queue_status_active";

-- DropIndex
DROP INDEX "public"."idx_queue_status_type_window";

-- DropIndex
DROP INDEX "public"."idx_queue_window_status";

-- DropIndex
DROP INDEX "public"."unq_queue_number_created";

-- DropIndex
DROP INDEX "public"."idx_today_active_session";

-- DropIndex
DROP INDEX "public"."unq_sessions_same_date";

-- DropIndex
DROP INDEX "public"."idx_sas_staff_active_created";

-- DropIndex
DROP INDEX "public"."idx_sas_staff_created_by";

-- DropIndex
DROP INDEX "public"."idx_assignment_session_active";

-- DropIndex
DROP INDEX "public"."idx_assignment_staff_active";

-- DropIndex
DROP INDEX "public"."idx_assignment_window_active";

-- AlterTable
ALTER TABLE "public"."course" ALTER COLUMN "course_code" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."queue" DROP COLUMN "queue_date",
DROP COLUMN "queue_session_id",
ADD COLUMN     "called_at" TIMESTAMP(3),
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "course_code" VARCHAR(15) NOT NULL,
ADD COLUMN     "course_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "reset_iteration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "served_by_staff" UUID,
ADD COLUMN     "session_id" INTEGER NOT NULL,
ADD COLUMN     "student_full_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "year_level" VARCHAR(20) NOT NULL,
ALTER COLUMN "reference_number" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "student_id" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "public"."queue_session" DROP COLUMN "max_queue_number",
DROP COLUMN "session_no",
ADD COLUMN     "current_queue_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_accepting_new" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_serving" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_queue_no" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "session_number" INTEGER NOT NULL,
ALTER COLUMN "session_date" SET DATA TYPE DATE,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."request" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."request_type" ALTER COLUMN "request_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."sas_staff" ALTER COLUMN "role" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'WORKING_SCHOLAR',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."service_window" ALTER COLUMN "window_name" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."window_assignment" DROP COLUMN "is_active",
DROP COLUMN "unassigned_at",
ADD COLUMN     "released_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."student";

-- CreateIndex
CREATE UNIQUE INDEX "queue_sequence_number_key" ON "public"."queue"("sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "queue_reference_number_key" ON "public"."queue"("reference_number");

-- CreateIndex
CREATE INDEX "idx_queue_school_id" ON "public"."queue"("student_id");

-- CreateIndex
CREATE INDEX "idx_queue_status_type_session" ON "public"."queue"("queue_status", "queue_type", "session_id");

-- CreateIndex
CREATE INDEX "idx_queue_session_number" ON "public"."queue"("session_id", "queue_number");

-- CreateIndex
CREATE INDEX "idx_session_accepting" ON "public"."queue_session"("session_date", "is_accepting_new");

-- CreateIndex
CREATE INDEX "idx_session_serving" ON "public"."queue_session"("session_date", "is_serving");

-- CreateIndex
CREATE UNIQUE INDEX "unq_session_date_number" ON "public"."queue_session"("session_date", "session_number");

-- CreateIndex
CREATE INDEX "idx_assignment_staff_released" ON "public"."window_assignment"("sas_staff_id", "released_at");

-- CreateIndex
CREATE INDEX "idx_assignment_window_released" ON "public"."window_assignment"("window_id", "released_at");

-- CreateIndex
CREATE INDEX "idx_assignment_session" ON "public"."window_assignment"("session_id");

-- RenameForeignKey
ALTER TABLE "public"."queue" RENAME CONSTRAINT "fk_queue_service_window" TO "queue_window_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."sas_staff" RENAME CONSTRAINT "fk_sas_staff_created_by" TO "sas_staff_created_by_fkey";

-- RenameForeignKey
ALTER TABLE "public"."window_assignment" RENAME CONSTRAINT "fk_assignment_session_id" TO "window_assignment_session_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."window_assignment" RENAME CONSTRAINT "fk_assignment_staff" TO "window_assignment_sas_staff_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."window_assignment" RENAME CONSTRAINT "fk_assignment_window" TO "window_assignment_window_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."queue" ADD CONSTRAINT "queue_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."queue_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."idx_queue_reference_number" RENAME TO "idx_queue_reference";
