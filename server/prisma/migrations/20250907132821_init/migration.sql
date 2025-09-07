-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('PERSONNEL', 'WORKING_SCHOLAR');

-- CreateEnum
CREATE TYPE "public"."Queue_Type" AS ENUM ('REGULAR', 'PRIORITY');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('WAITING', 'IN_SERVICE', 'DEFERRED', 'CANCELLED', 'COMPLETED', 'STALLED', 'SKIPPED');

-- CreateTable
CREATE TABLE "public"."student" (
    "stud_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" VARCHAR(20) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "course_id" INTEGER NOT NULL,
    "year" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_pkey" PRIMARY KEY ("stud_id")
);

-- CreateTable
CREATE TABLE "public"."course" (
    "course_id" SERIAL NOT NULL,
    "course_code" VARCHAR(10) NOT NULL,
    "course_name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "course_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "public"."sas_staff" (
    "sas_staff_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(30) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "middle_name" VARCHAR(50),
    "email" VARCHAR(100) NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'WORKING_SCHOLAR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sas_staff_pkey" PRIMARY KEY ("sas_staff_id")
);

-- CreateTable
CREATE TABLE "public"."service_window" (
    "window_id" SERIAL NOT NULL,
    "window_name" VARCHAR(30) NOT NULL,
    "can_serve_priority" BOOLEAN NOT NULL DEFAULT true,
    "can_serve_regular" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_window_pkey" PRIMARY KEY ("window_id")
);

-- CreateTable
CREATE TABLE "public"."queue" (
    "queue_id" SERIAL NOT NULL,
    "stud_id" UUID NOT NULL,
    "school_id" VARCHAR(20) NOT NULL,
    "queue_status" "public"."Status" NOT NULL DEFAULT 'WAITING',
    "queue_type" "public"."Queue_Type" NOT NULL DEFAULT 'REGULAR',
    "served_by_window" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "queue_pkey" PRIMARY KEY ("queue_id")
);

-- CreateTable
CREATE TABLE "public"."request" (
    "request_id" SERIAL NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "request_type_id" INTEGER NOT NULL,
    "processed_by" UUID NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "public"."request_type" (
    "request_type_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "request_type_pkey" PRIMARY KEY ("request_type_id")
);

-- CreateTable
CREATE TABLE "public"."transaction_history" (
    "id" SERIAL NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "request_id" INTEGER,
    "stud_id" UUID NOT NULL,
    "school_id" VARCHAR(20) NOT NULL,
    "performed_by_id" UUID NOT NULL,
    "performed_by_role" "public"."Role" NOT NULL,
    "action" "public"."Status" NOT NULL DEFAULT 'WAITING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."serving_log" (
    "service_log_id" SERIAL NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "serviced_by" UUID NOT NULL,
    "window_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "serving_log_pkey" PRIMARY KEY ("service_log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_school_id_key" ON "public"."student"("school_id");

-- CreateIndex
CREATE INDEX "student_school_id_idx" ON "public"."student"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_course_code_key" ON "public"."course"("course_code");

-- CreateIndex
CREATE UNIQUE INDEX "sas_staff_username_key" ON "public"."sas_staff"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sas_staff_email_key" ON "public"."sas_staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "service_window_window_name_key" ON "public"."service_window"("window_name");

-- CreateIndex
CREATE INDEX "queue_queue_status_queue_type_served_by_window_idx" ON "public"."queue"("queue_status", "queue_type", "served_by_window");

-- CreateIndex
CREATE UNIQUE INDEX "queue_stud_id_served_by_window_queue_status_key" ON "public"."queue"("stud_id", "served_by_window", "queue_status");

-- CreateIndex
CREATE INDEX "request_queue_id_idx" ON "public"."request"("queue_id");

-- CreateIndex
CREATE UNIQUE INDEX "request_type_name_key" ON "public"."request_type"("name");

-- CreateIndex
CREATE INDEX "transaction_history_stud_id_idx" ON "public"."transaction_history"("stud_id");

-- CreateIndex
CREATE INDEX "transaction_history_queue_id_idx" ON "public"."transaction_history"("queue_id");

-- CreateIndex
CREATE INDEX "serving_log_queue_id_idx" ON "public"."serving_log"("queue_id");

-- CreateIndex
CREATE INDEX "serving_log_serviced_by_idx" ON "public"."serving_log"("serviced_by");

-- CreateIndex
CREATE INDEX "serving_log_window_id_idx" ON "public"."serving_log"("window_id");

-- AddForeignKey
ALTER TABLE "public"."student" ADD CONSTRAINT "student_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sas_staff" ADD CONSTRAINT "sas_staff_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sas_staff"("sas_staff_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue" ADD CONSTRAINT "queue_stud_id_fkey" FOREIGN KEY ("stud_id") REFERENCES "public"."student"("stud_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue" ADD CONSTRAINT "queue_served_by_window_fkey" FOREIGN KEY ("served_by_window") REFERENCES "public"."service_window"("window_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request" ADD CONSTRAINT "request_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "public"."queue"("queue_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request" ADD CONSTRAINT "request_request_type_id_fkey" FOREIGN KEY ("request_type_id") REFERENCES "public"."request_type"("request_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request" ADD CONSTRAINT "request_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."sas_staff"("sas_staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction_history" ADD CONSTRAINT "transaction_history_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."request"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction_history" ADD CONSTRAINT "transaction_history_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "public"."queue"("queue_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction_history" ADD CONSTRAINT "transaction_history_stud_id_fkey" FOREIGN KEY ("stud_id") REFERENCES "public"."student"("stud_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction_history" ADD CONSTRAINT "transaction_history_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "public"."sas_staff"("sas_staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."serving_log" ADD CONSTRAINT "serving_log_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "public"."queue"("queue_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."serving_log" ADD CONSTRAINT "serving_log_serviced_by_fkey" FOREIGN KEY ("serviced_by") REFERENCES "public"."sas_staff"("sas_staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."serving_log" ADD CONSTRAINT "serving_log_window_id_fkey" FOREIGN KEY ("window_id") REFERENCES "public"."service_window"("window_id") ON DELETE RESTRICT ON UPDATE CASCADE;
