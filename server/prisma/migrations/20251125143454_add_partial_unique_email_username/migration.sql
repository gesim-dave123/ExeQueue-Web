/*
  Warnings:

  - A unique constraint covering the columns `[email,deleted_at]` on the table `sas_staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username,deleted_at]` on the table `sas_staff` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."sas_staff_username_key";

-- CreateIndex
CREATE UNIQUE INDEX "unique_email_active" ON "sas_staff"("email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "unique_username_active" ON "sas_staff"("username", "deleted_at");
