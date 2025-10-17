-- DropIndex
DROP INDEX "public"."queue_session_session_date_is_active_key";

-- RenameIndex
ALTER INDEX "public"."unq_session_date_number" RENAME TO "queue_session_session_date_session_number_key";
