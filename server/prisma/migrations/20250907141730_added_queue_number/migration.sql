/*
  Warnings:

  - Added the required column `queue_number` to the `queue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."queue" ADD COLUMN     "queue_number" INTEGER NOT NULL;
