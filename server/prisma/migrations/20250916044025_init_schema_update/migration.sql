-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('PERSONNEL', 'WORKING_SCHOLAR');

-- CreateEnum
CREATE TYPE "public"."Queue_Type" AS ENUM ('REGULAR', 'PRIORITY');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('WAITING', 'IN_SERVICE', 'DEFERRED', 'CANCELLED', 'COMPLETED', 'STALLED', 'SKIPPED');

-- CreateTable
CREATE TABLE "public"."course" (
    "course_id" SERIAL NOT NULL,
    "course_code" VARCHAR(10) NOT NULL,
    "course_name" VARCHAR(255) NOT NULL,
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
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "school_id" VARCHAR(20) NOT NULL,
    "student_full_name" VARCHAR(255) NOT NULL,
    "course_id" INTEGER NOT NULL,
    "year_level" VARCHAR(20) NOT NULL,
    "queue_number" INTEGER NOT NULL,
    "queue_status" "public"."Status" NOT NULL DEFAULT 'WAITING',
    "queue_type" "public"."Queue_Type" NOT NULL DEFAULT 'REGULAR',
    "window_id" INTEGER,
    "reference_number" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "queue_pkey" PRIMARY KEY ("queue_id")
);

-- CreateTable
CREATE TABLE "public"."request" (
    "request_id" SERIAL NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "request_type_id" INTEGER NOT NULL,
    "processed_by" UUID NOT NULL,
    "request_status" "public"."Status",
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "public"."request_type" (
    "request_type_id" SERIAL NOT NULL,
    "request_name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "request_type_pkey" PRIMARY KEY ("request_type_id")
);

-- CreateTable
CREATE TABLE "public"."transaction_history" (
    "transaction_history_id" SERIAL NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "request_id" INTEGER,
    "performed_by_id" UUID NOT NULL,
    "performed_by_role" "public"."Role" NOT NULL,
    "action" "public"."Status",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_history_pkey" PRIMARY KEY ("transaction_history_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_course_code_key" ON "public"."course"("course_code");

-- CreateIndex
CREATE INDEX "idx_course_is_active" ON "public"."course"("is_active");

-- CreateIndex
CREATE INDEX "idx_course_code_active" ON "public"."course"("course_code", "is_active");

-- CreateIndex
CREATE INDEX "idx_course_created_at" ON "public"."course"("created_at");

-- CreateIndex
CREATE INDEX "idx_course_deleted_at" ON "public"."course"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "sas_staff_username_key" ON "public"."sas_staff"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sas_staff_email_key" ON "public"."sas_staff"("email");

-- CreateIndex
CREATE INDEX "idx_sas_staff_username_active" ON "public"."sas_staff"("username", "is_active");

-- CreateIndex
CREATE INDEX "idx_sas_staff_email_active" ON "public"."sas_staff"("email", "is_active");

-- CreateIndex
CREATE INDEX "idx_sas_staff_role_active" ON "public"."sas_staff"("role", "is_active");

-- CreateIndex
CREATE INDEX "idx_sas_staff_active_created" ON "public"."sas_staff"("is_active", "created_at");

-- CreateIndex
CREATE INDEX "idx_sas_staff_created_by" ON "public"."sas_staff"("created_by");

-- CreateIndex
CREATE INDEX "idx_sas_staff_full_name" ON "public"."sas_staff"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "idx_sas_staff_updated_at" ON "public"."sas_staff"("updated_at");

-- CreateIndex
CREATE INDEX "idx_sas_staff_deleted_at" ON "public"."sas_staff"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "service_window_window_name_key" ON "public"."service_window"("window_name");

-- CreateIndex
CREATE INDEX "idx_service_window_capabilities" ON "public"."service_window"("is_active", "can_serve_priority", "can_serve_regular");

-- CreateIndex
CREATE INDEX "idx_service_window_name_active" ON "public"."service_window"("window_name", "is_active");

-- CreateIndex
CREATE INDEX "idx_service_window_is_active" ON "public"."service_window"("is_active");

-- CreateIndex
CREATE INDEX "idx_service_window_created_at" ON "public"."service_window"("created_at");

-- CreateIndex
CREATE INDEX "idx_service_window_deleted_at" ON "public"."service_window"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_queue_status_type_window" ON "public"."queue"("queue_status", "queue_type", "window_id");

-- CreateIndex
CREATE INDEX "idx_queue_status_type_created" ON "public"."queue"("queue_status", "queue_type", "created_at");

-- CreateIndex
CREATE INDEX "idx_queue_status_active" ON "public"."queue"("queue_status", "is_active");

-- CreateIndex
CREATE INDEX "idx_queue_school_status" ON "public"."queue"("school_id", "queue_status");

-- CreateIndex
CREATE INDEX "idx_queue_course_status_type" ON "public"."queue"("course_id", "queue_status", "queue_type");

-- CreateIndex
CREATE INDEX "idx_queue_window_status" ON "public"."queue"("window_id", "queue_status");

-- CreateIndex
CREATE INDEX "idx_queue_number_created" ON "public"."queue"("queue_number", "created_at");

-- CreateIndex
CREATE INDEX "idx_queue_reference_number" ON "public"."queue"("reference_number");

-- CreateIndex
CREATE INDEX "idx_queue_created_at" ON "public"."queue"("created_at");

-- CreateIndex
CREATE INDEX "idx_queue_updated_at" ON "public"."queue"("updated_at");

-- CreateIndex
CREATE INDEX "idx_queue_active_created" ON "public"."queue"("is_active", "created_at");

-- CreateIndex
CREATE INDEX "idx_queue_year_course" ON "public"."queue"("year_level", "course_id");

-- CreateIndex
CREATE INDEX "idx_queue_student_name" ON "public"."queue"("student_full_name");

-- CreateIndex
CREATE INDEX "idx_queue_deleted_at" ON "public"."queue"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_request_queue_id" ON "public"."request"("queue_id");

-- CreateIndex
CREATE INDEX "idx_request_status_active" ON "public"."request"("request_status", "is_active");

-- CreateIndex
CREATE INDEX "idx_request_processor_time" ON "public"."request"("processed_by", "processed_at");

-- CreateIndex
CREATE INDEX "idx_request_type_status" ON "public"."request"("request_type_id", "request_status");

-- CreateIndex
CREATE INDEX "idx_request_queue_status" ON "public"."request"("queue_id", "request_status");

-- CreateIndex
CREATE INDEX "idx_request_processed_at" ON "public"."request"("processed_at");

-- CreateIndex
CREATE INDEX "idx_request_created_at" ON "public"."request"("created_at");

-- CreateIndex
CREATE INDEX "idx_request_active_created" ON "public"."request"("is_active", "created_at");

-- CreateIndex
CREATE INDEX "idx_request_updated_at" ON "public"."request"("updated_at");

-- CreateIndex
CREATE INDEX "idx_request_deleted_at" ON "public"."request"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_request_type_name" ON "public"."request_type"("request_name");

-- CreateIndex
CREATE INDEX "idx_request_type_created_at" ON "public"."request_type"("created_at");

-- CreateIndex
CREATE INDEX "idx_request_type_deleted_at" ON "public"."request_type"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_transaction_queue_id" ON "public"."transaction_history"("queue_id");

-- CreateIndex
CREATE INDEX "idx_transaction_performer_time" ON "public"."transaction_history"("performed_by_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_transaction_action_time" ON "public"."transaction_history"("action", "created_at");

-- CreateIndex
CREATE INDEX "idx_transaction_queue_chronology" ON "public"."transaction_history"("queue_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_transaction_request_id" ON "public"."transaction_history"("request_id");

-- CreateIndex
CREATE INDEX "idx_transaction_role_action" ON "public"."transaction_history"("performed_by_role", "action");

-- CreateIndex
CREATE INDEX "idx_transaction_created_at" ON "public"."transaction_history"("created_at");

-- CreateIndex
CREATE INDEX "idx_transaction_queue_action_time" ON "public"."transaction_history"("queue_id", "action", "created_at");

-- AddForeignKey
ALTER TABLE "public"."sas_staff" ADD CONSTRAINT "fk_sas_staff_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."sas_staff"("sas_staff_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue" ADD CONSTRAINT "fk_queue_course" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue" ADD CONSTRAINT "fk_queue_service_window" FOREIGN KEY ("window_id") REFERENCES "public"."service_window"("window_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request" ADD CONSTRAINT "fk_request_queue" FOREIGN KEY ("queue_id") REFERENCES "public"."queue"("queue_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request" ADD CONSTRAINT "fk_request_type" FOREIGN KEY ("request_type_id") REFERENCES "public"."request_type"("request_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request" ADD CONSTRAINT "fk_request_processor" FOREIGN KEY ("processed_by") REFERENCES "public"."sas_staff"("sas_staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction_history" ADD CONSTRAINT "fk_transaction_queue" FOREIGN KEY ("queue_id") REFERENCES "public"."queue"("queue_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction_history" ADD CONSTRAINT "fk_transaction_request" FOREIGN KEY ("request_id") REFERENCES "public"."request"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction_history" ADD CONSTRAINT "fk_transaction_performer" FOREIGN KEY ("performed_by_id") REFERENCES "public"."sas_staff"("sas_staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;
