CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"hourly_rate_cents" integer NOT NULL,
	"active" boolean DEFAULT true,
	"source" text NOT NULL,
	CONSTRAINT "employees_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"employee_external_id" text NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"break_minutes" integer DEFAULT 0,
	"work_minutes" integer NOT NULL,
	"earnings_cents" integer NOT NULL,
	"source" text NOT NULL,
	CONSTRAINT "shifts_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"finished_at" timestamp,
	"status" text,
	"source" text NOT NULL,
	"records_read" integer DEFAULT 0,
	"records_inserted" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"records_errored" integer DEFAULT 0,
	"errors" jsonb
);
--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_external_id_employees_external_id_fk" FOREIGN KEY ("employee_external_id") REFERENCES "public"."employees"("external_id") ON DELETE no action ON UPDATE no action;