CREATE TABLE `brokers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`creci` varchar(50),
	`commission` decimal(5,2) DEFAULT '0.00',
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brokers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `brokers` ADD CONSTRAINT `brokers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;