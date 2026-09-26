ALTER TABLE `venues` ADD `contact_method` text DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE `venues` ADD `contact` text DEFAULT '' NOT NULL;