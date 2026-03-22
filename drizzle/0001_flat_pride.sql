CREATE TABLE "registration_document" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"r2Key" text NOT NULL,
	"originalFilename" text NOT NULL,
	"mimeType" text NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "registration_document_userId_type_unique" UNIQUE("userId","type")
);
--> statement-breakpoint
ALTER TABLE "registration_document" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "attendance_session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"checkInAt" timestamp NOT NULL,
	"checkOutAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_username_unique";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'student';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banReason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banExpires" timestamp;--> statement-breakpoint
ALTER TABLE "registration_document" ADD CONSTRAINT "registration_document_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_session" ADD CONSTRAINT "attendance_session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_user_checkin_idx" ON "attendance_session" USING btree ("userId","checkInAt");--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "display_username";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "gender";