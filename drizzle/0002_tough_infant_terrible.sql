CREATE TABLE `booking_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event` text NOT NULL,
	`headcount` integer NOT NULL,
	`preferred_building` text,
	`venue_id` integer,
	`status` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`building` text NOT NULL,
	`capacity` integer NOT NULL,
	`owning_team` text NOT NULL,
	`contact_email` text NOT NULL
);
