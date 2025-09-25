/*
  Warnings:

  - Made the column `reference_number` on table `queue` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."queue" ALTER COLUMN "reference_number" SET NOT NULL;
