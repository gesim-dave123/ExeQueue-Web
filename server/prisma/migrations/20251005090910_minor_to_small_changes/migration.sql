/*
  Warnings:

  - You are about to drop the `window_assignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ShiftTag" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- DropForeignKey
ALTER TABLE "public"."window_assignment" DROP CONSTRAINT "window_assignment_sas_staff_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."window_assignment" DROP CONSTRAINT "window_assignment_session_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."window_assignment" DROP CONSTRAINT "window_assignment_window_id_fkey";

-- AlterTable
ALTER TABLE "public"."sas_staff" ALTER COLUMN "first_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "last_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "middle_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(150);

-- DropTable
DROP TABLE "public"."window_assignment";

-- CreateTable
CREATE TABLE "public"."WindowAssignment" (
    "assignmentId" SERIAL NOT NULL,
    "sasStaffId" UUID NOT NULL,
    "windowId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "lastHeartbeat" TIMESTAMP(3),
    "shiftTag" "public"."ShiftTag" NOT NULL DEFAULT 'MORNING',

    CONSTRAINT "WindowAssignment_pkey" PRIMARY KEY ("assignmentId")
);

-- CreateIndex
CREATE INDEX "idx_window_released" ON "public"."WindowAssignment"("windowId", "releasedAt");

-- CreateIndex
CREATE INDEX "idx_staff_released" ON "public"."WindowAssignment"("sasStaffId", "releasedAt");

-- CreateIndex
CREATE INDEX "idx_shift_released" ON "public"."WindowAssignment"("shiftTag", "releasedAt");

-- AddForeignKey
ALTER TABLE "public"."WindowAssignment" ADD CONSTRAINT "WindowAssignment_sasStaffId_fkey" FOREIGN KEY ("sasStaffId") REFERENCES "public"."sas_staff"("sas_staff_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WindowAssignment" ADD CONSTRAINT "WindowAssignment_windowId_fkey" FOREIGN KEY ("windowId") REFERENCES "public"."service_window"("window_id") ON DELETE CASCADE ON UPDATE CASCADE;
