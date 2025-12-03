
ALTER TABLE "sas_staff" DROP CONSTRAINT IF EXISTS "sas_staff_email_key";
DROP INDEX IF EXISTS sas_staff_email_key;
CREATE UNIQUE INDEX "unique_active_email" ON "sas_staff"("email") WHERE "deleted_at" IS NULL;