/*
  Warnings:

  - You are about to drop the column `course_id` on the `queue` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."queue" DROP CONSTRAINT "queue_course_id_fkey";

-- AlterTable
ALTER TABLE "public"."queue" DROP COLUMN "course_id";
