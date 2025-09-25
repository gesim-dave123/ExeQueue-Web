-- DropIndex
DROP INDEX "public"."idx_service_window_name_active";

-- DropIndex
DROP INDEX "public"."service_window_window_name_key";

-- AlterTable
ALTER TABLE "public"."service_window" ADD COLUMN     "display_name" VARCHAR(20),
ADD COLUMN     "window_no" INTEGER,
ALTER COLUMN "window_name" DROP NOT NULL,
ALTER COLUMN "window_name" SET DATA TYPE VARCHAR(50);

-- CreateIndex
CREATE INDEX "idx_service_window_no_active" ON "public"."service_window"("window_no", "is_active");
