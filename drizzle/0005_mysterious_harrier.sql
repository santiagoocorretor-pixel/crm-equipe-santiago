ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'local';--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);