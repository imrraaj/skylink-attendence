CREATE TABLE "options" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "firstName" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastName" text NOT NULL;