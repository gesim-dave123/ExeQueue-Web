/*
  Warnings:

  - A unique constraint covering the columns `[window_no]` on the table `service_window` will be added. If there are existing duplicate values, this will fail.
  - Made the column `display_name` on table `service_window` required. This step will fail if there are existing NULL values in that column.
  - Made the column `window_no` on table `service_window` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."service_window" ALTER COLUMN "display_name" SET NOT NULL,
ALTER COLUMN "window_no" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "service_window_window_no_key" ON "public"."service_window"("window_no");
