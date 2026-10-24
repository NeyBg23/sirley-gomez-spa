CREATE TABLE `admins` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`customer` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`service_id` text NOT NULL,
	`service_name` text NOT NULL,
	`price` real NOT NULL,
	`date` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`locale` text NOT NULL,
	`created_at` text NOT NULL,
	`requester_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_reference_unique` ON `appointments` (`reference`);--> statement-breakpoint
CREATE INDEX `appointment_schedule` ON `appointments` (`date`,`status`);--> statement-breakpoint
CREATE INDEX `appointment_rate` ON `appointments` (`requester_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `gift_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`package_id` text NOT NULL,
	`package_name` text NOT NULL,
	`price` real NOT NULL,
	`recipient` text NOT NULL,
	`giver` text NOT NULL,
	`phone` text NOT NULL,
	`message` text NOT NULL,
	`occasion` text NOT NULL,
	`locale` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`code` text,
	`token` text,
	`created_at` text NOT NULL,
	`issued_at` text,
	`redeemed_at` text,
	`requester_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_orders_reference_unique` ON `gift_orders` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `gift_orders_token_unique` ON `gift_orders` (`token`);--> statement-breakpoint
CREATE INDEX `gift_rate` ON `gift_orders` (`requester_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `site_content` (
	`key` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
