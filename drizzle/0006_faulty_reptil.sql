CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('lead_moved','task_due','new_interaction','lead_created','cadence_started') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedLeadId` int,
	`relatedTaskId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_relatedLeadId_leads_id_fk` FOREIGN KEY (`relatedLeadId`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_relatedTaskId_tasks_id_fk` FOREIGN KEY (`relatedTaskId`) REFERENCES `tasks`(`id`) ON DELETE no action ON UPDATE no action;