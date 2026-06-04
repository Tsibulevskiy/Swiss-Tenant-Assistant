CREATE TABLE `cases` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`type` enum('nebenkosten','mietvertrag','mietzinserhoehung','deposit_return','repair','general_letter') NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('draft','analyzing','ready','letter_sent','waiting_response','closed','failed') NOT NULL DEFAULT 'draft',
	`locale` varchar(10) NOT NULL DEFAULT 'de',
	`opened_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`closed_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `check_documents` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`check_id` bigint unsigned NOT NULL,
	`document_id` bigint unsigned NOT NULL,
	`role` enum('primary','contract_reference','previous_year_reference','supporting') NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `check_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `check_documents_check_document_role_unique_idx` UNIQUE(`check_id`,`document_id`,`role`)
);
--> statement-breakpoint
CREATE TABLE `checks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`case_id` bigint unsigned NOT NULL,
	`type` enum('nebenkosten_check','mietvertrag_check','rent_increase_check','deposit_return_check') NOT NULL,
	`status` enum('draft','uploaded','extracting','analyzing','payment_required','ready','failed') NOT NULL DEFAULT 'draft',
	`input_payload_json` json,
	`structured_input_json` json,
	`rule_result_json` json,
	`ai_result_json` json,
	`risk_score` enum('low','medium','high'),
	`summary_text` text,
	`disclaimer_text` text,
	`error_message` text,
	`started_at` datetime,
	`finished_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_extractions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`document_id` bigint unsigned NOT NULL,
	`engine` enum('pdf_text','ocr','manual') NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`raw_text` longtext,
	`normalized_text` longtext,
	`structured_data_json` json,
	`confidence_score` decimal(5,2),
	`error_message` text,
	`started_at` datetime,
	`finished_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `document_extractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`case_id` bigint unsigned,
	`kind` enum('mietvertrag','nebenkostenabrechnung','previous_nebenkostenabrechnung','rent_increase_letter','uebergabeprotokoll','landlord_letter','deduction_list','photo','generated_letter_pdf','generated_report_pdf','other') NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`storage_path` varchar(500) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`file_size` bigint unsigned NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`is_encrypted` boolean NOT NULL DEFAULT false,
	`encryption_key_ref` varchar(255),
	`uploaded_by` bigint unsigned NOT NULL,
	`status` enum('uploaded','processing','ready','failed','deleted') NOT NULL DEFAULT 'uploaded',
	`delete_after_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` datetime,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`revoked_at` datetime,
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(254) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`locale` varchar(10) NOT NULL DEFAULT 'de',
	`first_name` varchar(100),
	`last_name` varchar(100),
	`email_verified_at` datetime,
	`terms_accepted_at` datetime,
	`privacy_accepted_at` datetime,
	`disclaimer_accepted_at` datetime,
	`marketing_consent_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` datetime,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique_idx` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `cases` ADD CONSTRAINT `cases_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `check_documents` ADD CONSTRAINT `check_documents_check_id_checks_id_fk` FOREIGN KEY (`check_id`) REFERENCES `checks`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `check_documents` ADD CONSTRAINT `check_documents_document_id_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `checks` ADD CONSTRAINT `checks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `checks` ADD CONSTRAINT `checks_case_id_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `document_extractions` ADD CONSTRAINT `document_extractions_document_id_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_case_id_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `cases_user_status_idx` ON `cases` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `cases_type_idx` ON `cases` (`type`);--> statement-breakpoint
CREATE INDEX `cases_created_at_idx` ON `cases` (`created_at`);--> statement-breakpoint
CREATE INDEX `check_documents_document_id_idx` ON `check_documents` (`document_id`);--> statement-breakpoint
CREATE INDEX `checks_user_id_idx` ON `checks` (`user_id`);--> statement-breakpoint
CREATE INDEX `checks_case_id_idx` ON `checks` (`case_id`);--> statement-breakpoint
CREATE INDEX `checks_type_status_idx` ON `checks` (`type`,`status`);--> statement-breakpoint
CREATE INDEX `checks_created_at_idx` ON `checks` (`created_at`);--> statement-breakpoint
CREATE INDEX `document_extractions_document_id_idx` ON `document_extractions` (`document_id`);--> statement-breakpoint
CREATE INDEX `document_extractions_status_idx` ON `document_extractions` (`status`);--> statement-breakpoint
CREATE INDEX `documents_user_id_idx` ON `documents` (`user_id`);--> statement-breakpoint
CREATE INDEX `documents_case_id_idx` ON `documents` (`case_id`);--> statement-breakpoint
CREATE INDEX `documents_kind_idx` ON `documents` (`kind`);--> statement-breakpoint
CREATE INDEX `documents_status_idx` ON `documents` (`status`);--> statement-breakpoint
CREATE INDEX `documents_delete_after_at_idx` ON `documents` (`delete_after_at`);--> statement-breakpoint
CREATE INDEX `documents_sha256_idx` ON `documents` (`sha256`);--> statement-breakpoint
CREATE INDEX `user_sessions_user_id_idx` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_sessions_expires_at_idx` ON `user_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);