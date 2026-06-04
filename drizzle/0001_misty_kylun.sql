CREATE TABLE `ai_runs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`case_id` bigint unsigned,
	`check_id` bigint unsigned,
	`purpose` enum('summary','recommendation','letter_generation','chat','explanation') NOT NULL,
	`model` varchar(100) NOT NULL,
	`prompt_version` varchar(100) NOT NULL,
	`input_json` json,
	`output_json` json,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`token_input` int unsigned,
	`token_output` int unsigned,
	`error_message` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`finished_at` datetime,
	CONSTRAINT `ai_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`actor_type` enum('user','admin','system') NOT NULL,
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` bigint unsigned,
	`ip_address` varchar(64),
	`user_agent` varchar(500),
	`metadata_json` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`case_id` bigint unsigned,
	`template_code` varchar(100) NOT NULL,
	`recipient_email` varchar(254) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`payload_json` json,
	`provider` enum('brevo') NOT NULL,
	`provider_message_id` varchar(255),
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`error_message` text,
	`sent_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `email_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `letters` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`case_id` bigint unsigned,
	`check_id` bigint unsigned,
	`type` enum('belege_request','nebenkosten_objection','repair_request','termination','deposit_return_request','rent_increase_objection','custom') NOT NULL,
	`locale` varchar(10) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body_text` longtext NOT NULL,
	`body_html` longtext,
	`pdf_document_id` bigint unsigned,
	`email_document_id` bigint unsigned,
	`status` enum('draft','generated','downloaded','sent') NOT NULL DEFAULT 'generated',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`case_id` bigint unsigned,
	`check_id` bigint unsigned,
	`product_id` bigint unsigned NOT NULL,
	`provider` enum('stripe') NOT NULL,
	`provider_session_id` varchar(255),
	`provider_payment_intent_id` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` char(3) NOT NULL DEFAULT 'CHF',
	`status` enum('pending','checkout_created','paid','failed','refunded','expired') NOT NULL DEFAULT 'pending',
	`paid_at` datetime,
	`raw_webhook_json` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_provider_session_unique_idx` UNIQUE(`provider_session_id`),
	CONSTRAINT `payments_provider_payment_intent_unique_idx` UNIQUE(`provider_payment_intent_id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('check','letter','subscription','credits') NOT NULL,
	`price_chf` decimal(10,2) NOT NULL,
	`currency` char(3) NOT NULL DEFAULT 'CHF',
	`is_active` boolean NOT NULL DEFAULT true,
	`metadata_json` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`case_id` bigint unsigned NOT NULL,
	`check_id` bigint unsigned NOT NULL,
	`document_id` bigint unsigned NOT NULL,
	`type` enum('analysis_report') NOT NULL,
	`version` int unsigned NOT NULL DEFAULT 1,
	`status` enum('generating','ready','failed') NOT NULL DEFAULT 'generating',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rule_findings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`check_id` bigint unsigned NOT NULL,
	`rule_code` varchar(100) NOT NULL,
	`severity` enum('info','warning','high') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`matched_value` varchar(255),
	`metadata_json` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `rule_findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signed_links` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`document_id` bigint unsigned NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_by_user_id` bigint unsigned,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `signed_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `signed_links_token_hash_unique_idx` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `system_errors` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`scope` enum('upload','extraction','ocr','ai','payment','email','report','security') NOT NULL,
	`related_entity_type` varchar(100),
	`related_entity_id` bigint unsigned,
	`message` text NOT NULL,
	`stack_trace` longtext,
	`status` enum('open','resolved','ignored') NOT NULL DEFAULT 'open',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`resolved_at` datetime,
	CONSTRAINT `system_errors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_runs` ADD CONSTRAINT `ai_runs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_runs` ADD CONSTRAINT `ai_runs_case_id_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_runs` ADD CONSTRAINT `ai_runs_check_id_checks_id_fk` FOREIGN KEY (`check_id`) REFERENCES `checks`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_case_id_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_case_id_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_check_id_checks_id_fk` FOREIGN KEY (`check_id`) REFERENCES `checks`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_pdf_document_id_documents_id_fk` FOREIGN KEY (`pdf_document_id`) REFERENCES `documents`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_email_document_id_documents_id_fk` FOREIGN KEY (`email_document_id`) REFERENCES `documents`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_case_id_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_check_id_checks_id_fk` FOREIGN KEY (`check_id`) REFERENCES `checks`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_case_id_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_check_id_checks_id_fk` FOREIGN KEY (`check_id`) REFERENCES `checks`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_document_id_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rule_findings` ADD CONSTRAINT `rule_findings_check_id_checks_id_fk` FOREIGN KEY (`check_id`) REFERENCES `checks`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `signed_links` ADD CONSTRAINT `signed_links_document_id_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `signed_links` ADD CONSTRAINT `signed_links_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `ai_runs_check_id_idx` ON `ai_runs` (`check_id`);--> statement-breakpoint
CREATE INDEX `ai_runs_purpose_idx` ON `ai_runs` (`purpose`);--> statement-breakpoint
CREATE INDEX `ai_runs_status_idx` ON `ai_runs` (`status`);--> statement-breakpoint
CREATE INDEX `ai_runs_created_at_idx` ON `ai_runs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `email_messages_user_id_idx` ON `email_messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_messages_template_code_idx` ON `email_messages` (`template_code`);--> statement-breakpoint
CREATE INDEX `email_messages_status_idx` ON `email_messages` (`status`);--> statement-breakpoint
CREATE INDEX `letters_user_id_idx` ON `letters` (`user_id`);--> statement-breakpoint
CREATE INDEX `letters_case_id_idx` ON `letters` (`case_id`);--> statement-breakpoint
CREATE INDEX `letters_check_id_idx` ON `letters` (`check_id`);--> statement-breakpoint
CREATE INDEX `letters_type_idx` ON `letters` (`type`);--> statement-breakpoint
CREATE INDEX `payments_user_id_idx` ON `payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `payments_check_id_idx` ON `payments` (`check_id`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `reports_check_id_idx` ON `reports` (`check_id`);--> statement-breakpoint
CREATE INDEX `reports_case_id_idx` ON `reports` (`case_id`);--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `rule_findings_check_id_idx` ON `rule_findings` (`check_id`);--> statement-breakpoint
CREATE INDEX `rule_findings_rule_code_idx` ON `rule_findings` (`rule_code`);--> statement-breakpoint
CREATE INDEX `rule_findings_severity_idx` ON `rule_findings` (`severity`);--> statement-breakpoint
CREATE INDEX `signed_links_document_id_idx` ON `signed_links` (`document_id`);--> statement-breakpoint
CREATE INDEX `signed_links_expires_at_idx` ON `signed_links` (`expires_at`);--> statement-breakpoint
CREATE INDEX `system_errors_scope_idx` ON `system_errors` (`scope`);--> statement-breakpoint
CREATE INDEX `system_errors_related_entity_idx` ON `system_errors` (`related_entity_type`,`related_entity_id`);--> statement-breakpoint
CREATE INDEX `system_errors_status_idx` ON `system_errors` (`status`);