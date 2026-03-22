ALTER TABLE "user" ALTER COLUMN "banned" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;