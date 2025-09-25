/*
  Warnings:

  - You are about to drop the column `window_id` on the `sas_staff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."sas_staff" DROP COLUMN "window_id",
ADD COLUMN     "service_window_id" INTEGER;


CREATE SEQUENCE queue_regular_seq;
CREATE SEQUENCE queue_priority_seq;