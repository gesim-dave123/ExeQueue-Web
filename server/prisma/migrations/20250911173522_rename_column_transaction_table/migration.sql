/*
  Warnings:

  - The primary key for the `transaction_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `transaction_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."transaction_history" DROP CONSTRAINT "transaction_history_pkey",
DROP COLUMN "id",
ADD COLUMN     "servicing_log_id" SERIAL NOT NULL,
ADD CONSTRAINT "transaction_history_pkey" PRIMARY KEY ("servicing_log_id");
