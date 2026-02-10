ALTER TABLE `tasks` ADD `hasAlert` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `alertSent` boolean DEFAULT false NOT NULL;