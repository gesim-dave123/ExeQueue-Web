-- AlterTable
ALTER TABLE "public"."queue_session" ADD COLUMN     "priority_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "regular_count" INTEGER NOT NULL DEFAULT 0;
